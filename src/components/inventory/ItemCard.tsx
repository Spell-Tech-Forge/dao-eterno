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

  const def = itemDefs[item.definitionId]
  if (!def) return null

  const color    = RARITY_COLORS[def.rarity]
  const frameUrl = rarityFrames[def.rarity]

  // Sprite ocupa a maior parte do card; texto fica na parte inferior
  const spriteHeight = Math.round(cardSize * 0.55)

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
      {/* Sprite */}
      <div className="w-full flex items-center justify-center shrink-0"
        style={{ height: spriteHeight, marginTop: Math.round(cardSize * 0.04) }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="material"
          size={Math.min(spriteH, spriteHeight - 2)} />
      </div>

      {/* Nome */}
      <div className="text-[9px] text-center leading-tight line-clamp-2 text-text font-semibold px-1 w-full">
        {def.name}
      </div>

      {/* Raridade */}
      <div className="text-[8px] px-1 py-px rounded-full font-bold tracking-wide mt-auto mb-0.5"
        style={{ color, backgroundColor: color + '22' }}>
        {RARITY_LABELS[def.rarity]}
      </div>

      {/* Quantidade */}
      {item.quantity > 1 && (
        <div className="absolute bottom-0.5 right-1 text-[8px] px-1 py-px rounded-full bg-surface border border-border text-muted font-bold z-20 leading-none">
          ×{item.quantity}
        </div>
      )}

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
