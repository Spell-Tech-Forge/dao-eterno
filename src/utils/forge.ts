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
  failChance: number   // 0–100; default 0 (sempre sucesso)
}

export interface ForgeConfig {
  upgrade: Record<string, UpgradeLevelConfig[]>
  ascension: AscensionTierConfig[]
  upgradeBonus?: number    // bônus de stat por nível de upgrade  (default 0.05 = 5%)
  ascensionBonus?: number  // bônus de stat por tier de ascensão  (default 0.15 = 15%)
}

export interface CraftXpConfig {
  forja: number[]
  alquimia: number[]
  inscricao: number[]
  tierLevels?: number[]  // nível mínimo de skill para desbloquear cada tier [T1..T10]
}

export const DEFAULT_TIER_LEVELS = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91]

// ── Custos de ouro ────────────────────────────────────────────
// Craft: 15 × 2.1^(tier-1) → T1=15, T5=150, T10=6k
export function craftGoldCost(itemTier: number): number {
  return Math.round(15 * Math.pow(2.1, Math.max(1, itemTier) - 1))
}

// Enhancement: 25 × 1.5^(level-1) × (1 + (tier-1)×0.3) → +1T1=25, +10T5=5k
export function enhancementGoldCost(targetLevel: number, itemTier: number): number {
  const base = Math.round(25 * Math.pow(1.5, Math.max(1, targetLevel) - 1))
  return Math.round(base * (1 + (Math.max(1, itemTier) - 1) * 0.3))
}

// Ascensão: 300 × 2.5^tier × (1 + (itemTier-1)×0.25) → T0→1 T1=300, T4→5 T10=90k
export function ascensionGoldCost(currentTier: number, itemTier: number): number {
  return Math.round(300 * Math.pow(2.5, currentTier) * (1 + (Math.max(1, itemTier) - 1) * 0.25))
}

// ── Raridade efetiva (base + ascensão) ────────────────────────
export function effectiveRarity(baseRarity: Rarity, ascensionTier: number): Rarity {
  const idx = RARITY_PROGRESSION.indexOf(baseRarity)
  if (idx === -1) return baseRarity
  return RARITY_PROGRESSION[Math.min(idx + ascensionTier, RARITY_PROGRESSION.length - 1)]
}

// ── Multiplicador de stat ─────────────────────────────────────
export const DEFAULT_UPGRADE_BONUS   = 0.05  // 5% por nível de upgrade
export const DEFAULT_ASCENSION_BONUS = 0.15  // 15% por tier de ascensão

export function itemStatMultiplier(
  upgradeLevel: number,
  ascensionTier: number,
  config?: Pick<ForgeConfig, 'upgradeBonus' | 'ascensionBonus'>,
): number {
  const upgBonus = config?.upgradeBonus   ?? DEFAULT_UPGRADE_BONUS
  const ascBonus = config?.ascensionBonus ?? DEFAULT_ASCENSION_BONUS
  return (1 + upgradeLevel * upgBonus) * (1 + ascensionTier * ascBonus)
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
): { materials: IngredientCost[]; sacrificeCount: number; failChance: number } {
  if (config?.ascension && Array.isArray(config.ascension)) {
    const entry = config.ascension.find(a => a.tier === currentTier)
    if (entry) return {
      materials:     entry.materials,
      sacrificeCount: entry.sacrificeCount,
      failChance:    entry.failChance ?? 0,
    }
  }
  return { materials: [], sacrificeCount: currentTier + 1, failChance: 0 }
}

export const MAX_UPGRADE_LEVEL = 15
export const MIN_UPGRADE_FOR_ASCENSION = 5

// Número máximo de ascensões por tier do item.
// Tier 1 → teto Espiritual (1×), Tier 2-3 → Terrestre (2×),
// Tier 4-5 → Celestial (3×), Tier 6-7 → Sagrado (4×), Tier 8-10 → Imortal (5×).
export const MAX_ASCENSION_BY_ITEM_TIER: Record<number, number> = {
  1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 5,
}

export function maxAscensionForTier(itemTier: number): number {
  return MAX_ASCENSION_BY_ITEM_TIER[itemTier] ?? 5
}

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
