import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { GameMonster } from '../../types/server'
import { SpriteUpload } from './SpriteUpload'
import { EmojiPicker } from './EmojiPicker'
import { useSpritesStore } from '../../store/spritesStore'
import { BulkImportButton } from './BulkImportButton'

const RARITIES = ['common','spiritual','rare','ancient']
const RARITY_COLORS: Record<string, string> = {
  common:'#94a3b8', spiritual:'#60a5fa', rare:'#a855f7', ancient:'#f97316',
}
const REALMS = [
  { value: 'qi_refining',           label: 'Refinamento de Qi' },
  { value: 'foundation',            label: 'Fundação Espiritual' },
  { value: 'golden_core',           label: 'Núcleo Dourado' },
  { value: 'nascent_soul',          label: 'Alma Nascente' },
  { value: 'spirit_transformation', label: 'Transformação Espiritual' },
  { value: 'unification',           label: 'Unificação' },
  { value: 'ascension',             label: 'Ascensão' },
  { value: 'immortal',              label: 'Imortal' },
]

const inp = 'w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/60'

type DropEntry = GameMonster['drop_table'][number]

const EMPTY: Omit<GameMonster,'created_at'|'updated_at'> = {
  id:'', name:'', emoji:'👾', level_min:1, level_max:5, rarity:'common',
  biome_id:'forest', is_boss:false, is_elite:false, base_hp:50, base_atk:5, base_def:1,
  speed:1.5, qi_reward:10, gold_reward_min:1, gold_reward_max:5,
  drop_table:[], active:true, sprite_url:null, required_realm:'qi_refining',
}

interface Props { onMutate: () => void }

export function MonstersPanel({ onMutate }: Props) {
  const [monsters, setMonsters] = useState<GameMonster[]>([])
  const [biomeList, setBiomeList] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch]   = useState('')
  const [biomeF, setBiomeF]   = useState('all')
  const [editing, setEditing] = useState<Partial<GameMonster> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    const [data, biomeData] = await Promise.all([
      api.get<GameMonster[]>('/api/admin/monsters'),
      api.get<{ id: string; name: string }[]>('/api/admin/biomes').catch(() => [] as { id: string; name: string }[]),
    ])
    setMonsters(data)
    setBiomeList(biomeData)
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = monsters.filter(m => {
    const matchS = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search.toLowerCase())
    const matchB = biomeF === 'all' || m.biome_id === biomeF
    return matchS && matchB
  })

  const handleSave = async () => {
    if (!editing) return
    setError(''); setLoading(true)
    try {
      if (editing.created_at) await api.put(`/api/admin/monsters/${editing.id}`, editing)
      else                    await api.post('/api/admin/monsters', editing)
      setEditing(null); await load(); onMutate()
      useSpritesStore.setState({ loading: false })
      void useSpritesStore.getState().load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir monstro "${id}"?`)) return
    await api.delete(`/api/admin/monsters/${id}`)
    await load(); onMutate()
  }

  const setF = (k: string, v: unknown) => setEditing(prev => prev ? {...prev, [k]: v} : null)
  const drops = (editing?.drop_table ?? []) as DropEntry[]
  const addDrop    = () => setEditing(p => p ? {...p, drop_table: [...drops, {itemId:'',chance:1,quantityMin:1,quantityMax:1}]} : null)
  const removeDrop = (i: number) => setEditing(p => p ? {...p, drop_table: drops.filter((_,j) => j !== i)} : null)
  const setDrop    = (i: number, k: keyof DropEntry, v: string | number) =>
    setEditing(p => { if (!p) return null; const d = [...drops]; d[i] = {...d[i], [k]: v}; return {...p, drop_table: d} })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar monstro..."
          className="flex-1 min-w-40 bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60" />
        <button onClick={() => setEditing({...EMPTY})}
          className="px-4 py-1.5 text-sm border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors">
          + Novo Monstro
        </button>
        <BulkImportButton endpoint="/api/admin/monsters/seed" label="Importar JSON" onSuccess={load} />
      </div>

      {/* Sub-tabs por bioma */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-600 mr-1 font-cinzel uppercase tracking-widest">Bioma:</span>
        <button onClick={() => setBiomeF('all')}
          className={`text-xs px-3 py-1 border transition-all ${biomeF === 'all'
            ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
          Todos
        </button>
        {biomeList.map(b => (
          <button key={b.id} onClick={() => setBiomeF(b.id)}
            className={`text-xs px-3 py-1 border transition-all ${biomeF === b.id
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
            {b.name}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
            <tr>
              <th className="px-3 py-2 text-left w-8"></th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Bioma</th>
              <th className="px-3 py-2 text-left">Nível</th>
              <th className="px-3 py-2 text-left">Raridade</th>
              <th className="px-3 py-2 text-left">HP / ATK / DEF</th>
              <th className="px-3 py-2 text-left">Drops</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr key={m.id} className={`border-t border-slate-800 hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'}`}>
                <td className="px-3 py-2 text-lg">{m.emoji}</td>
                <td className="px-3 py-2 font-semibold text-slate-200">
                  {m.name}
                  {m.is_boss && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 border border-amber-500/40 text-amber-400">BOSS</span>}
                </td>
                <td className="px-3 py-2 text-slate-500 text-xs">{biomeList.find(b => b.id === m.biome_id)?.name ?? m.biome_id}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{m.level_min}–{m.level_max}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold" style={{ color: RARITY_COLORS[m.rarity] }}>{m.rarity}</span>
                </td>
                <td className="px-3 py-2 text-slate-500 text-xs tabular-nums">{m.base_hp} / {m.base_atk} / {m.base_def}</td>
                <td className="px-3 py-2 text-slate-600 text-xs">{(m.drop_table as DropEntry[]).length} drops</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing({...m, drop_table: m.drop_table as DropEntry[]})}
                    className="text-xs text-amber-400 hover:text-amber-300 mr-3">Editar</button>
                  <button onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600 text-sm">
                {monsters.length === 0 ? 'Nenhum monstro cadastrado.' : 'Nenhum monstro encontrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">{filtered.length} de {monsters.length} monstros</p>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setEditing(null)}>
          <div className="bg-slate-950 border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950">
              <h2 className="font-cinzel text-amber-400 font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Monstro' : 'Novo Monstro'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
              <MF label="ID" value={editing.id??''} onChange={v=>setF('id',v)} disabled={!!editing.created_at} />
              <MF label="Nome" value={editing.name??''} onChange={v=>setF('name',v)} />
              <EmojiPicker
                value={editing.emoji ?? '👾'}
                onChange={v => setF('emoji', v)}
                spriteUrl={editing.sprite_url ?? null}
              />

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Bioma</label>
                <select value={editing.biome_id??'forest'} onChange={e=>setF('biome_id',e.target.value)} className={inp}>
                  {biomeList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Reino Requerido</label>
                <select value={(editing as Record<string,unknown>).required_realm as string ?? 'qi_refining'} onChange={e=>setF('required_realm',e.target.value)} className={inp}>
                  {REALMS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Raridade</label>
                <select value={editing.rarity??'common'} onChange={e=>setF('rarity',e.target.value)} className={inp}>
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex items-end gap-4 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input type="checkbox" checked={editing.is_boss??false} onChange={e=>setF('is_boss',e.target.checked)} className="accent-amber-500" />
                  Boss
                </label>
                {editing.created_at && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input type="checkbox" checked={editing.active??true} onChange={e=>setF('active',e.target.checked)} className="accent-teal-500" />
                    Ativo
                  </label>
                )}
              </div>
              <MF label="Nível Mín" value={String(editing.level_min??1)} onChange={v=>setF('level_min',Number(v))} type="number" />
              <MF label="Nível Máx" value={String(editing.level_max??5)} onChange={v=>setF('level_max',Number(v))} type="number" />

              <MF label="HP Base" value={String(editing.base_hp??50)} onChange={v=>setF('base_hp',Number(v))} type="number" />
              <MF label="ATK Base" value={String(editing.base_atk??5)} onChange={v=>setF('base_atk',Number(v))} type="number" />
              <MF label="DEF Base" value={String(editing.base_def??1)} onChange={v=>setF('base_def',Number(v))} type="number" />
              <MF label="Speed (s/atk)" value={String(editing.speed??1.5)} onChange={v=>setF('speed',Number(v))} type="number" />
              <MF label="Recompensa Qi" value={String(editing.qi_reward??10)} onChange={v=>setF('qi_reward',Number(v))} type="number" />
              <MF label="Ouro Mín" value={String(editing.gold_reward_min??1)} onChange={v=>setF('gold_reward_min',Number(v))} type="number" />
              <MF label="Ouro Máx" value={String(editing.gold_reward_max??5)} onChange={v=>setF('gold_reward_max',Number(v))} type="number" />

              {/* Drop table */}
              <div className="col-span-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-cinzel uppercase tracking-widest">Tabela de Drops</span>
                  <button onClick={addDrop}
                    className="text-xs border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 px-3 py-1 transition-colors">
                    + Drop
                  </button>
                </div>
                {drops.length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-3 border border-dashed border-slate-800">Sem drops definidos.</p>
                )}
                {drops.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_60px_60px_32px] gap-2 mb-2">
                    <input value={d.itemId} onChange={e=>setDrop(i,'itemId',e.target.value)} placeholder="item_id"
                      className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500/60" />
                    <input value={d.chance} onChange={e=>setDrop(i,'chance',Number(e.target.value))} type="number" step="0.01" min="0" max="1"
                      className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none text-center" title="Chance (0–1)" />
                    <input value={d.quantityMin} onChange={e=>setDrop(i,'quantityMin',Number(e.target.value))} type="number" min="1"
                      className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none text-center" title="Qtd Mín" />
                    <input value={d.quantityMax} onChange={e=>setDrop(i,'quantityMax',Number(e.target.value))} type="number" min="1"
                      className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none text-center" title="Qtd Máx" />
                    <button onClick={()=>removeDrop(i)}
                      className="bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-950/40 text-xs transition-colors">×</button>
                  </div>
                ))}
                {drops.length > 0 && <p className="text-xs text-slate-600 mt-1">Item ID · Chance (0–1) · Qtd Mín · Qtd Máx</p>}
              </div>

              <div className="col-span-3">
                <SpriteUpload value={(editing as Record<string, unknown>).sprite_url as string | null ?? null}
                  onChange={url => setF('sprite_url', url)} type="monster" entityId={editing.id ?? ''} />
              </div>

              {error && <p className="col-span-3 text-sm text-red-400 bg-red-950/20 border border-red-800/40 px-3 py-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-800 pt-4">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
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

function MF({ label, value, onChange, disabled, type = 'text' }: {
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
