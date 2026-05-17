import { useState, useEffect } from 'react'
import { useMarketStore, LISTING_FEE, DELIST_PENALTY, MAX_SLOTS } from '../../store/marketStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { ITEM_DEFS } from '../../data/items'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import type { InventoryItem, ItemDefinition } from '../../types'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'

type TopTab = 'listings' | 'mine'
type SubTab = 'equipment' | 'material'

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
      <div className="flex items-center justify-center pt-0.5 h-10">
        <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={36} />
      </div>
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

// ── Aba Listagem (outros jogadores) ───────────────────────────────
function ListingsTab() {
  const { marketListings, loadMarket, buyItem } = useMarketStore()
  const charId = useAuthStore(s => s.activeCharacter?.id)
  const gold   = usePlayerStore(s => s.gold)
  const [sub, setSub]     = useState<SubTab>('equipment')
  const [error, setError] = useState('')
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => { loadMarket() }, [loadMarket])

  const equipListings = marketListings.filter(l => {
    const type = ITEM_DEFS[l.item_def_id]?.type ?? ''
    return ['weapon', 'armor', 'accessory', 'ring'].includes(type)
  })
  const materialListings = marketListings.filter(l => {
    const type = ITEM_DEFS[l.item_def_id]?.type ?? ''
    return ['material', 'pill', 'talisman'].includes(type)
  })
  const filtered = sub === 'equipment' ? equipListings : materialListings

  async function handleBuy(listingId: string) {
    if (!charId) return
    setBuying(listingId)
    setError('')
    const result = await buyItem(listingId, charId)
    if (!result.ok) setError(result.error ?? 'Erro ao comprar')
    setBuying(null)
  }

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

      {error && (
        <div className="text-center text-xs font-bold py-1.5 rounded-lg bg-danger/10 border border-danger/40 text-danger">{error}</div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center text-muted text-sm py-12">Nenhum item à venda nesta categoria.</div>
      ) : sub === 'equipment' ? (
        <div className="grid grid-cols-7 gap-2">
          {filtered.map(listing => {
            const fakeItem: InventoryItem = {
              instanceId: listing.id,
              definitionId: listing.item_def_id,
              quantity: listing.quantity,
              upgradeLevel:  listing.item_data.upgradeLevel,
              ascensionTier: listing.item_data.ascensionTier,
              durability:    listing.item_data.durability,
              obtainedAt: 0,
            }
            const def   = ITEM_DEFS[listing.item_def_id]
            const color = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            const canAfford = gold >= listing.price
            return (
              <div key={listing.id} className="flex flex-col gap-1">
                <EquipCard item={fakeItem} />
                <div className="rounded-lg border px-2 py-1 text-center"
                  style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                  <div className="text-xs font-bold text-gold">{listing.price} 🪙</div>
                  <div className="text-[10px] text-muted truncate">{listing.seller_name}</div>
                </div>
                <button
                  onClick={() => handleBuy(listing.id)}
                  disabled={!canAfford || buying === listing.id}
                  className={`w-full py-1 rounded text-xs font-bold border transition-all ${
                    canAfford
                      ? 'bg-jade/20 border-jade text-jade hover:bg-jade/30 cursor-pointer'
                      : 'border-border text-muted cursor-not-allowed opacity-50'
                  }`}>
                  {buying === listing.id ? '...' : canAfford ? 'Comprar' : 'Sem ouro'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(listing => {
            const def   = ITEM_DEFS[listing.item_def_id]
            if (!def) return null
            const color = RARITY_COLORS[def.rarity]
            const canAfford = gold >= listing.price
            return (
              <div key={listing.id} className="rounded-xl border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + '22' }}>
                  <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{def.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color }}>{RARITY_LABELS[def.rarity]}</span>
                    <span className="text-xs text-muted">×{listing.quantity}</span>
                  </div>
                  <div className="text-[10px] text-muted">{listing.seller_name}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-sm font-bold text-gold">{listing.price} 🪙</div>
                  <button
                    onClick={() => handleBuy(listing.id)}
                    disabled={!canAfford || buying === listing.id}
                    className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${
                      canAfford
                        ? 'bg-jade/20 border-jade text-jade hover:bg-jade/30 cursor-pointer'
                        : 'border-border text-muted cursor-not-allowed opacity-50'
                    }`}>
                    {buying === listing.id ? '...' : canAfford ? 'Comprar' : 'Sem ouro'}
                  </button>
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
  const item  = useInventoryStore(s => s.items.find(i => i.instanceId === instanceId))
  const def   = item ? ITEM_DEFS[item.definitionId] : null
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
            <button onClick={() => setQty(maxQty)} className="text-xs text-jade hover:underline cursor-pointer">
              máx ({maxQty})
            </button>
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
  const { myListings, pendingGold, loadMine, listItem, delistItem, claimGold, loading } = useMarketStore()
  const { items } = useInventoryStore()
  const gold   = usePlayerStore(s => s.gold)
  const charId = useAuthStore(s => s.activeCharacter?.id)

  const [listingItemId, setListingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadMine() }, [loadMine])

  const slotsUsed = myListings.length

  const equipItems    = items.filter(i => ['weapon','armor','accessory','ring'].includes(ITEM_DEFS[i.definitionId]?.type ?? ''))
  const materialItems = items.filter(i => ['material','pill','talisman'].includes(ITEM_DEFS[i.definitionId]?.type ?? ''))

  async function handleConfirmList(qty: number, pricePerUnit: number) {
    if (!listingItemId || !charId) return
    const item = items.find(i => i.instanceId === listingItemId)
    if (!item) return
    const result = await listItem(charId, item.instanceId, qty, qty * pricePerUnit)
    if (!result.ok) { setError(result.error ?? 'Erro'); return }
    setListingItemId(null)
    setError(null)
  }

  async function handleDelist(listingId: string) {
    const result = await delistItem(listingId)
    if (!result.ok) setError(result.error ?? 'Erro')
  }

  async function handleClaim() {
    if (!charId) return
    const result = await claimGold(charId)
    if (!result.ok) setError(result.error ?? 'Erro')
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
          <button onClick={handleClaim} disabled={loading}
            className="rounded-xl border border-gold bg-gold/10 px-3 py-2 text-center cursor-pointer hover:bg-gold/20 transition-all disabled:opacity-50">
            <div className="text-xs text-gold">Coletar vendas</div>
            <div className="font-bold text-gold">{pendingGold} 🪙</div>
          </button>
        )}
      </div>

      {/* Active listings */}
      {myListings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted uppercase tracking-widest">Minhas listagens</div>
          {myListings.map(listing => {
            const def   = ITEM_DEFS[listing.item_def_id]
            const color = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            return (
              <div key={listing.id} className="rounded-xl border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44' }}>
                <span className="text-xl">{def?.emoji ?? '❓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{def?.name ?? listing.item_def_id}</div>
                  <div className="text-xs text-muted">Qty: {listing.quantity}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gold">{listing.price} 🪙</div>
                  <button
                    onClick={() => handleDelist(listing.id)}
                    disabled={loading || gold < DELIST_PENALTY}
                    className={`mt-1 px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      gold >= DELIST_PENALTY && !loading
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
  const myListings      = useMarketStore(s => s.myListings)
  const pendingGold     = useMarketStore(s => s.pendingGold)

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
            {myListings.length}/{MAX_SLOTS}
          </span>
        </button>
      </div>

      {tab === 'listings' && <ListingsTab />}
      {tab === 'mine'     && <MyItemsTab />}
    </div>
  )
}
