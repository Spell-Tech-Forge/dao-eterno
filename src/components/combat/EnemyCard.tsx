import { type ActiveEnemy, RARITY_LABELS, RARITY_COLORS, REALM_NAMES } from '../../types'
import { MONSTER_DEFS } from '../../data/monsters'
import { BIOME_DEFS } from '../../data/biomes'

interface Props {
  enemy: ActiveEnemy
}

export function EnemyCard({ enemy }: Props) {
  const def = MONSTER_DEFS[enemy.definitionId]
  if (!def) return null

  const hpPct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)
  const biome = BIOME_DEFS[def.biomeId]
  const realmLabel = biome ? REALM_NAMES[biome.requiredRealm] : ''

  return (
    <div className="rounded-xl border border-border bg-black/30 p-3 w-full">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm">{def.emoji}</span>
        <span className="font-bold text-text text-sm">{def.name}</span>
        <div className="flex items-center gap-1.5 ml-auto">
          {def.isBoss && (
            <span className="text-xs px-1.5 py-0.5 rounded border border-gold/50 text-gold font-bold">
              BOSS
            </span>
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded border"
            style={{ color: RARITY_COLORS[enemy.rarity], borderColor: RARITY_COLORS[enemy.rarity] + '66' }}
          >
            {RARITY_LABELS[enemy.rarity]}
          </span>
        </div>
      </div>
      {realmLabel && (
        <div className="text-xs text-muted mb-2">{realmLabel}</div>
      )}
      <div>
        <div className="h-4 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPct}%`, backgroundColor: '#ef4444' }}
          />
        </div>
        <div className="text-center text-xs text-text mt-0.5">
          {enemy.currentHp} / {enemy.maxHp}
        </div>
      </div>
    </div>
  )
}
