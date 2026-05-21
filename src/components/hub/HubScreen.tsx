import type { Screen } from '../../types'
import { CharacterCard } from './CharacterCard'
import { ServiceGrid } from './ServiceGrid'
import { BiomeMap } from './BiomeMap'

interface Props {
  onNavigate: (screen: Screen) => void
  onEnterBiome: (biomeId: string) => void
}

export function HubScreen({ onNavigate, onEnterBiome }: Props) {
  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <CharacterCard />
      <div className="border border-slate-700 bg-slate-900 p-3 sm:p-4">
        <ServiceGrid onNavigate={onNavigate} />
      </div>
      <BiomeMap onEnterBiome={onEnterBiome} />
    </div>
  )
}
