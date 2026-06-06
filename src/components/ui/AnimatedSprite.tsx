import { useEffect, useRef, useState } from 'react'
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
  const [frame, setFrame] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError]   = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Reset animation when url/config changes
  useEffect(() => {
    setFrame(0)
    setLoaded(false)
    setError(false)
  }, [url, config])

  // Preload image so we know when it's ready
  useEffect(() => {
    if (!url || !config) return
    const img = new Image()
    img.onload  = () => setLoaded(true)
    img.onerror = () => setError(true)
    img.src = url
  }, [url, config])

  // Animation interval
  useEffect(() => {
    if (!url || !config || !loaded || error) return
    const id = setInterval(() => {
      setFrame(f => (f + 1) % config.frameCount)
    }, config.frameDuration)
    return () => clearInterval(id)
  }, [url, config, loaded, error])

  // No URL or error → emoji fallback
  if (!url || error) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.72, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
      >
        {emoji}
      </span>
    )
  }

  // URL but no config → static image
  if (!config) {
    return (
      <div
        className={`relative inline-flex shrink-0 ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-700/40" />}
        <img
          ref={imgRef}
          src={url}
          alt=""
          width={size}
          height={size}
          style={{
            objectFit: 'contain',
            imageRendering: 'pixelated',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.15s ease',
            width: size,
            height: size,
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Animated sprite sheet
  const scale    = size / config.frameH
  const displayW = config.frameW * scale
  const displayH = size
  const rows     = Math.ceil(config.frameCount / config.cols)
  const col      = frame % config.cols
  const row      = Math.floor(frame / config.cols)

  return (
    <div
      className={`inline-block shrink-0 overflow-hidden ${className}`}
      style={{
        width:  displayW,
        height: displayH,
        backgroundImage: loaded ? `url(${url})` : 'none',
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${config.cols * displayW}px ${rows * displayH}px`,
        backgroundPosition: `${-col * displayW}px ${-row * displayH}px`,
        imageRendering: 'pixelated',
        ...style,
      }}
    >
      {!loaded && <div className="w-full h-full animate-pulse bg-slate-700/40" />}
    </div>
  )
}
