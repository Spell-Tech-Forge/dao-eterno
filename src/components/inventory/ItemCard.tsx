import { useState } from 'react'
import { type InventoryItem, RARITY_COLORS, RARITY_LABELS } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useInventoryStore, markInventoryExplicit } from '../../store/inventoryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { usePlayerStore } from '../../store/playerStore'
import { useFrameStyle } from '../../hooks/useFrameStyle'
import { SpriteImg } from '../ui/SpriteImg'
import { usePill, pillEffectLabel, isBuffPill } from '../../utils/consumables'
import { getItemRole, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from '../../utils/itemRole'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

interface Props {
  item: InventoryItem
  selected?: boolean
  onClick?: () => void
}

export function ItemCard({ item, selected = false }: Props) {
  const [flipped, setFlipped]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [discardQty,  setDiscardQty]  = useState(1)
  const [isUsing,     setIsUsing]     = useState(false)

  const activeBuffs   = usePlayerStore(s => s.activeBuffs)
  const hasActiveBuff = activeBuffs.some(b => b.endsAt > Date.now())

  async function handleDiscard() {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    try {
      const res = await api.post<{ inventory: { items: InventoryItem[] } }>(
        `/api/characters/${char.id}/discard`,
        { instanceId: item.instanceId, quantity: discardQty }
      )
      markInventoryExplicit()
      useInventoryStore.setState({ items: res.inventory.items })
      setShowDiscard(false)
    } catch (err) {
      console.warn('[discard]', err)
    }
  }

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
  const rowTop        = qtyFontSize + 8
  const rowBot        = badgeH + 8
  const contentSize   = cardSize - 2 * borderW
  const spriteSize    = Math.min(spriteH, contentSize - rowTop - rowBot - nameFontSize * 2.5 - 12)

  const badgePill = (c: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontSize:        badgeFontSize,
    color:           c,
    backgroundColor: 'rgba(0,0,0,0.72)',
    border:          `1px solid ${c}99`,
    borderRadius:    9999,
    padding:         '2px 8px',
    fontWeight:      'bold',
    whiteSpace:      'nowrap',
    ...extra,
  })

  // ── Frente ──────────────────────────────────────────────────────
  const front = (
    <div
      onClick={() => setFlipped(true)}
      style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
        display:         'grid',
        gridTemplateRows:`${rowTop}px 1fr ${rowBot}px`,
        cursor:          'pointer',
        borderRadius:    hasFrame ? 0 : 8,
        backgroundColor: selected ? color + '22' : color + '0d',
      }}
    >
      {/* Linha 1 — qtd */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.quantity > 1 && (
          <span style={{ ...badgePill(color), fontSize: qtyFontSize }}>×{item.quantity}</span>
        )}
      </div>

      {/* Linha 2 — sprite + nome */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflow: 'hidden', gap: 4 }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <SpriteImg id={def.id} emoji={def.emoji} kind="material" size={spriteSize} />
        </div>
        <div style={{ width: '100%', textAlign: 'center', fontSize: nameFontSize, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flexShrink: 0, paddingInline: '4px' }}>
          {def.name}
        </div>
      </div>

      {/* Linha 3 — raridade + role */}
      {(() => {
        const role = getItemRole(def.stats)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap', paddingInline: 2 }}>
            <span style={badgePill(color)}>{RARITY_LABELS[def.rarity]}</span>
            {role && (
              <span style={badgePill(ROLE_COLORS[role])}>
                {ROLE_ICONS[role]} {ROLE_LABELS[role]}
              </span>
            )}
          </div>
        )
      })()}
    </div>
  )

  // ── Verso ────────────────────────────────────────────────────────
  const isPill      = def.type === 'pill'
  const isBuffType  = isPill && isBuffPill(item.definitionId)
  const hasUse      = isPill && (def.stats?.hp || def.stats?.qi || isBuffType)

  const back = (
    <div
      onClick={() => setFlipped(false)}
      style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
        transform:       'rotateY(180deg)',
        backgroundColor: color + '18',
        display:         'flex', flexDirection: 'column',
        padding:         '5px', gap: '3px',
        cursor:          'pointer',
        borderRadius:    hasFrame ? 0 : 8,
      }}
    >
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', borderBottom: `1px solid ${color}44`, paddingBottom: 3, flexShrink: 0 }}>
        <div style={{ fontSize: nameFontSize, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {def.name}
        </div>
        <div style={{ fontSize: badgeFontSize, color, marginTop: 1 }}>{RARITY_LABELS[def.rarity]}</div>
      </div>

      {/* Stats */}
      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {def.stats && (
          <>
            {def.stats.atk   != null && <Row icon="⚔" val={`+${def.stats.atk} ATK`}      sz={badgeFontSize} />}
            {def.stats.def   != null && <Row icon="🛡" val={`+${def.stats.def} DEF`}      sz={badgeFontSize} />}
            {def.stats.hp    != null && <Row icon="❤" val={`+${def.stats.hp} HP`}         sz={badgeFontSize} />}
            {def.stats.qi    != null && <Row icon="🔮" val={`+${def.stats.qi} Qi`}        sz={badgeFontSize} />}
            {def.stats.crit        != null && <Row icon="💥" val={`+${def.stats.crit}% crit`}                 sz={badgeFontSize} />}
            {def.stats.speed       != null && <Row icon="⏱" val={`${def.stats.speed}s`}                       sz={badgeFontSize} />}
            {def.stats.slots       != null && <Row icon="📦" val={`${def.stats.slots} slots`}                 sz={badgeFontSize} />}
            {def.stats.buffDuration != null && <Row icon="⏳" val={`${def.stats.buffDuration}min (temporário)`} sz={badgeFontSize} />}
          </>
        )}
        {def.description && (
          <div style={{ fontSize: Math.max(6, badgeFontSize - 1), color: '#64748b', lineHeight: 1.3, marginTop: 2 }}>
            {def.description}
          </div>
        )}
      </div>

      {/* Botão Usar / Ativar (pílulas) */}
      {hasUse && (
        <button
          disabled={isUsing}
          onClick={async e => {
            e.stopPropagation()
            if (isBuffType && hasActiveBuff) { setShowConfirm(true) }
            else { setIsUsing(true); await usePill(item.instanceId); setIsUsing(false) }
          }}
          style={{
            flexShrink:      0,
            width:           '100%',
            padding:         '2px 0',
            fontSize:        badgeFontSize,
            fontWeight:      700,
            border:          isBuffType ? '1px solid #a78bfa66' : '1px solid #22c55e66',
            backgroundColor: isBuffType ? '#a78bfa18'           : '#22c55e18',
            color:           isBuffType ? '#a78bfa'             : '#22c55e',
            cursor:          'pointer',
            borderRadius:    0,
          }}
        >
          {isBuffType ? `✨ Ativar` : `🧪 ${pillEffectLabel(item.definitionId)}`}
        </button>
      )}

      {/* Botão Descartar */}
      <button
        onClick={e => { e.stopPropagation(); setDiscardQty(1); setShowDiscard(true) }}
        style={{
          flexShrink: 0, width: '100%', padding: '2px 0',
          fontSize: badgeFontSize, fontWeight: 600,
          border: '1px solid #47556966', backgroundColor: 'transparent',
          color: '#64748b', cursor: 'pointer', borderRadius: 0,
        }}
      >
        🗑 Descartar
      </button>

      <div style={{ textAlign: 'center', fontSize: Math.max(6, badgeFontSize - 2), color: '#64748b', flexShrink: 0 }}>↺ voltar</div>
    </div>
  )

  return (
    <div style={{ width: cardSize, height: cardSize, flexShrink: 0, perspective: 1200, position: 'relative', ...borderStyles }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {front}
        {back}
      </div>

      {/* Overlay de descartar pilha */}
      {showDiscard && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 25,
            backgroundColor: 'rgba(0,0,0,0.93)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: 8,
          }}
        >
          <div style={{ fontSize: badgeFontSize + 1, color: '#ef4444', fontWeight: 700 }}>🗑 Descartar</div>
          <div style={{ fontSize: Math.max(6, badgeFontSize - 1), color: '#94a3b8', textAlign: 'center' }}>
            Quantidade: <strong style={{ color: '#e2e8f0' }}>{discardQty === item.quantity ? 'Tudo' : discardQty}</strong>
          </div>

          {/* Botões de quantidade rápida */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            {([1, 10, 100] as const).filter(n => n < item.quantity).map(n => (
              <button key={n}
                onClick={() => setDiscardQty(n)}
                style={{
                  padding: '2px 6px', fontSize: Math.max(6, badgeFontSize - 1),
                  border: `1px solid ${discardQty === n ? '#ef444466' : '#33415566'}`,
                  backgroundColor: discardQty === n ? 'rgba(239,68,68,0.15)' : 'transparent',
                  color: discardQty === n ? '#ef4444' : '#94a3b8',
                  cursor: 'pointer', borderRadius: 0,
                }}>
                ×{n}
              </button>
            ))}
            <button
              onClick={() => setDiscardQty(item.quantity)}
              style={{
                padding: '2px 6px', fontSize: Math.max(6, badgeFontSize - 1),
                border: `1px solid ${discardQty === item.quantity ? '#ef444466' : '#33415566'}`,
                backgroundColor: discardQty === item.quantity ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: discardQty === item.quantity ? '#ef4444' : '#94a3b8',
                cursor: 'pointer', borderRadius: 0,
              }}>
              Tudo
            </button>
          </div>

          {/* Input de quantidade manual */}
          <input
            type="number" min={1} max={item.quantity}
            value={discardQty}
            onChange={e => setDiscardQty(Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
            onClick={e => e.stopPropagation()}
            style={{
              width: '70%', padding: '2px 4px', fontSize: badgeFontSize,
              backgroundColor: '#1e293b', border: '1px solid #334155',
              color: '#e2e8f0', textAlign: 'center', outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 4, width: '100%' }}>
            <button
              onClick={() => setShowDiscard(false)}
              style={{ flex: 1, padding: '3px 0', fontSize: badgeFontSize, border: '1px solid #47556980', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDiscard}
              style={{ flex: 1, padding: '3px 0', fontSize: badgeFontSize, fontWeight: 700, border: '1px solid #ef444466', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', borderRadius: 0 }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Overlay de confirmação — substitui buff ativo */}
      {showConfirm && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: 8,
          }}
        >
          <div style={{ fontSize: badgeFontSize + 1, color: '#f59e0b', fontWeight: 700, textAlign: 'center' }}>
            ⚠ Buff ativo!
          </div>
          <div style={{ fontSize: Math.max(6, badgeFontSize - 1), color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            Isso irá substituir o efeito atual.
          </div>
          <div style={{ display: 'flex', gap: 4, width: '100%', marginTop: 2 }}>
            <button
              onClick={() => setShowConfirm(false)}
              style={{ flex: 1, padding: '3px 0', fontSize: badgeFontSize, border: '1px solid #47556980', backgroundColor: '#47556918', color: '#94a3b8', cursor: 'pointer', borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              disabled={isUsing}
              onClick={async () => { setShowConfirm(false); setIsUsing(true); await usePill(item.instanceId); setIsUsing(false) }}
              style={{ flex: 1, padding: '3px 0', fontSize: badgeFontSize, fontWeight: 700, border: '1px solid #a78bfa66', backgroundColor: '#a78bfa18', color: '#a78bfa', cursor: 'pointer', borderRadius: 0 }}
            >
              Substituir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, val, sz }: { icon: string; val: string; sz: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: sz }}>
      <span>{icon}</span>
      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{val}</span>
    </div>
  )
}
