import { create } from 'zustand'
import { api } from '../lib/api'
import { BIOME_DEFS, BIOME_ORDER } from '../data/biomes'
import { BREAKTHROUGH_REQS } from '../data/breakthroughs'
import type { ItemDefinition, RecipeDefinition, MonsterDefinition, BiomeDefinition, BreakthroughEntry } from '../types'
import type { Realm, RealmStage } from '../types'

function buildStaticBreakthroughs(): Record<string, BreakthroughEntry> {
  const map: Record<string, BreakthroughEntry> = {}
  for (const [key, req] of Object.entries(BREAKTHROUGH_REQS)) {
    if (!req) continue
    // Parse keys like 'qi_refining_initial', 'spirit_transformation_peak'
    const stages: RealmStage[] = ['initial', 'middle', 'advanced', 'peak']
    const stage = stages.find(s => key.endsWith(`_${s}`) )!
    const realm = key.slice(0, key.length - stage.length - 1) as Realm
    map[key] = { id: key, realm, stage, nextRealm: req.nextRealm, nextStage: req.nextStage, newMaxQi: req.newMaxQi, items: req.items }
  }
  return map
}

interface GameDataState {
  items:         Record<string, ItemDefinition>
  recipes:       Record<string, RecipeDefinition>
  monsters:      Record<string, MonsterDefinition>
  biomes:        Record<string, BiomeDefinition>
  biomeOrder:    string[]
  breakthroughs: Record<string, BreakthroughEntry>
  load:          () => Promise<void>
}

export const useGameDataStore = create<GameDataState>((set) => ({
  items:         {},
  recipes:       {},
  monsters:      {},
  biomes:        { ...BIOME_DEFS },
  biomeOrder:    [...BIOME_ORDER],
  breakthroughs: buildStaticBreakthroughs(),

  load: async () => {
    try {
      const [items, recipes, monsters, biomes, breakthroughs] = await Promise.all([
        api.get<ItemDefinition[]>('/api/game/items'),
        api.get<RecipeDefinition[]>('/api/game/recipes'),
        api.get<MonsterDefinition[]>('/api/game/monsters'),
        api.get<BiomeDefinition[]>('/api/game/biomes'),
        api.get<BreakthroughEntry[]>('/api/game/breakthroughs'),
      ])

      const itemMap: Record<string, ItemDefinition> = {}
      items.forEach(i => { itemMap[i.id] = i })

      const recipeMap: Record<string, RecipeDefinition> = {}
      recipes.forEach(r => { recipeMap[r.id] = r })

      const monsterMap: Record<string, MonsterDefinition> = {}
      monsters.forEach(m => { monsterMap[m.id] = m })

      const biomeMap: Record<string, BiomeDefinition> = { ...BIOME_DEFS }
      biomes.forEach(b => { biomeMap[b.id] = b })
      const biomeOrder = biomes.length > 0
        ? [...biomes].sort((a, b) => a.sortOrder - b.sortOrder).map(b => b.id)
        : [...BIOME_ORDER]

      const btMap = buildStaticBreakthroughs()
      breakthroughs.forEach(e => { btMap[e.id] = e })

      set({ items: itemMap, recipes: recipeMap, monsters: monsterMap,
            biomes: biomeMap, biomeOrder, breakthroughs: btMap })
    } catch {
      // mantém estado atual em caso de erro de rede
    }
  },
}))
