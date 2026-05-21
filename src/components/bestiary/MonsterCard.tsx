import { type MonsterDefinition, type BestiaryEntry } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { SpriteImg } from '../ui/SpriteImg'

interface Props {
  def: MonsterDefinition
  entry: BestiaryEntry | undefined
}

export function MonsterCard({ def, entry }: Props) {
  const itemDefs = useGameDataStore(s => s.items)
  const kills = entry?.kills ?? 0
  const discovered = entry?.discoveredDrops ?? []

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SpriteImg id={def.id} emoji={def.emoji} kind="monster" size={40} />
        <div className="flex-1">
          <div className="font-bold text-text">{def.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">Nv.{def.levelMin}–{def.levelMax}</span>
            {def.isBoss && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-400">BOSS</span>
            )}
            {def.isElite && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-orange-500/40 text-orange-400">ELITE</span>
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
                const itemDef = itemDefs[drop.itemId]
                const isRevealed = kills >= 10 || discovered.includes(drop.itemId)
                const isPctRevealed = kills >= 10

                return (
                  <div key={drop.itemId} className="flex items-center gap-2 text-sm">
                    {itemDef
                      ? <SpriteImg id={itemDef.id} emoji={itemDef.emoji} kind="item" size={18} />
                      : <span>❓</span>}
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
