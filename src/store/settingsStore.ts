import { create } from 'zustand'
import { api } from '../lib/api'
import type { Rarity } from '../types'

export type RarityFrames = Record<Rarity, string | null>

interface SettingsState {
  itemSpriteSize:     number
  monsterSpriteSize:  number
  materialSpriteSize: number
  itemCardSize:       number
  rarityFrames:       RarityFrames
  load: () => Promise<void>
  save: (settings: Record<string, string>) => Promise<void>
}

const EMPTY_FRAMES: RarityFrames = {
  common: null, uncommon: null, spiritual: null,
  rare: null, ancient: null, legendary: null,
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  itemSpriteSize:     40,
  monsterSpriteSize:  56,
  materialSpriteSize: 32,
  itemCardSize:       80,
  rarityFrames:       { ...EMPTY_FRAMES },

  load: async () => {
    try {
      const data = await api.get<Record<string, string>>('/api/settings')
      set({
        itemSpriteSize:     parseInt(data.item_sprite_size     ?? '40'),
        monsterSpriteSize:  parseInt(data.monster_sprite_size  ?? '56'),
        materialSpriteSize: parseInt(data.material_sprite_size ?? '32'),
        itemCardSize:       parseInt(data.item_card_size       ?? '80'),
        rarityFrames: {
          common:    data.frame_common_url    || null,
          uncommon:  data.frame_uncommon_url  || null,
          spiritual: data.frame_spiritual_url || null,
          rare:      data.frame_rare_url      || null,
          ancient:   data.frame_ancient_url   || null,
          legendary: data.frame_legendary_url || null,
        },
      })
    } catch { /* usa defaults */ }
  },

  save: async (settings) => {
    await api.put('/api/admin/settings', settings)
    await get().load()
  },
}))
