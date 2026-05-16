import { usePlayerStore } from '../../store/playerStore'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

export function PlayerCard() {
  const { name, hp, maxHp, qi, maxQi, realm, realmStage } = usePlayerStore()
  const hpPct = Math.max(0, (hp / maxHp) * 100)
  const qiPct = Math.max(0, (qi / maxQi) * 100)

  return (
    <div className="rounded-xl border border-border bg-black/30 p-3 w-full">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-bold text-text text-sm">{name}</span>
      </div>
      <div className="text-xs text-muted mb-2">{REALM_NAMES[realm]} · {STAGE_NAMES[realmStage]}</div>
      <div className="space-y-1.5">
        <div>
          <div className="h-4 rounded-full bg-black/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${hpPct}%`, backgroundColor: '#22c55e' }}>
            </div>
          </div>
          <div className="text-center text-xs text-text mt-0.5">{hp} / {maxHp}</div>
        </div>
        <div>
          <div className="h-2.5 rounded-full bg-black/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${qiPct}%`, backgroundColor: '#a855f7' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
