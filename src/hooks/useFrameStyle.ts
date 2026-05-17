import { useSettingsStore } from '../store/settingsStore'
import type { Rarity } from '../types'

interface FrameStyle {
  borderWidth:  number
  borderStyle:  'solid'
  borderColor:  string
  borderImage:  string
  borderW:      number  // valor real usado (para cálculo de content area)
}

export function useFrameStyle(rarity: Rarity, activeColor: string): FrameStyle {
  const rarityFrames = useSettingsStore(s => s.rarityFrames)
  const frameSlice   = useSettingsStore(s => s.frameSlice)
  const frameWidth   = useSettingsStore(s => s.frameWidth)

  const frameUrl = rarityFrames[rarity]

  if (!frameUrl) {
    return {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: activeColor,
      borderImage: 'none',
      borderW:     1,
    }
  }

  return {
    borderWidth:  frameWidth,
    borderStyle:  'solid',
    borderColor:  'transparent',
    borderImage:  `url(${frameUrl}) ${frameSlice}% / ${frameWidth}px / 0 stretch`,
    borderW:      frameWidth,
  }
}
