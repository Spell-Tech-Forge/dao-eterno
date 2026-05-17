import { useState } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
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
  const itemDefs     = useGameDataStore(s => s.items)
  const rarityFrames = useSettingsStore(s => s.rarityFrames)
  const def          = itemDefs[item.definitionId]
  if (!def) return null
  const spriteH      = useSettingsStore(s => s.itemSpriteSize)
  const equipW       = useSettingsStore(s => s.equipCardWidth)
  const equipH       = useSettingsStore(s => s.equipCardHeight)
  const equipTextSz  = useSettingsStore(s => s.equipTextSize)
  const equipBtnSz   = useSettingsStore(s => s.equipBtnSize)
  const equipBtnIco  = useSettingsStore(s => s.equipBtnIcons)

  const isRing   = def.type === 'ring'
  const upgLvl   = item.upgradeLevel  ?? 0
  const ascTier  = item.ascensionTier ?? 0
  const effRar   = effectiveRarity(def.rarity, ascTier)
  const color    = RARITY_COLORS[effRar]
  const frameUrl = rarityFrames[effRar]
  const mult     = itemStatMultiplier(upgLvl, ascTier)
  const dur      = item.durability
  const maxDur   = itemMaxDurability(upgLvl)
  const durPct   = dur !== undefined ? (dur / maxDur) * 100 : undefined
  const durColor = durPct === undefined ? '#22c55e' : durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'

  function handleDismantle() {
    if (!confirmDismantle) { setConfirmDismantle(true); return }
    onDismantle()
    setConfirmDismantle(false)
  }

  return (
    <div className="relative rounded-lg border flex flex-col p-2 gap-1.5 overflow-hidden"
      style={{
        width:           equipW,
        height:          equipH,
        flexShrink:      0,
        borderColor:     frameUrl ? 'transparent' : (isEquipped ? color : color + '55'),
        backgroundColor: color + '0d',
      }}>

      {/* ── Área de conteúdo: cresce, mas não empurra os botões ── */}
      <div className="flex flex-col gap-1 flex-1 overflow-hidden">

        {/* Sprite */}
        <div className="w-full overflow-hidden flex items-center justify-center shrink-0" style={{ height: spriteH }}>
          <SpriteImg id={def.id} emoji={def.emoji} kind="item" />
        </div>

        {/* Nome + raridade + nível */}
        <div className="text-center shrink-0">
          <div className="font-bold text-text leading-tight line-clamp-2"
            style={{ fontSize: equipTextSz }}>{def.name}</div>
          <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
            <span style={{ fontSize: equipTextSz - 1, color }}>{RARITY_LABELS[effRar]}</span>
            {upgLvl > 0 && (
              <span className="font-bold px-1 rounded border"
                style={{ fontSize: equipTextSz - 2, color, borderColor: color + '66' }}>
                +{upgLvl}
              </span>
            )}
          </div>
        </div>

        {/* Durabilidade */}
        {dur !== undefined && durPct !== undefined && (
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${durPct}%`, backgroundColor: durColor }} />
            </div>
            <span style={{ fontSize: equipTextSz - 2 }} className="text-muted">{Math.round(durPct)}%</span>
          </div>
        )}

        {/* Stats — ocupa espaço disponível, pode ser cortado */}
        <div className="text-muted leading-tight overflow-hidden"
          style={{ fontSize: equipTextSz - 1 }}>
          {isRing && def.stats?.slots ? `📦 ${def.stats.slots} slots` : statLine(def, mult)}
        </div>
      </div>

      {/* ── Botões — sempre visíveis no fundo (shrink-0) ── */}
      <div className="flex flex-col gap-1 shrink-0 mt-1">
        {isRing ? (
          isEquipped ? (
            <div className="rounded font-bold border border-jade/30 text-jade/50 text-center"
              style={{ fontSize: equipBtnSz, padding: `${Math.max(2, equipBtnSz - 7)}px 4px` }}>
              {equipBtnIco ? '✓ ' : ''}Equipado
            </div>
          ) : (
            <button onClick={onEquip}
              className="rounded font-bold border bg-jade/20 border-jade text-jade hover:bg-jade/30 transition-colors"
              style={{ fontSize: equipBtnSz, padding: `${Math.max(2, equipBtnSz - 7)}px 4px` }}>
              {equipBtnIco ? '💍 ' : ''}Equipar
            </button>
          )
        ) : (
          <>
            <button onClick={isEquipped ? onUnequip : onEquip}
              className={`rounded font-bold border transition-colors ${
                isEquipped
                  ? 'bg-danger/10 border-danger text-danger hover:bg-danger/20'
                  : 'bg-jade/20 border-jade text-jade hover:bg-jade/30'
              }`}
              style={{ fontSize: equipBtnSz, padding: `${Math.max(2, equipBtnSz - 7)}px 4px` }}>
              {isEquipped
                ? (equipBtnIco ? '↩ ' : '') + 'Desequipar'
                : (equipBtnIco ? '⚔ ' : '') + 'Equipar'}
            </button>
            {!isEquipped && (
              <button onClick={handleDismantle}
                className={`rounded font-bold border transition-colors ${
                  confirmDismantle
                    ? 'bg-danger/20 border-danger text-danger'
                    : 'bg-surface-2 border-border text-muted hover:border-danger hover:text-danger'
                }`}
                style={{ fontSize: equipBtnSz, padding: `${Math.max(2, equipBtnSz - 7)}px 4px` }}>
                {confirmDismantle
                  ? (equipBtnIco ? '⚠️ ' : '') + 'Confirmar?'
                  : (equipBtnIco ? '🔨 ' : '') + 'Desmontar'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Frame cobre o card inteiro */}
      {frameUrl && (
        <img src={frameUrl} alt="" draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 rounded-lg"
          style={{ objectFit: 'fill' }} />
      )}
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
