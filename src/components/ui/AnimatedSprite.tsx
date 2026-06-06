import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { SpriteConfig } from '../../types/server'

interface Props {
  url:        string | null
  config:     SpriteConfig | null
  size:       number            // altura de exibição desejada (px)
  emoji:      string
  className?: string
  style?:     CSSProperties
}

export function AnimatedSprite({ url, config, size, emoji, className = '', style }: Props) {
  const [frame,    setFrame]    = useState(0)
  const [imgError, setImgError] = useState(false)

  useEffect(() => { setFrame(0); setImgError(false) }, [url])

  useEffect(() => {
    if (!url || !config || imgError) return
    const id = setInterval(() => setFrame(f => (f + 1) % config.frameCount), config.frameDuration)
    return () => clearInterval(id)
  }, [url, config, imgError])

  // Sem URL ou erro → emoji
  if (!url || imgError) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.72, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
      >
        {emoji}
      </span>
    )
  }

  // URL sem config → imagem estática
  if (!config) {
    return (
      <img
        src={url}
        alt=""
        className={className}
        style={{ height: size, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated', ...style }}
        onError={() => setImgError(true)}
      />
    )
  }

  // ── Sprite sheet animado ──────────────────────────────────────────
  const scale       = size / config.frameH
  const frameDispW  = Math.round(config.frameW  * scale)
  const frameDispH  = Math.round(size)
  const sheetDispW  = Math.round(config.sheetW  * scale)
  const sheetDispH  = Math.round(config.sheetH  * scale)

  // posição do frame atual (usa array explícito ou fallback p/ grid com cols)
  const safeFrame = Math.min(frame, config.frameCount - 1)
  const pos = config.frames?.[safeFrame] ?? (() => {
    const c = config.cols ?? 1
    return { x: (safeFrame % c) * config.frameW, y: Math.floor(safeFrame / c) * config.frameH }
  })()

  const offsetX = -Math.round(pos.x * scale)
  const offsetY = -Math.round(pos.y * scale)

  return (
    // Container: tamanho exato de um frame, overflow:hidden corta o resto
    <div
      className={className}
      style={{
        ...style,                  // filter etc. do pai
        display:     'inline-block',
        flexShrink:  0,
        width:       frameDispW,
        height:      frameDispH,
        overflow:    'hidden',
        position:    'relative',
      }}
    >
      {/* Sheet inteiro deslocado para mostrar o frame correto */}
      <img
        src={url}
        alt=""
        style={{
          position:       'absolute',
          display:        'block',
          width:          sheetDispW,
          height:         sheetDispH,
          maxWidth:       'none',
          minWidth:       sheetDispW,
          top:            offsetY,
          left:           offsetX,
          imageRendering: 'pixelated',
        }}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
