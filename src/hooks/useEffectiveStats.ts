import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useGameDataStore } from '../store/gameDataStore'
import { computeAtk, computeSpeed, computeDef, computeCrit, computeMaxHp, DEFAULT_STAT_CONFIG } from '../utils/stats'
import { itemStatMultiplier, itemMaxDurability } from '../utils/forge'
import type { ItemDefinition, InventoryItem } from '../types'

// Retorna a fração de durabilidade (0–1). Itens sem durabilidade = sempre 1 (não degradam).
function durabilityFraction(item: InventoryItem | null): number {
  if (!item) return 0
  if (item.durability === undefined) return 1
  const maxDur = itemMaxDurability(item.upgradeLevel ?? 0)
  return maxDur > 0 ? Math.max(0, item.durability / maxDur) : 0
}

// Bônus de stat escala linearmente com a durabilidade.
// Durabilidade 100% → stat cheio. 50% → metade do stat. 0% → 0.
function slotBonus(
  def: ItemDefinition | null,
  item: InventoryItem | null,
  stat: 'atk' | 'def' | 'hp' | 'crit',
): number {
  if (!def || !item) return 0
  const durFrac = durabilityFraction(item)
  if (durFrac <= 0) return 0
  const mult = itemStatMultiplier(item.upgradeLevel ?? 0, item.ascensionTier ?? 0)
  return (def.stats?.[stat] ?? 0) * mult * durFrac
}

export function useEffectiveStats() {
  const { hp, attributes } = usePlayerStore()
  const equipped  = useInventoryStore(s => s.equipped)
  const itemDefs  = useGameDataStore(s => s.items)
  const cfg       = useGameDataStore(s => s.statConfig) ?? DEFAULT_STAT_CONFIG

  const weaponDef    = equipped.weapon    ? itemDefs[equipped.weapon.definitionId]    : null
  const armorDef     = equipped.armor     ? itemDefs[equipped.armor.definitionId]     : null
  const accessoryDef = equipped.accessory ? itemDefs[equipped.accessory.definitionId] : null

  const wMult = itemStatMultiplier(equipped.weapon?.upgradeLevel    ?? 0, equipped.weapon?.ascensionTier    ?? 0)

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

  const { strength, agility, defense, perception, vitality } = attributes

  const baseAgilitySpeed = computeSpeed(agility, cfg)

  // Speed da arma: escala com durabilidade — arma desgastada ataca mais devagar
  const bonusSpeed = (() => {
    const rawSpeed = weaponDef?.stats?.speed
    if (rawSpeed == null) return null
    const durFrac = durabilityFraction(equipped.weapon ?? null)
    if (durFrac <= 0) return null
    const score = rawSpeed * wMult * durFrac
    const reduction = score / (score + cfg.weaponSpeedDiv)
    return Math.max(cfg.minAttackSpeed, Math.round(baseAgilitySpeed * (1 - reduction) * 100) / 100)
  })()

  const effectiveAtk   = computeAtk(strength, cfg)   + bonusAtk
  const effectiveSpeed = bonusSpeed ?? baseAgilitySpeed
  const effectiveCrit  = computeCrit(perception, cfg) + bonusCrit
  const effectiveDef   = computeDef(defense, cfg)     + bonusDef
  const effectiveMaxHp = computeMaxHp(vitality, cfg)  + bonusHp
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
