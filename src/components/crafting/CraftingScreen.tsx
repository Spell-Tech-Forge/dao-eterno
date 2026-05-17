import { useState, useMemo } from 'react'
import { RECIPE_DEFS } from '../../data/recipes'
import { ITEM_DEFS } from '../../data/items'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { RecipeCard } from './RecipeCard'
import { skillLevelToTier, TIER_NAMES, ALCHEMY_TITLES, FORGING_TITLES } from '../../utils/skillTiers'

type CraftTab   = 'forja' | 'alquimia' | 'inscricao'
type SortMode   = 'tier' | 'rarity' | 'name' | 'available'
type FilterMode = 'all' | 'available' | 'weapon' | 'armor' | 'ring' | 'dagger' | '1h' | '2h' | 'axe' | 'staff'

const TABS = [
  { id: 'forja'     as CraftTab, label: 'Forja',     emoji: '⚒️', skillId: 'forging'     },
  { id: 'alquimia'  as CraftTab, label: 'Alquimia',  emoji: '⚗️', skillId: 'alchemy'     },
  { id: 'inscricao' as CraftTab, label: 'Inscrição', emoji: '✍️', skillId: 'inscription' },
]

const RARITY_ORDER: Record<string, number> = {
  common: 0, spiritual: 1, rare: 2, ancient: 3, legendary: 4,
}

const SKILL_ID: Record<CraftTab, string> = {
  forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription',
}

const TIER_TITLE: Record<CraftTab, Record<number, string>> = {
  forja: FORGING_TITLES,
  alquimia: ALCHEMY_TITLES,
  inscricao: ALCHEMY_TITLES,
}

function getWeaponSubtype(itemId: string): FilterMode {
  if (itemId.startsWith('dagger'))          return 'dagger'
  if (itemId.startsWith('sword_twohanded')) return '2h'
  if (itemId.startsWith('sword'))           return '1h'
  if (itemId.startsWith('axe'))             return 'axe'
  if (itemId.startsWith('staff'))           return 'staff'
  return 'weapon'
}

function canCraftRecipe(
  recipeId: string,
  items: ReturnType<typeof useInventoryStore.getState>['items'],
): boolean {
  const recipe = RECIPE_DEFS[recipeId]
  if (!recipe) return false
  return recipe.ingredients.every((req) => {
    const owned = items.find((i) => i.definitionId === req.itemId)
    return (owned?.quantity ?? 0) >= req.quantity
  })
}

interface Props { onBack: () => void }

export function CraftingScreen({ onBack }: Props) {
  const [tab, setTab]       = useState<CraftTab>('forja')
  const [sort, setSort]     = useState<SortMode>('tier')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')

  const items      = useInventoryStore((s) => s.items)
  const skills     = useSkillsStore((s) => s.skills)
  const skillId    = SKILL_ID[tab]
  const skill      = skills.find((s) => s.id === skillId)
  const skillLvl   = skill?.level ?? 1
  const playerTier = skillLevelToTier(skillLvl)

  const allRecipes = useMemo(
    () => Object.values(RECIPE_DEFS).filter((r) => r.category === tab && r.requiredTier <= playerTier),
    [tab, playerTier],
  )

  const availableCount = useMemo(
    () => allRecipes.filter((r) => r.requiredTier <= playerTier && canCraftRecipe(r.id, items)).length,
    [allRecipes, items, playerTier],
  )

  const filtered = useMemo(() => {
    let list = [...allRecipes]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => (ITEM_DEFS[r.outputItemId]?.name ?? '').toLowerCase().includes(q))
    }
    if (filter === 'available') {
      list = list.filter((r) => r.requiredTier <= playerTier && canCraftRecipe(r.id, items))
    } else if (filter !== 'all') {
      list = list.filter((r) => {
        const def = ITEM_DEFS[r.outputItemId]
        if (!def) return false
        if (filter === 'armor') return def.type === 'armor'
        if (filter === 'ring')  return def.type === 'ring'
        if (def.type !== 'weapon') return false
        return getWeaponSubtype(r.outputItemId) === filter
      })
    }

    list.sort((a, b) => {
      if (sort === 'tier')  return a.requiredTier - b.requiredTier
      if (sort === 'name')  return (ITEM_DEFS[a.outputItemId]?.name ?? '').localeCompare(ITEM_DEFS[b.outputItemId]?.name ?? '')
      if (sort === 'rarity') {
        const ra = RARITY_ORDER[ITEM_DEFS[a.outputItemId]?.rarity ?? 'common']
        const rb = RARITY_ORDER[ITEM_DEFS[b.outputItemId]?.rarity ?? 'common']
        return ra !== rb ? ra - rb : a.requiredTier - b.requiredTier
      }
      if (sort === 'available') {
        const ca = (r: typeof a) => r.requiredTier <= playerTier && canCraftRecipe(r.id, items) ? 0 : 1
        return ca(a) !== ca(b) ? ca(a) - ca(b) : a.requiredTier - b.requiredTier
      }
      return 0
    })

    return list
  }, [allRecipes, filter, sort, search, items, playerTier])

  // Agrupa por tier
  const groupedByTier = useMemo(() => {
    const map = new Map<number, typeof filtered>()
    for (const r of filtered) {
      if (!map.has(r.requiredTier)) map.set(r.requiredTier, [])
      map.get(r.requiredTier)!.push(r)
    }
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [filtered])

  const nextLockedTier = useMemo(() => {
    const nexts = Object.values(RECIPE_DEFS)
      .filter((r) => r.category === tab && r.requiredTier > playerTier)
      .map((r) => r.requiredTier)
    return nexts.length ? Math.min(...nexts) : null
  }, [tab, playerTier])

  const FORJA_FILTERS: { id: FilterMode; label: string }[] = [
    { id: 'all',      label: 'Todos'           },
    { id: 'available',label: '✅ Disponíveis'  },
    { id: 'dagger',   label: '🗡️ Adagas'       },
    { id: '1h',       label: '⚔️ Espadas 1H'   },
    { id: '2h',       label: '🗡️ Espadas 2H'   },
    { id: 'axe',      label: '🪓 Machados'      },
    { id: 'staff',    label: '🪄 Bastões'       },
    { id: 'armor',    label: '🛡️ Armaduras'    },
    { id: 'ring',     label: '💍 Anéis'        },
  ]
  const ALCH_FILTERS: { id: FilterMode; label: string }[] = [
    { id: 'all',      label: 'Todos'           },
    { id: 'available',label: '✅ Disponíveis'  },
  ]
  const activeFilters = tab === 'forja' ? FORJA_FILTERS : ALCH_FILTERS

  const SORTS: { id: SortMode; label: string }[] = [
    { id: 'tier',      label: 'Tier ↑'      },
    { id: 'rarity',    label: 'Raridade'    },
    { id: 'available', label: 'Disponíveis' },
    { id: 'name',      label: 'Nome'        },
  ]

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text flex-1">Forja & Alquimia</h1>
        <span className="text-xs px-2 py-1 rounded-full border border-jade/40 text-jade">
          {availableCount} disponíveis
        </span>
      </div>

      {/* Tabs de categoria */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        {TABS.map(({ id, label, emoji, skillId: sid }) => {
          const sk = skills.find((s) => s.id === sid)
          return (
            <button key={id}
              onClick={() => { setTab(id); setFilter('all') }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === id ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
              }`}>
              <span>{emoji}</span>
              <span>{label}</span>
              {sk && <span className="text-xs px-1 rounded bg-surface-2 text-muted ml-0.5">Nv.{sk.level}</span>}
            </button>
          )
        })}
      </div>

      {/* Skill XP + Tier */}
      {(() => {
        const t = TABS.find((t) => t.id === tab)!
        const sk = skills.find((s) => s.id === t.skillId)
        if (!sk) return null
        const title = TIER_TITLE[tab]?.[playerTier] ?? `Tier ${playerTier}`
        const nextTierLevel = playerTier * 10 + 1
        const nextTierRecipes = Object.values(RECIPE_DEFS).filter(
          (r) => r.category === tab && r.requiredTier === playerTier + 1
        )
        return (
          <div className="rounded-xl border border-border bg-surface px-4 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-text font-semibold">{t.emoji} {title}</span>
                <span className="text-muted ml-2">— Tier {playerTier} · {TIER_NAMES[playerTier]}</span>
              </div>
              <span className="text-muted tabular-nums">{sk.xp} / {sk.xpToNext} XP (Nv.{sk.level})</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-xp transition-all" style={{ width: `${(sk.xp / sk.xpToNext) * 100}%` }} />
            </div>
            {nextTierRecipes.length > 0 && (
              <div className="text-xs text-muted">
                Tier {playerTier + 1} (Nv.{nextTierLevel}) desbloqueia: {nextTierRecipes.slice(0, 4).map(r => ITEM_DEFS[r.outputItemId]?.name).filter(Boolean).join(', ')}{nextTierRecipes.length > 4 ? ` +${nextTierRecipes.length - 4}` : ''}
              </div>
            )}
          </div>
        )
      })()}

      {/* Filtros + sort */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {activeFilters.map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${
                filter === id ? 'bg-jade/20 border-jade text-jade' : 'border-border text-muted hover:border-muted'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted shrink-0">Ordenar:</span>
          <div className="flex flex-wrap gap-1">
            {SORTS.map(({ id, label }) => (
              <button key={id} onClick={() => setSort(id)}
                className={`text-xs px-2 py-1 rounded border transition-all ${
                  sort === id ? 'bg-surface-2 border-jade text-jade' : 'border-border text-muted hover:border-muted'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Buscar..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto w-28 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text placeholder-muted outline-none focus:border-jade" />
        </div>
      </div>

      {/* Receitas agrupadas por tier */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted text-sm">
          Nenhuma receita encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByTier.map(([tier, recipes]) => {
            const tierTitle = TIER_TITLE[tab]?.[tier] ?? `Tier ${tier}`
            return (
              <div key={tier} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-muted">
                    Tier {tier} — {TIER_NAMES[tier]}
                  </span>
                  <span className="text-xs text-muted/60">{tierTitle}</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Próximo tier bloqueado */}
          {nextLockedTier && (
            <div className="rounded-xl border border-border/40 bg-surface/50 p-4">
              <div className="text-xs font-bold tracking-widest uppercase text-muted/50 flex items-center gap-2">
                🔒 Tier {nextLockedTier} — {TIER_NAMES[nextLockedTier] ?? '?'}
                <span className="font-normal normal-case tracking-normal">— alcance o nível {nextLockedTier * 10 - 9} para desbloquear</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
