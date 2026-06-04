import { create } from 'zustand'
import { api } from '../lib/api'

export interface SectMember {
  user_id: number
  username: string
  role: 'founder' | 'elder' | 'internal' | 'external'
  contribution: number
}

export interface SectInfo {
  id: number
  name: string
  emblem: string
  motto: string | null
  tier: number
  tier_name: string
  collective_qi: number
  qi_bonus_pct: number
  max_members: number
  member_count: number
  next_tier_threshold: number | null
  my_role: 'founder' | 'elder' | 'internal' | 'external'
  my_contribution: number
  treasury: { definitionId: string; quantity: number }[]
  members: SectMember[]
}

export interface SectListItem {
  id: number; name: string; emblem: string; motto: string | null
  tier: number; tier_name: string; collective_qi: number; member_count: number; qi_bonus_pct: number
}

interface SectState {
  sect: SectInfo | null
  loaded: boolean
  load: () => Promise<void>
  clear: () => void
}

export const useSectStore = create<SectState>()((set) => ({
  sect: null,
  loaded: false,

  load: async () => {
    try {
      const data = await api.get<SectInfo | null>('/api/sects/my')
      set({ sect: data, loaded: true })
    } catch {
      set({ sect: null, loaded: true })
    }
  },

  clear: () => set({ sect: null, loaded: false }),
}))
