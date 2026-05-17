import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import { BREAKTHROUGH_REQS } from '../../data/breakthroughs'

const REALMS = [
  { id: 'qi_refining',           label: 'Refinamento de Qi' },
  { id: 'foundation',            label: 'Fundação Espiritual' },
  { id: 'golden_core',           label: 'Núcleo Dourado' },
  { id: 'nascent_soul',          label: 'Alma Nascente' },
  { id: 'spirit_transformation', label: 'Transformação Espiritual' },
  { id: 'unification',           label: 'Unificação' },
  { id: 'ascension',             label: 'Ascensão' },
]
const STAGES = ['initial','middle','advanced','peak']
const STAGE_LABELS: Record<string, string> = {
  initial:'Inicial', middle:'Médio', advanced:'Avançado', peak:'Pico',
}

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
      flash('Breakthrough salvo!')
      setEditing(null)
      load()
      onMutate()
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Erro ao salvar.')
    }
  }

  async function handleSeed() {
    const stages = ['initial','middle','advanced','peak']
    const arr = Object.entries(BREAKTHROUGH_REQS).map(([key, req]) => {
      if (!req) return null
      const stage = stages.find(s => key.endsWith(`_${s}`))!
      const realm = key.slice(0, key.length - stage.length - 1)
      return {
        id: key, realm, stage,
        next_realm: req.nextRealm, next_stage: req.nextStage,
        new_max_qi: req.newMaxQi, required_items: req.items,
      }
    }).filter(Boolean)
    const r = await api.post<{ inserted: number }>('/api/admin/breakthroughs/seed', arr)
    flash(`${r.inserted} entradas importadas!`); load(); onMutate()
  }

  const ordered = REALMS.flatMap(realm =>
    STAGES.map(stage => {
      const key = `${realm.id}_${stage}`
      return rows.find(r => r.id === key) ?? null
    }).filter(Boolean) as DbBreakthrough[]
  )

  return (
    <div className="space-y-4">
      {msg && <div className="text-xs px-3 py-2 rounded bg-jade/10 border border-jade text-jade">{msg}</div>}

      <div className="flex items-center gap-2">
        <button onClick={handleSeed}
          className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-surface-2">
          Importar Padrão (dados estáticos)
        </button>
        <span className="text-xs text-muted">{rows.length} entradas no banco</span>
      </div>

      {/* Tabela agrupada por reino */}
      <div className="space-y-4">
        {REALMS.map(realm => {
          const realmRows = ordered.filter(r => r.realm === realm.id)
          if (realmRows.length === 0) return null
          return (
            <div key={realm.id} className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-2 border-b border-border">
                <span className="text-sm font-bold text-text">{realm.label}</span>
              </div>
              <div className="divide-y divide-border">
                {realmRows.map(row => (
                  <div key={row.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-24 shrink-0">
                      <span className="text-xs font-bold text-gold">{STAGE_LABELS[row.stage]}</span>
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-3 text-xs text-muted">
                      <div>
                        <span className="text-text/60">→ </span>
                        {REALMS.find(r => r.id === row.next_realm)?.label ?? row.next_realm}
                        {' '}{STAGE_LABELS[row.next_stage]}
                      </div>
                      <div>
                        <span className="text-qi font-bold">{Number(row.new_max_qi).toLocaleString()}</span>
                        <span className="ml-1">Qi máx</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.required_items.length === 0
                          ? <span className="text-muted/50">Só Qi cheio</span>
                          : row.required_items.map((item, i) => {
                              const def = itemDefs[item.itemId]
                              return (
                                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                                  {def?.emoji} {def?.name?.split(' ')[0] ?? item.itemId} ×{item.quantity}
                                </span>
                              )
                            })
                        }
                      </div>
                    </div>
                    <button onClick={() => setEditing(row)}
                      className="shrink-0 px-3 py-1.5 text-xs border border-border rounded hover:bg-surface-2 text-muted">
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {ordered.length === 0 && (
          <div className="text-center text-muted text-sm py-12">
            Nenhum dado no banco. Clique em "Importar Padrão".
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-text">
              Editar Breakthrough: {REALMS.find(r => r.id === editing.realm)?.label} · {STAGE_LABELS[editing.stage]}
            </h2>

            {msg && <div className="text-xs px-3 py-2 rounded bg-jade/10 border border-jade text-jade">{msg}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted">Próximo Reino</label>
                  <select className={inp} value={editing.next_realm}
                    onChange={e => setEditing({ ...editing, next_realm: e.target.value })}>
                    {[...REALMS, { id:'immortal', label:'Imortal' }].map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted">Próximo Estágio</label>
                  <select className={inp} value={editing.next_stage}
                    onChange={e => setEditing({ ...editing, next_stage: e.target.value })}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted">Qi Máximo após breakthrough</label>
                <input type="number" className={inp} value={Number(editing.new_max_qi)}
                  onChange={e => setEditing({ ...editing, new_max_qi: parseInt(e.target.value) || 0 })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted">Itens Necessários</label>
                <ItemReqEditor
                  items={editing.required_items}
                  itemDefs={itemDefs}
                  onChange={items => setEditing({ ...editing, required_items: items })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.active}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                <span className="text-sm text-text">Ativo</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-surface-2">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 bg-jade text-white rounded-lg text-sm font-bold">
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
  const remove = (id: string) => onChange(items.filter(i => i.itemId !== id))
  const updateQty = (id: string, qty: number) =>
    onChange(items.map(i => i.itemId === id ? { ...i, quantity: qty } : i))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={`${inp} flex-1`} placeholder="ID do item (ex: pill_red_spring)"
          value={newId} onChange={e => setNewId(e.target.value)} />
        <input type="number" min={1} className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text"
          value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 1)} />
        <button onClick={add} className="px-3 py-1.5 bg-jade text-white rounded text-sm font-bold">+</button>
      </div>
      <div className="space-y-1">
        {items.map(item => {
          const def = itemDefs[item.itemId]
          return (
            <div key={item.itemId} className="flex items-center gap-2 text-xs bg-surface-2 rounded px-2 py-1.5">
              <span>{def?.emoji ?? '📦'}</span>
              <span className="flex-1 text-text">{def?.name ?? item.itemId}</span>
              <input type="number" min={1} value={item.quantity}
                onChange={e => updateQty(item.itemId, parseInt(e.target.value) || 1)}
                className="w-14 bg-surface border border-border rounded px-1.5 py-0.5 text-center text-text" />
              <button onClick={() => remove(item.itemId)} className="text-danger/60 hover:text-danger">×</button>
            </div>
          )
        })}
        {items.length === 0 && <span className="text-xs text-muted">Nenhum item necessário (só Qi cheio).</span>}
      </div>
    </div>
  )
}

const inp = 'w-full bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-sm text-text outline-none focus:border-jade'
