import { useState, useEffect } from 'react'
import { useMarketStore, LISTING_FEE, DELIST_PENALTY, MAX_SLOTS } from '../../store/marketStore'
import { useFrameStyle } from '../../hooks/useFrameStyle'
import { useInventoryStore } from '../../store/inventoryStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import type { InventoryItem, ItemDefinition } from '../../types'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'
import { TabBar } from '../ui/TabBar'
import { useSettingsStore } from '../../store/settingsStore'

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

// ── Card de equipamento ───────────────────────────────────────────
function EquipCard({ item, actionSlot }: { item: InventoryItem; actionSlot?: React.ReactNode }) {
  const spriteH     = useSettingsStore(s => s.itemSpriteSize)
  const equipW      = useSettingsStore(s => s.equipCardWidth)
  const equipH      = useSettingsStore(s => s.equipCardHeight)
  const equipTextSz = useSettingsStore(s => s.equipTextSize)
  const itemDefs    = useGameDataStore(s => s.items)
  const def = itemDefs[item.definitionId]
  const upgLvl  = item.upgradeLevel  ?? 0
  const ascTier = item.ascensionTier ?? 0
  const effRar  = def ? effectiveRarity(def.rarity, ascTier) : 'common' as const
  const color   = RARITY_COLORS[effRar]
  const frameStyle = useFrameStyle(effRar, color + '55')
  if (!def) return null
  const isRing  = def.type === 'ring'
  const mult    = itemStatMultiplier(upgLvl, ascTier)
  const dur     = item.durability
  const maxDur  = itemMaxDurability(upgLvl)
  const durPct  = dur !== undefined ? (dur / maxDur) * 100 : undefined
  const durColor = !durPct ? '#22c55e' : durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex flex-col p-2 gap-1.5 overflow-hidden"
      style={{ width: equipW, height: equipH, flexShrink: 0, backgroundColor: color + '0d', ...frameStyle }}>
      <div className="w-full overflow-hidden flex items-center justify-center" style={{ height: spriteH }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="item" />
      </div>
      <div className="text-center shrink-0">
        <div className="font-bold text-slate-200 leading-tight line-clamp-2" style={{ fontSize: equipTextSz }}>
          {def.name}
        </div>
        <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
          <span style={{ fontSize: equipTextSz - 1, color }}>{RARITY_LABELS[effRar]}</span>
          {upgLvl > 0 && (
            <span className="font-bold px-1 border" style={{ fontSize: equipTextSz - 2, color, borderColor: color + '66' }}>
              +{upgLvl}
            </span>
          )}
        </div>
      </div>
      {dur !== undefined && durPct !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${durPct}%`, backgroundColor: durColor }} />
          </div>
          <span style={{ fontSize: equipTextSz - 2 }} className="text-slate-500">{Math.round(durPct)}%</span>
        </div>
      )}
      {actionSlot && <div className="mt-auto">{actionSlot}</div>}
    </div>
  )
}

// ── Sub-tabs menores (filtro) ─────────────────────────────────────
function SubTabs({ active, onChange }: { active: SubTab; onChange: (t: SubTab) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-600 mr-1">Filtrar:</span>
      {([
        { id: 'equipment' as SubTab, label: '⚔️ Equipamentos' },
        { id: 'material'  as SubTab, label: '🌿 Materiais & Pílulas' },
      ]).map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`text-xs px-3 py-1 border transition-all ${
            active === id
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Aba Comprar ───────────────────────────────────────────────────
function BuyTab() {
  const { marketListings, loadMarket, buyItem } = useMarketStore()
  const charId       = useAuthStore(s => s.activeCharacter?.id)
  const gold         = usePlayerStore(s => s.gold)
  const materialSize = useSettingsStore(s => s.materialSpriteSize)
  const [sub, setSub]     = useState<SubTab>('equipment')
  const [error, setError] = useState('')
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => { loadMarket() }, [loadMarket])

  const equipListings = marketListings.filter(l => {
    const type = useGameDataStore.getState().items[l.item_def_id]?.type ?? ''
    return ['weapon', 'armor', 'accessory', 'ring'].includes(type)
  })
  const materialListings = marketListings.filter(l => {
    const type = useGameDataStore.getState().items[l.item_def_id]?.type ?? ''
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
      <SubTabs active={sub} onChange={setSub} />

      {error && (
        <div className="text-center text-xs font-bold py-1.5 border border-red-800/40 bg-red-950/20 text-red-400">{error}</div>
      )}

      {filtered.length === 0 ? (
        <div className="border border-slate-700 bg-slate-900 text-center text-slate-600 text-sm py-12">
          Nenhum item à venda nesta categoria.
        </div>
      ) : sub === 'equipment' ? (
        <div className="flex flex-wrap gap-2">
          {filtered.map(listing => {
            const fakeItem: InventoryItem = {
              instanceId:    listing.id,
              definitionId:  listing.item_def_id,
              quantity:      listing.quantity,
              upgradeLevel:  listing.item_data.upgradeLevel,
              ascensionTier: listing.item_data.ascensionTier,
              durability:    listing.item_data.durability,
              obtainedAt: 0,
            }
            const def       = useGameDataStore.getState().items[listing.item_def_id]
            const color     = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            const canAfford = gold >= listing.price
            return (
              <div key={listing.id} className="flex flex-col gap-1">
                <EquipCard item={fakeItem} />
                <div className="border px-2 py-1 text-center"
                  style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                  <div className="text-xs font-bold text-amber-400">{listing.price} 🪙</div>
                  <div className="text-[10px] text-slate-500 truncate">{listing.seller_name}</div>
                </div>
                <button onClick={() => handleBuy(listing.id)} disabled={!canAfford || buying === listing.id}
                  className={`w-full py-1 text-xs font-bold border transition-all ${
                    canAfford
                      ? 'bg-teal-950/30 border-teal-700 text-teal-400 hover:bg-teal-900/40 cursor-pointer'
                      : 'border-slate-700 text-slate-600 cursor-not-allowed'
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
            const def       = useGameDataStore.getState().items[listing.item_def_id]
            if (!def) return null
            const color     = RARITY_COLORS[def.rarity]
            const canAfford = gold >= listing.price
            return (
              <div key={listing.id} className="border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                <div className="flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: color + '22', width: materialSize, height: materialSize }}>
                  <SpriteImg id={def.id} emoji={def.emoji} kind="material" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 truncate">{def.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color }}>{RARITY_LABELS[def.rarity]}</span>
                    <span className="text-xs text-slate-500">×{listing.quantity}</span>
                  </div>
                  <div className="text-[10px] text-slate-600">{listing.seller_name}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-sm font-bold text-amber-400">{listing.price} 🪙</div>
                  <button onClick={() => handleBuy(listing.id)} disabled={!canAfford || buying === listing.id}
                    className={`px-2 py-0.5 text-xs font-bold border transition-all ${
                      canAfford
                        ? 'bg-teal-950/30 border-teal-700 text-teal-400 hover:bg-teal-900/40 cursor-pointer'
                        : 'border-slate-700 text-slate-600 cursor-not-allowed'
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
  const item    = useInventoryStore(s => s.items.find(i => i.instanceId === instanceId))
  const def     = item ? useGameDataStore.getState().items[item.definitionId] : null
  const maxQty  = item?.quantity ?? 1
  const [qty, setQty]     = useState(1)
  const [price, setPrice] = useState('2')
  const priceNum  = Math.max(2, parseInt(price, 10) || 2)
  const totalGold = qty * priceNum

  if (!item || !def) return null

  return (
    <div className="border border-amber-700/40 bg-amber-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-cinzel tracking-widest uppercase text-amber-500">Listar item</span>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-800/40 to-transparent" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{def.emoji}</span>
        <div>
          <div className="text-slate-200 font-semibold text-sm">{def.name}</div>
          <div className="text-xs text-slate-500">Disponível: {maxQty}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Quantidade</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-7 h-7 bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:bg-slate-700 cursor-pointer">−</button>
            <input type="number" min={1} max={maxQty} value={qty}
              onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
              className="flex-1 bg-slate-800 border border-slate-700 px-2 py-1 text-slate-200 text-sm text-center focus:outline-none focus:border-amber-700" />
            <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}
              className="w-7 h-7 bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:bg-slate-700 cursor-pointer">+</button>
          </div>
          {def.stackable && (
            <button onClick={() => setQty(maxQty)} className="text-xs text-teal-400 hover:underline cursor-pointer">
              máx ({maxQty})
            </button>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500">Preço por unidade (mín 2 🪙)</div>
          <input type="number" min={2} value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-amber-700" />
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 px-3 py-2 text-xs space-y-0.5">
        <div className="flex justify-between">
          <span className="text-slate-500">Quantidade</span>
          <span className="text-slate-200 font-bold">×{qty}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Preço/unidade</span>
          <span className="text-amber-400 font-bold">{priceNum} 🪙</span>
        </div>
        <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1">
          <span className="text-slate-500">Total da venda</span>
          <span className="text-amber-400 font-bold">{totalGold} 🪙</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Taxa de listagem</span>
          <span className="text-red-400 font-bold">−{LISTING_FEE} 🪙</span>
        </div>
        <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1">
          <span className="text-slate-500">Recebe líquido</span>
          <span className="text-teal-400 font-bold">{totalGold - LISTING_FEE} 🪙</span>
        </div>
      </div>

      {error && (
        <div className="text-center text-xs font-bold py-1 border border-red-800/40 bg-red-950/20 text-red-400">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onConfirm(qty, priceNum)}
          className="flex-1 py-2 bg-teal-950/30 border border-teal-700 text-teal-400 text-sm font-cinzel font-bold hover:bg-teal-900/40 cursor-pointer transition-all">
          Confirmar
        </button>
        <button onClick={onCancel}
          className="flex-1 py-2 border border-slate-700 text-slate-500 text-sm hover:bg-slate-800 cursor-pointer transition-all">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Aba Meus Itens ────────────────────────────────────────────────
function MyItemsTab() {
  const { myListings, pendingGold, loadMine, listItem, delistItem, claimGold, loading } = useMarketStore()
  const { items, equipped } = useInventoryStore()
  const gold   = usePlayerStore(s => s.gold)
  const charId = useAuthStore(s => s.activeCharacter?.id)

  const [listingItemId, setListingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadMine() }, [loadMine])

  const slotsUsed = myListings.length

  // IDs dos itens atualmente equipados — não podem ser listados
  const equippedIds = new Set(
    Object.values(equipped).filter(Boolean).map(e => e!.instanceId)
  )

  const equipItems = items.filter(i =>
    ['weapon','armor','accessory','ring'].includes(useGameDataStore.getState().items[i.definitionId]?.type ?? '')
    && !equippedIds.has(i.instanceId)
  )
  const materialItems = items.filter(i =>
    ['material','pill','talisman'].includes(useGameDataStore.getState().items[i.definitionId]?.type ?? '')
  )

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
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-slate-700 bg-slate-900 px-3 py-2">
          <div className="text-xs text-slate-500">Slots usados</div>
          <div className="font-bold text-slate-200">{slotsUsed} / {MAX_SLOTS}</div>
        </div>
        <div className="border border-slate-700 bg-slate-900 px-3 py-2">
          <div className="text-xs text-slate-500">Taxa de listagem</div>
          <div className="font-bold text-amber-400">{LISTING_FEE} 🪙</div>
        </div>
        <div className="border border-slate-700 bg-slate-900 px-3 py-2">
          <div className="text-xs text-slate-500">Multa de retirada</div>
          <div className="font-bold text-red-400">{DELIST_PENALTY} 🪙</div>
        </div>
      </div>

      {pendingGold > 0 && (
        <button onClick={handleClaim} disabled={loading}
          className="w-full border border-amber-700 bg-amber-950/20 px-3 py-2.5 text-center cursor-pointer hover:bg-amber-950/40 transition-all disabled:opacity-50">
          <div className="text-xs text-slate-500">Vendas disponíveis para coletar</div>
          <div className="font-cinzel font-bold text-amber-400 text-lg">{pendingGold} 🪙</div>
        </button>
      )}

      {/* Minhas listagens ativas */}
      {myListings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Minhas listagens</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="text-amber-800 text-[10px]">✦</span>
          </div>
          {myListings.map(listing => {
            const def   = useGameDataStore.getState().items[listing.item_def_id]
            const color = def ? RARITY_COLORS[def.rarity] : '#94a3b8'
            return (
              <div key={listing.id} className="border p-3 flex items-center gap-3"
                style={{ borderColor: color + '44' }}>
                <span className="text-xl">{def?.emoji ?? '❓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 truncate">{def?.name ?? listing.item_def_id}</div>
                  <div className="text-xs text-slate-500">Qty: {listing.quantity}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-amber-400">{listing.price} 🪙</div>
                  <button onClick={() => handleDelist(listing.id)} disabled={loading || gold < DELIST_PENALTY}
                    className={`mt-1 px-2 py-0.5 text-xs font-bold transition-all ${
                      gold >= DELIST_PENALTY && !loading
                        ? 'border border-red-800/50 text-red-400 hover:bg-red-950/20 cursor-pointer'
                        : 'border border-slate-700 text-slate-600 cursor-not-allowed'
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
        <div className="text-center text-xs font-bold py-1.5 border border-red-800/40 bg-red-950/20 text-red-400">{error}</div>
      )}

      {listingItemId && (
        <ListForm
          instanceId={listingItemId}
          onConfirm={handleConfirmList}
          onCancel={() => { setListingItemId(null); setError(null) }}
          error={error}
        />
      )}

      {/* Inventário — equipamentos (exceto equipados) */}
      {!listingItemId && slotsUsed < MAX_SLOTS && equipItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Equipamentos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="text-xs text-slate-600">itens equipados não aparecem</span>
            <span className="text-amber-800 text-[10px]">✦</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipItems.map(item => (
              <EquipCard key={item.instanceId} item={item}
                actionSlot={
                  <button onClick={() => { setListingItemId(item.instanceId); setError(null) }}
                    className="w-full py-1 text-xs font-bold border bg-amber-950/20 border-amber-700/50 text-amber-400 hover:bg-amber-950/40 cursor-pointer transition-colors">
                    Listar
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Inventário — materiais & pílulas */}
      {!listingItemId && slotsUsed < MAX_SLOTS && materialItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Materiais & Pílulas</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="text-amber-800 text-[10px]">✦</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {materialItems.map(item => {
              const def   = useGameDataStore.getState().items[item.definitionId]
              if (!def) return null
              const color = RARITY_COLORS[def.rarity]
              return (
                <button key={item.instanceId}
                  onClick={() => { setListingItemId(item.instanceId); setError(null) }}
                  className="border p-3 flex items-center gap-3 text-left hover:brightness-110 transition-all cursor-pointer"
                  style={{ borderColor: color + '44', backgroundColor: color + '0a' }}>
                  <SpriteImg id={def.id} emoji={def.emoji} kind="material" size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200 truncate">{def.name}</div>
                    <div className="text-xs" style={{ color }}>
                      {RARITY_LABELS[def.rarity]}
                      {def.stackable && item.quantity > 1 && <span className="text-slate-500 ml-1">×{item.quantity}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold shrink-0">Listar</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!listingItemId && equipItems.length === 0 && materialItems.length === 0 && (
        <div className="text-center text-slate-600 text-sm py-8">Nenhum item disponível para listar.</div>
      )}
      {!listingItemId && slotsUsed >= MAX_SLOTS && (
        <div className="text-center text-slate-600 text-sm py-4">Slots de listagem esgotados (máx {MAX_SLOTS}).</div>
      )}
    </div>
  )
}

// ── Tela principal ────────────────────────────────────────────────
interface Props { onBack: () => void }

export function MarketScreen({ onBack }: Props) {
  const [tab, setTab]  = useState<TopTab>('listings')
  const myListings     = useMarketStore(s => s.myListings)
  const pendingGold    = useMarketStore(s => s.pendingGold)

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider flex-1">Mercado</h1>
        {pendingGold > 0 && (
          <span className="text-xs bg-amber-950/30 border border-amber-700/40 text-amber-400 font-bold px-2 py-0.5">
            {pendingGold} 🪙 para coletar
          </span>
        )}
      </div>

      {/* ── Tabs principais ── */}
      <div className="border border-slate-700 bg-slate-900">
        <TabBar
          tabs={[
            { id: 'listings', label: 'Comprar',    icon: '🏪' },
            { id: 'mine',     label: `Meus Itens (${myListings.length}/${MAX_SLOTS})`, icon: '📦' },
          ]}
          activeTab={tab}
          onChange={id => setTab(id as TopTab)}
        />
        <div className="p-4">
          {tab === 'listings' && <BuyTab />}
          {tab === 'mine'     && <MyItemsTab />}
        </div>
      </div>
    </div>
  )
}
