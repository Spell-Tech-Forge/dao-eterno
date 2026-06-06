import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

interface SpriteConfig {
  frameW: number
  frameH: number
  cols: number
  frameCount: number
  frameDuration: number
}

interface Props {
  url: string | null
  config: SpriteConfig | null
  size: number
  emoji: string
  className?: string
  style?: CSSProperties
}

export function AnimatedSprite({ url, config, size, emoji, className = '', style }: Props) {
  const [frame, setFrame]     = useState(0)
  const [imgError, setImgError] = useState(false)

  useEffect(() => { setFrame(0); setImgError(false) }, [url])

  useEffect(() => {
    if (!url || !config || imgError) return
    const id = setInterval(() => setFrame(f => (f + 1) % config.frameCount), config.frameDuration)
    return () => clearInterval(id)
  }, [url, config, imgError])

  // No URL or error → emoji fallback
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

  // URL but no config → static image (backward compat)
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
  const scale    = size / config.frameH
  const frameW   = Math.round(config.frameW * scale)
  const frameH   = Math.round(size)
  const rows     = Math.ceil(config.frameCount / config.cols)
  const col      = frame % config.cols
  const row      = Math.floor(frame / config.cols)

  return (
    // Container: exatamente um frame visível, clip via overflow:hidden
    <div
      className={className}
      style={{
        ...style,                    // filter etc. do pai
        display:    'inline-block',
        flexShrink: 0,
        width:      frameW,
        height:     frameH,
        overflow:   'hidden',
        position:   'relative',
      }}
    >
      {/* Sheet inteiro posicionado para mostrar o frame correto */}
      <img
        src={url}
        alt=""
        style={{
          position:        'absolute',
          display:         'block',
          width:           config.cols * frameW,
          height:          rows * frameH,
          minWidth:        config.cols * frameW,
          maxWidth:        'none',      // anula max-width:100% do reset CSS/Tailwind
          top:             -(row * frameH),
          left:            -(col * frameW),
          imageRendering:  'pixelated',
        }}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
