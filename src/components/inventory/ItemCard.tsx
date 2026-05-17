import { type InventoryItem, RARITY_COLORS, RARITY_LABELS } from '../../types'
import { ITEM_DEFS } from '../../data/items'
import { SpriteImg } from '../ui/SpriteImg'

interface Props {
  item: InventoryItem
  selected: boolean
  onClick: () => void
}

export function ItemCard({ item, selected, onClick }: Props) {
  const def = ITEM_DEFS[item.definitionId]
  if (!def) return null
  const color = RARITY_COLORS[def.rarity]

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 p-1.5 pb-5 rounded-lg border transition-all bg-surface-2 hover:brightness-110"
      style={{
        borderColor: selected ? color : color + '55',
        backgroundColor: selected ? color + '22' : color + '0d',
      }}
    >
      <div className="pt-0.5 flex items-center justify-center w-10 h-16 overflow-hidden">
        <SpriteImg id={def.id} emoji={def.emoji} kind="material" />
      </div>

      <div className="text-[10px] text-center leading-tight line-clamp-2 text-text font-semibold px-0.5 w-full">
        {def.name}
      </div>

      <div className="text-[9px] px-1 py-px rounded-full font-bold tracking-wide"
        style={{ color, backgroundColor: color + '22' }}>
        {RARITY_LABELS[def.rarity]}
      </div>

      {item.quantity > 1 && (
        <div className="absolute bottom-1 right-1.5 text-[9px] px-1 py-px rounded-full bg-surface border border-border text-muted font-bold">
          ×{item.quantity}
        </div>
      )}
    </button>
  )
}
