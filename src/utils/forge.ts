import type { Rarity } from '../types'
import { RARITY_PROGRESSION } from '../types'

export interface IngredientCost { itemId: string; quantity: number }

// ── Exported config types ─────────────────────────────────────
export interface UpgradeLevelConfig {
  level: number
  materials: IngredientCost[]
  failChance: number
}

export interface AscensionTierConfig {
  tier: number
  materials: IngredientCost[]
  sacrificeCount: number
}

export interface ForgeConfig {
  upgrade: UpgradeLevelConfig[]
  ascension: AscensionTierConfig[]
}

export interface CraftXpConfig {
  forja: number[]
  alquimia: number[]
  inscricao: number[]
}

// ── Raridade efetiva (base + ascensão) ────────────────────────
export function effectiveRarity(baseRarity: Rarity, ascensionTier: number): Rarity {
  const idx = RARITY_PROGRESSION.indexOf(baseRarity)
  if (idx === -1) return baseRarity
  return RARITY_PROGRESSION[Math.min(idx + ascensionTier, RARITY_PROGRESSION.length - 1)]
}

// ── Multiplicador de stat ─────────────────────────────────────
export function itemStatMultiplier(upgradeLevel: number, ascensionTier: number): number {
  return (1 + upgradeLevel * 0.05) * (1 + ascensionTier * 0.15)
}

// ── Chance de falha no aprimoramento ─────────────────────────
export function upgradeFailChance(targetLevel: number, config?: ForgeConfig): number {
  if (config) {
    const entry = config.upgrade.find(u => u.level === targetLevel)
    if (entry) return entry.failChance
  }
  if (targetLevel <= 5) return 0
  return Math.min(50, (targetLevel - 5) * 5)
}

// ── Custo de aprimoramento (de N-1 para N) ───────────────────
export function enhancementCost(targetLevel: number, config?: ForgeConfig): IngredientCost[] {
  if (config) {
    const entry = config.upgrade.find(u => u.level === targetLevel)
    if (entry) return entry.materials
  }
  return []
}

// ── Custo de ascensão (tier atual → tier+1) ───────────────────
export function ascensionCost(
  currentTier: number,
  config?: ForgeConfig,
): { materials: IngredientCost[]; sacrificeCount: number } {
  if (config) {
    const entry = config.ascension.find(a => a.tier === currentTier)
    if (entry) return { materials: entry.materials, sacrificeCount: entry.sacrificeCount }
  }
  // fallback: empty materials, incrementing sacrifice count
  return { materials: [], sacrificeCount: currentTier + 1 }
}

export const MAX_UPGRADE_LEVEL = 15
export const MIN_UPGRADE_FOR_ASCENSION = 5

// ── Durabilidade máxima por nível de upgrade ──────────────────
export function itemMaxDurability(upgradeLevel: number): number {
  return 100 + upgradeLevel * 10
}

// ── Custo de reparo ───────────────────────────────────────────
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
