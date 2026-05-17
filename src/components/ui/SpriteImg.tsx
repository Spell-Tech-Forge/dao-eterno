import type { CSSProperties } from 'react'
import { useSpritesStore } from '../../store/spritesStore'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  id:         string
  emoji:      string
  kind:       'item' | 'monster' | 'material'
  size?:      number   // se não passado, usa o tamanho global configurado no admin
  className?: string
  style?:     CSSProperties
}

export function SpriteImg({ id, emoji, kind, size, className = '', style }: Props) {
  const map        = useSpritesStore(s => kind === 'monster' ? s.monsters : s.items)
  const globalSize = useSettingsStore(s =>
    kind === 'monster'  ? s.monsterSpriteSize :
    kind === 'material' ? s.materialSpriteSize :
    s.itemSpriteSize
  )
  const actualSize  = size ?? globalSize
  const url         = map[id]

  // Sem size explícito → preenche o container (responsivo)
  if (size === undefined) {
    if (url) {
      return (
        <img
          src={url}
          alt={id}
          className={`w-full h-full ${className}`}
          style={{ objectFit: 'contain', imageRendering: 'pixelated', ...style }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )
    }
    return (
      <span
        className={`flex items-center justify-center w-full h-full ${className}`}
        style={{ fontSize: actualSize * 0.72, lineHeight: 1, ...style }}
      >
        {emoji}
      </span>
    )
  }

  // Com size explícito → dimensão fixa (painéis de detalhe, etc.)
  if (url) {
    return (
      <img
        src={url}
        alt={id}
        width={actualSize}
        height={actualSize}
        className={className}
        style={{ objectFit: 'contain', imageRendering: 'pixelated', ...style }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <span
      className={className}
      style={{ fontSize: actualSize * 0.72, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {emoji}
    </span>
  )
}
