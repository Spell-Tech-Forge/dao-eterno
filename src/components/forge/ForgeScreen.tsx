import { useState, useMemo } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { RARITY_COLORS, RARITY_LABELS, RARITY_PROGRESSION } from '../../types'
import type { InventoryItem } from '../../types'
import {
  effectiveRarity, itemStatMultiplier, upgradeFailChance,
  enhancementCost, ascensionCost, repairCost, itemMaxDurability,
  MAX_UPGRADE_LEVEL, MIN_UPGRADE_FOR_ASCENSION,
} from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'

interface Props { onBack: () => void }

const EQUIP_TYPES = ['weapon', 'armor', 'accessory'] as const

// ── Item compacto na lista ────────────────────────────────────────
function ItemRow({
  item, selected, onClick,
}: { item: InventoryItem; selected: boolean; onClick: () => void }) {
  const def = useGameDataStore.getState().items[item.definitionId]
  if (!def) return null
  const tier = item.ascensionTier ?? 0
  const lvl  = item.upgradeLevel  ?? 0
  const eff  = effectiveRarity(def.rarity, tier)
  const color = RARITY_COLORS[eff]

  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left"
      style={{
        borderColor: selected ? color : color + '44',
        backgroundColor: selected ? color + '18' : 'transparent',
      }}>
      <span className="shrink-0"><SpriteImg id={def.id} emoji={def.emoji} kind="item" size={20} /></span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text truncate">{def.name}</div>
        <div className="text-[10px]" style={{ color }}>{RARITY_LABELS[eff]}</div>
      </div>
      {lvl > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
          style={{ color, borderColor: color + '66' }}>+{lvl}</span>
      )}
    </button>
  )
}

// ── Linha de custo (material) ─────────────────────────────────────
function CostRow({ itemId, quantity, items }: { itemId: string; quantity: number; items: InventoryItem[] }) {
  const def  = useGameDataStore.getState().items[itemId]
  const have = items.find(i => i.definitionId === itemId)?.quantity ?? 0
  const ok   = have >= quantity
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span>{def?.emoji}</span>
      <span className="flex-1 text-muted">{def?.name}</span>
      <span className="font-bold tabular-nums" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
        {have}/{quantity}
      </span>
    </div>
  )
}

// ── Tab Aprimoramento ─────────────────────────────────────────────
function EnhancementTab({ onBack: _ }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastResult, setLastResult]  = useState<{ success: boolean } | null>(null)

  const { items, upgradeItem } = useInventoryStore()

  const equipItems = useMemo(() =>
    items.filter(i => EQUIP_TYPES.includes(useGameDataStore.getState().items[i.definitionId]?.type as typeof EQUIP_TYPES[number])),
    [items],
  )

  const selected = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? useGameDataStore.getState().items[selected.definitionId] : null

  const currentLvl = selected?.upgradeLevel ?? 0
  const targetLvl  = currentLvl + 1
  const atMax      = currentLvl >= MAX_UPGRADE_LEVEL
  const costs      = !atMax ? enhancementCost(targetLvl) : []
  const failPct    = !atMax ? upgradeFailChance(targetLvl) : 0
  const hasMats    = costs.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const canUpgrade = !!selected && !atMax && hasMats

  const tier = selected?.ascensionTier ?? 0
  const effRarity = selectedDef ? effectiveRarity(selectedDef.rarity, tier) : 'common'
  const color = RARITY_COLORS[effRarity]

  function projectedStat(base: number | undefined): string {
    if (!base) return '—'
    const before = Math.round(base * itemStatMultiplier(currentLvl, tier))
    const after  = Math.round(base * itemStatMultiplier(targetLvl,  tier))
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
      {/* Lista de itens */}
      <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh]">
        {equipItems.length === 0
          ? <p className="text-xs text-muted p-2">Nenhum equipamento no inventário.</p>
          : equipItems.map(item => (
              <ItemRow key={item.instanceId} item={item}
                selected={selectedId === item.instanceId}
                onClick={() => { setSelectedId(item.instanceId); setLastResult(null) }} />
            ))
        }
      </div>

      {/* Painel de detalhe */}
      {selected && selectedDef ? (
        <div className="flex-1 rounded-xl border p-4 space-y-4"
          style={{ borderColor: color + '66' }}>

          {/* Header do item */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '22' }}>
              <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={44} />
            </div>
            <div>
              <div className="font-bold text-text">{selectedDef.name}</div>
              <div className="text-xs mt-0.5" style={{ color }}>{RARITY_LABELS[effRarity]}</div>
              <div className="text-xs text-muted mt-0.5">
                Nível atual: <span className="font-bold text-text">+{currentLvl}</span>
                {atMax && <span className="ml-1 text-jade">(máximo)</span>}
              </div>
            </div>
          </div>

          {!atMax && (
            <>
              {/* Projeção de stats */}
              {selectedDef.stats && (
                <div className="rounded-lg bg-surface-2 border border-border p-3 space-y-1.5 text-xs">
                  <div className="text-muted uppercase tracking-widest text-[10px] mb-1">+{currentLvl} → +{targetLvl}</div>
                  {selectedDef.stats.atk   != null && <div className="flex justify-between"><span className="text-muted">Ataque</span>    <span className="font-bold text-text">{projectedStat(selectedDef.stats.atk)}</span></div>}
                  {selectedDef.stats.def   != null && <div className="flex justify-between"><span className="text-muted">Defesa</span>    <span className="font-bold text-text">{projectedStat(selectedDef.stats.def)}</span></div>}
                  {selectedDef.stats.hp    != null && <div className="flex justify-between"><span className="text-muted">HP</span>         <span className="font-bold text-text">{projectedStat(selectedDef.stats.hp)}</span></div>}
                  {selectedDef.stats.crit  != null && <div className="flex justify-between"><span className="text-muted">Crítico</span>   <span className="font-bold text-text">{projectedStat(selectedDef.stats.crit)}%</span></div>}
                </div>
              )}

              {/* Custo */}
              <div className="space-y-1.5">
                <div className="text-xs text-muted uppercase tracking-widest">Materiais necessários</div>
                {costs.map(c => <CostRow key={c.itemId} itemId={c.itemId} quantity={c.quantity} items={items} />)}
              </div>

              {/* Chance de falha */}
              {failPct > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Chance de falha</span>
                    <span className="font-bold text-danger">{failPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-danger transition-all" style={{ width: `${failPct}%` }} />
                  </div>
                  <div className="text-[10px] text-muted">Falha perde os materiais mas não o item.</div>
                </div>
              )}

              {/* Resultado */}
              {lastResult && (
                <div className={`text-center text-sm font-bold py-2 rounded-lg border ${
                  lastResult.success
                    ? 'bg-jade/10 border-jade text-jade'
                    : 'bg-danger/10 border-danger text-danger'
                }`}>
                  {lastResult.success ? `✅ Aprimorado para +${currentLvl}!` : '❌ Falhou! Materiais perdidos.'}
                </div>
              )}

              <button onClick={handleUpgrade} disabled={!canUpgrade}
                className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-colors ${
                  canUpgrade
                    ? 'bg-jade/20 border-jade text-jade hover:bg-jade/30'
                    : 'bg-surface-2 border-border text-muted cursor-not-allowed'
                }`}>
                {hasMats ? `Aprimorar para +${targetLvl}` : 'Materiais insuficientes'}
              </button>
            </>
          )}

          {atMax && (
            <div className="text-center text-jade text-sm py-4">
              ✨ Este item atingiu o nível máximo de aprimoramento (+15).
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-surface flex items-center justify-center text-muted text-sm">
          Selecione um equipamento para aprimorar.
        </div>
      )}
    </div>
  )
}

// ── Tab Ascensão ──────────────────────────────────────────────────
function AscensionTab({ onBack: _ }: { onBack: () => void }) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [sacrificeIds, setSacrificeIds] = useState<string[]>([])
  const [lastResult,   setLastResult]   = useState<{ success: boolean; reason?: string } | null>(null)

  const { items, ascendItem } = useInventoryStore()

  const eligibleItems = useMemo(() =>
    items.filter(i => {
      const def = useGameDataStore.getState().items[i.definitionId]
      if (!EQUIP_TYPES.includes(def?.type as typeof EQUIP_TYPES[number])) return false
      if ((i.upgradeLevel ?? 0) < MIN_UPGRADE_FOR_ASCENSION) return false
      if ((i.ascensionTier ?? 0) >= 5) return false
      return true
    }),
    [items],
  )

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? useGameDataStore.getState().items[selected.definitionId] : null

  const tier       = selected?.ascensionTier ?? 0
  const nextTier   = tier + 1
  const effRarity  = selectedDef ? effectiveRarity(selectedDef.rarity, tier) : 'common'
  const nextRarity = selectedDef ? effectiveRarity(selectedDef.rarity, nextTier) : 'uncommon'
  const color      = RARITY_COLORS[effRarity]
  const nextColor  = RARITY_COLORS[nextRarity]

  const { materials, sacrificeCount } = selected
    ? ascensionCost(tier)
    : { materials: [], sacrificeCount: 0 }

  // Cópias disponíveis: mesmo def, mesma tier, não é o item selecionado
  const availableSacrifices = useMemo(() => {
    if (!selected) return []
    return items.filter(i =>
      i.instanceId !== selectedId &&
      i.definitionId === selected.definitionId &&
      (i.ascensionTier ?? 0) === tier
    )
  }, [items, selected, selectedId, tier])

  const hasMats = materials.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const canAscend = !!selected && hasMats && sacrificeIds.length === sacrificeCount

  function toggleSacrifice(instanceId: string) {
    setSacrificeIds(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : prev.length < sacrificeCount
          ? [...prev, instanceId]
          : prev
    )
  }

  function handleAscend() {
    if (!selectedId) return
    const result = ascendItem(selectedId, sacrificeIds)
    setLastResult(result)
    if (result.success) {
      setSacrificeIds([])
      setSelectedId(null)
    }
    setTimeout(() => setLastResult(null), 2500)
  }

  function selectItem(id: string) {
    setSelectedId(id)
    setSacrificeIds([])
    setLastResult(null)
  }

  return (
    <div className="flex gap-4">
      {/* Lista */}
      <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh]">
        {eligibleItems.length === 0 ? (
          <p className="text-xs text-muted p-2">
            Nenhum item elegível. Aprimoramento mínimo: +{MIN_UPGRADE_FOR_ASCENSION}.
          </p>
        ) : eligibleItems.map(item => (
          <ItemRow key={item.instanceId} item={item}
            selected={selectedId === item.instanceId}
            onClick={() => selectItem(item.instanceId)} />
        ))}
      </div>

      {/* Painel */}
      {selected && selectedDef ? (
        <div className="flex-1 rounded-xl border p-4 space-y-4" style={{ borderColor: color + '66' }}>

          {/* Rarity arrow */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: color + '22' }}>{selectedDef.emoji}</div>
            <div className="flex-1">
              <div className="font-bold text-text">{selectedDef.name}
                <span className="ml-2 text-xs font-normal text-muted">+{selected.upgradeLevel ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{ color, borderColor: color + '66' }}>{RARITY_LABELS[effRarity]}</span>
                <span className="text-muted text-xs">→</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{ color: nextColor, borderColor: nextColor + '66' }}>{RARITY_LABELS[nextRarity]}</span>
              </div>
            </div>
          </div>

          {/* Materiais */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted uppercase tracking-widest">Materiais necessários</div>
            {materials.map(c => <CostRow key={c.itemId} itemId={c.itemId} quantity={c.quantity} items={items} />)}
          </div>

          {/* Sacrifícios */}
          <div className="space-y-2">
            <div className="text-xs text-muted uppercase tracking-widest">
              Sacrificar {sacrificeCount}× {selectedDef.name}
              <span className="ml-1 normal-case tracking-normal">(mesma raridade)</span>
            </div>
            {availableSacrifices.length === 0 ? (
              <p className="text-xs text-danger">
                Sem cópias disponíveis. Necessário: {sacrificeCount}.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableSacrifices.map(sac => {
                  const isSelected = sacrificeIds.includes(sac.instanceId)
                  const sacLvl = sac.upgradeLevel ?? 0
                  return (
                    <button key={sac.instanceId}
                      onClick={() => toggleSacrifice(sac.instanceId)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors"
                      style={{
                        borderColor: isSelected ? '#ef4444' : color + '55',
                        backgroundColor: isSelected ? '#ef444418' : color + '0d',
                        color: isSelected ? '#ef4444' : color,
                      }}>
                      <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={14} /> +{sacLvl}
                      {isSelected && ' ✓'}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="text-[10px] text-muted">
              Selecionados: {sacrificeIds.length}/{sacrificeCount}
            </div>
          </div>

          {/* Multiplicador de stats */}
          <div className="rounded-lg bg-surface-2 border border-border p-3 text-xs space-y-1">
            <div className="text-muted uppercase tracking-widest text-[10px] mb-1">Bônus após ascensão</div>
            <div className="flex justify-between">
              <span className="text-muted">Multiplicador atual</span>
              <span className="font-bold text-text">×{itemStatMultiplier(selected.upgradeLevel ?? 0, tier).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Após ascensão</span>
              <span className="font-bold" style={{ color: nextColor }}>×{itemStatMultiplier(selected.upgradeLevel ?? 0, nextTier).toFixed(2)}</span>
            </div>
          </div>

          {lastResult && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg border ${
              lastResult.success
                ? 'bg-jade/10 border-jade text-jade'
                : 'bg-danger/10 border-danger text-danger'
            }`}>
              {lastResult.success ? '✨ Ascensão concluída!' : `❌ ${lastResult.reason}`}
            </div>
          )}

          <button onClick={handleAscend} disabled={!canAscend}
            className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-colors ${
              canAscend
                ? 'bg-jade/20 border-jade text-jade hover:bg-jade/30'
                : 'bg-surface-2 border-border text-muted cursor-not-allowed'
            }`}>
            {canAscend ? 'Ascender' : !hasMats ? 'Materiais insuficientes' : `Selecione ${sacrificeCount - sacrificeIds.length} cópia(s)`}
          </button>
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-surface flex flex-col items-center justify-center text-muted text-sm gap-2 p-6 text-center">
          <div>Selecione um equipamento para ascender.</div>
          <div className="text-xs">Requer aprimoramento mínimo +{MIN_UPGRADE_FOR_ASCENSION}.</div>
        </div>
      )}
    </div>
  )
}

// ── Tab Reparo ────────────────────────────────────────────────────
function RepairTab({ onBack: _ }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastResult, setLastResult]  = useState<{ success: boolean; reason?: string } | null>(null)

  const { items, repairItem } = useInventoryStore()

  const repairableItems = useMemo(() =>
    items.filter(i => {
      const def = useGameDataStore.getState().items[i.definitionId]
      return EQUIP_TYPES.includes(def?.type as typeof EQUIP_TYPES[number]) && i.durability !== undefined
    }),
    [items],
  )

  const selected    = selectedId ? items.find(i => i.instanceId === selectedId) : null
  const selectedDef = selected ? useGameDataStore.getState().items[selected.definitionId] : null

  const upgLvl  = selected?.upgradeLevel  ?? 0
  const ascTier = selected?.ascensionTier ?? 0
  const effRar  = selectedDef ? effectiveRarity(selectedDef.rarity, ascTier) : 'common'
  const color   = RARITY_COLORS[effRar]
  const maxDur  = itemMaxDurability(upgLvl)
  const curDur  = selected?.durability ?? maxDur
  const durPct  = Math.round((curDur / maxDur) * 100)
  const durColor = durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444'
  const costs   = selected ? repairCost(curDur, upgLvl) : []
  const hasMats = costs.every(c => (items.find(i => i.definitionId === c.itemId)?.quantity ?? 0) >= c.quantity)
  const canRepair = !!selected && curDur < maxDur && hasMats

  function handleRepair() {
    if (!selectedId) return
    const result = repairItem(selectedId)
    setLastResult(result)
    setTimeout(() => setLastResult(null), 2000)
  }

  return (
    <div className="flex gap-4">
      {/* Lista */}
      <div className="w-56 shrink-0 space-y-1 overflow-y-auto max-h-[60vh]">
        {repairableItems.length === 0 ? (
          <p className="text-xs text-muted p-2">Nenhum equipamento com durabilidade.</p>
        ) : repairableItems.map(item => {
          const def = useGameDataStore.getState().items[item.definitionId]
          if (!def) return null
          const lvl    = item.upgradeLevel ?? 0
          const mDur   = itemMaxDurability(lvl)
          const dPct   = Math.round(((item.durability ?? mDur) / mDur) * 100)
          const dColor = dPct > 50 ? '#22c55e' : dPct > 20 ? '#f59e0b' : '#ef4444'
          const eff    = effectiveRarity(def.rarity, item.ascensionTier ?? 0)
          const col    = RARITY_COLORS[eff]
          return (
            <button key={item.instanceId}
              onClick={() => { setSelectedId(item.instanceId); setLastResult(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left"
              style={{
                borderColor: selectedId === item.instanceId ? col : col + '44',
                backgroundColor: selectedId === item.instanceId ? col + '18' : 'transparent',
              }}>
              <span className="shrink-0"><SpriteImg id={def.id} emoji={def.emoji} kind="item" size={20} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text truncate">{def.name}{lvl > 0 ? ` +${lvl}` : ''}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${dPct}%`, backgroundColor: dColor }} />
                  </div>
                  <span className="text-[10px]" style={{ color: dColor }}>{dPct}%</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Painel */}
      {selected && selectedDef ? (
        <div className="flex-1 rounded-xl border p-4 space-y-4" style={{ borderColor: color + '66' }}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: color + '22' }}>{selectedDef.emoji}</div>
            <div>
              <div className="font-bold text-text">
                {selectedDef.name}
                {upgLvl > 0 && <span className="ml-2 text-sm font-normal" style={{ color }}>+{upgLvl}</span>}
              </div>
              <div className="text-xs mt-0.5" style={{ color }}>{RARITY_LABELS[effRar]}</div>
            </div>
          </div>

          {/* Barra de durabilidade */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Durabilidade</span>
              <span className="font-bold" style={{ color: durColor }}>{curDur} / {maxDur} ({durPct}%)</span>
            </div>
            <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${durPct}%`, backgroundColor: durColor }} />
            </div>
            {upgLvl > 0 && (
              <div className="text-[10px] text-muted">
                Durabilidade máxima aumentada pelo aprimoramento +{upgLvl} ({maxDur} vs 100 base)
              </div>
            )}
          </div>

          {curDur < maxDur ? (
            <>
              {/* Custo */}
              <div className="space-y-1.5">
                <div className="text-xs text-muted uppercase tracking-widest">Custo de reparo</div>
                {costs.map(c => <CostRow key={c.itemId} itemId={c.itemId} quantity={c.quantity} items={items} />)}
              </div>

              {lastResult && (
                <div className={`text-center text-sm font-bold py-2 rounded-lg border ${
                  lastResult.success
                    ? 'bg-jade/10 border-jade text-jade'
                    : 'bg-danger/10 border-danger text-danger'
                }`}>
                  {lastResult.success ? '🔧 Reparado!' : `❌ ${lastResult.reason}`}
                </div>
              )}

              <button onClick={handleRepair} disabled={!canRepair}
                className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-colors ${
                  canRepair
                    ? 'bg-jade/20 border-jade text-jade hover:bg-jade/30'
                    : 'bg-surface-2 border-border text-muted cursor-not-allowed'
                }`}>
                {hasMats ? '🔧 Reparar' : 'Materiais insuficientes'}
              </button>
            </>
          ) : (
            <div className="text-center text-jade text-sm py-4">✅ Durabilidade completa.</div>
          )}
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-surface flex items-center justify-center text-muted text-sm">
          Selecione um equipamento para reparar.
        </div>
      )}
    </div>
  )
}

// ── ForgeScreen ───────────────────────────────────────────────────
type ForgeTab = 'enhancement' | 'ascension' | 'repair'

export function ForgeScreen({ onBack }: Props) {
  const [tab, setTab] = useState<ForgeTab>('enhancement')

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text flex-1">Ascensão & Aprimoramento</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        <button onClick={() => setTab('enhancement')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'enhancement' ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          ⚒️ Aprimoramento
        </button>
        <button onClick={() => setTab('ascension')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'ascension' ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          ✨ Ascensão
        </button>
        <button onClick={() => setTab('repair')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'repair' ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          🔧 Reparo
        </button>
      </div>

      {/* Info cards */}
      {tab === 'enhancement' && (
        <div className="grid grid-cols-3 gap-2 text-xs text-muted">
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Bônus por nível</div>
            <div>+5% nos stats base</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Máximo</div>
            <div>+{MAX_UPGRADE_LEVEL} (50% falha)</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Falha</div>
            <div>+6 a +15 têm risco</div>
          </div>
        </div>
      )}
      {tab === 'ascension' && (
        <div className="grid grid-cols-3 gap-2 text-xs text-muted">
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Bônus por tier</div>
            <div>+15% nos stats base</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Requisito</div>
            <div>Item com +{MIN_UPGRADE_FOR_ASCENSION} mínimo</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="font-bold text-text mb-0.5">Progressão</div>
            <div>{RARITY_PROGRESSION.slice(0, -1).map(r => RARITY_LABELS[r]).join(' → ')}</div>
          </div>
        </div>
      )}

      {tab === 'enhancement' && <EnhancementTab onBack={onBack} />}
      {tab === 'ascension'   && <AscensionTab   onBack={onBack} />}
      {tab === 'repair'      && <RepairTab       onBack={onBack} />}
    </div>
  )
}
