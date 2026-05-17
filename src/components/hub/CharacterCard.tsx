import { useState } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS, RARITY_LABELS } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { syncToServer } from '../../lib/sync'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const AFFINITY_LABEL: Record<string, string> = {
  fire: 'Fogo', water: 'Água', lightning: 'Raio', earth: 'Terra', wind: 'Vento',
}
const AFFINITY_EMOJI: Record<string, string> = {
  fire: '🔥', water: '💧', lightning: '⚡', earth: '🌍', wind: '🌪️',
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

const BREAKTHROUGH_PATHS = [
  {
    id:     'offensive' as const,
    name:   'Caminho Ofensivo',
    emoji:  '⚔️',
    desc:   'Domínio sobre o ataque e velocidade',
    deltas: { strength: 5, agility: 5, vitality: 2, defense: 2, perception: 2 },
    color:  '#f97316',
  },
  {
    id:     'defensive' as const,
    name:   'Caminho da Resistência',
    emoji:  '🛡️',
    desc:   'Corpo inabalável, resistência suprema',
    deltas: { strength: 2, agility: 2, vitality: 5, defense: 5, perception: 2 },
    color:  '#22c55e',
  },
  {
    id:     'balanced' as const,
    name:   'Caminho do Equilíbrio',
    emoji:  '☯️',
    desc:   'Harmonia entre todos os aspectos do Dao',
    deltas: { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 3 },
    color:  '#a855f7',
  },
] as const

const ATTR_EMOJI: Record<string, string> = {
  strength: '⚡', agility: '💨', vitality: '❤️', defense: '🛡️', perception: '👁️',
}

export function CharacterCard() {
  const {
    name, hp, qi, maxQi, gold, luck,
    realm, realmStage, attributes, attributePoints,
    setQiAfterBreakthrough, spendAttributePoint, refundAttributePoint,
    fullRestoreHpTo, gainLuck, applyBreakthroughPath,
  } = usePlayerStore()
  const { items, removeItem, equipped } = useInventoryStore()

  const stats         = useEffectiveStats()
  const itemDefs      = useGameDataStore(s => s.items)
  const breakthroughs = useGameDataStore(s => s.breakthroughs)

  const qiFull          = qi >= maxQi
  const breakthroughKey = `${realm}_${realmStage}`
  const breakthroughReq = breakthroughs[breakthroughKey]

  const canBreakthrough = qiFull && breakthroughReq && breakthroughReq.items.every(req => {
    const owned = items.find(i => i.definitionId === req.itemId)
    return owned && owned.quantity >= req.quantity
  })

  const [lastLuckGain, setLastLuckGain] = useState(0)
  const [showModal, setShowModal]       = useState(false)

  function handleBreakthrough(pathId: typeof BREAKTHROUGH_PATHS[number]['id']) {
    if (!canBreakthrough || !breakthroughReq) return
    const path = BREAKTHROUGH_PATHS.find(p => p.id === pathId)!
    breakthroughReq.items.forEach(req =>
      removeItem(items.find(i => i.definitionId === req.itemId)!.instanceId, req.quantity)
    )
    setQiAfterBreakthrough(breakthroughReq.nextRealm, breakthroughReq.nextStage, breakthroughReq.newMaxQi)
    applyBreakthroughPath({ ...path.deltas })
    fullRestoreHpTo(stats.effectiveMaxHp)
    const luckGain = Math.floor(Math.random() * 3) + 1
    gainLuck(luckGain)
    setLastLuckGain(luckGain)
    setTimeout(() => setLastLuckGain(0), 4000)
    setShowModal(false)
    void syncToServer()
  }

  const ATTRS = [
    {
      key: 'strength'   as const, label: 'Força',      emoji: '⚡',
      total: `+${stats.effectiveAtk} ATK`,
      bonus: stats.bonusAtk   ? `(+${stats.bonusAtk} ⚡)`              : null,
      color: '#f97316',
    },
    {
      key: 'agility'    as const, label: 'Agilidade',  emoji: '💨',
      total: `${stats.effectiveSpeed.toFixed(2)}s/atk`,
      bonus: stats.bonusSpeed ? `(💨 ${stats.bonusSpeed.toFixed(2)}s)`  : null,
      color: '#60a5fa',
    },
    {
      key: 'vitality'   as const, label: 'Vitalidade', emoji: '❤️',
      total: `${stats.effectiveMaxHp} HP máx`,
      bonus: stats.bonusHp    ? `(+${stats.bonusHp} ❤️)`               : null,
      color: '#22c55e',
    },
    {
      key: 'defense'    as const, label: 'Defesa',     emoji: '🛡️',
      total: `${stats.effectiveDef} red. dano`,
      bonus: stats.bonusDef   ? `(+${stats.bonusDef} 🛡️)`              : null,
      color: '#a78bfa',
    },
    {
      key: 'perception' as const, label: 'Percepção',  emoji: '👁️',
      total: `${stats.effectiveCrit.toFixed(1)}% crit`,
      bonus: stats.bonusCrit  ? `(+${stats.bonusCrit.toFixed(1)}% 👁️)` : null,
      color: '#f59e0b',
    },
  ]

  return (
    <div className="border border-border bg-surface p-4 space-y-4">

      {/* ── Header: avatar + nome + botão rompimento ── */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-surface-2 border border-border flex items-center justify-center text-2xl shrink-0">
          🧙
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted/40 tracking-widest uppercase cursor-default select-none">
            Seita — Em Breve
          </div>
          <div className="text-xl font-bold text-text truncate">{name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-surface-2 border border-border px-2 py-0.5 text-muted">
              {REALM_NAMES[realm]} · {STAGE_NAMES[realmStage]}
            </span>
            <span className="text-xs text-gold">🪙 {gold.toLocaleString()}</span>
          </div>
        </div>

        <Button
          variant={canBreakthrough ? 'gold' : 'ghost'}
          size="sm"
          onClick={() => setShowModal(true)}
        >
          ⚡ Romper
        </Button>
      </div>

      {/* ── Barras de HP e Qi ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted text-xs w-6">HP</span>
          <StatBar value={hp} max={stats.effectiveMaxHp} color="#22c55e" />
          <span className="text-muted text-xs w-28 text-right tabular-nums">
            {hp} / {stats.effectiveMaxHp}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted text-xs w-6">Qi</span>
          <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (qi / maxQi) * 100)}%`,
                backgroundColor: qiFull ? '#f59e0b' : '#a855f7',
                boxShadow: qiFull ? '0 0 8px #f59e0b88' : 'none',
              }}
            />
          </div>
          <span className="text-muted text-xs w-28 text-right tabular-nums">
            {qi.toLocaleString()} / {maxQi.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Banner de pontos de atributo ── */}
      {attributePoints > 0 && (
        <div className="border border-jade/50 bg-jade/5 px-3 py-2 text-xs text-jade font-semibold">
          ✨ {attributePoints} ponto{attributePoints > 1 ? 's' : ''} de atributo disponível{attributePoints > 1 ? 'is' : ''}
        </div>
      )}

      {/* ── Atributos + Equipamentos ── */}
      <div className="flex gap-4">

        {/* Atributos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-muted">Atributos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="space-y-2">
            {ATTRS.map(({ key, label, emoji, total, bonus, color }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-base w-6 text-center">{emoji}</span>
                <span className="text-xs text-muted w-20">{label}</span>
                <span className="font-bold text-text text-sm w-6 text-right">{attributes[key]}</span>

                <button
                  onClick={() => spendAttributePoint(key)}
                  disabled={attributePoints <= 0}
                  className={[
                    'w-5 h-5 rounded-full border text-xs font-bold leading-none transition-all',
                    'bg-jade/20 border-jade text-jade hover:bg-jade/40 disabled:cursor-not-allowed',
                    attributePoints <= 0 ? 'invisible' : '',
                  ].join(' ')}
                >+</button>
                <button
                  onClick={() => refundAttributePoint(key)}
                  disabled={attributes[key] <= 1}
                  className={[
                    'w-5 h-5 rounded-full border text-xs font-bold leading-none transition-all',
                    'bg-danger/20 border-danger/60 text-danger/80 hover:bg-danger/30 disabled:cursor-not-allowed',
                    attributePoints <= 0 ? 'invisible' : '',
                  ].join(' ')}
                >−</button>

                <span className="text-xs pl-1 truncate" style={{ color }}>{total}</span>
                {bonus && <span className="text-xs text-jade">{bonus}</span>}
              </div>
            ))}

            {/* Afinidade */}
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center">{AFFINITY_EMOJI[attributes.affinity]}</span>
              <span className="text-xs text-muted w-20">Afinidade</span>
              <span className="font-bold text-text text-sm flex-1 pl-8">{AFFINITY_LABEL[attributes.affinity]}</span>
            </div>

            {/* Sorte */}
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center">🍀</span>
              <span className="text-xs text-muted w-20">Sorte</span>
              <span className="font-bold text-text text-sm w-6 text-right">{luck}</span>
              {luck > 0 && (
                <span className="text-xs pl-2" style={{ color: '#22c55e' }}>
                  -{Math.round(luck * 0.5)}% falha · +{(luck * 1.5).toFixed(1)}% drop
                </span>
              )}
              {lastLuckGain > 0 && (
                <span className="text-xs text-jade font-bold animate-pulse">+{lastLuckGain}!</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipamentos */}
        <div className="flex flex-col gap-2 w-36 shrink-0">
          <div className="flex items-center gap-2 mb-0">
            <span className="text-xs font-cinzel tracking-widest uppercase text-muted">Arsenal</span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          {(['weapon', 'armor', 'accessory'] as const).map(slot => {
            const eq        = equipped[slot]
            const def       = eq ? itemDefs[eq.definitionId] : null
            const upgLvl    = eq?.upgradeLevel  ?? 0
            const ascTier   = eq?.ascensionTier ?? 0
            const effRar    = def ? effectiveRarity(def.rarity, ascTier) : 'common'
            const mult      = itemStatMultiplier(upgLvl, ascTier)
            const color     = def ? RARITY_COLORS[effRar] : undefined
            const SLOT_LABEL = { weapon: 'ARMA', armor: 'ARMADURA', accessory: 'ACESSÓRIO' }[slot]
            const statLine  = def?.stats
              ? slot === 'weapon'
                ? `+${Math.round((def.stats.atk ?? 0) * mult)} ATK`
                : slot === 'armor'
                  ? [
                      def.stats.def && `+${Math.round(def.stats.def * mult)} DEF`,
                      def.stats.hp  && `+${Math.round(def.stats.hp  * mult)} HP`,
                    ].filter(Boolean).join(' ')
                  : null
              : null
            const durPct = eq?.durability !== undefined
              ? (eq.durability / itemMaxDurability(upgLvl)) * 100
              : null

            return (
              <div
                key={slot}
                className="border p-2 flex flex-col gap-1 flex-1"
                style={{
                  borderColor:     color ? color + '66' : '#2a2a4e',
                  backgroundColor: color ? color + '0d' : undefined,
                }}
              >
                <span className="text-[10px] font-cinzel font-bold tracking-widest"
                  style={{ color: color ?? '#f59e0b' }}>
                  {SLOT_LABEL}
                </span>

                {def ? (
                  <>
                    <span className="text-xs leading-tight">
                      {def.emoji} {def.name}
                      {upgLvl > 0 && (
                        <span className="ml-1 font-bold" style={{ color }}>+{upgLvl}</span>
                      )}
                    </span>
                    {statLine && (
                      <span className="text-[10px] font-semibold" style={{ color }}>{statLine}</span>
                    )}
                    <span className="text-[9px] tracking-widest uppercase"
                      style={{ color: color ? color + 'aa' : undefined }}>
                      {RARITY_LABELS[effRar]}
                    </span>
                    {durPct !== null && (
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden mt-auto">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${durPct}%`,
                            backgroundColor: durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-muted italic text-xs mt-auto">— vazio —</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Stats de combate ── */}
      <div className="bg-surface-2 border border-border px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-cinzel tracking-widest uppercase text-muted">Combat Stats</span>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
          {[
            { label: '⚔️ DPS estimado',   value: `~${stats.effectiveDps}` },
            { label: '⏱ Velocidade atk',  value: `${stats.effectiveSpeed.toFixed(2)}s` },
            { label: '💥 Chance crítico',  value: `${stats.effectiveCrit.toFixed(1)}%` },
            { label: '🛡️ Redução de dano', value: `${stats.effectiveDef} flat` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-muted">{label}</span>
              <span className="text-text font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal de Rompimento ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="⚡ Rompimento — Escolha o Caminho" size="lg">
        <div className="space-y-4">

          {/* Itens necessários */}
          {breakthroughReq && breakthroughReq.items.length > 0 && (
            <div className="flex items-center justify-center gap-4 py-2 border border-border bg-surface-2">
              {breakthroughReq.items.map(req => {
                const def   = itemDefs[req.itemId]
                const owned = items.find(i => i.definitionId === req.itemId)
                const ok    = (owned?.quantity ?? 0) >= req.quantity
                return (
                  <span key={req.itemId} className="text-xs" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
                    {def?.emoji} {def?.name} {owned?.quantity ?? 0}/{req.quantity}
                  </span>
                )
              })}
            </div>
          )}

          {/* Caminhos */}
          <div className="space-y-2">
            {BREAKTHROUGH_PATHS.map(path => (
              <button
                key={path.id}
                onClick={() => handleBreakthrough(path.id)}
                className="w-full border p-4 text-left transition-all hover:brightness-110 cursor-pointer active:scale-[0.99]"
                style={{ borderColor: path.color + '66', backgroundColor: path.color + '11' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{path.emoji}</span>
                  <div>
                    <div className="font-cinzel font-bold text-sm tracking-wider" style={{ color: path.color }}>
                      {path.name}
                    </div>
                    <div className="text-xs text-muted">{path.desc}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(path.deltas) as [string, number][]).map(([attr, val]) => (
                    <span
                      key={attr}
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: path.color + '22', color: path.color }}
                    >
                      {ATTR_EMOJI[attr]} +{val}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: '#22c55e22', color: '#22c55e' }}>
                    🍀 +1~3
                  </span>
                </div>
              </button>
            ))}
          </div>

          <Button variant="ghost" onClick={() => setShowModal(false)} className="w-full justify-center">
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
