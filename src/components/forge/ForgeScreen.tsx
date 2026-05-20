import { useState, useMemo } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { usePlayerStore } from '../../store/playerStore'
import { RARITY_COLORS, RARITY_LABELS, RARITY_PROGRESSION } from '../../types'
import type { InventoryItem } from '../../types'
import {
  effectiveRarity, itemStatMultiplier, upgradeFailChance,
  enhancementCost, ascensionCost, enhancementGoldCost, ascensionGoldCost,
  MAX_UPGRADE_LEVEL, MIN_UPGRADE_FOR_ASCENSION, maxAscensionForTier,
} from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'
import { TabBar } from '../ui/TabBar'

interface Props { onBack: () => void }

const EQUIP_TYPES = ['weapon', 'armor', 'accessory'] as const

// ── Helpers ───────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
    </div>
  )
}

const SLOT_ICON: Record<string, string> = { weapon: '⚔️', armor: '🛡️', accessory: '💍', ring: '💎' }

function ItemRow({ item, selected, equippedSlot, onClick }: {
  item: InventoryItem; selected: boolean; equippedSlot?: string; onClick: () => void
}) {
  const def  = useGameDataStore.getState().items[item.definitionId]
  if (!def) return null
  const tier      = item.ascensionTier ?? 0
  const lvl       = item.upgradeLevel  ?? 0
  const eff       = effectiveRarity(def.rarity, tier)
  const color     = RARITY_COLORS[eff]
  const isEquipped = !!equippedSlot
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 border transition-all text-left"
      style={{
        borderColor:     selected ? color : isEquipped ? '#0d9488' : color + '44',
        backgroundColor: selected ? color + '18' : isEquipped ? '#0d948814' : 'transparent',
      }}>
      <span className="shrink-0"><SpriteImg id={def.id} emoji={def.emoji} kind="item" size={20} /></span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-200 truncate">{def.name}</div>
        <div className="text-[10px]" style={{ color }}>{RARITY_LABELS[eff]}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {equippedSlot && (
          <span className="text-[10px] px-1.5 py-0.5 border border-teal-700/60 bg-teal-950/30 text-teal-400 font-bold"
            title={`Equipado — ${equippedSlot}`}>
            {SLOT_ICON[equippedSlot] ?? '✦'}
          </span>
        )}
        {lvl > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 border"
            style={{ color, borderColor: color + '66' }}>+{lvl}</span>
        )}
      </div>
    </button>
  )
}

function CostRow({ itemId, quantity, items }: { itemId: string; quantity: number; items: InventoryItem[] }) {
  const def  = useGameDataStore.getState().items[itemId]
  const have = items.find(i => i.definitionId === itemId)?.quantity ?? 0
  const ok   = have >= quantity
  return (
    <div className="flex items-center gap-2 text-xs">
      {def
        ? <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={16} />
        : <span>❓</span>}
      <span className="text-slate-500">{def?.name}</span>
      <span className="font-bold tabular-nums ml-1" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
        {have}/{quantity}
      </span>
    </div>
  )
}

// ── Tab Aprimoramento ─────────────────────────────────────────────
function EnhancementTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastResult, setLastResult]  = useState<{ success: boolean } | null>(null)
  const { items, upgradeItem, equipped } = useInventoryStore()

  const equipItems = useMemo(() =>
    items.filter(i => EQUIP_TYPES.includes(useGameDataStore.getState().items[i.definitionId]?.type as typeof EQUIP_TYPES[number])),
    [items],
  )

  const equippedSlotOf = (instanceId: string) =>
    (Object.entries(equipped) as [string, InventoryItem | null][])
      .find(([, e]) => e?.instanceId === instanceId)?.[0]

  const sortedEquipItems = useMemo(() =>
    [...equipItems].sort((a, b) => {
      const aEq = Object.values(equipped).some(e => e?.instanceId === a.instanceId)
      const bEq = Object.values(equipped).some(e => e?.instanceId === b.instanceId)
      return aEq === bEq ? 0 : aEq ? -1 : 1
    }),
    [equipItems, equipped],
  )

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const itemDefs    = useGameDataStore(s => s.items)
  const forgeConfig = useGameDataStore(s => s.forgeConfig) ?? undefined
  const gold        = usePlayerStore(s => s.gold)
  const selectedDef = selected ? itemDefs[selected.definitionId] : null
  const itemTier    = selected ? (itemDefs[selected.definitionId]?.tier ?? 1) : 1
  const currentLvl  = selected?.upgradeLevel ?? 0
  const targetLvl   = currentLvl + 1
  const atMax       = currentLvl >= MAX_UPGRADE_LEVEL
  const costs       = !atMax ? enhancementCost(targetLvl, itemTier, forgeConfig) : []
  const failPct     = !atMax ? upgradeFailChance(targetLvl, itemTier, forgeConfig) : 0
  const goldCost    = !atMax ? enhancementGoldCost(targetLvl, itemTier) : 0
  const hasMats     = costs.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const hasGold     = gold >= goldCost
  const canUpgrade  = !!selected && !atMax && hasMats && hasGold
  const tier        = selected?.ascensionTier ?? 0
  const effRarity   = selectedDef ? effectiveRarity(selectedDef.rarity, tier) : 'common'
  const color       = RARITY_COLORS[effRarity]

  function projectedStat(base: number | undefined): string {
    if (!base) return '—'
    const mBefore = itemStatMultiplier(currentLvl, tier, forgeConfig)
    const mAfter  = itemStatMultiplier(targetLvl,  tier, forgeConfig)
    const before  = Math.round(base * mBefore)
    const after   = Math.round(base * mAfter)
    // Se o arredondamento esconder o ganho, mostra com 1 decimal
    if (before === after) {
      return `${(base * mBefore).toFixed(1)} → ${(base * mAfter).toFixed(1)}`
    }
    return `${before} → ${after}`
  }

  function handleUpgrade() {
    if (!selectedId) return
    const result = upgradeItem(selectedId)
    setLastResult(result)
    setTimeout(() => setLastResult(null), 2000)
  }

  return (
    <div className="flex gap-4">
      <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh] no-scrollbar">
        {sortedEquipItems.length === 0
          ? <p className="text-xs text-slate-500 p-2">Nenhum equipamento no inventário.</p>
          : sortedEquipItems.map(item => (
              <ItemRow key={item.instanceId} item={item}
                selected={selectedId === item.instanceId}
                equippedSlot={equippedSlotOf(item.instanceId)}
                onClick={() => { setSelectedId(item.instanceId); setLastResult(null) }} />
            ))}
      </div>

      {selected && selectedDef ? (
        <div className="flex-1 border p-4 space-y-4" style={{ borderColor: color + '66' }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '22' }}>
              <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={44} />
            </div>
            <div>
              <div className="font-cinzel font-bold text-slate-200">{selectedDef.name}</div>
              <div className="text-xs mt-0.5" style={{ color }}>{RARITY_LABELS[effRarity]}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Nível atual: <span className="font-bold text-slate-200">+{currentLvl}</span>
                {atMax && <span className="ml-1 text-teal-400">(máximo)</span>}
              </div>
            </div>
          </div>

          {!atMax && (
            <>
              {selectedDef.stats && (
                <div className="bg-slate-800 border border-slate-700 p-3 space-y-1.5 text-xs">
                  <SectionHeader title={`+${currentLvl} → +${targetLvl}`} />
                  {selectedDef.stats.atk  != null && <div className="flex items-center gap-4"><span className="text-slate-500 w-16">Ataque</span>  <span className="font-bold text-slate-200">{projectedStat(selectedDef.stats.atk)}</span></div>}
                  {selectedDef.stats.def  != null && <div className="flex items-center gap-4"><span className="text-slate-500 w-16">Defesa</span>  <span className="font-bold text-slate-200">{projectedStat(selectedDef.stats.def)}</span></div>}
                  {selectedDef.stats.hp   != null && <div className="flex items-center gap-4"><span className="text-slate-500 w-16">HP</span>      <span className="font-bold text-slate-200">{projectedStat(selectedDef.stats.hp)}</span></div>}
                  {selectedDef.stats.crit != null && <div className="flex items-center gap-4"><span className="text-slate-500 w-16">Crítico</span> <span className="font-bold text-slate-200">{projectedStat(selectedDef.stats.crit)}%</span></div>}
                </div>
              )}

              <div className="space-y-1.5">
                <SectionHeader title="Materiais necessários" />
                {costs.map(c => <CostRow key={c.itemId} itemId={c.itemId} quantity={c.quantity} items={items} />)}
                <div className="flex items-center gap-2 text-xs">
                  <span>🪙</span>
                  <span className="text-slate-500">Ouro</span>
                  <span className="font-bold tabular-nums ml-1" style={{ color: hasGold ? '#22c55e' : '#ef4444' }}>
                    {gold}/{goldCost}
                  </span>
                </div>
              </div>

              {failPct > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">Chance de falha</span>
                    <span className="font-bold text-red-400">{failPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${failPct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-600">Falha perde os materiais mas não o item.</div>
                </div>
              )}

              {lastResult && (
                <div className={`text-center text-sm font-bold py-2 border ${
                  lastResult.success
                    ? 'bg-teal-950/30 border-teal-700 text-teal-400'
                    : 'bg-red-950/30 border-red-800 text-red-400'
                }`}>
                  {lastResult.success ? `✅ Aprimorado para +${currentLvl}!` : '❌ Falhou! Materiais perdidos.'}
                </div>
              )}

              <button onClick={handleUpgrade} disabled={!canUpgrade}
                className="w-full py-2.5 font-cinzel font-bold text-sm border transition-colors"
                style={canUpgrade
                  ? { backgroundColor: 'rgba(45,212,191,0.1)', borderColor: '#0d9488', color: '#2dd4bf' }
                  : { backgroundColor: 'rgba(15,23,42,0.6)', borderColor: '#1e293b', color: '#475569', cursor: 'not-allowed' }
                }>
                {!hasMats ? 'Materiais insuficientes' : !hasGold ? `Ouro insuficiente (faltam ${goldCost - gold} 🪙)` : `Aprimorar para +${targetLvl}`}
              </button>
            </>
          )}

          {atMax && (
            <div className="text-center text-teal-400 text-sm py-4">
              ✨ Este item atingiu o nível máximo de aprimoramento (+{MAX_UPGRADE_LEVEL}).
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-600 text-sm">
          Selecione um equipamento para aprimorar.
        </div>
      )}
    </div>
  )
}

// ── Tab Ascensão ──────────────────────────────────────────────────
function AscensionTab() {
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [sacrificeIds, setSacrificeIds] = useState<string[]>([])
  const [lastResult,   setLastResult]   = useState<{ success: boolean; reason?: string } | null>(null)
  const { items, ascendItem, equipped } = useInventoryStore()

  const equippedSlotOf = (instanceId: string) =>
    (Object.entries(equipped) as [string, InventoryItem | null][])
      .find(([, e]) => e?.instanceId === instanceId)?.[0]

  const eligibleItems = useMemo(() =>
    items.filter(i => {
      const def = useGameDataStore.getState().items[i.definitionId]
      if (!EQUIP_TYPES.includes(def?.type as typeof EQUIP_TYPES[number])) return false
      if ((i.upgradeLevel  ?? 0) < MIN_UPGRADE_FOR_ASCENSION) return false
      const maxAsc = maxAscensionForTier(def?.tier ?? 1)
      if ((i.ascensionTier ?? 0) >= maxAsc) return false
      return true
    }),
    [items],
  )

  const sortedEligibleItems = useMemo(() =>
    [...eligibleItems].sort((a, b) => {
      const aEq = Object.values(equipped).some(e => e?.instanceId === a.instanceId)
      const bEq = Object.values(equipped).some(e => e?.instanceId === b.instanceId)
      return aEq === bEq ? 0 : aEq ? -1 : 1
    }),
    [eligibleItems, equipped],
  )

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? useGameDataStore.getState().items[selected.definitionId] : null
  const tier        = selected?.ascensionTier ?? 0
  const nextTier    = tier + 1
  const effRarity   = selectedDef ? effectiveRarity(selectedDef.rarity, tier)    : 'common'
  const nextRarity  = selectedDef ? effectiveRarity(selectedDef.rarity, nextTier) : 'common'
  const color       = RARITY_COLORS[effRarity]
  const nextColor   = RARITY_COLORS[nextRarity]
  const itemTierVal = selectedDef?.tier ?? 1
  const maxAsc      = maxAscensionForTier(itemTierVal)
  const maxRarity   = selectedDef ? effectiveRarity(selectedDef.rarity, maxAsc) : 'common'
  const maxColor    = RARITY_COLORS[maxRarity]

  const forgeConfigAsc = useGameDataStore(s => s.forgeConfig) ?? undefined
  const gold           = usePlayerStore(s => s.gold)
  const { materials, sacrificeCount, failChance: ascFailChance } = selected
    ? ascensionCost(tier, forgeConfigAsc)
    : { materials: [], sacrificeCount: 0, failChance: 0 }
  const goldCostAsc = selected ? ascensionGoldCost(tier, selectedDef?.tier ?? 1) : 0

  const availableSacrifices = useMemo(() => {
    if (!selected) return []
    return items.filter(i =>
      i.instanceId !== selectedId &&
      i.definitionId === selected.definitionId &&
      (i.ascensionTier ?? 0) === tier
    )
  }, [items, selected, selectedId, tier])

  const hasMats    = materials.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const hasGoldAsc = gold >= goldCostAsc
  const canAscend  = !!selected && hasMats && hasGoldAsc && sacrificeIds.length === sacrificeCount

  function toggleSacrifice(instanceId: string) {
    setSacrificeIds(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : prev.length < sacrificeCount ? [...prev, instanceId] : prev
    )
  }

  function handleAscend() {
    if (!selectedId) return
    const result = ascendItem(selectedId, sacrificeIds)
    setLastResult(result)
    if (result.success) { setSacrificeIds([]); setSelectedId(null) }
    setTimeout(() => setLastResult(null), 2500)
  }

  function selectItem(id: string) { setSelectedId(id); setSacrificeIds([]); setLastResult(null) }

  return (
    <div className="flex gap-4">
      <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh] no-scrollbar">
        {sortedEligibleItems.length === 0 ? (
          <p className="text-xs text-slate-500 p-2">
            Nenhum item elegível. Aprimoramento mínimo: +{MIN_UPGRADE_FOR_ASCENSION}.
          </p>
        ) : sortedEligibleItems.map(item => (
          <ItemRow key={item.instanceId} item={item}
            selected={selectedId === item.instanceId}
            equippedSlot={equippedSlotOf(item.instanceId)}
            onClick={() => selectItem(item.instanceId)} />
        ))}
      </div>

      {selected && selectedDef ? (
        <div className="flex-1 border p-4 space-y-4" style={{ borderColor: color + '66' }}>

          {/* Header — raridade atual → próxima */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '22' }}>
              <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={44} />
            </div>
            <div className="flex-1">
              <div className="font-cinzel font-bold text-slate-200">
                {selectedDef.name}
                <span className="ml-2 text-xs font-normal text-slate-500">+{selected.upgradeLevel ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 border"
                  style={{ color, borderColor: color + '66' }}>{RARITY_LABELS[effRarity]}</span>
                <span className="text-slate-500 text-xs">→</span>
                <span className="text-xs font-bold px-2 py-0.5 border"
                  style={{ color: nextColor, borderColor: nextColor + '66' }}>{RARITY_LABELS[nextRarity]}</span>
                <span className="text-[10px] text-slate-500 ml-1">
                  teto T{itemTierVal}:
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border"
                  style={{ color: maxColor, borderColor: maxColor + '55', backgroundColor: maxColor + '12' }}>
                  {RARITY_LABELS[maxRarity]} ({maxAsc}×)
                </span>
              </div>
            </div>
          </div>

          {/* Materiais */}
          <div className="space-y-1.5">
            <SectionHeader title="Materiais necessários" />
            {materials.map(c => <CostRow key={c.itemId} itemId={c.itemId} quantity={c.quantity} items={items} />)}
            <div className="flex items-center gap-2 text-xs">
              <span>🪙</span>
              <span className="text-slate-500">Ouro</span>
              <span className="font-bold tabular-nums ml-1" style={{ color: hasGoldAsc ? '#22c55e' : '#ef4444' }}>
                {gold}/{goldCostAsc}
              </span>
            </div>
          </div>

          {/* Sacrifícios */}
          <div className="space-y-2">
            <SectionHeader title={`Sacrificar ${sacrificeCount}× ${selectedDef.name}`} />
            {availableSacrifices.length === 0 ? (
              <p className="text-xs text-red-400">Sem cópias disponíveis. Necessário: {sacrificeCount}.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableSacrifices.map(sac => {
                  const isSel = sacrificeIds.includes(sac.instanceId)
                  return (
                    <button key={sac.instanceId} onClick={() => toggleSacrifice(sac.instanceId)}
                      className="flex items-center gap-2 text-sm px-3 py-2 border transition-colors"
                      style={{
                        borderColor:     isSel ? '#ef4444' : color + '55',
                        backgroundColor: isSel ? '#ef444418' : color + '0d',
                        color:           isSel ? '#ef4444'  : color,
                      }}>
                      <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={24} />
                      {(sac.upgradeLevel ?? 0) > 0 && `+${sac.upgradeLevel}`}
                      {isSel && ' ✓'}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="text-[10px] text-slate-600">Selecionados: {sacrificeIds.length}/{sacrificeCount}</div>
          </div>

          {/* Multiplicador */}
          <div className="bg-slate-800 border border-slate-700 p-3 text-xs space-y-1">
            <SectionHeader title="Bônus após ascensão" />
            <div className="flex items-center gap-4">
              <span className="text-slate-500 w-32">Multiplicador atual</span>
              <span className="font-bold text-slate-200">×{itemStatMultiplier(selected.upgradeLevel ?? 0, tier, forgeConfigAsc).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 w-32">Após ascensão</span>
              <span className="font-bold" style={{ color: nextColor }}>×{itemStatMultiplier(selected.upgradeLevel ?? 0, nextTier, forgeConfigAsc).toFixed(2)}</span>
            </div>
            {ascFailChance > 0 && (
              <div className="flex items-center gap-4 pt-1 border-t border-slate-700/40">
                <span className="text-slate-500 w-32">Chance de falha</span>
                <span className="font-bold text-red-400">{ascFailChance}%</span>
                <span className="text-slate-600 text-[10px]">materiais e sacrifícios são consumidos</span>
              </div>
            )}
          </div>

          {ascFailChance > 0 && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${ascFailChance}%` }} />
              </div>
              <div className="text-[10px] text-slate-600">{ascFailChance}% de falha · {100 - ascFailChance}% de sucesso</div>
            </div>
          )}

          {lastResult && (
            <div className={`text-center text-sm font-bold py-2 border ${
              lastResult.success
                ? 'bg-teal-950/30 border-teal-700 text-teal-400'
                : 'bg-red-950/30 border-red-800 text-red-400'
            }`}>
              {lastResult.success ? '✨ Ascensão concluída!' : `❌ ${lastResult.reason}`}
            </div>
          )}

          <button onClick={handleAscend} disabled={!canAscend}
            className="w-full py-2.5 font-cinzel font-bold text-sm border transition-colors"
            style={canAscend
              ? ascFailChance > 0
                ? { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef444466', color: '#ef4444' }
                : { backgroundColor: 'rgba(45,212,191,0.1)', borderColor: '#0d9488', color: '#2dd4bf' }
              : { backgroundColor: 'rgba(15,23,42,0.6)', borderColor: '#1e293b', color: '#475569', cursor: 'not-allowed' }
            }>
            {!hasMats ? 'Materiais insuficientes'
              : !hasGoldAsc ? `Ouro insuficiente (faltam ${goldCostAsc - gold} 🪙)`
              : canAscend
                ? ascFailChance > 0 ? `⚠️ Tentar Ascensão (${ascFailChance}% falha)` : 'Ascender'
                : `Selecione ${sacrificeCount - sacrificeIds.length} cópia(s)`}
          </button>
        </div>
      ) : (
        <div className="flex-1 border border-slate-700 bg-slate-900 flex flex-col items-center justify-center text-slate-600 text-sm gap-2 p-6 text-center">
          <div>Selecione um equipamento para ascender.</div>
          <div className="text-xs">Requer aprimoramento mínimo +{MIN_UPGRADE_FOR_ASCENSION}.</div>
        </div>
      )}
    </div>
  )
}

// ── ForgeScreen ───────────────────────────────────────────────────
type ForgeTab = 'enhancement' | 'ascension'

export function ForgeScreen({ onBack }: Props) {
  const [tab, setTab] = useState<ForgeTab>('enhancement')

  const TABS = [
    { id: 'enhancement' as ForgeTab, label: 'Aprimoramento', icon: '⚒️' },
    { id: 'ascension'   as ForgeTab, label: 'Ascensão',      icon: '✨' },
  ]

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider flex-1">
          Ascensão & Aprimoramento
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div className="border border-slate-700 bg-slate-900">
        <TabBar tabs={TABS} activeTab={tab} onChange={id => setTab(id as ForgeTab)} />
      </div>

      {/* ── Info rápida por aba ── */}
      {tab === 'enhancement' && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Bônus por nível', value: '+5% stats',         color: 'text-teal-400' },
            { label: 'Máximo',          value: `+${MAX_UPGRADE_LEVEL}`, color: 'text-amber-400' },
            { label: 'Falha a partir',  value: '+6 (consome mats)', color: 'text-red-400'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
              <div className="text-slate-500 mb-0.5">{label}</div>
              <div className={`font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'ascension' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
            <div className="text-slate-500 mb-0.5">Bônus por tier</div>
            <div className="font-bold text-teal-400">+15% stats</div>
          </div>
          <div className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
            <div className="text-slate-500 mb-0.5">Requisito</div>
            <div className="font-bold text-amber-400">+{MIN_UPGRADE_FOR_ASCENSION} mínimo</div>
          </div>
          <div className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
            <div className="text-slate-500 mb-1">Progressão</div>
            <div className="flex items-center gap-1 flex-wrap">
              {RARITY_PROGRESSION.slice(0, -1).map((rar, i) => (
                <span key={rar} className="flex items-center gap-1">
                  <span className="font-bold px-1.5 py-0.5 border text-[10px]"
                    style={{ color: RARITY_COLORS[rar], borderColor: RARITY_COLORS[rar] + '66', backgroundColor: RARITY_COLORS[rar] + '18' }}>
                    {RARITY_LABELS[rar]}
                  </span>
                  {i < RARITY_PROGRESSION.length - 2 && (
                    <span className="text-slate-700 text-[10px]">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Conteúdo da aba ── */}
      <div className="border border-slate-700 bg-slate-900 p-4">
        {tab === 'enhancement' && <EnhancementTab />}
        {tab === 'ascension'   && <AscensionTab />}
      </div>
    </div>
  )
}
