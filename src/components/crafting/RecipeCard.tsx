import { useState } from 'react'
import type { RecipeDefinition, ItemDefinition } from '../../types'
import { RARITY_COLORS } from '../../types'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { skillLevelToTier, craftFailChance, craftQualityBonus, craftLuckExtraRoll, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'
import { craftGoldCost } from '../../utils/forge'
import { usePlayerStore } from '../../store/playerStore'
import { SpriteImg } from '../ui/SpriteImg'

const SKILL_ID: Record<string, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLES: Record<string, Record<number, string>> = {
  forja:     FORGING_TITLES,
  alquimia:  ALCHEMY_TITLES,
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
  const [qty, setQty]           = useState(1)
  const [feedback, setFeedback] = useState<{ ok: number; fail: number; bonus: number } | null>(null)

  const itemDefs    = useGameDataStore((s) => s.items)
  const items       = useInventoryStore((s) => s.items)
  const addItem     = useInventoryStore((s) => s.addItem)
  const removeItem  = useInventoryStore((s) => s.removeItem)
  const skills      = useSkillsStore((s) => s.skills)
  const gainSkillXp = useSkillsStore((s) => s.gainSkillXp)
  const luck        = usePlayerStore((s) => s.luck)
  const gold        = usePlayerStore((s) => s.gold)
  const spendGold   = usePlayerStore((s) => s.spendGold)

  const skillId    = SKILL_ID[recipe.category] ?? 'forging'
  const skill      = skills.find((s) => s.id === skillId)
  const playerTier = skillLevelToTier(skill?.level ?? 1)
  const failPct    = craftFailChance(playerTier, recipe.requiredTier, luck)
  const qualBonus  = craftQualityBonus(playerTier, recipe.requiredTier, luck)

  const outputDef  = itemDefs[recipe.outputItemId]
  const color      = RARITY_COLORS[outputDef?.rarity ?? 'common']
  const spriteKind = outputDef && ['weapon','armor','accessory','ring'].includes(outputDef.type)
    ? 'item' : 'material'

  const ings = recipe.ingredients.map((req) => {
    const owned = items.find((i) => i.definitionId === req.itemId)
    const have  = owned?.quantity ?? 0
    return { ...req, have, def: itemDefs[req.itemId] }
  })

  const maxQty      = ings.length === 0 ? 1 : Math.max(1, Math.min(...ings.map(s => Math.floor(s.have / s.quantity))))
  const hasAll      = ings.every(s => s.have >= s.quantity * qty)
  const goldCost    = craftGoldCost(outputDef?.tier ?? 1) * qty
  const hasGold     = gold >= goldCost
  const canCraft    = hasAll && hasGold
  const isAboveTier = playerTier < recipe.requiredTier

  function clampQty(v: number) { setQty(Math.max(1, Math.min(maxQty, v))) }

  function handleCraft() {
    if (!canCraft) return
    spendGold(goldCost)
    let ok = 0, fail = 0, totalBonus = 0
    for (let i = 0; i < qty; i++) {
      ings.forEach((s) => {
        const item = items.find((it) => it.definitionId === s.itemId)
        if (item) removeItem(item.instanceId, s.quantity)
      })
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

  const tierTitle = TIER_TITLES[recipe.category]?.[recipe.requiredTier] ?? `Tier ${recipe.requiredTier}`

  return (
    <div className="bg-slate-900 border flex flex-col overflow-hidden"
      style={{ borderColor: isAboveTier ? '#ef444444' : '#334155' }}>

      {/* Tier badge */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">{tierTitle}</span>
        {isAboveTier && (
          <span className="text-[10px] text-red-400 font-bold">{failPct}% falha</span>
        )}
        {!isAboveTier && qualBonus > 0 && (
          <span className="text-[10px] text-teal-400 font-bold">+{qualBonus} bônus</span>
        )}
      </div>

      {/* Item */}
      <div className="flex items-start gap-3 px-3 pb-2">
        <div className="w-10 h-10 flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '22' }}>
          <SpriteImg id={recipe.outputItemId} emoji={outputDef?.emoji ?? '❓'} kind={spriteKind} size={36} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-200 text-sm leading-tight">
            {outputDef?.name ?? recipe.outputItemId}
            {recipe.outputQuantity > 1 && (
              <span className="text-slate-500 font-normal ml-1 text-xs">×{recipe.outputQuantity}</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 leading-snug">
            {shortStat(recipe.outputItemId, itemDefs)}
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {ings.map((s) => {
          const need = s.quantity * qty
          const ok   = s.have >= need
          return (
            <span key={s.itemId}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: ok ? '#22c55e18' : '#ef444418',
                color:           ok ? '#22c55e'   : '#ef4444',
                border:          `1px solid ${ok ? '#22c55e44' : '#ef444444'}`,
              }}>
              {s.def
                ? <SpriteImg id={s.def.id} emoji={s.def.emoji} kind="item" size={14} />
                : <span>❓</span>}
              <span className="max-w-[60px] truncate">{s.def?.name?.split(' ')[0]}</span>
              <span>{s.have}/{need}</span>
            </span>
          )
        })}
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: hasGold ? '#22c55e18' : '#ef444418',
            color:           hasGold ? '#22c55e'   : '#ef4444',
            border:          `1px solid ${hasGold ? '#22c55e44' : '#ef444444'}`,
          }}>
          <span>🪙</span>
          <span>{gold}/{goldCost}</span>
        </span>
      </div>

      {/* Seletor de quantidade */}
      {maxQty > 1 && (
        <div className="px-3 pb-2 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 shrink-0">Qtd:</span>
          <button onClick={() => clampQty(qty - 1)}
            className="w-6 h-6 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer leading-none">
            −
          </button>
          <input
            type="number" min={1} max={maxQty} value={qty}
            onChange={e => clampQty(parseInt(e.target.value) || 1)}
            className="w-12 bg-slate-800 border border-slate-700 px-1 py-0.5 text-xs text-slate-200 text-center focus:outline-none focus:border-teal-700"
          />
          <button onClick={() => clampQty(qty + 1)}
            className="w-6 h-6 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer leading-none">
            +
          </button>
          <button onClick={() => clampQty(maxQty)}
            className="text-[10px] text-teal-400 hover:underline cursor-pointer ml-0.5">
            máx ({maxQty})
          </button>
        </div>
      )}

      {/* Botão / feedback */}
      <div className="px-3 pb-3 mt-auto">
        {feedback ? (
          <div className={`w-full py-2 text-center text-xs font-bold border ${
            feedback.ok === 0
              ? 'bg-red-950/30 border-red-800 text-red-400'
              : feedback.fail > 0
                ? 'bg-amber-950/30 border-amber-700 text-amber-400'
                : 'bg-teal-950/30 border-teal-700 text-teal-400'
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
            className="w-full py-2 text-sm font-cinzel font-bold tracking-wider transition-all border"
            style={canCraft
              ? isAboveTier
                ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: '#ef444466' }
                : { backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', borderColor: '#4ade8066' }
              : { backgroundColor: 'rgba(15,23,42,0.6)', color: '#475569', borderColor: '#1e293b', cursor: 'not-allowed' }
            }>
            {!hasAll
              ? 'Materiais insuficientes'
              : !hasGold
                ? `Ouro insuficiente (faltam ${goldCost - gold} 🪙)`
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
