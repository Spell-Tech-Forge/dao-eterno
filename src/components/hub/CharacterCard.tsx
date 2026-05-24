import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useAuthStore } from '../../store/authStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS, RARITY_LABELS } from '../../types'
import type { Realm, RealmStage, InventoryItem } from '../../types'
import { useGameDataStore } from '../../store/gameDataStore'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { effectiveRarity, itemStatMultiplier, itemMaxDurability } from '../../utils/forge'
import { DEFAULT_BREAKTHROUGH_PATHS, DEFAULT_STAT_CONFIG, computeSpeed } from '../../utils/stats'
import { api } from '../../lib/api'
import type { ServerCharacter } from '../../types/server'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE } from '../../types/server'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { SpriteImg } from '../ui/SpriteImg'


function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}


const ATTR_EMOJI: Record<string, string> = {
  strength: '⚡', agility: '💨', vitality: '❤️', defense: '🛡️', perception: '👁️',
}

export function CharacterCard() {
  const {
    name, hp, qi, maxQi, gold, luck,
    realm, realmStage, attributes, attributePoints, activeBuffs,
  } = usePlayerStore()
  const { items, equipped } = useInventoryStore()

  const stats         = useEffectiveStats()
  const itemDefs      = useGameDataStore(s => s.items)
  const forgeConfig   = useGameDataStore(s => s.forgeConfig) ?? undefined
  const breakthroughs = useGameDataStore(s => s.breakthroughs)
  const statConfig         = useGameDataStore(s => s.statConfig)
  const BREAKTHROUGH_PATHS = statConfig?.breakthroughPaths ?? DEFAULT_BREAKTHROUGH_PATHS
  const cfg                = statConfig ?? DEFAULT_STAT_CONFIG

  // Agility está com cap quando: (1) base speed já chegou ao piso de agilidade,
  // OU (2) uma arma já empurrou effectiveSpeed para o piso absoluto (minAttackSpeed).
  const isAgiCapped = (() => {
    const baseNow  = computeSpeed(attributes.agility,     cfg)
    const baseNext = computeSpeed(attributes.agility + 1, cfg)
    if (baseNext >= baseNow) return true
    if (stats.effectiveSpeed <= cfg.minAttackSpeed) return true
    return false
  })()

  const qiFull          = qi >= maxQi
  const breakthroughKey = `${realm}_${realmStage}`
  const breakthroughReq = breakthroughs[breakthroughKey]

  const canBreakthrough = qiFull && breakthroughReq && breakthroughReq.items.every(req => {
    const owned = items.find(i => i.definitionId === req.itemId)
    return owned && owned.quantity >= req.quantity
  })

  const [lastLuckGain, setLastLuckGain] = useState(0)
  const [showModal, setShowModal]       = useState(false)
  const [now, setNow]                   = useState(Date.now())
  const [isBreaking, setIsBreaking]     = useState(false)
  const [isSpending, setIsSpending]     = useState(false)

  useEffect(() => {
    if (activeBuffs.length === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeBuffs.length])

  const validBuffs = activeBuffs.filter(b => b.endsAt > now)

  async function handleBreakthrough(pathId: string) {
    if (!canBreakthrough || !breakthroughReq || isBreaking) return
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setIsBreaking(true)
    try {
      const res = await api.post<ServerCharacter & { luck_gained: number }>(
        `/api/characters/${char.id}/breakthrough`,
        { pathId }
      )
      const newRealm      = (SERVER_TO_GAME_REALM[res.realm]       ?? 'qi_refining') as Realm
      const newRealmStage = (SERVER_TO_GAME_STAGE[res.realm_stage] ?? 'initial')     as RealmStage
      usePlayerStore.setState({
        realm: newRealm, realmStage: newRealmStage,
        qi: res.qi_current, maxQi: res.qi_max,
        hp: res.hp_current, maxHp: res.hp_max,
        luck: res.luck,
        totalQiAccumulated: Number(res.cultivation_power),
        attributePoints: res.attribute_points,
        attributes: { ...usePlayerStore.getState().attributes,
          strength: res.strength, agility: res.agility, vitality: res.vitality,
          defense: res.defense, perception: res.perception },
      })
      if (res.inventory) {
        const inv = res.inventory as { items: InventoryItem[] }
        useInventoryStore.setState({ items: inv.items ?? [] })
      }
      setLastLuckGain(res.luck_gained)
      setTimeout(() => setLastLuckGain(0), 4000)
      setShowModal(false)
    } catch (err) {
      console.warn('[breakthrough]', err)
    } finally {
      setIsBreaking(false)
    }
  }

  async function handleSpendAttribute(attr: 'strength' | 'agility' | 'vitality' | 'defense' | 'perception') {
    if (attributePoints <= 0 || isSpending) return
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setIsSpending(true)
    try {
      const res = await api.post<ServerCharacter>(
        `/api/characters/${char.id}/spend-attribute`,
        { attr }
      )
      usePlayerStore.setState({
        hp: res.hp_current, maxHp: res.hp_max,
        attributePoints: res.attribute_points,
        attributes: { ...usePlayerStore.getState().attributes,
          strength: res.strength, agility: res.agility, vitality: res.vitality,
          defense: res.defense, perception: res.perception },
      })
    } catch (err) {
      console.warn('[spend-attribute]', err)
    } finally {
      setIsSpending(false)
    }
  }

  const totalBonusAtk  = stats.bonusAtk + stats.buffAtk
  const totalBonusHp   = stats.bonusHp  + stats.buffHp
  const totalBonusDef  = stats.bonusDef + stats.buffDef
  const totalBonusCrit = Math.round((stats.bonusCrit + stats.buffCrit) * 10) / 10
  const ATTRS = [
    { key: 'strength'   as const, label: 'Força',      emoji: '⚡', total: `+${stats.effectiveAtk} ATK`,               bonus: totalBonusAtk  ? `(+${totalBonusAtk} ⚡)`               : null, color: '#f97316', capped: false },
    { key: 'agility'    as const, label: 'Agilidade',  emoji: '💨', total: `${stats.effectiveSpeed.toFixed(2)}s/atk`,  bonus: stats.bonusSpeed ? `(💨 ${stats.bonusSpeed.toFixed(2)}s)` : null, color: '#60a5fa', capped: isAgiCapped },
    { key: 'vitality'   as const, label: 'Vitalidade', emoji: '❤️', total: `${stats.effectiveMaxHp} HP máx`,           bonus: totalBonusHp   ? `(+${totalBonusHp} ❤️)`                : null, color: '#22c55e', capped: false },
    { key: 'defense'    as const, label: 'Defesa',     emoji: '🛡️', total: `${stats.effectiveDef} red. dano`,          bonus: totalBonusDef  ? `(+${totalBonusDef} 🛡️)`               : null, color: '#a78bfa', capped: false },
    { key: 'perception' as const, label: 'Percepção',  emoji: '👁️', total: `+${stats.effectiveCrit}% dano crit`,       bonus: totalBonusCrit ? `(+${totalBonusCrit}% 👁️)`             : null, color: '#f59e0b', capped: false },
  ]

  const luckTotal = luck > 0 ? `+${stats.effectiveCritChance.toFixed(1)}% crit` : '—'
  const luckBonus = luck > 0 ? `+${(luck * 1.5).toFixed(1)}% drop` : null

  return (
    <div className="border border-slate-700 bg-slate-900 p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
          🧙
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-700 tracking-widest uppercase cursor-default select-none">Seita — Em Breve</div>
          <div className="text-xl font-bold text-slate-200 truncate">{name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-400">
              {REALM_NAMES[realm]} · {STAGE_NAMES[realmStage]}
            </span>
            <span className="text-xs text-amber-400">🪙 {gold.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <Button variant={canBreakthrough ? 'gold' : 'ghost'} size="sm" onClick={() => setShowModal(true)}>
          ⚡ Romper
        </Button>
      </div>

      {/* ── HP / Qi ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs w-6">HP</span>
          <StatBar value={hp} max={stats.effectiveMaxHp} color="#22c55e" />
          <span className="text-slate-500 text-xs w-20 sm:w-28 text-right tabular-nums shrink-0">{hp} / {stats.effectiveMaxHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs w-6">Qi</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{
              width: `${Math.min(100, (qi / maxQi) * 100)}%`,
              backgroundColor: qiFull ? '#f59e0b' : '#a855f7',
              boxShadow: qiFull ? '0 0 8px #f59e0b88' : 'none',
            }} />
          </div>
          <span className="text-slate-500 text-xs w-20 sm:w-28 text-right tabular-nums shrink-0">{qi.toLocaleString()} / {maxQi.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Pontos de atributo ── */}
      {attributePoints > 0 && (
        <div className="border border-teal-700/50 bg-teal-950/30 px-3 py-2 text-xs text-teal-400 font-semibold">
          ✨ {attributePoints} ponto{attributePoints > 1 ? 's' : ''} de atributo disponível{attributePoints > 1 ? 'is' : ''}
        </div>
      )}

      {/* ── Atributos + Arsenal ── */}
      <div className="flex flex-col sm:flex-row gap-4">

        {/* Atributos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Atributos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
          </div>
          <div className="space-y-2">
            {ATTRS.map(({ key, label, emoji, total, bonus, color, capped }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-base w-6 text-center">{emoji}</span>
                <span className="text-xs text-slate-500 w-20">{label}</span>
                <span className="font-bold text-slate-200 text-sm w-6 text-right">{attributes[key]}</span>
                <button
                  onClick={() => !capped && handleSpendAttribute(key)}
                  disabled={attributePoints <= 0 || isSpending || capped}
                  title={capped ? 'Este atributo já atingiu o limite máximo — pontos adicionais não teriam efeito' : undefined}
                  className={['w-5 h-5 rounded-full border text-xs font-bold leading-none transition-all',
                    capped
                      ? 'border-slate-700 text-slate-600 cursor-not-allowed'
                      : 'bg-teal-900/40 border-teal-700 text-teal-400 hover:bg-teal-800/60 disabled:cursor-not-allowed',
                    attributePoints <= 0 ? 'invisible' : ''].join(' ')}>+</button>
                <span className="text-xs pl-1 truncate" style={{ color: capped ? '#475569' : color }}>{total}</span>
                {capped
                  ? <span className="text-[9px] font-cinzel font-bold tracking-widest text-slate-600 border border-slate-700 px-1">MAX</span>
                  : bonus && <span className="text-xs text-teal-400">{bonus}</span>
                }
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="text-base w-6 text-center">🍀</span>
              <span className="text-xs text-slate-500 w-20">Sorte</span>
              <span className="font-bold text-slate-200 text-sm w-6 text-right">{luck}</span>
              {/* espaçador para alinhar com o botão + dos atributos */}
              <span className="w-5 h-5 shrink-0" />
              <span className="text-xs pl-1 truncate text-green-400">{luckTotal}</span>
              {luckBonus && <span className="text-xs text-teal-400">{luckBonus}</span>}
              {lastLuckGain > 0 && (
                <span className="text-xs text-teal-400 font-bold animate-pulse ml-1">+{lastLuckGain}!</span>
              )}
            </div>
          </div>
        </div>

        {/* Arsenal */}
        <div className="sm:w-36 sm:shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Arsenal</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-2">
          {(['weapon', 'armor', 'accessory'] as const).map(slot => {
            const eq        = equipped[slot]
            const def       = eq ? itemDefs[eq.definitionId] : null
            const upgLvl    = eq?.upgradeLevel  ?? 0
            const ascTier   = eq?.ascensionTier ?? 0
            const effRar    = def ? effectiveRarity(def.rarity, ascTier) : 'common'
            const mult      = itemStatMultiplier(upgLvl, ascTier, forgeConfig)
            const durFrac   = eq?.durability !== undefined
              ? Math.max(0, eq.durability / itemMaxDurability(upgLvl))
              : 1
            const color     = def ? RARITY_COLORS[effRar] : undefined
            const SLOT_LABEL = { weapon: 'ARMA', armor: 'ARMADURA', accessory: 'ACESSÓRIO' }[slot]
            const statLine  = def?.stats
              ? slot === 'weapon'
                ? `+${Math.round((def.stats.atk ?? 0) * mult * durFrac)} ATK`
                : slot === 'armor'
                  ? [def.stats.def && `+${Math.round(def.stats.def * mult * durFrac)} DEF`, def.stats.hp && `+${Math.round(def.stats.hp * mult * durFrac)} HP`].filter(Boolean).join(' ')
                  : null
              : null
            const durPct = eq?.durability !== undefined ? (eq.durability / itemMaxDurability(upgLvl)) * 100 : null
            return (
              <div key={slot} className="border p-2 flex flex-col gap-1 flex-1"
                style={{ borderColor: color ? color + '66' : '#334155', backgroundColor: color ? color + '0d' : undefined }}>
                <span className="text-[10px] font-cinzel font-bold tracking-widest" style={{ color: color ?? '#f59e0b' }}>
                  {SLOT_LABEL}
                </span>
                {def ? (
                  <>
                    <span className="text-xs leading-tight text-slate-300 flex items-center gap-1">
                      <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />
                      {def.name}
                      {upgLvl > 0 && <span className="font-bold" style={{ color }}>+{upgLvl}</span>}
                    </span>
                    {statLine && <span className="text-[10px] font-semibold" style={{ color }}>{statLine}</span>}
                    <span className="text-[9px] tracking-widest uppercase" style={{ color: color ? color + 'aa' : undefined }}>
                      {RARITY_LABELS[effRar]}
                    </span>
                    {durPct !== null && (
                      <div className="h-1 rounded-full bg-slate-800 overflow-hidden mt-auto">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${durPct}%`, backgroundColor: durPct > 50 ? '#22c55e' : durPct > 20 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-slate-600 italic text-xs">— vazio —</span>
                )}
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* ── Combat Stats — linha única ── */}
      <div className="bg-slate-800/60 border border-slate-700 px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Combat Stats</span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {[
            { icon: '⚔️', label: 'DPS',       value: `~${stats.effectiveDps}`                  },
            { icon: '⏱',  label: 'Velocidade', value: `${stats.effectiveSpeed.toFixed(2)}s`     },
            { icon: '💥', label: 'Crit chance', value: `${stats.effectiveCritChance.toFixed(1)}%` },
          { icon: '🎯', label: 'Crit dano',   value: `+${stats.effectiveCrit}%`                },
            { icon: '🛡️', label: 'Defesa',     value: `${stats.effectiveDef} flat`              },
          ].map(({ icon, label, value }, i, arr) => (
            <span key={label} className="flex items-center gap-1">
              <span className="text-slate-500">{icon} {label}</span>
              <span className="text-amber-400 font-bold ml-1">{value}</span>
              {i < arr.length - 1 && <span className="text-slate-700 ml-2">·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Buffs Ativos ── */}
      {validBuffs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Buffs Ativos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {validBuffs.map(buff => {
              const remaining = Math.max(0, buff.endsAt - now)
              const mins = Math.floor(remaining / 60000)
              const secs = Math.floor((remaining % 60000) / 1000)
              const parts: string[] = []
              if (buff.atk)  parts.push(`+${buff.atk} ATK`)
              if (buff.def)  parts.push(`+${buff.def} DEF`)
              if (buff.hp)   parts.push(`+${buff.hp} HP`)
              if (buff.crit) parts.push(`+${buff.crit}% Crit`)
              return (
                <div key={buff.id}
                  className="flex items-center gap-1.5 px-2 py-1 border border-violet-700/50 bg-violet-950/30 text-violet-300 text-xs">
                  <span>✨</span>
                  <span className="font-semibold">{buff.name}</span>
                  {parts.length > 0 && (
                    <span className="text-violet-400/70 text-[10px]">({parts.join(', ')})</span>
                  )}
                  <span className="tabular-nums text-violet-400/60 text-[10px] ml-1">
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal de Rompimento ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="⚡ Rompimento — Escolha o Caminho" size="lg">
        <div className="space-y-4">
          {breakthroughReq && breakthroughReq.items.length > 0 && (
            <div className="flex items-center justify-center gap-4 py-2 border border-slate-700 bg-slate-800/60">
              {breakthroughReq.items.map(req => {
                const def   = itemDefs[req.itemId]
                const owned = items.find(i => i.definitionId === req.itemId)
                const ok    = (owned?.quantity ?? 0) >= req.quantity
                return (
                  <span key={req.itemId} className="inline-flex items-center gap-1 text-xs" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
                    {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={16} />}
                    {def?.name} {owned?.quantity ?? 0}/{req.quantity}
                  </span>
                )
              })}
            </div>
          )}
          <div className="space-y-2">
            {BREAKTHROUGH_PATHS.map(path => {
              const c = canBreakthrough ? path.color : '#334155'
              const luckMin = statConfig?.luckGainMin ?? 1
              const luckMax = statConfig?.luckGainMax ?? 3
              return (
                <button key={path.id} onClick={() => handleBreakthrough(path.id)}
                  disabled={!canBreakthrough || isBreaking}
                  className={`w-full border p-4 text-left transition-all active:scale-[0.99] ${canBreakthrough && !isBreaking ? 'hover:brightness-110 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  style={{ borderColor: c + '66', backgroundColor: c + '11' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl" style={{ filter: canBreakthrough ? 'none' : 'grayscale(1)' }}>{path.emoji}</span>
                    <div>
                      <div className="font-cinzel font-bold text-sm tracking-wider" style={{ color: c }}>{path.name}</div>
                      <div className="text-xs text-slate-500">{path.desc}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(path.deltas) as [string, number][]).map(([attr, val]) => (
                      <span key={attr} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: c + '22', color: c }}>
                        {ATTR_EMOJI[attr]} +{val}
                      </span>
                    ))}
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: canBreakthrough ? '#22c55e22' : '#33415522', color: canBreakthrough ? '#22c55e' : '#334155' }}>
                      🍀 +{luckMin}~{luckMax}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          <Button variant="ghost" onClick={() => setShowModal(false)} className="w-full justify-center">
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
