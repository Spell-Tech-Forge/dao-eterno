import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { DEFAULT_STAT_CONFIG } from '../../utils/stats'
import type { StatConfig } from '../../utils/stats'

interface FieldDef {
  key: keyof StatConfig
  label: string
  description: string
  min: number
  max: number
  step: number
}

const FIELDS: FieldDef[] = [
  { key: 'atkPerStr',      label: 'ATK por Força',           description: 'atk = força × valor',                             min: 0.1, max: 50,  step: 0.1  },
  { key: 'hpPerVit',       label: 'HP por Vitalidade',       description: 'hpMax = vitalidade × valor',                      min: 1,   max: 500, step: 1    },
  { key: 'defPerDef',      label: 'DEF por Defesa',          description: 'def = defesa × valor',                            min: 0.1, max: 50,  step: 0.1  },
  { key: 'critPerPer',     label: 'Crítico% por Percepção',  description: 'crit% = percepção × valor',                       min: 0.1, max: 10,  step: 0.1  },
  { key: 'baseSpeed',      label: 'Velocidade Base (s/atk)', description: 'ponto de partida do tempo de ataque',             min: 0.5, max: 10,  step: 0.1  },
  { key: 'speedPerAgi',    label: 'Redução por Agilidade',   description: 'speed = base − agilidade × valor',               min: 0.001,max: 0.5, step: 0.001 },
  { key: 'minAgiSpeed',    label: 'Speed Mínimo (Agilidade)',description: 'piso do speed calculado pela agilidade (s/atk)',  min: 0.1, max: 5,   step: 0.05 },
  { key: 'weaponSpeedDiv', label: 'Divisor Speed Arma',      description: 'fórmula: score/(score+valor) — maior = mais lento',min: 10, max: 2000, step: 10  },
  { key: 'minAttackSpeed', label: 'Speed Mínimo (Arma)',     description: 'piso absoluto de ataque com arma (s/atk)',        min: 0.05, max: 2,  step: 0.05 },
]

function preview(cfg: StatConfig) {
  return [
    { label: 'Força 10 → ATK',      value: `${(10 * cfg.atkPerStr).toFixed(0)}`                                      },
    { label: 'Vitalidade 10 → HP',  value: `${(10 * cfg.hpPerVit).toFixed(0)}`                                       },
    { label: 'Defesa 10 → DEF',     value: `${(10 * cfg.defPerDef).toFixed(0)}`                                       },
    { label: 'Percepção 10 → Crit', value: `${(10 * cfg.critPerPer).toFixed(1)}%`                                     },
    { label: 'Agilidade 8 → Speed', value: `${Math.max(cfg.minAgiSpeed, cfg.baseSpeed - 8 * cfg.speedPerAgi).toFixed(2)}s` },
    { label: 'Arma T1 (pts=8)',     value: (() => { const s=8/(8+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
    { label: 'Arma T5 (pts=85)',    value: (() => { const s=85/(85+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
    { label: 'Arma T10 (pts=4525)', value: (() => { const s=4525/(4525+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
  ]
}

export function StatsConfigPanel() {
  const [config,  setConfig]  = useState<StatConfig>(DEFAULT_STAT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<StatConfig>('/api/admin/stat-config')
      .then(data => { setConfig({ ...DEFAULT_STAT_CONFIG, ...data }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/stat-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function reset() { setConfig(DEFAULT_STAT_CONFIG) }

  const previews = preview(config)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
          Fórmulas de Atributos
        </h2>
        <div className="flex items-center gap-3">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo com sucesso.</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={reset}
            className="px-3 py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
            Restaurar Padrões
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Carregando...</div>
      ) : (
        <div className="grid grid-cols-[1fr_280px] gap-6">

          {/* ── Campos ── */}
          <div className="space-y-1">
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-900 grid grid-cols-[220px_120px_1fr] gap-4 text-xs text-slate-500 uppercase tracking-widest">
              <div>Parâmetro</div>
              <div>Valor</div>
              <div>Descrição</div>
            </div>
            {FIELDS.map(f => (
              <div key={f.key}
                className="px-3 py-2.5 border-b border-slate-800/60 bg-slate-900 grid grid-cols-[220px_120px_1fr] gap-4 items-center">
                <label className="text-xs font-semibold text-slate-300 font-cinzel">{f.label}</label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={config[f.key]}
                  onChange={e => setConfig(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums w-full"
                />
                <span className="text-xs text-slate-600">{f.description}</span>
              </div>
            ))}
          </div>

          {/* ── Preview ao vivo ── */}
          <div className="space-y-2">
            <div className="text-xs font-cinzel tracking-widest uppercase text-slate-500 pb-2 border-b border-slate-800">
              Preview (Agilidade 8)
            </div>
            {previews.map(p => (
              <div key={p.label} className="flex items-center justify-between text-xs border border-slate-800 bg-slate-900 px-3 py-2">
                <span className="text-slate-500">{p.label}</span>
                <span className="font-bold text-teal-400 tabular-nums">{p.value}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-700 pt-2 leading-relaxed">
              Alterações no servidor requerem reload do jogo para aplicar.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}
