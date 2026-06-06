import { create } from 'zustand'
import { api } from '../lib/api'
import type { Rarity } from '../types'
import type { SpriteConfig } from '../types/server'

export type RarityFrames = Record<Rarity, string | null>

interface SettingsState {
  itemSpriteSize:     number
  monsterSpriteSize:  number
  materialSpriteSize: number
  itemCardSize:       number
  itemBadgeSize:      number
  equipCardWidth:     number
  equipCardHeight:    number
  equipTextSize:      number
  equipBtnSize:       number
  equipBtnIcons:      boolean
  frameSlice:           number
  frameWidth:           number
  rarityFrames:         RarityFrames
  combatMonsterSize:  number
  combatPlayerSize:   number
  combatArenaHeight:  number
  combatArenaBlur:    number
  characterSpriteMale:             string | null
  characterSpriteFemale:           string | null
  characterSpriteMaleMeditation:   string | null
  characterSpriteFemaleMeditation: string | null
  characterSpriteMaleConfig:       SpriteConfig | null
  characterSpriteFemaleConfig:     SpriteConfig | null
  sellRecipesEnabled: boolean
  gameBgUrl:       string | null
  gameBgOpacity:   number
  gameBgSize:      string
  gameBgPosition:  string
  uiPanelOpacity:  number
  uiScreenOpacity: number
  load: () => Promise<void>
  save: (settings: Record<string, string>) => Promise<void>
}

function tryParseJson<T>(v: string | undefined): T | null {
  if (!v) return null
  try { return JSON.parse(v) as T } catch { return null }
}

const EMPTY_FRAMES: RarityFrames = {
  common: null, uncommon: null, spiritual: null,
  rare: null, ancient: null, legendary: null,
  divine: null, supreme: null,
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  itemSpriteSize:     40,
  monsterSpriteSize:  56,
  materialSpriteSize: 32,
  itemCardSize:       80,
  itemBadgeSize:      11,
  equipCardWidth:     150,
  equipCardHeight:    230,
  equipTextSize:      11,
  equipBtnSize:       11,
  equipBtnIcons:      true,
  frameSlice:           30,
  frameWidth:           16,
  rarityFrames:         { ...EMPTY_FRAMES },
  combatMonsterSize:  160,
  combatPlayerSize:   180,
  combatArenaHeight:  240,
  combatArenaBlur:    0,
  characterSpriteMale:             null,
  characterSpriteFemale:           null,
  characterSpriteMaleMeditation:   null,
  characterSpriteFemaleMeditation: null,
  characterSpriteMaleConfig:       null,
  characterSpriteFemaleConfig:     null,
  sellRecipesEnabled: true,
  gameBgUrl:       null,
  gameBgOpacity:   0.15,
  gameBgSize:      'cover',
  gameBgPosition:  'center',
  uiPanelOpacity:  1,
  uiScreenOpacity: 1,

  load: async () => {
    try {
      const [data, bgCfg] = await Promise.all([
        api.get<Record<string, string>>('/api/settings'),
        api.get<{ url: string | null; opacity: number; size: string; position: string; panelOpacity?: number; screenOpacity?: number }>('/api/game/game-bg-config').catch(() => null),
      ])
      set({
        itemSpriteSize:     parseInt(data.item_sprite_size     ?? '40'),
        monsterSpriteSize:  parseInt(data.monster_sprite_size  ?? '56'),
        materialSpriteSize: parseInt(data.material_sprite_size ?? '32'),
        itemCardSize:       parseInt(data.item_card_size       ?? '80'),
        itemBadgeSize:      parseInt(data.item_badge_size      ?? '11'),
        equipCardWidth:     parseInt(data.equip_card_width     ?? '150'),
        equipCardHeight:    parseInt(data.equip_card_height    ?? '230'),
        equipTextSize:      parseInt(data.equip_text_size      ?? '11'),
        equipBtnSize:       parseInt(data.equip_btn_size       ?? '11'),
        equipBtnIcons:      (data.equip_btn_icons ?? '1') !== '0',
        frameSlice:         parseInt(data.frame_slice ?? '30'),
        frameWidth:         parseInt(data.frame_width ?? '16'),
        combatMonsterSize:  parseInt(data.combat_monster_size  ?? '160'),
        combatPlayerSize:   parseInt(data.combat_player_size   ?? '180'),
        combatArenaHeight:  parseInt(data.combat_arena_height  ?? '240'),
        combatArenaBlur:    parseInt(data.combat_arena_blur    ?? '0'),
        rarityFrames: {
          common:    data.frame_common_url    || null,
          uncommon:  data.frame_uncommon_url  || null,
          spiritual: data.frame_spiritual_url || null,
          rare:      data.frame_rare_url      || null,
          ancient:   data.frame_ancient_url   || null,
          legendary: data.frame_legendary_url || null,
          divine:    data.frame_divine_url    || null,
          supreme:   data.frame_supreme_url   || null,
        },
        characterSpriteMale:              data.character_sprite_male_url              || null,
        characterSpriteFemale:            data.character_sprite_female_url            || null,
        characterSpriteMaleMeditation:    data.character_sprite_male_meditation_url   || null,
        characterSpriteFemaleMeditation:  data.character_sprite_female_meditation_url || null,
        characterSpriteMaleConfig:   tryParseJson<SpriteConfig>(data.character_sprite_male_config),
        characterSpriteFemaleConfig: tryParseJson<SpriteConfig>(data.character_sprite_female_config),
        sellRecipesEnabled: (data.sell_recipes_enabled ?? '1') !== '0',
        gameBgUrl:       bgCfg?.url           ?? null,
        gameBgOpacity:   bgCfg?.opacity       ?? 0.15,
        gameBgSize:      bgCfg?.size          ?? 'cover',
        gameBgPosition:  bgCfg?.position      ?? 'center',
        uiPanelOpacity:  bgCfg?.panelOpacity  ?? 1,
        uiScreenOpacity: bgCfg?.screenOpacity ?? 1,
      })
      // Aplica variáveis CSS ao root para afetar toda a UI
      document.documentElement.style.setProperty('--ui-panel-opacity',  String(bgCfg?.panelOpacity  ?? 1))
      document.documentElement.style.setProperty('--ui-screen-opacity', String(bgCfg?.screenOpacity ?? 1))
    } catch { /* usa defaults */ }
  },

  save: async (settings) => {
    await api.put('/api/admin/settings', settings)
    await get().load()
  },
}))
