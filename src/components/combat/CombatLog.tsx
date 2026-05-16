import type { CombatLogEntry } from '../../types'

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  player_attack: '#e2e8f0',
  enemy_attack: '#f87171',
  player_kill: '#4ade80',
  enter: '#4a9e7f',
  drop: '#f59e0b',
  flee: '#94a3b8',
  death: '#ef4444',
}

const LOG_PREFIX: Record<CombatLogEntry['type'], string> = {
  player_attack: '⚔️',
  enemy_attack: '🔴',
  player_kill: '✅',
  enter: '🌿',
  drop: '📦',
  flee: '🏃',
  death: '💀',
}

interface Props {
  entries: CombatLogEntry[]
}

export function CombatLog({ entries }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-xs text-muted tracking-widest uppercase mb-2">Registro do Bioma</div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {entries.length === 0 && (
          <div className="text-xs text-muted italic">Aguardando combate...</div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="text-xs flex gap-1.5">
            <span>{LOG_PREFIX[entry.type]}</span>
            <span style={{ color: LOG_COLORS[entry.type] }}>{entry.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
