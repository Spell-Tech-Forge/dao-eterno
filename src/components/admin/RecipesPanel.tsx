import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import type { GameRecipe } from '../../types/server'

const CATEGORIES = ['forja', 'alquimia', 'inscricao'] as const
const CAT_LABEL: Record<string, string> = { forja: '⚒️ Forja', alquimia: '⚗️ Alquimia', inscricao: '✍️ Inscrição' }
const CAT_COLORS: Record<string, string> = { forja: '#f97316', alquimia: '#60a5fa', inscricao: '#a855f7' }

type Ingredient = { itemId: string; quantity: number }

const EMPTY: Omit<GameRecipe, 'created_at' | 'updated_at'> = {
  id: '', name: '', category: 'forja', output_item_id: '', output_quantity: 1,
  required_tier: 1, ingredients: [], active: true,
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/60'

interface Props { onMutate: () => void }

export function RecipesPanel({ onMutate }: Props) {
  const [recipes, setRecipes] = useState<GameRecipe[]>([])
  const [search, setSearch]   = useState('')
  const [catF, setCatF]       = useState('all')
  const [editing, setEditing] = useState<Partial<GameRecipe> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const downOnOverlay         = useRef(false)

  const itemDefs = useGameDataStore(s => s.items)

  const load = useCallback(async () => {
    const data = await api.get<GameRecipe[]>('/api/admin/recipes')
    setRecipes(data)
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase()
    const matchS = !q ||
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.output_item_id.toLowerCase().includes(q) ||
      (itemDefs[r.output_item_id]?.name ?? '').toLowerCase().includes(q)
    const matchC = catF === 'all' || r.category === catF
    return matchS && matchC
  })

  const handleSave = async () => {
    if (!editing) return
    setError(''); setLoading(true)
    try {
      if (editing.created_at) await api.put(`/api/admin/recipes/${editing.id}`, editing)
      else                    await api.post('/api/admin/recipes', editing)
      setEditing(null); await load(); onMutate()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir receita "${id}"?`)) return
    await api.delete(`/api/admin/recipes/${id}`)
    await load(); onMutate()
  }

  const setF   = (k: string, v: unknown) => setEditing(prev => prev ? { ...prev, [k]: v } : null)
  const ings   = (editing?.ingredients ?? []) as Ingredient[]
  const addIng    = () => setEditing(p => p ? { ...p, ingredients: [...ings, { itemId: '', quantity: 1 }] } : null)
  const removeIng = (i: number) => setEditing(p => p ? { ...p, ingredients: ings.filter((_, j) => j !== i) } : null)
  const setIng    = (i: number, k: keyof Ingredient, v: string | number) =>
    setEditing(p => { if (!p) return null; const d = [...ings]; d[i] = { ...d[i], [k]: v }; return { ...p, ingredients: d } })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome da receita ou item de saída..."
          className="flex-1 min-w-52 bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60" />
        <button onClick={() => setEditing({ ...EMPTY })}
          className="px-4 py-1.5 text-sm border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors">
          + Nova Receita
        </button>
      </div>

      {/* Sub-tabs por categoria */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-600 mr-1 font-cinzel uppercase tracking-widest">Categoria:</span>
        <button onClick={() => setCatF('all')}
          className={`text-xs px-3 py-1 border transition-all ${catF === 'all'
            ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
          Todas
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatF(c)}
            className={`text-xs px-3 py-1 border transition-all ${catF === c
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Item de Saída</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-left">Ingredientes</th>
              <th className="px-3 py-2 text-center">Visível</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const outDef = itemDefs[r.output_item_id]
              return (
                <tr key={r.id} className={`border-t border-slate-800 hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'}`}>
                  <td className="px-3 py-2 font-semibold text-slate-200">{r.name}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-bold" style={{ color: CAT_COLORS[r.category] ?? '#94a3b8' }}>
                      {CAT_LABEL[r.category] ?? r.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {outDef ? (
                      <span className="flex items-center gap-1.5">
                        <span>{outDef.emoji}</span>
                        <span className="text-slate-300">{outDef.name}</span>
                        {r.output_quantity > 1 && <span className="text-slate-500">×{r.output_quantity}</span>}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">{r.output_item_id}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">T{r.required_tier}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{(r.ingredients as Ingredient[]).length} ingredientes</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-bold ${r.active ? 'text-teal-400' : 'text-slate-700'}`}>
                      {r.active ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setEditing({ ...r, ingredients: r.ingredients as Ingredient[] })}
                      className="text-xs text-amber-400 hover:text-amber-300 mr-3">Editar</button>
                    <button onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 text-sm">
                {recipes.length === 0 ? 'Nenhuma receita cadastrada.' : 'Nenhuma receita encontrada.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">{filtered.length} de {recipes.length} receitas</p>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onMouseDown={e => { downOnOverlay.current = e.target === e.currentTarget }}
          onMouseUp={e => { if (downOnOverlay.current && e.target === e.currentTarget) setEditing(null) }}>
          <div className="bg-slate-950 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onMouseDown={e => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950">
              <h2 className="font-cinzel text-amber-400 font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Receita' : 'Nova Receita'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <RF label="ID" value={editing.id ?? ''} onChange={v => setF('id', v)} disabled={!!editing.created_at} />
              <RF label="Nome" value={editing.name ?? ''} onChange={v => setF('name', v)} />

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Categoria</label>
                <select value={editing.category ?? 'forja'} onChange={e => setF('category', e.target.value)} className={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>
              <RF label="Tier Requerido" value={String(editing.required_tier ?? 1)}
                onChange={v => setF('required_tier', Number(v))} type="number" />

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Item de Saída (ID)</label>
                <input value={editing.output_item_id ?? ''} onChange={e => setF('output_item_id', e.target.value)}
                  placeholder="item_id" className={inp} />
                {editing.output_item_id && itemDefs[editing.output_item_id] && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{itemDefs[editing.output_item_id].emoji}</span>
                    <span>{itemDefs[editing.output_item_id].name}</span>
                  </div>
                )}
              </div>
              <RF label="Quantidade de Saída" value={String(editing.output_quantity ?? 1)}
                onChange={v => setF('output_quantity', Number(v))} type="number" />

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="r-active" checked={editing.active ?? true}
                  onChange={e => setF('active', e.target.checked)} className="accent-teal-500" />
                <label htmlFor="r-active" className="text-sm text-slate-300 cursor-pointer">Visível na Forja</label>
                {!(editing.active ?? true) && (
                  <span className="text-xs text-slate-600 ml-1">— receita oculta, não aparece na tela de craft</span>
                )}
              </div>

              {/* Ingredientes */}
              <div className="col-span-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-cinzel uppercase tracking-widest">Ingredientes</span>
                  <button onClick={addIng}
                    className="text-xs border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 px-3 py-1 transition-colors">
                    + Adicionar
                  </button>
                </div>
                {ings.length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-3 border border-dashed border-slate-800">Sem ingredientes.</p>
                )}
                {ings.map((ing, i) => {
                  const ingDef = itemDefs[ing.itemId]
                  return (
                    <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-2 mb-2">
                      <div className="relative">
                        <input value={ing.itemId} onChange={e => setIng(i, 'itemId', e.target.value)}
                          placeholder="item_id"
                          className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500/60" />
                        {ingDef && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                            {ingDef.emoji} {ingDef.name}
                          </span>
                        )}
                      </div>
                      <input value={ing.quantity} onChange={e => setIng(i, 'quantity', Number(e.target.value))}
                        type="number" min="1" title="Quantidade"
                        className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none text-center" />
                      <button onClick={() => removeIng(i)}
                        className="bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-950/40 text-xs transition-colors">×</button>
                    </div>
                  )
                })}
              </div>

              {error && (
                <p className="col-span-2 text-sm text-red-400 bg-red-950/20 border border-red-800/40 px-3 py-2">{error}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-800 pt-4">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={loading}
                className="px-4 py-2 text-sm border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RF({ label, value, onChange, disabled, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/60 disabled:opacity-40" />
    </div>
  )
}
