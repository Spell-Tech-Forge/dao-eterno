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

  // Estimativa de altura da badge para o padding-bottom do container
  const badgeH  = badgeFontSize + 10   // font + padding vertical
  const padTop  = qtyFontSize   + 6    // espaço para o contador de quantidade
  const padBot  = badgeH        + 6    // espaço para o badge de raridade

  return (
    <button
      onClick={onClick}
      className="relative transition-all bg-surface-2 hover:brightness-110"
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
      {/* ── ABSOLUTE: Quantidade — topo central ── */}
      {item.quantity > 1 && (
        <div style={{
          position:        'absolute',
          top:             0,
          left:            '50%',
          transform:       'translateX(-50%)',
          zIndex:          20,
          fontSize:        qtyFontSize,
          color,
          backgroundColor: 'rgba(0,0,0,0.75)',
          border:          `1px solid ${color}99`,
          borderRadius:    9999,
          padding:         '1px 6px',
          fontWeight:      'bold',
          lineHeight:      1.4,
          whiteSpace:      'nowrap',
        }}>
          ×{item.quantity}
        </div>
      )}

      {/* ── ABSOLUTE: Badge de raridade — fundo central, sempre visível ── */}
      <div style={{
        position:        'absolute',
        bottom:          4,
        left:            '50%',
        transform:       'translateX(-50%)',
        zIndex:          20,
        fontSize:        badgeFontSize,
        color,
        backgroundColor: 'rgba(0,0,0,0.65)',
        border:          `1px solid ${color}88`,
        borderRadius:    9999,
        padding:         '2px 8px',
        fontWeight:      'bold',
        whiteSpace:      'nowrap',
      }}>
        {RARITY_LABELS[def.rarity]}
      </div>

      {/* ── FLUXO: Sprite + Nome — preenchem o espaço do meio ── */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        width:          '100%',
        height:         '100%',
        paddingTop:     padTop,
        paddingBottom:  padBot,
        boxSizing:      'border-box',
        overflow:       'hidden',
        gap:            4,
      }}>
        {/* Sprite — flex-1, centralizado */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <SpriteImg id={def.id} emoji={def.emoji} kind="material"
            size={Math.min(spriteH, cardSize - padTop - padBot - nameFontSize * 2 - 12)} />
        </div>

        {/* Nome — máximo 2 linhas, nunca compete com o badge */}
        <div style={{
          width:       '100%',
          textAlign:   'center',
          fontSize:    nameFontSize,
          fontWeight:  600,
          color:       '#e2e8f0',
          lineHeight:  1.25,
          overflow:    'hidden',
          display:     '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flexShrink:  0,
          paddingInline: '4px',
        }}>
          {def.name}
        </div>
      </div>
    </button>
  )
}
