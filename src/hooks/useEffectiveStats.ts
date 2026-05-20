import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useGameDataStore } from '../store/gameDataStore'
import { computeAtk, computeSpeed, computeDef, computeCrit, computeCritChance, computeMaxHp, DEFAULT_STAT_CONFIG } from '../utils/stats'
import { itemStatMultiplier, itemMaxDurability } from '../utils/forge'
import type { ItemDefinition, InventoryItem } from '../types'

function durabilityFraction(item: InventoryItem | null): number {
  if (!item) return 0
  if (item.durability === undefined) return 1
  const maxDur = itemMaxDurability(item.upgradeLevel ?? 0)
  return maxDur > 0 ? Math.max(0, item.durability / maxDur) : 0
}

function slotBonus(
  def: ItemDefinition | null,
  item: InventoryItem | null,
  stat: 'atk' | 'def' | 'hp' | 'crit',
  forgeConfig?: Pick<import('../utils/forge').ForgeConfig, 'upgradeBonus' | 'ascensionBonus'>,
): number {
  if (!def || !item) return 0
  const durFrac = durabilityFraction(item)
  if (durFrac <= 0) return 0
  const mult = itemStatMultiplier(item.upgradeLevel ?? 0, item.ascensionTier ?? 0, forgeConfig)
  return (def.stats?.[stat] ?? 0) * mult * durFrac
}

export function useEffectiveStats() {
  const { hp, luck, attributes, activeBuffs } = usePlayerStore()
  const equipped  = useInventoryStore(s => s.equipped)
  const itemDefs  = useGameDataStore(s => s.items)
  const cfg       = useGameDataStore(s => s.statConfig) ?? DEFAULT_STAT_CONFIG

  const now      = Date.now()
  const validBuf = activeBuffs.filter(b => b.endsAt > now)
  const buffAtk  = validBuf.reduce((acc, b) => acc + (b.atk   ?? 0), 0)
  const buffDef  = validBuf.reduce((acc, b) => acc + (b.def   ?? 0), 0)
  const buffHp   = validBuf.reduce((acc, b) => acc + (b.hp    ?? 0), 0)
  const buffCrit = validBuf.reduce((acc, b) => acc + (b.crit  ?? 0), 0)

  const forgeConfig  = useGameDataStore(s => s.forgeConfig) ?? undefined
  const weaponDef    = equipped.weapon    ? itemDefs[equipped.weapon.definitionId]    : null
  const armorDef     = equipped.armor     ? itemDefs[equipped.armor.definitionId]     : null
  const accessoryDef = equipped.accessory ? itemDefs[equipped.accessory.definitionId] : null

  const wMult = itemStatMultiplier(equipped.weapon?.upgradeLevel ?? 0, equipped.weapon?.ascensionTier ?? 0, forgeConfig)

  const bonusAtk  = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'atk',  forgeConfig) +
    slotBonus(armorDef,     equipped.armor,     'atk',  forgeConfig) +
    slotBonus(accessoryDef, equipped.accessory, 'atk',  forgeConfig)
  )
  const bonusDef  = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'def',  forgeConfig) +
    slotBonus(armorDef,     equipped.armor,     'def',  forgeConfig) +
    slotBonus(accessoryDef, equipped.accessory, 'def',  forgeConfig)
  )
  const bonusHp   = Math.round(
    slotBonus(weaponDef,    equipped.weapon,    'hp',   forgeConfig) +
    slotBonus(armorDef,     equipped.armor,     'hp',   forgeConfig) +
    slotBonus(accessoryDef, equipped.accessory, 'hp',   forgeConfig)
  )
  // crit de equipamento agora adiciona DANO crítico (%)
  const bonusCrit = Math.round((
    slotBonus(weaponDef,    equipped.weapon,    'crit', forgeConfig) +
    slotBonus(armorDef,     equipped.armor,     'crit', forgeConfig) +
    slotBonus(accessoryDef, equipped.accessory, 'crit', forgeConfig)
  ) * 10) / 10

  const { strength, agility, defense, perception, vitality } = attributes

  const baseAgilitySpeed = computeSpeed(agility, cfg)

  const bonusSpeed = (() => {
    const rawSpeed = weaponDef?.stats?.speed
    if (rawSpeed == null) return null
    const durFrac = durabilityFraction(equipped.weapon ?? null)
    if (durFrac <= 0) return null
    const score = rawSpeed * wMult * durFrac
    const reduction = score / (score + cfg.weaponSpeedDiv)
    return Math.max(cfg.minAttackSpeed, Math.round(baseAgilitySpeed * (1 - reduction) * 100) / 100)
  })()

  // effectiveCrit = bônus total de DANO crítico (%) — base + percepção + equip + buff
  const effectiveCrit      = computeCrit(perception, cfg) + bonusCrit + buffCrit
  // effectiveCritChance = CHANCE de crítico (%) — vem da sorte
  const effectiveCritChance = computeCritChance(luck, cfg)

  const effectiveAtk   = computeAtk(strength, cfg)   + bonusAtk  + buffAtk
  const effectiveSpeed = bonusSpeed ?? baseAgilitySpeed
  const effectiveDef   = computeDef(defense, cfg)     + bonusDef  + buffDef
  const effectiveMaxHp = computeMaxHp(vitality, cfg)  + bonusHp   + buffHp
  // DPS esperado: chance de crit × bônus de dano crítico
  const effectiveDps   = Math.round((effectiveAtk / effectiveSpeed) * (1 + effectiveCritChance / 100 * effectiveCrit / 100))

  return {
    hp,
    effectiveMaxHp,
    effectiveAtk,
    effectiveSpeed,
    effectiveCrit,       // bônus de DANO crítico (%)
    effectiveCritChance, // CHANCE de crítico (%)
    effectiveDef,
    effectiveDps,
    bonusAtk,
    bonusSpeed,
    bonusCrit,
    bonusDef,
    bonusHp,
    buffAtk,
    buffDef,
    buffHp,
    buffCrit,
  }
}
