import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { type DismantleConfig, DEFAULT_DISMANTLE_CONFIG } from '../../utils/dismantle'

export function DismantleConfigPanel() {
  const [cfg,     setCfg]     = useState<DismantleConfig>(DEFAULT_DISMANTLE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<DismantleConfig>('/api/admin/dismantle-config')
      .then(data => { setCfg({ ...DEFAULT_DISMANTLE_CONFIG, ...data }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/dismantle-config', cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function Field({ label, desc, min, max, step, value, onChange }: {
    label: string; desc: string; min: number; max: number; step: number
    value: number; onChange: (v: number) => void
  }) {
    return (
      <div className="flex items-start gap-4 py-3 border-b border-slate-800">
        <div className="w-48 shrink-0">
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className="w-24 bg-slate-800 border border-slate-700 text-amber-300 text-sm px-2 py-1 text-center focus:outline-none focus:border-amber-500 tabular-nums"
          />
          {max <= 1 && <span className="text-xs text-slate-500">(0–1, ex: 0.40 = 40%)</span>}
        </div>
      </div>
    )
  }

  const ratePreview = Math.min(cfg.maxRate, cfg.baseRate + 10 * cfg.levelBonus)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
          Configuração de Desmonte
        </h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-teal-400">✓ Salvo com sucesso.</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Carregando...</div>
      ) : (
        <>
          <div className="border border-slate-700 bg-slate-900 divide-y divide-slate-800">
            <div className="px-4 py-2 bg-slate-800/50">
              <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Taxa de Recuperação</span>
            </div>

            <div className="px-4">
              <Field
                label="Taxa Base"
                desc="Fração mínima dos ingredientes devolvida (0.40 = 40%)"
                min={0} max={1} step={0.01}
                value={cfg.baseRate}
                onChange={v => setCfg(c => ({ ...c, baseRate: Math.max(0, Math.min(1, v)) }))}
              />
              <Field
                label="Taxa Máxima"
                desc="Teto da fração — nível alto de forja não ultrapassa isso"
                min={0} max={1} step={0.01}
                value={cfg.maxRate}
                onChange={v => setCfg(c => ({ ...c, maxRate: Math.max(0, Math.min(1, v)) }))}
              />
              <Field
                label="Bônus por Nível"
                desc="Incremento da taxa por nível de forja (0.006 = +0.6% por nível)"
                min={0} max={0.1} step={0.001}
                value={cfg.levelBonus}
                onChange={v => setCfg(c => ({ ...c, levelBonus: Math.max(0, v) }))}
              />
            </div>

            <div className="px-4 py-3 bg-slate-800/30">
              <div className="text-xs text-slate-500 mb-1">Prévia — nível de forja 10:</div>
              <div className="text-sm font-bold text-teal-400">
                Taxa = {(ratePreview * 100).toFixed(1)}% dos ingredientes da receita
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Base {(cfg.baseRate * 100).toFixed(0)}% + 10 × {(cfg.levelBonus * 100).toFixed(2)}% = {((cfg.baseRate + 10 * cfg.levelBonus) * 100).toFixed(1)}% → limitado a {(cfg.maxRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="border border-slate-700 bg-slate-900 divide-y divide-slate-800">
            <div className="px-4 py-2 bg-slate-800/50">
              <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Material Fallback</span>
              <div className="text-xs text-slate-600 mt-0.5">Devolvido quando o item não tem receita cadastrada</div>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-48 shrink-0">ID do material fallback</span>
                <input
                  type="text" value={cfg.fallbackItemId}
                  onChange={e => setCfg(c => ({ ...c, fallbackItemId: e.target.value }))}
                  placeholder="spiritual_essence"
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-2 py-1 w-52 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-48 shrink-0">
                  <div className="text-sm text-slate-400">Qtd base por tier</div>
                  <div className="text-xs text-slate-500">Multiplicado pelo tier do item e pela taxa</div>
                </div>
                <input
                  type="number" min={1} max={20} step={1} value={cfg.fallbackQtyPerTier}
                  onChange={e => setCfg(c => ({ ...c, fallbackQtyPerTier: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-24 bg-slate-800 border border-slate-700 text-amber-300 text-sm px-2 py-1 text-center focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
              <div className="text-xs text-slate-600 pt-1">
                Exemplo: item Tier 3, forja Nv.10 → {Math.ceil(cfg.fallbackQtyPerTier * 3 * ratePreview)}× {cfg.fallbackItemId || 'spiritual_essence'}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Se o item tiver receita: devolve (taxa × qtd de cada ingrediente), arredondado para cima, mínimo 1.
            Se não tiver receita: devolve o material fallback com quantidade = taxa × qtdBasePorTier × tier.
          </p>
        </>
      )}
    </div>
  )
}
