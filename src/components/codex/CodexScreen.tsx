import { useState, useMemo } from 'react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { getItemRole, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from '../../utils/itemRole'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useSettingsStore } from '../../store/settingsStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS, RARITY_LABELS, RARITY_PROGRESSION } from '../../types'
import type { Realm, RealmStage, MonsterDefinition, BestiaryEntry, ItemType } from '../../types'
import { TabBar } from '../ui/TabBar'
import { SpriteImg } from '../ui/SpriteImg'
import {
  enhancementCost, ascensionCost, upgradeFailChance,
  itemStatMultiplier, MAX_UPGRADE_LEVEL, MIN_UPGRADE_FOR_ASCENSION,
  maxAscensionForTier,
} from '../../utils/forge'

type CodexTab = 'beasts' | 'items' | 'realms' | 'forge'

const REALMS: Realm[]      = ['qi_refining','foundation','golden_core','nascent_soul','spirit_transformation','unification','ascension','immortal']
const STAGES: RealmStage[] = ['initial','middle','advanced','peak']

const REALM_DESCRIPTIONS: Record<Realm, string> = {
  qi_refining:           'O cultivador começa a sentir o Qi do mundo e o absorve pelo corpo. Primeiro passo no caminho da imortalidade.',
  foundation:            'O Qi se solidifica dentro do meridiano central, formando uma fundação espiritual duradoura.',
  golden_core:           'Um núcleo de energia pura se forma no dantian. O cultivador transcende a mortalidade.',
  nascent_soul:          'A alma do cultivador torna-se independente do corpo físico, capaz de viajar pelo éter.',
  spirit_transformation: 'Corpo e espírito fundem-se com o Qi universal. O cultivador torna-se parte do Dao.',
  unification:           'O cultivador unifica as leis do céu e da terra, comandando os elementos com um pensamento.',
  ascension:             'A tribulação do Trovão testa se o cultivador é digno de ascender ao plano imortal.',
  immortal:              'Além da vida e da morte. O cultivador existe enquanto o Dao existir.',
}

const MONSTER_W = 150
const MONSTER_H = 210

// ── Card de monstro com flip ───────────────────────────────────────
function MonsterFlipCard({ def, entry }: { def: MonsterDefinition; entry: BestiaryEntry | undefined }) {
  const [flipped, setFlipped] = useState(false)
  const itemDefs          = useGameDataStore(s => s.items)
  const biomes            = useGameDataStore(s => s.biomes)
  const monsterSpriteSize = useSettingsStore(s => s.monsterSpriteSize)

  const color = RARITY_COLORS[def.rarity]
  const kills = entry?.kills ?? 0

  // ── Não descoberto ──────────────────────────────────────────────
  if (!entry) {
    return (
      <div style={{ width: MONSTER_W, height: MONSTER_H }}
        className="border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center gap-2 opacity-40 select-none">
        <span className="text-5xl font-bold text-slate-700">?</span>
        <span className="text-xs text-slate-700 tracking-widest">???</span>
        {biomes[def.biomeId] && (
          <span className="text-[10px] text-slate-800">
            {REALM_NAMES[biomes[def.biomeId].requiredRealm]}
          </span>
        )}
      </div>
    )
  }

  // ── Frente ──────────────────────────────────────────────────────
  const front = (
    <div onClick={() => setFlipped(true)} style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
      backgroundColor: color + '0d',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px', gap: '4px',
      cursor: 'pointer',
    }}>
      {/* Sprite */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="monster"
          size={Math.min(monsterSpriteSize, MONSTER_W - 16)} />
      </div>

      {/* Nome */}
      <div style={{ width: '100%', textAlign: 'center', fontSize: 11, fontWeight: 700,
        color: '#e2e8f0', lineHeight: 1.2, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {def.name}
      </div>

      {/* Tags BOSS / ELITE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {def.isBoss && (
          <span style={{ fontSize: 9, color: '#f59e0b', border: '1px solid #f59e0b44', padding: '0 4px' }}>
            BOSS
          </span>
        )}
        {def.isElite && (
          <span style={{ fontSize: 9, color: '#fb923c', border: '1px solid #fb923c44', padding: '0 4px' }}>
            ELITE
          </span>
        )}
      </div>

      {/* Kills */}
      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>
        {kills} kills
      </div>
    </div>
  )

  // ── Verso ────────────────────────────────────────────────────────
  const back = (
    <div onClick={() => setFlipped(false)} style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      backgroundColor: color + '18',
      display: 'flex', flexDirection: 'column',
      padding: '8px', gap: '4px',
      cursor: 'pointer',
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', borderBottom: `1px solid ${color}44`, paddingBottom: 4, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {def.name}
        </div>
        <div style={{ fontSize: 9, color, marginTop: 2 }}>
          {RARITY_LABELS[def.rarity]} · Lv.{def.levelMin}–{def.levelMax}
        </div>
      </div>

      {/* Stats de combate */}
      <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {[
          { icon: '❤', label: 'HP',   value: def.baseHp },
          { icon: '⚔', label: 'ATK',  value: def.baseAtk },
          { icon: '🛡', label: 'DEF',  value: def.baseDef },
          { icon: '⏱', label: 'Vel',  value: `${def.speed.toFixed(1)}s` },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9 }}>
            <span>{icon}</span>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 700, marginLeft: 'auto' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Recompensas */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, fontSize: 9 }}>
        <span style={{ color: '#64748b' }}>🔮 {def.qiReward} Qi</span>
        <span style={{ color: '#64748b' }}>🪙 {def.goldReward.min}–{def.goldReward.max}</span>
      </div>

      {/* Drops */}
      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
          Drops
        </div>
        {def.dropTable.map(drop => {
          const itemDef   = itemDefs[drop.itemId]
          const revealed  = kills >= 10 || entry.discoveredDrops.includes(drop.itemId)
          const pctReveal = kills >= 10
          return (
            <div key={drop.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, gap: 3 }}>
              <span style={{ color: revealed ? '#cbd5e1' : '#64748b', flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 3 }}>
                {revealed ? (
                  <>
                    {itemDef && <SpriteImg id={itemDef.id} emoji={itemDef.emoji} kind="item" size={12} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemDef?.name ?? drop.itemId}
                    </span>
                  </>
                ) : '???'}
              </span>
              <span style={{ color: pctReveal ? '#f59e0b' : '#64748b', flexShrink: 0, marginLeft: 4 }}>
                {pctReveal ? `${Math.round(drop.chance * 100)}%` : '?%'}
              </span>
            </div>
          )
        })}
        {kills < 10 && (
          <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
            Drops revelados em 10 kills ({kills}/10)
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b', flexShrink: 0 }}>↺ voltar</div>
    </div>
  )

  return (
    <div style={{
      width: MONSTER_W, height: MONSTER_H, flexShrink: 0,
      perspective: 1200,
      border: `1px solid ${color}55`,
    }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {front}
        {back}
      </div>
    </div>
  )
}

// ── Aba Bestas ────────────────────────────────────────────────────
function BeastsTab() {
  const { entries } = useBestiaryStore()
  const monsters    = useGameDataStore(s => s.monsters)
  const biomes      = useGameDataStore(s => s.biomes)
  const biomeOrder  = useGameDataStore(s => s.biomeOrder)

  const [open, setOpen] = useState<Set<string>>(new Set())

  const RARITY_ORDER: Record<string, number> = { common:0, spiritual:1, rare:2, ancient:3, legendary:4 }

  const monsByBiome = useMemo(() => {
    const map: Record<string, typeof monsters[string][]> = {}
    Object.values(monsters).forEach(m => {
      if (!map[m.biomeId]) map[m.biomeId] = []
      map[m.biomeId].push(m)
    })
    Object.keys(map).forEach(bid => {
      map[bid].sort((a, b) =>
        a.levelMin !== b.levelMin
          ? a.levelMin - b.levelMin
          : (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0)
      )
    })
    return map
  }, [monsters])

  const biomesWithMonsters = biomeOrder.filter(id => monsByBiome[id]?.length)
  const totalAll        = Object.values(monsters).length
  const totalDiscovered = Object.values(monsters).filter(m => entries[m.id]).length
  const allOpen         = biomesWithMonsters.length > 0 && biomesWithMonsters.every(id => open.has(id))

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function openAllSequential() {
    setOpen(new Set())
    for (const id of biomesWithMonsters) {
      await new Promise(r => setTimeout(r, 110))
      setOpen(prev => new Set([...prev, id]))
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Bestiário</span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
        <span className="text-xs text-slate-600">{totalDiscovered} / {totalAll} descobertos</span>
        <button
          onClick={allOpen ? () => setOpen(new Set()) : openAllSequential}
          className="text-xs px-2 py-0.5 border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
        >
          {allOpen ? 'Fechar todos' : 'Abrir todos'}
        </button>
        <span className="text-amber-800 text-[10px]">✦</span>
      </div>

      {/* Accordion por bioma */}
      {biomesWithMonsters.map(biomeId => {
        const biome      = biomes[biomeId]
        const mons       = monsByBiome[biomeId] ?? []
        const isOpen     = open.has(biomeId)
        const accent     = biome?.theme.accentColor ?? '#4a9e7f'
        const discCount  = mons.filter(m => entries[m.id]).length
        const discovered   = mons.filter(m =>  entries[m.id])
        const undiscovered = mons.filter(m => !entries[m.id])

        return (
          <div key={biomeId}
            className="border overflow-hidden transition-colors"
            style={{ borderColor: isOpen ? accent + '55' : '#334155' }}
          >
            <button
              onClick={() => toggle(biomeId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-800/40"
              style={{ background: isOpen ? accent + '12' : undefined }}
            >
              <div className="w-1 self-stretch shrink-0 rounded-sm" style={{ background: accent }} />
              <div className="flex-1 min-w-0">
                <div className="font-cinzel font-bold text-sm" style={{ color: accent }}>
                  {biome?.name ?? biomeId}
                </div>
                {biome && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {REALM_NAMES[biome.requiredRealm]}
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-600 shrink-0">{discCount}/{mons.length}</span>
              <span className="text-slate-600 text-xs ml-1 shrink-0">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-700/40">
                <div className="flex flex-wrap gap-2">
                  {discovered.map(def => (
                    <MonsterFlipCard key={def.id} def={def} entry={entries[def.id]} />
                  ))}
                  {undiscovered.map(def => (
                    <MonsterFlipCard key={def.id} def={def} entry={undefined} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Aba Itens ─────────────────────────────────────────────────────
const ITEM_CATEGORIES: { type: ItemType; label: string }[] = [
  { type: 'weapon',    label: 'Armas'      },
  { type: 'armor',     label: 'Armaduras'  },
  { type: 'accessory', label: 'Acessórios' },
  { type: 'ring',      label: 'Anéis'      },
  { type: 'talisman',  label: 'Talismãs'   },
  { type: 'pill',      label: 'Pílulas'    },
  { type: 'material',  label: 'Materiais'  },
]

function ItemsTab() {
  const itemDefs = useGameDataStore(s => s.items)
  const recipes  = useGameDataStore(s => s.recipes)
  const { discoveredItems } = useBestiaryStore()
  const inventoryItems      = useInventoryStore(s => s.items)

  const [expandedCategory, setExpandedCategory] = useState<ItemType | null>('weapon')
  const [selectedItemId,   setSelectedItemId]   = useState<string | null>(null)

  const discoveredSet = useMemo(() => {
    const set = new Set(discoveredItems)
    for (const inv of inventoryItems) set.add(inv.definitionId)
    return set
  }, [discoveredItems, inventoryItems])

  const activeCategories = useMemo(
    () => ITEM_CATEGORIES.filter(cat => Object.values(itemDefs).some(d => d.type === cat.type)),
    [itemDefs]
  )

  const itemsByCategory = useMemo(() => {
    const map: Record<string, ReturnType<typeof Object.values<typeof itemDefs[string]>>> = {}
    for (const cat of ITEM_CATEGORIES) {
      map[cat.type] = Object.values(itemDefs)
        .filter(d => d.type === cat.type)
        .sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1) || a.name.localeCompare(b.name))
    }
    return map
  }, [itemDefs])

  const selectedDef    = selectedItemId ? itemDefs[selectedItemId] : null
  const selectedRecipe = useMemo(
    () => selectedItemId ? (Object.values(recipes).find(r => r.outputItemId === selectedItemId) ?? null) : null,
    [recipes, selectedItemId]
  )

  function handleCategoryClick(type: ItemType) {
    setExpandedCategory(prev => prev === type ? null : type)
    setSelectedItemId(null)
  }

  return (
    <div className="flex" style={{ minHeight: 520 }}>

      {/* ── Sidebar esquerda (accordion + scroll fixo) ── */}
      <div
        className="w-48 flex-shrink-0 border-r border-slate-700 overflow-y-auto no-scrollbar"
        style={{ height: '65vh' }}
      >
        {activeCategories.map(cat => {
          const isExp  = expandedCategory === cat.type
          const items  = itemsByCategory[cat.type] ?? []
          return (
            <div key={cat.type}>
              {/* Cabeçalho da categoria */}
              <button
                onClick={() => handleCategoryClick(cat.type)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-cinzel tracking-wide border-b border-slate-800 transition-all ${
                  isExp
                    ? 'bg-amber-950/30 text-amber-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-600">{items.length}</span>
                  <span className="text-[10px] text-slate-600">{isExp ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Sub-lista expandida — todos os itens, rola dentro do container */}
              {isExp && items.map(def => {
                const disc  = discoveredSet.has(def.id)
                const isSel = selectedItemId === def.id
                return (
                  <button
                    key={def.id}
                    onClick={() => disc ? setSelectedItemId(def.id) : undefined}
                    className={`w-full flex items-center gap-2 pl-5 pr-3 py-1.5 text-left border-b border-slate-800/40 transition-all ${
                      isSel
                        ? 'bg-teal-950/40 text-teal-300'
                        : disc
                          ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                          : 'text-slate-600 cursor-default'
                    }`}
                  >
                    {disc
                      ? <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />
                      : <span className="w-3.5 text-center text-slate-700 text-[11px] font-bold">?</span>
                    }
                    <span className="text-xs truncate flex-1">{disc ? def.name : '???'}</span>
                    {def.tier && <span className="text-[10px] text-slate-700 flex-shrink-0">T{def.tier}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ── Painel direito ── */}
      <div className="flex-1 p-6">
        {!selectedDef ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-700">
              <div className="text-5xl mb-3">📖</div>
              <div className="text-sm font-cinzel tracking-wider">Selecione um item</div>
              <div className="text-xs mt-1">para ver detalhes e receita de fabricação</div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Sprite + nome */}
            <div className="flex items-start gap-5">
              <div
                className="flex-shrink-0 p-3 bg-slate-800/60 border"
                style={{ borderColor: RARITY_COLORS[selectedDef.rarity] + '55' }}
              >
                <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={96} />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <h2 className="font-cinzel font-bold text-xl text-slate-100 leading-tight">
                  {selectedDef.name}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 border font-bold"
                    style={{ color: RARITY_COLORS[selectedDef.rarity], borderColor: RARITY_COLORS[selectedDef.rarity] + '55' }}
                  >
                    {RARITY_LABELS[selectedDef.rarity]}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{selectedDef.type}</span>
                  {selectedDef.tier && <span className="text-xs text-slate-600">Tier {selectedDef.tier}</span>}
                  {(() => {
                    const role = getItemRole(selectedDef.stats)
                    if (!role) return null
                    return (
                      <span className="text-xs px-2 py-0.5 border font-bold"
                        style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + '55', backgroundColor: ROLE_COLORS[role] + '15' }}>
                        {ROLE_ICONS[role]} {ROLE_LABELS[role]}
                      </span>
                    )
                  })()}
                  {selectedDef.tier && (() => {
                    const maxAsc     = maxAscensionForTier(selectedDef.tier)
                    const maxRarIdx  = Math.min(RARITY_PROGRESSION.indexOf(selectedDef.rarity) + maxAsc, RARITY_PROGRESSION.length - 1)
                    const maxRarity  = RARITY_PROGRESSION[maxRarIdx]
                    const maxColor   = RARITY_COLORS[maxRarity]
                    return (
                      <span className="text-[10px] px-1.5 py-0.5 border font-bold"
                        style={{ color: maxColor, borderColor: maxColor + '55', backgroundColor: maxColor + '12' }}
                        title={`Teto de ascensão para T${selectedDef.tier}: ${maxAsc} ascensão(ões)`}>
                        teto: {RARITY_LABELS[maxRarity]}
                      </span>
                    )
                  })()}
                </div>
                {selectedDef.description && (
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">{selectedDef.description}</p>
                )}
              </div>
            </div>

            {/* Atributos */}
            {selectedDef.stats && Object.values(selectedDef.stats).some(v => v !== undefined) && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Atributos</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDef.stats.atk   && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300">⚔️ ATK {selectedDef.stats.atk}</span>}
                  {selectedDef.stats.def   && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300">🛡️ DEF {selectedDef.stats.def}</span>}
                  {selectedDef.stats.hp    && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-green-400">❤️ HP +{selectedDef.stats.hp}</span>}
                  {selectedDef.stats.crit  && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-amber-400">💥 Crit {selectedDef.stats.crit}%</span>}
                  {selectedDef.stats.speed && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300">⏱ Vel {selectedDef.stats.speed}s</span>}
                  {selectedDef.stats.slots && <span className="text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-teal-400">📦 Slots {selectedDef.stats.slots}</span>}
                </div>
              </div>
            )}

            {/* Receita de fabricação */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Fabricação</span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
              </div>
              {selectedRecipe ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.ingredients.map(ing => {
                      const ingDef  = itemDefs[ing.itemId]
                      const ingDisc = discoveredSet.has(ing.itemId)
                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700 bg-slate-800/60"
                        >
                          {ingDisc && ingDef
                            ? <SpriteImg id={ingDef.id} emoji={ingDef.emoji} kind="item" size={18} />
                            : <span className="w-[18px] h-[18px] flex items-center justify-center text-slate-600 font-bold text-xs">?</span>
                          }
                          <span className="text-xs text-slate-300">
                            {ingDisc && ingDef ? ingDef.name : '???'}
                          </span>
                          <span className="text-xs text-amber-400 font-bold ml-0.5">×{ing.quantity}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-2 capitalize">
                    {selectedRecipe.category} · Tier {selectedRecipe.requiredTier}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-600 italic">Sem receita de fabricação conhecida.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

// ── Aba Reinos ────────────────────────────────────────────────────
function RealmsTab() {
  const { realm: playerRealm, realmStage: playerStage, qi, maxQi } = usePlayerStore()
  const [expandedRealm, setExpandedRealm] = useState<Realm>(playerRealm)
  const breakthroughs = useGameDataStore(s => s.breakthroughs)
  const itemDefs      = useGameDataStore(s => s.items)

  return (
    <div className="space-y-2">
      {REALMS.map(realm => {
        const isExpanded = expandedRealm === realm
        const isCurrent  = realm === playerRealm
        return (
          <div key={realm} className={`border transition-all ${
            isCurrent ? 'border-teal-700/60 bg-teal-950/20' : 'border-slate-700 bg-slate-900'
          }`}>
            <button
              className="w-full flex items-center gap-3 p-3 text-left"
              onClick={() => setExpandedRealm(isExpanded && !isCurrent ? playerRealm : realm)}
            >
              <div className="flex-1">
                <div className={`font-cinzel font-bold text-sm tracking-wide ${isCurrent ? 'text-teal-400' : 'text-slate-200'}`}>
                  {REALM_NAMES[realm]}
                  {isCurrent && <span className="ml-2 text-xs font-normal text-teal-600">← Atual</span>}
                </div>
                {!isExpanded && (
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{REALM_DESCRIPTIONS[realm]}</div>
                )}
              </div>
              <span className="text-slate-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-700/60 pt-3">
                <p className="text-xs text-slate-500">{REALM_DESCRIPTIONS[realm]}</p>
                <div className="space-y-2">
                  {STAGES.map(stage => {
                    const key        = `${realm}_${stage}`
                    const req        = breakthroughs[key]
                    const isCurStage = isCurrent && stage === playerStage
                    return (
                      <div key={stage} className={`p-2.5 border ${
                        isCurStage
                          ? 'bg-teal-950/20 border-teal-700/30'
                          : 'bg-slate-800/60 border-slate-700/40'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold ${isCurStage ? 'text-teal-400' : 'text-slate-300'}`}>
                            {STAGE_NAMES[stage]}
                            {isCurStage && <span className="ml-1 font-normal text-teal-600">← Aqui</span>}
                          </span>
                          {req  && <span className="text-xs text-purple-400">{req.newMaxQi.toLocaleString()} Qi máx</span>}
                          {!req && <span className="text-xs text-amber-400">Imortal</span>}
                        </div>
                        {isCurStage && (
                          <div className="h-1.5 rounded-full bg-slate-800 mb-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, (qi / maxQi) * 100)}%` }} />
                          </div>
                        )}
                        {req && req.items.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-slate-500 mr-1">Romper:</span>
                            {req.items.map(item => {
                              const def = itemDefs[item.itemId]
                              return (
                                <span key={item.itemId} className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 border border-slate-700 bg-slate-800 text-slate-300">
                                  {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />}
                                  {def?.name} ×{item.quantity}
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {req && req.items.length === 0 && (
                          <span className="text-xs text-slate-600">Romper: apenas Qi cheio</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Aba Guia de Forja ─────────────────────────────────────────────
const TIER_LABELS: Record<number, string> = {
  1:'T1 · Ref. de Qi', 2:'T2 · Ref. Avançado', 3:'T3 · Fundação',
  4:'T4 · Fund. Avançada', 5:'T5 · Núcleo Dourado', 6:'T6 · Alma Nascente',
  7:'T7 · Transf. Espiritual', 8:'T8 · Unificação', 9:'T9 · Ascensão', 10:'T10 · Imortal',
}

function ForgeGuideTab() {
  const [section, setSection]       = useState<'enhancement' | 'ascension'>('enhancement')
  const [selectedTier, setTier]     = useState(1)
  const itemDefs   = useGameDataStore(s => s.items)
  const forgeConfig = useGameDataStore(s => s.forgeConfig) ?? undefined

  const enhancementRows = Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => {
    const target = i + 1
    const costs  = enhancementCost(target, selectedTier, forgeConfig)
    const fail   = upgradeFailChance(target, selectedTier, forgeConfig)
    const mult   = itemStatMultiplier(target, 0, forgeConfig)
    return { target, costs, fail, mult }
  })

  const ascensionRows = RARITY_PROGRESSION.slice(0, -1).map((rarity, i) => {
    const next = RARITY_PROGRESSION[i + 1]
    const { materials, sacrificeCount, failChance } = ascensionCost(i, forgeConfig)
    const mult = itemStatMultiplier(0, i + 1, forgeConfig)
    return { rarity, next, materials, sacrificeCount, failChance, mult, tier: i }
  })

  return (
    <div className="space-y-4">
      {/* Seletor de seção */}
      <div className="flex border border-slate-700">
        {(['enhancement', 'ascension'] as const).map((s, i) => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-1 py-2 text-sm font-cinzel tracking-wider transition-all
              ${i === 0 ? 'border-r border-slate-700' : ''}
              ${section === s
                ? 'bg-amber-950/20 text-amber-400'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}>
            {s === 'enhancement' ? '⚒️ Aprimoramento' : '✨ Ascensão'}
          </button>
        ))}
      </div>

      {/* ── Aprimoramento ── */}
      {section === 'enhancement' && (
        <div className="space-y-4">
          <div className="border border-slate-700 bg-slate-900 p-4 space-y-2">
            <div className="text-sm font-cinzel font-bold text-slate-200">⚒️ Como funciona</div>
            <p className="text-xs text-slate-500">
              O Aprimoramento fortalece um item já forjado, aumentando todos os seus atributos de combate.
              Cada nível adiciona <span className="text-slate-300 font-semibold">+5% nos stats base</span> do item.
              Itens podem ser aprimorados até <span className="text-slate-300 font-semibold">+{MAX_UPGRADE_LEVEL}</span>,
              mas a partir do <span className="text-red-400 font-semibold">+6</span> existe chance de falha —
              que consome os materiais mas <span className="text-teal-400 font-semibold">não destrói o item</span>.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
              {[
                { label: 'Bônus por nível', value: '+5% stats',           color: 'text-teal-400' },
                { label: 'Nível máximo',    value: `+${MAX_UPGRADE_LEVEL}`, color: 'text-amber-400' },
                { label: 'Falha a partir',  value: `+${MIN_UPGRADE_FOR_ASCENSION + 1}`, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 border border-slate-700 px-3 py-2">
                  <div className="text-slate-500 mb-0.5">{label}</div>
                  <div className={`font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-cinzel font-bold text-slate-200">Tabela de Custos</div>
              <select
                value={selectedTier}
                onChange={e => setTier(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-amber-400 text-xs px-2 py-1 focus:outline-none focus:border-amber-500">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(t => (
                  <option key={t} value={t}>{TIER_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500">
                    <th className="text-left pb-2 pr-3">Nível</th>
                    <th className="text-left pb-2 pr-3">Materiais</th>
                    <th className="text-left pb-2 pr-3">Falha</th>
                    <th className="text-left pb-2">Mult.</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancementRows.map(({ target, costs, fail, mult }) => {
                    const failColor = fail === 0 ? '#22c55e' : fail <= 15 ? '#f59e0b' : fail <= 30 ? '#f97316' : '#ef4444'
                    return (
                      <tr key={target} className="border-b border-slate-800">
                        <td className="py-1.5 pr-3 font-bold" style={{ color: fail > 0 ? failColor : '#e2e8f0' }}>
                          +{target}
                        </td>
                        <td className="py-1.5 pr-3 text-slate-500">
                          <span className="flex flex-wrap gap-2">
                            {costs.map(c => {
                              const def = itemDefs[c.itemId]
                              return (
                                <span key={c.itemId} className="inline-flex items-center gap-1">
                                  {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />}
                                  {def?.name?.split(' ')[0] ?? c.itemId} ×{c.quantity}
                                </span>
                              )
                            })}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 font-bold" style={{ color: failColor }}>
                          {fail === 0 ? '—' : `${fail}%`}
                        </td>
                        <td className="py-1.5 text-teal-400 font-bold">×{mult.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(() => {
            const firstFailPct  = upgradeFailChance(MIN_UPGRADE_FOR_ASCENSION + 1, selectedTier, forgeConfig)
            const maxMult       = itemStatMultiplier(MAX_UPGRADE_LEVEL, 5, forgeConfig)
            return (
              <div className="border border-teal-700/30 bg-teal-950/20 p-4 space-y-1.5 text-xs text-slate-500">
                <div className="text-teal-400 font-cinzel font-bold text-sm mb-2">💡 Dicas</div>
                <div>• Aprimoramento +1 a +{MIN_UPGRADE_FOR_ASCENSION}: 100% de sucesso, custo apenas em Essência Espiritual.</div>
                <div>• A partir do +{MIN_UPGRADE_FOR_ASCENSION + 1}: chance de falha começa em {firstFailPct}% (varia por nível e tier — veja tabela acima).</div>
                <div>• Falha consome os materiais mas o item permanece no nível anterior.</div>
                <div>• O multiplicador acumula com o da Ascensão: +{MAX_UPGRADE_LEVEL} + 5 ascensões = ×{maxMult.toFixed(2)} nos stats.</div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Ascensão ── */}
      {section === 'ascension' && (
        <div className="space-y-4">
          <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="text-sm font-cinzel font-bold text-slate-200">✨ Como funciona</div>
            <p className="text-xs text-slate-500">
              A Ascensão eleva a raridade de um item, concedendo um bônus permanente de
              <span className="text-slate-300 font-semibold"> +15% nos stats base</span> por tier.
              Para ascender, o item precisa estar com pelo menos
              <span className="text-amber-400 font-semibold"> +{MIN_UPGRADE_FOR_ASCENSION}</span> de aprimoramento,
              além de materiais e <span className="text-slate-300 font-semibold">cópias do mesmo item</span>.
              Ao ascender, o aprimoramento é <span className="text-red-400 font-semibold">resetado para +0</span>.
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {RARITY_PROGRESSION.map((rar, i) => (
                <div key={rar} className="flex items-center gap-1">
                  <span className="text-xs font-bold px-2 py-0.5 border"
                    style={{ color: RARITY_COLORS[rar], borderColor: RARITY_COLORS[rar] + '66', backgroundColor: RARITY_COLORS[rar] + '18' }}>
                    {RARITY_LABELS[rar]}
                  </span>
                  {i < RARITY_PROGRESSION.length - 1 && <span className="text-slate-600 text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de teto por tier */}
          <div className="border border-amber-900/40 bg-amber-950/10 p-4 space-y-2">
            <div className="text-sm font-cinzel font-bold text-amber-400">Teto de Ascensão por Tier</div>
            <p className="text-xs text-slate-500 mb-3">
              O tier de um item define quantas vezes ele pode ser ascendido e qual a raridade máxima atingível.
              Para alcançar raridades maiores, é necessário craftar itens de tiers superiores.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500">
                    <th className="text-left pb-2 pr-4">Tier do Item</th>
                    <th className="text-left pb-2 pr-4">Reino</th>
                    <th className="text-left pb-2 pr-4">Máx. Ascensões</th>
                    <th className="text-left pb-2">Raridade Máxima</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { tiers:'T1',    realm:'Refinamento de Qi',        maxAsc:1, rar:'uncommon' },
                    { tiers:'T2–T3', realm:'Refinamento / Fundação',   maxAsc:2, rar:'spiritual' },
                    { tiers:'T4–T5', realm:'Fundação / Núcleo Dourado',maxAsc:3, rar:'rare' },
                    { tiers:'T6–T7', realm:'Alma Nascente / Transf.',  maxAsc:4, rar:'ancient' },
                    { tiers:'T8–T10',realm:'Unificação → Imortal',     maxAsc:5, rar:'legendary' },
                  ] as const).map(({ tiers, realm, maxAsc, rar }) => {
                    const col = RARITY_COLORS[rar]
                    return (
                      <tr key={tiers} className="border-b border-slate-800/60">
                        <td className="py-2 pr-4 font-bold text-amber-400">{tiers}</td>
                        <td className="py-2 pr-4 text-slate-500">{realm}</td>
                        <td className="py-2 pr-4 text-slate-300">{maxAsc}×</td>
                        <td className="py-2">
                          <span className="font-bold px-2 py-0.5 border text-[11px]"
                            style={{ color: col, borderColor: col + '66', backgroundColor: col + '15' }}>
                            {RARITY_LABELS[rar]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="text-sm font-cinzel font-bold text-slate-200">Tabela de Ascensão (Custos)</div>
            {ascensionRows.map(({ rarity, next, materials, sacrificeCount, failChance, mult, tier }) => {
              const fromColor = RARITY_COLORS[rarity]
              const toColor   = RARITY_COLORS[next]
              return (
                <div key={rarity} className="border p-3 space-y-2"
                  style={{ borderColor: fromColor + '44', backgroundColor: fromColor + '08' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 border"
                      style={{ color: fromColor, borderColor: fromColor + '66' }}>{RARITY_LABELS[rarity]}</span>
                    <span className="text-slate-600 text-xs">→</span>
                    <span className="text-xs font-bold px-2 py-0.5 border"
                      style={{ color: toColor, borderColor: toColor + '66' }}>{RARITY_LABELS[next]}</span>
                    <span className="ml-auto text-xs font-bold text-teal-400">×{mult.toFixed(2)} stats</span>
                    {failChance > 0 && (
                      <span className="text-[11px] font-bold text-red-400">{failChance}% falha</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500 mb-1">Materiais</div>
                      {materials.length > 0 ? materials.map(c => {
                        const def = itemDefs[c.itemId]
                        return (
                          <div key={c.itemId} className="text-slate-300 flex items-center gap-1">
                            {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />}
                            {def?.name ?? c.itemId} ×{c.quantity}
                          </div>
                        )
                      }) : <div className="text-slate-600 italic">Configurado no admin</div>}
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Sacrifícios</div>
                      <div className="text-slate-300">
                        {sacrificeCount}× cópia do item
                        <div className="text-[10px] text-slate-600 mt-0.5">(raridade: {RARITY_LABELS[rarity]})</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 border-t border-slate-700/30 pt-1.5">
                    Requer aprimoramento mínimo <span className="text-amber-400 font-bold">+{MIN_UPGRADE_FOR_ASCENSION}</span>
                    {tier > 0 && ` e raridade ${RARITY_LABELS[rarity]}`}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border border-teal-700/30 bg-teal-950/20 p-4 space-y-1.5 text-xs text-slate-500">
            <div className="text-teal-400 font-cinzel font-bold text-sm mb-2">💡 Dicas</div>
            <div>• Ao ascender, o aprimoramento volta ao +0. Planeje subir para +{MIN_UPGRADE_FOR_ASCENSION} novamente antes da próxima ascensão.</div>
            <div>• O multiplicador total é: <span className="text-slate-300">(1 + nível×0,05) × (1 + tier×0,15)</span></div>
            <div>• Guardar cópias do mesmo item antes de ascender poupa tempo de farm.</div>
            <div>• O tier do item define o teto: T1 chega no máximo a Espiritual, T8–10 podem chegar a Imortal.</div>
            <div>• Com +{MAX_UPGRADE_LEVEL} e 5 ascensões (item T8+): ×{itemStatMultiplier(MAX_UPGRADE_LEVEL, 5, forgeConfig).toFixed(2)} — o teto do sistema.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Codex principal ───────────────────────────────────────────────
interface Props { onBack: () => void }

export function CodexScreen({ onBack }: Props) {
  const [tab, setTab] = useState<CodexTab>('beasts')

  const TABS = [
    { id: 'beasts' as const, label: 'Bestas', icon: '🐾' },
    { id: 'items'  as const, label: 'Itens',  icon: '⚔️' },
    { id: 'realms' as const, label: 'Reinos', icon: '🌀' },
    { id: 'forge'  as const, label: 'Forja',  icon: '✨' },
  ]

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">Codex</h1>
      </div>

      {/* ── Tabs + conteúdo ── */}
      <div className="border border-slate-700 bg-slate-900">
        <TabBar
          tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeTab={tab}
          onChange={id => setTab(id as CodexTab)}
        />
        <div className="p-4">
          {tab === 'beasts' && <BeastsTab />}
          {tab === 'items'  && <ItemsTab />}
          {tab === 'realms' && <RealmsTab />}
          {tab === 'forge'  && <ForgeGuideTab />}
        </div>
      </div>
    </div>
  )
}
