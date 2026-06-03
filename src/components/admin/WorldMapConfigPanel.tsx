import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'

interface MapConfig {
  backgroundUrl:      string | null
  backgroundOpacity:  number
  backgroundPosition: string
  initialScale:       number
}

const DEFAULT: MapConfig = {
  backgroundUrl:      null,
  backgroundOpacity:  0.15,
  backgroundPosition: 'center',
  initialScale:       1.0,
}

const POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']

const inp = 'w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-600'
const sel = `${inp} cursor-pointer`

export function WorldMapConfigPanel() {
  const [cfg,       setCfg]       = useState<MapConfig>({ ...DEFAULT })
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<MapConfig>('/api/game/world-map-config')
      .then(d => setCfg({ ...DEFAULT, ...d }))
      .catch(() => {})
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg(''); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const token = localStorage.getItem('dao_token')
      const res = await fetch('/api/upload?type=map&id=world_map_bg', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      setCfg(c => ({ ...c, backgroundUrl: data.url! }))
      setUploadMsg('✓ Imagem enviada!')
      setTimeout(() => setUploadMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/world-map-config', cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  function reset() { setCfg({ ...DEFAULT }) }
  function removeImage() { setCfg(c => ({ ...c, backgroundUrl: null })) }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400">Configuração do Mapa</h2>
          <p className="text-xs text-slate-500 mt-1">Personalize o fundo do Mapa do Mundo.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved     && <span className="text-sm text-teal-400">✓ Salvo!</span>}
          {uploadMsg && <span className="text-sm text-teal-400">{uploadMsg}</span>}
          {error     && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={reset}
            className="px-3 py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
            Resetar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="space-y-5 border border-slate-700 bg-slate-900 p-4">

        {/* Upload de arquivo */}
        <div>
          <label className="text-xs text-slate-500 block mb-2">Imagem de fundo</label>

          {/* Área de drop / botão */}
          <div
            className="border-2 border-dashed border-slate-700 hover:border-teal-700 transition-colors rounded p-4 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {cfg.backgroundUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={cfg.backgroundUrl}
                  alt="preview"
                  className="w-20 h-14 object-cover border border-slate-700 rounded shrink-0"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs text-teal-400 truncate">{cfg.backgroundUrl}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Clique para trocar</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeImage() }}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-900/40 hover:border-red-700 transition-colors">
                  Remover
                </button>
              </div>
            ) : (
              <div className="py-2 text-slate-500">
                {uploading ? (
                  <p className="text-sm text-teal-400 animate-pulse">Enviando...</p>
                ) : (
                  <>
                    <div className="text-3xl mb-1 opacity-30">🖼️</div>
                    <p className="text-sm">Clique para selecionar uma imagem</p>
                    <p className="text-[10px] mt-0.5">PNG, JPG, WebP, SVG — máx. 4 MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

          {/* Ou cole uma URL */}
          <div className="mt-2">
            <label className="text-[10px] text-slate-600 block mb-1">Ou cole uma URL externa</label>
            <input
              className={inp}
              placeholder="https://..."
              value={cfg.backgroundUrl?.startsWith('/uploads') ? '' : (cfg.backgroundUrl ?? '')}
              onChange={e => setCfg(c => ({ ...c, backgroundUrl: e.target.value || null }))}
            />
          </div>
        </div>

        {/* Zoom inicial */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Zoom inicial: <span className="text-amber-400 font-bold">{Math.round((cfg.initialScale ?? 1.0) * 100)}%</span>
          </label>
          <input
            type="range" min={0.25} max={2} step={0.05}
            value={cfg.initialScale ?? 1.0}
            onChange={e => setCfg(c => ({ ...c, initialScale: parseFloat(e.target.value) }))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
            <span>25%</span><span>100%</span><span>200%</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">Zoom ao abrir o mapa. O conteúdo é centralizado automaticamente.</p>
        </div>

        {/* Opacidade */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Opacidade da imagem: <span className="text-amber-400 font-bold">{Math.round(cfg.backgroundOpacity * 100)}%</span>
          </label>
          <input
            type="range" min={0} max={1} step={0.05}
            value={cfg.backgroundOpacity}
            onChange={e => setCfg(c => ({ ...c, backgroundOpacity: parseFloat(e.target.value) }))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
            <span>0% (invisível)</span><span>50%</span><span>100% (opaco)</span>
          </div>
        </div>

        {/* Posição */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Posição do fundo</label>
          <select className={sel} value={cfg.backgroundPosition}
            onChange={e => setCfg(c => ({ ...c, backgroundPosition: e.target.value }))}>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Preview */}
        {cfg.backgroundUrl && (
          <div>
            <label className="text-xs text-slate-500 block mb-1">Preview</label>
            <div className="relative border border-slate-700 overflow-hidden rounded" style={{ height: 180 }}>
              <div className="absolute inset-0 bg-slate-950" />
              <div className="absolute inset-0" style={{
                backgroundImage:    `url(${cfg.backgroundUrl})`,
                backgroundSize:     'cover',
                backgroundPosition: cfg.backgroundPosition,
                opacity:            cfg.backgroundOpacity,
              }} />
              <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-60">
                {['🏘️','🏙️','🏯','🗼'].map((e, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border-2 border-teal-600/60 bg-teal-950/30 flex items-center justify-center text-lg">{e}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-500">Preview</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600 space-y-1 border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-slate-500 font-semibold mb-1">💡 Dicas</p>
        <p>• Imagens de mapa fantasia funcionam melhor — busque "fantasy map PNG".</p>
        <p>• Use opacidade entre 10–25% para manter legibilidade dos nós.</p>
        <p>• Imagens enviadas ficam em <code className="text-slate-400">/uploads/maps/</code> no servidor.</p>
      </div>
    </div>
  )
}
