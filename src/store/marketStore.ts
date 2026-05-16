import { create } from 'zustand'
import { api } from '../lib/api'
import { ITEM_DEFS } from '../data/items'
import { useInventoryStore } from './inventoryStore'
import { usePlayerStore } from './playerStore'

export const LISTING_FEE    = 2
export const DELIST_PENALTY = 5
export const MAX_SLOTS      = 15

export interface MarketListing {
  id: string
  seller_name: string
  item_def_id: string
  item_data: {
    instanceId: string
    definitionId: string
    quantity: number
    upgradeLevel?: number
    ascensionTier?: number
    durability?: number
    obtainedAt?: number
  }
  quantity: number
  price: number
  listed_at: string
}

interface MarketState {
  marketListings: MarketListing[]
  myListings: MarketListing[]
  pendingGold: number
  loading: boolean

  loadMarket: () => Promise<void>
  loadMine: () => Promise<void>
  listItem: (charId: number, instanceId: string, quantity: number, price: number) => Promise<{ ok: boolean; error?: string }>
  delistItem: (listingId: string) => Promise<{ ok: boolean; error?: string }>
  buyItem: (listingId: string, charId: number) => Promise<{ ok: boolean; error?: string }>
  claimGold: (charId: number) => Promise<{ ok: boolean; error?: string }>
}

const STACKABLE_TYPES = ['material', 'pill', 'talisman']

export const useMarketStore = create<MarketState>()((set, get) => ({
  marketListings: [],
  myListings: [],
  pendingGold: 0,
  loading: false,

  loadMarket: async () => {
    try {
      const data = await api.get<MarketListing[]>('/api/market')
      set({ marketListings: data })
    } catch { /* silently fail */ }
  },

  loadMine: async () => {
    try {
      const data = await api.get<{ listings: MarketListing[]; pendingGold: number }>('/api/market/mine')
      set({ myListings: data.listings, pendingGold: data.pendingGold })
    } catch { /* silently fail */ }
  },

  listItem: async (charId, instanceId, quantity, price) => {
    set({ loading: true })
    try {
      const result = await api.post<{ ok: boolean; newGold: number }>('/api/market/list', {
        charId, instanceId, quantity, price,
      })
      useInventoryStore.getState().removeItem(instanceId, quantity)
      usePlayerStore.setState({ gold: result.newGold })
      await get().loadMine()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao listar item' }
    } finally {
      set({ loading: false })
    }
  },

  delistItem: async (listingId) => {
    const listing = get().myListings.find(l => l.id === listingId)
    set({ loading: true })
    try {
      const result = await api.delete<{ ok: boolean; newGold: number; returnedItem: MarketListing['item_data']; returnedQty: number }>(
        `/api/market/list/${listingId}`
      )
      usePlayerStore.setState({ gold: result.newGold })

      // Add item back to local inventory
      if (listing) {
        const item = listing.item_data
        const def = ITEM_DEFS[item.definitionId]
        const isStackable = def && STACKABLE_TYPES.includes(def.type)
        if (isStackable) {
          useInventoryStore.getState().addItem(item.definitionId, listing.quantity)
        } else {
          const newInstanceId = `${item.definitionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
          useInventoryStore.setState(s => ({
            items: [...s.items, { ...item, instanceId: newInstanceId, quantity: listing.quantity, obtainedAt: item.obtainedAt ?? Date.now() }],
          }))
        }
      }

      set(s => ({ myListings: s.myListings.filter(l => l.id !== listingId) }))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao retirar item' }
    } finally {
      set({ loading: false })
    }
  },

  buyItem: async (listingId, charId) => {
    const listing = get().marketListings.find(l => l.id === listingId)
    set({ loading: true })
    try {
      const result = await api.post<{ ok: boolean; newGold: number; boughtItem: MarketListing['item_data']; quantity: number }>(
        `/api/market/buy/${listingId}`,
        { charId }
      )
      usePlayerStore.setState({ gold: result.newGold })

      // Add item to local inventory
      if (listing) {
        const item = listing.item_data
        const def = ITEM_DEFS[item.definitionId]
        const isStackable = def && STACKABLE_TYPES.includes(def.type)
        if (isStackable) {
          useInventoryStore.getState().addItem(item.definitionId, listing.quantity)
        } else {
          const newInstanceId = `${item.definitionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
          useInventoryStore.setState(s => ({
            items: [...s.items, {
              ...item,
              instanceId: newInstanceId,
              quantity: listing.quantity,
              obtainedAt: Date.now(),
            }],
          }))
        }
      }

      set(s => ({ marketListings: s.marketListings.filter(l => l.id !== listingId) }))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao comprar item' }
    } finally {
      set({ loading: false })
    }
  },

  claimGold: async (charId) => {
    set({ loading: true })
    try {
      const result = await api.post<{ ok: boolean; newGold: number | null; claimed: number }>(
        '/api/market/claim',
        { charId }
      )
      if (result.newGold !== null) {
        usePlayerStore.setState({ gold: result.newGold })
      }
      set({ pendingGold: 0 })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao coletar ouro' }
    } finally {
      set({ loading: false })
    }
  },
}))
