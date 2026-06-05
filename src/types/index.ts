import _realmNames from '../data/realmNames.json'
import _stageNames from '../data/stageNames.json'

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'material' | 'pill' | 'ring' | 'talisman' | 'receita'
export type LawLevel = 'none' | 'fragment' | 'initial' | 'middle' | 'advanced' | 'complete'

export interface LawBonus {
  [key: string]: number | undefined
  atk_pct?: number
  def_pct?: number
  hp_pct?: number
  crit_pct?: number
  speed_pct?: number
  qi_rate_pct?: number
}

export interface LawDefinition {
  id: string
  name: string
  description: string
  emoji: string
  affinity: string | null
  bonusFragment: LawBonus
  bonusInitial:  LawBonus
  bonusMiddle:   LawBonus
  bonusAdvanced: LawBonus
  bonusComplete: LawBonus
  minRealmInitial:  string
  minRealmMiddle:   string
  minRealmAdvanced: string
  minRealmComplete: string
  fragmentsToInitial:  number
  fragmentsToMiddle:   number
  fragmentsToAdvanced: number
  fragmentsToComplete: number
  fragmentItemId: string | null
  sortOrder: number
}

export type TalentEffectType =
  | 'atk_pct' | 'def_pct' | 'hp_pct' | 'crit_pct'
  | 'speed_pct' | 'qi_rate_pct' | 'luck_flat' | 'drop_rate_pct'
export type Rarity = 'common' | 'uncommon' | 'spiritual' | 'rare' | 'ancient' | 'legendary' | 'divine' | 'supreme'
export type Realm =
  | 'body_tempering'
  | 'houtian'
  | 'xiantian'
  | 'revolving_core'
  | 'life_destruction'
  | 'divine_sea'
  | 'divine_transformation'
  | 'divine_lord'
  | 'holy_lord'
  | 'world_king'
  | 'empyrean'
  | 'true_divinity'
  | 'beyond_divinity'

export type RealmStage =
  // Estágios padrão (todos os reinos exceto body_tempering e life_destruction)
  | 'initial' | 'middle' | 'advanced' | 'peak'
  // Body Tempering (7 sub-estágios únicos)
  | 'strength' | 'muscle' | 'bone' | 'marrow' | 'meridian' | 'eight_gates' | 'nine_stars'
  // Life Destruction (9 destruições)
  | 'destruction_1' | 'destruction_2' | 'destruction_3'
  | 'destruction_4' | 'destruction_5' | 'destruction_6'
  | 'destruction_7' | 'destruction_8' | 'destruction_9'
export type Affinity = 'fire' | 'water' | 'lightning' | 'earth' | 'wind'
export type SkillCategory = 'body' | 'mind' | 'creation' | 'world'
export type Screen = 'hub' | 'combat' | 'inventory' | 'codex' | 'ranking' | 'crafting' | 'skills' | 'meditation' | 'forge' | 'market' | 'changelog' | 'talents' | 'laws' | 'worldmap' | 'training' | 'sect' | 'merchants' | 'auto_dismantle'

export interface ItemStats {
  atk?: number
  def?: number
  hp?: number
  qi?: number
  crit?: number
  speed?: number
  slots?: number
  meditationMinutes?: number
  buffDuration?: number   // minutos de duração do buff temporário
}

export interface ClassDefinition {
  id: string
  name: string
  emoji: string
  description: string
  allowedWeaponType: string
  allowedArmorType: string
  allowedAccessoryType: string
  color: string
  sortOrder: number
  spriteUrl?: string | null
}

export interface TalentNode {
  id: string
  classId: string
  name: string
  description: string
  effectType: TalentEffectType
  effectValue: number
  requiredRealm: string
  requiredStage: string
  pointCost: number
  maxLevel: number
  positionRow: number
  positionCol: number
  requiredNodeId?: string | null
}

export interface ItemDefinition {
  id: string
  name: string
  emoji: string
  type: ItemType
  rarity: Rarity
  description: string
  stats?: ItemStats
  stackable?: boolean
  maxStack?: number | null  // null = usa padrão da categoria; undefined = sem limite
  tier?: number   // 1–10, default 1
  subtype?: string  // weapon/armor subtype para lock de classe (faixas, espada, manto, etc.)
}

export interface InventoryItem {
  instanceId: string
  definitionId: string
  quantity: number
  durability?: number
  obtainedAt: number
  upgradeLevel?: number   // 0–15
  ascensionTier?: number  // 0–5 (0=base rarity, +1 per ascension)
}

export interface DropEntry {
  itemId: string
  chance: number
  quantityMin: number
  quantityMax: number
}

export interface MonsterDefinition {
  id: string
  name: string
  emoji: string
  levelMin: number
  levelMax: number
  rarity: 'common' | 'spiritual' | 'rare' | 'ancient'
  biomeId: string
  isBoss: boolean
  isElite?: boolean
  baseHp: number
  baseAtk: number
  baseDef: number
  speed: number
  dropTable: DropEntry[]
  qiReward: number
  goldReward: { min: number; max: number }
  requiredRealm?: string
}

export interface BiomeTheme {
  gradient: string
  accentColor: string
}

export interface BiomeDefinition {
  id: string
  name: string
  description: string
  requiredRealm: string
  requiredStage: string
  difficulty: number
  biomeType: 'fixed' | 'temporary'
  activeDays?: number[]
  activeStartTime?: string
  activeEndTime?: string
  activeUntil?: string
  enemyPool: string[]
  bossId: string
  eliteId?: string | null
  minKillsBeforeBoss: number
  minKillsBeforeElite: number
  bossSpawnChance: number
  theme: BiomeTheme
  normalRarityWeights: Partial<Record<Rarity, number>>
  bossRarity: Rarity
  sortOrder: number
  backgroundUrl?: string
  backgroundPosition?: string
  statModifiers?: {
    common: { hp: number; atk: number; def: number }
    elite:  { hp: number; atk: number; def: number }
    boss:   { hp: number; atk: number; def: number }
  }
  locationId?: string | null
  mapX?: number
  mapY?: number
  targetPower?: number
}

export interface LocationDefinition {
  id: string
  name: string
  description: string
  emoji: string
  type: 'village' | 'city'
  requiredRealm: string
  requiredStage: string
  requiredBossId: string | null
  mapX: number
  mapY: number
  connectedTo: string[]
  services: string[]
  sortOrder: number
  backgroundUrl?: string | null
  backgroundPosition?: string
}

export interface BreakthroughEntry {
  id: string
  realm: string
  stage: string
  nextRealm: string
  nextStage: string
  newMaxQi: number
  items: { itemId: string; quantity: number }[]
  requiredKills?: { biomeId: string; count: number }[]
}

export const BIOME_NAMES: Record<string, string> = {
  // Biomas atuais (v0.35)
  campos_treinamento:   'Campos de Treinamento',
  floresta_ervas:       'Floresta das Ervas',
  cavernas_rasas:       'Cavernas Rasas',
  ruinas_jade:          'Ruínas do Jade',
  pantano_sombrio:      'Pântano Sombrio',
  planicie_guerreiros:  'Planície dos Guerreiros',
  rio_espiritual:       'Rio Espiritual',
  montanha_pico_branco: 'Montanha do Pico Branco',
  templo_abandonado:    'Templo Abandonado',
  abismo_espiritos:     'Abismo dos Espíritos',
  labirinto_nucleo:     'Labirinto do Núcleo',
  mar_chamas:           'Mar de Chamas',
  // Fallback para IDs legados ainda no banco
  forest:           'Floresta Espiritual',
  swamp:            'Pântano das Brumas',
  plains:           'Planícies Ancestrais',
  ruins:            'Ruínas Místicas',
  golden_mountains: 'Montanhas Douradas',
  soul_abyss:       'Abismo das Almas',
  mystic_valley:    'Vale Místico',
  celestial_domain: 'Domínio Celestial',
  ascension_portal: 'Portal de Ascensão',
  eternal_dao:      'Dao Eterno',
}

export interface RecipeIngredient {
  itemId: string
  quantity: number
}

export interface RecipeDefinition {
  id: string
  name: string
  category: 'forja' | 'alquimia' | 'inscricao'
  outputItemId: string
  outputQuantity: number
  requiredTier: number        // 1–10
  ingredients: RecipeIngredient[]
}

export interface BestiaryEntry {
  monsterId: string
  kills: number
  firstKilledAt: number
  discoveredDrops: string[]
}

export interface CombatLogEntry {
  id: number
  type: 'player_attack' | 'enemy_attack' | 'player_kill' | 'enter' | 'drop' | 'flee' | 'death'
  text: string
  timestamp: number
}

export interface ActiveEnemy {
  definitionId: string
  rarity: Rarity
  level: number
  currentHp: number
  maxHp: number
  atkBonus: number
}

export const REALM_NAMES: { [k: string]: string } = _realmNames
export const STAGE_NAMES: { [k: string]: string } = _stageNames

export const RARITY_PROGRESSION: Rarity[] = [
  'common', 'uncommon', 'spiritual', 'rare', 'ancient', 'legendary', 'divine', 'supreme',
]

export const RARITY_LABELS: { [k: string]: string } = {
  common:    'MORTAL',
  uncommon:  'XUAN',
  spiritual: 'TERRA',
  rare:      'CÉU',
  ancient:   'SAGRADO',
  legendary: 'IMPERIAL',
  divine:    'DIVINO',
  supreme:   'SUPREMO',
}

export interface TickMessage {
  type: 'tick'
  delta: number
}

export const RARITY_COLORS: { [k: string]: string } = {
  common:    '#94a3b8',
  uncommon:  '#4ade80',
  spiritual: '#60a5fa',
  rare:      '#a855f7',
  ancient:   '#f97316',
  legendary: '#ef4444',
  divine:    '#e879f9',
  supreme:   '#fbbf24',
}
