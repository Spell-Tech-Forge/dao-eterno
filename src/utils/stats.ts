export interface BreakthroughPathDeltas {
  strength:   number
  agility:    number
  vitality:   number
  defense:    number
  perception: number
}

export interface BreakthroughPathConfig {
  id:     string
  name:   string
  emoji:  string
  desc:   string
  color:  string
  deltas: BreakthroughPathDeltas
}

export interface StatConfig {
  // Fórmulas de atributos
  atkPerStr:      number
  baseSpeed:      number
  speedPerAgi:    number
  minAgiSpeed:    number
  hpPerVit:       number
  defPerDef:      number
  critPerPer:     number
  weaponSpeedDiv: number
  minAttackSpeed: number
  // Atributos iniciais do personagem
  initialStrength:   number
  initialAgility:    number
  initialVitality:   number
  initialDefense:    number
  initialPerception: number
  // Progressão
  attrPointsPerBreakthrough: number
  // Caminhos de rompimento
  breakthroughPaths: BreakthroughPathConfig[]
}

export const DEFAULT_BREAKTHROUGH_PATHS: BreakthroughPathConfig[] = [
  {
    id: 'offensive', name: 'Caminho Ofensivo', emoji: '⚔️',
    desc: 'Domínio sobre o ataque e velocidade', color: '#f97316',
    deltas: { strength: 5, agility: 5, vitality: 2, defense: 2, perception: 2 },
  },
  {
    id: 'defensive', name: 'Caminho da Resistência', emoji: '🛡️',
    desc: 'Corpo inabalável, resistência suprema', color: '#22c55e',
    deltas: { strength: 2, agility: 2, vitality: 5, defense: 5, perception: 2 },
  },
  {
    id: 'balanced', name: 'Caminho do Equilíbrio', emoji: '☯️',
    desc: 'Harmonia entre todos os aspectos do Dao', color: '#a855f7',
    deltas: { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 3 },
  },
]

export const DEFAULT_STAT_CONFIG: StatConfig = {
  atkPerStr:      4,
  baseSpeed:      2.0,
  speedPerAgi:    0.03,
  minAgiSpeed:    0.5,
  hpPerVit:       20,
  defPerDef:      3,
  critPerPer:     0.5,
  weaponSpeedDiv: 200,
  minAttackSpeed: 0.25,
  initialStrength:   5,
  initialAgility:    5,
  initialVitality:   5,
  initialDefense:    3,
  initialPerception: 3,
  attrPointsPerBreakthrough: 3,
  breakthroughPaths: DEFAULT_BREAKTHROUGH_PATHS,
}

export function computeAtk(strength: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  return strength * cfg.atkPerStr
}

export function computeSpeed(agility: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  return Math.max(cfg.minAgiSpeed, cfg.baseSpeed - agility * cfg.speedPerAgi)
}

export function computeMaxHp(vitality: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  return vitality * cfg.hpPerVit
}

export function computeDef(defense: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  return defense * cfg.defPerDef
}

export function computeCrit(perception: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  return perception * cfg.critPerPer
}

export function computeDps(strength: number, agility: number, perception: number, cfg: StatConfig = DEFAULT_STAT_CONFIG): number {
  const atk   = computeAtk(strength, cfg)
  const speed = computeSpeed(agility, cfg)
  const crit  = computeCrit(perception, cfg)
  return Math.round((atk / speed) * (1 + crit / 100))
}
