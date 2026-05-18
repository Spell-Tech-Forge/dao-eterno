import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useGameDataStore } from '../store/gameDataStore'
import { computeAtk, computeSpeed, computeDef, computeCrit, computeMaxHp } from '../utils/stats'
import { itemStatMultiplier } from '../utils/forge'
import type { ItemDefinition, InventoryItem } from '../types'

function slotBonus(
  def: ItemDefinition | null,
  item: InventoryItem | null,
  stat: 'atk' | 'def' | 'hp' | 'crit',
): number {
  if (!def || !item) return 0
  const mult = itemStatMultiplier(item.upgradeLevel ?? 0, item.ascensionTier ?? 0)
  return (def.stats?.[stat] ?? 0) * mult
}

export function useEffectiveStats() {
  const { hp, attributes } = usePlayerStore()
  const equipped  = useInventoryStore(s => s.equipped)
  const itemDefs  = useGameDataStore(s => s.items)

  const weaponDef    = equipped.weapon    ? itemDefs[equipped.weapon.definitionId]    : null
  const armorDef     = equipped.armor     ? itemDefs[equipped.armor.definitionId]     : null
  const accessoryDef = equipped.accessory ? itemDefs[equipped.accessory.definitionId] : null

  const wMult = itemStatMultiplier(equipped.weapon?.upgradeLevel    ?? 0, equipped.weapon?.ascensionTier    ?? 0)

  // Cada stat soma contribuições de todos os slots equipados
  const bonusAtk  = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'atk') +
    slotBonus(armorDef,     equipped.armor,     'atk') +
    slotBonus(accessoryDef, equipped.accessory, 'atk')
  )
  const bonusDef  = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'def') +
    slotBonus(armorDef,     equipped.armor,     'def') +
    slotBonus(accessoryDef, equipped.accessory, 'def')
  )
  const bonusHp   = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'hp') +
    slotBonus(armorDef,     equipped.armor,     'hp') +
    slotBonus(accessoryDef, equipped.accessory, 'hp')
  )
  const bonusCrit = Math.round((
    slotBonus(weaponDef,    equipped.weapon,    'crit') +
    slotBonus(armorDef,     equipped.armor,     'crit') +
    slotBonus(accessoryDef, equipped.accessory, 'crit')
  ) * 10) / 10

  // Speed é da arma (s/atk — menor = mais rápido), multiplier melhora com upgrade
  const bonusSpeed = weaponDef?.stats?.speed != null
    ? Math.round((weaponDef.stats.speed / wMult) * 100) / 100
    : null

  const { strength, agility, defense, perception, vitality } = attributes

  const effectiveAtk   = computeAtk(strength)   + bonusAtk
  const effectiveSpeed = bonusSpeed ?? computeSpeed(agility)
  const effectiveCrit  = computeCrit(perception) + bonusCrit
  const effectiveDef   = computeDef(defense)     + bonusDef
  const effectiveMaxHp = computeMaxHp(vitality)  + bonusHp
  const effectiveDps   = Math.round((effectiveAtk / effectiveSpeed) * (1 + effectiveCrit / 100))

  return {
    hp,
    effectiveMaxHp,
    effectiveAtk,
    effectiveSpeed,
    effectiveCrit,
    effectiveDef,
    effectiveDps,
    bonusAtk,
    bonusSpeed,
    bonusCrit,
    bonusDef,
    bonusHp,
  }
}
