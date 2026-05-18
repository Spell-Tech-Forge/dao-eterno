export type ItemType = 'weapon' | 'armor' | 'accessory' | 'material' | 'pill' | 'ring' | 'talisman'
export type Rarity = 'common' | 'uncommon' | 'spiritual' | 'rare' | 'ancient' | 'legendary'
export type Realm = 'qi_refining' | 'foundation' | 'golden_core' | 'nascent_soul' | 'spirit_transformation' | 'unification' | 'ascension' | 'immortal'
export type RealmStage = 'initial' | 'middle' | 'advanced' | 'peak'
export type Affinity = 'fire' | 'water' | 'lightning' | 'earth' | 'wind'
export type SkillCategory = 'body' | 'mind' | 'creation' | 'world'
export type Screen = 'hub' | 'combat' | 'inventory' | 'codex' | 'ranking' | 'crafting' | 'skills' | 'meditation' | 'forge' | 'market'

export interface ItemStats {
  atk?: number
  def?: number
  hp?: number
  qi?: number
  crit?: number
  speed?: number
  slots?: number
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
  baseHp: number
  baseAtk: number
  baseDef: number
  speed: number
  dropTable: DropEntry[]
  qiReward: number
  goldReward: { min: number; max: number }
}

export interface BiomeTheme {
  gradient: string
  accentColor: string
}

export interface BiomeDefinition {
  id: string
  name: string
  description: string
  requiredRealm: Realm
  requiredStage: RealmStage
  difficulty: number
  biomeType: 'fixed' | 'temporary'
  activeDays?: number[]
  activeStartTime?: string
  activeEndTime?: string
  activeUntil?: string
  enemyPool: string[]
  bossId: string
  minKillsBeforeBoss: number
  bossSpawnChance: number
  theme: BiomeTheme
  normalRarityWeights: Partial<Record<Rarity, number>>
  bossRarity: Rarity
  sortOrder: number
  backgroundUrl?: string
  backgroundPosition?: string
}

export interface BreakthroughEntry {
  id: string
  realm: Realm
  stage: RealmStage
  nextRealm: Realm
  nextStage: RealmStage
  newMaxQi: number
  items: { itemId: string; quantity: number }[]
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

export const REALM_NAMES: Record<Realm, string> = {
  qi_refining: 'Refinamento de Qi',
  foundation: 'Fundação Espiritual',
  golden_core: 'Núcleo Dourado',
  nascent_soul: 'Alma Nascente',
  spirit_transformation: 'Transformação Espiritual',
  unification: 'Unificação',
  ascension: 'Ascensão',
  immortal: 'Imortal',
}

export const STAGE_NAMES: Record<RealmStage, string> = {
  initial: 'Inicial',
  middle: 'Médio',
  advanced: 'Avançado',
  peak: 'Pico',
}

export const RARITY_PROGRESSION: Rarity[] = ['common', 'uncommon', 'spiritual', 'rare', 'ancient', 'legendary']

export const RARITY_LABELS: Record<Rarity, string> = {
  common:    'MORTAL',
  uncommon:  'ESPIRITUAL',
  spiritual: 'TERRESTRE',
  rare:      'CELESTIAL',
  ancient:   'SAGRADO',
  legendary: 'IMORTAL',
}

export interface TickMessage {
  type: 'tick'
  delta: number
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    '#94a3b8',
  uncommon:  '#4ade80',
  spiritual: '#60a5fa',
  rare:      '#a855f7',
  ancient:   '#f97316',
  legendary: '#ef4444',
}
