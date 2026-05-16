import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useInventoryStore } from './inventoryStore'
import { usePlayerStore } from './playerStore'

export const LISTING_FEE    = 2    // gold to list
export const DELIST_PENALTY = 5    // gold penalty to delist
export const MAX_SLOTS      = 15
export const AUTO_SELL_MS   = 5 * 60 * 1000  // 5 minutes

export interface PlayerListing {
  id: string
  instanceId: string
  definitionId: string
  quantity: number
  price: number
  listedAt: number
  sellAfter: number
  sold: boolean
}

interface MarketState {
  listings: PlayerListing[]
  pendingGold: number
  addListing: (instanceId: string, definitionId: string, quantity: number, price: number) => { ok: boolean; error?: string }
  delistItem: (listingId: string) => { ok: boolean; error?: string }
  processSales: () => void
  claimGold: () => void
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      listings: [],
      pendingGold: 0,

      addListing: (instanceId, definitionId, quantity, price) => {
        const active = get().listings.filter(l => !l.sold)
        if (active.length >= MAX_SLOTS)
          return { ok: false, error: `Slots cheios (máx ${MAX_SLOTS})` }

        if (!usePlayerStore.getState().spendGold(LISTING_FEE))
          return { ok: false, error: `Ouro insuficiente (taxa: ${LISTING_FEE} 🪙)` }

        useInventoryStore.getState().removeItem(instanceId, quantity)

        const now = Date.now()
        const listing: PlayerListing = {
          id: `lst_${now}_${Math.random().toString(36).slice(2)}`,
          instanceId, definitionId, quantity, price,
          listedAt: now,
          sellAfter: now + AUTO_SELL_MS,
          sold: false,
        }
        set(s => ({ listings: [...s.listings, listing] }))
        return { ok: true }
      },

      delistItem: (listingId) => {
        const listing = get().listings.find(l => l.id === listingId)
        if (!listing || listing.sold) return { ok: false, error: 'Item já vendido' }

        if (!usePlayerStore.getState().spendGold(DELIST_PENALTY))
          return { ok: false, error: `Ouro insuficiente (multa: ${DELIST_PENALTY} 🪙)` }

        useInventoryStore.getState().addItem(listing.definitionId, listing.quantity)
        set(s => ({ listings: s.listings.filter(l => l.id !== listingId) }))
        return { ok: true }
      },

      processSales: () => {
        const now = Date.now()
        const { listings, pendingGold } = get()
        let earned = 0
        const updated = listings.map(l => {
          if (!l.sold && now >= l.sellAfter) {
            earned += l.price
            return { ...l, sold: true }
          }
          return l
        })
        if (earned > 0) set({ listings: updated, pendingGold: pendingGold + earned })
      },

      claimGold: () => {
        const { pendingGold } = get()
        if (pendingGold <= 0) return
        usePlayerStore.getState().gainGold(pendingGold)
        set(s => ({
          pendingGold: 0,
          listings: s.listings.filter(l => !l.sold),
        }))
      },
    }),
    { name: 'dao-eterno-market' }
  )
)
