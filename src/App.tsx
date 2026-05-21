import { useState, useEffect } from 'react'
import type { Screen } from './types'
import { useAuthStore } from './store/authStore'
import { usePlayerStore } from './store/playerStore'
import { useGameLoop } from './hooks/useGameLoop'
import { useVersionCheck } from './hooks/useVersionCheck'
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
import { PatchNotesScreen } from './components/patchnotes/PatchNotesScreen'
import { AuthPage } from './pages/AuthPage'
import { CharacterSelectPage } from './pages/CharacterSelectPage'
import { AdminPage } from './pages/AdminPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { api } from './lib/api'
import { syncToServer } from './lib/sync'
import { useSpritesStore } from './store/spritesStore'
import { useSettingsStore } from './store/settingsStore'
import { useGameDataStore } from './store/gameDataStore'
import { useInventoryStore, INITIAL_RING, INITIAL_EQUIPPED, syncMaxHpOnHydration } from './store/inventoryStore'
import { useSkillsStore, INITIAL_SKILLS } from './store/skillsStore'
import { useBestiaryStore } from './store/bestiaryStore'
import { useTabGuard } from './hooks/useTabGuard'

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
  if (showAdmin && user.is_admin) return (
    <AdminPage onBack={() => {
      setShowAdmin(false)
      void useGameDataStore.getState().load()
      void useSpritesStore.getState().load()
    }} />
  )
  if (!activeCharacter) return (
    <CharacterSelectPage
      onEnterGame={() => { /* state already set */ }}
      onOpenAdmin={user.is_admin ? () => setShowAdmin(true) : undefined}
    />
  )

  return <GameApp onOpenAdmin={user.is_admin ? () => setShowAdmin(true) : undefined} />
}

export default AppGate


// ── Hidratação dos stores a partir dos dados do servidor ──────────────────────

// Flag de módulo: reset a cada reload de página, persiste entre navegações React
let storesHydrated = false

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
    totalKills:         Number((char as unknown as Record<string,unknown>).total_kills ?? 0),
    luck:               Number(char.luck ?? 0),
    attributes: { strength: char.strength, agility: char.agility, vitality: char.vitality,
                  defense: char.defense, perception: char.perception, affinity },
  })

  if (char.inventory) {
    const inv = char.inventory as { items: InventoryItem[]; equipped: { weapon: InventoryItem | null; armor: InventoryItem | null; accessory: InventoryItem | null; ring: InventoryItem | null }; maxSlots: number }
    const knownIds = useGameDataStore.getState().items
    const rawEquipped = inv.equipped ?? { weapon: null, armor: null, accessory: null, ring: null }
    // Remove itens equipados cujas definições não existem mais no banco
    const safeSlot = (item: InventoryItem | null) => (item && knownIds[item.definitionId]) ? item : null
    const safeEquipped = {
      weapon:    safeSlot(rawEquipped.weapon),
      armor:     safeSlot(rawEquipped.armor),
      accessory: safeSlot(rawEquipped.accessory),
      ring:      safeSlot(rawEquipped.ring) ?? INITIAL_RING,
    }
    // Filtra itens do inventário cujas definições não existem mais no banco
    const safeItems = (inv.items ?? []).filter(i => knownIds[i.definitionId])
    if (!safeItems.some(i => i.definitionId === INITIAL_RING.definitionId)) safeItems.unshift(INITIAL_RING)
    useInventoryStore.setState({ items: safeItems, equipped: safeEquipped, maxSlots: inv.maxSlots ?? 30 })
  } else {
    useInventoryStore.setState({ items: [INITIAL_RING], equipped: { ...INITIAL_EQUIPPED }, maxSlots: 30 })
  }

  if (char.skills) {
    type SkillsBlob = { data: SkillData[]; meditationEndsAt?: number } | SkillData[]
    const blob = char.skills as SkillsBlob
    const skillsList      = Array.isArray(blob) ? blob : (blob.data ?? INITIAL_SKILLS)
    const meditationEndsAt = Array.isArray(blob) ? 0 : (blob.meditationEndsAt ?? 0)
    useSkillsStore.setState({ skills: skillsList })
    usePlayerStore.setState({ meditationEndsAt })
  } else {
    useSkillsStore.setState({ skills: INITIAL_SKILLS })
  }

  if (char.bestiary) {
    const b = char.bestiary as { entries: Record<string, BestiaryEntry>; discoveredItems: string[] }
    useBestiaryStore.setState({ entries: b.entries ?? {}, discoveredItems: b.discoveredItems ?? [] })
  } else {
    useBestiaryStore.setState({ entries: {}, discoveredItems: [] })
  }
  storesHydrated = true
}

// ── Game (existing logic) ─────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function GameApp({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  // ── Todos os hooks têm que estar aqui no topo, sem exceção ───────────────────
  const userId = useAuthStore(s => s.user?.id)
  const { isBlocked, takeOver } = useTabGuard(userId)
  const [screen, setScreen]           = useState<Screen>('hub')
  const [activeBiome, setActiveBiome] = useState<string | null>(null)
  const [hydrating, setHydrating]     = useState(!storesHydrated)
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle')
  const [saveError,  setSaveError]    = useState<string>('')
  const setActiveCharacter            = useAuthStore(s => s.setActiveCharacter)
  const signOut                       = useAuthStore(s => s.signOut)
  const playerName                    = usePlayerStore(s => s.name)
  const loadSprites                   = useSpritesStore(s => s.load)
  const loadSettings                  = useSettingsStore(s => s.load)
  const loadStackConfig               = useGameDataStore(s => s.loadStackConfig)

  // Re-hidrata stores do servidor quando a página é recarregada
  // gameDataStore é carregado aqui (antes de liberar a UI) para evitar
  // race condition onde equipItem falha por items ainda vazios
  useEffect(() => {
    if (!hydrating) return
    const char = useAuthStore.getState().activeCharacter
    if (!char) { setHydrating(false); return }

    Promise.all([
      api.get<ServerCharacter[]>('/api/characters'),
      useGameDataStore.getState().load(),
    ])
      .then(([chars]) => {
        const found = chars.find(c => c.id === char.id)
        if (found) {
          hydrateStores(found)
          syncMaxHpOnHydration()
        }
      })
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [hydrating])

  // Sprites + settings + stackConfig: carrega após hidratação e renova a cada 3 min
  useEffect(() => {
    if (hydrating) return
    loadSprites()
    loadSettings()
    loadStackConfig()
    const id = setInterval(() => { loadSprites(); loadSettings(); loadStackConfig() }, 3 * 60 * 1000)
    return () => clearInterval(id)
  }, [hydrating, loadSprites, loadSettings, loadStackConfig])

  // Auto-save a cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => { syncToServer().catch(err => console.warn('[auto-save]', err)) }, 30 * 1000)
    return () => clearInterval(id)
  }, [])

  useGameLoop()
  useVersionCheck()

  // Retorno condicional DEPOIS de todos os hooks
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-8">
        <div className="font-cinzel text-3xl text-amber-500/80 tracking-[0.2em]" style={{ fontFamily: 'serif' }}>
          道 永恆
        </div>
        <div className="text-slate-200 text-xl font-cinzel font-bold text-center">
          Jogo aberto em outra janela
        </div>
        <div className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">
          Você já está jogando em outra aba ou janela. Feche a outra janela para continuar lá, ou clique abaixo para jogar aqui.
        </div>
        <button
          onClick={takeOver}
          className="px-8 py-2.5 font-cinzel font-bold text-sm border border-amber-600 text-amber-400 hover:bg-amber-950/30 transition-colors"
        >
          Jogar nesta janela
        </button>
      </div>
    )
  }

  if (hydrating) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  async function handleManualSave() {
    if (saveStatus === 'saving') return
    setSaveStatus('saving')
    setSaveError('')
    try {
      await syncToServer()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setSaveError(msg)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 5000)
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Navbar global (exceto batalha) ── */}
      {screen !== 'combat' && (
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-[65vw] mx-auto px-4 h-12 flex items-center justify-between">
            <span className="text-amber-500/80 font-bold tracking-[0.2em]" style={{ fontFamily: 'serif' }}>
              道 永恆
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs hidden sm:block">{playerName}</span>

              {/* ── Botão salvar ── */}
              <div className="relative">
                <button
                  onClick={handleManualSave}
                  disabled={saveStatus === 'saving'}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    saveStatus === 'saved'
                      ? 'border-teal-600 text-teal-400 bg-teal-950/30'
                      : saveStatus === 'error'
                        ? 'border-red-700 text-red-400 bg-red-950/20'
                        : saveStatus === 'saving'
                          ? 'border-slate-600 text-slate-400 cursor-wait'
                          : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={saveStatus === 'error' ? saveError : 'Salvar progresso agora'}
                >
                  {saveStatus === 'saving' ? '⏳ Salvando...'
                    : saveStatus === 'saved' ? '✓ Salvo'
                    : saveStatus === 'error' ? '✗ Erro'
                    : '💾 Salvar'}
                </button>
                {saveStatus === 'error' && saveError && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-red-950 border border-red-700 text-red-300 text-[10px] px-2 py-1 whitespace-nowrap max-w-[200px] truncate">
                    {saveError}
                  </div>
                )}
              </div>

              <button
                onClick={() => setScreen('changelog')}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  screen === 'changelog'
                    ? 'border-amber-600 text-amber-400 bg-amber-950/30'
                    : 'border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                📋 Notas
              </button>
              {onOpenAdmin && (
                <button onClick={onOpenAdmin}
                  className="px-3 py-1.5 text-xs text-red-400 border border-red-800/50 bg-red-950/20 hover:bg-red-900/30 transition-colors">
                  Admin
                </button>
              )}
              <button onClick={() => setActiveCharacter(null)}
                className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                ← Personagens
              </button>
              <button onClick={signOut}
                className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                Sair
              </button>
            </div>
          </div>
        </header>
      )}

      {screen === 'hub'        && <HubScreen onNavigate={setScreen} onEnterBiome={handleEnterBiome} />}
      {screen === 'combat' && activeBiome && (
        <CombatScreen biomeId={activeBiome} onExit={goHub} onDeath={handlePermadeath} />
      )}
      {screen === 'inventory'  && <InventoryGrid onBack={goHub} />}
      {screen === 'codex'      && <CodexScreen onBack={goHub} />}
      {screen === 'ranking'    && <RankingTable onBack={goHub} />}
      {screen === 'meditation' && <MeditationScreen onBack={goHub} />}
      {screen === 'crafting'   && <CraftingScreen onBack={goHub} />}
      {screen === 'forge'      && <ForgeScreen onBack={goHub} />}
      {screen === 'market'     && <MarketScreen onBack={goHub} />}
      {screen === 'changelog'  && <PatchNotesScreen onBack={goHub} />}
      {screen === 'skills' && (
        <div className="max-w-[65vw] mx-auto px-4 py-6">
          <button onClick={goHub}
            className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors mb-4 block">
            ← Voltar
          </button>
          <div className="border border-slate-700 bg-slate-900 p-8 text-center text-slate-600">
            Em desenvolvimento — em breve!
          </div>
        </div>
      )}
    </div>
  )
}

