import { useState, useEffect } from 'react'
import type { Screen } from './types'
import { useAuthStore } from './store/authStore'
import { usePlayerStore } from './store/playerStore'
import { useGameLoop } from './hooks/useGameLoop'
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
import { useInventoryStore } from './store/inventoryStore'
import { useSkillsStore } from './store/skillsStore'
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
    spirit_gold:       p.gold,
    last_played_at:    new Date().toISOString(),
    inventory: { items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots },
    skills:    sk.skills,
    bestiary:  { entries: bes.entries, discoveredItems: bes.discoveredItems },
  }).catch(() => { /* silently fail */ })
}

// ── Game (existing logic) ─────────────────────────────────────────────────────

function GameApp({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const [screen, setScreen] = useState<Screen>('hub')
  const [activeBiome, setActiveBiome] = useState<string | null>(null)
  const setActiveCharacter = useAuthStore(s => s.setActiveCharacter)

  const loadSprites = useSpritesStore(s => s.load)
  useEffect(() => { loadSprites() }, [loadSprites])

  useGameLoop()

  // Auto-save to server every 30 seconds — reads current store state at fire time
  useEffect(() => {
    const id = setInterval(() => { void syncToServer() }, 30 * 1000)
    return () => clearInterval(id)
  }, [])

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

