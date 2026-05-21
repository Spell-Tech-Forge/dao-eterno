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
// Raridade removida do scaling — stats vêm direto do JSON sem multiplicador
export function spawnEnemy(def: MonsterDefinition, _forcedRarity?: Rarity): ActiveEnemy {
  const level  = def.levelMin + Math.floor(Math.random() * (def.levelMax - def.levelMin + 1))
  const baseScale = 1 + (level - 1) * 0.12
  const maxHp  = Math.round(def.baseHp * baseScale)
  return { definitionId: def.id, rarity: 'common', level, maxHp, currentHp: maxHp, atkBonus: 0 }
}

// ── Combate ───────────────────────────────────────────────────────
// critChance: % de chance (ex: 5 = 5%)
// critDmgPct: % de bônus de dano (ex: 150 = +150% = 2,5× dano base)
export function calcDps(atk: number, speed: number, critChance: number, critDmgPct: number): number {
  return Math.round((atk / speed) * (1 + critChance / 100 * critDmgPct / 100))
}

export function rollDamage(
  atk: number,
  critChance: number,
  critDmgPct: number,
): { damage: number; isCrit: boolean } {
  const isCrit = Math.random() * 100 < critChance
  const base   = Math.max(1, atk + Math.floor(Math.random() * (atk * 0.2 + 1)) - Math.floor(atk * 0.1))
  return { damage: isCrit ? Math.round(base * (1 + critDmgPct / 100)) : base, isCrit }
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
export function rollDrops(def: MonsterDefinition, _rarity: Rarity, luck = 0): { itemId: string; quantity: number }[] {
  // Raridade removida — drops vêm direto das tabelas configuradas no JSON
  const bonusRolls    = Math.floor(luck / 50)
  const partialChance = (luck % 50) / 50
  const luckChance    = Math.min(0.5, luck * 0.004)
  const luckQtyMult   = 1 + luck * 0.01

  const rollOnce = (): { itemId: string; quantity: number }[] =>
    def.dropTable.reduce<{ itemId: string; quantity: number }[]>((acc, entry) => {
      const chance = Math.min(1, entry.chance + luckChance)
      if (Math.random() < chance) {
        const base = entry.quantityMin + Math.floor(Math.random() * (entry.quantityMax - entry.quantityMin + 1))
        acc.push({ itemId: entry.itemId, quantity: Math.max(1, Math.round(base * luckQtyMult)) })
      }
      return acc
    }, [])

  const merge = (drops: { itemId: string; quantity: number }[], extra: { itemId: string; quantity: number }[]) => {
    for (const drop of extra) {
      const existing = drops.find(d => d.itemId === drop.itemId)
      if (existing) existing.quantity += drop.quantity
      else drops.push({ ...drop })
    }
    return drops
  }

  let result = rollOnce()
  for (let i = 0; i < bonusRolls; i++) result = merge(result, rollOnce())
  if (Math.random() < partialChance) result = merge(result, rollOnce())
  return result
}

export function qiRewardScaled(base: number, _rarity: Rarity): number {
  return base
}
export function goldRewardScaled(min: number, max: number, _rarity: Rarity): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}
