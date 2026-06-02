import type { MonsterDefinition, ActiveEnemy } from '../types'

// ── Spawn ─────────────────────────────────────────────────────────
export function spawnEnemy(def: MonsterDefinition): ActiveEnemy {
  const level = def.levelMin + Math.floor(Math.random() * (def.levelMax - def.levelMin + 1))
  return { definitionId: def.id, rarity: 'common', level, maxHp: def.baseHp, currentHp: def.baseHp, atkBonus: 0 }
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
  return Math.round(def.baseAtk * (1 + enemy.atkBonus))
}

export function enemyDef(def: MonsterDefinition, _enemy: ActiveEnemy): number {
  return def.baseDef
}

// ── Drops ─────────────────────────────────────────────────────────
export function rollDrops(def: MonsterDefinition, luck = 0): { itemId: string; quantity: number }[] {
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

export function qiRewardScaled(base: number): number {
  return base
}
export function goldRewardScaled(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}
