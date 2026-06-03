import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface MapConfig {
  backgroundUrl:      string | null
  backgroundOpacity:  number
  backgroundPosition: string
}

const DEFAULT: MapConfig = {
  backgroundUrl:      null,
  backgroundOpacity:  0.15,
  backgroundPosition: 'center',
}

const POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']

const inp = 'w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-600'
const sel = `${inp} cursor-pointer`

export function WorldMapConfigPanel() {
  const [cfg,    setCfg]    = useState<MapConfig>({ ...DEFAULT })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    api.get<MapConfig>('/api/game/world-map-config')
      .then(d => setCfg({ ...DEFAULT, ...d }))
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/world-map-config', cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  function reset() { setCfg({ ...DEFAULT }) }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400">Configuração do Mapa</h2>
          <p className="text-xs text-slate-500 mt-1">Personalize o fundo do Mapa do Mundo.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo!</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
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

      <div className="space-y-4 border border-slate-700 bg-slate-900 p-4">

        {/* URL da imagem */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">URL da imagem de fundo</label>
          <input
            className={inp}
            placeholder="https://... (deixe vazio para remover)"
            value={cfg.backgroundUrl ?? ''}
            onChange={e => setCfg(c => ({ ...c, backgroundUrl: e.target.value || null }))}
          />
          <p className="text-[10px] text-slate-600 mt-1">
            Suporta qualquer URL de imagem (PNG, JPG, WebP). Use imagens de mapa fantasia para melhor resultado.
          </p>
        </div>

        {/* Opacidade */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Opacidade: <span className="text-amber-400 font-bold">{Math.round(cfg.backgroundOpacity * 100)}%</span>
          </label>
          <input
            type="range" min={0} max={1} step={0.05}
            value={cfg.backgroundOpacity}
            onChange={e => setCfg(c => ({ ...c, backgroundOpacity: parseFloat(e.target.value) }))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
            <span>0% (invisível)</span>
            <span>100% (opaco)</span>
          </div>
        </div>

        {/* Posição */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Posição do fundo</label>
          <select className={sel} value={cfg.backgroundPosition}
            onChange={e => setCfg(c => ({ ...c, backgroundPosition: e.target.value }))}>
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {cfg.backgroundUrl && (
          <div>
            <label className="text-xs text-slate-500 block mb-1">Preview</label>
            <div className="relative border border-slate-700 overflow-hidden" style={{ height: 180 }}>
              {/* Fundo simulando o mapa */}
              <div className="absolute inset-0 bg-slate-950" />
              <div className="absolute inset-0" style={{
                backgroundImage: `url(${cfg.backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: cfg.backgroundPosition,
                opacity: cfg.backgroundOpacity,
              }} />
              {/* Nós simulados */}
              <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-60">
                {['🏘️', '🏙️', '🏯', '🗼'].map((e, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border-2 border-teal-600/60 bg-teal-950/30 flex items-center justify-center text-lg">{e}</div>
                    <div className="w-16 h-0.5 bg-slate-700" />
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
        <p>• Imagens de mapa fantasia funcionam melhor — busque por "fantasy map PNG" ou "RPG world map".</p>
        <p>• Use opacidade entre 10–25% para manter legibilidade dos nós.</p>
        <p>• A imagem é carregada pela URL — não é feito upload no servidor.</p>
      </div>
    </div>
  )
}
