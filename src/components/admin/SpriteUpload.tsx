import { useRef, useState } from 'react'

interface Props {
  value:    string | null
  onChange: (url: string | null) => void
  type:     'item' | 'monster'
  entityId: string
}

export function SpriteUpload({ value, onChange, type, entityId }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Máximo 4 MB.'); return }

    setError(''); setLoading(true)
    const form = new FormData()
    form.append('file', file)

    const token = localStorage.getItem('dao_token') ?? ''
    try {
      const res = await fetch(
        `/api/upload?type=${type}&id=${encodeURIComponent(entityId)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      )
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      onChange(data.url ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-widest block mb-2">Sprite</label>

      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className="w-16 h-16 border border-border bg-surface-2 rounded flex items-center justify-center shrink-0 overflow-hidden">
          {value
            ? <img src={value} alt="sprite" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
            : <span className="text-muted text-xs text-center leading-tight px-1">Sem sprite</span>
          }
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading || !entityId}
            className="px-3 py-1.5 text-xs border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : value ? '↑ Trocar imagem' : '↑ Enviar sprite'}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-3 py-1.5 text-xs border border-danger/40 text-danger bg-danger/5 rounded hover:bg-danger/15 transition-colors"
            >
              Remover
            </button>
          )}

          {!entityId && (
            <span className="text-xs text-muted">Preencha o ID primeiro.</span>
          )}

          <span className="text-xs text-muted">PNG / WebP · max 4 MB · fundo transparente</span>
        </div>
      </div>

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
    </div>
  )
}
