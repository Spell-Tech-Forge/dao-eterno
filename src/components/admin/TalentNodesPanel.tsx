import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface DbNode {
  id: string; class_id: string; name: string; description: string
  effect_type: string; effect_value: number
  required_realm: string; required_stage: string
  point_cost: number; position_row: number; position_col: number
  required_node_id: string | null; active: boolean
}

interface DbClass { id: string; name: string; emoji: string }

const EFFECT_TYPES = [
  'atk_pct','def_pct','hp_pct','crit_pct','speed_pct','qi_rate_pct','luck_flat','drop_rate_pct'
]
const REALMS = ['qi_refining','foundation','golden_core','nascent_soul','spirit_transformation','unification','ascension','immortal']
const STAGES = ['initial','middle','advanced','peak']

const EMPTY: Omit<DbNode, 'id'> & { id: string } = {
  id: '', class_id: '', name: '', description: '',
  effect_type: 'atk_pct', effect_value: 5,
  required_realm: 'qi_refining', required_stage: 'initial',
  point_cost: 1, position_row: 0, position_col: 0,
  required_node_id: null, active: true,
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'
const sel = `${inp} cursor-pointer`

export function TalentNodesPanel() {
  const [nodes, setNodes]     = useState<DbNode[]>([])
  const [classes, setClasses] = useState<DbClass[]>([])
  const [filterClass, setFilterClass] = useState('')
  const [draft, setDraft]     = useState<typeof EMPTY>({ ...EMPTY })
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [seedLoading, setSeedLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [n, c] = await Promise.all([
        api.get<DbNode[]>('/api/admin/talent-nodes'),
        api.get<DbClass[]>('/api/admin/classes'),
      ])
      setNodes(n)
      setClasses(c)
    } catch { setMsg('Erro ao carregar dados.') }
  }

  const displayed = filterClass ? nodes.filter(n => n.class_id === filterClass) : nodes

  function startEdit(n: DbNode) { setEditing(n.id); setDraft({ ...n }); setMsg('') }
  function startNew() { setEditing('__new__'); setDraft({ ...EMPTY, class_id: filterClass || '' }); setMsg('') }

  async function save() {
    if (!draft.name || !draft.class_id) { setMsg('Nome e classe são obrigatórios.'); return }
    setSaving(true)
    try {
      if (editing === '__new__') {
        if (!draft.id) { setMsg('ID obrigatório.'); setSaving(false); return }
        await api.post('/api/admin/talent-nodes', { ...draft, required_node_id: draft.required_node_id || null })
      } else {
        await api.put(`/api/admin/talent-nodes/${editing}`, { ...draft, required_node_id: draft.required_node_id || null })
      }
      setMsg('Salvo.')
      setEditing(null)
      await load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro.') }
    finally { setSaving(false) }
  }

  async function deleteNode(id: string) {
    if (!confirm(`Deletar nó "${id}"?`)) return
    try {
      await api.delete(`/api/admin/talent-nodes/${id}`)
      await load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro.') }
  }

  async function seedFromJson() {
    setSeedLoading(true)
    setMsg('')
    try {
      const res = await fetch('/data-import/talent_nodes.json')
      const data = await res.json()
      const r = await api.post<{ inserted: number }>('/api/admin/talent-nodes/seed', data)
      setMsg(`Seed: ${r.inserted} nós importados.`)
      await load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro.') }
    finally { setSeedLoading(false) }
  }

  const classNodes = filterClass ? nodes.filter(n => n.class_id === filterClass) : []
  const EFFECT_LABELS: Record<string, string> = {
    atk_pct:'ATK%', def_pct:'DEF%', hp_pct:'HP%', crit_pct:'CRIT',
    speed_pct:'Vel%', qi_rate_pct:'Qi/s%', luck_flat:'Sorte', drop_rate_pct:'Drop%'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-cinzel tracking-wider text-amber-400">Nós de Talento ({nodes.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <select className="bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none"
            value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Todas as classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          <button onClick={seedFromJson} disabled={seedLoading}
            className="px-3 py-1.5 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/30 disabled:opacity-50 transition-colors">
            {seedLoading ? 'Importando...' : '⬇ Importar JSON'}
          </button>
          <button onClick={startNew}
            className="px-3 py-1.5 text-xs border border-amber-700 text-amber-400 hover:bg-amber-950/30 transition-colors">
            + Novo Nó
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-teal-400 border border-teal-900/50 px-3 py-2 bg-teal-950/20">{msg}</p>}

      {/* Form */}
      {editing && (
        <div className="border border-slate-700 bg-slate-900/60 p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest">{editing === '__new__' ? 'Novo Nó' : `Editar: ${editing}`}</p>
          {editing === '__new__' && (
            <input className={inp} placeholder="ID (ex: cq_atk1)" value={draft.id}
              onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className={sel} value={draft.class_id}
              onChange={e => setDraft(d => ({ ...d, class_id: e.target.value }))}>
              <option value="">— Classe —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <input className={inp} placeholder="Nome do talento" value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          </div>
          <input className={inp} placeholder="Descrição" value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <select className={sel} value={draft.effect_type}
              onChange={e => setDraft(d => ({ ...d, effect_type: e.target.value }))}>
              {EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" className={inp} placeholder="Valor" value={draft.effect_value}
              onChange={e => setDraft(d => ({ ...d, effect_value: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className={sel} value={draft.required_realm}
              onChange={e => setDraft(d => ({ ...d, required_realm: e.target.value }))}>
              {REALMS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className={sel} value={draft.required_stage}
              onChange={e => setDraft(d => ({ ...d, required_stage: e.target.value }))}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500">Custo (pts)</label>
              <input type="number" className={inp} value={draft.point_cost}
                onChange={e => setDraft(d => ({ ...d, point_cost: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Row (reino 0-7)</label>
              <input type="number" className={inp} value={draft.position_row}
                onChange={e => setDraft(d => ({ ...d, position_row: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Col (estágio 0-3)</label>
              <input type="number" className={inp} value={draft.position_col}
                onChange={e => setDraft(d => ({ ...d, position_col: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Nó pré-requisito (ID ou vazio)</label>
            <select className={sel} value={draft.required_node_id ?? ''}
              onChange={e => setDraft(d => ({ ...d, required_node_id: e.target.value || null }))}>
              <option value="">— Nenhum —</option>
              {(draft.class_id ? nodes.filter(n => n.class_id === draft.class_id && n.id !== draft.id) : nodes)
                .map(n => <option key={n.id} value={n.id}>{n.id} — {n.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={draft.active}
              onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
            Ativo
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/30 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de nós */}
      <div className="space-y-1">
        {displayed.map(node => {
          const cls = classes.find(c => c.id === node.class_id)
          return (
            <div key={node.id} className="border border-slate-800 bg-slate-900/30 p-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-300">{node.name}</span>
                  <span className="text-[10px] text-slate-600">{node.id}</span>
                  {cls && <span className="text-[10px] px-1 bg-slate-800 text-slate-400">{cls.emoji} {cls.name}</span>}
                  {!node.active && <span className="text-[10px] text-red-500">inativo</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 flex gap-3">
                  <span className="text-teal-600">{EFFECT_LABELS[node.effect_type] ?? node.effect_type} +{node.effect_value}</span>
                  <span>{node.required_realm}/{node.required_stage}</span>
                  <span>{node.point_cost}pt</span>
                  {node.required_node_id && <span>→ {node.required_node_id}</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => startEdit(node)}
                  className="px-2 py-0.5 text-[10px] border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
                  Edit
                </button>
                <button onClick={() => deleteNode(node.id)}
                  className="px-2 py-0.5 text-[10px] border border-red-900 text-red-500 hover:bg-red-950/20 transition-colors">
                  Del
                </button>
              </div>
            </div>
          )
        })}
        {displayed.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-6">
            {filterClass ? 'Nenhum nó para esta classe.' : 'Nenhum nó cadastrado. Use "Importar JSON" para carregar os talentos padrão.'}
          </p>
        )}
      </div>
    </div>
  )
}
