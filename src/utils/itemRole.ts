import type { ItemStats } from '../types'

export type ItemRole = 'offensive' | 'defensive' | 'balanced'

export const ROLE_LABELS: Record<ItemRole, string> = {
  offensive: 'Ofensivo',
  defensive: 'Defensivo',
  balanced:  'Equilibrado',
}

export const ROLE_COLORS: Record<ItemRole, string> = {
  offensive: '#f97316',
  defensive: '#22c55e',
  balanced:  '#a855f7',
}

export const ROLE_ICONS: Record<ItemRole, string> = {
  offensive: '⚔',
  defensive: '🛡',
  balanced:  '☯',
}

export function getItemRole(stats?: ItemStats): ItemRole | null {
  if (!stats) return null
  const hasOff = (stats.atk ?? 0) > 0 || (stats.crit ?? 0) > 0
  const hasDef = (stats.def ?? 0) > 0 || (stats.hp  ?? 0) > 0
  if (hasOff && hasDef) return 'balanced'
  if (hasOff)           return 'offensive'
  if (hasDef)           return 'defensive'
  return null
}
