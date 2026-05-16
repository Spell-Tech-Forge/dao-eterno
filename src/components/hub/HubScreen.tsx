import type { Screen } from '../../types'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { CharacterCard } from './CharacterCard'
import { ServiceGrid } from './ServiceGrid'
import { BiomeMap } from './BiomeMap'

interface Props {
  onNavigate: (screen: Screen) => void
  onEnterBiome: (biomeId: string) => void
  onOpenAdmin?: () => void
}

export function HubScreen({ onNavigate, onEnterBiome, onOpenAdmin }: Props) {
  const name = usePlayerStore(s => s.name)
  const { signOut, setActiveCharacter } = useAuthStore()

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="max-w-[65vw] mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-gold font-bold tracking-widest text-sm">道 永恆</span>

          <div className="flex items-center gap-1">
            <span className="text-muted text-xs mr-2 hidden sm:block">{name}</span>
            {onOpenAdmin && (
              <button onClick={onOpenAdmin}
                className="px-3 py-1.5 text-xs text-danger border border-danger/40 rounded bg-danger/5 hover:bg-danger/15 transition-colors">
                Admin
              </button>
            )}
            <button
              onClick={() => setActiveCharacter(null)}
              className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:bg-surface-2 hover:text-text transition-colors"
            >
              ← Personagens
            </button>
            <button
              onClick={signOut}
              className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:bg-surface-2 hover:text-text transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-6">
        <CharacterCard />
        <ServiceGrid onNavigate={onNavigate} />
        <BiomeMap onEnterBiome={onEnterBiome} />
      </div>
    </div>
  )
}
