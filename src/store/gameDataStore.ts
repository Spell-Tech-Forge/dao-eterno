import { create } from 'zustand'
import { api } from '../lib/api'
import { ITEM_DEFS } from '../data/items'
import { RECIPE_DEFS } from '../data/recipes'
import type { ItemDefinition, RecipeDefinition } from '../types'

interface GameDataState {
  items:   Record<string, ItemDefinition>
  recipes: Record<string, RecipeDefinition>
  load:    () => Promise<void>
}

export const useGameDataStore = create<GameDataState>((set) => ({
  items:   { ...ITEM_DEFS },
  recipes: { ...RECIPE_DEFS },

  load: async () => {
    try {
      const [items, recipes] = await Promise.all([
        api.get<ItemDefinition[]>('/api/game/items'),
        api.get<RecipeDefinition[]>('/api/game/recipes'),
      ])
      // DB data overrides static — static serves as fallback for items not yet in DB
      const itemMap: Record<string, ItemDefinition> = { ...ITEM_DEFS }
      items.forEach(i => { itemMap[i.id] = i })
      const recipeMap: Record<string, RecipeDefinition> = { ...RECIPE_DEFS }
      recipes.forEach(r => { recipeMap[r.id] = r })
      set({ items: itemMap, recipes: recipeMap })
    } catch {
      // Keep static defaults on network error
    }
  },
}))
