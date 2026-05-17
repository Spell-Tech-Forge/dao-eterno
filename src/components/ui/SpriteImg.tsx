import type { CSSProperties } from 'react'
import { useSpritesStore } from '../../store/spritesStore'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  id:         string
  emoji:      string
  kind:       'item' | 'monster'
  size?:      number   // se não passado, usa o tamanho global configurado no admin
  className?: string
  style?:     CSSProperties
}

export function SpriteImg({ id, emoji, kind, size, className = '', style }: Props) {
  const map         = useSpritesStore(s => kind === 'item' ? s.items : s.monsters)
  const globalSize  = useSettingsStore(s => kind === 'item' ? s.itemSpriteSize : s.monsterSpriteSize)
  const actualSize  = size ?? globalSize
  const url         = map[id]

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
