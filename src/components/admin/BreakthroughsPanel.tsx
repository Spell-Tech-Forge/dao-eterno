import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import { BulkImportButton } from './BulkImportButton'


const REALMS = [
  { id: 'body_tempering',       label: 'Temperamento Corporal' },
  { id: 'houtian',              label: 'Pré-Celestial' },
  { id: 'xiantian',             label: 'Pós-Celestial' },
  { id: 'revolving_core',       label: 'Núcleo Giratório' },
  { id: 'life_destruction',     label: 'Destruição da Vida' },
  { id: 'divine_sea',           label: 'Mar Divino' },
  { id: 'divine_transformation',label: 'Transformação Divina' },
  { id: 'divine_lord',          label: 'Senhor Divino' },
  { id: 'holy_lord',            label: 'Senhor Sagrado' },
  { id: 'world_king',           label: 'Rei do Mundo' },
  { id: 'empyrean',             label: 'Empíreo' },
  { id: 'true_divinity',        label: 'Verdadeira Divindade' },
  { id: 'beyond_divinity',      label: 'Além da Divindade' },
]
const STAGE_LABELS: Record<string, string> = {
  // padrão
  initial:'Inicial', middle:'Médio', advanced:'Avançado', peak:'Pico',
  // body_tempering
  strength:'Força', muscle:'Músculo', bone:'Osso', marrow:'Medula',
  meridian:'Meridiano', eight_gates:'Oito Portões', nine_stars:'Nove Estrelas',
  // life_destruction
  destruction_1:'1ª', destruction_2:'2ª', destruction_3:'3ª',
  destruction_4:'4ª', destruction_5:'5ª', destruction_6:'6ª',
  destruction_7:'7ª', destruction_8:'8ª', destruction_9:'9ª',
}
const REALM_ALL = REALMS

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

interface DbBreakthrough {
  id: string; realm: string; stage: string
  next_realm: string; next_stage: string
  new_max_qi: string | number
  required_items: { itemId: string; quantity: number }[]
  active: boolean
}

interface ItemReq { itemId: string; quantity: number }
interface Props { onMutate: () => void }

export function BreakthroughsPanel({ onMutate }: Props) {
  const [rows,    setRows]    = useState<DbBreakthrough[]>([])
  const [editing, setEditing] = useState<DbBreakthrough | null>(null)
  const [msg,     setMsg]     = useState('')

  const itemDefs = useGameDataStore(s => s.items)

  const load = useCallback(async () => {
    const data = await api.get<DbBreakthrough[]>('/api/admin/breakthroughs')
    setRows(data)
  }, [])
  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function handleSave() {
    if (!editing) return
    try {
      await api.put(`/api/admin/breakthroughs/${editing.id}`, {
        next_realm:     editing.next_realm,
        next_stage:     editing.next_stage,
        new_max_qi:     Number(editing.new_max_qi),
        required_items: editing.required_items,
        active:         editing.active,
      })
      flash('✓ Breakthrough salvo!')
      setEditing(null)
      load()
      onMutate()
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erro ao salvar.')
    }
  }

  // Agrupa rows por realm mantendo a ordem do banco
  const byRealm = REALMS.map(realm => ({
    realm,
    rows: rows.filter(r => r.realm === realm.id),
  })).filter(g => g.rows.length > 0)

  return (
    <div className="space-y-4">
      {msg && (
        <div className="text-xs px-3 py-2 border border-teal-700/60 bg-teal-950/20 text-teal-400">{msg}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-slate-600">{rows.length} entradas no banco</div>
        <BulkImportButton endpoint="/api/admin/breakthroughs/seed" label="Importar breakthroughs_novo.json" onSuccess={load} />
      </div>

      {/* Tabela agrupada por reino */}
      <div className="space-y-3">
        {byRealm.map(({ realm, rows: realmRows }) => (
            <div key={realm.id} className="border border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                <span className="text-xs font-cinzel font-bold text-amber-400 tracking-widest uppercase">{realm.label}</span>
              </div>
              <div className="divide-y divide-slate-800">
                {realmRows.map(row => (
                  <div key={row.id} className="px-4 py-3 flex items-center gap-4 bg-slate-950 hover:bg-slate-900/60 transition-colors">
                    <div className="w-20 shrink-0">
                      <span className="text-xs font-bold text-slate-300">{STAGE_LABELS[row.stage]}</span>
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-3 text-xs text-slate-500">
                      <div>
                        <span className="text-slate-600">→ </span>
                        <span className="text-slate-300">{REALM_ALL.find(r => r.id === row.next_realm)?.label ?? row.next_realm}</span>
                        {' · '}{STAGE_LABELS[row.next_stage]}
                      </div>
                      <div>
                        <span className="font-bold text-purple-400 tabular-nums">{Number(row.new_max_qi).toLocaleString()}</span>
                        <span className="text-slate-600 ml-1">Qi máx</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.required_items.length === 0
                          ? <span className="text-slate-700">Só Qi cheio</span>
                          : row.required_items.map((item, i) => {
                              const def = itemDefs[item.itemId]
                              return (
                                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 border border-slate-700 bg-slate-800 text-slate-300">
                                  {def?.emoji} {def?.name?.split(' ')[0] ?? item.itemId} ×{item.quantity}
                                </span>
                              )
                            })
                        }
                      </div>
                    </div>
                    <button onClick={() => setEditing(row)}
                      className="shrink-0 px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-12 border border-slate-800">
            Nenhum breakthrough cadastrado no banco. Use "Importar breakthroughs_novo.json".
          </div>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-slate-700 w-full max-w-md space-y-4 p-6">
            <h2 className="font-cinzel font-bold text-amber-400 tracking-wider text-sm uppercase">
              {REALMS.find(r => r.id === editing.realm)?.label} · {STAGE_LABELS[editing.stage]}
            </h2>

            {msg && <div className="text-xs px-3 py-2 border border-teal-700/60 bg-teal-950/20 text-teal-400">{msg}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-widest">Próximo Reino</label>
                  <select className={inp} value={editing.next_realm}
                    onChange={e => setEditing({ ...editing, next_realm: e.target.value })}>
                    {REALM_ALL.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-widest">Próximo Estágio</label>
                  <select className={inp} value={editing.next_stage}
                    onChange={e => setEditing({ ...editing, next_stage: e.target.value })}>
                    {Object.keys(STAGE_LABELS).map((s: string) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-widest">Qi Máximo após breakthrough</label>
                <input type="number" className={inp} value={Number(editing.new_max_qi)}
                  onChange={e => setEditing({ ...editing, new_max_qi: parseInt(e.target.value) || 0 })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">Itens Necessários</label>
                <ItemReqEditor
                  items={editing.required_items}
                  itemDefs={itemDefs}
                  onChange={items => setEditing({ ...editing, required_items: items })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input type="checkbox" checked={editing.active}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-teal-500" />
                Ativo
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-sm font-bold transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemReqEditor({
  items, itemDefs, onChange,
}: {
  items: ItemReq[]
  itemDefs: Record<string, { name?: string; emoji?: string }>
  onChange: (items: ItemReq[]) => void
}) {
  const [newId,  setNewId]  = useState('')
  const [newQty, setNewQty] = useState(1)

  const add = () => {
    if (!newId.trim()) return
    const existing = items.find(i => i.itemId === newId)
    if (existing) {
      onChange(items.map(i => i.itemId === newId ? { ...i, quantity: i.quantity + newQty } : i))
    } else {
      onChange([...items, { itemId: newId, quantity: newQty }])
    }
    setNewId(''); setNewQty(1)
  }
  const remove    = (id: string) => onChange(items.filter(i => i.itemId !== id))
  const updateQty = (id: string, qty: number) =>
    onChange(items.map(i => i.itemId === id ? { ...i, quantity: qty } : i))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={`${inp} flex-1`} placeholder="ID do item (ex: pill_red_spring)"
          value={newId} onChange={e => setNewId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <input type="number" min={1} value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 1)}
          className="w-16 bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-slate-200 text-center outline-none" />
        <button onClick={add}
          className="px-3 py-1.5 border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 text-sm font-bold transition-colors">
          +
        </button>
      </div>
      <div className="space-y-1">
        {items.map(item => {
          const def = itemDefs[item.itemId]
          return (
            <div key={item.itemId} className="flex items-center gap-2 text-xs bg-slate-800 border border-slate-700 px-2 py-1.5">
              <span>{def?.emoji ?? '📦'}</span>
              <span className="flex-1 text-slate-300">{def?.name ?? item.itemId}</span>
              <input type="number" min={1} value={item.quantity}
                onChange={e => updateQty(item.itemId, parseInt(e.target.value) || 1)}
                className="w-14 bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-center text-slate-200 outline-none" />
              <button onClick={() => remove(item.itemId)} className="text-red-500/60 hover:text-red-400">×</button>
            </div>
          )
        })}
        {items.length === 0 && <span className="text-xs text-slate-600">Nenhum item necessário (só Qi cheio).</span>}
      </div>
    </div>
  )
}
