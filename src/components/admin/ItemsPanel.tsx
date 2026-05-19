import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { GameItem } from '../../types/server'
import { SpriteUpload } from './SpriteUpload'
import { EmojiPicker } from './EmojiPicker'
import { useSpritesStore } from '../../store/spritesStore'

const TYPES    = ['weapon','armor','accessory','material','pill','ring','talisman'] as const
const RARITIES = ['common','uncommon','spiritual','rare','ancient','legendary']
const RARITY_ORDER: Record<string, number> = {
  common:0, uncommon:1, spiritual:2, rare:3, ancient:4, legendary:5,
}
const RARITY_COLORS: Record<string, string> = {
  common:'#94a3b8', uncommon:'#4ade80', spiritual:'#60a5fa',
  rare:'#a855f7', ancient:'#f97316', legendary:'#ef4444',
}
const TYPE_LABELS: Record<string, string> = {
  weapon:'⚔️ Arma', armor:'🛡️ Armadura', accessory:'💎 Acessório',
  material:'🌿 Material', pill:'💊 Pílula', ring:'💍 Anel', talisman:'📜 Talismã',
}

const EMPTY_ITEM: Omit<GameItem,'created_at'|'updated_at'> = {
  id:'', name:'', emoji:'📦', type:'material', rarity:'common',
  description:'', stats:{}, stackable:false, tier:1, active:true, sprite_url:null,
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/60'

type SortField = 'name' | 'type' | 'rarity' | 'tier'
type SortDir   = 'asc' | 'desc'

interface Props { onMutate: () => void }

// ── Cabeçalho de coluna ordenável ─────────────────────────────────
function Th({ label, field, sort, dir, onSort, className = '' }: {
  label: string; field: SortField; sort: SortField; dir: SortDir
  onSort: (f: SortField) => void; className?: string
}) {
  const active = sort === field
  return (
    <th onClick={() => onSort(field)}
      className={`px-3 py-2 text-left cursor-pointer select-none group ${className}`}>
      <span className={`flex items-center gap-1 ${active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
        {label}
        <span className="text-[10px] tabular-nums">
          {active ? (dir === 'asc' ? '↑' : '↓') : '⇅'}
        </span>
      </span>
    </th>
  )
}

export function ItemsPanel({ onMutate }: Props) {
  const [items, setItems]         = useState<GameItem[]>([])
  const [search, setSearch]       = useState('')
  const [typeFilter, setType]     = useState('all')
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir,   setSortDir]   = useState<SortDir>('asc')
  const [editing, setEditing]     = useState<Partial<GameItem> | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const load = useCallback(async () => {
    const data = await api.get<GameItem[]>('/api/admin/items')
    setItems(data)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSort = (f: SortField) => {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.id.includes(q)
    const matchType   = typeFilter === 'all' || i.type === typeFilter
    const matchTier   = tierFilter === 'all' || (i.tier ?? 1) === tierFilter
    return matchSearch && matchType && matchTier
  })

  const sorted = [...filtered].sort((a, b) => {
    const d = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'name':   return d * a.name.localeCompare(b.name)
      case 'type':   return d * a.type.localeCompare(b.type)
      case 'rarity': return d * ((RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0))
      case 'tier':   return d * ((a.tier ?? 1) - (b.tier ?? 1))
      default:       return 0
    }
  })

  const handleSave = async () => {
    if (!editing) return
    setError(''); setLoading(true)
    try {
      if (editing.created_at) await api.put(`/api/admin/items/${editing.id}`, editing)
      else                    await api.post('/api/admin/items', editing)
      setEditing(null); await load(); onMutate()
      useSpritesStore.setState({ loading: false })
      void useSpritesStore.getState().load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir item "${id}"?`)) return
    await api.delete(`/api/admin/items/${id}`)
    await load(); onMutate()
  }

  const setField = (k: string, v: unknown) => setEditing(prev => prev ? { ...prev, [k]: v } : null)
  const setStat  = (k: string, v: string) => setEditing(prev => {
    if (!prev) return null
    const stats = { ...(prev.stats ?? {}), [k]: v === '' ? undefined : Number(v) }
    Object.keys(stats).forEach(key => stats[key] === undefined && delete stats[key])
    return { ...prev, stats: stats as Record<string, number> }
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar item..."
          className="flex-1 min-w-40 bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60" />
        <button onClick={() => setEditing({...EMPTY_ITEM})}
          className="px-4 py-1.5 text-sm border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors">
          + Novo Item
        </button>
      </div>

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-600 mr-1 font-cinzel uppercase tracking-widest">Tipo:</span>
        {(['all', ...TYPES] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`text-xs px-3 py-1 border transition-all ${typeFilter === t
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
            {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filtro por tier */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-600 mr-1 font-cinzel uppercase tracking-widest">Tier:</span>
        <button onClick={() => setTierFilter('all')}
          className={`text-xs px-3 py-1 border transition-all ${tierFilter === 'all'
            ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
          Todos
        </button>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(t => (
          <button key={t} onClick={() => setTierFilter(t)}
            className={`text-xs px-2.5 py-1 border transition-all ${tierFilter === t
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
            T{t}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2 text-left w-8 text-slate-500"></th>
              <th className="px-3 py-2 text-left text-slate-500 w-40">ID</th>
              <Th label="Nome"     field="name"   sort={sortField} dir={sortDir} onSort={handleSort} />
              <Th label="Tipo"     field="type"   sort={sortField} dir={sortDir} onSort={handleSort} />
              <Th label="Raridade" field="rarity" sort={sortField} dir={sortDir} onSort={handleSort} />
              <Th label="Tier"     field="tier"   sort={sortField} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-slate-500">Stats</th>
              <th className="px-3 py-2 text-right text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr key={item.id} className={`border-t border-slate-800 hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'}`}>
                <td className="px-3 py-2 text-lg">{item.emoji}</td>
                <td className="px-3 py-2 text-slate-600 text-xs font-mono truncate max-w-[140px]">{item.id}</td>
                <td className="px-3 py-2 font-semibold text-slate-200">{item.name}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{item.type}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity}</span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500 tabular-nums">T{item.tier ?? 1}</td>
                <td className="px-3 py-2 text-xs text-slate-600 max-w-[160px] truncate">
                  {Object.entries(item.stats).map(([k,v]) => `${k}:${v}`).join(' ')}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing({...item})}
                    className="text-xs text-amber-400 hover:text-amber-300 mr-3">Editar</button>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600 text-sm">
                {items.length === 0 ? 'Nenhum item.' : 'Nenhum item encontrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">{sorted.length} de {items.length} itens</p>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setEditing(null)}>
          <div className="bg-slate-950 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950">
              <h2 className="font-cinzel text-amber-400 font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <F label="ID (slug)" value={editing.id ?? ''} onChange={v => setField('id', v)}
                placeholder="item_slug" disabled={!!editing.created_at} />
              <F label="Nome" value={editing.name ?? ''} onChange={v => setField('name', v)} />
              <EmojiPicker
                value={editing.emoji ?? '📦'}
                onChange={v => setField('emoji', v)}
                spriteUrl={editing.sprite_url ?? null}
              />

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Tipo</label>
                <select value={editing.type ?? 'material'} onChange={e => setField('type', e.target.value)} className={inp}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Raridade</label>
                <select value={editing.rarity ?? 'common'} onChange={e => setField('rarity', e.target.value)} className={inp}>
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Tier (1–10)</label>
                <select value={editing.tier ?? 1} onChange={e => setField('tier', Number(e.target.value))} className={inp}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(t => (
                    <option key={t} value={t}>T{t}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Descrição</label>
                <textarea value={editing.description ?? ''} onChange={e => setField('description', e.target.value)} rows={2}
                  className={`${inp} resize-none`} />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Stats</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['atk','def','hp','qi','crit','speed','slots'] as const).map(stat => (
                    <div key={stat}>
                      <label className="text-xs text-slate-600 block mb-1">{stat.toUpperCase()}</label>
                      <input type="number" step="0.1"
                        value={(editing.stats as Record<string,number>)?.[stat] ?? ''}
                        onChange={e => setStat(stat, e.target.value)}
                        className={inp} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input type="checkbox" checked={editing.stackable ?? false}
                    onChange={e => setField('stackable', e.target.checked)} className="accent-teal-500" />
                  Empilhável
                </label>
                {editing.created_at && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input type="checkbox" checked={editing.active ?? true}
                      onChange={e => setField('active', e.target.checked)} className="accent-teal-500" />
                    Ativo
                  </label>
                )}
              </div>

              <div className="col-span-2">
                <SpriteUpload value={editing.sprite_url ?? null} onChange={url => setField('sprite_url', url)}
                  type="item" entityId={editing.id ?? ''} />
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

function F({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed" />
    </div>
  )
}
