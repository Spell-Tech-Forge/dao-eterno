import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BestiaryEntry } from '../types'

interface BestiaryState {
  entries: Record<string, BestiaryEntry>
  discoveredItems: string[]
  recordKill: (monsterId: string, dropsObtained: string[]) => void
  getEntry: (monsterId: string) => BestiaryEntry | undefined
}

export const useBestiaryStore = create<BestiaryState>()(
  persist(
    (set, get) => ({
      entries: {},
      discoveredItems: [],

      recordKill: (monsterId, dropsObtained) => set((s) => {
        const existing = s.entries[monsterId]
        const newDrops = existing
          ? [...new Set([...existing.discoveredDrops, ...dropsObtained])]
          : dropsObtained
        const newItems = [...new Set([...s.discoveredItems, ...dropsObtained])]
        return {
          entries: {
            ...s.entries,
            [monsterId]: {
              monsterId,
              kills: (existing?.kills ?? 0) + 1,
              firstKilledAt: existing?.firstKilledAt ?? Date.now(),
              discoveredDrops: newDrops,
            },
          },
          discoveredItems: newItems,
        }
      }),

      getEntry: (monsterId) => get().entries[monsterId],
    }),
    { name: 'dao-eterno-bestiary' }
  )
)
