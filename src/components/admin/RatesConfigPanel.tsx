import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface RatesConfig {
  drop_rate_multiplier: number
  qi_multiplier:        number
  material_multiplier:  number
}

const DEFAULT: RatesConfig = {
  drop_rate_multiplier: 1.0,
  qi_multiplier:        1.0,
  material_multiplier:  1.0,
}

interface FieldDef {
  key:         keyof RatesConfig
  label:       string
  description: string
  min:         number
  max:         number
  step:        number
  preview:     (v: number) => string
  buffDir:     'high' | 'low'  // 'high' = acima de 1 é buff, 'low' = abaixo de 1 é buff
}

const FIELDS: FieldDef[] = [
  {
    key:         'drop_rate_multiplier',
    label:       'Drop Rate',
    description: 'Multiplica a chance de drop de todos os itens em todos os biomas.',
    min: 0.1, max: 5.0, step: 0.1,
    preview:  v => `${(v * 100).toFixed(0)}% da taxa base`,
    buffDir:  'high',
  },
  {
    key:         'qi_multiplier',
    label:       'Qi para Romper',
    description: 'Fração do qi_max exigida para poder romper. Abaixo de 1.0 facilita o avanço.',
    min: 0.1, max: 2.0, step: 0.05,
    preview:  v => `requer ${Math.min(100, v * 99).toFixed(1)}% do qi_max`,
    buffDir:  'low',
  },
  {
    key:         'material_multiplier',
    label:       'Custo de Materiais',
    description: 'Multiplica materiais consumidos em craft, forge, ascensão e reparo.',
    min: 0.1, max: 5.0, step: 0.1,
    preview:  v => `${(v * 100).toFixed(0)}% do custo base`,
    buffDir:  'low',
  },
]

function statusColor(v: number, buffDir: 'high' | 'low'): string {
  const isBuff = buffDir === 'high' ? v > 1 : v < 1
  const isNerf = buffDir === 'high' ? v < 1 : v > 1
  if (isBuff) return 'text-teal-400'
  if (isNerf) return 'text-red-400'
  return 'text-slate-400'
}

function statusLabel(v: number, buffDir: 'high' | 'low'): string {
  const isBuff = buffDir === 'high' ? v > 1 : v < 1
  const isNerf = buffDir === 'high' ? v < 1 : v > 1
  if (isBuff) return 'BUFF'
  if (isNerf) return 'NERF'
  return 'PADRÃO'
}

export function RatesConfigPanel() {
  const [config,  setConfig]  = useState<RatesConfig>({ ...DEFAULT })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<RatesConfig>('/api/admin/rates-config')
      .then(data => { setConfig({ ...DEFAULT, ...data }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/rates-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
            Multiplicadores Globais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Afetam todos os jogadores em tempo real. Aplicados no servidor — sem reload necessário.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo.</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={() => setConfig({ ...DEFAULT })}
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
        <div className="space-y-1">
          <div className="px-3 py-1.5 bg-slate-900 grid grid-cols-[180px_1fr_160px_70px] gap-4 text-xs text-slate-600 uppercase tracking-widest border-b border-slate-800">
            <div>Parâmetro</div>
            <div>Descrição</div>
            <div>Valor</div>
            <div>Status</div>
          </div>

          {FIELDS.map(f => (
            <div key={f.key}
              className="px-3 py-4 border-b border-slate-800/60 bg-slate-900 grid grid-cols-[180px_1fr_160px_70px] gap-4 items-center">

              <div>
                <div className="text-xs font-semibold text-slate-200 font-cinzel">{f.label}</div>
                <div className={`text-xs mt-0.5 tabular-nums font-bold ${statusColor(config[f.key], f.buffDir)}`}>
                  {f.preview(config[f.key])}
                </div>
              </div>

              <span className="text-xs text-slate-500">{f.description}</span>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={f.min} max={f.max} step={f.step}
                  value={config[f.key]}
                  onChange={e => setConfig(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                  className="flex-1 accent-amber-500"
                />
                <input
                  type="number"
                  min={f.min} max={f.max} step={f.step}
                  value={config[f.key]}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v)) setConfig(prev => ({ ...prev, [f.key]: v }))
                  }}
                  className="w-16 bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>

              <span className={`text-xs font-bold font-cinzel tracking-wider ${statusColor(config[f.key], f.buffDir)}`}>
                {statusLabel(config[f.key], f.buffDir)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
