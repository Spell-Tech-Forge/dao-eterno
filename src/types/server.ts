export interface ServerCharacter {
  id: number
  user_id: number
  name: string
  realm: string
  realm_stage: string
  realm_level: number
  cultivation_power: number
  experience: number
  hp_current: number
  hp_max: number
  qi_current: number
  qi_max: number
  strength: number
  agility: number
  vitality: number
  defense: number
  perception: number
  luck: number
  attribute_points: number
  talent_points: number
  unlocked_talents: string[]
  class_id: string | null
  laws: Record<string, string>
  affinity: string
  gender: string
  spirit_gold: number
  inventory: unknown | null
  skills: unknown | null
  bestiary: unknown | null
  total_playtime_seconds: number
  created_at: string
  last_played_at: string
  unlocked_recipes: string[]
}

export interface ServerLegend {
  id: number
  user_id: number
  original_character_id: number | null
  name: string
  realm: string
  realm_stage: string
  realm_level: number
  cultivation_power: number
  cause_of_death: string
  born_at: string
  died_at: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
  is_admin: boolean
}

export interface GameItem {
  id: string
  name: string
  emoji: string
  sprite_url: string | null
  type: string
  rarity: string
  description: string
  stats: Record<string, number>
  stackable: boolean
  max_stack: number | null
  tier: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface GameMonster {
  id: string
  name: string
  emoji: string
  sprite_url: string | null
  level_min: number
  level_max: number
  rarity: string
  biome_id: string
  is_boss: boolean
  is_elite: boolean
  base_hp: number
  base_atk: number
  base_def: number
  speed: number
  qi_reward: number
  gold_reward_min: number
  gold_reward_max: number
  drop_table: { itemId: string; chance: number; quantityMin: number; quantityMax: number }[]
  required_realm: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface GameRecipe {
  id: string
  name: string
  category: string
  output_item_id: string
  output_quantity: number
  required_tier: number
  ingredients: { itemId: string; quantity: number }[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface EquippedSnapshot {
  weapon:    { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
  armor:     { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
  accessory: { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
  ring:      { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
}

export interface RankingCharacter extends ServerCharacter {
  username:         string
  total_kills:      number
  equipped_snapshot: EquippedSnapshot | null
  player_power?:    number
}

export interface RankingLegend extends ServerLegend {
  username:         string
  total_kills:      number
  equipped_snapshot: EquippedSnapshot | null
  class_id?:        string | null
  player_power?:    number
}

// Maps server realm values ↔ game Realm keys (novo sistema v0.32+)
export const SERVER_TO_GAME_REALM: Record<string, string> = {
  // Novo sistema canônico (pass-through)
  'body_tempering':'body_tempering','houtian':'houtian','xiantian':'xiantian',
  'revolving_core':'revolving_core','life_destruction':'life_destruction',
  'divine_sea':'divine_sea','divine_transformation':'divine_transformation',
  'divine_lord':'divine_lord','holy_lord':'holy_lord','world_king':'world_king',
  'empyrean':'empyrean','true_divinity':'true_divinity','beyond_divinity':'beyond_divinity',
  // Legado antigo (compatibilidade)
  'Refinamento de Qi':'body_tempering','qi_refining':'body_tempering',
  'Fundação Espiritual':'houtian','foundation':'houtian',
  'Núcleo Dourado':'xiantian','golden_core':'xiantian',
  'Alma Nascente':'revolving_core','nascent_soul':'revolving_core',
  'Transformação Espiritual':'divine_sea','spirit_transformation':'divine_sea',
  'Unificação':'divine_transformation','unification':'divine_transformation',
  'Ascensão':'divine_lord','ascension':'divine_lord',
  'Imortal':'holy_lord','immortal':'holy_lord',
}

export const SERVER_TO_GAME_STAGE: Record<string, string> = {
  // Padrão
  'initial':'initial','middle':'middle','advanced':'advanced','peak':'peak',
  // Body Tempering
  'strength':'strength','muscle':'muscle','bone':'bone','marrow':'marrow',
  'meridian':'meridian','eight_gates':'eight_gates','nine_stars':'nine_stars',
  // Life Destruction
  'destruction_1':'destruction_1','destruction_2':'destruction_2','destruction_3':'destruction_3',
  'destruction_4':'destruction_4','destruction_5':'destruction_5','destruction_6':'destruction_6',
  'destruction_7':'destruction_7','destruction_8':'destruction_8','destruction_9':'destruction_9',
  // Legado PT
  'Inicial':'initial','Médio':'middle','Avançado':'advanced','Pico':'peak',
}

export const SERVER_TO_GAME_AFFINITY: Record<string, string> = {
  'Fogo':    'fire',
  'Água':    'water',
  'Trovão':  'lightning',
  'Terra':   'earth',
  'Vento':   'wind',
}

export const GAME_TO_SERVER_REALM: Record<string, string> = Object.fromEntries(
  Object.entries(SERVER_TO_GAME_REALM).map(([k, v]) => [v, k])
)

export const GAME_TO_SERVER_STAGE: Record<string, string> = Object.fromEntries(
  Object.entries(SERVER_TO_GAME_STAGE).map(([k, v]) => [v, k])
)

export const GAME_TO_SERVER_AFFINITY: Record<string, string> = Object.fromEntries(
  Object.entries(SERVER_TO_GAME_AFFINITY).map(([k, v]) => [v, k])
)

export const AFFINITIES_FOR_CREATE = [
  { value: 'Fogo',   emoji: '🔥', color: '#ef5350' },
  { value: 'Água',   emoji: '💧', color: '#42a5f5' },
  { value: 'Trovão', emoji: '⚡', color: '#ffd54f' },
  { value: 'Terra',  emoji: '⛰️', color: '#a1887f' },
  { value: 'Vento',  emoji: '🌀', color: '#80cbc4' },
] as const
