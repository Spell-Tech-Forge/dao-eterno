import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'

interface GameBgConfig {
  url:           string | null
  opacity:       number
  size:          string
  position:      string
  panelOpacity:  number
  screenOpacity: number
}

const DEFAULT: GameBgConfig = {
  url:           null,
  opacity:       0.15,
  size:          'cover',
  position:      'center',
  panelOpacity:  1,
  screenOpacity: 1,
}

const SIZES     = ['cover', 'contain', 'auto', '100% 100%', '50%', '75%']
const POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']

export function GameBgPanel() {
  const [cfg,       setCfg]       = useState<GameBgConfig>({ ...DEFAULT })
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<GameBgConfig>('/api/admin/game-bg-config')
      .then(d => setCfg({ ...DEFAULT, ...d }))
      .catch(() => {})
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg(''); setError('')
    try {
      const form  = new FormData()
      form.append('file', file)
      const token = localStorage.getItem('dao_token')
      const res   = await fetch('/api/upload?type=map&id=game_bg', {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    form,
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      setCfg(c => ({ ...c, url: data.url! }))
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
      await api.post('/api/admin/game-bg-config', cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function handleRemove() {
    setCfg(c => ({ ...c, url: null }))
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
            Fundo do Jogo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Imagem de fundo exibida em todas as telas dos jogadores. Salve para aplicar em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved     && <span className="text-sm text-teal-400">✓ Salvo.</span>}
          {uploadMsg && <span className="text-sm text-teal-400">{uploadMsg}</span>}
          {error     && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">

        {/* ── Controles ── */}
        <div className="space-y-1">

          {/* Upload */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 space-y-3">
            <div className="text-xs font-cinzel text-amber-700/70 uppercase tracking-wider">Imagem</div>
            {cfg.url ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 truncate flex-1">{cfg.url}</span>
                <button onClick={handleRemove}
                  className="px-3 py-1.5 text-xs border border-red-800/50 text-red-400 hover:bg-red-950/30 transition-colors shrink-0">
                  Remover
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-600">Nenhuma imagem configurada.</p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-xs border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50">
                {uploading ? 'Enviando...' : '📤 Enviar imagem'}
              </button>
              <span className="text-xs text-slate-600">PNG, JPG ou WebP recomendado</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* Opacidade */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-[200px_1fr_60px] gap-4 items-center">
            <label className="text-xs font-semibold text-slate-300 font-cinzel">Opacidade</label>
            <input
              type="range" min={0.01} max={1} step={0.01}
              value={cfg.opacity}
              onChange={e => setCfg(c => ({ ...c, opacity: parseFloat(e.target.value) }))}
              className="accent-amber-500"
            />
            <input
              type="number" min={0.01} max={1} step={0.01}
              value={cfg.opacity}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setCfg(c => ({ ...c, opacity: v })) }}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums"
            />
          </div>

          {/* Tamanho */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-xs font-semibold text-slate-300 font-cinzel">Tamanho</label>
            <select value={cfg.size} onChange={e => setCfg(c => ({ ...c, size: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-500">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Posição */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-xs font-semibold text-slate-300 font-cinzel">Posição</label>
            <select value={cfg.position} onChange={e => setCfg(c => ({ ...c, position: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-500">
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* ── Seção opacidade dos painéis ── */}
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-700">
            <div className="text-xs font-cinzel text-amber-700/70 uppercase tracking-wider">Opacidade dos Painéis</div>
            <p className="text-[10px] text-slate-600 mt-0.5">Controla a transparência das janelas e cards do jogo. Deixe abaixo de 1.0 para o fundo aparecer através.</p>
          </div>

          {/* Painéis e Cards */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-[200px_1fr_60px] gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-slate-300 font-cinzel">Painéis e Cards</label>
              <div className="text-[10px] text-slate-600 mt-0.5">bg cinza escuro (bg-slate-900/800)</div>
            </div>
            <input
              type="range" min={0} max={1} step={0.05}
              value={cfg.panelOpacity}
              onChange={e => {
                const v = parseFloat(e.target.value)
                setCfg(c => ({ ...c, panelOpacity: v }))
                document.documentElement.style.setProperty('--ui-panel-opacity', String(v))
              }}
              className="accent-amber-500"
            />
            <input
              type="number" min={0} max={1} step={0.05}
              value={cfg.panelOpacity}
              onChange={e => {
                const v = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0))
                setCfg(c => ({ ...c, panelOpacity: v }))
                document.documentElement.style.setProperty('--ui-panel-opacity', String(v))
              }}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums"
            />
          </div>

          {/* Fundo das telas */}
          <div className="px-3 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-[200px_1fr_60px] gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-slate-300 font-cinzel">Fundo das Telas</label>
              <div className="text-[10px] text-slate-600 mt-0.5">bg quase preto (bg-slate-950)</div>
            </div>
            <input
              type="range" min={0} max={1} step={0.05}
              value={cfg.screenOpacity}
              onChange={e => {
                const v = parseFloat(e.target.value)
                setCfg(c => ({ ...c, screenOpacity: v }))
                document.documentElement.style.setProperty('--ui-screen-opacity', String(v))
              }}
              className="accent-amber-500"
            />
            <input
              type="number" min={0} max={1} step={0.05}
              value={cfg.screenOpacity}
              onChange={e => {
                const v = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0))
                setCfg(c => ({ ...c, screenOpacity: v }))
                document.documentElement.style.setProperty('--ui-screen-opacity', String(v))
              }}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums"
            />
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="space-y-2">
          <div className="text-xs font-cinzel tracking-widest uppercase text-slate-500 pb-2 border-b border-slate-800">
            Preview
          </div>
          <div className="relative border border-slate-700 overflow-hidden bg-slate-950"
            style={{ height: 220 }}>
            {cfg.url && (
              <div className="absolute inset-0"
                style={{
                  backgroundImage:    `url(${cfg.url})`,
                  backgroundSize:     cfg.size,
                  backgroundPosition: cfg.position,
                  backgroundRepeat:   'no-repeat',
                  opacity:            cfg.opacity,
                }}
              />
            )}
            {!cfg.url && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs">
                Sem imagem
              </div>
            )}
            {/* Simulação de conteúdo */}
            <div className="absolute inset-0 flex flex-col gap-1.5 p-3 pointer-events-none">
              <div className="h-2 w-24 bg-slate-700/60 rounded-sm" />
              <div className="h-2 w-16 bg-slate-700/40 rounded-sm" />
              <div className="mt-2 h-12 w-full bg-slate-800/60 rounded-sm border border-slate-700/40" />
              <div className="h-12 w-full bg-slate-800/60 rounded-sm border border-slate-700/40" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            O fundo aparece atrás de todas as telas do jogo com a opacidade configurada. Players precisam recarregar a página para ver mudanças.
          </p>
        </div>

      </div>
    </div>
  )
}
