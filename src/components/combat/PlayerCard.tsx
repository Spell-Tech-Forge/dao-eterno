import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useCombatStore } from '../../store/combatStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

function fmtMs(ms: number): string {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), rem = s % 60
  return `${m}m${rem > 0 ? `${rem}s` : ''}`
}

export function PlayerCard() {
  const { name, hp, maxHp, realm, realmStage, activeBuffs } = usePlayerStore()
  const playerAttackKey = useCombatStore(s => s.playerAttackKey)
  const { effectiveSpeed } = useEffectiveStats()
  const equippedTalisman = useInventoryStore(s => s.equipped.talisman)
  const itemDefs         = useGameDataStore(s => s.items)

  // Força re-render a cada segundo para atualizar o timer dos buffs
  const [, setTick] = useState(0)
  useEffect(() => {
    if (activeBuffs.length === 0) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [activeBuffs.length])

  const hpPct = Math.max(0, (hp / maxHp) * 100)
  const now = Date.now()
  const validBuffs = activeBuffs.filter(b => b.endsAt > now)

  const talismanDef = equippedTalisman ? itemDefs[equippedTalisman.definitionId] : null
  const THRESHOLDS  = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80]
  const threshold   = talismanDef ? THRESHOLDS[Math.min((talismanDef.tier ?? 1) - 1, 9)] : null

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

        {/* Buffs ativos */}
        {validBuffs.map(b => {
          const remaining  = b.endsAt - now
          const totalMs    = (itemDefs[b.definitionId]?.stats?.buffDuration ?? 0) * 60_000
          const pct        = totalMs > 0 ? Math.max(2, (remaining / totalMs) * 100) : 100
          return (
            <div key={b.id}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-purple-400 truncate">⚗️ {b.name}</span>
                <span className="text-purple-300 tabular-nums shrink-0 ml-1">{fmtMs(remaining)}</span>
              </div>
              <div className="h-1.5 bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 transition-none" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}

        {/* Talismã equipado */}
        {talismanDef && threshold !== null && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80 border border-amber-800/30 bg-amber-950/20 px-2 py-1">
            <span>📜</span>
            <span className="truncate flex-1">{talismanDef.name}</span>
            <span className="shrink-0 text-amber-600 tabular-nums">fuga &lt;{threshold}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
