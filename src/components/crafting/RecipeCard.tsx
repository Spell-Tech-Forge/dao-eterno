import { useState } from 'react'
import type { RecipeDefinition } from '../../types'
import { RARITY_COLORS } from '../../types'
import { ITEM_DEFS } from '../../data/items'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { skillLevelToTier, craftFailChance, craftQualityBonus, craftLuckExtraRoll, TIER_NAMES, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'
import { usePlayerStore } from '../../store/playerStore'

const SKILL_ID: Record<string, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLES: Record<string, Record<number, string>> = {
  forja: FORGING_TITLES,
  alquimia: ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
}

function shortStat(itemId: string): string {
  const s = ITEM_DEFS[itemId]?.stats
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
  const [justCrafted, setJustCrafted] = useState<'success' | 'fail' | 'quality' | null>(null)

  const items       = useInventoryStore((s) => s.items)
  const addItem     = useInventoryStore((s) => s.addItem)
  const removeItem  = useInventoryStore((s) => s.removeItem)
  const skills      = useSkillsStore((s) => s.skills)
  const gainSkillXp = useSkillsStore((s) => s.gainSkillXp)

  const luck       = usePlayerStore((s) => s.luck)
  const skillId    = SKILL_ID[recipe.category] ?? 'forging'
  const skill      = skills.find((s) => s.id === skillId)
  const playerTier = skillLevelToTier(skill?.level ?? 1)
  const failPct    = craftFailChance(playerTier, recipe.requiredTier, luck)
  const qualBonus  = craftQualityBonus(playerTier, recipe.requiredTier, luck)

  const outputDef = ITEM_DEFS[recipe.outputItemId]
  const color     = RARITY_COLORS[outputDef?.rarity ?? 'common']

  const ings = recipe.ingredients.map((req) => {
    const owned = items.find((i) => i.definitionId === req.itemId)
    const have  = owned?.quantity ?? 0
    return { ...req, have, ok: have >= req.quantity, def: ITEM_DEFS[req.itemId] }
  })

  const hasAll  = ings.every((s) => s.ok)
  // Player can attempt even above tier (with fail), but needs materials
  const canCraft = hasAll

  function handleCraft() {
    if (!canCraft) return
    ings.forEach((s) => {
      const item = items.find((i) => i.definitionId === s.itemId)
      if (item) removeItem(item.instanceId, s.quantity)
    })

    // Roll fail chance
    if (failPct > 0 && Math.random() * 100 < failPct) {
      setJustCrafted('fail')
      setTimeout(() => setJustCrafted(null), 2000)
      gainSkillXp(skillId, 10) // XP reduzido na falha
      return
    }

    const luckExtra = craftLuckExtraRoll(luck) ? 1 : 0
    const bonusQty  = qualBonus + luckExtra
    const totalQty  = recipe.outputQuantity + bonusQty
    addItem(recipe.outputItemId, totalQty)
    gainSkillXp(skillId, 25)
    setJustCrafted(bonusQty > 0 ? 'quality' : 'success')
    setTimeout(() => setJustCrafted(null), 1800)
  }

  const tierTitle = TIER_TITLES[recipe.category]?.[recipe.requiredTier] ?? `Tier ${recipe.requiredTier}`
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
          <div className="text-xs text-muted mt-0.5 leading-snug">{shortStat(recipe.outputItemId)}</div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {ings.map((s) => (
          <span key={s.itemId}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: s.ok ? '#22c55e18' : '#ef444418',
              color: s.ok ? '#22c55e' : '#ef4444',
              border: `1px solid ${s.ok ? '#22c55e44' : '#ef444444'}`,
            }}>
            <span>{s.def?.emoji}</span>
            <span className="max-w-[60px] truncate">{s.def?.name?.split(' ')[0]}</span>
            <span>{s.have}/{s.quantity}</span>
          </span>
        ))}
      </div>

      {/* Button */}
      <div className="px-3 pb-3 mt-auto">
        {justCrafted ? (
          <div className={`w-full py-2 rounded-lg text-center text-xs font-bold border ${
            justCrafted === 'fail'
              ? 'bg-danger/10 border-danger text-danger'
              : justCrafted === 'quality'
                ? 'bg-gold/10 border-gold text-gold'
                : 'bg-jade/10 border-jade text-jade'
          }`}>
            {justCrafted === 'fail'    && '💥 Falhou! Materiais perdidos.'}
            {justCrafted === 'quality' && `⭐ Grau Superior! ×${recipe.outputQuantity + qualBonus}`}
            {justCrafted === 'success' && '✅ Criado!'}
          </div>
        ) : (
          <button onClick={handleCraft} disabled={!canCraft}
            className="w-full py-2 rounded-lg text-sm font-bold transition-all"
            style={canCraft
              ? isAboveTier
                ? { backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444466' }
                : { backgroundColor: '#4f46e5', color: '#fff' }
              : { backgroundColor: '#1e1b3a', color: '#6b7280', cursor: 'not-allowed' }}>
            {!hasAll ? 'Materiais insuficientes' : isAboveTier ? `⚠️ Tentar (${failPct}% falha)` : 'Forjar'}
          </button>
        )}
      </div>
    </div>
  )
}
