import type { MonsterDefinition, ActiveEnemy, Rarity } from '../types'

// ── Escalas por raridade ──────────────────────────────────────────
const HP_SCALE: Record<Rarity, number>   = { common: 1.0, uncommon: 1.25, spiritual: 1.5, rare: 2.1, ancient: 3.2, legendary: 5.0 }
const ATK_SCALE: Record<Rarity, number>  = { common: 1.0, uncommon: 1.17, spiritual: 1.35, rare: 1.8, ancient: 2.6, legendary: 4.0 }
const QI_SCALE: Record<Rarity, number>   = { common: 1.0, uncommon: 1.30, spiritual: 1.6, rare: 2.8, ancient: 5.0, legendary: 9.0 }
const GOLD_SCALE: Record<Rarity, number> = { common: 1.0, uncommon: 1.25, spiritual: 1.5, rare: 2.5, ancient: 4.5, legendary: 8.0 }

// ── Sortear raridade a partir de pesos do bioma ───────────────────
export function rollRarity(weights: Partial<Record<Rarity, number>>): Rarity {
  const entries = (Object.entries(weights) as [Rarity, number][]).filter(([, w]) => w > 0)
  const total   = entries.reduce((s, [, w]) => s + w, 0)
  if (total === 0) return 'common'
  let roll = Math.random() * total
  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return entries[0][0]
}

// ── Spawn ─────────────────────────────────────────────────────────
export function spawnEnemy(def: MonsterDefinition, forcedRarity?: Rarity): ActiveEnemy {
  const rarity = forcedRarity ?? 'common'
  const level  = def.levelMin + Math.floor(Math.random() * (def.levelMax - def.levelMin + 1))
  const baseScale = 1 + (level - 1) * 0.12
  const maxHp  = Math.round(def.baseHp  * baseScale * HP_SCALE[rarity])
  const atkBonus = (ATK_SCALE[rarity] - 1)
  return { definitionId: def.id, rarity, level, maxHp, currentHp: maxHp, atkBonus }
}

// ── Combate ───────────────────────────────────────────────────────
export function calcDps(atk: number, speed: number, crit: number): number {
  return Math.round((atk / speed) * (1 + crit / 100))
}

export function rollDamage(atk: number, crit: number): { damage: number; isCrit: boolean } {
  const isCrit = Math.random() * 100 < crit
  const base = Math.max(1, atk + Math.floor(Math.random() * (atk * 0.2 + 1)) - Math.floor(atk * 0.1))
  return { damage: isCrit ? base * 2 : base, isCrit }
}

export function enemyAtk(def: MonsterDefinition, enemy: ActiveEnemy): number {
  const baseScale = 1 + (enemy.level - 1) * 0.1
  return Math.round(def.baseAtk * baseScale * (1 + enemy.atkBonus))
}

export function enemyDef(def: MonsterDefinition, enemy: ActiveEnemy): number {
  const baseScale = 1 + (enemy.level - 1) * 0.08
  return Math.round(def.baseDef * baseScale)
}

// ── Drops ─────────────────────────────────────────────────────────
export function rollDrops(def: MonsterDefinition, rarity: Rarity, luck = 0): { itemId: string; quantity: number }[] {
  const qScale        = QI_SCALE[rarity]
  const luckChance    = luck * 0.003          // +0.3% chance por ponto de sorte
  const luckQtyMult   = 1 + luck * 0.015      // +1.5% quantidade por ponto de sorte
  return def.dropTable.reduce<{ itemId: string; quantity: number }[]>((acc, entry) => {
    const rarityMult = rarity === 'common' ? 1 : 1.2
    const chance = Math.min(1, entry.chance * rarityMult + luckChance)
    if (Math.random() < chance) {
      const base = entry.quantityMin + Math.floor(Math.random() * (entry.quantityMax - entry.quantityMin + 1))
      const rarityQty = rarity === 'common' ? 1 : Math.sqrt(qScale)
      const qty = Math.max(1, Math.round(base * rarityQty * luckQtyMult))
      acc.push({ itemId: entry.itemId, quantity: qty })
    }
    return acc
  }, [])
}

export function qiRewardScaled(base: number, rarity: Rarity): number {
  return Math.round(base * QI_SCALE[rarity])
}
export function goldRewardScaled(min: number, max: number, rarity: Rarity): number {
  const base = min + Math.floor(Math.random() * (max - min + 1))
  return Math.round(base * GOLD_SCALE[rarity])
}
