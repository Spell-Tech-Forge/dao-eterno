import { usePlayerStore } from '../../store/playerStore'
import { useCombatStore } from '../../store/combatStore'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

export function PlayerCard() {
  const { name, hp, maxHp, realm, realmStage } = usePlayerStore()
  const playerAttackKey = useCombatStore(s => s.playerAttackKey)
  const { effectiveSpeed } = useEffectiveStats()
  const hpPct = Math.max(0, (hp / maxHp) * 100)

  return (
    <div className="border border-slate-700 bg-slate-900 p-3 w-full h-full space-y-2">
      <div>
        <span className="font-cinzel font-bold text-slate-200 text-sm">{name}</span>
        <div className="text-xs text-slate-500 mt-0.5">{REALM_NAMES[realm]} · {STAGE_NAMES[realmStage]}</div>
      </div>

      <div className="space-y-1.5">
        {/* HP */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Vitalidade</span>
            <span className="tabular-nums">{hp} / {maxHp}</span>
          </div>
          <div className="h-3 bg-slate-800 overflow-hidden">
            <div className="h-full transition-all duration-500"
              style={{ width: `${hpPct}%`, backgroundColor: '#22c55e' }} />
          </div>
        </div>

        {/* ATK Speed bar — CSS keyframe, restarts on each attack */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Veloc. Atk</span>
            <span className="tabular-nums">{effectiveSpeed.toFixed(2)}s</span>
          </div>
          <div className="h-2 bg-slate-800 overflow-hidden">
            <div
              key={playerAttackKey}
              className="h-full atk-bar"
              style={{ animationDuration: `${effectiveSpeed}s`, backgroundColor: '#f59e0b' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
