import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'

type StatDeltas = { strength: number; agility: number; vitality: number; defense: number; perception: number }

const CLASSES = [
  { id: 'cultivador_qi',    name: 'Cultivador de Qi',       emoji: '🌀' },
  { id: 'espadachim',       name: 'Espadachim Celestial',   emoji: '⚔️' },
  { id: 'guerreiro_sabre',  name: 'Guerreiro do Sabre',     emoji: '🗡️' },
  { id: 'lanceiro',         name: 'Lanceiro Espiritual',    emoji: '🔱' },
  { id: 'mestre_leque',     name: 'Mestre do Leque',        emoji: '🌸' },
  { id: 'eremita_bastao',   name: 'Eremita do Bastão',      emoji: '🪄' },
  { id: 'arqueiro',         name: 'Arqueiro Espiritual',    emoji: '🏹' },
  { id: 'sombra_veloz',     name: 'Sombra Veloz',           emoji: '🌑' },
  { id: 'trovejante',       name: 'Trovejante',             emoji: '⚡' },
  { id: 'dancador_corrente',name: 'Dançarino da Corrente',  emoji: '⛓️' },
]

const DEFAULTS: Record<string, StatDeltas> = {
  cultivador_qi:    { strength: 2, agility: 4, vitality: 4, defense: 3, perception: 3 },
  espadachim:       { strength: 5, agility: 4, vitality: 2, defense: 2, perception: 3 },
  guerreiro_sabre:  { strength: 6, agility: 1, vitality: 3, defense: 5, perception: 1 },
  lanceiro:         { strength: 4, agility: 3, vitality: 3, defense: 4, perception: 2 },
  mestre_leque:     { strength: 1, agility: 5, vitality: 4, defense: 1, perception: 5 },
  eremita_bastao:   { strength: 1, agility: 2, vitality: 5, defense: 5, perception: 3 },
  arqueiro:         { strength: 1, agility: 4, vitality: 2, defense: 1, perception: 8 },
  sombra_veloz:     { strength: 1, agility: 7, vitality: 1, defense: 1, perception: 6 },
  trovejante:       { strength: 8, agility: 1, vitality: 2, defense: 4, perception: 1 },
  dancador_corrente:{ strength: 4, agility: 5, vitality: 2, defense: 3, perception: 2 },
}

const STAT_LABELS: (keyof StatDeltas)[] = ['strength', 'agility', 'vitality', 'defense', 'perception']
const STAT_PT: Record<keyof StatDeltas, string> = {
  strength: 'Força', agility: 'Agilidade', vitality: 'Vitalidade', defense: 'Defesa', perception: 'Percepção',
}
const STAT_EMOJI: Record<keyof StatDeltas, string> = {
  strength: '⚡', agility: '💨', vitality: '❤️', defense: '🛡️', perception: '👁️',
}

export function ClassBreakthroughPanel() {
  const [config, setConfig] = useState<Record<string, StatDeltas>>({ ...DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    api.get<Record<string, StatDeltas>>('/api/game/class-breakthrough-config').then(data => {
      if (data && Object.keys(data).length > 0) {
        setConfig({ ...DEFAULTS, ...data })
      }
    }).catch(() => {})
  }, [])

  function setDelta(classId: string, stat: keyof StatDeltas, value: number) {
    setConfig(prev => ({
      ...prev,
      [classId]: { ...prev[classId], [stat]: Math.max(0, value) },
    }))
  }

  function total(classId: string) {
    const d = config[classId]
    return Object.values(d).reduce((a, b) => a + b, 0)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.post('/api/admin/class-breakthrough-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setConfig({ ...DEFAULTS })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Pontos de atributo ganhos por cada rompimento de cultivo, por classe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>Resetar Padrão</Button>
          <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
            {saved ? '✓ Salvo' : saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 pr-4 text-slate-400 font-cinzel">Classe</th>
              {STAT_LABELS.map(s => (
                <th key={s} className="text-center py-2 px-2 text-slate-400 font-cinzel w-20">
                  {STAT_EMOJI[s]} {STAT_PT[s]}
                </th>
              ))}
              <th className="text-center py-2 px-2 text-slate-500 w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map(cls => (
              <tr key={cls.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="py-2 pr-4">
                  <span className="mr-1">{cls.emoji}</span>
                  <span className="text-slate-200">{cls.name}</span>
                </td>
                {STAT_LABELS.map(stat => (
                  <td key={stat} className="py-1 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={config[cls.id]?.[stat] ?? 0}
                      onChange={e => setDelta(cls.id, stat, parseInt(e.target.value) || 0)}
                      className="w-14 text-center bg-slate-800 border border-slate-600 text-slate-200 py-1 focus:outline-none focus:border-amber-500"
                    />
                  </td>
                ))}
                <td className="py-2 px-2 text-center">
                  <span className={`font-bold ${total(cls.id) === 16 ? 'text-teal-400' : total(cls.id) > 16 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {total(cls.id)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">Total recomendado: 16 pontos por classe (destacado em verde).</p>
    </div>
  )
}
