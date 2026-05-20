import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import { SpriteImg } from '../ui/SpriteImg'
import { RARITY_COLORS } from '../../types'
import { effectiveRarity } from '../../utils/forge'

interface AdminListing {
  id: string
  seller_name: string
  seller_username: string
  seller_dead: boolean
  seller_banned: boolean
  item_def_id: string
  item_data: {
    upgradeLevel?: number
    ascensionTier?: number
    durability?: number
    quantity: number
  }
  quantity: number
  price: number
  listed_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function MarketPanel() {
  const [listings, setListings]   = useState<AdminListing[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterDead, setFilterDead] = useState(false)
  const [removing, setRemoving]   = useState<string | null>(null)
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null)
  const itemDefs = useGameDataStore(s => s.items)
  const loadGameData = useGameDataStore(s => s.load)

  const load = useCallback(() => {
    setLoading(true)
    api.get<AdminListing[]>('/api/admin/market-listings')
      .then(setListings)
      .catch(() => setMsg({ text: 'Erro ao carregar listagens.', ok: false }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    if (Object.keys(itemDefs).length === 0) loadGameData()
  }, [load, loadGameData, itemDefs])

  async function handleRemove(id: string) {
    setRemoving(id)
    setMsg(null)
    try {
      await api.delete(`/api/admin/market-listings/${id}`)
      setMsg({ text: 'Listagem removida. Item e gold absorvidos pelo sistema.', ok: true })
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally {
      setRemoving(null)
    }
  }

  const deadCount   = listings.filter(l => l.seller_dead).length
  const activeCount = listings.length

  const filtered = listings.filter(l => {
    if (filterDead && !l.seller_dead) return false
    if (!search) return true
    const def = itemDefs[l.item_def_id]
    const q = search.toLowerCase()
    return (
      (def?.name ?? l.item_def_id).toLowerCase().includes(q) ||
      l.seller_name.toLowerCase().includes(q) ||
      l.seller_username.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">Mercado</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {deadCount > 0 && (
            <button
              onClick={() => setFilterDead(v => !v)}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                filterDead
                  ? 'border-red-700 text-red-400 bg-red-950/20'
                  : 'border-slate-600 text-slate-400 hover:border-red-700/50 hover:text-red-400'
              }`}
            >
              💀 Órfãos ({deadCount})
            </button>
          )}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por item ou vendedor..."
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 w-60 focus:outline-none focus:border-amber-500"
          />
          <span className="text-xs text-slate-500">{filtered.length}/{activeCount} listagens</span>
          <button onClick={load} className="text-xs px-3 py-1.5 border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
            ↻ Atualizar
          </button>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Explicação do comportamento */}
      <div className="border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-slate-500 space-y-1">
        <p>
          <span className="text-red-400 font-bold">💀 Órfão</span> — vendedor morreu (permadeath).
          O item continua listado, mas quando vendido o gold vai para o sistema (sink) em vez de créditar o vendedor.
        </p>
        <p>
          <span className="text-amber-400 font-bold">Remover</span> — item e gold são absorvidos pelo sistema permanentemente. Nenhum personagem recebe nada.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-600 text-sm py-12 text-center border border-slate-700 bg-slate-900">
          Nenhuma listagem ativa.
        </div>
      ) : (
        <div className="border border-slate-700 bg-slate-900 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                {['Item', 'Qtd', 'Preço', 'Vendedor', 'Listado em', 'Status', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-500 font-cinzel tracking-wider uppercase text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(listing => {
                const def    = itemDefs[listing.item_def_id]
                const upgLvl = listing.item_data?.upgradeLevel  ?? 0
                const ascTier = listing.item_data?.ascensionTier ?? 0
                const effRar = def ? effectiveRarity(def.rarity, ascTier) : 'common'
                const color  = def ? RARITY_COLORS[effRar] : '#475569'
                return (
                  <tr key={listing.id} className={listing.seller_dead ? 'bg-red-950/10' : 'hover:bg-slate-800/30'}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={18} />}
                        <div>
                          <span className="font-semibold" style={{ color }}>
                            {def?.name ?? listing.item_def_id}
                          </span>
                          <span className="ml-1.5">
                            {upgLvl > 0 && <span className="font-bold" style={{ color }}>+{upgLvl}</span>}
                            {ascTier > 0 && <span className="font-bold ml-1" style={{ color }}>✦{ascTier}</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 tabular-nums">×{listing.quantity}</td>
                    <td className="px-3 py-2.5 text-amber-400 font-bold tabular-nums">{listing.price.toLocaleString('pt-BR')} 🪙</td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-300">{listing.seller_name}</div>
                      <div className="text-slate-600">{listing.seller_username}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{fmtDate(listing.listed_at)}</td>
                    <td className="px-3 py-2.5">
                      {listing.seller_dead ? (
                        <span className="px-1.5 py-0.5 border border-red-800/60 text-red-400 text-[10px] font-bold">💀 Órfão</span>
                      ) : (
                        <span className="px-1.5 py-0.5 border border-teal-800/60 text-teal-400 text-[10px]">Ativo</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => handleRemove(listing.id)}
                        disabled={removing === listing.id}
                        className="text-[10px] px-2 py-1 border border-red-800/50 text-red-400 hover:bg-red-950/20 transition-colors disabled:opacity-40"
                      >
                        {removing === listing.id ? '...' : 'Remover'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
