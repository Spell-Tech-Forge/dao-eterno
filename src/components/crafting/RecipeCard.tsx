import { useState } from 'react'
import type { RecipeDefinition, ItemDefinition } from '../../types'
import { RARITY_COLORS } from '../../types'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { skillLevelToTier, craftFailChance, craftQualityBonus, craftLuckExtraRoll, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'
import { usePlayerStore } from '../../store/playerStore'

const SKILL_ID: Record<string, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLES: Record<string, Record<number, string>> = {
  forja: FORGING_TITLES,
  alquimia: ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
}

function shortStat(itemId: string, itemDefs: Record<string, ItemDefinition>): string {
  const s = itemDefs[itemId]?.stats
  if (!s) return ''
  return [
    s.atk   && `ATK +${s.atk}`,
    s.speed && `${s.speed}s`,
    s.crit  && `Crit ${s.crit}%`,
    s.def   && `DEF +${s.def}`,
    s.hp    && `HP +${s.hp}`,
    s.qi    && `Qi +${s.qi}`,
    s.slots && `${s.slots} slots`,
  ].filter(Boolean).join(' · ')
}

interface Props { recipe: RecipeDefinition }

export function RecipeCard({ recipe }: Props) {
  const [qty, setQty]             = useState(1)
  const [feedback, setFeedback]   = useState<{ ok: number; fail: number; bonus: number } | null>(null)

  const itemDefs    = useGameDataStore((s) => s.items)

  const items       = useInventoryStore((s) => s.items)
  const addItem     = useInventoryStore((s) => s.addItem)
  const removeItem  = useInventoryStore((s) => s.removeItem)
  const skills      = useSkillsStore((s) => s.skills)
  const gainSkillXp = useSkillsStore((s) => s.gainSkillXp)
  const luck        = usePlayerStore((s) => s.luck)

  const skillId    = SKILL_ID[recipe.category] ?? 'forging'
  const skill      = skills.find((s) => s.id === skillId)
  const playerTier = skillLevelToTier(skill?.level ?? 1)
  const failPct    = craftFailChance(playerTier, recipe.requiredTier, luck)
  const qualBonus  = craftQualityBonus(playerTier, recipe.requiredTier, luck)

  const outputDef = itemDefs[recipe.outputItemId]
  const color     = RARITY_COLORS[outputDef?.rarity ?? 'common']

  // Compute per-ingredient availability and max craftable quantity
  const ings = recipe.ingredients.map((req) => {
    const owned = items.find((i) => i.definitionId === req.itemId)
    const have  = owned?.quantity ?? 0
    return { ...req, have, def: itemDefs[req.itemId] }
  })

  const maxQty  = ings.length === 0 ? 1 : Math.max(1, Math.min(...ings.map(s => Math.floor(s.have / s.quantity))))
  const hasAll  = ings.every(s => s.have >= s.quantity * qty)
  const canCraft = hasAll

  function clampQty(v: number) { setQty(Math.max(1, Math.min(maxQty, v))) }

  function handleCraft() {
    if (!canCraft) return

    let ok = 0, fail = 0, totalBonus = 0

    for (let i = 0; i < qty; i++) {
      // Consume ingredients for this craft
      ings.forEach((s) => {
        const item = items.find((it) => it.definitionId === s.itemId)
        if (item) removeItem(item.instanceId, s.quantity)
      })

      // Roll fail
      if (failPct > 0 && Math.random() * 100 < failPct) {
        fail++
        gainSkillXp(skillId, 10)
        continue
      }

      const luckExtra = craftLuckExtraRoll(luck) ? 1 : 0
      const bonusQty  = qualBonus + luckExtra
      addItem(recipe.outputItemId, recipe.outputQuantity + bonusQty)
      gainSkillXp(skillId, 25)
      ok++
      totalBonus += bonusQty
    }

    setFeedback({ ok, fail, bonus: totalBonus })
    setTimeout(() => setFeedback(null), 2500)
  }

  const tierTitle   = TIER_TITLES[recipe.category]?.[recipe.requiredTier] ?? `Tier ${recipe.requiredTier}`
  const isAboveTier = playerTier < recipe.requiredTier

  return (
    <div className="rounded-xl bg-surface border flex flex-col overflow-hidden"
      style={{ borderColor: isAboveTier ? '#ef444444' : '#2a2a4e' }}>

      {/* Tier badge */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] text-muted">{tierTitle}</span>
        {isAboveTier && (
          <span className="text-[10px] text-danger font-bold">{failPct}% falha</span>
        )}
        {!isAboveTier && qualBonus > 0 && (
          <span className="text-[10px] text-jade font-bold">+{qualBonus} bônus</span>
        )}
      </div>

      {/* Item */}
      <div className="flex items-start gap-3 px-3 pb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: color + '22' }}>
          {outputDef?.emoji ?? '❓'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-text text-sm leading-tight">
            {outputDef?.name ?? recipe.outputItemId}
            {recipe.outputQuantity > 1 && (
              <span className="text-muted font-normal ml-1 text-xs">×{recipe.outputQuantity}</span>
            )}
          </div>
          <div className="text-xs text-muted mt-0.5 leading-snug">{shortStat(recipe.outputItemId, itemDefs)}</div>
        </div>
      </div>

      {/* Ingredients — show required × qty */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {ings.map((s) => {
          const need = s.quantity * qty
          const ok   = s.have >= need
          return (
            <span key={s.itemId}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: ok ? '#22c55e18' : '#ef444418',
                color: ok ? '#22c55e' : '#ef4444',
                border: `1px solid ${ok ? '#22c55e44' : '#ef444444'}`,
              }}>
              <span>{s.def?.emoji}</span>
              <span className="max-w-[60px] truncate">{s.def?.name?.split(' ')[0]}</span>
              <span>{s.have}/{need}</span>
            </span>
          )
        })}
      </div>

      {/* Quantity selector */}
      {maxQty > 1 && (
        <div className="px-3 pb-2 flex items-center gap-1.5">
          <span className="text-[10px] text-muted shrink-0">Qtd:</span>
          <button onClick={() => clampQty(qty - 1)}
            className="w-6 h-6 rounded bg-surface-2 border border-border text-text text-xs font-bold hover:bg-surface cursor-pointer leading-none">
            −
          </button>
          <input
            type="number" min={1} max={maxQty} value={qty}
            onChange={e => clampQty(parseInt(e.target.value) || 1)}
            className="w-12 bg-surface-2 border border-border rounded px-1 py-0.5 text-xs text-text text-center focus:outline-none focus:border-jade"
          />
          <button onClick={() => clampQty(qty + 1)}
            className="w-6 h-6 rounded bg-surface-2 border border-border text-text text-xs font-bold hover:bg-surface cursor-pointer leading-none">
            +
          </button>
          <button onClick={() => clampQty(maxQty)}
            className="text-[10px] text-jade hover:underline cursor-pointer ml-0.5">
            máx ({maxQty})
          </button>
        </div>
      )}

      {/* Button / feedback */}
      <div className="px-3 pb-3 mt-auto">
        {feedback ? (
          <div className={`w-full py-2 rounded-lg text-center text-xs font-bold border ${
            feedback.ok === 0
              ? 'bg-danger/10 border-danger text-danger'
              : feedback.fail > 0
                ? 'bg-gold/10 border-gold text-gold'
                : 'bg-jade/10 border-jade text-jade'
          }`}>
            {feedback.ok === 0 && `💥 ${feedback.fail}× falhou! Materiais perdidos.`}
            {feedback.ok > 0 && feedback.fail === 0 && (
              feedback.bonus > 0
                ? `⭐ ${feedback.ok}× criado com bônus! +${feedback.bonus}`
                : `✅ ${feedback.ok}× criado!`
            )}
            {feedback.ok > 0 && feedback.fail > 0 &&
              `⚠️ ${feedback.ok} sucesso · ${feedback.fail} falha`
            }
          </div>
        ) : (
          <button onClick={handleCraft} disabled={!canCraft}
            className="w-full py-2 rounded-lg text-sm font-bold transition-all"
            style={canCraft
              ? isAboveTier
                ? { backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444466' }
                : { backgroundColor: '#4f46e5', color: '#fff' }
              : { backgroundColor: '#1e1b3a', color: '#6b7280', cursor: 'not-allowed' }}>
            {!hasAll
              ? 'Materiais insuficientes'
              : isAboveTier
                ? `⚠️ Tentar ×${qty} (${failPct}% falha)`
                : qty > 1 ? `Forjar ×${qty}` : 'Forjar'
            }
          </button>
        )}
      </div>
    </div>
  )
}
