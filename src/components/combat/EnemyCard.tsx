import { type ActiveEnemy, RARITY_LABELS, RARITY_COLORS, REALM_NAMES } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { SpriteImg } from '../ui/SpriteImg'

interface Props {
  enemy: ActiveEnemy
}

export function EnemyCard({ enemy }: Props) {
  const monsters = useGameDataStore(s => s.monsters)
  const biomes   = useGameDataStore(s => s.biomes)
  const def = monsters[enemy.definitionId]
  if (!def) return null

  const hpPct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)
  const biome = biomes[def.biomeId]
  const realmLabel = biome ? REALM_NAMES[biome.requiredRealm] : ''
  const color = RARITY_COLORS[enemy.rarity]

  return (
    <div className="border border-slate-700 bg-slate-900 p-3 w-full space-y-2">
      <div className="flex items-center gap-2">
        <SpriteImg id={def.id} emoji={def.emoji} kind="monster" size={28} />
        <span className="font-cinzel font-bold text-slate-200 text-sm flex-1 min-w-0 truncate">{def.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {def.isBoss && (
            <span className="text-xs px-1.5 py-0.5 border border-amber-500/50 text-amber-400 font-bold tracking-widest">
              BOSS
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 border font-bold tracking-widest"
            style={{ color, borderColor: color + '66' }}>
            {RARITY_LABELS[enemy.rarity]}
          </span>
        </div>
      </div>

      {realmLabel && <div className="text-xs text-slate-500">{realmLabel}</div>}

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
    </div>
  )
}
