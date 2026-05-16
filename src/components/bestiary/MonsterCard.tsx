import { type MonsterDefinition, type BestiaryEntry, RARITY_LABELS, RARITY_COLORS } from '../../types'
import { ITEM_DEFS } from '../../data/items'

interface Props {
  def: MonsterDefinition
  entry: BestiaryEntry | undefined
}

export function MonsterCard({ def, entry }: Props) {
  const kills = entry?.kills ?? 0
  const discovered = entry?.discoveredDrops ?? []

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{def.emoji}</span>
        <div className="flex-1">
          <div className="font-bold text-text">{def.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">Nv.{def.levelMin}–{def.levelMax}</span>
            <span className="text-xs px-1.5 py-0.5 rounded border"
              style={{ color: RARITY_COLORS[def.rarity], borderColor: RARITY_COLORS[def.rarity] + '44' }}>
              {RARITY_LABELS[def.rarity]}
            </span>
            {def.isBoss && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-gold/40 text-gold">BOSS</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gold">{kills}</div>
          <div className="text-xs text-muted">kills</div>
        </div>
      </div>

      {kills === 0 ? (
        <div className="text-xs text-muted italic">Ainda não encontrado.</div>
      ) : (
        <>
          <div>
            <div className="text-xs text-muted uppercase tracking-widest mb-2">Drops</div>
            <div className="space-y-1.5">
              {def.dropTable.map((drop) => {
                const itemDef = ITEM_DEFS[drop.itemId]
                const isRevealed = kills >= 10 || discovered.includes(drop.itemId)
                const isPctRevealed = kills >= 10

                return (
                  <div key={drop.itemId} className="flex items-center gap-2 text-sm">
                    <span>{itemDef?.emoji ?? '❓'}</span>
                    <span className={isRevealed ? 'text-text' : 'text-muted italic'}>
                      {isRevealed ? (itemDef?.name ?? drop.itemId) : '???'}
                    </span>
                    <span className="ml-auto text-xs">
                      {isPctRevealed
                        ? <span className="text-gold">{Math.round(drop.chance * 100)}%</span>
                        : <span className="text-muted">?%</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {kills < 10 && (
            <div className="text-xs text-muted">Drops ocultos revelam com 10 kills. ({kills}/10)</div>
          )}
          {kills >= 100 && (
            <div className="text-xs text-jade">✅ +1% XP contra este tipo de monstro</div>
          )}
        </>
      )}
    </div>
  )
}
