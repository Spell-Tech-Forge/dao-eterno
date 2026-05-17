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

  const nameFontSize  = badgeSize
  const badgeFontSize = Math.max(7, badgeSize - 1)
  const qtyFontSize   = Math.max(8, badgeSize - 1)
  const badgeH        = badgeFontSize + 10
  const rowTop        = qtyFontSize   + 8
  const rowBot        = badgeH        + 8

  const contentSize = cardSize - 2 * borderW
  const spriteSize  = Math.min(spriteH, contentSize - rowTop - rowBot - nameFontSize * 2.5 - 12)

  const badgePillStyle = (c: string): React.CSSProperties => ({
    fontSize:        badgeFontSize,
    color:           c,
    backgroundColor: 'rgba(0,0,0,0.72)',
    border:          `1px solid ${c}99`,
    borderRadius:    9999,
    padding:         '2px 8px',
    fontWeight:      'bold',
    whiteSpace:      'nowrap',
  })

  return (
    <button
      onClick={onClick}
      className="transition-all hover:brightness-110"
      style={{
        display:          'grid',
        gridTemplateRows: `${rowTop}px 1fr ${rowBot}px`,
        width:            cardSize,
        height:           cardSize,
        flexShrink:       0,
        borderRadius:     hasFrame ? 0 : 8,
        backgroundColor:  selected ? color + '22' : color + '0d',
        boxSizing:        'border-box',
        ...borderStyles,
      }}
    >
      {/* Row 1 — quantity badge, centred */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.quantity > 1 && (
          <span style={{ ...badgePillStyle(color), fontSize: qtyFontSize }}>
            ×{item.quantity}
          </span>
        )}
      </div>

      {/* Row 2 — sprite + name */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        height:        '100%',
        overflow:      'hidden',
        gap:           4,
      }}>
        <div style={{
          flex:           1,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          minHeight:      0,
          width:          '100%',
        }}>
          <SpriteImg id={def.id} emoji={def.emoji} kind="material" size={spriteSize} />
        </div>

        <div style={{
          width:           '100%',
          textAlign:       'center',
          fontSize:        nameFontSize,
          fontWeight:      600,
          color:           '#e2e8f0',
          lineHeight:      1.25,
          overflow:        'hidden',
          display:         '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flexShrink:      0,
          paddingInline:   '4px',
        }}>
          {def.name}
        </div>
      </div>

      {/* Row 3 — rarity badge, centred */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={badgePillStyle(color)}>
          {RARITY_LABELS[def.rarity]}
        </span>
      </div>
    </button>
  )
}
