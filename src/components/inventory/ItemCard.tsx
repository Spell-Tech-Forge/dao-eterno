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

  const color    = RARITY_COLORS[def.rarity]
  const frameUrl = rarityFrames[def.rarity]

  const spriteHeight = Math.round(cardSize * 0.55)
  const nameFontSize = badgeSize
  const badgeFontSize = Math.max(7, badgeSize - 2)
  const qtyFontSize   = badgeSize

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center rounded-lg border transition-all bg-surface-2 hover:brightness-110 overflow-hidden"
      style={{
        width:           cardSize,
        height:          cardSize,
        flexShrink:      0,
        borderColor:     frameUrl ? 'transparent' : (selected ? color : color + '55'),
        backgroundColor: selected ? color + '22' : color + '0d',
      }}
    >
      {/* Quantidade — canto superior direito, acima do frame */}
      {item.quantity > 1 && (
        <div className="absolute top-1 right-1 z-20 font-bold leading-none"
          style={{
            fontSize: qtyFontSize,
            color: '#e2e8f0',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>
          ×{item.quantity}
        </div>
      )}

      {/* Sprite */}
      <div className="w-full flex items-center justify-center shrink-0"
        style={{ height: spriteHeight, marginTop: Math.round(cardSize * 0.05) }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="material"
          size={Math.min(spriteH, spriteHeight - 2)} />
      </div>

      {/* Nome — z-20 para aparecer acima do frame */}
      <div className="w-full text-center font-semibold leading-tight line-clamp-2 px-1 z-20 relative"
        style={{ fontSize: nameFontSize, color: '#e2e8f0' }}>
        {def.name}
      </div>

      {/* Badge de raridade — z-20 */}
      <div className="z-20 relative px-1.5 py-px rounded-full font-bold tracking-wide mt-auto mb-1"
        style={{
          fontSize:        badgeFontSize,
          color,
          backgroundColor: color + '33',
        }}>
        {RARITY_LABELS[def.rarity]}
      </div>

      {/* Frame decorativo por raridade */}
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
