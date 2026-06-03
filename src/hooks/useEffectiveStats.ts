import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useGameDataStore } from '../store/gameDataStore'
import { computeAtk, computeSpeed, computeDef, computeCrit, computeCritChance, computeMaxHp, DEFAULT_STAT_CONFIG } from '../utils/stats'
import { itemStatMultiplier, itemMaxDurability } from '../utils/forge'
import type { ItemDefinition, InventoryItem } from '../types'

function durabilityFraction(item: InventoryItem | null, fc?: Pick<import('../utils/forge').ForgeConfig, 'durabilityAscensionBonus'>): number {
  if (!item) return 0
  if (item.durability === undefined) return 1
  const maxDur = itemMaxDurability(item.upgradeLevel ?? 0, item.ascensionTier ?? 0, fc)
  return maxDur > 0 ? Math.max(0, item.durability / maxDur) : 0
}

function slotBonus(
  def: ItemDefinition | null,
  item: InventoryItem | null,
  stat: 'atk' | 'def' | 'hp' | 'crit',
  forgeConfig?: Pick<import('../utils/forge').ForgeConfig, 'upgradeBonus' | 'ascensionBonus' | 'durabilityAscensionBonus'>,
): number {
  if (!def || !item) return 0
  const durFrac = durabilityFraction(item, forgeConfig)
  if (durFrac <= 0) return 0
  const mult = itemStatMultiplier(item.upgradeLevel ?? 0, item.ascensionTier ?? 0, forgeConfig)
  return (def.stats?.[stat] ?? 0) * mult * durFrac
}

export function computeLawBonuses(
  laws: Record<string, string>,
  lawDefs: import('../types').LawDefinition[],
): { atkPct: number; defPct: number; hpPct: number; critFlat: number; speedPct: number; qiRatePct: number } {
  let atkPct = 0, defPct = 0, hpPct = 0, critFlat = 0, speedPct = 0, qiRatePct = 0
  for (const law of lawDefs) {
    const level = laws[law.id]
    if (!level || level === 'none') continue
    const bonus =
      level === 'fragment' ? law.bonusFragment :
      level === 'initial'  ? law.bonusInitial  :
      level === 'middle'   ? law.bonusMiddle    :
      level === 'advanced' ? law.bonusAdvanced  :
      level === 'complete' ? law.bonusComplete  : {}
    atkPct     += bonus.atk_pct     ?? 0
    defPct     += bonus.def_pct     ?? 0
    hpPct      += bonus.hp_pct      ?? 0
    critFlat   += bonus.crit_pct    ?? 0
    speedPct   += bonus.speed_pct   ?? 0
    qiRatePct  += bonus.qi_rate_pct ?? 0
  }
  return { atkPct, defPct, hpPct, critFlat, speedPct, qiRatePct }
}

export function computeTalentBonuses(unlockedTalents: string[], talentNodes: Record<string, import('../types').TalentNode>) {
  let atkPct = 0, defPct = 0, hpPct = 0, critFlat = 0, speedPct = 0, qiRatePct = 0, luckFlat = 0, dropRatePct = 0
  for (const nodeId of unlockedTalents) {
    const node = talentNodes[nodeId]
    if (!node) continue
    switch (node.effectType) {
      case 'atk_pct':       atkPct      += node.effectValue; break
      case 'def_pct':       defPct      += node.effectValue; break
      case 'hp_pct':        hpPct       += node.effectValue; break
      case 'crit_pct':      critFlat    += node.effectValue; break
      case 'speed_pct':     speedPct    += node.effectValue; break
      case 'qi_rate_pct':   qiRatePct   += node.effectValue; break
      case 'luck_flat':     luckFlat    += node.effectValue; break
      case 'drop_rate_pct': dropRatePct += node.effectValue; break
    }
  }
  return { atkPct, defPct, hpPct, critFlat, speedPct, qiRatePct, luckFlat, dropRatePct }
}

export function useEffectiveStats() {
  const { hp, luck, attributes, activeBuffs, unlockedTalents, laws } = usePlayerStore()
  const equipped    = useInventoryStore(s => s.equipped)
  const itemDefs    = useGameDataStore(s => s.items)
  const cfg         = useGameDataStore(s => s.statConfig) ?? DEFAULT_STAT_CONFIG
  const talentNodes = useGameDataStore(s => s.talentNodes)
  const lawDefs     = useGameDataStore(s => s.laws)
  const talentBonus = computeTalentBonuses(unlockedTalents, talentNodes)
  const lawBonus    = computeLawBonuses(laws, lawDefs)

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
    const durFrac = durabilityFraction(equipped.weapon ?? null, forgeConfig)
    if (durFrac <= 0) return null
    const score = rawSpeed * wMult * durFrac
    const reduction = score / (score + cfg.weaponSpeedDiv)
    return Math.max(cfg.minAttackSpeed, Math.round(baseAgilitySpeed * (1 - reduction) * 100) / 100)
  })()

  // effectiveCrit = bônus total de DANO crítico (%) — base + percepção + equip + buff + talento
  const effectiveCrit      = computeCrit(perception, cfg) + bonusCrit + buffCrit + talentBonus.critFlat + lawBonus.critFlat
  // effectiveCritChance = CHANCE de crítico (%) — vem da sorte
  const effectiveCritChance = computeCritChance(luck + talentBonus.luckFlat, cfg)

  const baseAtk    = computeAtk(strength, cfg) + bonusAtk + buffAtk
  const baseDef    = computeDef(defense, cfg)  + bonusDef + buffDef
  const baseMaxHp  = computeMaxHp(vitality, cfg) + bonusHp + buffHp
  const baseSpeed  = bonusSpeed ?? baseAgilitySpeed

  const totalAtkPct   = talentBonus.atkPct   + lawBonus.atkPct
  const totalDefPct   = talentBonus.defPct   + lawBonus.defPct
  const totalHpPct    = talentBonus.hpPct    + lawBonus.hpPct
  const totalSpeedPct = talentBonus.speedPct + lawBonus.speedPct

  const effectiveAtk   = Math.round(baseAtk   * (1 + totalAtkPct   / 100))
  const effectiveDef   = Math.round(baseDef   * (1 + totalDefPct   / 100))
  const effectiveMaxHp = Math.round(baseMaxHp * (1 + totalHpPct    / 100))
  const effectiveSpeed = totalSpeedPct > 0
    ? Math.max(cfg.minAttackSpeed, Math.round(baseSpeed * (1 - totalSpeedPct / 100) * 100) / 100)
    : baseSpeed
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
