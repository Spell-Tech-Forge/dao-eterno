// Fórmulas de derivação de stats de combate a partir dos atributos

export function computeAtk(strength: number): number {
  return strength * 4
}

export function computeSpeed(agility: number): number {
  return Math.max(0.5, 2.0 - agility * 0.03)
}

export function computeMaxHp(vitality: number): number {
  return vitality * 20
}

export function computeDef(defense: number): number {
  return defense * 3
}

export function computeCrit(perception: number): number {
  return perception * 0.5
}

export function computeDps(strength: number, agility: number, perception: number): number {
  const atk = computeAtk(strength)
  const speed = computeSpeed(agility)
  const crit = computeCrit(perception)
  return Math.round((atk / speed) * (1 + crit / 100))
}
