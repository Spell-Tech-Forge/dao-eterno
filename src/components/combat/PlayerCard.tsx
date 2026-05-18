import { usePlayerStore } from '../../store/playerStore'
import { useCombatStore } from '../../store/combatStore'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

export function PlayerCard() {
  const { name, hp, maxHp, realm, realmStage } = usePlayerStore()
  const playerAttackProgress = useCombatStore(s => s.playerAttackProgress)
  const hpPct = Math.max(0, (hp / maxHp) * 100)
  const atkPct = Math.min(100, playerAttackProgress * 100)

  return (
    <div className="border border-slate-700 bg-slate-900 p-3 w-full space-y-2">
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

        {/* ATK Speed bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Veloc. Atk</span>
          </div>
          <div className="h-2 bg-slate-800 overflow-hidden">
            <div className="h-full transition-none"
              style={{ width: `${atkPct}%`, backgroundColor: '#f59e0b' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
