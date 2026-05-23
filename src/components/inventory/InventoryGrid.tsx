import { useState, useMemo } from 'react'
import { useInventoryStore, INITIAL_EQUIPPED } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useFrameStyle } from '../../hooks/useFrameStyle'
import { RARITY_LABELS, RARITY_COLORS, type InventoryItem } from '../../types'
import { FilterBar } from './FilterBar'
import { SortDropdown } from './SortDropdown'
import { ItemCard } from './ItemCard'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

interface Props { onBack: () => void }

const SLOT_LABELS = { weapon: 'ARMA', armor: 'ARMADURA', accessory: 'ACESSÓRIO' } as const
const EQUIP_TYPES = ['weapon', 'armor', 'accessory', 'ring'] as const


function SectionHeader({ title, count }: { title: string; count?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500 whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
      {count && <span className="text-xs text-slate-600">{count}</span>}
      <span className="text-amber-800 text-[10px]">✦</span>
    </div>
  )
}

// ── Card de equipamento ───────────────────────────────────────────
interface EquipCardProps {
  item: InventoryItem
  isEquipped: boolean
  equippedSlot: 'weapon' | 'armor' | 'accessory' | 'ring' | null
  forgeLevel: number
  onEquip: () => void
  onUnequip: () => void
  onDismantle: () => void
  onDiscard: () => void
  onGetPreview: () => { itemId: string; quantity: number }[]
  // bulk dismantle
  dismantleMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

function EquipmentCard({ item, isEquipped, forgeLevel: _forgeLevel, onEquip, onUnequip, onDismantle, onDiscard, onGetPreview, dismantleMode, isSelected, onToggleSelect }: EquipCardProps) {
  const [confirmDismantle, setConfirmDismantle] = useState(false)
  const [confirmDiscard,   setConfirmDiscard]   = useState(false)
  const [preview, setPreview]                   = useState<{ itemId: string; quantity: number }[] | null>(null)
  const [flipped, setFlipped]                   = useState(false)

  const itemDefs    = useGameDataStore(s => s.items)
  const forgeConfig = useGameDataStore(s => s.forgeConfig) ?? undefined
  const def         = itemDefs[item.definitionId]
  const spriteH     = useSettingsStore(s => s.itemSpriteSize)
  const equipW      = useSettingsStore(s => s.equipCardWidth)
  const equipH      = useSettingsStore(s => s.equipCardHeight)
  const equipTextSz = useSettingsStore(s => s.equipTextSize)
  const equipBtnSz  = useSettingsStore(s => s.equipBtnSize)
  const equipBtnIco = useSettingsStore(s => s.equipBtnIcons)

  if (!def) return null

  const isRing   = def.type === 'ring'
  const upgLvl   = item.upgradeLevel  ?? 0
  const ascTier  = item.ascensionTier ?? 0
  const effRar   = effectiveRarity(def.rarity, ascTier)
  const color    = RARITY_COLORS[effRar]
  const { borderW, ...borderStyles } = useFrameStyle(effRar, isEquipped ? color : color + '55')
  const mult     = itemStatMultiplier(upgLvl, ascTier, forgeConfig)
  const dur      = item.durability
  const maxDur   = itemMaxDurability(upgLvl)
  const durPct   = dur !== undefined ? (dur / maxDur) * 100 : undefined
  const durColor = durPct === undefined ? '#22c55e' : durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'

  function handleDismantle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDismantle) {
      setPreview(onGetPreview())
      setConfirmDismantle(true)
      return
    }
  }

  const btnPad = `${Math.max(2, equipBtnSz - 7)}px 4px`
  const fSz    = equipTextSz

  const front = (
    <div
      onClick={dismantleMode ? (isEquipped ? undefined : onToggleSelect) : () => setFlipped(true)}
      style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
        backgroundColor: dismantleMode
          ? isEquipped ? '#0f172a' : isSelected ? color + '33' : color + '0d'
          : color + '0d',
        display: 'flex', flexDirection: 'column',
        padding: '6px', gap: '4px',
        cursor: dismantleMode ? (isEquipped ? 'not-allowed' : 'pointer') : 'pointer',
        outline: dismantleMode && isSelected ? `2px solid ${color}` : 'none',
        outlineOffset: -2,
        opacity: dismantleMode && isEquipped ? 0.35 : 1,
      }}
    >
      {/* Overlay de seleção em modo desmonte */}
      {dismantleMode && !isEquipped && (
        <div style={{
          position: 'absolute', top: 4, right: 4, zIndex: 10,
          width: 18, height: 18, borderRadius: '50%',
          border: `2px solid ${isSelected ? '#ef4444' : color + '88'}`,
          backgroundColor: isSelected ? '#ef4444' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', fontWeight: 'bold',
        }}>
          {isSelected && '✓'}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={Math.min(spriteH, equipW - 20)} />
      </div>

      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: fSz, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {def.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: fSz - 1, color }}>{RARITY_LABELS[effRar]}</span>
          {upgLvl > 0 && (
            <span style={{ fontSize: fSz - 2, fontWeight: 'bold', color, border: `1px solid ${color}66`, borderRadius: 4, padding: '0 4px' }}>
              +{upgLvl}
            </span>
          )}
        </div>
      </div>

      {durPct !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, backgroundColor: durColor, width: `${durPct}%`, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: fSz - 3, color: '#64748b' }}>{Math.round(durPct)}%</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
      {dismantleMode ? null : (<>
        {isRing ? (
          isEquipped
            ? <div style={{ fontSize: equipBtnSz, padding: btnPad, textAlign: 'center', borderRadius: 0, border: '1px solid rgba(74,222,128,0.3)', color: 'rgba(74,222,128,0.5)', fontWeight: 'bold' }}>
                {equipBtnIco ? '✓ ' : ''}Equipado
              </div>
            : <button onClick={e => { e.stopPropagation(); onEquip() }}
                style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 0, border: '1px solid #4ade80', backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80', fontWeight: 'bold', cursor: 'pointer' }}>
                {equipBtnIco ? '💍 ' : ''}Equipar
              </button>
        ) : (
          <>
            <button onClick={e => { e.stopPropagation(); isEquipped ? onUnequip() : onEquip() }}
              style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 0, fontWeight: 'bold', cursor: 'pointer',
                border: isEquipped ? '1px solid #ef4444' : '1px solid #4ade80',
                backgroundColor: isEquipped ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.15)',
                color: isEquipped ? '#ef4444' : '#4ade80',
              }}>
              {isEquipped ? (equipBtnIco ? '↩ ' : '') + 'Desequipar' : (equipBtnIco ? '⚔ ' : '') + 'Equipar'}
            </button>
            {!isEquipped && (<>
              <button onClick={handleDismantle}
                style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 0, fontWeight: 'bold', cursor: 'pointer',
                  border: '1px solid #1e293b',
                  backgroundColor: 'rgba(15,23,42,0.6)',
                  color: '#475569',
                }}>
                {(equipBtnIco ? '🔨 ' : '') + 'Desmontar'}
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDiscard(true) }}
                style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 0, fontWeight: 'bold', cursor: 'pointer',
                  border: '1px solid #1e293b',
                  backgroundColor: 'rgba(15,23,42,0.6)',
                  color: '#475569',
                }}>
                {(equipBtnIco ? '🗑 ' : '') + 'Descartar'}
              </button>
            </>)}
          </>
        )}
      </>)}
      </div>
    </div>
  )

  const statRows: { label: string; value: string }[] = []
  if (def.stats?.atk)   statRows.push({ label: '⚔ Ataque',    value: `+${Math.round(def.stats.atk * mult)}` })
  if (def.stats?.def)   statRows.push({ label: '🛡 Defesa',    value: `+${Math.round(def.stats.def * mult)}` })
  if (def.stats?.hp)    statRows.push({ label: '❤ Vitalidade', value: `+${Math.round(def.stats.hp  * mult)}` })
  if (def.stats?.qi)    statRows.push({ label: '🔮 Qi',        value: `+${def.stats.qi}` })
  if (def.stats?.crit)  statRows.push({ label: '💥 Crítico',   value: `+${(def.stats.crit * mult).toFixed(1)}%` })
  if (def.stats?.speed) statRows.push({ label: '⏱ Velocidade', value: `${(def.stats.speed / mult).toFixed(2)}s` })
  if (def.stats?.slots) statRows.push({ label: '📦 Slots',     value: `${def.stats.slots}` })

  const back = (
    <div onClick={() => setFlipped(false)} style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      backgroundColor: color + '18',
      display: 'flex', flexDirection: 'column',
      padding: '6px', gap: '4px',
      cursor: 'pointer',
    }}>
      <div style={{ textAlign: 'center', borderBottom: `1px solid ${color}44`, paddingBottom: 4, flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: fSz, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {def.name}
        </div>
        <div style={{ fontSize: fSz - 2, color, marginTop: 2, lineHeight: 1.2 }}>
          {RARITY_LABELS[effRar]}{upgLvl > 0 && ` +${upgLvl}`}{ascTier > 0 && ` Asc.${ascTier}`}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {statRows.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fSz - 1, color: '#64748b' }}>{label}</span>
            <span style={{ fontSize: fSz - 1, fontWeight: 'bold', color: '#e2e8f0' }}>{value}</span>
          </div>
        ))}
      </div>

      {durPct !== undefined && (
        <div style={{ borderTop: `1px solid ${color}33`, paddingTop: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: fSz - 2, color: '#64748b' }}>Durabilidade</span>
            <span style={{ fontSize: fSz - 2, color: durColor }}>{dur}/{maxDur}</span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, backgroundColor: durColor, width: `${durPct}%` }} />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: fSz - 4, color, opacity: 0.4, flexShrink: 0 }}>↺ voltar</div>
    </div>
  )

  function cancelPreview(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDismantle(false)
    setPreview(null)
  }

  function confirmDismantleAction(e: React.MouseEvent) {
    e.stopPropagation()
    onDismantle()
    setConfirmDismantle(false)
    setPreview(null)
  }

  return (
    <div style={{ width: equipW, height: equipH, flexShrink: 0, perspective: 1200, position: 'relative', ...borderStyles }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {front}
        {back}
      </div>

      {/* Overlay de confirmação de descarte */}
      {confirmDiscard && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            backgroundColor: 'rgba(2,6,23,0.95)',
            backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px', gap: '6px',
          }}
        >
          <div style={{ fontSize: fSz, fontWeight: 'bold', color: '#ef4444' }}>🗑 Descartar?</div>
          <div style={{ fontSize: fSz - 2, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
            O item será perdido permanentemente sem recuperação.
          </div>
          <div style={{ display: 'flex', gap: 3, width: '100%', marginTop: 2 }}>
            <button
              onClick={() => setConfirmDiscard(false)}
              style={{ flex: 1, fontSize: fSz - 2, padding: '3px 0', border: '1px solid #334155', color: '#94a3b8', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDiscard(); setConfirmDiscard(false) }}
              style={{ flex: 1, fontSize: fSz - 2, padding: '3px 0', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Overlay de preview de desmonte */}
      {confirmDismantle && preview && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            backgroundColor: 'rgba(2,6,23,0.93)',
            backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column',
            padding: '6px', gap: '4px',
          }}
        >
          <div style={{ fontSize: fSz - 1, fontWeight: 'bold', color: '#f59e0b', textAlign: 'center', flexShrink: 0, borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
            Recuperação
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {preview.length === 0 ? (
              <span style={{ fontSize: fSz - 2, color: '#64748b', textAlign: 'center', marginTop: 4 }}>Nenhum material</span>
            ) : (
              preview.map(({ itemId, quantity }) => {
                const matDef = itemDefs[itemId]
                return (
                  <div key={itemId} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <SpriteImg id={itemId} emoji={matDef?.emoji ?? '?'} kind="item" size={12} />
                    <span style={{ flex: 1, fontSize: fSz - 2, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {matDef?.name ?? itemId}
                    </span>
                    <span style={{ fontSize: fSz - 2, fontWeight: 'bold', color: '#4ade80', flexShrink: 0 }}>+{quantity}</span>
                  </div>
                )
              })
            )}
          </div>

          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            <button
              onClick={cancelPreview}
              style={{ flex: 1, fontSize: fSz - 2, padding: '3px 0', border: '1px solid #334155', color: '#94a3b8', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmDismantleAction}
              style={{ flex: 1, fontSize: fSz - 2, padding: '3px 0', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal de resultado do desmonte em massa ───────────────────────
function DismantleResultModal({
  results, onClose,
}: { results: { itemId: string; quantity: number }[]; onClose: () => void }) {
  const itemDefs = useGameDataStore(s => s.items)
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#0f172a', border: '1px solid #334155',
        padding: '24px', minWidth: 320, maxWidth: 480, width: '90%',
      }}>
        <div className="font-cinzel font-bold text-amber-400 text-lg mb-4 tracking-wider">
          🔨 Desmonte Concluído
        </div>
        {results.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum material recuperado.</p>
        ) : (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-500 mb-3">Materiais adquiridos:</p>
            {results.map(({ itemId, quantity }) => {
              const def = itemDefs[itemId]
              return (
                <div key={itemId} className="flex items-center gap-3 text-sm">
                  {def
                    ? <SpriteImg id={def.id} emoji={def.emoji} kind="material" size={20} />
                    : <span className="text-slate-500 w-5 text-center">?</span>}
                  <span className="flex-1 text-slate-300">{def?.name ?? itemId}</span>
                  <span className="font-bold text-teal-400 tabular-nums">+{quantity}</span>
                </div>
              )
            })}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 text-sm font-bold border border-teal-700 text-teal-400 bg-teal-900/20 hover:bg-teal-900/40 transition-colors font-cinzel tracking-wider"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// ── Modal de preview do desmonte em massa ────────────────────────
function DismantlePreviewModal({
  recovery, count, onConfirm, onCancel,
}: {
  recovery: { itemId: string; quantity: number }[]
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const itemDefs = useGameDataStore(s => s.items)
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#0f172a', border: '1px solid #334155',
        padding: '24px', minWidth: 320, maxWidth: 480, width: '90%',
      }}>
        <div className="font-cinzel font-bold text-amber-400 text-lg mb-1 tracking-wider">
          🔨 Desmontar {count} {count === 1 ? 'item' : 'itens'}
        </div>
        <p className="text-xs text-slate-500 mb-4">Materiais que serão recuperados:</p>

        {recovery.length === 0 ? (
          <p className="text-slate-500 text-sm mb-4">Nenhum material será recuperado.</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto no-scrollbar">
            {recovery.map(({ itemId, quantity }) => {
              const def = itemDefs[itemId]
              return (
                <div key={itemId} className="flex items-center gap-3 text-sm">
                  {def
                    ? <SpriteImg id={def.id} emoji={def.emoji} kind="material" size={20} />
                    : <span className="text-slate-500 w-5 text-center">?</span>}
                  <span className="flex-1 text-slate-300">{def?.name ?? itemId}</span>
                  <span className="font-bold text-teal-400 tabular-nums">+{quantity}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-bold border border-red-700 text-red-400 bg-red-900/20 hover:bg-red-900/40 transition-colors font-cinzel tracking-wider"
          >
            Desmontar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── InventoryGrid ─────────────────────────────────────────────────
export function InventoryGrid({ onBack }: Props) {
  const { items, maxSlots, equipped, equipItem, unequipSlot, removeItem, previewDismantleItem, getFiltered } = useInventoryStore()
  const forgeLevel = useSkillsStore(s => s.skills.find(sk => sk.id === 'forging')?.level ?? 1)
  const itemDefs   = useGameDataStore(s => s.items)

  // ── Desmonte em massa ─────────────────────────────────────────
  const [dismantleMode, setDismantleMode]       = useState(false)
  const [selected, setSelected]                 = useState<Set<string>>(new Set())
  const [dismantleResults, setDismantleResults] = useState<{ itemId: string; quantity: number }[] | null>(null)
  const [dismantlePreview, setDismantlePreview] = useState<{ recovery: { itemId: string; quantity: number }[]; ids: string[] } | null>(null)
  const [isDismantling, setIsDismantling]       = useState(false)

  function toggleSelect(instanceId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(instanceId)) next.delete(instanceId); else next.add(instanceId)
      return next
    })
  }

  function handleDismantleModeToggle() {
    if (!dismantleMode) {
      setDismantleMode(true)
      setSelected(new Set())
      return
    }
    if (selected.size === 0) return
    // Agrega preview de todos os itens selecionados
    const agg: Record<string, number> = {}
    for (const id of selected) {
      for (const { itemId, quantity } of previewDismantleItem(id, forgeLevel)) {
        agg[itemId] = (agg[itemId] ?? 0) + quantity
      }
    }
    const recovery = Object.entries(agg).map(([itemId, quantity]) => ({ itemId, quantity }))
    setDismantlePreview({ recovery, ids: [...selected] })
  }

  async function confirmDismantleBulk() {
    if (!dismantlePreview || isDismantling) return
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setIsDismantling(true)
    try {
      const res = await api.post<{
        inventory: { items: InventoryItem[]; equipped: typeof INITIAL_EQUIPPED; maxSlots: number }
        recovered: { itemId: string; quantity: number }[]
      }>(`/api/characters/${char.id}/dismantle`, { instanceIds: dismantlePreview.ids })
      useInventoryStore.setState({ items: res.inventory.items, equipped: res.inventory.equipped ?? { ...INITIAL_EQUIPPED }, maxSlots: res.inventory.maxSlots })
      setDismantleResults(res.recovered)
      setDismantlePreview(null)
      setDismantleMode(false)
      setSelected(new Set())
    } catch (err) {
      console.warn('[dismantle bulk]', err)
    } finally {
      setIsDismantling(false)
    }
  }

  function cancelDismantleMode() {
    setDismantleMode(false)
    setSelected(new Set())
  }

  // Itens elegíveis para desmonte em massa (equipados são excluídos na UI)
  const equippedIds = useMemo(
    () => new Set(Object.values(equipped).filter(Boolean).map(e => e!.instanceId)),
    [equipped],
  )

  const filtered      = getFiltered()
  const equipItems    = filtered.filter(i => EQUIP_TYPES.includes(itemDefs[i.definitionId]?.type as typeof EQUIP_TYPES[number]))
  const materialItems = filtered.filter(i => itemDefs[i.definitionId]?.type === 'material')
  const pillItems     = filtered.filter(i => itemDefs[i.definitionId]?.type === 'pill')

  const materialsCount = items.filter(i => itemDefs[i.definitionId]?.type === 'material').reduce((a, i) => a + i.quantity, 0)
  const equippedCount  = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean).length

  function getEquippedSlot(instanceId: string): 'weapon' | 'armor' | 'accessory' | 'ring' | null {
    const entry = (Object.entries(equipped) as [string, typeof equipped[keyof typeof equipped]][])
      .find(([, v]) => v?.instanceId === instanceId)
    const slot = entry?.[0]
    return (slot === 'weapon' || slot === 'armor' || slot === 'accessory' || slot === 'ring') ? slot : null
  }

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">Armazenamento Espacial</h1>
          <p className="text-xs text-slate-500">Mochila, materiais e equipamentos</p>
        </div>
        <span className="text-xs text-teal-400 border border-teal-700/40 px-2 py-1">
          {items.length}/{maxSlots} slots
        </span>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: `${equippedCount}/3`, label: 'equipados' },
          { value: materialsCount,       label: 'materiais' },
          { value: items.length,         label: 'itens na mochila' },
        ].map(({ value, label }) => (
          <div key={label} className="border border-slate-700 bg-slate-900 p-4">
            <div className="text-2xl font-bold text-amber-400">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Arsenal Equipado ── */}
      <div className="border border-slate-700 bg-slate-900 p-4">
        <SectionHeader title="Arsenal Equipado" count="slots ativos" />
        <div className="grid grid-cols-3 gap-2">
          {(['weapon', 'armor', 'accessory'] as const).map(slot => {
            const eq    = equipped[slot]
            const def   = eq ? itemDefs[eq.definitionId] : null
            const color = def ? RARITY_COLORS[def.rarity] : '#334155'
            return (
              <div key={slot} className="border p-3 min-h-[80px] flex flex-col gap-1"
                style={{ borderColor: def ? color + '66' : '#334155', backgroundColor: def ? color + '0d' : undefined }}>
                <span className="text-[10px] font-cinzel font-bold tracking-widest"
                  style={{ color: def ? color : '#f59e0b' }}>
                  {SLOT_LABELS[slot]}
                </span>
                {def ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={18} />
                      <span className="text-xs">{def.name}</span>
                    </div>
                    {eq?.durability !== undefined && (() => {
                      const eqPct = (eq.durability / itemMaxDurability(eq.upgradeLevel ?? 0)) * 100
                      return (
                        <div className="h-1 rounded-full bg-slate-800 overflow-hidden mt-auto">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${eqPct}%`, backgroundColor: eqPct > 50 ? '#22c55e' : eqPct > 20 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <span className="text-slate-600 italic text-xs mt-auto">— vazio —</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="border border-slate-700 bg-slate-900 p-3 space-y-2">
        <FilterBar />
        <SortDropdown />
      </div>

      {/* ── Materiais ── */}
      {materialItems.length > 0 && (
        <div className="border border-slate-700 bg-slate-900 p-4">
          <SectionHeader title="Materiais" count={`${materialItems.length} tipos`} />
          <div className="flex flex-wrap gap-1.5">
            {materialItems.map(item => (
              <ItemCard key={item.instanceId} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Pílulas ── */}
      {pillItems.length > 0 && (
        <div className="border border-slate-700 bg-slate-900 p-4">
          <SectionHeader title="Pílulas" count={`${pillItems.length} tipos`} />
          <div className="flex flex-wrap gap-1.5">
            {pillItems.map(item => (
              <ItemCard key={item.instanceId} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Equipamentos ── */}
      {equipItems.length > 0 && (
        <div className="border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500 whitespace-nowrap">Equipamentos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="text-xs text-slate-600">{equipItems.length} itens</span>
            <span className="text-amber-800 text-[10px]">✦</span>
            {/* Botão de desmonte em massa */}
            {dismantleMode ? (
              <>
                <button
                  onClick={cancelDismantleMode}
                  className="text-xs px-2 py-1 border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDismantleModeToggle}
                  disabled={selected.size === 0}
                  className="text-xs px-3 py-1 border font-bold transition-colors"
                  style={selected.size > 0
                    ? { borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }
                    : { borderColor: '#334155', color: '#475569', cursor: 'not-allowed' }
                  }
                >
                  🔨 Desmontar ({selected.size})
                </button>
              </>
            ) : (
              <button
                onClick={handleDismantleModeToggle}
                className="text-xs px-3 py-1 border border-slate-600 text-slate-400 hover:border-red-700 hover:text-red-400 transition-colors"
              >
                🔨 Desmontar em Massa
              </button>
            )}
          </div>
          {dismantleMode && (
            <div className="text-xs text-amber-500/80 mb-3 px-1">
              Selecione os itens para desmontar. Itens equipados não podem ser selecionados.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {equipItems.map(item => {
              const slot = getEquippedSlot(item.instanceId)
              const isEq = equippedIds.has(item.instanceId)
              return (
                <EquipmentCard
                  key={item.instanceId}
                  item={item}
                  isEquipped={slot !== null}
                  equippedSlot={slot}
                  forgeLevel={forgeLevel}
                  onEquip={() => equipItem(item.instanceId)}
                  onUnequip={() => (slot && slot !== 'ring') && unequipSlot(slot)}
                  onGetPreview={() => previewDismantleItem(item.instanceId, forgeLevel)}
                  onDismantle={async () => {
                    const char = useAuthStore.getState().activeCharacter
                    if (!char) return
                    try {
                      const res = await api.post<{
                        inventory: { items: InventoryItem[]; equipped: typeof INITIAL_EQUIPPED; maxSlots: number }
                        recovered: { itemId: string; quantity: number }[]
                      }>(`/api/characters/${char.id}/dismantle`, { instanceIds: [item.instanceId] })
                      useInventoryStore.setState({ items: res.inventory.items, equipped: res.inventory.equipped ?? { ...INITIAL_EQUIPPED }, maxSlots: res.inventory.maxSlots })
                      setDismantleResults(res.recovered)
                    } catch (err) { console.warn('[dismantle]', err) }
                  }}
                  onDiscard={() => { removeItem(item.instanceId, 1) }}
                  dismantleMode={dismantleMode}
                  isSelected={selected.has(item.instanceId)}
                  onToggleSelect={!isEq ? () => toggleSelect(item.instanceId) : undefined}
                />
              )
            })}
          </div>
        </div>
      )}

      {dismantlePreview && (
        <DismantlePreviewModal
          recovery={dismantlePreview.recovery}
          count={dismantlePreview.ids.length}
          onConfirm={confirmDismantleBulk}
          onCancel={() => setDismantlePreview(null)}
        />
      )}

      {dismantleResults && (
        <DismantleResultModal results={dismantleResults} onClose={() => setDismantleResults(null)} />
      )}

      {filtered.length === 0 && (
        <div className="text-center text-slate-600 text-sm py-8">Nenhum item encontrado.</div>
      )}
    </div>
  )
}
