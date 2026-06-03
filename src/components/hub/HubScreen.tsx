import { useMemo } from 'react'
import type { Screen } from '../../types'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { CharacterCard } from './CharacterCard'
import { ServiceGrid } from './ServiceGrid'
import { BiomeMap } from './BiomeMap'

interface Props {
  onNavigate: (screen: Screen) => void
  onEnterBiome: (biomeId: string) => void
}

export function HubScreen({ onNavigate, onEnterBiome }: Props) {
  const currentLocationId = usePlayerStore(s => s.currentLocationId)
  const locations         = useGameDataStore(s => s.locations)

  const currentLocation = useMemo(
    () => locations.find(l => l.id === currentLocationId) ?? null,
    [locations, currentLocationId]
  )

  const locationServices = currentLocation?.services ?? undefined

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <CharacterCard />

      <div className="border border-slate-700 bg-slate-900 p-3 sm:p-4">
        {/* Header com nome da localização atual */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg shrink-0">{currentLocation?.emoji ?? '🏘️'}</span>
          <h2 className="text-xs font-cinzel tracking-widest uppercase text-slate-500 whitespace-nowrap">
            {currentLocation?.name ?? 'Vila do Despertar'}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
          <span className="text-amber-800 text-[10px]">✦</span>
        </div>

        <ServiceGrid onNavigate={onNavigate} locationServices={locationServices} />
      </div>

      <BiomeMap onEnterBiome={onEnterBiome} />
    </div>
  )
}
