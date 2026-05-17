import { type InventoryItem, RARITY_COLORS, RARITY_LABELS } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useFrameStyle } from '../../hooks/useFrameStyle'
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
  const hasFrame = !!rarityFrames[def.rarity]
  const { borderW, ...borderStyles } = useFrameStyle(def.rarity, selected ? color : color + '55')

  // Espaço real disponível após as bordas
  const contentSize   = cardSize - 2 * borderW
  // Sprite ocupa 50% do espaço de conteúdo — sobra ~50% para texto
  const spriteAreaH   = Math.round(contentSize * 0.50)
  const topMargin     = Math.round(contentSize * 0.05)
  const nameFontSize  = badgeSize
  const badgeFontSize = Math.max(7, badgeSize - 1)
  const qtyFontSize   = Math.max(8, badgeSize - 1)

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center transition-all bg-surface-2 hover:brightness-110"
      style={{
        width:           cardSize,
        height:          cardSize,
        flexShrink:      0,
        overflow:        'hidden',
        borderRadius:    hasFrame ? 0 : 8,
        backgroundColor: selected ? color + '22' : color + '0d',
        boxSizing:       'border-box',
        ...borderStyles,
      }}
    >
      {/* ── Quantidade — topo central ── */}
      {item.quantity > 1 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 px-1.5 py-px rounded-full font-bold leading-none"
          style={{
            fontSize:        qtyFontSize,
            color,
            backgroundColor: 'rgba(0,0,0,0.75)',
            border:          `1px solid ${color}99`,
          }}>
          ×{item.quantity}
        </div>
      )}

      {/* ── Margem superior ── */}
      <div style={{ height: topMargin, flexShrink: 0 }} />

      {/* ── Sprite ── */}
      <div className="w-full flex items-center justify-center shrink-0"
        style={{ height: spriteAreaH }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="material"
          size={Math.min(spriteH, spriteAreaH - 2)} />
      </div>

      {/* ── Nome — empilhado diretamente abaixo do sprite ── */}
      <div className="w-full text-center font-semibold leading-tight line-clamp-2 px-1 mt-1 z-20 relative shrink-0"
        style={{ fontSize: nameFontSize, color: '#e2e8f0' }}>
        {def.name}
      </div>

      {/* ── Badge de raridade ── */}
      <div className="z-20 relative px-2 py-0.5 rounded-full font-bold tracking-wide mt-1 shrink-0"
        style={{
          fontSize:        badgeFontSize,
          color,
          backgroundColor: 'rgba(0,0,0,0.55)',
          border:          `1px solid ${color}88`,
        }}>
        {RARITY_LABELS[def.rarity]}
      </div>
    </button>
  )
}
