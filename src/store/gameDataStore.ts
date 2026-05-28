import { create } from 'zustand'
import { api } from '../lib/api'
import type { ItemDefinition, RecipeDefinition, MonsterDefinition, BiomeDefinition, BreakthroughEntry } from '../types'
import type { ForgeConfig, CraftXpConfig, SkillXpConfig } from '../utils/forge'
import { DEFAULT_SKILL_XP_CONFIG } from '../utils/forge'
import type { StatConfig } from '../utils/stats'
import { type DismantleConfig, DEFAULT_DISMANTLE_CONFIG } from '../utils/dismantle'

export interface StackConfig {
  material: number
  pill:     number
  talisman: number
}

export const DEFAULT_STACK_CONFIG: StackConfig = {
  material: 9999,
  pill:     99,
  talisman: 99,
}

export type QiRateConfig = Record<string, Record<string, number>>

export const DEFAULT_QI_RATE_CONFIG: QiRateConfig = {
  qi_refining:           { initial: 3,     middle: 4,     advanced: 5,     peak: 7     },
  foundation:            { initial: 10,    middle: 15,    advanced: 20,    peak: 28    },
  golden_core:           { initial: 40,    middle: 55,    advanced: 75,    peak: 100   },
  nascent_soul:          { initial: 140,   middle: 190,   advanced: 260,   peak: 350   },
  spirit_transformation: { initial: 480,   middle: 650,   advanced: 880,   peak: 1200  },
  unification:           { initial: 1600,  middle: 2200,  advanced: 3000,  peak: 4000  },
  ascension:             { initial: 5500,  middle: 7500,  advanced: 10000, peak: 14000 },
  immortal:              { initial: 20000, middle: 28000, advanced: 38000, peak: 50000 },
}

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
  stackConfig:      StackConfig
  skillXpConfig:    SkillXpConfig
  qiRateConfig:     QiRateConfig
  load:             () => Promise<void>
  loadStackConfig:  () => Promise<void>
  loadSkillXpConfig: () => Promise<void>
  loadCraftXpConfig: () => Promise<void>
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
  stackConfig:     DEFAULT_STACK_CONFIG,
  skillXpConfig:   DEFAULT_SKILL_XP_CONFIG,
  qiRateConfig:    DEFAULT_QI_RATE_CONFIG,

  load: async () => {
    try {
      const [items, recipes, monsters, biomes, breakthroughs, forgeConfig, statConfig, craftXpConfig, dismantleConfig, stackConfig, skillXpConfig, qiRateConfig] = await Promise.all([
        api.get<ItemDefinition[]>('/api/game/items'),
        api.get<RecipeDefinition[]>('/api/game/recipes'),
        api.get<MonsterDefinition[]>('/api/game/monsters'),
        api.get<BiomeDefinition[]>('/api/game/biomes'),
        api.get<BreakthroughEntry[]>('/api/game/breakthroughs'),
        api.get<ForgeConfig>('/api/game/forge-config'),
        api.get<StatConfig>('/api/game/stat-config'),
        api.get<CraftXpConfig>('/api/game/craft-xp-config'),
        api.get<DismantleConfig>('/api/game/dismantle-config'),
        api.get<StackConfig>('/api/game/stack-config'),
        api.get<SkillXpConfig>('/api/game/skill-xp-config'),
        api.get<QiRateConfig>('/api/game/qi-rate-config'),
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
            dismantleConfig: dismantleConfig ?? DEFAULT_DISMANTLE_CONFIG,
            stackConfig:    stackConfig    ?? DEFAULT_STACK_CONFIG,
            skillXpConfig:  skillXpConfig  ?? DEFAULT_SKILL_XP_CONFIG,
            qiRateConfig:   qiRateConfig   ?? DEFAULT_QI_RATE_CONFIG })
    } catch {
      // mantém estado atual em caso de erro de rede
    }
  },

  loadStackConfig: async () => {
    try {
      const stackConfig = await api.get<StackConfig>('/api/game/stack-config')
      set({ stackConfig: stackConfig ?? DEFAULT_STACK_CONFIG })
    } catch {}
  },

  loadSkillXpConfig: async () => {
    try {
      const skillXpConfig = await api.get<SkillXpConfig>('/api/game/skill-xp-config')
      set({ skillXpConfig: skillXpConfig ?? DEFAULT_SKILL_XP_CONFIG })
    } catch {}
  },

  loadCraftXpConfig: async () => {
    try {
      const craftXpConfig = await api.get<CraftXpConfig>('/api/game/craft-xp-config')
      if (craftXpConfig) set({ craftXpConfig })
    } catch {}
  },
}))
