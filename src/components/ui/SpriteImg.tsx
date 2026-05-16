import type { CSSProperties } from 'react'
import { useSpritesStore } from '../../store/spritesStore'

interface Props {
  id:         string
  emoji:      string
  kind:       'item' | 'monster'
  size?:      number
  className?: string
  style?:     CSSProperties
}

/**
 * Exibe o sprite do banco se disponível, senão cai no emoji como fallback.
 */
export function SpriteImg({ id, emoji, kind, size = 32, className = '', style }: Props) {
  const map = useSpritesStore(s => kind === 'item' ? s.items : s.monsters)
  const url = map[id]

  if (url) {
    return (
      <img
        src={url}
        alt={id}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', imageRendering: 'pixelated', ...style }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <span
      className={className}
      style={{ fontSize: size * 0.72, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {emoji}
    </span>
  )
}
