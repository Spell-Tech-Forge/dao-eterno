import { useState, useEffect } from 'react'
import { useMarketStore, LISTING_FEE, DELIST_PENALTY, MAX_SLOTS, AUTO_SELL_MS } from '../../store/marketStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { usePlayerStore } from '../../store/playerStore'
import { ITEM_DEFS } from '../../data/items'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import type { InventoryItem, ItemDefinition } from '../../types'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'

type TopTab = 'listings' | 'mine'
type SubTab = 'equipment' | 'material'

function timeLeft(sellAfter: number): string {
  const ms = sellAfter - Date.now()
  if (ms <= 0) return 'Vendido!'
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function statLine(def: ItemDefinition, mult = 1): string {
  const r = (n: number) => Math.round(n * mult)
  return [
    def.stats?.atk   && `força: +${r(def.stats.atk)}`,
    def.stats?.speed && `agi: ${(def.stats.speed / mult).toFixed(2)}s`,
    def.stats?.crit  && `perc: +${(def.stats.crit * mult).toFixed(1)}%`,
    def.stats?.def   && `def: +${r(def.stats.def)}`,
    def.stats?.hp    && `vit: +${r(def.stats.hp)}`,
  ].filter(Boolean).join('  ')
}

// ── Card de equipamento idêntico ao inventário ────────────────────
function EquipCard({ item, actionSlot }: { item: InventoryItem; actionSlot?: React.ReactNode }) {
  const def = ITEM_DEFS[item.definitionId]
  if (!def) return null

  const isRing  = def.type === 'ring'
  const upgLvl  = item.upgradeLevel  ?? 0
  const ascTier = item.ascensionTier ?? 0
  const effRar  = effectiveRarity(def.rarity, ascTier)
  const color   = RARITY_COLORS[effRar]
  const mult    = itemStatMultiplier(upgLvl, ascTier)
  const dur     = item.durability
  const maxDur  = itemMaxDurability(upgLvl)
  const durPct  = dur !== undefined ? (dur / maxDur) * 100 : undefined
  const durColor = !durPct ? '#22c55e' : durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-lg border flex flex-col p-2 gap-1.5"
      style={{ borderColor: color + '55', backgroundColor: color + '0d' }}>
      <div className="text-3xl text-center pt-0.5">{def.emoji}</div>
      <div className="text-center">
        <div className="font-bold text-text text-sm leading-tight line-clamp-2">{def.name}</div>
        <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color }}>{RARITY_LABELS[effRar]}</span>
          {upgLvl > 0 && (
            <span className="text-[10px] font-bold px-1 rounded border"
              style={{ color, borderColor: color + '66' }}>+{upgLvl}</span>
          )}
        </div>
      </div>
      {dur !== undefined && durPct !== undefined && (
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${durPct}%`, backgroundColor: durColor }} />
          </div>
          <span className="text-xs text-muted">{Math.round(durPct)}%</span>
        </div>
      )}
      <div className="text-xs text-muted leading-tight min-h-[0.75rem]">
        {isRing && def.stats?.slots ? `📦 ${def.stats.slots} slots` : statLine(def, mult)}
      </div>
      {actionSlot && <div className="mt-auto">{actionSlot}</div>}
    </div>
  )
}

// ── Aba Listagem ──────────────────────────────────────────────────
function ListingsTab() {
  const listings = useMarketStore(s => s.listings)
  const [sub, setSub] = useState<SubTab>('equipment')
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const active = listings.filter(l => !l.sold)

  const filtered = active.filter(l => {
    const type = ITEM_DEFS[l.definitionId]?.type ?? ''
    return sub === 'equipment'
      ? ['weapon', 'armor', 'accessory'].includes(type)
      : ['material', 'pill'].includes(type)
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
        {(['equipment', 'material'] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              sub === t ? 'bg-surface text-gold border border-border' : 'text-muted hover:text-text'
            }`}>
            {t === 'equipment' ? '⚔️ Equipamentos' : '🌿 Materiais & Pílulas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted text-sm py-12">
          Nenhum item listado nesta categoria.
        </div>
      ) : sub === 'equipment' ? (
        <div className="grid grid-cols-7 gap-2">
          {filtered.map(listing => {
            const fakeItem: InventoryItem = {
              instanceId: listing.id,
              definitionId: listing.definitionId,
              quantity: listing.quantity,
            }
            const def = ITEM_DEFS[listing.definitionId]
            const color = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            return (
              <div key={listing.id} className="relative">
                <EquipCard item={fakeItem} />
                <div className="mt-1 rounded-lg border px-2 py-1 text-center"
                  style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                  <div className="text-xs font-bold text-gold">{listing.price} 🪙</div>
                  <div className="text-[10px] text-jade">{timeLeft(listing.sellAfter)}</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(listing => {
            const def = ITEM_DEFS[listing.definitionId]
            if (!def) return null
            const color = RARITY_COLORS[def.rarity]
            return (
              <div key={listing.id} className="rounded-xl border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: color + '22' }}>{def.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{def.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color }}>{RARITY_LABELS[def.rarity]}</span>
                    <span className="text-xs text-muted">×{listing.quantity}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gold">{listing.price} 🪙</div>
                  <div className="text-[10px] text-jade mt-0.5">{timeLeft(listing.sellAfter)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Formulário de listagem ────────────────────────────────────────
function ListForm({ instanceId, onConfirm, onCancel, error }: {
  instanceId: string
  onConfirm: (qty: number, pricePerUnit: number) => void
  onCancel: () => void
  error: string | null
}) {
  const item = useInventoryStore(s => s.items.find(i => i.instanceId === instanceId))
  const def  = item ? ITEM_DEFS[item.definitionId] : null
  const maxQty = item?.quantity ?? 1
  const [qty, setQty]     = useState(1)
  const [price, setPrice] = useState('2')
  const priceNum  = Math.max(2, parseInt(price, 10) || 2)
  const totalGold = qty * priceNum

  if (!item || !def) return null

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-3">
      <div className="text-sm font-bold text-gold">Listar item</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{def.emoji}</span>
        <div>
          <div className="text-text font-semibold text-sm">{def.name}</div>
          <div className="text-xs text-muted">Disponível: {maxQty}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted">Quantidade</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-7 h-7 rounded bg-surface-2 border border-border text-text font-bold hover:bg-surface cursor-pointer">−</button>
            <input type="number" min={1} max={maxQty} value={qty}
              onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
              className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-text text-sm text-center focus:outline-none focus:border-gold" />
            <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}
              className="w-7 h-7 rounded bg-surface-2 border border-border text-text font-bold hover:bg-surface cursor-pointer">+</button>
          </div>
          {def.stackable && (
            <button onClick={() => setQty(maxQty)}
              className="text-xs text-jade hover:underline cursor-pointer">máx ({maxQty})</button>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted">Preço por unidade (mín 2 🪙)</div>
          <input type="number" min={2} value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text text-sm focus:outline-none focus:border-gold" />
        </div>
      </div>

      <div className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-xs space-y-0.5">
        <div className="flex justify-between">
          <span className="text-muted">Quantidade</span>
          <span className="text-text font-bold">×{qty}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Preço/unidade</span>
          <span className="text-gold font-bold">{priceNum} 🪙</span>
        </div>
        <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
          <span className="text-muted">Total da venda</span>
          <span className="text-gold font-bold">{totalGold} 🪙</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Taxa de listagem</span>
          <span className="text-danger font-bold">−{LISTING_FEE} 🪙</span>
        </div>
        <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
          <span className="text-muted">Recebe líquido</span>
          <span className="text-jade font-bold">{totalGold - LISTING_FEE} 🪙</span>
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span className="text-muted">Tempo de venda</span>
          <span className="text-jade">{AUTO_SELL_MS / 60000} min</span>
        </div>
      </div>

      {error && (
        <div className="text-center text-xs font-bold py-1 rounded bg-danger/10 border border-danger/40 text-danger">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onConfirm(qty, priceNum)}
          className="flex-1 py-2 rounded-lg bg-jade/20 border border-jade text-jade text-sm font-bold hover:bg-jade/30 cursor-pointer transition-all">
          Confirmar
        </button>
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-border text-muted text-sm hover:bg-surface-2 cursor-pointer transition-all">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Aba Meus Itens ────────────────────────────────────────────────
function MyItemsTab() {
  const { listings, pendingGold, addListing, delistItem, claimGold, processSales } = useMarketStore()
  const { items } = useInventoryStore()
  const gold = usePlayerStore(s => s.gold)

  const [listingItemId, setListingItemId] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [, forceUpdate]     = useState(0)

  useEffect(() => {
    processSales()
    const id = setInterval(() => { processSales(); forceUpdate(n => n + 1) }, 5000)
    return () => clearInterval(id)
  }, [processSales])

  const activeListings = listings.filter(l => !l.sold)
  const slotsUsed      = activeListings.length

  const equipItems    = items.filter(i => ['weapon','armor','accessory'].includes(ITEM_DEFS[i.definitionId]?.type ?? ''))
  const materialItems = items.filter(i => ['material','pill'].includes(ITEM_DEFS[i.definitionId]?.type ?? ''))

  function handleConfirmList(qty: number, pricePerUnit: number) {
    if (!listingItemId) return
    const item = items.find(i => i.instanceId === listingItemId)
    if (!item) return
    const result = addListing(item.instanceId, item.definitionId, qty, qty * pricePerUnit)
    if (!result.ok) { setError(result.error ?? 'Erro'); return }
    setListingItemId(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2">
          <div className="text-xs text-muted">Slots</div>
          <div className="font-bold text-text">{slotsUsed} / {MAX_SLOTS}</div>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2">
          <div className="text-xs text-muted">Taxa listagem</div>
          <div className="font-bold text-gold">{LISTING_FEE} 🪙</div>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2">
          <div className="text-xs text-muted">Multa retirada</div>
          <div className="font-bold text-danger">{DELIST_PENALTY} 🪙</div>
        </div>
        {pendingGold > 0 && (
          <button onClick={claimGold}
            className="rounded-xl border border-gold bg-gold/10 px-3 py-2 text-center cursor-pointer hover:bg-gold/20 transition-all">
            <div className="text-xs text-gold">Coletar</div>
            <div className="font-bold text-gold">{pendingGold} 🪙</div>
          </button>
        )}
      </div>

      {/* Active listings */}
      {activeListings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted uppercase tracking-widest">Listagens ativas</div>
          {activeListings.map(listing => {
            const def   = ITEM_DEFS[listing.definitionId]
            const color = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            return (
              <div key={listing.id} className="rounded-xl border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44' }}>
                <span className="text-xl">{def?.emoji ?? '❓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{def?.name}</div>
                  <div className="text-xs text-muted">
                    Qty: {listing.quantity} · Vende em: <span className="text-jade">{timeLeft(listing.sellAfter)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gold">{listing.price} 🪙</div>
                  <button
                    onClick={() => { const r = delistItem(listing.id); if (!r.ok) setError(r.error ?? 'Erro') }}
                    disabled={gold < DELIST_PENALTY}
                    className={`mt-1 px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      gold >= DELIST_PENALTY
                        ? 'border border-danger/50 text-danger hover:bg-danger/10 cursor-pointer'
                        : 'border border-border text-muted cursor-not-allowed'
                    }`}>
                    Retirar (−{DELIST_PENALTY} 🪙)
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && !listingItemId && (
        <div className="text-center text-xs font-bold py-1.5 rounded-lg bg-danger/10 border border-danger/40 text-danger">{error}</div>
      )}

      {/* Listing form */}
      {listingItemId && (
        <ListForm
          instanceId={listingItemId}
          onConfirm={handleConfirmList}
          onCancel={() => { setListingItemId(null); setError(null) }}
          error={error}
        />
      )}

      {/* Inventory — equipment */}
      {!listingItemId && slotsUsed < MAX_SLOTS && equipItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted uppercase tracking-widest">Equipamentos</div>
          <div className="grid grid-cols-7 gap-2">
            {equipItems.map(item => (
              <EquipCard key={item.instanceId} item={item}
                actionSlot={
                  <button onClick={() => { setListingItemId(item.instanceId); setError(null) }}
                    className="w-full py-1 rounded text-xs font-bold border bg-gold/10 border-gold/50 text-gold hover:bg-gold/20 cursor-pointer transition-colors">
                    Listar
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Inventory — materials & pills */}
      {!listingItemId && slotsUsed < MAX_SLOTS && materialItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted uppercase tracking-widest">Materiais & Pílulas</div>
          <div className="grid grid-cols-2 gap-2">
            {materialItems.map(item => {
              const def   = ITEM_DEFS[item.definitionId]
              if (!def) return null
              const color = RARITY_COLORS[def.rarity]
              return (
                <button key={item.instanceId}
                  onClick={() => { setListingItemId(item.instanceId); setError(null) }}
                  className="rounded-xl border p-3 flex items-center gap-3 text-left hover:brightness-110 transition-all cursor-pointer"
                  style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                  <span className="text-xl">{def.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text truncate">{def.name}</div>
                    <div className="text-xs" style={{ color }}>
                      {RARITY_LABELS[def.rarity]}
                      {def.stackable && item.quantity > 1 && <span className="text-muted ml-1">×{item.quantity}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-jade font-bold shrink-0">Listar</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!listingItemId && equipItems.length === 0 && materialItems.length === 0 && (
        <div className="text-center text-muted text-sm py-8">Nenhum item disponível para listar</div>
      )}
      {!listingItemId && slotsUsed >= MAX_SLOTS && (
        <div className="text-center text-muted text-sm py-4">Slots de listagem esgotados (máx {MAX_SLOTS})</div>
      )}
    </div>
  )
}

// ── Tela principal ────────────────────────────────────────────────
interface Props { onBack: () => void }

export function MarketScreen({ onBack }: Props) {
  const [tab, setTab]   = useState<TopTab>('listings')
  const listings        = useMarketStore(s => s.listings)
  const pendingGold     = useMarketStore(s => s.pendingGold)
  const activeCount     = listings.filter(l => !l.sold).length

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text">🏪 Mercado</h1>
        {pendingGold > 0 && (
          <span className="text-xs bg-gold/20 border border-gold/40 text-gold font-bold px-2 py-0.5 rounded-full">
            {pendingGold} 🪙 para coletar
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        <button onClick={() => setTab('listings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'listings' ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          🏪 Listagem
        </button>
        <button onClick={() => setTab('mine')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'mine' ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          📦 Meus Itens
          <span className="ml-1 text-xs bg-surface border border-border rounded-full px-1.5 text-muted">
            {activeCount}/{MAX_SLOTS}
          </span>
        </button>
      </div>

      {tab === 'listings' && <ListingsTab />}
      {tab === 'mine'     && <MyItemsTab />}
    </div>
  )
}
