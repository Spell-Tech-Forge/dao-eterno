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
  affinity: string
  spirit_gold: number
  created_at: string
  last_played_at: string
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
}

export interface RankingCharacter extends ServerCharacter {
  username: string
}

export interface RankingLegend extends ServerLegend {
  username: string
}

// Maps server realm display names ↔ game Realm keys
export const SERVER_TO_GAME_REALM: Record<string, string> = {
  'Refinamento de Qi':       'qi_refining',
  'Fundação Espiritual':     'foundation',
  'Núcleo Dourado':          'golden_core',
  'Alma Nascente':           'nascent_soul',
  'Transformação Espiritual':'spirit_transformation',
  'Unificação':              'unification',
  'Ascensão':                'ascension',
  'Imortal':                 'immortal',
}

export const SERVER_TO_GAME_STAGE: Record<string, string> = {
  'Inicial':  'initial',
  'Médio':    'middle',
  'Avançado': 'advanced',
  'Pico':     'peak',
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
