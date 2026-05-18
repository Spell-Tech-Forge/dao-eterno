import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import type { GameRecipe } from '../../types/server'
import { RECIPE_DEFS } from '../../data/recipes'

const CATEGORIES = ['forja','alquimia','inscricao']
const CAT_LABEL: Record<string,string> = { forja:'Forja', alquimia:'Alquimia', inscricao:'Inscrição' }
const CAT_COLORS: Record<string,string> = { forja:'#f97316', alquimia:'#60a5fa', inscricao:'#a855f7' }

type Ingredient = { itemId: string; quantity: number }

const EMPTY: Omit<GameRecipe,'created_at'|'updated_at'> = {
  id:'', name:'', category:'forja', output_item_id:'', output_quantity:1,
  required_tier:1, ingredients:[], active:true,
}

interface Props { onMutate: () => void }

export function RecipesPanel({ onMutate }: Props) {
  const [recipes, setRecipes]   = useState<GameRecipe[]>([])
  const [search, setSearch]     = useState('')
  const [catF, setCatF]         = useState('all')
  const [editing, setEditing]   = useState<Partial<GameRecipe> | null>(null)
  const [loading, setLoading]   = useState(false)
  const [seeding, setSeeding]   = useState(false)
  const [error, setError]       = useState('')
  const downOnOverlay           = useRef(false)

  const load = useCallback(async () => {
    const data = await api.get<GameRecipe[]>('/api/admin/recipes')
    setRecipes(data)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = recipes.filter(r => {
    const matchS = r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search.toLowerCase())
    const matchC = catF === 'all' || r.category === catF
    return matchS && matchC
  })

  const handleSave = async () => {
    if (!editing) return
    setError(''); setLoading(true)
    try {
      if (editing.created_at) await api.put(`/api/admin/recipes/${editing.id}`, editing)
      else                     await api.post('/api/admin/recipes', editing)
      setEditing(null); await load(); onMutate()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir receita "${id}"?`)) return
    await api.delete(`/api/admin/recipes/${id}`)
    await load(); onMutate()
  }

  const handleSeed = async () => {
    if (!confirm('Importar todas as receitas padrão? Receitas existentes não serão substituídas.')) return
    setSeeding(true)
    const arr = Object.values(RECIPE_DEFS).map(r => ({
      id: r.id, name: r.name, category: r.category,
      output_item_id: r.outputItemId, output_quantity: r.outputQuantity,
      required_tier: r.requiredTier, ingredients: r.ingredients,
    }))
    const result = await api.post<{ inserted: number }>('/api/admin/recipes/seed', arr)
    alert(`${result.inserted} receitas importadas.`)
    await load(); onMutate(); setSeeding(false)
  }

  const setF = (k: string, v: unknown) => setEditing(prev => prev ? {...prev, [k]: v} : null)
  const ings = (editing?.ingredients ?? []) as Ingredient[]
  const addIng    = () => setEditing(p => p ? {...p, ingredients:[...ings,{itemId:'',quantity:1}]} : null)
  const removeIng = (i: number) => setEditing(p => p ? {...p, ingredients:ings.filter((_,j)=>j!==i)} : null)
  const setIng    = (i: number, k: keyof Ingredient, v: string|number) =>
    setEditing(p => { if(!p) return null; const d=[...ings]; d[i]={...d[i],[k]:v}; return {...p,ingredients:d} })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar receita..."
          className="flex-1 min-w-48 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text placeholder:text-muted outline-none focus:border-gold/50" />
        <select value={catF} onChange={e=>setCatF(e.target.value)}
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text outline-none">
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <button onClick={()=>setEditing({...EMPTY})}
          className="px-4 py-1.5 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors">
          + Nova Receita
        </button>
        <button onClick={handleSeed} disabled={seeding}
          className="px-4 py-1.5 text-sm border border-border text-muted rounded hover:bg-surface-2 transition-colors disabled:opacity-50">
          {seeding ? '...' : '↓ Importar Padrão'}
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted text-xs uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Output</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-left">Ingredientes</th>
              <th className="px-3 py-2 text-center">Visível</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-surface-2/50 transition-colors">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold" style={{color:CAT_COLORS[r.category]??'#94a3b8'}}>
                    {CAT_LABEL[r.category]??r.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted text-xs font-mono">
                  {r.output_item_id} ×{r.output_quantity}
                </td>
                <td className="px-3 py-2 text-muted text-xs">T{r.required_tier}</td>
                <td className="px-3 py-2 text-muted text-xs">
                  {(r.ingredients as Ingredient[]).length} ingredientes
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-xs font-bold ${r.active ? 'text-green-400' : 'text-slate-600'}`}>
                    {r.active ? '●' : '○'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={()=>setEditing({...r, ingredients: r.ingredients as Ingredient[]})}
                    className="text-xs text-gold hover:text-gold/70 mr-3">Editar</button>
                  <button onClick={()=>handleDelete(r.id)}
                    className="text-xs text-danger hover:text-danger/70">Excluir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">
                {recipes.length === 0 ? 'Nenhuma receita. Clique em "Importar Padrão" para começar.' : 'Nenhuma receita encontrada.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-2">{filtered.length} de {recipes.length} receitas</p>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onMouseDown={e => { downOnOverlay.current = e.target === e.currentTarget }}
          onMouseUp={e => { if (downOnOverlay.current && e.target === e.currentTarget) setEditing(null) }}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onMouseDown={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
              <h2 className="text-gold font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Receita' : 'Nova Receita'}
              </h2>
              <button onClick={()=>setEditing(null)} className="text-muted hover:text-text text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <RF label="ID" value={editing.id??''} onChange={v=>setF('id',v)} disabled={!!editing.created_at} />
              <RF label="Nome" value={editing.name??''} onChange={v=>setF('name',v)} />

              <div>
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Categoria</label>
                <select value={editing.category??'forja'} onChange={e=>setF('category',e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none">
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>
              <RF label="Tier Requerido" value={String(editing.required_tier??1)} onChange={v=>setF('required_tier',Number(v))} type="number" />

              <RF label="Item de Saída (ID)" value={editing.output_item_id??''} onChange={v=>setF('output_item_id',v)} />
              <RF label="Quantidade" value={String(editing.output_quantity??1)} onChange={v=>setF('output_quantity',Number(v))} type="number" />

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="r-active" checked={editing.active??true} onChange={e=>setF('active',e.target.checked)} className="w-4 h-4 accent-jade" />
                <label htmlFor="r-active" className="text-sm cursor-pointer">Visível na Forja</label>
                {!(editing.active??true) && (
                  <span className="text-xs text-slate-500 ml-1">— receita oculta, não aparece na tela de craft</span>
                )}
              </div>

              {/* Ingredients */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Ingredientes</label>
                  <button onClick={addIng}
                    className="text-xs border border-jade text-jade bg-jade/10 rounded px-3 py-1 hover:bg-jade/20">
                    + Adicionar
                  </button>
                </div>
                {ings.length === 0 && (
                  <p className="text-sm text-muted text-center py-3 border border-dashed border-border rounded">Sem ingredientes.</p>
                )}
                {ings.map((ing, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-2 mb-2">
                    <input value={ing.itemId} onChange={e=>setIng(i,'itemId',e.target.value)} placeholder="item_id"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-gold/50" />
                    <input value={ing.quantity} onChange={e=>setIng(i,'quantity',Number(e.target.value))} type="number" min="1"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none text-center" title="Quantidade" />
                    <button onClick={()=>removeIng(i)}
                      className="bg-danger/10 border border-danger/30 text-danger rounded hover:bg-danger/20 text-xs">×</button>
                  </div>
                ))}
              </div>

              {error && <p className="col-span-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={()=>setEditing(null)}
                className="px-4 py-2 text-sm border border-border text-muted rounded hover:bg-surface-2">Cancelar</button>
              <button onClick={handleSave} disabled={loading}
                className="px-4 py-2 text-sm border border-gold text-gold bg-gold/10 rounded hover:bg-gold/20 disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RF({ label, value, onChange, disabled, type='text' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string
}) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-widest block mb-1">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
        className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50 disabled:opacity-50" />
    </div>
  )
}
