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
  sect_qi_bonus_pct: number
  sect_artifact_level: number
  dao_crystals: number
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
  subtype: string | null
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

export interface SpriteConfig {
  frameW:       number                         // largura de 1 frame (px natural)
  frameH:       number                         // altura de 1 frame (px natural)
  frameCount:   number                         // total de frames
  frameDuration:number                         // ms por frame (padrão)
  sheetW:       number                         // largura total do sheet (px natural)
  sheetH:       number                         // altura total do sheet (px natural)
  frames:       Array<{ x: number; y: number }> // posição de cada frame no sheet
  cols?:        number                         // compat com formato simples
}

/** Parseia JSON do LudoAI/Aseprite OU formato simplificado { frameW, frameH, cols, ... } */
export function parseSpriteAtlas(raw: string): SpriteConfig {
  const json = JSON.parse(raw) as Record<string, unknown>

  // Já normalizado (tem frames como array)
  if (Array.isArray(json.frames) && typeof json.sheetW === 'number') {
    return json as unknown as SpriteConfig
  }

  // Formato Aseprite/LudoAI (frames é objeto)
  if (json.frames && typeof json.frames === 'object' && !Array.isArray(json.frames) && json.meta) {
    const meta  = json.meta as { size: { w: number; h: number } }
    const fmap  = json.frames as Record<string, { frame: { x:number; y:number; w:number; h:number }; duration?: number }>
    const list  = Object.values(fmap)
    const first = list[0]
    return {
      frameW:        first.frame.w,
      frameH:        first.frame.h,
      frameCount:    list.length,
      frameDuration: first.duration ?? 52,
      sheetW:        meta.size.w,
      sheetH:        meta.size.h,
      frames:        list.map(f => ({ x: f.frame.x, y: f.frame.y })),
    }
  }

  // Formato simples { frameW, frameH, cols, frameCount, frameDuration }
  if (typeof json.frameW === 'number' && typeof json.cols === 'number') {
    const { frameW, frameH, cols, frameCount, frameDuration } = json as {
      frameW:number; frameH:number; cols:number; frameCount:number; frameDuration:number
    }
    const rows = Math.ceil(frameCount / cols)
    const frames: Array<{x:number;y:number}> = []
    for (let i = 0; i < frameCount; i++) {
      frames.push({ x: (i % cols) * frameW, y: Math.floor(i / cols) * frameH })
    }
    return { frameW, frameH, frameCount, frameDuration, sheetW: cols * frameW, sheetH: rows * frameH, frames, cols }
  }

  throw new Error('Formato não reconhecido. Use JSON do LudoAI/Aseprite ou { frameW, frameH, cols, frameCount, frameDuration }')
}

export interface GameMonster {
  id: string
  name: string
  emoji: string
  sprite_url: string | null
  sprite_config: SpriteConfig | null
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
