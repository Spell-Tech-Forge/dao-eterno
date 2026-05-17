import { useState, useEffect } from 'react'
import type { Screen } from './types'
import { useAuthStore } from './store/authStore'
import { usePlayerStore } from './store/playerStore'
import { useGameLoop } from './hooks/useGameLoop'
import type { ServerCharacter } from './types/server'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE, SERVER_TO_GAME_AFFINITY } from './types/server'
import type { Realm, RealmStage, Affinity, InventoryItem, BestiaryEntry } from './types'
import type { SkillData } from './store/skillsStore'
import { HubScreen } from './components/hub/HubScreen'
import { CombatScreen } from './components/combat/CombatScreen'
import { InventoryGrid } from './components/inventory/InventoryGrid'
import { CodexScreen } from './components/codex/CodexScreen'
import { RankingTable } from './components/ranking/RankingTable'
import { MeditationScreen } from './components/meditation/MeditationScreen'
import { CraftingScreen } from './components/crafting/CraftingScreen'
import { ForgeScreen } from './components/forge/ForgeScreen'
import { MarketScreen } from './components/market/MarketScreen'
import { AuthPage } from './pages/AuthPage'
import { CharacterSelectPage } from './pages/CharacterSelectPage'
import { AdminPage } from './pages/AdminPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { api } from './lib/api'
import { REALM_NAMES, STAGE_NAMES } from './types'
import { useSpritesStore } from './store/spritesStore'
import { useInventoryStore, INITIAL_RING, INITIAL_EQUIPPED } from './store/inventoryStore'
import { useSkillsStore, INITIAL_SKILLS } from './store/skillsStore'
import { useBestiaryStore } from './store/bestiaryStore'

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AppGate() {
  const { user, activeCharacter, loading, loadFromStorage } = useAuthStore()
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (showAdmin && user.is_admin) return <AdminPage onBack={() => setShowAdmin(false)} />
  if (!activeCharacter) return (
    <CharacterSelectPage
      onEnterGame={() => { /* state already set */ }}
      onOpenAdmin={user.is_admin ? () => setShowAdmin(true) : undefined}
    />
  )

  return <GameApp onOpenAdmin={user.is_admin ? () => setShowAdmin(true) : undefined} />
}

export default AppGate

// ── Server sync (runs outside React to avoid stale closures) ─────────────────

async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p   = usePlayerStore.getState()
  const inv = useInventoryStore.getState()
  const sk  = useSkillsStore.getState()
  const bes = useBestiaryStore.getState()

  await api.put(`/api/characters/${char.id}`, {
    realm:             REALM_NAMES[p.realm],
    realm_stage:       STAGE_NAMES[p.realmStage],
    cultivation_power: p.totalQiAccumulated,
    hp_current:        p.hp,
    hp_max:            p.maxHp,
    qi_current:        p.qi,
    qi_max:            p.maxQi,
    strength:          p.attributes.strength,
    agility:           p.attributes.agility,
    vitality:          p.attributes.vitality,
    defense:           p.attributes.defense,
    perception:        p.attributes.perception,
    luck:              p.luck,
    spirit_gold:       p.gold,
    last_played_at:    new Date().toISOString(),
    inventory: { items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots },
    skills:    sk.skills,
    bestiary:  { entries: bes.entries, discoveredItems: bes.discoveredItems },
  }).catch(() => { /* silently fail */ })
}

// ── Hidratação dos stores a partir dos dados do servidor ──────────────────────

function hydrateStores(char: ServerCharacter) {
  const realm      = (SERVER_TO_GAME_REALM[char.realm]       ?? 'qi_refining') as Realm
  const realmStage = (SERVER_TO_GAME_STAGE[char.realm_stage] ?? 'initial')     as RealmStage
  const affinity   = (SERVER_TO_GAME_AFFINITY[char.affinity] ?? 'fire')        as Affinity

  usePlayerStore.setState({
    name: char.name, realm, realmStage,
    hp: char.hp_current, maxHp: char.hp_max,
    qi: char.qi_current, maxQi: char.qi_max,
    gold:               Number(char.spirit_gold),
    totalQiAccumulated: Number(char.cultivation_power),
    luck:               Number(char.luck ?? 0),
    attributes: { strength: char.strength, agility: char.agility, vitality: char.vitality,
                  defense: char.defense, perception: char.perception, affinity },
  })

  if (char.inventory) {
    const inv = char.inventory as { items: InventoryItem[]; equipped: typeof INITIAL_EQUIPPED; maxSlots: number }
    useInventoryStore.setState({ items: inv.items ?? [INITIAL_RING], equipped: inv.equipped ?? { ...INITIAL_EQUIPPED }, maxSlots: inv.maxSlots ?? 30 })
  } else {
    useInventoryStore.setState({ items: [INITIAL_RING], equipped: { ...INITIAL_EQUIPPED }, maxSlots: 30 })
  }

  if (char.skills) {
    useSkillsStore.setState({ skills: char.skills as SkillData[] })
  } else {
    useSkillsStore.setState({ skills: INITIAL_SKILLS })
  }

  if (char.bestiary) {
    const b = char.bestiary as { entries: Record<string, BestiaryEntry>; discoveredItems: string[] }
    useBestiaryStore.setState({ entries: b.entries ?? {}, discoveredItems: b.discoveredItems ?? [] })
  } else {
    useBestiaryStore.setState({ entries: {}, discoveredItems: [] })
  }
}

// ── Game (existing logic) ─────────────────────────────────────────────────────

function GameApp({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  // ── Todos os hooks têm que estar aqui no topo, sem exceção ───────────────────
  const [screen, setScreen]           = useState<Screen>('hub')
  const [activeBiome, setActiveBiome] = useState<string | null>(null)
  const [hydrating, setHydrating]     = useState(!usePlayerStore.getState().name)
  const setActiveCharacter            = useAuthStore(s => s.setActiveCharacter)
  const loadSprites                   = useSpritesStore(s => s.load)

  // Re-hidrata stores do servidor quando a página é recarregada
  useEffect(() => {
    if (!hydrating) return
    const char = useAuthStore.getState().activeCharacter
    if (!char) { setHydrating(false); return }

    api.get<ServerCharacter[]>('/api/characters')
      .then(chars => {
        const found = chars.find(c => c.id === char.id)
        if (found) hydrateStores(found)
      })
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [hydrating])

  // Sprites: carrega após hidratação e renova a cada 3 min
  useEffect(() => {
    if (hydrating) return
    loadSprites()
    const id = setInterval(loadSprites, 3 * 60 * 1000)
    return () => clearInterval(id)
  }, [hydrating, loadSprites])

  // Auto-save a cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => { void syncToServer() }, 30 * 1000)
    return () => clearInterval(id)
  }, [])

  useGameLoop()

  // Retorno condicional DEPOIS de todos os hooks
  if (hydrating) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const goHub = () => setScreen('hub')

  const handleEnterBiome = (biomeId: string) => {
    setActiveBiome(biomeId)
    setScreen('combat')
  }

  // Permadeath — move character to legends, return to select screen
  const handlePermadeath = async (causeOfDeath: string) => {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    try {
      await api.post(`/api/characters/${char.id}/die`, { cause_of_death: causeOfDeath })
    } catch {
      // Even if API fails, clear local state
    }
    ;['dao-eterno-player', 'dao-eterno-inventory', 'dao-eterno-skills', 'dao-eterno-bestiary'].forEach(
      k => localStorage.removeItem(k)
    )
    setActiveCharacter(null)
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {screen === 'hub'        && <HubScreen onNavigate={setScreen} onEnterBiome={handleEnterBiome} onOpenAdmin={onOpenAdmin} />}
      {screen === 'combat' && activeBiome && (
        <CombatScreen
          biomeId={activeBiome}
          onExit={goHub}
          onDeath={handlePermadeath}
        />
      )}
      {screen === 'inventory'  && <InventoryGrid onBack={goHub} />}
      {screen === 'codex'      && <CodexScreen onBack={goHub} />}
      {screen === 'ranking'    && <RankingTable onBack={goHub} />}
      {screen === 'meditation' && <MeditationScreen onBack={goHub} />}
      {screen === 'crafting'   && <CraftingScreen onBack={goHub} />}
      {screen === 'forge'      && <ForgeScreen onBack={goHub} />}
      {screen === 'market'     && <MarketScreen onBack={goHub} />}
      {screen === 'skills' && (
        <div className="max-w-[65vw] mx-auto px-4 py-6">
          <button onClick={goHub} className="text-muted hover:text-text text-sm mb-4 block">← Voltar</button>
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            Em desenvolvimento — em breve!
          </div>
        </div>
      )}
    </div>
  )
}

