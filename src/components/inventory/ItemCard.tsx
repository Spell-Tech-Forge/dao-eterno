import { type InventoryItem, RARITY_COLORS, RARITY_LABELS } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useSettingsStore } from '../../store/settingsStore'
import { SpriteImg } from '../ui/SpriteImg'

interface Props {
  item: InventoryItem
  selected: boolean
  onClick: () => void
}

export function ItemCard({ item, selected, onClick }: Props) {
  const itemDefs     = useGameDataStore(s => s.items)
  const rarityFrames = useSettingsStore(s => s.rarityFrames)
  const cardSize     = useSettingsStore(s => s.itemCardSize)
  const spriteH      = useSettingsStore(s => s.materialSpriteSize)
  const badgeSize    = useSettingsStore(s => s.itemBadgeSize)

  const def = itemDefs[item.definitionId]
  if (!def) return null

  const color       = RARITY_COLORS[def.rarity]
  const frameUrl    = rarityFrames[def.rarity]
  const spriteArea  = Math.round(cardSize * 0.58)
  const nameFontSize  = badgeSize
  const badgeFontSize = Math.max(7, badgeSize - 1)

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center rounded-lg border transition-all bg-surface-2 hover:brightness-110"
      style={{
        width:           cardSize,
        height:          cardSize,
        flexShrink:      0,
        overflow:        'hidden',
        borderColor:     frameUrl ? 'transparent' : (selected ? color : color + '55'),
        backgroundColor: selected ? color + '22' : color + '0d',
      }}
    >
      {/* ── Sprite ── */}
      <div className="w-full flex items-center justify-center shrink-0 mt-1"
        style={{ height: spriteArea }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="material"
          size={Math.min(spriteH, spriteArea - 4)} />
      </div>

      {/* ── Nome + Raridade ── posicionados logo abaixo do sprite, nunca no fundo */}
      <div className="flex flex-col items-center gap-0.5 px-1 w-full" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="w-full text-center font-semibold leading-tight line-clamp-2 relative z-20"
          style={{ fontSize: nameFontSize, color: '#e2e8f0' }}>
          {def.name}
        </div>
        <div className="relative z-20 px-2 py-0.5 rounded-full font-bold tracking-wide"
          style={{
            fontSize:        badgeFontSize,
            color,
            backgroundColor: 'rgba(0,0,0,0.55)',
            border:          `1px solid ${color}88`,
          }}>
          {RARITY_LABELS[def.rarity]}
        </div>
      </div>

      {/* ── Quantidade — topo central, sobreposta à borda ── */}
      {item.quantity > 1 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 px-1.5 py-px rounded-full font-bold leading-none"
          style={{
            fontSize:        Math.max(8, badgeSize - 1),
            color,
            backgroundColor: 'rgba(0,0,0,0.75)',
            border:          `1px solid ${color}99`,
          }}>
          ×{item.quantity}
        </div>
      )}

      {/* ── Frame decorativo ── z-10, abaixo do texto (z-20) ── */}
      {frameUrl && (
        <img
          src={frameUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
          style={{ objectFit: 'fill' }}
        />
      )}
    </button>
  )
}
