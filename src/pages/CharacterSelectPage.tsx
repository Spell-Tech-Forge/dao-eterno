import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore, INITIAL_RING, INITIAL_EQUIPPED } from '../store/inventoryStore'
import { useSkillsStore, INITIAL_SKILLS } from '../store/skillsStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import type { ServerCharacter, ServerLegend } from '../types/server'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE, SERVER_TO_GAME_AFFINITY } from '../types/server'
import type { Realm, RealmStage, Affinity, InventoryItem, BestiaryEntry } from '../types'
import type { SkillData } from '../store/skillsStore'
import { CharacterCard } from '../components/character/CharacterCard'
import { LegendCard } from '../components/character/LegendCard'
import { CreateCharacterModal } from '../components/character/CreateCharacterModal'
import { TabBar } from '../components/ui/TabBar'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

const MAX_CHARACTERS = 1

interface Props {
  onEnterGame: () => void
  onOpenAdmin?: () => void
}

export function CharacterSelectPage({ onEnterGame, onOpenAdmin }: Props) {
  const { user, signOut, setActiveCharacter } = useAuthStore()
  const [tab, setTab] = useState('heroes')
  const [characters, setCharacters] = useState<ServerCharacter[]>([])
  const [legends, setLegends] = useState<ServerLegend[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [chars, legs] = await Promise.all([
        api.get<ServerCharacter[]>('/api/characters'),
        api.get<ServerLegend[]>('/api/legends/mine'),
      ])
      setCharacters(chars)
      setLegends(legs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handlePlay = (char: ServerCharacter) => {
    const realm      = (SERVER_TO_GAME_REALM[char.realm]       ?? 'qi_refining') as Realm
    const realmStage = (SERVER_TO_GAME_STAGE[char.realm_stage] ?? 'initial')     as RealmStage
    const affinity   = (SERVER_TO_GAME_AFFINITY[char.affinity] ?? 'fire')        as Affinity

    // ── Player stats ────────────────────────────────────────────
    usePlayerStore.setState({
      name: char.name, realm, realmStage,
      hp: char.hp_current,   maxHp: char.hp_max,
      qi: char.qi_current,   maxQi: char.qi_max,
      gold:               Number(char.spirit_gold),
      totalQiAccumulated: Number(char.cultivation_power),
      luck:               Number(char.luck ?? 0),
      attributePoints:    Number(char.attribute_points ?? 0),
      attributes: { strength: char.strength, agility: char.agility, vitality: char.vitality,
                    defense: char.defense, perception: char.perception, affinity },
    })

    // ── Inventory ────────────────────────────────────────────────
    if (char.inventory) {
      const inv = char.inventory as { items: InventoryItem[]; equipped: typeof INITIAL_EQUIPPED; maxSlots: number }
      useInventoryStore.setState({ items: inv.items ?? [INITIAL_RING], equipped: inv.equipped ?? { ...INITIAL_EQUIPPED }, maxSlots: inv.maxSlots ?? 30 })
    } else {
      useInventoryStore.setState({ items: [INITIAL_RING], equipped: { ...INITIAL_EQUIPPED }, maxSlots: 30 })
    }

    // ── Skills (meditationEndsAt embutido no blob) ──────────────
    if (char.skills) {
      type SkillsBlob = { data: SkillData[]; meditationEndsAt?: number; activeBuffs?: import('../store/playerStore').ActiveBuff[] } | SkillData[]
      const blob = char.skills as SkillsBlob
      const skillsList       = Array.isArray(blob) ? blob : (blob.data ?? INITIAL_SKILLS)
      const meditationEndsAt = Array.isArray(blob) ? 0 : (blob.meditationEndsAt ?? 0)
      const now = Date.now()
      const activeBuffs      = Array.isArray(blob) ? [] : (blob.activeBuffs ?? []).filter((b: import('../store/playerStore').ActiveBuff) => b.endsAt > now)
      useSkillsStore.setState({ skills: skillsList })
      usePlayerStore.setState({ meditationEndsAt, activeBuffs })
    } else {
      useSkillsStore.setState({ skills: INITIAL_SKILLS })
    }

    // ── Bestiary ────────────────────────────────────────────────
    if (char.bestiary) {
      const b = char.bestiary as { entries: Record<string, BestiaryEntry>; discoveredItems: string[] }
      useBestiaryStore.setState({ entries: b.entries ?? {}, discoveredItems: b.discoveredItems ?? [] })
    } else {
      useBestiaryStore.setState({ entries: {}, discoveredItems: [] })
    }

    setActiveCharacter({ id: char.id, name: char.name, gender: char.gender ?? 'masculino' })
    onEnterGame()
  }

  const handleDelete = async (id: number) => {
    await api.delete<unknown>(`/api/characters/${id}`)
    await loadData()
  }

  const username = user?.username ?? 'Cultivador'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-amber-500/80 text-lg font-bold tracking-[0.2em] shrink-0"
                  style={{ fontFamily: 'serif' }}>道 永恆</span>
            <span className="text-xs text-slate-500 truncate hidden sm:inline">{username}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAdmin && (
              <button onClick={onOpenAdmin}
                className="px-2.5 py-1.5 text-xs text-red-400 border border-red-800/50 rounded bg-red-950/20 hover:bg-red-900/30 transition-colors">
                Admin
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="text-center mb-5 sm:mb-8">
          <h2 className="text-slate-300 text-xl tracking-[0.15em]">Portal do Cultivador</h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
            <span className="text-amber-800 text-xs">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700">
          <TabBar
            tabs={[
              { id: 'heroes',  label: 'Meus Heróis', icon: '⚔' },
              { id: 'legends', label: 'Minhas Lendas', icon: '☽' },
            ]}
            activeTab={tab}
            onChange={setTab}
          />

          <div className="p-3 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner text="Consultando registros..." />
              </div>
            ) : tab === 'heroes' ? (
              <HeroesTab
                characters={characters}
                onPlay={handlePlay}
                onDelete={handleDelete}
                onCreate={() => setShowCreate(true)}
              />
            ) : (
              <LegendsTab legends={legends} />
            )}
          </div>
        </div>
      </main>

      <CreateCharacterModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadData}
      />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroesTab({
  characters, onPlay, onDelete, onCreate,
}: {
  characters: ServerCharacter[]
  onPlay: (c: ServerCharacter) => void
  onDelete: (id: number) => void
  onCreate: () => void
}) {
  const canCreate = characters.length < MAX_CHARACTERS

  if (characters.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="text-5xl mb-4 opacity-20 select-none">⚔</div>
        <p className="text-slate-500 text-sm mb-6">Nenhum cultivador ativo.</p>
        <Button onClick={onCreate} size="lg">Despertar Cultivador</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {characters.map(c => (
          <CharacterCard key={c.id} character={c} onPlay={onPlay} onDelete={onDelete} />
        ))}

        {canCreate && Array.from({ length: MAX_CHARACTERS - characters.length }).map((_, i) => (
          <button
            key={i}
            onClick={onCreate}
            className="border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 min-h-32 text-slate-600 hover:text-slate-400 hover:border-slate-500 transition-colors"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="text-xs tracking-wider">Novo Cultivador</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 text-center">
        {characters.length}/{MAX_CHARACTERS} cultivadores ativos
      </p>
    </div>
  )
}

function LegendsTab({ legends }: { legends: ServerLegend[] }) {
  if (legends.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="text-5xl mb-4 opacity-10 select-none">☽</div>
        <p className="text-slate-600 text-sm">
          Nenhuma lenda registrada ainda.
        </p>
        <p className="text-slate-700 text-xs mt-1">
          Os cultivadores que caírem serão imortalizados aqui.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-slate-600 text-center mb-5">
        {legends.length} {legends.length === 1 ? 'lenda registrada' : 'lendas registradas'}
      </p>
      <div className="flex flex-col gap-2">
        {legends.map((l, i) => (
          <LegendCard key={l.id} legend={l} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
