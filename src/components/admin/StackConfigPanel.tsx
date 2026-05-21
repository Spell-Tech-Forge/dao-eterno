import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { StackConfig } from '../../store/gameDataStore'

const CATEGORIES: { key: keyof StackConfig; label: string; emoji: string; hint: string }[] = [
  { key: 'material', emoji: '🌿', label: 'Materiais',  hint: 'Drops de monstros, ingredientes de crafting' },
  { key: 'pill',     emoji: '💊', label: 'Pílulas',    hint: 'Consumíveis de cultivo e cura' },
  { key: 'talisman', emoji: '📜', label: 'Talismãs',   hint: 'Itens consumíveis de combate' },
]

export function StackConfigPanel() {
  const [config, setConfig]   = useState<StackConfig>({ material: 9999, pill: 99, talisman: 99 })
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<StackConfig>('/api/admin/stack-config')
      .then(data => setConfig(data))
      .catch(() => {})
  }, [])

  async function handleSave() {
    setLoading(true); setError(''); setSaved(false)
    try {
      await api.post('/api/admin/stack-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="text-xs text-slate-500 leading-relaxed">
        Define o limite máximo de itens por pilha para cada categoria. Itens com configuração individual
        ignoram este valor. Use <span className="text-amber-400">9999</span> para pilha praticamente ilimitada.
      </div>

      <div className="border border-slate-700 divide-y divide-slate-800">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="flex items-center gap-4 px-4 py-3">
            <span className="text-xl w-7 shrink-0">{cat.emoji}</span>
            <div className="flex-1">
              <div className="text-sm text-slate-200 font-medium">{cat.label}</div>
              <div className="text-[11px] text-slate-600">{cat.hint}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={99999}
                value={config[cat.key]}
                onChange={e => setConfig(prev => ({ ...prev, [cat.key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-24 bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-slate-200 tabular-nums text-right outline-none focus:border-amber-500/60"
              />
              <span className="text-xs text-slate-600">itens</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-600 border border-slate-800 px-3 py-2 bg-slate-900/40">
        <span className="text-slate-400">Prioridade:</span> configuração individual do item &gt; padrão da categoria
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/20 border border-red-800/40 px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className={`px-6 py-2 text-sm border font-cinzel transition-colors ${
          saved
            ? 'border-teal-600 text-teal-400 bg-teal-950/20'
            : 'border-amber-600 text-amber-400 bg-amber-950/10 hover:bg-amber-950/20'
        } disabled:opacity-50`}
      >
        {loading ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar Configuração'}
      </button>
    </div>
  )
}
