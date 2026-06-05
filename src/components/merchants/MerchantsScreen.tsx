import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useSettingsStore } from '../../store/settingsStore'
import { api } from '../../lib/api'
import { RARITY_COLORS } from '../../types'

// Preços padrão (substituídos pelos do servidor ao carregar)
const DEFAULT_SELL_PRICES: Record<number, number> = {
  2: 400, 3: 1200, 4: 3500, 5: 9000,
  6: 22000, 7: 55000, 8: 130000, 9: 300000, 10: 700000,
}

interface MaterialCost { itemId: string; quantity: number }
interface StockItem {
  item_def_id: string; price_gold: number; daily_limit: number; sort_order: number
  bought_today: number; materials_cost: MaterialCost[]; dao_crystal_cost: number
  min_reputation: number; rep_points_reward: number
}
interface Merchant {
  id: number; name: string; emoji: string; description: string; specialty: string
  stock: StockItem[]; locked_stock_count: number
  rep_points: number; rep_level: number; rep_name: string; discount_pct: number
}

const REP_COLORS = ['#94a3b8','#4ade80','#60a5fa','#f97316','#f59e0b']
const REP_NEXT_AT = [0, 100, 500, 2000, 5000, Infinity]

interface Props { onBack: () => void }

export function MerchantsScreen({ onBack }: Props) {
  const currentLocationId = usePlayerStore(s => s.currentLocationId)
  const gold              = usePlayerStore(s => s.gold)
  const daoCrystals       = usePlayerStore(s => s.daoCrystals)
  const itemDefs          = useGameDataStore(s => s.items)

  const [merchants, setMerchants]   = useState<Merchant[]>([])
  const [selected, setSelected]     = useState<Merchant | null>(null)
  const [loading, setLoading]       = useState(true)
  const [working, setWorking]       = useState(false)
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null)
  const [qty, setQty]               = useState<Record<string, number>>({})
  const [merchantTab, setMerchantTab]     = useState<'buy'|'sell'>('buy')
  const [sellPrices, setSellPrices]       = useState<Record<number, number>>(DEFAULT_SELL_PRICES)
  const invItems           = useInventoryStore(s => s.items)
  const sellRecipesEnabled = useSettingsStore(s => s.sellRecipesEnabled)
  const recipeItems        = invItems.filter(i => itemDefs[i.definitionId]?.type === 'receita')

  useEffect(() => {
    api.get<Record<number, number>>('/api/merchants/recipe-prices')
      .then(p => setSellPrices(p))
      .catch(() => {})
  }, [])

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
      const res = await api.post<{
        ok: boolean; gold_spent: number; crystals_spent: number
        discount_applied: number; rep_points_earned: number; new_rep_points: number
        new_rep_level: { level: number; name: string; discountPct: number }
        inventory: { items: any[]; equipped: any; maxSlots: number }
      }>(`/api/merchants/${merchant.id}/buy`, { itemDefId: item.item_def_id, quantity: q })

      useInventoryStore.setState({ items: res.inventory.items, equipped: res.inventory.equipped as any, maxSlots: res.inventory.maxSlots })
      if (res.gold_spent > 0) usePlayerStore.setState({ gold: gold - res.gold_spent })
      if (res.crystals_spent > 0) usePlayerStore.setState({ daoCrystals: daoCrystals - res.crystals_spent })

      const parts = []
      if (res.gold_spent > 0) parts.push(`-${res.gold_spent.toLocaleString('pt-BR')} 🪙`)
      if (res.crystals_spent > 0) parts.push(`-${res.crystals_spent} 💎`)
      if (res.discount_applied > 0) parts.push(`(-${res.discount_applied}% desconto)`)
      parts.push(`+${res.rep_points_earned} rep`)
      setMsg({ text: `Comprado! ${parts.join(' · ')}`, ok: true })
      await load()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally { setWorking(false) }
  }

  async function handleSellRecipe(instanceId: string) {
    setWorking(true); setMsg(null)
    try {
      const res = await api.post<{ ok: boolean; gold_earned: number; inventory: { items: any[]; equipped: any; maxSlots: number } }>(
        '/api/merchants/sell-recipe', { instanceId }
      )
      useInventoryStore.setState({ items: res.inventory.items, equipped: res.inventory.equipped as any, maxSlots: res.inventory.maxSlots })
      usePlayerStore.setState({ gold: gold + res.gold_earned })
      setMsg({ text: `Vendido! +${res.gold_earned.toLocaleString('pt-BR')} 🪙`, ok: true })
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally { setWorking(false) }
  }

  function finalPrice(basePrice: number, discountPct: number): number {
    return Math.max(1, Math.floor(basePrice * (1 - discountPct / 100)))
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
        <button onClick={selected ? () => { setSelected(null); setMsg(null) } : onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
          ← {selected ? 'Voltar' : 'Sair'}
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">
            {selected ? `${selected.emoji} ${selected.name}` : '🛒 Mercadores'}
          </h1>
          {selected && <p className="text-xs text-slate-500">{selected.specialty}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-400 border border-amber-800/40 px-2 py-1">{gold.toLocaleString('pt-BR')} 🪙</span>
          {daoCrystals > 0 && (
            <span className="text-cyan-400 border border-cyan-800/40 px-2 py-1">{daoCrystals.toLocaleString('pt-BR')} 💎</span>
          )}
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Lista de mercadores */}
      {!selected && (
        merchants.length === 0 ? (
          <div className="text-center text-slate-600 py-12 text-sm">Nenhum mercador disponível nesta localização.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {merchants.map(m => {
              const repColor = REP_COLORS[m.rep_level] ?? '#94a3b8'
              const nextAt   = REP_NEXT_AT[m.rep_level + 1]
              const pct      = nextAt === Infinity ? 100 : Math.min(100, (m.rep_points / nextAt) * 100)
              return (
                <button key={m.id} onClick={() => { setSelected(m); setMsg(null) }}
                  className="border border-slate-700 bg-slate-900 p-4 text-left hover:bg-slate-800 hover:border-slate-600 transition-all space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-cinzel font-bold text-slate-200">{m.name}</div>
                      <div className="text-xs text-amber-500/80">{m.specialty}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold" style={{ color: repColor }}>{m.rep_name}</div>
                      {m.discount_pct > 0 && <div className="text-[10px] text-teal-400">-{m.discount_pct}%</div>}
                      <div className="text-xs text-slate-600">{m.stock.length} itens →</div>
                    </div>
                  </div>
                  {/* Barra de reputação */}
                  <div className="space-y-0.5">
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: repColor }} />
                    </div>
                    <div className="text-[9px] text-slate-600 flex justify-between">
                      <span>{m.rep_points} pts</span>
                      {nextAt !== Infinity && <span>Próx: {nextAt} pts</span>}
                    </div>
                  </div>
                  {m.locked_stock_count > 0 && (
                    <div className="text-[10px] text-slate-600">🔒 {m.locked_stock_count} itens bloqueados</div>
                  )}
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Estoque */}
      {selected && (
        <div className="space-y-3">
          {/* Reputação */}
          <div className="border border-slate-700 bg-slate-900 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold" style={{ color: REP_COLORS[selected.rep_level] }}>{selected.rep_name}</span>
              {selected.discount_pct > 0 && <span className="text-teal-400 font-bold">Desconto: -{selected.discount_pct}%</span>}
              <span className="text-slate-500">{selected.rep_points} / {REP_NEXT_AT[selected.rep_level + 1] === Infinity ? '∞' : REP_NEXT_AT[selected.rep_level + 1]} pts</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${REP_NEXT_AT[selected.rep_level + 1] === Infinity ? 100 : Math.min(100, (selected.rep_points / REP_NEXT_AT[selected.rep_level + 1]) * 100)}%`,
                backgroundColor: REP_COLORS[selected.rep_level],
              }} />
            </div>
            {selected.locked_stock_count > 0 && (
              <div className="text-[10px] text-slate-600 mt-1">🔒 {selected.locked_stock_count} item(s) desbloqueáveis com mais reputação</div>
            )}
          </div>

          {/* Tabs Comprar / Vender */}
          <div className="flex border-b border-slate-700">
            <button onClick={() => setMerchantTab('buy')}
              className={`px-4 py-2 text-xs font-cinzel tracking-wider transition-colors border-b-2 -mb-px ${merchantTab === 'buy' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              🛒 Comprar
            </button>
            {sellRecipesEnabled && (
              <button onClick={() => setMerchantTab('sell')}
                className={`px-4 py-2 text-xs font-cinzel tracking-wider transition-colors border-b-2 -mb-px ${merchantTab === 'sell' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                💰 Vender Receitas
                {recipeItems.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-amber-700/40 text-amber-300 px-1.5 py-0.5 rounded-full">{recipeItems.length}</span>
                )}
              </button>
            )}
          </div>

          {/* Descrição */}
          {merchantTab === 'buy' && selected.description && (
            <p className="text-sm text-slate-400 italic border-l-2 border-amber-700/40 pl-3">{selected.description}</p>
          )}

          {/* ── Aba Vender ── */}
          {merchantTab === 'sell' && sellRecipesEnabled && (
            <div className="space-y-2">
              {recipeItems.length === 0 ? (
                <div className="text-center text-slate-600 py-8 text-sm">Nenhuma receita no inventário para vender.</div>
              ) : (
              <>
                {/* Botão Vender Tudo */}
                <div className="flex items-center justify-between border border-amber-800/30 bg-amber-950/10 px-3 py-2">
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-amber-400">{recipeItems.length}</span> receita(s) no inventário ·{' '}
                    <span className="font-bold text-amber-400">
                      {recipeItems.reduce((sum, item) => {
                        const tier = itemDefs[item.definitionId]?.tier ?? 2
                        return sum + (sellPrices[tier] ?? DEFAULT_SELL_PRICES[2]) * (item.quantity ?? 1)
                      }, 0).toLocaleString('pt-BR')} 🪙
                    </span> total
                  </div>
                  <button
                    disabled={working}
                    onClick={async () => {
                      setWorking(true); setMsg(null)
                      try {
                        const res = await api.post<{ ok: boolean; total_gold: number; sold: number; inventory: { items: any[]; equipped: any; maxSlots: number } }>(
                          '/api/merchants/sell-all-recipes', {}
                        )
                        useInventoryStore.setState({ items: res.inventory.items, equipped: res.inventory.equipped as any, maxSlots: res.inventory.maxSlots })
                        usePlayerStore.setState({ gold: gold + res.total_gold })
                        setMsg({ text: `Vendidas ${res.sold} receitas! +${res.total_gold.toLocaleString('pt-BR')} 🪙`, ok: true })
                      } catch (e) {
                        setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
                      } finally { setWorking(false) }
                    }}
                    className="px-4 py-1.5 text-xs font-bold border border-amber-600/70 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-colors disabled:opacity-40"
                  >
                    💰 Vender Tudo
                  </button>
                </div>

                {/* Lista individual */}
                {recipeItems.map(item => {
                const def = itemDefs[item.definitionId]
                const tier = def?.tier ?? 2
                const pricePerUnit = sellPrices[tier] ?? DEFAULT_SELL_PRICES[2]
                const price = pricePerUnit  // vende 1 por vez ao preço unitário
                const color = def ? RARITY_COLORS[def.rarity] : '#475569'
                return (
                  <div key={item.instanceId} className="border p-3 flex items-center gap-3"
                    style={{ borderColor: color + '33', backgroundColor: color + '06' }}>
                    <span className="text-xl shrink-0">{def?.emoji ?? '📖'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-200">{def?.name ?? item.definitionId}</div>
                      <div className="text-xs text-slate-500">T{tier} · ×{item.quantity ?? 1}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-400 tabular-nums">{price.toLocaleString('pt-BR')} 🪙</div>
                      <button disabled={working} onClick={() => handleSellRecipe(item.instanceId)}
                        className="mt-1 px-3 py-1 text-xs font-bold border border-amber-700/60 text-amber-400 bg-amber-950/10 hover:bg-amber-950/30 transition-colors disabled:opacity-40">
                        Vender
                      </button>
                    </div>
                  </div>
                )
              })}
              </>
              )}
            </div>
          )}

          {merchantTab === 'buy' && (selected.stock.length === 0 ? (
            <div className="text-center text-slate-600 py-8 text-sm">Sem itens disponíveis.</div>
          ) : (
            <div className="space-y-2">
              {selected.stock.map(item => {
                const def          = itemDefs[item.item_def_id]
                const color        = def ? RARITY_COLORS[def.rarity] : '#475569'
                const q            = qty[item.item_def_id] ?? 1
                const baseGold     = item.price_gold
                const discGold     = finalPrice(baseGold, selected.discount_pct)
                const totalGold    = discGold * q
                const totalCrystals= item.dao_crystal_cost * q
                const remaining    = item.daily_limit > 0 ? item.daily_limit - item.bought_today : null
                const exhausted    = remaining !== null && remaining <= 0
                const canAffordG   = totalGold === 0 || gold >= totalGold
                const canAffordC   = totalCrystals === 0 || daoCrystals >= totalCrystals
                const matCost      = item.materials_cost ?? []
                const allItems     = useInventoryStore.getState().items
                const canAffordMat = matCost.every(m => {
                  const have = allItems.filter(i => i.definitionId === m.itemId).reduce((s, i) => s + i.quantity, 0)
                  return have >= m.quantity * q
                })
                const canBuy = canAffordG && canAffordC && canAffordMat && !exhausted

                return (
                  <div key={item.item_def_id} className="border p-3 space-y-2"
                    style={{ borderColor: exhausted ? '#374151' : color + '33', backgroundColor: exhausted ? undefined : color + '06' }}>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{def?.emoji ?? '❓'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ color: exhausted ? '#475569' : color }}>
                          {def?.name ?? item.item_def_id}
                        </div>
                        {def?.description && <div className="text-[10px] text-slate-600 truncate">{def.description}</div>}

                        {/* Custo em materiais */}
                        {matCost.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {matCost.map(m => {
                              const md = itemDefs[m.itemId]
                              const have = allItems.filter(i => i.definitionId === m.itemId).reduce((s, i) => s + i.quantity, 0)
                              const ok = have >= m.quantity * q
                              return (
                                <span key={m.itemId} className="text-[10px] px-1.5 py-0.5 border"
                                  style={{ borderColor: ok ? '#22c55e44' : '#ef444444', color: ok ? '#22c55e' : '#ef4444' }}>
                                  {md?.emoji} {md?.name ?? m.itemId} ×{m.quantity * q}
                                </span>
                              )
                            })}
                          </div>
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
                    </div>

                    {/* Preço + botão */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm">
                        {totalGold > 0 && (
                          <div>
                            <span className="font-bold text-amber-400 tabular-nums">{totalGold.toLocaleString('pt-BR')} 🪙</span>
                            {selected.discount_pct > 0 && baseGold !== discGold && (
                              <span className="ml-1 text-[10px] text-slate-500 line-through">{(baseGold*q).toLocaleString('pt-BR')}</span>
                            )}
                          </div>
                        )}
                        {totalCrystals > 0 && (
                          <span className="font-bold text-cyan-400 tabular-nums">{totalCrystals} 💎</span>
                        )}
                        {totalGold === 0 && totalCrystals === 0 && matCost.length === 0 && (
                          <span className="text-teal-400 font-bold text-xs">Grátis</span>
                        )}
                      </div>
                      <button disabled={working || !canBuy}
                        onClick={() => handleBuy(selected, item)}
                        className="px-4 py-1.5 text-xs font-bold border transition-colors disabled:opacity-40"
                        style={canBuy ? { borderColor: color + '66', color, backgroundColor: color + '15' } : { borderColor: '#374151', color: '#475569' }}>
                        {exhausted ? 'Esgotado' : 'Comprar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
