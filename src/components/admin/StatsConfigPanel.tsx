import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { api } from '../../lib/api'
import { DEFAULT_STAT_CONFIG, DEFAULT_BREAKTHROUGH_PATHS } from '../../utils/stats'
import type { StatConfig, BreakthroughPathConfig } from '../../utils/stats'

interface FieldDef {
  key: keyof StatConfig
  label: string
  description: string
  min: number
  max: number
  step: number
}

const FORMULA_FIELDS: FieldDef[] = [
  { key: 'atkPerStr',      label: 'ATK por Força',           description: 'atk = força × valor',                              min: 0.1,  max: 50,   step: 0.1   },
  { key: 'hpPerVit',       label: 'HP por Vitalidade',       description: 'hpMax = vitalidade × valor',                       min: 1,    max: 500,  step: 1     },
  { key: 'defPerDef',      label: 'DEF por Defesa',          description: 'def = defesa × valor',                             min: 0.1,  max: 50,   step: 0.1   },
  { key: 'critPerPer',      label: 'Dano Crit% por Percepção', description: 'bônus de dano crítico (%) = percepção × valor',     min: 0.1,  max: 50,   step: 0.1   },
  { key: 'baseCritDmgPct', label: 'Dano Crit Base (%)',       description: 'bônus de dano no crit com 0 percepção (100 = 2×)',  min: 0,    max: 1000, step: 5     },
  { key: 'critChancePerLuck', label: 'Chance Crit% por Sorte', description: 'chance de crítico (%) = sorte × valor',           min: 0.1,  max: 10,   step: 0.1   },
  { key: 'baseSpeed',      label: 'Velocidade Base (s/atk)', description: 'ponto de partida do tempo de ataque',              min: 0.5,  max: 10,   step: 0.1   },
  { key: 'speedPerAgi',    label: 'Redução por Agilidade',   description: 'speed = base − agilidade × valor',                min: 0.001, max: 0.5, step: 0.001 },
  { key: 'minAgiSpeed',    label: 'Speed Mínimo (Agilidade)',description: 'piso do speed calculado pela agilidade (s/atk)',   min: 0.1,  max: 5,    step: 0.05  },
  { key: 'weaponSpeedDiv', label: 'Divisor Speed Arma',      description: 'fórmula: score/(score+valor) — maior = mais lento', min: 10, max: 2000,  step: 10    },
  { key: 'minAttackSpeed', label: 'Speed Mínimo (Arma)',     description: 'piso absoluto de ataque com arma (s/atk)',         min: 0.05, max: 2,    step: 0.05  },
]

const INITIAL_ATTR_FIELDS: FieldDef[] = [
  { key: 'initialStrength',   label: 'Força inicial',      description: 'valor de Força no novo personagem',      min: 1, max: 100, step: 1 },
  { key: 'initialAgility',    label: 'Agilidade inicial',  description: 'valor de Agilidade no novo personagem',  min: 1, max: 100, step: 1 },
  { key: 'initialVitality',   label: 'Vitalidade inicial', description: 'valor de Vitalidade no novo personagem', min: 1, max: 100, step: 1 },
  { key: 'initialDefense',    label: 'Defesa inicial',     description: 'valor de Defesa no novo personagem',     min: 1, max: 100, step: 1 },
  { key: 'initialPerception', label: 'Percepção inicial',  description: 'valor de Percepção no novo personagem',  min: 1, max: 100, step: 1 },
]

const PROGRESSION_FIELDS: FieldDef[] = [
  { key: 'attrPointsPerBreakthrough', label: 'Pontos por Rompimento', description: 'pontos de atributo ganhos ao romper para o próximo estágio', min: 0, max: 50, step: 1 },
  { key: 'luckGainMin', label: 'Sorte mínima por Rompimento', description: 'menor quantidade de sorte que o player pode ganhar ao romper', min: 0, max: 100, step: 1 },
  { key: 'luckGainMax', label: 'Sorte máxima por Rompimento', description: 'maior quantidade de sorte que o player pode ganhar ao romper', min: 0, max: 100, step: 1 },
]

function FieldSection({ title, fields, config, onChange }: {
  title: string
  fields: FieldDef[]
  config: StatConfig
  onChange: Dispatch<SetStateAction<StatConfig>>
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900 grid grid-cols-[220px_120px_1fr] gap-4 text-xs text-slate-500 uppercase tracking-widest">
        <div className="col-span-3 text-amber-700/70 font-cinzel font-semibold normal-case tracking-wider">{title}</div>
      </div>
      <div className="px-3 py-1.5 bg-slate-900 grid grid-cols-[220px_120px_1fr] gap-4 text-xs text-slate-600 uppercase tracking-widest border-b border-slate-800">
        <div>Parâmetro</div><div>Valor</div><div>Descrição</div>
      </div>
      {fields.map(f => (
        <div key={f.key}
          className="px-3 py-2.5 border-b border-slate-800/60 bg-slate-900 grid grid-cols-[220px_120px_1fr] gap-4 items-center">
          <label className="text-xs font-semibold text-slate-300 font-cinzel">{f.label}</label>
          <input
            type="number" min={f.min} max={f.max} step={f.step}
            value={config[f.key] as number}
            onChange={e => onChange(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
            className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1.5 text-center focus:outline-none focus:border-amber-500 tabular-nums w-full"
          />
          <span className="text-xs text-slate-600">{f.description}</span>
        </div>
      ))}
    </div>
  )
}

function preview(cfg: StatConfig) {
  return [
    { label: 'Força 10 → ATK',      value: `${(10 * cfg.atkPerStr).toFixed(0)}`                                      },
    { label: 'Vitalidade 10 → HP',  value: `${(10 * cfg.hpPerVit).toFixed(0)}`                                       },
    { label: 'Defesa 10 → DEF',     value: `${(10 * cfg.defPerDef).toFixed(0)}`                                       },
    { label: 'Percepção 10 → Dano Crit', value: `×${(1 + ((cfg.baseCritDmgPct ?? 100) + 10 * cfg.critPerPer) / 100).toFixed(2)}`},
    { label: 'Sorte 10 → Chance Crit',  value: `${(10 * (cfg.critChancePerLuck ?? 0.5)).toFixed(1)}%`                    },
    { label: 'Agilidade 8 → Speed', value: `${Math.max(cfg.minAgiSpeed, cfg.baseSpeed - 8 * cfg.speedPerAgi).toFixed(2)}s` },
    { label: 'Arma T1 (pts=8)',     value: (() => { const s=8/(8+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
    { label: 'Arma T5 (pts=85)',    value: (() => { const s=85/(85+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
    { label: 'Arma T10 (pts=4525)', value: (() => { const s=4525/(4525+cfg.weaponSpeedDiv); return `${Math.max(cfg.minAttackSpeed, (Math.max(cfg.minAgiSpeed,cfg.baseSpeed-8*cfg.speedPerAgi))*(1-s)).toFixed(2)}s` })() },
  ]
}

const ATTR_KEYS: { key: keyof BreakthroughPathConfig['deltas']; label: string }[] = [
  { key: 'strength',   label: 'Força'      },
  { key: 'agility',    label: 'Agilidade'  },
  { key: 'vitality',   label: 'Vitalidade' },
  { key: 'defense',    label: 'Defesa'     },
  { key: 'perception', label: 'Percepção'  },
]

function PathsSection({ paths, onChange }: {
  paths: BreakthroughPathConfig[]
  onChange: (paths: BreakthroughPathConfig[]) => void
}) {
  function setPathField(i: number, field: keyof BreakthroughPathConfig, value: string) {
    const next = paths.map((p, j) => j === i ? { ...p, [field]: value } : p)
    onChange(next)
  }
  function setDelta(i: number, attr: keyof BreakthroughPathConfig['deltas'], value: number) {
    const next = paths.map((p, j) => j === i ? { ...p, deltas: { ...p.deltas, [attr]: value } } : p)
    onChange(next)
  }

  const inp = 'bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 outline-none focus:border-amber-500'

  return (
    <div className="space-y-4">
      {/* Cabeçalho da seção */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-700">
        <span className="text-amber-700/70 font-cinzel font-semibold text-sm tracking-wider">
          Caminhos de Rompimento
        </span>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Distribuição de atributos por caminho ao romper para o próximo estágio.
        </p>
      </div>

      {/* Grid de caminhos */}
      <div className="px-3 space-y-6">
        {paths.map((path, i) => {
          const total = Object.values(path.deltas).reduce((s, v) => s + v, 0)
          return (
            <div key={path.id} className="border border-slate-700 bg-slate-900 p-4 space-y-4">
              {/* Header do caminho */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
                <div className="w-1 h-8 shrink-0" style={{ background: path.color }} />
                <input
                  value={path.emoji}
                  onChange={e => setPathField(i, 'emoji', e.target.value)}
                  className={`${inp} w-12 text-center text-lg`}
                />
                <input
                  value={path.name}
                  onChange={e => setPathField(i, 'name', e.target.value)}
                  className={`${inp} flex-1 font-cinzel font-bold`}
                  style={{ color: path.color }}
                />
                <input
                  value={path.color}
                  type="color"
                  onChange={e => setPathField(i, 'color', e.target.value)}
                  className="w-8 h-8 cursor-pointer bg-transparent border border-slate-700 p-0.5"
                  title="Cor do caminho"
                />
                <span className="text-xs text-slate-500 shrink-0">
                  Total: <span className="text-amber-400 font-bold">{total}</span> pts
                </span>
              </div>

              {/* Descrição */}
              <input
                value={path.desc}
                onChange={e => setPathField(i, 'desc', e.target.value)}
                className={`${inp} w-full text-slate-400`}
                placeholder="Descrição do caminho"
              />

              {/* Deltas por atributo */}
              <div className="grid grid-cols-5 gap-3">
                {ATTR_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
                    <input
                      type="number" min={0} max={20} step={1}
                      value={path.deltas[key]}
                      onChange={e => setDelta(i, key, parseInt(e.target.value) || 0)}
                      className={`${inp} w-full text-center text-amber-300 font-bold tabular-nums`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => onChange([...paths, {
            id: `path_${Date.now()}`, name: 'Novo Caminho', emoji: '✦',
            desc: '', color: '#94a3b8',
            deltas: { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 3 },
          }])}
          className="text-xs px-3 py-1.5 border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
        >
          + Adicionar Caminho
        </button>
      </div>
    </div>
  )
}

export function StatsConfigPanel() {
  const [config,  setConfig]  = useState<StatConfig>({ ...DEFAULT_STAT_CONFIG, breakthroughPaths: DEFAULT_BREAKTHROUGH_PATHS })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<StatConfig>('/api/admin/stat-config')
      .then(data => { setConfig({ ...DEFAULT_STAT_CONFIG, ...data, breakthroughPaths: data.breakthroughPaths ?? DEFAULT_BREAKTHROUGH_PATHS }); setLoading(false) })
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

  function reset() { setConfig({ ...DEFAULT_STAT_CONFIG, breakthroughPaths: DEFAULT_BREAKTHROUGH_PATHS }) }

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
          <div className="space-y-6">
            {/* Fórmulas de atributos */}
            <FieldSection title="Fórmulas de Atributos" fields={FORMULA_FIELDS} config={config} onChange={setConfig} />
            {/* Stats iniciais */}
            <div>
              <FieldSection title="Atributos Iniciais do Personagem" fields={INITIAL_ATTR_FIELDS} config={config} onChange={setConfig} />
              <p className="text-[10px] text-slate-600 mt-1 px-1">
                Aplicado apenas na criação de novos personagens.
              </p>
            </div>
            {/* Progressão */}
            <FieldSection title="Progressão por Rompimento" fields={PROGRESSION_FIELDS} config={config} onChange={setConfig} />
            {/* Caminhos */}
            <PathsSection
              paths={config.breakthroughPaths ?? DEFAULT_BREAKTHROUGH_PATHS}
              onChange={paths => setConfig(prev => ({ ...prev, breakthroughPaths: paths }))}
            />
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
