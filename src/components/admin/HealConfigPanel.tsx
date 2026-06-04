import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface HealConfig {
  costPct: number   // fração do HP faltando (ex: 0.12 = 12%)
  minCost: number   // custo mínimo em ouro
}

const DEFAULT: HealConfig = { costPct: 0.12, minCost: 3 }

export function HealConfigPanel() {
  const [cfg,    setCfg]    = useState<HealConfig>({ ...DEFAULT })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    api.get<HealConfig>('/api/game/heal-config')
      .then(d => setCfg({ ...DEFAULT, ...d }))
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/heal-config', cfg)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  // Preview: custo para diferentes valores de HP faltando
  const previewHps = [50, 100, 200, 500, 1000, 5000]

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400">Custo de Cura</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fórmula: <code className="text-slate-300">max(mínimo, ceil(HP_faltando × %custo))</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo!</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={() => setCfg({ ...DEFAULT })}
            className="px-3 py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
            Resetar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="border border-slate-700 bg-slate-900 p-4 space-y-5">

        {/* % do HP faltando */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500">% do HP faltando cobrado</label>
            <span className="text-amber-400 font-bold text-sm">{(cfg.costPct * 100).toFixed(1)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01}
            value={cfg.costPct}
            onChange={e => setCfg(c => ({ ...c, costPct: parseFloat(e.target.value) }))}
            className="w-full accent-amber-500" />
          <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
            <span>0% (gratuito)</span><span>50%</span><span>100% (caro)</span>
          </div>
        </div>

        {/* Custo mínimo */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Custo mínimo (ouro): <span className="text-amber-400 font-bold">{cfg.minCost} 🪙</span>
          </label>
          <input type="number" min={0} max={9999}
            value={cfg.minCost}
            onChange={e => setCfg(c => ({ ...c, minCost: Math.max(0, parseInt(e.target.value) || 0) }))}
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500" />
        </div>

        {/* Preview */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Preview de custo por HP faltando:</p>
          <div className="space-y-1">
            {previewHps.map(hp => {
              const cost = Math.max(cfg.minCost, Math.ceil(hp * cfg.costPct))
              return (
                <div key={hp} className="flex items-center justify-between text-xs border border-slate-800 bg-slate-800/40 px-3 py-1.5">
                  <span className="text-slate-400">❤️ {hp} HP faltando</span>
                  <span className="font-bold text-amber-400">{cost.toLocaleString('pt-BR')} 🪙</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
