import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { type UpgradeMilestone, type MilestoneEffect, DEFAULT_MILESTONES, getMilestoneStyles, getMilestone } from '../../utils/upgradeMilestone'

const EFFECTS: { id: MilestoneEffect; label: string; desc: string }[] = [
  { id: 'glow',    label: '✨ Brilho',       desc: 'Pulso suave de luz'              },
  { id: 'pulse',   label: '💫 Pulso',        desc: 'Expansão e contração animada'    },
  { id: 'shimmer', label: '⚡ Cintilação',   desc: 'Faíscas rápidas de luz'          },
  { id: 'rainbow', label: '🌈 Arco-Íris',    desc: 'Rotação contínua de cores'       },
]

const inp = 'bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

export function UpgradeMilestonePanel() {
  const [milestones, setMilestones] = useState<UpgradeMilestone[]>(DEFAULT_MILESTONES)
  const [saving, setSaving]         = useState(false)
  const [saved,  setSaved]          = useState(false)
  const [error,  setError]          = useState('')

  useEffect(() => {
    api.get<UpgradeMilestone[]>('/api/game/upgrade-milestones')
      .then(d => setMilestones(d ?? DEFAULT_MILESTONES))
      .catch(() => {})
  }, [])

  function update(i: number, patch: Partial<UpgradeMilestone>) {
    setMilestones(ms => ms.map((m, j) => j === i ? { ...m, ...patch } : m))
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/upgrade-milestones', milestones)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  function reset() { setMilestones(DEFAULT_MILESTONES) }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400">Marcos de Aprimoramento</h2>
          <p className="text-xs text-slate-500 mt-1">
            Itens +5, +10 e +15 recebem efeitos visuais especiais independente da raridade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo!</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={reset} className="px-3 py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
            Resetar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((m, i) => {
          const { overlayClass, overlayStyle } = getMilestoneStyles(m)
          return (
            <div key={i} className="border border-slate-700 bg-slate-900 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                {/* Preview do card */}
                <div className="relative shrink-0" style={{ width: 56, height: 72 }}>
                  <div className="absolute inset-0 border rounded"
                    style={{ backgroundColor: m.color + '15', borderColor: m.color + '66' }} />
                  <div className={`absolute inset-0 rounded pointer-events-none ${overlayClass}`}
                    style={overlayStyle} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xl">⚔️</span>
                    <span className="text-xs font-bold" style={{ color: m.color }}>+{m.level}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-cinzel font-bold text-sm" style={{ color: m.color }}>
                    Nível +{m.level} — {m.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {EFFECTS.find(e => e.id === m.effect)?.desc}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Nível */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nível de aprimoramento</label>
                  <input type="number" min={1} max={20} className={`${inp} w-full`}
                    value={m.level} onChange={e => update(i, { level: parseInt(e.target.value) || 1 })} />
                </div>
                {/* Label */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nome</label>
                  <input className={`${inp} w-full`} value={m.label}
                    onChange={e => update(i, { label: e.target.value })} />
                </div>
                {/* Cor */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Cor do brilho</label>
                  <div className="flex gap-2">
                    <input type="color" value={m.color}
                      onChange={e => update(i, { color: e.target.value })}
                      className="w-10 h-[34px] cursor-pointer bg-transparent border border-slate-700 p-0.5 shrink-0" />
                    <input className={`${inp} flex-1 font-mono text-xs`} value={m.color}
                      onChange={e => update(i, { color: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Efeito */}
              <div>
                <label className="text-xs text-slate-500 block mb-2">Efeito de animação</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EFFECTS.map(ef => (
                    <button key={ef.id} onClick={() => update(i, { effect: ef.id })}
                      className={`p-2 border text-xs text-left transition-all ${m.effect === ef.id ? 'border-teal-600 bg-teal-950/30 text-teal-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                      <div className="font-semibold">{ef.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{ef.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview com vários níveis */}
      <div className="border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs font-cinzel tracking-widest text-slate-500 uppercase mb-3">Preview — comparação de itens</p>
        <div className="flex flex-wrap gap-3">
          {[0, 3, 5, 8, 10, 12, 15].map(lvl => {
            const ms = getMilestone(lvl, milestones)
            const { overlayClass, overlayStyle } = getMilestoneStyles(ms)
            const color = ms?.color ?? '#475569'
            return (
              <div key={lvl} className="flex flex-col items-center gap-1">
                <div className="relative" style={{ width: 52, height: 68 }}>
                  <div className="absolute inset-0 border rounded"
                    style={{ backgroundColor: color + '15', borderColor: color + '55' }} />
                  {ms && (
                    <div className={`absolute inset-0 rounded pointer-events-none ${overlayClass}`}
                      style={overlayStyle} />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-lg">⚔️</span>
                    <span className="text-[11px] font-bold" style={{ color }}>
                      {lvl > 0 ? `+${lvl}` : 'base'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-600">{ms?.label ?? '—'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
