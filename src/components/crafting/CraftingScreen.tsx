import { useState, useMemo } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { RecipeCard } from './RecipeCard'
import { skillLevelToTier, TIER_NAMES, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'
import { TabBar } from '../ui/TabBar'
import type { RecipeDefinition } from '../../types'

type CraftTab   = 'forja' | 'alquimia' | 'inscricao'
type SortMode   = 'tier' | 'rarity' | 'name' | 'available'
type FilterMode = 'all' | 'available' | 'weapon' | 'armor' | 'accessory' | 'ring'

const TABS = [
  { id: 'forja'     as CraftTab, label: 'Forja',     icon: '⚒️', skillId: 'forging'     },
  { id: 'alquimia'  as CraftTab, label: 'Alquimia',  icon: '⚗️', skillId: 'alchemy'     },
  { id: 'inscricao' as CraftTab, label: 'Inscrição', icon: '✍️', skillId: 'inscription' },
]

const RARITY_ORDER: Record<string, number> = {
  common: 0, spiritual: 1, rare: 2, ancient: 3, legendary: 4,
}

const SKILL_ID: Record<CraftTab, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLE: Record<CraftTab, Record<number, string>> = {
  forja:     FORGING_TITLES,
  alquimia:  ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
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

  const itemDefs   = useGameDataStore((s) => s.items)
  const recipeDefs = useGameDataStore((s) => s.recipes)

  const items      = useInventoryStore((s) => s.items)
  const skills     = useSkillsStore((s) => s.skills)
  const skillId    = SKILL_ID[tab]
  const skill      = skills.find((s) => s.id === skillId)
  const skillLvl   = skill?.level ?? 1
  const playerTier = skillLevelToTier(skillLvl)

  const allRecipes = useMemo(
    () => Object.values(recipeDefs).filter((r) => r.category === tab && r.requiredTier <= playerTier),
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
        <span className="text-xs text-teal-400 border border-teal-700/40 px-2 py-1">
          {availableCount} disponíveis
        </span>
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

      {tab !== 'inscricao' && (
        <>
          {/* ── Painel de skill / tier ── */}
          {(() => {
            const t  = TABS.find((t) => t.id === tab)!
            const sk = skills.find((s) => s.id === t.skillId)
            if (!sk) return null
            const title        = TIER_TITLE[tab]?.[playerTier] ?? `Tier ${playerTier}`
            const nextTierLvl  = playerTier * 10 + 1
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
                    {sk.xp} / {sk.xpToNext} XP (Nv.{sk.level})
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
                      <span className="text-xs text-slate-600">{tierTitle}</span>
                      <span className="text-amber-800 text-[10px]">✦</span>
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
                      — alcance o nível {nextLockedTier * 10 - 9} para desbloquear
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
