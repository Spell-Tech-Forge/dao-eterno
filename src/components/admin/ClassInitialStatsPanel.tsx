import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'

type Stats = { strength: number; agility: number; vitality: number; defense: number; perception: number }

const STAT_LABELS: { key: keyof Stats; label: string; emoji: string }[] = [
  { key: 'strength',   label: 'Força',      emoji: '⚡' },
  { key: 'agility',    label: 'Agilidade',  emoji: '💨' },
  { key: 'vitality',   label: 'Vitalidade', emoji: '❤️' },
  { key: 'defense',    label: 'Defesa',     emoji: '🛡️' },
  { key: 'perception', label: 'Percepção',  emoji: '👁️' },
]

const inp = 'w-14 text-center bg-slate-800 border border-slate-600 text-slate-200 py-1 focus:outline-none focus:border-amber-500 text-sm'

export function ClassInitialStatsPanel() {
  const classes  = useGameDataStore(s => s.classes)
  const [config,  setConfig]  = useState<Record<string, Stats>>({})
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<Record<string, Stats>>('/api/game/class-initial-stats')
      .then(d => setConfig(d ?? {}))
      .catch(() => {})
  }, [])

  function setVal(classId: string, stat: keyof Stats, val: number) {
    setConfig(prev => ({
      ...prev,
      [classId]: { ...(prev[classId] ?? {}), [stat]: Math.max(1, val) },
    }))
  }

  function total(classId: string) {
    const s = config[classId]
    if (!s) return 0
    return Object.values(s).reduce((a, b) => a + b, 0)
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/class-initial-stats', config)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400">Stats Iniciais por Classe</h2>
          <p className="text-xs text-slate-500 mt-1">
            Atributos com que cada personagem começa ao criar. Total recomendado: 21.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo!</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 pr-4 text-slate-400 font-cinzel min-w-[180px]">Classe</th>
              {STAT_LABELS.map(s => (
                <th key={s.key} className="text-center py-2 px-2 text-slate-400 font-cinzel w-20">
                  {s.emoji} {s.label}
                </th>
              ))}
              <th className="text-center py-2 px-2 text-slate-500 w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => {
              const stats = config[cls.id]
              const tot   = total(cls.id)
              return (
                <tr key={cls.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cls.emoji}</span>
                      <span className="text-slate-200">{cls.name}</span>
                    </div>
                  </td>
                  {STAT_LABELS.map(s => (
                    <td key={s.key} className="py-1 px-2 text-center">
                      <input
                        type="number" min={1} max={20}
                        value={stats?.[s.key] ?? 5}
                        onChange={e => setVal(cls.id, s.key, parseInt(e.target.value) || 1)}
                        className={inp}
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center">
                    <span className={`font-bold ${tot === 21 ? 'text-teal-400' : tot > 21 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {tot}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">Total 21 = verde (recomendado). Alterações só afetam novos personagens.</p>
    </div>
  )
}
