import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore, type StackConfig } from '../../store/gameDataStore'

interface NormalizeResult {
  charsUpdated: number
  stacksSplit:  number
  itemsDropped: number
}

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

  const [normalizing,    setNormalizing]    = useState(false)
  const [normalizeResult, setNormalizeResult] = useState<NormalizeResult | null>(null)
  const [confirmVisible,  setConfirmVisible]  = useState(false)

  useEffect(() => {
    api.get<StackConfig>('/api/admin/stack-config')
      .then(data => setConfig(data))
      .catch(() => {})
  }, [])

  async function handleNormalize() {
    setNormalizing(true)
    setNormalizeResult(null)
    setConfirmVisible(false)
    try {
      const result = await api.post<NormalizeResult>('/api/admin/stack-config/normalize', {})
      setNormalizeResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao normalizar.')
    } finally {
      setNormalizing(false)
    }
  }

  async function handleSave() {
    setLoading(true); setError(''); setSaved(false)
    try {
      await api.post('/api/admin/stack-config', config)
      void useGameDataStore.getState().loadStackConfig()
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

      {/* ── Normalizar inventários existentes ── */}
      <div className="border border-slate-700 p-4 space-y-3 mt-2">
        <div className="text-[11px] font-cinzel text-slate-400 tracking-wider">✦ NORMALIZAR INVENTÁRIOS EXISTENTES</div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Varre todos os personagens e divide pilhas que ultrapassam o limite configurado.
          Pilhas excedentes são criadas em slots livres; o excesso é descartado apenas se o inventário estiver cheio.
        </p>

        {normalizeResult && (
          <div className="text-xs border border-teal-800 bg-teal-950/20 px-3 py-2 space-y-0.5">
            <div className="text-teal-400 font-bold">Concluído</div>
            <div className="text-slate-400">Personagens atualizados: <span className="text-slate-200">{normalizeResult.charsUpdated}</span></div>
            <div className="text-slate-400">Pilhas divididas criadas: <span className="text-slate-200">{normalizeResult.stacksSplit}</span></div>
            {normalizeResult.itemsDropped > 0 && (
              <div className="text-amber-400">Itens descartados (inventário cheio): {normalizeResult.itemsDropped}</div>
            )}
          </div>
        )}

        {!confirmVisible ? (
          <button
            onClick={() => { setConfirmVisible(true); setNormalizeResult(null) }}
            disabled={normalizing}
            className="px-5 py-2 text-sm border border-slate-600 text-slate-300 hover:border-amber-700 hover:text-amber-400 transition-colors disabled:opacity-40"
          >
            {normalizing ? '⏳ Normalizando...' : 'Normalizar agora'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-400">Confirmar? Esta ação altera todos os inventários.</span>
            <button
              onClick={handleNormalize}
              className="px-4 py-1.5 text-xs border border-red-700 text-red-400 hover:bg-red-950/30 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmVisible(false)}
              className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
