import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useGameDataStore } from '../store/gameDataStore'
import { computeAtk, computeSpeed, computeDef, computeCrit, computeMaxHp } from '../utils/stats'
import { itemStatMultiplier } from '../utils/forge'

export function useEffectiveStats() {
  const { hp, attributes } = usePlayerStore()
  const equipped = useInventoryStore(s => s.equipped)
  const itemDefs = useGameDataStore(s => s.items)

  const weaponDef = equipped.weapon ? itemDefs[equipped.weapon.definitionId] : null
  const armorDef  = equipped.armor  ? itemDefs[equipped.armor.definitionId]  : null

  const wMult = itemStatMultiplier(equipped.weapon?.upgradeLevel ?? 0, equipped.weapon?.ascensionTier ?? 0)
  const aMult = itemStatMultiplier(equipped.armor?.upgradeLevel  ?? 0, equipped.armor?.ascensionTier  ?? 0)

  const bonusAtk   = Math.round((weaponDef?.stats?.atk  ?? 0) * wMult)
  const bonusCrit  = Math.round((weaponDef?.stats?.crit ?? 0) * wMult * 10) / 10
  const bonusDef   = Math.round((armorDef?.stats?.def   ?? 0) * aMult)
  const bonusHp    = Math.round((armorDef?.stats?.hp    ?? 0) * aMult)
  // Speed: lower = faster, so divide by multiplier
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
