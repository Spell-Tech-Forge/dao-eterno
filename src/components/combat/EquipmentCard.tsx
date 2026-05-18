import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { itemMaxDurability, effectiveRarity } from '../../utils/forge'
import { RARITY_COLORS } from '../../types'

const RARITY_BORDER: Record<string, string> = {
  common:    '#475569',
  uncommon:  '#4ade80',
  spiritual: '#60a5fa',
  rare:      '#a855f7',
  ancient:   '#f97316',
  legendary: '#ef4444',
}

function DurabilityBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, current / max) : 0
  const color = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444'
  return (
    <div className="h-1.5 bg-slate-800 overflow-hidden mt-1">
      <div className="h-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
    </div>
  )
}

function SlotRow({ slot }: { slot: 'weapon' | 'armor' | 'accessory' }) {
  const item    = useInventoryStore(s => s.equipped[slot])
  const itemDef = useGameDataStore(s => item ? s.items[item.definitionId] : null)

  const SLOT_LABEL = { weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório' }
  const SLOT_ICON  = { weapon: '⚔️', armor: '🛡️', accessory: '💍' }

  if (!item || !itemDef) {
    return (
      <div className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
        <span className="text-slate-700 text-base w-5 text-center">{SLOT_ICON[slot]}</span>
        <div className="flex-1">
          <div className="text-xs text-slate-600 font-cinzel tracking-wide">{SLOT_LABEL[slot]}</div>
          <div className="text-xs text-slate-700 mt-0.5">— vazio —</div>
        </div>
      </div>
    )
  }

  const upgLvl  = item.upgradeLevel  ?? 0
  const ascTier = item.ascensionTier ?? 0
  const maxDur  = item.durability !== undefined ? itemMaxDurability(upgLvl) : null
  const curDur  = item.durability ?? null
  const effRar  = effectiveRarity(itemDef.rarity, ascTier)
  const rarColor = RARITY_COLORS[effRar] ?? '#94a3b8'
  const borColor = RARITY_BORDER[effRar] ?? '#475569'

  return (
    <div className="py-1.5 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-base w-5 text-center">{SLOT_ICON[slot]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{itemDef.emoji}</span>
            <span className="text-xs font-semibold text-slate-200 truncate">{itemDef.name}</span>
            {upgLvl > 0 && (
              <span className="text-xs font-bold text-amber-400 shrink-0">+{upgLvl}</span>
            )}
            {ascTier > 0 && (
              <span className="text-xs font-bold shrink-0" style={{ color: rarColor }}>✦{ascTier}</span>
            )}
          </div>

          {maxDur !== null && curDur !== null ? (
            <div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>Durabilidade</span>
                <span className="tabular-nums"
                  style={{ color: curDur / maxDur < 0.3 ? '#ef4444' : curDur / maxDur < 0.6 ? '#f59e0b' : '#94a3b8' }}>
                  {curDur}/{maxDur}
                </span>
              </div>
              <DurabilityBar current={curDur} max={maxDur} />
            </div>
          ) : (
            <div className="text-[10px] text-slate-600 mt-0.5" style={{ color: rarColor }}>
              {effRar}
            </div>
          )}
        </div>
        <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: borColor + '80' }} />
      </div>
    </div>
  )
}

export function EquipmentCard() {
  return (
    <div className="border border-slate-700 bg-slate-900 p-3 w-full">
      <div className="text-xs font-cinzel font-bold text-slate-400 tracking-widest mb-2 uppercase">
        Arsenal
      </div>
      <SlotRow slot="weapon" />
      <SlotRow slot="armor" />
      <SlotRow slot="accessory" />
    </div>
  )
}
