import { create } from 'zustand'
import type { InventoryItem, ItemType, Rarity } from '../types'
import { useGameDataStore } from './gameDataStore'
import { usePlayerStore } from './playerStore'
import { computeMaxHp } from '../utils/stats'
import { enhancementCost, upgradeFailChance, ascensionCost, itemStatMultiplier, itemMaxDurability, repairCost, MAX_UPGRADE_LEVEL, MIN_UPGRADE_FOR_ASCENSION } from '../utils/forge'

// Recalcula maxHp somando o bônus de HP de todos os slots equipados
function syncAllEquippedHp(equipped: Equipped) {
  const { attributes, syncMaxHp } = usePlayerStore.getState()
  const itemDefs = useGameDataStore.getState().items
  let bonusHp = 0
  for (const item of [equipped.weapon, equipped.armor, equipped.accessory]) {
    if (!item) continue
    const def = itemDefs[item.definitionId]
    if (!def?.stats?.hp) continue
    const mult = itemStatMultiplier(item.upgradeLevel ?? 0, item.ascensionTier ?? 0)
    bonusHp += Math.round(def.stats.hp * mult)
  }
  syncMaxHp(computeMaxHp(attributes.vitality) + bonusHp)
}

const STACKABLE_TYPES: ItemType[] = ['material', 'pill', 'talisman']

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0, uncommon: 1, spiritual: 2, rare: 3, ancient: 4, legendary: 5,
}

interface FilterState {
  type: ItemType | 'all'
  rarity: Rarity | 'all'
  search: string
}

type SortField = 'name' | 'rarity' | 'atk' | 'def' | 'quantity' | 'obtainedAt'
type SortDir   = 'asc' | 'desc'

interface Equipped {
  weapon:    InventoryItem | null
  armor:     InventoryItem | null
  accessory: InventoryItem | null
  ring:      InventoryItem | null
}

interface InventoryState {
  items: InventoryItem[]
  equipped: Equipped
  maxSlots: number
  filter: FilterState
  sortField: SortField
  sortDir: SortDir
  addItem: (definitionId: string, quantity?: number) => boolean
  removeItem: (instanceId: string, quantity?: number) => void
  equipItem: (instanceId: string) => void
  unequipSlot: (slot: 'weapon' | 'armor' | 'accessory') => void
  dismantleItem: (instanceId: string, forgeLevel: number) => { itemId: string; quantity: number }[]
  reduceDurability: (slot: keyof Equipped, amount: number) => void
  upgradeItem: (instanceId: string) => { success: boolean; reason?: string }
  ascendItem: (instanceId: string, sacrificeIds: string[]) => { success: boolean; reason?: string }
  repairItem: (instanceId: string) => { success: boolean; reason?: string }
  setFilter: (f: Partial<FilterState>) => void
  setSort: (field: SortField, dir?: SortDir) => void
  getFiltered: () => InventoryItem[]
}

const makeId = (defId: string) => `${defId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

export const INITIAL_RING: InventoryItem = {
  instanceId: 'ring-initial',
  definitionId: 'ring_leather',
  quantity: 1,
  obtainedAt: 0,
}

export const INITIAL_EQUIPPED = { weapon: null, armor: null, accessory: null, ring: INITIAL_RING } as const

export const useInventoryStore = create<InventoryState>()((set, get) => ({
      items: [INITIAL_RING],
      equipped: { weapon: null, armor: null, accessory: null, ring: INITIAL_RING },
      maxSlots: 30,
      filter: { type: 'all', rarity: 'all', search: '' },
      sortField: 'obtainedAt',
      sortDir: 'desc',

      addItem: (definitionId, quantity = 1) => {
        const { items, maxSlots } = get()
        const def = useGameDataStore.getState().items[definitionId]
        if (!def) return false
        const isStackable = STACKABLE_TYPES.includes(def.type)
        if (isStackable) {
          const existing = items.find(i => i.definitionId === definitionId)
          if (existing) {
            set(s => ({ items: s.items.map(i => i.instanceId === existing.instanceId ? { ...i, quantity: i.quantity + quantity } : i) }))
            return true
          }
        }
        if (items.length >= maxSlots) return false
        const newItem: InventoryItem = {
          instanceId: makeId(definitionId),
          definitionId,
          quantity,
          durability: ['weapon','armor','accessory'].includes(def.type) ? 100 : undefined,
          obtainedAt: Date.now(),
        }
        set(s => ({ items: [...s.items, newItem] }))
        return true
      },

      removeItem: (instanceId, quantity = 1) => set(s => {
        const item = s.items.find(i => i.instanceId === instanceId)
        if (!item) return {}
        if (item.quantity <= quantity) return { items: s.items.filter(i => i.instanceId !== instanceId) }
        return { items: s.items.map(i => i.instanceId === instanceId ? { ...i, quantity: i.quantity - quantity } : i) }
      }),

      equipItem: (instanceId) => {
        const { items } = get()
        const item = items.find(i => i.instanceId === instanceId)
        if (!item) return
        const def = useGameDataStore.getState().items[item.definitionId]
        if (!def) return
        const slotMap: Partial<Record<ItemType, keyof Equipped>> = {
          weapon: 'weapon', armor: 'armor', accessory: 'accessory', ring: 'ring',
        }
        const slot = slotMap[def.type]
        if (!slot) return
        const newMaxSlots = slot === 'ring' ? (def.stats?.slots ?? get().maxSlots) : get().maxSlots
        set(s => ({ equipped: { ...s.equipped, [slot]: item }, maxSlots: newMaxSlots }))
        syncAllEquippedHp(get().equipped)
      },

      // Anéis não podem ser desequipados, apenas substituídos
      unequipSlot: (slot) => {
        set(s => ({ equipped: { ...s.equipped, [slot]: null } }))
        syncAllEquippedHp(get().equipped)
      },

      dismantleItem: (instanceId, forgeLevel) => {
        const { items, equipped } = get()
        const isEquipped = Object.values(equipped).some(e => e?.instanceId === instanceId)
        if (isEquipped) return []
        const item = items.find(i => i.instanceId === instanceId)
        if (!item) return []
        const rate = Math.min(0.70, 0.40 + forgeLevel * 0.006)
        const recovered = [{ itemId: 'spiritual_essence', quantity: Math.max(1, Math.ceil(rate * 2)) }]
        set(s => ({ items: s.items.filter(i => i.instanceId !== instanceId) }))
        recovered.forEach(r => get().addItem(r.itemId, r.quantity))
        return recovered
      },

      reduceDurability: (slot, amount) => set(s => {
        const item = s.equipped[slot]
        if (!item || item.durability === undefined) return {}
        const newDur = Math.max(0, item.durability - amount)
        const updated = { ...item, durability: newDur }
        return {
          equipped: { ...s.equipped, [slot]: updated },
          items: s.items.map(i => i.instanceId === item.instanceId ? updated : i),
        }
      }),

      upgradeItem: (instanceId) => {
        const state = get()
        const item = state.items.find(i => i.instanceId === instanceId)
        if (!item) return { success: false, reason: 'Item não encontrado' }
        const current = item.upgradeLevel ?? 0
        if (current >= MAX_UPGRADE_LEVEL) return { success: false, reason: 'Nível máximo atingido' }
        const target = current + 1
        const costs = enhancementCost(target)
        const hasMaterials = costs.every(c => {
          const owned = state.items.find(i => i.definitionId === c.itemId)
          return (owned?.quantity ?? 0) >= c.quantity
        })
        if (!hasMaterials) return { success: false, reason: 'Materiais insuficientes' }
        costs.forEach(c => {
          const owned = get().items.find(i => i.definitionId === c.itemId)
          if (owned) get().removeItem(owned.instanceId, c.quantity)
        })
        const failPct = upgradeFailChance(target)
        const success = Math.random() * 100 >= failPct
        if (success) {
          const newMaxDur = item.durability !== undefined ? itemMaxDurability(target) : undefined
          const updated = { ...item, upgradeLevel: target, ...(newMaxDur !== undefined && { durability: newMaxDur }) }
          set(s => {
            const eq = { ...s.equipped }
            for (const k of Object.keys(eq) as (keyof Equipped)[]) {
              if (eq[k]?.instanceId === instanceId) eq[k] = updated as typeof eq[typeof k]
            }
            return { items: s.items.map(i => i.instanceId === instanceId ? updated : i), equipped: eq }
          })
          syncAllEquippedHp(get().equipped)
        }
        return { success }
      },

      ascendItem: (instanceId, sacrificeIds) => {
        const state = get()
        const item = state.items.find(i => i.instanceId === instanceId)
        if (!item) return { success: false, reason: 'Item não encontrado' }
        const tier = item.ascensionTier ?? 0
        if (tier >= 5) return { success: false, reason: 'Raridade máxima atingida' }
        if ((item.upgradeLevel ?? 0) < MIN_UPGRADE_FOR_ASCENSION)
          return { success: false, reason: `Requer +${MIN_UPGRADE_FOR_ASCENSION}` }
        const { materials, sacrificeCount } = ascensionCost(tier)
        if (sacrificeIds.length !== sacrificeCount)
          return { success: false, reason: `Precisa de ${sacrificeCount} cópia(s)` }
        const validSacrifices = sacrificeIds.every(sid => {
          if (sid === instanceId) return false
          const s = state.items.find(i => i.instanceId === sid)
          return s && s.definitionId === item.definitionId && (s.ascensionTier ?? 0) === tier
        })
        if (!validSacrifices) return { success: false, reason: 'Cópias inválidas' }
        const hasMaterials = materials.every(c => {
          const owned = state.items.find(i => i.definitionId === c.itemId)
          return (owned?.quantity ?? 0) >= c.quantity
        })
        if (!hasMaterials) return { success: false, reason: 'Materiais insuficientes' }
        materials.forEach(c => {
          const owned = get().items.find(i => i.definitionId === c.itemId)
          if (owned) get().removeItem(owned.instanceId, c.quantity)
        })
        sacrificeIds.forEach(sid => get().removeItem(sid, 1))
        const updated = { ...item, ascensionTier: tier + 1, upgradeLevel: 0 }
        set(s => {
          const eq = { ...s.equipped }
          for (const k of Object.keys(eq) as (keyof Equipped)[]) {
            if (eq[k]?.instanceId === instanceId) eq[k] = updated as typeof eq[typeof k]
          }
          return { items: s.items.map(i => i.instanceId === instanceId ? updated : i), equipped: eq }
        })
        syncAllEquippedHp(get().equipped)
        return { success: true }
      },

      repairItem: (instanceId) => {
        const state = get()
        const item = state.items.find(i => i.instanceId === instanceId)
        if (!item || item.durability === undefined) return { success: false, reason: 'Item inválido' }
        const upgLvl = item.upgradeLevel ?? 0
        const maxDur = itemMaxDurability(upgLvl)
        if (item.durability >= maxDur) return { success: false, reason: 'Durabilidade já cheia' }
        const costs = repairCost(item.durability, upgLvl)
        const hasMaterials = costs.every(c => {
          const owned = state.items.find(i => i.definitionId === c.itemId)
          return (owned?.quantity ?? 0) >= c.quantity
        })
        if (!hasMaterials) return { success: false, reason: 'Materiais insuficientes' }
        costs.forEach(c => {
          const owned = get().items.find(i => i.definitionId === c.itemId)
          if (owned) get().removeItem(owned.instanceId, c.quantity)
        })
        const updated = { ...item, durability: maxDur }
        set(s => {
          const eq = { ...s.equipped }
          for (const k of Object.keys(eq) as (keyof Equipped)[]) {
            if (eq[k]?.instanceId === instanceId) eq[k] = updated as typeof eq[typeof k]
          }
          return { items: s.items.map(i => i.instanceId === instanceId ? updated : i), equipped: eq }
        })
        return { success: true }
      },

      setFilter: (f) => set(s => ({ filter: { ...s.filter, ...f } })),

      setSort: (field, dir) => set(s => ({
        sortField: field,
        sortDir: dir ?? (s.sortField === field && s.sortDir === 'desc' ? 'asc' : 'desc'),
      })),

      getFiltered: () => {
        const { items, filter, sortField, sortDir } = get()
        let result = [...items]
        if (filter.type !== 'all')   result = result.filter(i => useGameDataStore.getState().items[i.definitionId]?.type === filter.type)
        if (filter.rarity !== 'all') result = result.filter(i => useGameDataStore.getState().items[i.definitionId]?.rarity === filter.rarity)
        if (filter.search) {
          const q = filter.search.toLowerCase()
          result = result.filter(i => useGameDataStore.getState().items[i.definitionId]?.name.toLowerCase().includes(q))
        }
        result.sort((a, b) => {
          const defA = useGameDataStore.getState().items[a.definitionId], defB = useGameDataStore.getState().items[b.definitionId]
          let cmp = 0
          switch (sortField) {
            case 'name':       cmp = (defA?.name ?? '').localeCompare(defB?.name ?? ''); break
            case 'rarity':     cmp = (RARITY_ORDER[defA?.rarity ?? 'common']) - (RARITY_ORDER[defB?.rarity ?? 'common']); break
            case 'atk':        cmp = (defA?.stats?.atk ?? 0) - (defB?.stats?.atk ?? 0); break
            case 'def':        cmp = (defA?.stats?.def ?? 0) - (defB?.stats?.def ?? 0); break
            case 'quantity':   cmp = a.quantity - b.quantity; break
            case 'obtainedAt': cmp = a.obtainedAt - b.obtainedAt; break
          }
          return sortDir === 'asc' ? cmp : -cmp
        })
        return result
      },
  }))
