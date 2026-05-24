// ── Tiers de craft (1–10) ─────────────────────────────────────────
// Tier = Math.ceil(skillLevel / 10)

export const TIER_NAMES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Básico',
  3: 'Intermediário',
  4: 'Avançado',
  5: 'Elite',
  6: 'Espiritual',
  7: 'Realeza',
  8: 'Imperial',
  9: 'Sagrado',
  10: 'Lendário',
}

export const ALCHEMY_TITLES: Record<number, string> = {
  1: 'Aprendiz de Alquimia',
  2: 'Praticante Alquimista',
  3: 'Alquimista Veterano',
  4: 'Mestre Alquimista',
  5: 'Grão-Mestre Alquimista',
  6: 'Alquimista Espiritual',
  7: 'Rei Alquimista',
  8: 'Imperador Alquimista',
  9: 'Santo Alquimista',
  10: 'Deus Alquimista',
}

export const FORGING_TITLES: Record<number, string> = {
  1: 'Aprendiz de Forja',
  2: 'Ferreiro Praticante',
  3: 'Ferreiro Experiente',
  4: 'Mestre Ferreiro',
  5: 'Grão-Mestre Ferreiro',
  6: 'Forjador de Armas Espirituais',
  7: 'Rei da Forja',
  8: 'Imperador da Forja',
  9: 'Santo da Forja',
  10: 'Deus da Forja',
}

export function skillLevelToTier(level: number, tierLevels?: number[]): number {
  if (tierLevels?.length) {
    for (let i = tierLevels.length - 1; i >= 0; i--) {
      if (level >= tierLevels[i]) return i + 1
    }
    return 1
  }
  return Math.min(10, Math.max(1, Math.ceil(level / 10)))
}

export function craftFailChance(playerTier: number, requiredTier: number, luck = 0): number {
  const diff = requiredTier - playerTier
  if (diff <= 0) return 0
  const base = Math.min(90, diff * 30)
  return Math.max(0, Math.round(base - luck * 0.5))  // cada ponto reduz 0.5%
}

// +1 por cada 2 tiers acima do requisito (sorte não multiplica — já há luckExtra separado)
export function craftQualityBonus(playerTier: number, requiredTier: number, _luck = 0): number {
  return playerTier - requiredTier >= 2 ? Math.floor((playerTier - requiredTier) / 2) : 0
}

// Roll extra por sorte (independente do tier) — 1.5% por ponto
export function craftLuckExtraRoll(luck: number): boolean {
  return luck > 0 && Math.random() * 100 < luck * 1.5
}
