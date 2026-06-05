import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { api } from '../../lib/api'
import { RARITY_COLORS } from '../../types'

interface Props { onBack: () => void }

const TYPE_LABELS: Record<string, string> = {
  material: '🌿 Materiais',
  pill:     '💊 Pílulas',
  talisman: '📜 Talismãs',
  receita:  '📖 Receitas',
}

const ALLOWED_TYPES = new Set(['material', 'pill', 'talisman', 'receita'])

export function AutoDismantleScreen({ onBack }: Props) {
  const char = useAuthStore(s => s.activeCharacter)
  const { discoveredItems } = useBestiaryStore()
  const itemDefs = useGameDataStore(s => s.items)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [search, setSearch]     = useState('')

  // Carrega config atual
  useEffect(() => {
    if (!char) return
    api.get<{ items: string[] }>(`/api/characters/${char.id}/auto-dismantle`)
      .then(r => { setSelected(new Set(r.items)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [char?.id])

  async function save() {
    if (!char) return
    setSaving(true)
    try {
      await api.put(`/api/characters/${char.id}/auto-dismantle`, { items: [...selected] })
      setMsg(`✓ Configuração salva! ${selected.size} item(s) marcados.`)
      setTimeout(() => setMsg(''), 3000)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  // Itens descobertos que podem ser auto-desmontados
  const eligible = useMemo(() => {
    return discoveredItems
      .map(id => itemDefs[id])
      .filter(def => def && ALLOWED_TYPES.has(def.type))
      .filter(def => !search || def!.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (!a || !b) return 0
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return (a.tier ?? 0) - (b.tier ?? 0)
      })
  }, [discoveredItems, itemDefs, search])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof eligible>()
    for (const def of eligible) {
      if (!def) continue
      const key = def.type
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(def)
    }
    return map
  }, [eligible])

  function toggleAll(ids: string[], forceValue?: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      const allOn = ids.every(id => next.has(id))
      ids.forEach(id => forceValue !== undefined
        ? (forceValue ? next.add(id) : next.delete(id))
        : (allOn ? next.delete(id) : next.add(id))
      )
      return next
    })
  }

  if (loading) return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 py-8 text-center text-slate-500 bg-slate-950 min-h-screen">
      Carregando...
    </div>
  )

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 bg-slate-950 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">🔄 Auto-Desmonte</h1>
          <p className="text-xs text-slate-500">Itens marcados são desmontados automaticamente ao sair de cada run de combate.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 text-sm font-bold border border-teal-700/60 text-teal-400 bg-teal-950/10 hover:bg-teal-950/30 disabled:opacity-40 transition-colors">
          {saving ? 'Salvando...' : '💾 Salvar'}
        </button>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.startsWith('✓') ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg}
        </div>
      )}

      {/* Info */}
      <div className="border border-amber-800/30 bg-amber-950/10 px-3 py-2 text-xs text-amber-600/80 space-y-1">
        <p>Apenas itens já descobertos aparecem aqui. Ao desmontar automaticamente, cada item vira 1 material do tier correspondente.</p>
        <p className="text-slate-600">Marcados: <span className="text-amber-400 font-bold">{selected.size}</span> · Descobertos: <span className="text-slate-400">{eligible.length}</span></p>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="🔍 Buscar item..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:border-teal-600"
      />

      {eligible.length === 0 ? (
        <div className="text-center text-slate-600 py-12 text-sm">
          {discoveredItems.length === 0
            ? 'Nenhum item descoberto ainda. Explore os mapas para desbloquear itens.'
            : 'Nenhum item corresponde à busca.'}
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([type, defs]) => {
            const ids = defs.map(d => d!.id)
            const allChecked = ids.every(id => selected.has(id))
            const someChecked = ids.some(id => selected.has(id))
            return (
              <div key={type} className="border border-slate-700 bg-slate-900">
                {/* Header do grupo */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-800/50">
                  <input type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                    onChange={() => toggleAll(ids)}
                    className="w-4 h-4 accent-teal-500 cursor-pointer" />
                  <span className="text-xs font-cinzel tracking-widest uppercase text-slate-400">
                    {TYPE_LABELS[type] ?? type}
                  </span>
                  <span className="ml-auto text-xs text-slate-600">
                    {ids.filter(id => selected.has(id)).length}/{ids.length}
                  </span>
                </div>

                {/* Itens */}
                <div className="divide-y divide-slate-800">
                  {defs.map(def => {
                    if (!def) return null
                    const isChecked = selected.has(def.id)
                    const color = RARITY_COLORS[def.rarity] ?? '#94a3b8'
                    return (
                      <label key={def.id}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors">
                        <input type="checkbox"
                          checked={isChecked}
                          onChange={() => setSelected(prev => {
                            const next = new Set(prev)
                            isChecked ? next.delete(def.id) : next.add(def.id)
                            return next
                          })}
                          className="w-4 h-4 accent-teal-500 shrink-0" />
                        <span className="text-lg shrink-0">{def.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: isChecked ? color : '#94a3b8' }}>
                            {def.name}
                          </span>
                          {def.tier && (
                            <span className="ml-2 text-[10px] text-slate-600">T{def.tier}</span>
                          )}
                        </div>
                        {isChecked && (
                          <span className="text-[10px] text-teal-500 shrink-0">🔄 auto</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botão salvar flutuante */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <button onClick={save} disabled={saving}
            className="px-6 py-3 text-sm font-bold border border-teal-600 text-teal-400 bg-slate-900 hover:bg-teal-950/40 disabled:opacity-40 transition-colors shadow-lg">
            {saving ? 'Salvando...' : `💾 Salvar (${selected.size} marcados)`}
          </button>
        </div>
      )}
    </div>
  )
}
