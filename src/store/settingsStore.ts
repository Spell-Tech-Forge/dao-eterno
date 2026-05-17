import { create } from 'zustand'
import { api } from '../lib/api'

interface SettingsState {
  itemSpriteSize:    number
  monsterSpriteSize: number
  load: () => Promise<void>
  save: (settings: { item_sprite_size?: number; monster_sprite_size?: number }) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  itemSpriteSize:    40,
  monsterSpriteSize: 56,

  load: async () => {
    try {
      const data = await api.get<Record<string, string>>('/api/settings')
      set({
        itemSpriteSize:    parseInt(data.item_sprite_size    ?? '40'),
        monsterSpriteSize: parseInt(data.monster_sprite_size ?? '56'),
      })
    } catch { /* usa defaults */ }
  },

  save: async (settings) => {
    await api.put('/api/admin/settings', Object.fromEntries(
      Object.entries(settings).map(([k, v]) => [k, String(v)])
    ))
    await get().load()
  },
}))
