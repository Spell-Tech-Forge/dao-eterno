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
  upgrade: Record<string, UpgradeLevelConfig[]>
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

// Retorna os rows de upgrade para um tier específico, de forma segura
function getTierRows(config: ForgeConfig | undefined, itemTier: number): UpgradeLevelConfig[] | null {
  if (!config?.upgrade || Array.isArray(config.upgrade)) return null
  const rows = config.upgrade[String(itemTier)]
  return Array.isArray(rows) ? rows : null
}

// ── Chance de falha no aprimoramento ─────────────────────────
export function upgradeFailChance(targetLevel: number, itemTier = 1, config?: ForgeConfig): number {
  const rows = getTierRows(config, itemTier)
  if (rows) {
    const entry = rows.find(u => u.level === targetLevel)
    if (entry !== undefined) return entry.failChance
  }
  if (targetLevel <= 5) return 0
  return Math.min(50, (targetLevel - 5) * 5)
}

// ── Custo de aprimoramento (de N-1 para N) ───────────────────
export function enhancementCost(targetLevel: number, itemTier = 1, config?: ForgeConfig): IngredientCost[] {
  const rows = getTierRows(config, itemTier)
  if (rows) {
    const entry = rows.find(u => u.level === targetLevel)
    if (entry !== undefined) return entry.materials
  }
  return []
}

// ── Custo de ascensão (tier atual → tier+1) ───────────────────
export function ascensionCost(
  currentTier: number,
  config?: ForgeConfig,
): { materials: IngredientCost[]; sacrificeCount: number } {
  if (config?.ascension && Array.isArray(config.ascension)) {
    const entry = config.ascension.find(a => a.tier === currentTier)
    if (entry) return { materials: entry.materials, sacrificeCount: entry.sacrificeCount }
  }
  return { materials: [], sacrificeCount: currentTier + 1 }
}

export const MAX_UPGRADE_LEVEL = 15
export const MIN_UPGRADE_FOR_ASCENSION = 5

// ── Durabilidade máxima por nível de upgrade ──────────────────
export function itemMaxDurability(upgradeLevel: number): number {
  return 100 + upgradeLevel * 10
}

// ── Custo de reparo ───────────────────────────────────────────
// Se a receita do item for fornecida, o custo é 50% dos ingredientes
// proporcional à durabilidade faltante. Fallback para itens genéricos.
export function repairCost(
  currentDur: number,
  upgradeLevel: number,
  recipeIngredients?: IngredientCost[],
): IngredientCost[] {
  const maxDur = itemMaxDurability(upgradeLevel)
  if (currentDur >= maxDur) return []
  const pct = (maxDur - currentDur) / maxDur  // 0–1

  if (recipeIngredients && recipeIngredients.length > 0) {
    return recipeIngredients.map(c => ({
      itemId: c.itemId,
      quantity: Math.max(1, Math.ceil(pct * c.quantity * 0.5)),
    }))
  }

  // Fallback quando não há receita cadastrada
  const tier = Math.floor(upgradeLevel / 5)
  const costs: IngredientCost[] = [
    { itemId: 'spiritual_essence', quantity: Math.max(1, Math.ceil(pct * 10 * (tier + 1))) },
  ]
  if (tier >= 1) costs.push({ itemId: 'qi_thread',        quantity: Math.max(1, Math.ceil(pct * 3)) })
  if (tier >= 2) costs.push({ itemId: 'bronze_spiritual', quantity: Math.max(1, Math.ceil(pct * 2)) })
  if (tier >= 3) costs.push({ itemId: 'jade_raw',         quantity: Math.max(1, Math.ceil(pct * 1)) })
  return costs
}
