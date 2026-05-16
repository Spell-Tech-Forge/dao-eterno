import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { GameMonster } from '../../types/server'
import { MONSTER_DEFS } from '../../data/monsters'
import { SpriteUpload } from './SpriteUpload'
import { BIOME_DEFS } from '../../data/biomes'

const RARITIES = ['common','spiritual','rare','ancient']
const RARITY_COLORS: Record<string, string> = {
  common:'#94a3b8', spiritual:'#60a5fa', rare:'#a855f7', ancient:'#f97316',
}

type DropEntry = GameMonster['drop_table'][number]

const EMPTY: Omit<GameMonster,'created_at'|'updated_at'> = {
  id:'', name:'', emoji:'👾', level_min:1, level_max:5, rarity:'common',
  biome_id:'forest', is_boss:false, base_hp:50, base_atk:5, base_def:1,
  speed:1.5, qi_reward:10, gold_reward_min:1, gold_reward_max:5,
  drop_table:[], active:true,
}

interface Props { onMutate: () => void }

export function MonstersPanel({ onMutate }: Props) {
  const [monsters, setMonsters] = useState<GameMonster[]>([])
  const [search, setSearch]     = useState('')
  const [biomeF, setBiomeF]     = useState('all')
  const [editing, setEditing]   = useState<Partial<GameMonster> | null>(null)
  const [loading, setLoading]   = useState(false)
  const [seeding, setSeeding]   = useState(false)
  const [error, setError]       = useState('')

  const biomes = Object.values(BIOME_DEFS)

  const load = useCallback(async () => {
    const data = await api.get<GameMonster[]>('/api/admin/monsters')
    setMonsters(data)
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
      else                     await api.post('/api/admin/monsters', editing)
      setEditing(null); await load(); onMutate()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Excluir monstro "${id}"?`)) return
    await api.delete(`/api/admin/monsters/${id}`)
    await load(); onMutate()
  }

  const handleSeed = async () => {
    if (!confirm('Importar todos os monstros padrão? Monstros existentes não serão substituídos.')) return
    setSeeding(true)
    const arr = Object.values(MONSTER_DEFS).map(m => ({
      id: m.id, name: m.name, emoji: m.emoji,
      level_min: m.levelMin, level_max: m.levelMax, rarity: m.rarity,
      biome_id: m.biomeId, is_boss: m.isBoss,
      base_hp: m.baseHp, base_atk: m.baseAtk, base_def: m.baseDef, speed: m.speed,
      qi_reward: m.qiReward, gold_reward_min: m.goldReward.min, gold_reward_max: m.goldReward.max,
      drop_table: m.dropTable.map(d => ({ itemId: d.itemId, chance: d.chance, quantityMin: d.quantityMin, quantityMax: d.quantityMax })),
    }))
    const result = await api.post<{ inserted: number }>('/api/admin/monsters/seed', arr)
    alert(`${result.inserted} monstros importados.`)
    await load(); onMutate(); setSeeding(false)
  }

  const setF = (k: string, v: unknown) => setEditing(prev => prev ? {...prev, [k]: v} : null)

  const drops = (editing?.drop_table ?? []) as DropEntry[]
  const addDrop    = () => setEditing(p => p ? {...p, drop_table: [...drops, {itemId:'',chance:1,quantityMin:1,quantityMax:1}]} : null)
  const removeDrop = (i: number) => setEditing(p => p ? {...p, drop_table: drops.filter((_,j) => j !== i)} : null)
  const setDrop    = (i: number, k: keyof DropEntry, v: string | number) =>
    setEditing(p => { if (!p) return null; const d = [...drops]; d[i] = {...d[i], [k]: v}; return {...p, drop_table: d} })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar monstro..."
          className="flex-1 min-w-48 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text placeholder:text-muted outline-none focus:border-gold/50" />
        <select value={biomeF} onChange={e => setBiomeF(e.target.value)}
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text outline-none">
          <option value="all">Todos os biomas</option>
          {biomes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button onClick={() => setEditing({...EMPTY})}
          className="px-4 py-1.5 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors">
          + Novo Monstro
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
              <th className="px-3 py-2 text-left">Emoji</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Bioma</th>
              <th className="px-3 py-2 text-left">Nível</th>
              <th className="px-3 py-2 text-left">Raridade</th>
              <th className="px-3 py-2 text-left">HP/ATK/DEF</th>
              <th className="px-3 py-2 text-left">Drops</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t border-border hover:bg-surface-2/50 transition-colors">
                <td className="px-3 py-2 text-lg">{m.emoji}</td>
                <td className="px-3 py-2 font-medium">
                  {m.name} {m.is_boss && <span className="ml-1 text-xs text-gold">BOSS</span>}
                </td>
                <td className="px-3 py-2 text-muted text-xs">{m.biome_id}</td>
                <td className="px-3 py-2 text-muted text-xs">{m.level_min}–{m.level_max}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold" style={{ color: RARITY_COLORS[m.rarity] }}>{m.rarity}</span>
                </td>
                <td className="px-3 py-2 text-muted text-xs">{m.base_hp}/{m.base_atk}/{m.base_def}</td>
                <td className="px-3 py-2 text-muted text-xs">{(m.drop_table as DropEntry[]).length} drops</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing({...m, drop_table: m.drop_table as DropEntry[]})}
                    className="text-xs text-gold hover:text-gold/70 mr-3">Editar</button>
                  <button onClick={() => handleDelete(m.id)}
                    className="text-xs text-danger hover:text-danger/70">Excluir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted text-sm">
                {monsters.length === 0 ? 'Nenhum monstro. Clique em "Importar Padrão" para começar.' : 'Nenhum monstro encontrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-2">{filtered.length} de {monsters.length} monstros</p>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditing(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
              <h2 className="text-gold font-bold tracking-widest text-sm uppercase">
                {editing.created_at ? 'Editar Monstro' : 'Novo Monstro'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-text text-xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
              {/* Row 1 */}
              <MF label="ID" value={editing.id??''} onChange={v=>setF('id',v)} disabled={!!editing.created_at} />
              <MF label="Nome" value={editing.name??''} onChange={v=>setF('name',v)} />
              <MF label="Emoji" value={editing.emoji??''} onChange={v=>setF('emoji',v)} />

              {/* Row 2 */}
              <div>
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Bioma</label>
                <select value={editing.biome_id??'forest'} onChange={e=>setF('biome_id',e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none">
                  {biomes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-widest block mb-1">Raridade</label>
                <select value={editing.rarity??'common'} onChange={e=>setF('rarity',e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none">
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.is_boss??false} onChange={e=>setF('is_boss',e.target.checked)} className="w-4 h-4 accent-gold" />
                  <span className="text-sm">Boss</span>
                </label>
                {editing.created_at && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.active??true} onChange={e=>setF('active',e.target.checked)} className="w-4 h-4 accent-jade" />
                    <span className="text-sm">Ativo</span>
                  </label>
                )}
              </div>

              {/* Levels */}
              <MF label="Nível Mín" value={String(editing.level_min??1)} onChange={v=>setF('level_min',Number(v))} type="number" />
              <MF label="Nível Máx" value={String(editing.level_max??5)} onChange={v=>setF('level_max',Number(v))} type="number" />
              <MF label="Speed (s/atk)" value={String(editing.speed??1.5)} onChange={v=>setF('speed',Number(v))} type="number" />

              {/* Combat */}
              <MF label="HP Base" value={String(editing.base_hp??50)} onChange={v=>setF('base_hp',Number(v))} type="number" />
              <MF label="ATK Base" value={String(editing.base_atk??5)} onChange={v=>setF('base_atk',Number(v))} type="number" />
              <MF label="DEF Base" value={String(editing.base_def??1)} onChange={v=>setF('base_def',Number(v))} type="number" />

              {/* Rewards */}
              <MF label="Recompensa Qi" value={String(editing.qi_reward??10)} onChange={v=>setF('qi_reward',Number(v))} type="number" />
              <MF label="Ouro Mín" value={String(editing.gold_reward_min??1)} onChange={v=>setF('gold_reward_min',Number(v))} type="number" />
              <MF label="Ouro Máx" value={String(editing.gold_reward_max??5)} onChange={v=>setF('gold_reward_max',Number(v))} type="number" />

              {/* Drop table */}
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Tabela de Drops</label>
                  <button onClick={addDrop}
                    className="text-xs border border-jade text-jade bg-jade/10 rounded px-3 py-1 hover:bg-jade/20">
                    + Adicionar Drop
                  </button>
                </div>
                {drops.length === 0 && (
                  <p className="text-sm text-muted text-center py-3 border border-dashed border-border rounded">Sem drops definidos.</p>
                )}
                {drops.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_60px_60px_32px] gap-2 mb-2">
                    <input value={d.itemId} onChange={e=>setDrop(i,'itemId',e.target.value)} placeholder="item_id"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-gold/50" />
                    <input value={d.chance} onChange={e=>setDrop(i,'chance',Number(e.target.value))} placeholder="Chance" type="number" step="0.01" min="0" max="1"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none text-center" title="Chance (0–1)" />
                    <input value={d.quantityMin} onChange={e=>setDrop(i,'quantityMin',Number(e.target.value))} type="number" min="1"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none text-center" title="Qtd Mín" />
                    <input value={d.quantityMax} onChange={e=>setDrop(i,'quantityMax',Number(e.target.value))} type="number" min="1"
                      className="bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text outline-none text-center" title="Qtd Máx" />
                    <button onClick={()=>removeDrop(i)}
                      className="bg-danger/10 border border-danger/30 text-danger rounded hover:bg-danger/20 text-xs">×</button>
                  </div>
                ))}
                {drops.length > 0 && (
                  <p className="text-xs text-muted mt-1">Colunas: Item ID · Chance (0–1) · Qtd Mín · Qtd Máx</p>
                )}
              </div>

              <div className="col-span-3">
                <SpriteUpload
                  value={(editing as Record<string, unknown>).sprite_url as string | null ?? null}
                  onChange={url => setF('sprite_url', url)}
                  type="monster"
                  entityId={editing.id ?? ''}
                />
              </div>

              {error && <p className="col-span-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)}
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

function MF({ label, value, onChange, disabled, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string
}) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-widest block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text outline-none focus:border-gold/50 disabled:opacity-50" />
    </div>
  )
}
