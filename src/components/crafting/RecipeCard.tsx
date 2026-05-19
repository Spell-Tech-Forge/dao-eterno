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
import { getItemRole, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from '../../utils/itemRole'

const SKILL_ID: Record<string, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLES: Record<string, Record<number, string>> = {
  forja:     FORGING_TITLES,
  alquimia:  ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
}

function statRows(itemId: string, itemDefs: Record<string, ItemDefinition>): { label: string; value: string }[] {
  const s = itemDefs[itemId]?.stats
  if (!s) return []
  return ([
    s.atk   != null && { label: 'ATK',       value: `+${s.atk}` },
    s.def    != null && { label: 'DEF',       value: `+${s.def}` },
    s.hp     != null && { label: 'HP',        value: `+${s.hp}` },
    s.crit   != null && { label: 'Crítico',   value: `${s.crit}%` },
    s.speed  != null && { label: 'Velocidade',value: `${s.speed}s` },
    s.qi     != null && { label: 'Qi',        value: `+${s.qi}` },
    s.slots  != null && { label: 'Slots',     value: `${s.slots}` },
  ] as const).filter(Boolean) as { label: string; value: string }[]
}

// Altura fixa para todos os cards (equivalente a 4 materiais no verso)
const CARD_H = 232

interface Props { recipe: RecipeDefinition }

export function RecipeCard({ recipe }: Props) {
  const [qty, setQty]           = useState(1)
  const [feedback, setFeedback] = useState<{ ok: number; fail: number; bonus: number } | null>(null)
  const [flipped, setFlipped]   = useState(false)

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

  const tierTitle   = TIER_TITLES[recipe.category]?.[recipe.requiredTier] ?? `Tier ${recipe.requiredTier}`
  const borderColor = isAboveTier ? '#ef444444' : '#334155'

  return (
    <div style={{ perspective: '1000px', height: CARD_H }}>
      <div
        style={{
          display: 'grid',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >

        {/* ── FRENTE — card inteiro clicável para virar ── */}
        <div
          style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', borderColor }}
          className="bg-slate-900 border flex flex-col overflow-hidden cursor-pointer select-none"
          onClick={() => setFlipped(true)}
        >
          {/* Tier / qualidade / seta de virar */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{tierTitle}</span>
            <div className="flex items-center gap-2">
              {isAboveTier && (
                <span className="text-[10px] text-red-400 font-bold">{failPct}% falha</span>
              )}
              {!isAboveTier && qualBonus > 0 && (
                <span className="text-[10px] text-teal-400 font-bold">+{qualBonus} bônus</span>
              )}
            </div>
          </div>

          {/* Item — ícone + nome apenas */}
          <div className="flex items-center gap-3 px-3 pb-2">
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
              {(() => {
                const role = getItemRole(outputDef?.stats)
                if (!role) return null
                return (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 mt-0.5"
                    style={{ color: ROLE_COLORS[role], border: `1px solid ${ROLE_COLORS[role]}55`, backgroundColor: ROLE_COLORS[role] + '15' }}>
                    {ROLE_ICONS[role]} {ROLE_LABELS[role]}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Stats em 2 colunas */}
          <div className="px-3 flex-1 flex items-center">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 w-full">
              {statRows(recipe.outputItemId, itemDefs).map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantidade + Botão/feedback — juntos no fundo, isolados do click de virar */}
          <div className="px-3 pb-3 space-y-1.5" onClick={e => e.stopPropagation()}>
            {maxQty > 1 && (
              <div className="flex items-center gap-1.5">
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


        {/* ── VERSO — card inteiro clicável para voltar ── */}
        <div
          style={{
            gridArea: '1 / 1',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor,
          }}
          className="bg-slate-900 border flex flex-col overflow-hidden cursor-pointer select-none"
          onClick={() => setFlipped(false)}
        >
          {/* Header */}
          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <SpriteImg id={recipe.outputItemId} emoji={outputDef?.emoji ?? '❓'} kind={spriteKind} size={16} />
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate">
                {outputDef?.name ?? recipe.outputItemId}
              </span>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="px-3 py-2.5 flex-1 flex flex-col gap-2 overflow-y-auto">
            <span className="text-[10px] text-slate-600 tracking-widest uppercase">Ingredientes</span>
            {ings.map((s) => {
              const need = s.quantity * qty
              const ok   = s.have >= need
              return (
                <div key={s.itemId} className="flex items-center gap-2 text-xs">
                  {s.def
                    ? <SpriteImg id={s.def.id} emoji={s.def.emoji} kind="item" size={16} />
                    : <span>❓</span>}
                  <span className="flex-1 text-slate-400 truncate">{s.def?.name ?? s.itemId}</span>
                  <span className="font-bold tabular-nums shrink-0" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
                    {s.have}/{need}
                  </span>
                </div>
              )
            })}

            {/* Ouro */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 text-center shrink-0">🪙</span>
              <span className="flex-1 text-slate-400">Ouro</span>
              <span className="font-bold tabular-nums shrink-0" style={{ color: hasGold ? '#22c55e' : '#ef4444' }}>
                {gold}/{goldCost}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
