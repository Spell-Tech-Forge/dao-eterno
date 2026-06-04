import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { api } from '../../lib/api'
import { RARITY_COLORS } from '../../types'

interface StockItem {
  item_def_id: string
  price_gold: number
  daily_limit: number
  sort_order: number
  bought_today: number
}

interface Merchant {
  id: number
  name: string
  emoji: string
  description: string
  specialty: string
  stock: StockItem[]
}

interface Props { onBack: () => void }

export function MerchantsScreen({ onBack }: Props) {
  const currentLocationId = usePlayerStore(s => s.currentLocationId)
  const gold              = usePlayerStore(s => s.gold)
  const itemDefs          = useGameDataStore(s => s.items)

  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [selected, setSelected]   = useState<Merchant | null>(null)
  const [loading, setLoading]     = useState(true)
  const [working, setWorking]     = useState(false)
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null)
  const [qty, setQty]             = useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    try {
      const data = await api.get<Merchant[]>(`/api/merchants?locationId=${currentLocationId}`)
      setMerchants(data)
      if (selected) {
        const updated = data.find(m => m.id === selected.id)
        if (updated) setSelected(updated)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [currentLocationId])

  async function handleBuy(merchant: Merchant, item: StockItem) {
    const q = qty[item.item_def_id] ?? 1
    setWorking(true); setMsg(null)
    try {
      const res = await api.post<{ ok: boolean; gold_spent: number; inventory: unknown }>(
        `/api/merchants/${merchant.id}/buy`,
        { itemDefId: item.item_def_id, quantity: q }
      )
      const inv = res.inventory as { items: typeof useInventoryStore.getState()['items']; equipped: typeof useInventoryStore.getState()['equipped']; maxSlots: number }
      useInventoryStore.setState({ items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots })
      usePlayerStore.setState({ gold: gold - res.gold_spent })
      setMsg({ text: `Comprado! -${res.gold_spent.toLocaleString('pt-BR')} 🪙`, ok: true })
      await load()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally { setWorking(false) }
  }

  if (loading) return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 py-8 text-center text-slate-500 bg-slate-950 min-h-screen">
      Carregando mercadores...
    </div>
  )

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 bg-slate-950 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={selected ? () => setSelected(null) : onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
          ← {selected ? 'Voltar' : 'Sair'}
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">
            {selected ? `${selected.emoji} ${selected.name}` : '🛒 Mercadores'}
          </h1>
          {selected
            ? <p className="text-xs text-slate-500">{selected.specialty}</p>
            : <p className="text-xs text-slate-500">Compre itens e materiais dos mercadores locais</p>
          }
        </div>
        <span className="text-xs text-amber-400 border border-amber-800/40 px-2 py-1">
          {gold.toLocaleString('pt-BR')} 🪙
        </span>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Lista de mercadores */}
      {!selected && (
        merchants.length === 0 ? (
          <div className="text-center text-slate-600 py-12 text-sm">
            Nenhum mercador disponível nesta localização.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {merchants.map(m => (
              <button key={m.id} onClick={() => { setSelected(m); setMsg(null) }}
                className="border border-slate-700 bg-slate-900 p-4 text-left hover:bg-slate-800 hover:border-slate-600 transition-all space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{m.emoji}</span>
                  <div>
                    <div className="font-cinzel font-bold text-slate-200">{m.name}</div>
                    <div className="text-xs text-amber-500/80">{m.specialty}</div>
                  </div>
                  <span className="ml-auto text-xs text-slate-600">{m.stock.length} itens →</span>
                </div>
                {m.description && (
                  <p className="text-xs text-slate-500 italic">{m.description}</p>
                )}
              </button>
            ))}
          </div>
        )
      )}

      {/* Estoque do mercador selecionado */}
      {selected && (
        <div className="space-y-3">
          {selected.description && (
            <p className="text-sm text-slate-400 italic border-l-2 border-amber-700/40 pl-3">{selected.description}</p>
          )}

          {selected.stock.length === 0 ? (
            <div className="text-center text-slate-600 py-8 text-sm">
              Este mercador não tem itens à venda no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {selected.stock.map(item => {
                const def       = itemDefs[item.item_def_id]
                const color     = def ? RARITY_COLORS[def.rarity] : '#475569'
                const q         = qty[item.item_def_id] ?? 1
                const totalCost = item.price_gold * q
                const canAfford = gold >= totalCost
                const remaining = item.daily_limit > 0 ? item.daily_limit - item.bought_today : null
                const exhausted = remaining !== null && remaining <= 0

                return (
                  <div key={item.item_def_id}
                    className="border p-3 flex items-center gap-3"
                    style={{ borderColor: exhausted ? '#374151' : color + '33', backgroundColor: exhausted ? undefined : color + '06' }}>

                    {/* Ícone + nome */}
                    <span className="text-2xl shrink-0">{def?.emoji ?? '❓'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: exhausted ? '#475569' : color }}>
                        {def?.name ?? item.item_def_id}
                      </div>
                      {def?.description && (
                        <div className="text-[10px] text-slate-600 truncate">{def.description}</div>
                      )}
                      {remaining !== null && (
                        <div className={`text-[10px] mt-0.5 ${exhausted ? 'text-red-500/70' : 'text-slate-500'}`}>
                          {exhausted ? 'Esgotado hoje' : `Restam ${remaining} hoje`}
                        </div>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setQty(q_ => ({ ...q_, [item.item_def_id]: Math.max(1, (q_[item.item_def_id] ?? 1) - 1) }))}
                        className="w-6 h-6 border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs">−</button>
                      <span className="w-8 text-center text-sm text-slate-200 tabular-nums">{q}</span>
                      <button onClick={() => setQty(q_ => {
                        const max = remaining !== null ? Math.min(remaining, 99) : 99
                        return { ...q_, [item.item_def_id]: Math.min(max, (q_[item.item_def_id] ?? 1) + 1) }
                      })}
                        className="w-6 h-6 border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs">+</button>
                    </div>

                    {/* Preço + comprar */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-400 tabular-nums">
                        {totalCost.toLocaleString('pt-BR')} 🪙
                      </div>
                      <button
                        disabled={working || !canAfford || exhausted}
                        onClick={() => handleBuy(selected, item)}
                        className="mt-1 px-3 py-1 text-xs font-bold border transition-colors disabled:opacity-40"
                        style={canAfford && !exhausted
                          ? { borderColor: color + '66', color, backgroundColor: color + '15' }
                          : { borderColor: '#374151', color: '#475569' }
                        }>
                        {exhausted ? 'Esgotado' : 'Comprar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
