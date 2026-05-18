import { useEffect, useRef } from 'react'
import type { CombatLogEntry } from '../../types'

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  player_attack: '#e2e8f0',
  enemy_attack:  '#f87171',
  player_kill:   '#4ade80',
  enter:         '#4a9e7f',
  drop:          '#f59e0b',
  flee:          '#94a3b8',
  death:         '#ef4444',
}

const LOG_PREFIX: Record<CombatLogEntry['type'], string> = {
  player_attack: '⚔️',
  enemy_attack:  '🔴',
  player_kill:   '✅',
  enter:         '🌿',
  drop:          '📦',
  flee:          '🏃',
  death:         '💀',
}

interface Props {
  entries: CombatLogEntry[]
}

export function CombatLog({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div className="border border-slate-700 bg-slate-900 p-3">
      <p className="text-xs text-slate-500 tracking-widest uppercase mb-2 font-cinzel">
        Registro de Batalha
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
        {entries.length === 0 && (
          <div className="text-xs text-slate-600 italic">Aguardando combate...</div>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="text-xs flex gap-1.5">
            <span>{LOG_PREFIX[entry.type]}</span>
            <span style={{ color: LOG_COLORS[entry.type] }}>{entry.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
