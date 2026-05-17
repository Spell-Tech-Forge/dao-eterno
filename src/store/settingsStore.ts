import { create } from 'zustand'
import { api } from '../lib/api'

interface SettingsState {
  itemSpriteSize:     number
  monsterSpriteSize:  number
  materialSpriteSize: number
  frameEquipmentUrl:  string | null
  framePillUrl:       string | null
  frameMaterialUrl:   string | null
  load: () => Promise<void>
  save: (settings: Record<string, string>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  itemSpriteSize:     40,
  monsterSpriteSize:  56,
  materialSpriteSize: 32,
  frameEquipmentUrl:  null,
  framePillUrl:       null,
  frameMaterialUrl:   null,

  load: async () => {
    try {
      const data = await api.get<Record<string, string>>('/api/settings')
      set({
        itemSpriteSize:     parseInt(data.item_sprite_size     ?? '40'),
        monsterSpriteSize:  parseInt(data.monster_sprite_size  ?? '56'),
        materialSpriteSize: parseInt(data.material_sprite_size ?? '32'),
        frameEquipmentUrl:  data.frame_equipment_url || null,
        framePillUrl:       data.frame_pill_url       || null,
        frameMaterialUrl:   data.frame_material_url   || null,
      })
    } catch { /* usa defaults */ }
  },

  save: async (settings) => {
    await api.put('/api/admin/settings', settings)
    await get().load()
  },
}))
