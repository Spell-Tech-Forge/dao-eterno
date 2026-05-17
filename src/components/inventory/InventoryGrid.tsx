import { useState } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useFrameStyle } from '../../hooks/useFrameStyle'
import type { ItemDefinition } from '../../types'
import { RARITY_LABELS, RARITY_COLORS, type InventoryItem } from '../../types'
import { FilterBar } from './FilterBar'
import { SortDropdown } from './SortDropdown'
import { ItemCard } from './ItemCard'
import { usePill, pillEffectLabel } from '../../utils/consumables'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'
import { useSettingsStore } from '../../store/settingsStore'

interface Props { onBack: () => void }

const SLOT_LABELS = { weapon: 'ARMA', armor: 'ARMADURA', accessory: 'ACESSÓRIO' } as const
const EQUIP_TYPES = ['weapon', 'armor', 'accessory', 'ring'] as const

function statLine(def: ItemDefinition, mult = 1): string {
  const r = (n: number) => Math.round(n * mult)
  return [
    def.stats?.atk   && `força: +${r(def.stats.atk)}`,
    def.stats?.speed && `agilidade: ${(def.stats.speed / mult).toFixed(2)}s`,
    def.stats?.crit  && `percepção: +${(def.stats.crit * mult).toFixed(1)}%`,
    def.stats?.def   && `defesa: +${r(def.stats.def)}`,
    def.stats?.hp    && `vitalidade: +${r(def.stats.hp)}`,
  ].filter(Boolean).join('  ')
}

// ── Card completo para equipamentos ───────────────────────────────
interface EquipCardProps {
  item: InventoryItem
  isEquipped: boolean
  equippedSlot: 'weapon' | 'armor' | 'accessory' | 'ring' | null
  forgeLevel: number
  onEquip: () => void
  onUnequip: () => void
  onDismantle: () => void
}

function EquipmentCard({ item, isEquipped, forgeLevel: _forgeLevel, onEquip, onUnequip, onDismantle }: EquipCardProps) {
  const [confirmDismantle, setConfirmDismantle] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const itemDefs    = useGameDataStore(s => s.items)
  const def         = itemDefs[item.definitionId]
  const spriteH     = useSettingsStore(s => s.itemSpriteSize)
  const equipW      = useSettingsStore(s => s.equipCardWidth)
  const equipH      = useSettingsStore(s => s.equipCardHeight)
  const equipTextSz = useSettingsStore(s => s.equipTextSize)
  const equipBtnSz  = useSettingsStore(s => s.equipBtnSize)
  const equipBtnIco = useSettingsStore(s => s.equipBtnIcons)

  if (!def) return null

  const isRing  = def.type === 'ring'
  const upgLvl  = item.upgradeLevel  ?? 0
  const ascTier = item.ascensionTier ?? 0
  const effRar  = effectiveRarity(def.rarity, ascTier)
  const color   = RARITY_COLORS[effRar]
  const { borderW, ...borderStyles } = useFrameStyle(effRar, isEquipped ? color : color + '55')
  const mult    = itemStatMultiplier(upgLvl, ascTier)
  const dur     = item.durability
  const maxDur  = itemMaxDurability(upgLvl)
  const durPct  = dur !== undefined ? (dur / maxDur) * 100 : undefined
  const durColor = durPct === undefined ? '#22c55e' : durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'

  function handleDismantle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDismantle) { setConfirmDismantle(true); return }
    onDismantle()
    setConfirmDismantle(false)
  }

  const btnPad = `${Math.max(2, equipBtnSz - 7)}px 4px`
  const fSz    = equipTextSz

  // ── Face frontal ─────────────────────────────────────────────────
  const front = (
    <div
      onClick={() => setFlipped(true)}
      style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        backgroundColor: color + '0d',
        display: 'flex', flexDirection: 'column',
        padding: '6px', gap: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Sprite — flex:1 preenche espaço disponível */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={Math.min(spriteH, equipW - 20)} />
      </div>

      {/* Nome + raridade + nível */}
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

      {/* Durabilidade */}
      {durPct !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, backgroundColor: durColor, width: `${durPct}%`, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: fSz - 3, color: '#94a3b8' }}>{Math.round(durPct)}%</span>
        </div>
      )}

      {/* Stats resumidos */}
      <div style={{ fontSize: fSz - 1, color: '#94a3b8', lineHeight: 1.3, overflow: 'hidden', flexShrink: 0 }}>
        {isRing && def.stats?.slots ? `📦 ${def.stats.slots} slots` : statLine(def, mult)}
      </div>

      {/* Botões — stopPropagation para não flipar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}>
        {isRing ? (
          isEquipped
            ? <div style={{ fontSize: equipBtnSz, padding: btnPad, textAlign: 'center', borderRadius: 6, border: '1px solid rgba(74,222,128,0.3)', color: 'rgba(74,222,128,0.5)', fontWeight: 'bold' }}>
                {equipBtnIco ? '✓ ' : ''}Equipado
              </div>
            : <button onClick={e => { e.stopPropagation(); onEquip() }}
                style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 6, border: '1px solid #4ade80', backgroundColor: 'rgba(74,222,128,0.2)', color: '#4ade80', fontWeight: 'bold', cursor: 'pointer' }}>
                {equipBtnIco ? '💍 ' : ''}Equipar
              </button>
        ) : (
          <>
            <button onClick={e => { e.stopPropagation(); isEquipped ? onUnequip() : onEquip() }}
              style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 6, fontWeight: 'bold', cursor: 'pointer',
                border: isEquipped ? '1px solid #ef4444' : '1px solid #4ade80',
                backgroundColor: isEquipped ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.2)',
                color: isEquipped ? '#ef4444' : '#4ade80',
              }}>
              {isEquipped ? (equipBtnIco ? '↩ ' : '') + 'Desequipar' : (equipBtnIco ? '⚔ ' : '') + 'Equipar'}
            </button>
            {!isEquipped && (
              <button onClick={handleDismantle}
                style={{ fontSize: equipBtnSz, padding: btnPad, borderRadius: 6, fontWeight: 'bold', cursor: 'pointer',
                  border: confirmDismantle ? '1px solid #ef4444' : '1px solid #374151',
                  backgroundColor: confirmDismantle ? 'rgba(239,68,68,0.2)' : 'rgba(55,65,81,0.5)',
                  color: confirmDismantle ? '#ef4444' : '#6b7280',
                }}>
                {confirmDismantle ? (equipBtnIco ? '⚠️ ' : '') + 'Confirmar?' : (equipBtnIco ? '🔨 ' : '') + 'Desmontar'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )

  // ── Face traseira (stats detalhados) ─────────────────────────────
  const statRows: { label: string; value: string }[] = []
  if (def.stats?.atk)   statRows.push({ label: '⚔ Ataque',    value: `+${Math.round(def.stats.atk * mult)}` })
  if (def.stats?.def)   statRows.push({ label: '🛡 Defesa',    value: `+${Math.round(def.stats.def * mult)}` })
  if (def.stats?.hp)    statRows.push({ label: '❤ Vitalidade', value: `+${Math.round(def.stats.hp * mult)}` })
  if (def.stats?.qi)    statRows.push({ label: '🔮 Qi',        value: `+${def.stats.qi}` })
  if (def.stats?.crit)  statRows.push({ label: '💥 Crítico',   value: `+${(def.stats.crit * mult).toFixed(1)}%` })
  if (def.stats?.speed) statRows.push({ label: '⏱ Velocidade', value: `${(def.stats.speed / mult).toFixed(2)}s` })
  if (def.stats?.slots) statRows.push({ label: '📦 Slots',     value: `${def.stats.slots}` })

  const back = (
    <div
      onClick={() => setFlipped(false)}
      style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        backgroundColor: color + '18',
        display: 'flex', flexDirection: 'column',
        padding: '6px', gap: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Cabeçalho compacto */}
      <div style={{ textAlign: 'center', borderBottom: `1px solid ${color}44`, paddingBottom: 4, flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: fSz, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {def.name}
        </div>
        <div style={{ fontSize: fSz - 2, color, marginTop: 2, lineHeight: 1.2 }}>
          {RARITY_LABELS[effRar]}
          {upgLvl > 0 && ` +${upgLvl}`}
          {ascTier > 0 && ` Asc.${ascTier}`}
        </div>
      </div>

      {/* Stats — scroll se não couber */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {statRows.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fSz - 1, color: '#94a3b8' }}>{label}</span>
            <span style={{ fontSize: fSz - 1, fontWeight: 'bold', color: '#e2e8f0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Durabilidade */}
      {durPct !== undefined && (
        <div style={{ borderTop: `1px solid ${color}33`, paddingTop: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: fSz - 2, color: '#94a3b8' }}>Durabilidade</span>
            <span style={{ fontSize: fSz - 2, color: durColor }}>{dur}/{maxDur}</span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, backgroundColor: durColor, width: `${durPct}%` }} />
          </div>
        </div>
      )}

      {/* Hint mínimo */}
      <div style={{ textAlign: 'center', fontSize: fSz - 4, color, opacity: 0.4, flexShrink: 0 }}>
        ↺ voltar
      </div>
    </div>
  )

  return (
    <div style={{
      width: equipW, height: equipH, flexShrink: 0,
      perspective: 1200,
      ...borderStyles,
    }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {front}
        {back}
      </div>
    </div>
  )
}

// ── InventoryGrid ─────────────────────────────────────────────────
export function InventoryGrid({ onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { items, maxSlots, equipped, equipItem, unequipSlot, dismantleItem, getFiltered } = useInventoryStore()
  const forgeLevel = useSkillsStore(s => s.skills.find(sk => sk.id === 'forging')?.level ?? 1)
  const itemDefs   = useGameDataStore(s => s.items)

  const filtered = getFiltered()
  const equipItems    = filtered.filter(i => EQUIP_TYPES.includes(itemDefs[i.definitionId]?.type as typeof EQUIP_TYPES[number]))
  const materialItems = filtered.filter(i => itemDefs[i.definitionId]?.type === 'material')
  const pillItems     = filtered.filter(i => itemDefs[i.definitionId]?.type === 'pill')

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? itemDefs[selected.definitionId] : null

  const materialsCount = items.filter(i => itemDefs[i.definitionId]?.type === 'material').reduce((a, i) => a + i.quantity, 0)
  const equippedCount  = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean).length

  function getEquippedSlot(instanceId: string): 'weapon' | 'armor' | 'accessory' | 'ring' | null {
    const entry = (Object.entries(equipped) as [string, typeof equipped[keyof typeof equipped]][])
      .find(([, v]) => v?.instanceId === instanceId)
    const slot = entry?.[0]
    return (slot === 'weapon' || slot === 'armor' || slot === 'accessory' || slot === 'ring') ? slot : null
  }

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-text">Arsenal do Herói</h1>
          <p className="text-xs text-muted">Mochila, materiais e equipamentos</p>
        </div>
        <span className="text-xs text-jade border border-jade/40 rounded px-2 py-1">
          {items.length}/{maxSlots} slots
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: `${equippedCount}/3`, label: 'equipados' },
          { value: materialsCount,       label: 'materiais' },
          { value: items.length,         label: 'itens na mochila' },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-2xl font-bold text-gold">{value}</div>
            <div className="text-xs text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Arsenal Equipado */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text">Arsenal Equipado</span>
          <span className="text-xs text-muted">Slots ativos do herói</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['weapon','armor','accessory'] as const).map(slot => {
            const eq  = equipped[slot]
            const def = eq ? itemDefs[eq.definitionId] : null
            const color = def ? RARITY_COLORS[def.rarity] : '#2a2a4e'
            return (
              <div key={slot} className="rounded-lg border p-3 min-h-[80px] flex flex-col gap-1"
                style={{ borderColor: def ? color + '66' : '#2a2a4e', backgroundColor: def ? color + '0d' : undefined }}>
                <span className="text-xs font-bold tracking-widest" style={{ color: def ? color : '#f59e0b' }}>
                  {SLOT_LABELS[slot]}
                </span>
                {def ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm">
                      <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={18} />
                      <span>{def.name}</span>
                    </div>
                    {eq?.durability !== undefined && (() => {
                      const eqPct = (eq.durability / itemMaxDurability(eq.upgradeLevel ?? 0)) * 100
                      return (
                        <div className="h-1 rounded-full bg-surface-2 overflow-hidden mt-auto">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${eqPct}%`, backgroundColor: eqPct > 50 ? '#22c55e' : eqPct > 20 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <span className="text-muted italic text-sm mt-auto">— vazio —</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <FilterBar />
        <SortDropdown />
      </div>

      {/* Materiais */}
      {materialItems.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted uppercase tracking-widest">Materiais</span>
            <span className="text-xs text-muted">{materialItems.length} tipos</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {materialItems.map(item => (
              <ItemCard key={item.instanceId} item={item} selected={selectedId === item.instanceId}
                onClick={() => setSelectedId(prev => prev === item.instanceId ? null : item.instanceId)} />
            ))}
          </div>
        </div>
      )}

      {/* Pílulas */}
      {pillItems.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted uppercase tracking-widest">Pílulas</span>
            <span className="text-xs text-muted">{pillItems.length} tipos</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pillItems.map(item => (
              <ItemCard key={item.instanceId} item={item} selected={selectedId === item.instanceId}
                onClick={() => setSelectedId(prev => prev === item.instanceId ? null : item.instanceId)} />
            ))}
          </div>
        </div>
      )}

      {/* Equipamentos */}
      {equipItems.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted uppercase tracking-widest">Equipamentos</span>
            <span className="text-xs text-muted">{equipItems.length} itens</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipItems.map(item => {
              const slot = getEquippedSlot(item.instanceId)
              return (
                <EquipmentCard
                  key={item.instanceId}
                  item={item}
                  isEquipped={slot !== null}
                  equippedSlot={slot}
                  forgeLevel={forgeLevel}
                  onEquip={() => equipItem(item.instanceId)}
                  onUnequip={() => (slot && slot !== 'ring') && unequipSlot(slot)}
                  onDismantle={() => dismantleItem(item.instanceId, forgeLevel)}
                />
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-muted text-sm py-8">Nenhum item encontrado.</div>
      )}

      {/* Detalhe de pílula/material selecionado */}
      {selected && selectedDef && (selectedDef.type === 'pill' || selectedDef.type === 'material') && (
        <div className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: RARITY_COLORS[selectedDef.rarity] + '88' }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: RARITY_COLORS[selectedDef.rarity] + '22' }}>
              <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={48} />
            </div>
            <div className="text-center">
              <div className="font-bold text-text text-base">{selectedDef.name}</div>
              <div className="text-xs mt-0.5" style={{ color: RARITY_COLORS[selectedDef.rarity] }}>
                {RARITY_LABELS[selectedDef.rarity]}
              </div>
            </div>
          </div>
          {selectedDef.stats && (
            <div className="text-xs text-muted text-center">{statLine(selectedDef)}</div>
          )}
          <p className="text-xs text-muted text-center">{selectedDef.description}</p>
          {selectedDef.type === 'pill' && (selectedDef.stats?.hp || selectedDef.stats?.qi) && (
            <button onClick={() => { usePill(selected.instanceId); setSelectedId(null) }}
              className="w-full py-2 rounded-lg text-sm font-bold bg-hp/10 border border-hp/50 text-hp hover:bg-hp/20 transition-colors">
              🧪 Usar — {pillEffectLabel(selected.definitionId)}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
