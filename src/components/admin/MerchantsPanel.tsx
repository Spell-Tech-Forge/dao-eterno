import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'

interface AdminMerchant {
  id: number; location_id: string; name: string; emoji: string
  description: string; specialty: string; sort_order: number
  active: boolean; location_name: string; stock_count: number
}
interface StockItem { id: number; item_def_id: string; price_gold: number; daily_limit: number; sort_order: number; dao_crystal_cost: number; min_reputation: number; rep_points_reward: number }
interface Location { id: string; name: string }

const EMPTY: Omit<AdminMerchant,'id'|'location_name'|'stock_count'> = {
  location_id:'', name:'', emoji:'🧑‍💼', description:'', specialty:'', sort_order:0, active:true
}
const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

export function MerchantsPanel({ onMutate }: { onMutate: () => void }) {
  const [merchants, setMerchants]   = useState<AdminMerchant[]>([])
  const [locations, setLocations]   = useState<Location[]>([])
  const [editing, setEditing]       = useState<Partial<AdminMerchant> | null>(null)
  const [stockOf, setStockOf]       = useState<number | null>(null)
  const [stock, setStock]           = useState<StockItem[]>([])
  const [newStock, setNewStock]     = useState({ item_def_id:'', price_gold:100, daily_limit:0, sort_order:0, dao_crystal_cost:0, min_reputation:0, rep_points_reward:1 })
  const [msg, setMsg]               = useState('')
  const itemDefs = useGameDataStore(s => s.items)

  const load = useCallback(async () => {
    const [m, l] = await Promise.all([
      api.get<AdminMerchant[]>('/api/admin/merchants'),
      api.get<Location[]>('/api/game/locations').catch(() => [] as Location[]),
    ])
    setMerchants(m); setLocations(l)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadStock(id: number) {
    const s = await api.get<StockItem[]>(`/api/admin/merchants/${id}/stock`)
    setStock(s); setStockOf(id)
  }

  async function save() {
    if (!editing) return
    try {
      if (editing.id) {
        await api.put(`/api/admin/merchants/${editing.id}`, editing)
      } else {
        await api.post('/api/admin/merchants', editing)
      }
      setEditing(null); setMsg('Salvo!'); load(); onMutate()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro') }
  }

  async function del(id: number) {
    if (!confirm('Deletar mercador?')) return
    await api.delete(`/api/admin/merchants/${id}`)
    load(); onMutate()
  }

  async function addStock() {
    if (!stockOf || !newStock.item_def_id) return
    try {
      await api.post(`/api/admin/merchants/${stockOf}/stock`, newStock)
      setNewStock({ item_def_id:'', price_gold:100, daily_limit:0, sort_order:0, dao_crystal_cost:0, min_reputation:0, rep_points_reward:1 })
      loadStock(stockOf)
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro') }
  }

  async function delStock(itemDefId: string) {
    if (!stockOf) return
    await api.delete(`/api/admin/merchants/${stockOf}/stock/${itemDefId}`)
    loadStock(stockOf)
  }

  const merchantName = (id: number) => merchants.find(m => m.id === id)?.name ?? ''

  return (
    <div className="space-y-4">
      {msg && <div className="text-xs text-teal-400 border border-teal-800/40 px-3 py-2 bg-teal-950/20">{msg}</div>}

      {/* ── Editor de mercador ── */}
      {editing && (
        <div className="border border-amber-700/40 bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-cinzel text-amber-400 tracking-widest uppercase">
            {editing.id ? 'Editar Mercador' : 'Novo Mercador'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Localização</label>
              <select className={inp} value={editing.location_id ?? ''}
                onChange={e => setEditing(d => ({ ...d, location_id: e.target.value }))}>
                <option value="">— Selecionar —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Emoji</label>
              <input className={inp} value={editing.emoji ?? '🧑‍💼'} maxLength={2}
                onChange={e => setEditing(d => ({ ...d, emoji: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-slate-500">Nome</label>
              <input className={inp} value={editing.name ?? ''}
                onChange={e => setEditing(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Especialidade</label>
              <input className={inp} value={editing.specialty ?? ''}
                onChange={e => setEditing(d => ({ ...d, specialty: e.target.value }))}
                placeholder="ex: Materiais T1-T3" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Ordem</label>
              <input type="number" className={inp} value={editing.sort_order ?? 0}
                onChange={e => setEditing(d => ({ ...d, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-slate-500">Descrição (opcional)</label>
              <input className={inp} value={editing.description ?? ''}
                onChange={e => setEditing(d => ({ ...d, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 col-span-2 cursor-pointer">
              <input type="checkbox" checked={editing.active !== false}
                onChange={e => setEditing(d => ({ ...d, active: e.target.checked }))} />
              Ativo
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={save}
              className="flex-1 py-2 text-sm font-bold border border-teal-700/60 text-teal-400 bg-teal-950/10 hover:bg-teal-950/30 transition-colors">
              💾 Salvar
            </button>
            <button onClick={() => setEditing(null)}
              className="px-4 text-sm border border-slate-700 text-slate-500 hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Gestão de estoque ── */}
      {stockOf !== null && (
        <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">
              Estoque — {merchantName(stockOf)}
            </span>
            <button onClick={() => setStockOf(null)} className="text-xs text-slate-500 hover:text-slate-300">✕ Fechar</button>
          </div>

          {/* Adicionar item */}
          <div className="flex gap-2 flex-wrap">
            <select className="flex-1 min-w-[160px] bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-teal-600"
              value={newStock.item_def_id}
              onChange={e => setNewStock(s => ({ ...s, item_def_id: e.target.value }))}>
              <option value="">— Selecionar item —</option>
              {Object.values(itemDefs).sort((a,b) => a.name.localeCompare(b.name)).map(d => (
                <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
              ))}
            </select>
            <input type="number" min={0} placeholder="Ouro" title="Preço em ouro (0=grátis)" className="w-24 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={newStock.price_gold} onChange={e => setNewStock(s => ({ ...s, price_gold: Number(e.target.value) }))} />
            <input type="number" min={0} placeholder="💎 Cristais" title="Custo em Cristais do Dao (0=não aceita)" className="w-24 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={newStock.dao_crystal_cost} onChange={e => setNewStock(s => ({ ...s, dao_crystal_cost: Number(e.target.value) }))} />
            <input type="number" min={0} placeholder="Lim/dia" title="Limite diário (0=ilimitado)" className="w-20 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={newStock.daily_limit} onChange={e => setNewStock(s => ({ ...s, daily_limit: Number(e.target.value) }))} />
            <input type="number" min={0} max={4} placeholder="Rep mín" title="Reputação mínima (0-4)" className="w-20 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={newStock.min_reputation} onChange={e => setNewStock(s => ({ ...s, min_reputation: Number(e.target.value) }))} />
            <input type="number" min={1} placeholder="Pts rep" title="Pontos de reputação ganhos por compra" className="w-20 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={newStock.rep_points_reward} onChange={e => setNewStock(s => ({ ...s, rep_points_reward: Number(e.target.value) }))} />
            <button onClick={addStock} className="px-3 py-1.5 text-xs border border-teal-700/60 text-teal-400 hover:bg-teal-950/20 transition-colors">
              + Adicionar
            </button>
          </div>

          {/* Lista de itens */}
          {stock.length === 0 ? (
            <div className="text-xs text-slate-600 text-center py-3">Sem itens no estoque.</div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {stock.map(s => {
                const def = itemDefs[s.item_def_id]
                return (
                  <div key={s.item_def_id} className="flex items-center gap-2 px-2 py-1.5 border border-slate-800 bg-slate-900/50">
                    <span>{def?.emoji ?? '❓'}</span>
                    <span className="flex-1 text-xs text-slate-300 truncate">{def?.name ?? s.item_def_id}</span>
                    {s.price_gold > 0 && <span className="text-xs text-amber-400 font-bold tabular-nums">{s.price_gold.toLocaleString('pt-BR')} 🪙</span>}
                    {s.dao_crystal_cost > 0 && <span className="text-xs text-cyan-400 font-bold">{s.dao_crystal_cost} 💎</span>}
                    <span className="text-xs text-slate-500">{s.daily_limit === 0 ? '∞/dia' : `${s.daily_limit}/dia`}</span>
                    {s.min_reputation > 0 && <span className="text-xs text-violet-400">Rep≥{s.min_reputation}</span>}
                    <button onClick={() => delStock(s.item_def_id)} className="text-xs text-red-500/60 hover:text-red-400 px-1">✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Ações ── */}
      {!editing && (
        <div className="flex gap-2">
          <button onClick={() => setEditing({ ...EMPTY })}
            className="flex-1 py-2 text-sm border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
            + Novo Mercador
          </button>
          <label className="flex-1 py-2 text-sm border border-teal-700/50 text-teal-400 hover:bg-teal-950/20 transition-colors cursor-pointer text-center">
            📂 Importar JSON
            <input type="file" accept=".json" className="hidden" onChange={async e => {
              const file = e.target.files?.[0]; if (!file) return
              try {
                const data = JSON.parse(await file.text())
                await api.post('/api/admin/merchants/seed', data)
                setMsg(`Importado com sucesso!`); load(); onMutate()
              } catch (err) { setMsg(err instanceof Error ? err.message : 'Erro ao importar') }
              e.target.value = ''
            }} />
          </label>
        </div>
      )}

      {/* ── Lista de mercadores ── */}
      <div className="space-y-1">
        {merchants.length === 0 ? (
          <div className="text-center text-slate-600 py-6 text-sm">Nenhum mercador cadastrado.</div>
        ) : merchants.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 border border-slate-700 bg-slate-900">
            <span className="text-xl">{m.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200">{m.name}</span>
                {!m.active && <span className="text-[10px] text-slate-600 border border-slate-700 px-1">inativo</span>}
              </div>
              <div className="text-xs text-slate-500">{m.location_name} · {m.specialty} · {m.stock_count} itens</div>
            </div>
            <button onClick={() => loadStock(m.id)}
              className="text-xs px-2 py-1 border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
              📦 Estoque
            </button>
            <button onClick={() => setEditing(m)}
              className="text-xs px-2 py-1 border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
              ✏️
            </button>
            <button onClick={() => del(m.id)}
              className="text-xs px-2 py-1 border border-red-800/50 text-red-400 hover:bg-red-950/20 transition-colors">
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
