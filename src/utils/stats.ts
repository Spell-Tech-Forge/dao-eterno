export interface StatConfig {
  // Fórmulas de atributos
  atkPerStr:      number   // ATK por ponto de Força
  baseSpeed:      number   // Velocidade base (s/atk)
  speedPerAgi:    number   // Redução de s/atk por ponto de Agilidade
  minAgiSpeed:    number   // Velocidade mínima pela Agilidade
  hpPerVit:       number   // HP máximo por ponto de Vitalidade
  defPerDef:      number   // DEF por ponto de Defesa
  critPerPer:     number   // Crítico (%) por ponto de Percepção
  weaponSpeedDiv: number   // Divisor da fórmula hiperbólica de velocidade
  minAttackSpeed: number   // Velocidade mínima de ataque (s/atk)
  // Atributos iniciais do personagem
  initialStrength:   number
  initialAgility:    number
  initialVitality:   number
  initialDefense:    number
  initialPerception: number
  // Progressão
  attrPointsPerBreakthrough: number  // pontos de atributo ganhos ao romper
}

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
