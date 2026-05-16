import type { Rarity } from '../types'
import { RARITY_PROGRESSION } from '../types'

export interface IngredientCost { itemId: string; quantity: number }

// ── Raridade efetiva (base + ascensão) ────────────────────────────
export function effectiveRarity(baseRarity: Rarity, ascensionTier: number): Rarity {
  const idx = RARITY_PROGRESSION.indexOf(baseRarity)
  if (idx === -1) return baseRarity
  return RARITY_PROGRESSION[Math.min(idx + ascensionTier, RARITY_PROGRESSION.length - 1)]
}

// ── Multiplicador de stat ─────────────────────────────────────────
export function itemStatMultiplier(upgradeLevel: number, ascensionTier: number): number {
  return (1 + upgradeLevel * 0.05) * (1 + ascensionTier * 0.15)
}

// ── Chance de falha no aprimoramento ─────────────────────────────
export function upgradeFailChance(targetLevel: number): number {
  if (targetLevel <= 5) return 0
  return Math.min(50, (targetLevel - 5) * 5)
}

// ── Custo de aprimoramento (de N-1 para N) ───────────────────────
export function enhancementCost(targetLevel: number): IngredientCost[] {
  const costs: IngredientCost[] = []
  if (targetLevel <= 5) {
    const qty = [0, 3, 5, 8, 12, 16][targetLevel] ?? targetLevel * 3
    costs.push({ itemId: 'spiritual_essence', quantity: qty })
  } else if (targetLevel <= 9) {
    costs.push({ itemId: 'spiritual_essence', quantity: targetLevel * 4 })
    costs.push({ itemId: 'qi_thread',         quantity: targetLevel - 5 })
  } else if (targetLevel <= 13) {
    costs.push({ itemId: 'spiritual_essence', quantity: targetLevel * 5 })
    costs.push({ itemId: 'bronze_spiritual',  quantity: targetLevel - 9 })
  } else {
    costs.push({ itemId: 'spiritual_essence', quantity: targetLevel * 5 })
    costs.push({ itemId: 'bronze_spiritual',  quantity: 4 })
    costs.push({ itemId: 'jade_raw',          quantity: targetLevel - 13 })
  }
  return costs
}

// ── Custo de ascensão (tier atual → tier+1) ───────────────────────
const ASCENSION_COSTS: { materials: IngredientCost[]; sacrificeCount: number }[] = [
  { materials: [{ itemId: 'spiritual_essence', quantity: 20 }],                                                          sacrificeCount: 1 },
  { materials: [{ itemId: 'spiritual_essence', quantity: 40 }, { itemId: 'qi_thread',        quantity: 5  }],            sacrificeCount: 2 },
  { materials: [{ itemId: 'spiritual_essence', quantity: 60 }, { itemId: 'bronze_spiritual', quantity: 5  }],            sacrificeCount: 3 },
  { materials: [{ itemId: 'spiritual_essence', quantity: 80 }, { itemId: 'jade_raw',         quantity: 5  }],            sacrificeCount: 4 },
  { materials: [{ itemId: 'spiritual_essence', quantity: 100 },{ itemId: 'jade_raw',         quantity: 10 }],            sacrificeCount: 5 },
]

export function ascensionCost(currentTier: number): { materials: IngredientCost[]; sacrificeCount: number } {
  return ASCENSION_COSTS[currentTier] ?? ASCENSION_COSTS[0]
}

export const MAX_UPGRADE_LEVEL = 15
export const MIN_UPGRADE_FOR_ASCENSION = 5

// ── Durabilidade máxima por nível de upgrade ──────────────────────
export function itemMaxDurability(upgradeLevel: number): number {
  return 100 + upgradeLevel * 10
}

// ── Custo de reparo ───────────────────────────────────────────────
export function repairCost(currentDur: number, upgradeLevel: number): IngredientCost[] {
  const maxDur = itemMaxDurability(upgradeLevel)
  if (currentDur >= maxDur) return []
  const pct  = (maxDur - currentDur) / maxDur  // 0–1 de quanto falta
  const tier = Math.floor(upgradeLevel / 5)     // 0, 1, 2, 3
  const costs: IngredientCost[] = [
    { itemId: 'spiritual_essence', quantity: Math.max(1, Math.ceil(pct * 10 * (tier + 1))) },
  ]
  if (tier >= 1) costs.push({ itemId: 'qi_thread',        quantity: Math.max(1, Math.ceil(pct * 3)) })
  if (tier >= 2) costs.push({ itemId: 'bronze_spiritual', quantity: Math.max(1, Math.ceil(pct * 2)) })
  if (tier >= 3) costs.push({ itemId: 'jade_raw',         quantity: Math.max(1, Math.ceil(pct * 1)) })
  return costs
}
