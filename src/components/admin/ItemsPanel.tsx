import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { GameItem } from '../../types/server'
import { ITEM_DEFS } from '../../data/items'
import { SpriteUpload } from './SpriteUpload'

const TYPES    = ['weapon','armor','accessory','material','pill','ring','talisman']
const RARITIES = ['common','uncommon','spiritual','rare','ancient','legendary']
const RARITY_COLORS: Record<string, string> = {
  common:'#94a3b8', uncommon:'#4ade80', spiritual:'#60a5fa',
  rare:'#a855f7', ancient:'#f97316', legendary:'#ef4444', heirloom:'#4a9e7f',
}

const EMPTY_ITEM: Omit<GameItem,'created_at'|'updated_at'> = {
  id:'', name:'', emoji:'📦', type:'material', rarity:'common',
  description:'', stats:{}, stackable:false, active:true,
}

interface Props { onMutate: () => void }

export function ItemsPanel({ onMutate }: Props) {
  const [items, setItems]     = useState<GameItem[]>([])
  const [search, setSearch]   = useState('')
  const [typeFilter, setType] = useState('all')
  const [editing, setEditing] = useState<Partial<GameItem> | null>(null)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    const data = await api.get<GameItem[]>('/api/admin/items')
    setItems(data)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || i.type === typeFilter
    return matchSearch && matchType
  })

  const handleSave = async () => {
    if (!editing) return
    setError(''); setLoading(true)
    try {
      if (editing.created_at) {
        await api.put(`/api/admin/items/${editing.id}`, editing)
      } else {
        await api.post('/api/admin/items', editing)
      }
      setEditing(null); await load(); onMutate()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir item "${id}"?`)) return
    await api.delete(`/api/admin/items/${id}`)
    await load(); onMutate()
  }

  const handleSeed = async () => {
    if (!confirm('Importar todos os itens padrão do jogo? Itens existentes não serão substituídos.')) return
    setSeeding(true)
    const arr = Object.values(ITEM_DEFS).map(i => ({
      id: i.id, name: i.name, emoji: i.emoji, type: i.type, rarity: i.rarity,
      description: i.description, stats: i.stats ?? {}, stackable: i.stackable ?? false,
    }))
    const result = await api.post<{ inserted: number }>('/api/admin/items/seed', arr)
    alert(`${result.inserted} itens importados.`)
    await load(); onMutate(); setSeeding(false)
  }

  const setField = (k: string, v: unknown) => setEditing(prev => prev ? { ...prev, [k]: v } : null)
  const setStat  = (k: string, v: string) => setEditing(prev => {
    if (!prev) return null
    const stats = { ...(prev.stats ?? {}), [k]: v === '' ? undefined : Number(v) }
    Object.keys(stats).forEach(key => stats[key] === undefined && delete stats[key])
    return { ...prev, stats }
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar item..."
          className="flex-1 min-w-48 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text placeholder:text-muted outline-none focus:border-gold/50" />
        <select value={typeFilter} onChange={e => setType(e.target.value)}
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text outline-none">
          <option value="all">Todos os tipos</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => setEditing({...EMPTY_ITEM})}
          className="px-4 py-1.5 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors">
          + Novo Item
        </button>
        <button onClick={handleSeed} disabled={seeding}
          className="px-4 py-1.5 text-sm border border-border text-muted rounded hover:bg-surface-2 transition-colors disabled:opacity-50">
          {seeding ? '...' : '↓ Importar Padrão'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted text-xs uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2 text-left">Emoji</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Raridade</th>
              <th className="px-3 py-2 text-left">Stats</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-t border-border hover:bg-surface-2/50 transition-colors">
                <td className="px-3 py-2 text-lg">{item.emoji}</td>
                <td className="px-3 py-2 text-muted text-xs font-mono">{item.id}</td>
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 text-muted">{item.type}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {item.rarity}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted">
                  {Object.entries(item.stats).map(([k,v]) => `${k}:${v}`).join(' ')}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing({...item})}
                    className="text-xs text-gold hover:text-gold/70 mr-3">Editar</button>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-xs text-danger hover:text-danger/70">Excluir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted text-sm">
                {items.length === 0 ? 'Nenhum item. Clique em "Importar Padrão" para começar.' : 'Nenhum item encontrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-2">{filtered.length} de {items.length} itens</p>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditing(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
              <h2 className="text-gold font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-text text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <Field label="ID (slug)" value={editing.id ?? ''} onChange={v => setField('id', v)}
                placeholder="item_slug" disabled={!!editing.created_at} span={1} />
              <Field label="Nome" value={editing.name ?? ''} onChange={v => setField('name', v)} span={1} />
              <Field label="Emoji" value={editing.emoji ?? ''} onChange={v => setField('emoji', v)} span={1} />

              <div>
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Tipo</label>
                <select value={editing.type ?? 'material'} onChange={e => setField('type', e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Raridade</label>
                <select value={editing.rarity ?? 'common'} onChange={e => setField('rarity', e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50">
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Descrição</label>
                <textarea value={editing.description ?? ''} onChange={e => setField('description', e.target.value)} rows={2}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50 resize-none" />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted uppercase tracking-widest block mb-2">Stats</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['atk','def','hp','qi','crit','speed','slots'] as const).map(stat => (
                    <div key={stat}>
                      <label className="text-xs text-muted block mb-1">{stat.toUpperCase()}</label>
                      <input type="number" step="0.1"
                        value={(editing.stats as Record<string,number>)?.[stat] ?? ''}
                        onChange={e => setStat(stat, e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-sm text-text outline-none focus:border-gold/50" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="stackable" checked={editing.stackable ?? false}
                  onChange={e => setField('stackable', e.target.checked)}
                  className="w-4 h-4 accent-jade" />
                <label htmlFor="stackable" className="text-sm text-text cursor-pointer">Empilhável</label>
                {editing.created_at && (
                  <>
                    <input type="checkbox" id="active" checked={editing.active ?? true}
                      onChange={e => setField('active', e.target.checked)}
                      className="w-4 h-4 accent-jade ml-4" />
                    <label htmlFor="active" className="text-sm text-text cursor-pointer">Ativo</label>
                  </>
                )}
              </div>

              <div className="col-span-2">
                <SpriteUpload
                  value={editing.sprite_url ?? null}
                  onChange={url => setField('sprite_url', url)}
                  type="item"
                  entityId={editing.id ?? ''}
                />
              </div>

              {error && <p className="col-span-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm border border-border text-muted rounded hover:bg-surface-2 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={loading}
                className="px-4 py-2 text-sm border border-gold text-gold bg-gold/10 rounded hover:bg-gold/20 transition-colors disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, disabled, span }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; span?: number
}) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="text-xs text-muted uppercase tracking-widest block mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50 disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  )
}
