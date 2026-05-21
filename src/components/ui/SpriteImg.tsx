import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useSpritesStore } from '../../store/spritesStore'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  id:         string
  emoji:      string
  kind:       'item' | 'monster' | 'material'
  size?:      number
  className?: string
  style?:     CSSProperties
}

function pixelRender(url: string): 'pixelated' | 'auto' {
  return /\.(ico|gif)(\?|$)/i.test(url) ? 'pixelated' : 'auto'
}

export function SpriteImg({ id, emoji, kind, size, className = '', style }: Props) {
  const map        = useSpritesStore(s => kind === 'monster' ? s.monsters : s.items)
  const globalSize = useSettingsStore(s =>
    kind === 'monster'  ? s.monsterSpriteSize :
    kind === 'material' ? s.materialSpriteSize :
    s.itemSpriteSize
  )
  const actualSize = size ?? globalSize
  const url        = map[id]

  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  // Sem sprite cadastrado ou erro ao carregar → emoji
  if (!url || error) {
    if (size === undefined) {
      return (
        <span
          className={`flex items-center justify-center w-full h-full ${className}`}
          style={{ fontSize: actualSize * 0.72, lineHeight: 1, ...style }}
        >
          {emoji}
        </span>
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

  // ── Modo fill (size não informado) ────────────────────────────────
  if (size === undefined) {
    return (
      <div className={`relative w-full h-full ${className}`} style={style}>
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-700/40" />
        )}
        <img
          src={url}
          alt={id}
          loading="lazy"
          decoding="async"
          className="w-full h-full"
          style={{
            objectFit: 'contain',
            imageRendering: pixelRender(url),
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // ── Modo tamanho fixo ─────────────────────────────────────────────
  return (
    <div
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: actualSize, height: actualSize, ...style }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-700/40" />
      )}
      <img
        src={url}
        alt={id}
        loading="lazy"
        decoding="async"
        width={actualSize}
        height={actualSize}
        style={{
          objectFit: 'contain',
          imageRendering: pixelRender(url),
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.15s ease',
          width: actualSize,
          height: actualSize,
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}
