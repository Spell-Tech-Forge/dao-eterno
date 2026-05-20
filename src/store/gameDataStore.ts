import { create } from 'zustand'
import { api } from '../lib/api'
import type { ItemDefinition, RecipeDefinition, MonsterDefinition, BiomeDefinition, BreakthroughEntry } from '../types'
import type { ForgeConfig, CraftXpConfig } from '../utils/forge'
import type { StatConfig } from '../utils/stats'
import { type DismantleConfig, DEFAULT_DISMANTLE_CONFIG } from '../utils/dismantle'

interface GameDataState {
  items:            Record<string, ItemDefinition>
  recipes:          Record<string, RecipeDefinition>
  monsters:         Record<string, MonsterDefinition>
  biomes:           Record<string, BiomeDefinition>
  biomeOrder:       string[]
  breakthroughs:    Record<string, BreakthroughEntry>
  forgeConfig:      ForgeConfig | null
  statConfig:       StatConfig | null
  craftXpConfig:    CraftXpConfig | null
  dismantleConfig:  DismantleConfig
  load:             () => Promise<void>
}

export const useGameDataStore = create<GameDataState>((set) => ({
  items:           {},
  recipes:         {},
  monsters:        {},
  biomes:          {},
  biomeOrder:      [],
  breakthroughs:   {},
  forgeConfig:     null,
  statConfig:      null,
  craftXpConfig:   null,
  dismantleConfig: DEFAULT_DISMANTLE_CONFIG,

  load: async () => {
    try {
      const [items, recipes, monsters, biomes, breakthroughs, forgeConfig, statConfig, craftXpConfig, dismantleConfig] = await Promise.all([
        api.get<ItemDefinition[]>('/api/game/items'),
        api.get<RecipeDefinition[]>('/api/game/recipes'),
        api.get<MonsterDefinition[]>('/api/game/monsters'),
        api.get<BiomeDefinition[]>('/api/game/biomes'),
        api.get<BreakthroughEntry[]>('/api/game/breakthroughs'),
        api.get<ForgeConfig>('/api/game/forge-config'),
        api.get<StatConfig>('/api/game/stat-config'),
        api.get<CraftXpConfig>('/api/game/craft-xp-config'),
        api.get<DismantleConfig>('/api/game/dismantle-config'),
      ])

      const itemMap: Record<string, ItemDefinition> = {}
      items.forEach(i => { itemMap[i.id] = i })

      const recipeMap: Record<string, RecipeDefinition> = {}
      recipes.forEach(r => { recipeMap[r.id] = r })

      const monsterMap: Record<string, MonsterDefinition> = {}
      monsters.forEach(m => { monsterMap[m.id] = m })

      const biomeMap: Record<string, BiomeDefinition> = {}
      biomes.forEach(b => { biomeMap[b.id] = b })
      const biomeOrder = [...biomes]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(b => b.id)

      const btMap: Record<string, BreakthroughEntry> = {}
      breakthroughs.forEach(e => { btMap[e.id] = e })

      set({ items: itemMap, recipes: recipeMap, monsters: monsterMap,
            biomes: biomeMap, biomeOrder, breakthroughs: btMap,
            forgeConfig, statConfig, craftXpConfig,
            dismantleConfig: dismantleConfig ?? DEFAULT_DISMANTLE_CONFIG })
    } catch {
      // mantém estado atual em caso de erro de rede
    }
  },
}))
