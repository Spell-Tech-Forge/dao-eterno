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
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-6">
      <CharacterCard />
      <ServiceGrid onNavigate={onNavigate} />
      <BiomeMap onEnterBiome={onEnterBiome} />
    </div>
  )
}
