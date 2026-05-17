import { create } from 'zustand'
import { api } from '../lib/api'

interface SpritesState {
  items:    Record<string, string>
  monsters: Record<string, string>
  loaded:   boolean
  loading:  boolean
  load:     () => Promise<void>
}

export const useSpritesStore = create<SpritesState>((set, get) => ({
  items:    {},
  monsters: {},
  loaded:   false,
  loading:  false,

  load: async () => {
    if (get().loading) return          // evita requests concorrentes
    set({ loading: true })
    try {
      const data = await api.get<{ items: Record<string, string>; monsters: Record<string, string> }>(
        '/api/admin/sprites'
      )
      set({ items: data.items, monsters: data.monsters, loaded: true, loading: false })
    } catch {
      set({ loaded: true, loading: false })
    }
  },
}))

export function getItemSprite(id: string): string | null {
  return useSpritesStore.getState().items[id] ?? null
}

export function getMonsterSprite(id: string): string | null {
  return useSpritesStore.getState().monsters[id] ?? null
}
