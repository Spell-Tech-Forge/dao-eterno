import { useState, useMemo } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { RecipeCard } from './RecipeCard'
import { skillLevelToTier, TIER_NAMES, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'
import { TabBar } from '../ui/TabBar'
import { SpriteImg } from '../ui/SpriteImg'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import type { RecipeDefinition } from '../../types'
import { effectiveRarity, itemMaxDurability, repairCost } from '../../utils/forge'


type CraftTab   = 'forja' | 'alquimia' | 'inscricao' | 'reparo'
type SortMode   = 'tier' | 'rarity' | 'name' | 'available'
type FilterMode = 'all' | 'available' | 'weapon' | 'armor' | 'accessory' | 'ring'

const TABS = [
  { id: 'forja'     as CraftTab, label: 'Forja',     icon: '⚒️', skillId: 'forging'     },
  { id: 'alquimia'  as CraftTab, label: 'Alquimia',  icon: '⚗️', skillId: 'alchemy'     },
  { id: 'inscricao' as CraftTab, label: 'Inscrição', icon: '✍️', skillId: 'inscription' },
  { id: 'reparo'    as CraftTab, label: 'Reparo',    icon: '🔧', skillId: ''             },
]

const RARITY_ORDER: Record<string, number> = {
  common: 0, spiritual: 1, rare: 2, ancient: 3, legendary: 4,
}

const SKILL_ID: Record<CraftTab, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription', reparo: '',
}

const TIER_TITLE: Record<CraftTab, Record<number, string>> = {
  forja:     FORGING_TITLES,
  alquimia:  ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
  reparo:    {},
}

// ── Tab Reparo ────────────────────────────────────────────────────
const EQUIP_TYPES_REPAIR = ['weapon', 'armor', 'accessory'] as const

function RepairTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastResult, setLastResult]  = useState<{ success: boolean; reason?: string } | null>(null)
  const { items, repairItem } = useInventoryStore()
  const recipes = useGameDataStore(s => s.recipes)

  const repairableItems = useMemo(() =>
    items.filter(i => {
      const def = useGameDataStore.getState().items[i.definitionId]
      return EQUIP_TYPES_REPAIR.includes(def?.type as typeof EQUIP_TYPES_REPAIR[number]) && i.durability !== undefined
    }),
    [items],
  )

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? useGameDataStore.getState().items[selected.definitionId] : null
  const upgLvl  = selected?.upgradeLevel  ?? 0
  const ascTier = selected?.ascensionTier ?? 0
  const effRar  = selectedDef ? effectiveRarity(selectedDef.rarity, ascTier) : 'common'
  const color   = RARITY_COLORS[effRar]
  const maxDur  = itemMaxDurability(upgLvl)
  const curDur  = selected?.durability ?? maxDur
  const durPct  = Math.round((curDur / maxDur) * 100)
  const durColor = durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'
  const recipe  = selected ? Object.values(recipes).find(r => r.outputItemId === selected.definitionId) : null
  const costs   = selected ? repairCost(curDur, upgLvl, recipe?.ingredients) : []
  const hasMats = costs.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const canRepair = !!selected && curDur < maxDur && hasMats

  function handleRepair() {
    if (!selectedId) return
    const result = repairItem(selectedId)
    setLastResult(result)
    setTimeout(() => setLastResult(null), 2000)
  }

  return (
    <div className="border border-slate-700 bg-slate-900 p-4">
      <div className="flex gap-4">
        <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh] no-scrollbar">
          {repairableItems.length === 0 ? (
            <p className="text-xs text-slate-500 p-2">Nenhum equipamento com durabilidade.</p>
          ) : repairableItems.map(item => {
            const def   = useGameDataStore.getState().items[item.definitionId]
            if (!def) return null
            const lvl   = item.upgradeLevel ?? 0
            const mDur  = itemMaxDurability(lvl)
            const dPct  = Math.round(((item.durability ?? mDur) / mDur) * 100)
            const dColor = dPct > 50 ? '#22c55e' : dPct > 20 ? '#f59e0b' : '#ef4444'
            const eff   = effectiveRarity(def.rarity, item.ascensionTier ?? 0)
            const col   = RARITY_COLORS[eff]
            return (
              <button key={item.instanceId}
                onClick={() => { setSelectedId(item.instanceId); setLastResult(null) }}
                className="w-full flex items-center gap-2 px-3 py-2 border transition-all text-left"
                style={{
                  borderColor:     selectedId === item.instanceId ? col : col + '44',
                  backgroundColor: selectedId === item.instanceId ? col + '18' : 'transparent',
                }}>
                <span className="shrink-0"><SpriteImg id={def.id} emoji={def.emoji} kind="item" size={20} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {def.name}{lvl > 0 ? ` +${lvl}` : ''}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${dPct}%`, backgroundColor: dColor }} />
                    </div>
                    <span className="text-[10px]" style={{ color: dColor }}>{dPct}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selected && selectedDef ? (
          <div className="flex-1 border p-4 space-y-4" style={{ borderColor: color + '66' }}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '22' }}>
                <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={44} />
              </div>
              <div>
                <div className="font-cinzel font-bold text-slate-200">
                  {selectedDef.name}
                  {upgLvl > 0 && <span className="ml-2 text-sm font-normal" style={{ color }}>+{upgLvl}</span>}
                </div>
                <div className="text-xs mt-0.5" style={{ color }}>{RARITY_LABELS[effRar]}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Durabilidade</span>
                <span className="font-bold" style={{ color: durColor }}>{curDur} / {maxDur} ({durPct}%)</span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${durPct}%`, backgroundColor: durColor }} />
              </div>
              {upgLvl > 0 && (
                <div className="text-[10px] text-slate-600">
                  Durabilidade máxima aumentada pelo aprimoramento +{upgLvl} ({maxDur} vs 100 base)
                </div>
              )}
            </div>

            {curDur < maxDur ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Custo de reparo</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                  </div>
                  {costs.map(c => {
                    const def  = useGameDataStore.getState().items[c.itemId]
                    const have = items.find(i => i.definitionId === c.itemId)?.quantity ?? 0
                    const ok   = have >= c.quantity
                    return (
                      <div key={c.itemId} className="flex items-center gap-2 text-xs">
                        {def
                          ? <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={16} />
                          : <span>❓</span>}
                        <span className="text-slate-500">{def?.name}</span>
                        <span className="font-bold tabular-nums ml-1" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
                          {have}/{c.quantity}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {lastResult && (
                  <div className={`text-center text-sm font-bold py-2 border ${
                    lastResult.success
                      ? 'bg-teal-950/30 border-teal-700 text-teal-400'
                      : 'bg-red-950/30 border-red-800 text-red-400'
                  }`}>
                    {lastResult.success ? '🔧 Reparado!' : `❌ ${lastResult.reason}`}
                  </div>
                )}

                <button onClick={handleRepair} disabled={!canRepair}
                  className="w-full py-2.5 font-cinzel font-bold text-sm border transition-colors"
                  style={canRepair
                    ? { backgroundColor: 'rgba(45,212,191,0.1)', borderColor: '#0d9488', color: '#2dd4bf' }
                    : { backgroundColor: 'rgba(15,23,42,0.6)', borderColor: '#1e293b', color: '#475569', cursor: 'not-allowed' }
                  }>
                  {hasMats ? '🔧 Reparar' : 'Materiais insuficientes'}
                </button>
              </>
            ) : (
              <div className="text-center text-teal-400 text-sm py-4">✅ Durabilidade completa.</div>
            )}
          </div>
        ) : (
          <div className="flex-1 border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-600 text-sm">
            Selecione um equipamento para reparar.
          </div>
        )}
      </div>
    </div>
  )
}

function canCraftRecipe(
  recipe: RecipeDefinition,
  items: ReturnType<typeof useInventoryStore.getState>['items'],
): boolean {
  return recipe.ingredients.every((req) => {
    const owned = items.find((i) => i.definitionId === req.itemId)
    return (owned?.quantity ?? 0) >= req.quantity
  })
}

const FORJA_FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all',       label: 'Todos'              },
  { id: 'available', label: '✅ Disponíveis'     },
  { id: 'weapon',    label: '⚔️ Armas'           },
  { id: 'armor',     label: '🛡️ Armaduras'      },
  { id: 'accessory', label: '💎 Acessórios'      },
  { id: 'ring',      label: '💍 Anéis Espaciais' },
]

const ALCH_FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all',       label: 'Todos'          },
  { id: 'available', label: '✅ Disponíveis' },
]

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'tier',      label: 'Tier ↑'      },
  { id: 'rarity',    label: 'Raridade'    },
  { id: 'available', label: 'Disponíveis' },
  { id: 'name',      label: 'Nome'        },
]

interface Props { onBack: () => void }

export function CraftingScreen({ onBack }: Props) {
  const [tab, setTab]       = useState<CraftTab>('forja')
  const [sort, setSort]     = useState<SortMode>('tier')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')

  const itemDefs      = useGameDataStore((s) => s.items)
  const recipeDefs    = useGameDataStore((s) => s.recipes)
  const craftXpConfig = useGameDataStore((s) => s.craftXpConfig)
  const tierLevels    = craftXpConfig?.tierLevels

  const items      = useInventoryStore((s) => s.items)
  const skills     = useSkillsStore((s) => s.skills)
  const skillId    = SKILL_ID[tab]
  const skill      = skills.find((s) => s.id === skillId)
  const skillLvl   = skill?.level ?? 1
  const playerTier = skillLevelToTier(skillLvl, tierLevels)

  const allRecipes = useMemo(
    () => Object.values(recipeDefs).filter((r) =>
      r.category === tab && r.requiredTier <= playerTier
    ),
    [tab, playerTier, recipeDefs],
  )

  const availableCount = useMemo(
    () => allRecipes.filter((r) => canCraftRecipe(r, items)).length,
    [allRecipes, items],
  )

  const filtered = useMemo(() => {
    let list = [...allRecipes]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => (itemDefs[r.outputItemId]?.name ?? '').toLowerCase().includes(q))
    }

    if (filter === 'available') {
      list = list.filter((r) => canCraftRecipe(r, items))
    } else if (filter !== 'all') {
      list = list.filter((r) => {
        const def = itemDefs[r.outputItemId]
        if (!def) return false
        if (filter === 'weapon')    return def.type === 'weapon'
        if (filter === 'armor')     return def.type === 'armor'
        if (filter === 'accessory') return def.type === 'accessory'
        if (filter === 'ring')      return def.type === 'ring'
        return false
      })
    }

    list.sort((a, b) => {
      if (sort === 'tier')  return a.requiredTier - b.requiredTier
      if (sort === 'name')  return (itemDefs[a.outputItemId]?.name ?? '').localeCompare(itemDefs[b.outputItemId]?.name ?? '')
      if (sort === 'rarity') {
        const ra = RARITY_ORDER[itemDefs[a.outputItemId]?.rarity ?? 'common']
        const rb = RARITY_ORDER[itemDefs[b.outputItemId]?.rarity ?? 'common']
        return ra !== rb ? ra - rb : a.requiredTier - b.requiredTier
      }
      if (sort === 'available') {
        const ca = (r: typeof a) => canCraftRecipe(r, items) ? 0 : 1
        return ca(a) !== ca(b) ? ca(a) - ca(b) : a.requiredTier - b.requiredTier
      }
      return 0
    })

    return list
  }, [allRecipes, filter, sort, search, items])

  const groupedByTier = useMemo(() => {
    const map = new Map<number, typeof filtered>()
    for (const r of filtered) {
      if (!map.has(r.requiredTier)) map.set(r.requiredTier, [])
      map.get(r.requiredTier)!.push(r)
    }
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [filtered])

  const nextLockedTier = useMemo(() => {
    const nexts = Object.values(recipeDefs)
      .filter((r) => r.category === tab && r.requiredTier > playerTier)
      .map((r) => r.requiredTier)
    return nexts.length ? Math.min(...nexts) : null
  }, [tab, playerTier, recipeDefs])


  const activeFilters = tab === 'forja' ? FORJA_FILTERS : ALCH_FILTERS

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider flex-1">
          Forja & Alquimia
        </h1>
        {tab !== 'reparo' && (
          <span className="text-xs text-teal-400 border border-teal-700/40 px-2 py-1">
            {availableCount} disponíveis
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="border border-slate-700 bg-slate-900">
        <TabBar
          tabs={TABS.map(t => ({
            id: t.id,
            label: t.label,
            icon: t.icon,
          }))}
          activeTab={tab}
          onChange={id => { setTab(id as CraftTab); setFilter('all') }}
        />
      </div>

      {/* ── Reparo ── */}
      {tab === 'reparo' && <RepairTab />}

      {/* ── Inscrição — EM BREVE ── */}
      {tab === 'inscricao' && (
        <div className="border border-slate-700 bg-slate-900 py-16 text-center space-y-4">
          <div className="text-4xl opacity-30 select-none">✍️</div>
          <div className="text-lg font-cinzel font-bold text-slate-500 tracking-[0.3em]">EM BREVE</div>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-slate-700" />
            <span className="text-amber-800 text-xs">✦</span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-slate-700" />
          </div>
          <p className="text-xs text-slate-700">
            A arte da Inscrição está sendo aperfeiçoada pelos mestres do Dao.
          </p>
        </div>
      )}

      {tab !== 'inscricao' && tab !== 'reparo' && (
        <>
          {/* ── Painel de skill / tier ── */}
          {(() => {
            const t  = TABS.find((t) => t.id === tab)!
            const sk = skills.find((s) => s.id === t.skillId)
            if (!sk) return null
            const title        = TIER_TITLE[tab]?.[playerTier] ?? `Tier ${playerTier}`
            const nextTierLvl  = tierLevels?.[playerTier] ?? (playerTier * 10 + 1)
            const nextRecipes  = Object.values(recipeDefs).filter(
              (r) => r.category === tab && r.requiredTier === playerTier + 1
            )
            return (
              <div className="border border-slate-700 bg-slate-900 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-200 font-semibold">{t.icon} {title}</span>
                    <span className="text-slate-500 ml-2">— Tier {playerTier} · {TIER_NAMES[playerTier]}</span>
                  </div>
                  <span className="text-slate-500 tabular-nums">
                    {sk.xp} / {sk.xpToNext} XP{' '}
                    <span className="text-amber-400 font-bold text-sm">Nv.{sk.level}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(sk.xp / sk.xpToNext) * 100}%` }} />
                </div>
                {nextRecipes.length > 0 && (
                  <div className="text-xs text-slate-600">
                    Tier {playerTier + 1} (Nv.{nextTierLvl}) desbloqueia:{' '}
                    {nextRecipes.slice(0, 4).map(r => itemDefs[r.outputItemId]?.name).filter(Boolean).join(', ')}
                    {nextRecipes.length > 4 ? ` +${nextRecipes.length - 4}` : ''}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Filtros + ordenação + busca ── */}
          <div className="border border-slate-700 bg-slate-900 p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map(({ id, label }) => (
                <button key={id} onClick={() => setFilter(id)}
                  className={`text-xs px-2.5 py-1 border transition-all ${
                    filter === id
                      ? 'bg-teal-950/40 border-teal-700 text-teal-400'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 shrink-0">Ordenar:</span>
              <div className="flex flex-wrap gap-1">
                {SORTS.map(({ id, label }) => (
                  <button key={id} onClick={() => setSort(id)}
                    className={`text-xs px-2 py-1 border transition-all ${
                      sort === id
                        ? 'bg-amber-950/30 border-amber-700/60 text-amber-400'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text" placeholder="Buscar..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-auto w-28 bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* ── Receitas agrupadas por tier ── */}
          {filtered.length === 0 ? (
            <div className="border border-slate-700 bg-slate-900 p-8 text-center text-slate-600 text-sm">
              Nenhuma receita encontrada.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByTier.map(([tier, recipes]) => {
                const tierTitle = TIER_TITLE[tab]?.[tier] ?? `Tier ${tier}`
                return (
                  <div key={tier} className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">
                        Tier {tier} — {TIER_NAMES[tier]}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                      <span className="text-sm font-cinzel text-amber-500/70 tracking-wide">{tierTitle}</span>
                      <span className="text-amber-700 text-[10px]">✦</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                      ))}
                    </div>
                  </div>
                )
              })}

              {nextLockedTier && (
                <div className="border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-xs font-cinzel tracking-widest uppercase text-slate-700 flex items-center gap-2">
                    🔒 Tier {nextLockedTier} — {TIER_NAMES[nextLockedTier] ?? '?'}
                    <span className="font-normal normal-case tracking-normal text-slate-700">
                      — alcance o nível {tierLevels?.[nextLockedTier - 1] ?? (nextLockedTier * 10 - 9)} para desbloquear
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
