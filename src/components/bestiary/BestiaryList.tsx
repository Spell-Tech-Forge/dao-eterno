import { useState } from 'react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { MONSTER_DEFS } from '../../data/monsters'
import { BIOME_DEFS } from '../../data/biomes'
import { ITEM_DEFS } from '../../data/items'
import { RARITY_COLORS, RARITY_LABELS, REALM_NAMES, STAGE_NAMES } from '../../types'
import { SpriteImg } from '../ui/SpriteImg'

interface Props { onBack: () => void }

export function BestiaryList({ onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { entries } = useBestiaryStore()

  const allMonsters  = Object.values(MONSTER_DEFS)
  const discovered   = allMonsters.filter((m) => entries[m.id])
  const undiscovered = allMonsters.filter((m) => !entries[m.id])
  const selected = selectedId ? MONSTER_DEFS[selectedId] : null
  const entry    = selectedId ? entries[selectedId] : undefined

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text flex-1">Bestiário</h1>
        <span className="text-xs text-muted">{discovered.length} / {allMonsters.length} descobertos</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {discovered.map((def) => {
          const e     = entries[def.id]
          const color = RARITY_COLORS[def.rarity]
          const isSel = selectedId === def.id
          return (
            <button
              key={def.id}
              onClick={() => setSelectedId(isSel ? null : def.id)}
              className="rounded-xl border flex flex-col items-center gap-1 p-2 transition-all text-center"
              style={{
                borderColor: isSel ? color : color + '44',
                backgroundColor: isSel ? color + '22' : color + '0d',
              }}
            >
              <div className="h-10 flex items-center justify-center">
                <SpriteImg id={def.id} emoji={def.emoji} kind="monster" />
              </div>
              <span className="text-xs font-semibold text-text leading-tight line-clamp-2">{def.name}</span>
              <span className="text-xs" style={{ color }}>{RARITY_LABELS[def.rarity]}</span>
              <span className="text-xs text-gold font-bold">{e?.kills ?? 0} kills</span>
            </button>
          )
        })}

        {undiscovered.map((def) => {
          const biome = BIOME_DEFS[def.biomeId]
          return (
            <div
              key={def.id}
              className="rounded-xl border border-border bg-surface-2 flex flex-col items-center gap-1 p-2 text-center opacity-40"
            >
              <div className="h-10 flex items-center justify-center text-2xl">❓</div>
              <span className="text-xs text-muted">???</span>
              {biome && <span className="text-xs text-muted">{REALM_NAMES[biome.requiredRealm]}</span>}
            </div>
          )
        })}
      </div>

      {/* Detalhe */}
      {selected && entry && (
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: RARITY_COLORS[selected.rarity] + '66' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              <SpriteImg id={selected.id} emoji={selected.emoji} kind="monster" size={72} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-text text-lg">{selected.name}</div>
              {(() => {
                const biome = BIOME_DEFS[selected.biomeId]
                return (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: RARITY_COLORS[selected.rarity] }}>
                      {RARITY_LABELS[selected.rarity]}
                    </span>
                    {biome && (
                      <span className="text-xs text-muted">
                        {REALM_NAMES[biome.requiredRealm]} · {STAGE_NAMES[biome.requiredStage]}
                      </span>
                    )}
                    {selected.isBoss && (
                      <span className="text-xs text-gold border border-gold/40 rounded px-1.5">BOSS</span>
                    )}
                  </div>
                )
              })()}
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-gold">{entry.kills}</div>
              <div className="text-xs text-muted">kills</div>
              {entry.kills >= 100 && <div className="text-xs text-jade mt-1">+1% XP</div>}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted uppercase tracking-widest mb-2">Drops</div>
            <div className="grid grid-cols-2 gap-1.5">
              {selected.dropTable.map((drop) => {
                const def      = ITEM_DEFS[drop.itemId]
                const revealed = entry.kills >= 10 || entry.discoveredDrops.includes(drop.itemId)
                const pctRevealed = entry.kills >= 10
                return (
                  <div key={drop.itemId} className="flex items-center gap-1.5 text-xs bg-surface-2 rounded-lg px-2 py-1.5">
                    {revealed
                      ? <SpriteImg id={drop.itemId} emoji={def?.emoji ?? '❓'} kind="material" size={18} />
                      : <span>❓</span>
                    }
                    <span className={revealed ? 'text-text flex-1 truncate' : 'text-muted italic flex-1'}>
                      {revealed ? (def?.name ?? drop.itemId) : '???'}
                    </span>
                    <span className={pctRevealed ? 'text-gold' : 'text-muted'}>
                      {pctRevealed ? `${Math.round(drop.chance * 100)}%` : '?%'}
                    </span>
                  </div>
                )
              })}
            </div>
            {entry.kills < 10 && (
              <div className="text-xs text-muted mt-2">
                Drops revelados com 10 kills ({entry.kills}/10)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
