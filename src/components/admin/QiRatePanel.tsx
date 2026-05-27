import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { DEFAULT_QI_RATE_CONFIG, type QiRateConfig } from '../../store/gameDataStore'

const REALMS = [
  { id: 'qi_refining',           label: 'Refinamento de Qi'        },
  { id: 'foundation',            label: 'Fundação Espiritual'       },
  { id: 'golden_core',           label: 'Núcleo Dourado'            },
  { id: 'nascent_soul',          label: 'Alma Nascente'             },
  { id: 'spirit_transformation', label: 'Transformação Espiritual'  },
  { id: 'unification',           label: 'Unificação'                },
  { id: 'ascension',             label: 'Ascensão'                  },
  { id: 'immortal',              label: 'Imortal'                   },
]

const STAGES = [
  { id: 'initial',  label: 'Inicial'   },
  { id: 'middle',   label: 'Médio'     },
  { id: 'advanced', label: 'Avançado'  },
  { id: 'peak',     label: 'Pico'      },
]

export function QiRatePanel() {
  const [config, setConfig] = useState<QiRateConfig>(DEFAULT_QI_RATE_CONFIG)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    api.get<QiRateConfig>('/api/admin/qi-rate').then(cfg => {
      setConfig({ ...DEFAULT_QI_RATE_CONFIG, ...cfg })
    }).catch(() => {})
  }, [])

  const handleChange = (realm: string, stage: string, raw: string) => {
    const val = parseInt(raw, 10)
    if (isNaN(val) || val < 0) return
    setConfig(prev => ({
      ...prev,
      [realm]: { ...prev[realm], [stage]: val },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.post('/api/admin/qi-rate', config)
      setMsg('✓ Salvo com sucesso.')
    } catch {
      setMsg('✗ Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-amber-400 font-cinzel mb-1">Taxa de Qi por Meditação</h2>
        <p className="text-xs text-slate-500">Qi ganho por segundo durante meditação ativa, por reino e estágio.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-slate-400 border-b border-slate-700 w-48">Reino</th>
              {STAGES.map(s => (
                <th key={s.id} className="py-2 px-3 text-center text-slate-400 border-b border-slate-700 w-28">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REALMS.map((realm, ri) => (
              <tr key={realm.id} className={ri % 2 === 0 ? 'bg-slate-900/50' : ''}>
                <td className="py-2 px-3 text-slate-300 font-medium border-b border-slate-800/50">
                  {realm.label}
                </td>
                {STAGES.map(stage => (
                  <td key={stage.id} className="py-2 px-3 border-b border-slate-800/50">
                    <input
                      type="number"
                      min={1}
                      value={config[realm.id]?.[stage.id] ?? 3}
                      onChange={e => handleChange(realm.id, stage.id, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-center px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
        {msg && <span className={msg.startsWith('✓') ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>{msg}</span>}
      </div>
    </div>
  )
}
