import { create } from 'zustand'
import { api } from '../lib/api'
import type { ItemDefinition, RecipeDefinition, MonsterDefinition, BiomeDefinition, BreakthroughEntry, ClassDefinition, TalentNode, LawDefinition, LocationDefinition } from '../types'
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
  body_tempering:        { strength: 1,        muscle: 1,        bone: 2,          marrow: 2,        meridian: 3,       eight_gates: 4,    nine_stars: 5      },
  houtian:               { initial: 8,         middle: 12,       advanced: 18,     peak: 28          },
  xiantian:              { initial: 50,        middle: 80,       advanced: 120,    peak: 180         },
  revolving_core:        { initial: 300,       middle: 500,      advanced: 800,    peak: 1200        },
  life_destruction:      { destruction_1: 2000, destruction_2: 3200, destruction_3: 5000, destruction_4: 8000, destruction_5: 13000, destruction_6: 20000, destruction_7: 32000, destruction_8: 50000, destruction_9: 80000 },
  divine_sea:            { initial: 130000,    middle: 200000,   advanced: 320000, peak: 500000      },
  divine_transformation: { initial: 800000,    middle: 1300000,  advanced: 2000000,peak: 3200000     },
  divine_lord:           { initial: 5000000,   middle: 8000000,  advanced: 13000000,peak: 20000000   },
  holy_lord:             { initial: 32000000,  middle: 50000000, advanced: 80000000,peak: 130000000  },
  world_king:            { initial: 200000000, middle: 320000000,advanced: 500000000,peak: 800000000 },
  empyrean:              { initial: 1300000000,middle: 2000000000,advanced: 3200000000,peak: 5000000000 },
  true_divinity:         { initial: 8000000000,middle: 13000000000,advanced: 20000000000,peak: 32000000000 },
  beyond_divinity:       { initial: 50000000000,middle: 80000000000,advanced: 130000000000,peak: 200000000000 },
}

interface GameDataState {
  items:            Record<string, ItemDefinition>
  recipes:          Record<string, RecipeDefinition>
  monsters:         Record<string, MonsterDefinition>
  biomes:           Record<string, BiomeDefinition>
  biomeOrder:       string[]
  breakthroughs:    Record<string, BreakthroughEntry>
  classes:          ClassDefinition[]
  talentNodes:      Record<string, TalentNode>
  laws:             LawDefinition[]
  forgeConfig:      ForgeConfig | null
  statConfig:       StatConfig | null
  craftXpConfig:    CraftXpConfig | null
  dismantleConfig:  DismantleConfig
  stackConfig:      StackConfig
  skillXpConfig:    SkillXpConfig
  qiRateConfig:     QiRateConfig
  classBtConfig:    Record<string, Record<string, number>> | null
  locations:        LocationDefinition[]
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
  classes:         [],
  talentNodes:     {},
  laws:            [],
  forgeConfig:     null,
  statConfig:      null,
  craftXpConfig:   null,
  dismantleConfig: DEFAULT_DISMANTLE_CONFIG,
  stackConfig:     DEFAULT_STACK_CONFIG,
  skillXpConfig:   DEFAULT_SKILL_XP_CONFIG,
  qiRateConfig:    DEFAULT_QI_RATE_CONFIG,
  classBtConfig:   null,
  locations:       [],

  load: async () => {
    try {
      const [items, recipes, monsters, biomes, breakthroughs, classes, talentNodes, laws, forgeConfig, statConfig, craftXpConfig, dismantleConfig, stackConfig, skillXpConfig, qiRateConfig, classBtConfig, locations] = await Promise.all([
        api.get<ItemDefinition[]>('/api/game/items'),
        api.get<RecipeDefinition[]>('/api/game/recipes'),
        api.get<MonsterDefinition[]>('/api/game/monsters'),
        api.get<BiomeDefinition[]>('/api/game/biomes'),
        api.get<BreakthroughEntry[]>('/api/game/breakthroughs'),
        api.get<ClassDefinition[]>('/api/game/classes'),
        api.get<TalentNode[]>('/api/game/talent-nodes'),
        api.get<LawDefinition[]>('/api/game/laws'),
        api.get<ForgeConfig>('/api/game/forge-config'),
        api.get<StatConfig>('/api/game/stat-config'),
        api.get<CraftXpConfig>('/api/game/craft-xp-config'),
        api.get<DismantleConfig>('/api/game/dismantle-config'),
        api.get<StackConfig>('/api/game/stack-config'),
        api.get<SkillXpConfig>('/api/game/skill-xp-config'),
        api.get<QiRateConfig>('/api/game/qi-rate-config'),
        api.get<Record<string, Record<string, number>>>('/api/game/class-breakthrough-config').catch(() => null),
        api.get<LocationDefinition[]>('/api/game/locations').catch(() => []),
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
      breakthroughs.forEach(e => { btMap[`${e.realm}_${e.stage}`] = e })

      const talentNodeMap: Record<string, TalentNode> = {}
      talentNodes.forEach(n => { talentNodeMap[n.id] = n })

      set({ items: itemMap, recipes: recipeMap, monsters: monsterMap,
            biomes: biomeMap, biomeOrder, breakthroughs: btMap,
            classes: classes ?? [],
            talentNodes: talentNodeMap,
            laws: laws ?? [],
            forgeConfig, statConfig, craftXpConfig,
            dismantleConfig: dismantleConfig ?? DEFAULT_DISMANTLE_CONFIG,
            stackConfig:    stackConfig    ?? DEFAULT_STACK_CONFIG,
            skillXpConfig:  skillXpConfig  ?? DEFAULT_SKILL_XP_CONFIG,
            qiRateConfig:   qiRateConfig   ?? DEFAULT_QI_RATE_CONFIG,
            classBtConfig:  classBtConfig  ?? null,
            locations:      locations      ?? [] })
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
