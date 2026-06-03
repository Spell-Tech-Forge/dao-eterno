export type MilestoneEffect = 'glow' | 'pulse' | 'shimmer' | 'rainbow'

export interface UpgradeMilestone {
  level:  number
  color:  string
  label:  string
  effect: MilestoneEffect
}

export const DEFAULT_MILESTONES: UpgradeMilestone[] = [
  { level: 5,  color: '#f59e0b', label: 'Aprimorado',    effect: 'glow'    },
  { level: 10, color: '#38bdf8', label: 'Elevado',        effect: 'pulse'   },
  { level: 15, color: '#a855f7', label: 'Transcendente',  effect: 'rainbow' },
]

/** Retorna o marco mais alto que se aplica ao nível de aprimoramento. */
export function getMilestone(
  upgradeLevel: number,
  milestones: UpgradeMilestone[] = DEFAULT_MILESTONES,
): UpgradeMilestone | null {
  if (!upgradeLevel || upgradeLevel <= 0) return null
  const sorted = [...milestones].sort((a, b) => b.level - a.level)
  return sorted.find(m => upgradeLevel >= m.level) ?? null
}

/** Retorna os estilos inline e a classe CSS de overlay para o milestone. */
export function getMilestoneStyles(milestone: UpgradeMilestone | null): {
  outerStyle: React.CSSProperties
  overlayClass: string
  overlayStyle: React.CSSProperties
} {
  if (!milestone) return { outerStyle: {}, overlayClass: '', overlayStyle: {} }

  const c  = milestone.color
  const c4 = c + '66'   // 40% alpha
  const c8 = c + 'aa'   // 67% alpha

  const outerStyle: React.CSSProperties = {
    boxShadow: `0 0 0 1px ${c}44`,  // subtle border tint on outer
  }
  const overlayStyle: React.CSSProperties = {
    boxShadow: `0 0 14px ${c8}, 0 0 28px ${c4}, inset 0 0 8px ${c}22`,
    border: `1px solid ${c4}`,
  }
  return {
    outerStyle,
    overlayClass: `ms-overlay-${milestone.effect}`,
    overlayStyle,
  }
}
