import { type ActiveEnemy, REALM_NAMES } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useCombatStore } from '../../store/combatStore'

interface Props {
  enemy: ActiveEnemy
}

export function EnemyCard({ enemy }: Props) {
  const monsters = useGameDataStore(s => s.monsters)
  const def = monsters[enemy.definitionId]
  const enemyAttackKey = useCombatStore(s => s.enemyAttackKey)

  if (!def) return null

  const hpPct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)
  const realmLabel = REALM_NAMES[def.requiredRealm ?? 'qi_refining']

  return (
    <div className="border border-slate-700 bg-slate-900 p-3 w-full h-full space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-cinzel font-bold text-slate-200 text-sm flex-1 min-w-0 truncate">{def.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {def.isBoss && (
            <span className="text-xs px-1.5 py-0.5 border border-amber-500/50 text-amber-400 font-bold tracking-widest">
              BOSS
            </span>
          )}
          {def.isElite && (
            <span className="text-xs px-1.5 py-0.5 border border-orange-500/50 text-orange-400 font-bold tracking-widest">
              ELITE
            </span>
          )}
        </div>
      </div>

      {realmLabel && <div className="text-xs text-slate-500">{realmLabel}</div>}

      <div className="space-y-1.5">
        {/* HP */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Vitalidade</span>
            <span className="tabular-nums">{enemy.currentHp} / {enemy.maxHp}</span>
          </div>
          <div className="h-3 bg-slate-800 overflow-hidden">
            <div className="h-full transition-all duration-500"
              style={{ width: `${hpPct}%`, backgroundColor: '#ef4444' }} />
          </div>
        </div>

        {/* ATK Speed bar — CSS keyframe, restarts on each attack */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Veloc. Atk</span>
            <span className="tabular-nums">{def.speed.toFixed(1)}s</span>
          </div>
          <div className="h-2 bg-slate-800 overflow-hidden">
            <div
              key={enemyAttackKey}
              className="h-full atk-bar"
              style={{ animationDuration: `${def.speed}s`, backgroundColor: '#f87171' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
