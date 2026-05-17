import { useSettingsStore } from '../store/settingsStore'
import type { Rarity } from '../types'

/**
 * Retorna o estilo de borda para um card de item.
 * Se o frame está configurado, usa border-image CSS para controle fino de espessura.
 * Se não, retorna a borda CSS colorida por raridade.
 */
export function useFrameStyle(rarity: Rarity, activeColor: string) {
  const rarityFrames = useSettingsStore(s => s.rarityFrames)
  const frameSlice   = useSettingsStore(s => s.frameSlice)
  const frameWidth   = useSettingsStore(s => s.frameWidth)

  const frameUrl = rarityFrames[rarity]

  if (!frameUrl) {
    return {
      borderWidth:  1,
      borderStyle:  'solid' as const,
      borderColor:  activeColor,
      borderImage:  'none',
    }
  }

  return {
    borderWidth:  frameWidth,
    borderStyle:  'solid' as const,
    borderColor:  'transparent',
    // border-image: source slice / width / outset repeat
    // fill: NÃO incluído — centro da imagem fica transparente, mostrando o card
    borderImage: `url(${frameUrl}) ${frameSlice}% / ${frameWidth}px / 0 stretch`,
  }
}
