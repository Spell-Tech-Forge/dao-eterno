export interface DbUser {
  id: number
  username: string
  email: string
  password_hash: string
  is_admin: boolean
  pending_gold: string
  created_at: string
}

export interface DbCharacter {
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
  gender: string
  luck: number
  spirit_gold: number
  created_at: string
  last_played_at: string
}

export interface DbLegend {
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

declare global {
  namespace Express {
    interface Request {
      userId?: number
      username?: string
    }
  }
}
