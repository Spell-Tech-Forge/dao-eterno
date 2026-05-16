import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { MONSTER_DEFS } from '../../data/monsters'
import { BIOME_DEFS } from '../../data/biomes'
import { ITEM_DEFS } from '../../data/items'
import { useCombatStore } from '../../store/combatStore'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { spawnEnemy, rollRarity, rollDamage, rollDrops, enemyAtk, enemyDef, qiRewardScaled, goldRewardScaled } from '../../utils/combat'
import { computeAtk, computeDef, computeCrit } from '../../utils/stats'
import { RARITY_LABELS, RARITY_COLORS, RARITY_PROGRESSION } from '../../types'
import type { Rarity } from '../../types'
import { PlayerCard } from './PlayerCard'
import { EnemyCard } from './EnemyCard'
import { CombatLog } from './CombatLog'
import { SpriteImg } from '../ui/SpriteImg'
import { useAuthStore } from '../../store/authStore'
import spriteMasculino from '../../assets/personagem_masculino_sprite.png'
import spriteFeminino  from '../../assets/personagem_feminino_sprite.png'

interface Props {
  biomeId: string
  onExit: () => void
  onDeath?: (causeOfDeath: string) => void
}

let combatInterval: ReturnType<typeof setInterval> | null = null

function DropsAccordion({ drops }: { drops: { itemId: string; quantity: number }[] }) {
  const [open, setOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of drops) map.set(d.itemId, (map.get(d.itemId) ?? 0) + d.quantity)
    return Array.from(map.entries()).map(([itemId, quantity]) => ({ itemId, quantity }))
  }, [drops])

  const totalTypes = grouped.length
  const totalItems = grouped.reduce((s, d) => s + d.quantity, 0)

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-2 transition-colors">
        <span className="font-semibold text-text">
          🎁 Drops coletados
          <span className="ml-2 text-xs text-muted font-normal">{totalItems} itens · {totalTypes} tipo{totalTypes !== 1 ? 's' : ''}</span>
        </span>
        <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-border pt-2">
          {grouped.map(d => {
            const def = ITEM_DEFS[d.itemId]
            return (
              <span key={d.itemId} className="text-xs bg-surface-2 border border-border rounded px-2 py-1">
                {def?.emoji} {def?.name ?? d.itemId} ×{d.quantity}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CombatScreen({ biomeId, onExit, onDeath }: Props) {
  const biome  = BIOME_DEFS[biomeId]
  const gender = useAuthStore(s => s.activeCharacter?.gender ?? 'masculino')
  const playerSprite = gender === 'feminino' ? spriteFeminino : spriteMasculino

  const currentEnemy    = useCombatStore((s) => s.currentEnemy)
  const killCount       = useCombatStore((s) => s.killCount)
  const qiGained        = useCombatStore((s) => s.qiGained)
  const goldGained      = useCombatStore((s) => s.goldGained)
  const drops           = useCombatStore((s) => s.drops)
  const log             = useCombatStore((s) => s.log)
  const awaitingChoice  = useCombatStore((s) => s.awaitingChoice)
  const nextEnemyId     = useCombatStore((s) => s.nextEnemyId)
  const nextEnemyRarity = useCombatStore((s) => s.nextEnemyRarity)
  const startCombat     = useCombatStore((s) => s.startCombat)
  const endCombat       = useCombatStore((s) => s.endCombat)
  const setEnemy        = useCombatStore((s) => s.setEnemy)
  const damageEnemy     = useCombatStore((s) => s.damageEnemy)
  const onEnemyKilled   = useCombatStore((s) => s.onEnemyKilled)
  const confirmContinue = useCombatStore((s) => s.confirmContinue)
  const addLog          = useCombatStore((s) => s.addLog)

  const { takeDamage, gainQi, gainGold, attributes } = usePlayerStore()
  const addItem         = useInventoryStore((s) => s.addItem)
  const equippedItems   = useInventoryStore((s) => s.equipped)
  const reduceDurability = useInventoryStore((s) => s.reduceDurability)
  const recordKill      = useBestiaryStore((s) => s.recordKill)

  const weaponDef = equippedItems.weapon ? ITEM_DEFS[equippedItems.weapon.definitionId] : null
  const armorDef  = equippedItems.armor  ? ITEM_DEFS[equippedItems.armor.definitionId]  : null

  const playerAtk  = computeAtk(attributes.strength)  + (weaponDef?.stats?.atk  ?? 0)
  const playerDef  = computeDef(attributes.defense)   + (armorDef?.stats?.def   ?? 0)
  const playerCrit = computeCrit(attributes.perception) + (weaponDef?.stats?.crit ?? 0)

  const spawnNext = useCallback((enemyId: string, forcedRarity?: import('../../types').Rarity) => {
    const def = MONSTER_DEFS[enemyId]
    if (!def) return
    const enemy = spawnEnemy(def, forcedRarity)
    setEnemy(enemy)
    addLog('enter', `${def.name} [${RARITY_LABELS[enemy.rarity]}] aparece!`)
  }, [setEnemy, addLog])

  useEffect(() => {
    startCombat(biomeId)
    return () => { if (combatInterval) { clearInterval(combatInterval); combatInterval = null } }
  }, [biomeId, startCombat])

  // Spawn primeiro inimigo
  useEffect(() => {
    if (!currentEnemy && !awaitingChoice) {
      const pool = biome.enemyPool
      const enemyId = pool[Math.floor(Math.random() * pool.length)]
      spawnNext(enemyId, rollRarity(biome.normalRarityWeights))
    }
  }, [currentEnemy, awaitingChoice, spawnNext, biome])

  // Tick de combate
  useEffect(() => {
    if (awaitingChoice || !currentEnemy) {
      if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
      return
    }
    if (combatInterval) clearInterval(combatInterval)

    combatInterval = setInterval(() => {
      const store = useCombatStore.getState()
      const playerStore = usePlayerStore.getState()
      const enemy = store.currentEnemy
      if (!enemy || store.awaitingChoice) return

      const def = MONSTER_DEFS[enemy.definitionId]
      if (!def) return

      // Jogador ataca
      const { damage: pDmg, isCrit } = rollDamage(playerAtk, playerCrit)
      const actualPDmg = Math.max(1, pDmg - enemyDef(def, enemy))
      damageEnemy(actualPDmg)
      addLog('player_attack', `Você atacou por ${actualPDmg}${isCrit ? ' (CRÍTICO!)' : ''}`)

      const updated = useCombatStore.getState().currentEnemy
      if (updated && updated.currentHp <= 0) {
        const dropsRolled = rollDrops(def, enemy.rarity, usePlayerStore.getState().luck)
        dropsRolled.forEach(d => addItem(d.itemId, d.quantity))
        const qi   = qiRewardScaled(def.qiReward, enemy.rarity)
        const gold = goldRewardScaled(def.goldReward.min, def.goldReward.max, enemy.rarity)
        gainQi(qi)
        gainGold(gold)
        recordKill(def.id, dropsRolled.map(d => d.itemId))

        // Calcula próximo inimigo com boss randômico
        const killsSinceBoss = store.killsSinceLastBoss
        let nextId: string
        if (def.isBoss) {
          // Após boss: reinicia com inimigo aleatório
          nextId = biome.enemyPool[Math.floor(Math.random() * biome.enemyPool.length)]
        } else if (
          biome.bossId &&
          killsSinceBoss + 1 >= biome.minKillsBeforeBoss &&
          Math.random() < biome.bossSpawnChance
        ) {
          nextId = biome.bossId
        } else {
          nextId = biome.enemyPool[Math.floor(Math.random() * biome.enemyPool.length)]
        }

        const nextDef = MONSTER_DEFS[nextId]
        const preRolledRarity = nextDef
          ? (nextDef.isBoss ? biome.bossRarity : rollRarity(biome.normalRarityWeights))
          : 'common'
        reduceDurability('weapon', 1)
        addLog('player_kill', `${def.name} derrotado! +${qi} Qi, +${gold} 🪙`)
        if (dropsRolled.length > 0) {
          addLog('drop', `Drops: ${dropsRolled.map(d => `${ITEM_DEFS[d.itemId]?.name ?? d.itemId} ×${d.quantity}`).join(', ')}`)
        }
        onEnemyKilled(qi, gold, dropsRolled, nextId, preRolledRarity, def.isBoss)
        return
      }

      // Inimigo ataca jogador
      if (playerStore.hp <= 0) return
      const eDmg = Math.max(1, enemyAtk(def, enemy) - playerDef)
      takeDamage(eDmg)
      reduceDurability('armor', 0.5)
      addLog('enemy_attack', `${def.name} atacou por ${eDmg}`)

      if (usePlayerStore.getState().hp <= 0) {
        if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
        if (onDeath) {
          addLog('death', '💀 Você foi derrotado! O Caminho chega ao fim...')
          const cause = def?.name ? `Derrotado por ${def.name}` : 'Derrotado em batalha'
          setTimeout(() => { endCombat(); onDeath(cause) }, 2000)
        } else {
          addLog('death', 'Você foi derrotado! Retornando à base...')
          setTimeout(() => { usePlayerStore.getState().restoreHp(1); endCombat(); onExit() }, 1500)
        }
      }
    }, 1000)

    return () => { if (combatInterval) { clearInterval(combatInterval); combatInterval = null } }
  }, [awaitingChoice, currentEnemy?.definitionId])

  const handleFlee = () => {
    addLog('flee', 'Você fugiu e voltou à base.')
    if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
    endCombat()
    onExit()
  }

  const handleContinue = () => {
    const { nextEnemyId: storedNextId, nextEnemyRarity: storedNextRarity } = useCombatStore.getState()
    confirmContinue()
    if (storedNextId) spawnNext(storedNextId, storedNextRarity ?? undefined)
  }

  const nextDef    = nextEnemyId     ? MONSTER_DEFS[nextEnemyId] : null
  const nextRarity = nextEnemyRarity ?? (nextDef?.rarity ?? 'common')

  // ── Auto-batalha ─────────────────────────────────────────────────
  const [autoBattle, setAutoBattle]         = useState(false)
  const [stopAtRarity, setStopAtRarity]     = useState<Rarity | 'never' | 'always'>('spiritual')
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    if (!autoBattle || !awaitingChoice) return

    if (stopAtRarity === 'always') { /* nunca parar — segue em frente */ }
    else {
      const isBossStop   = nextDef?.isBoss ?? false
      const rarityIndex  = RARITY_PROGRESSION.indexOf(nextRarity as Rarity)
      const threshIndex  = stopAtRarity !== 'never' ? RARITY_PROGRESSION.indexOf(stopAtRarity) : 999
      const isRarityStop = rarityIndex >= threshIndex
      if (isBossStop || isRarityStop) return // deixa o painel normal aparecer
    }

    autoTimerRef.current = setTimeout(() => { handleContinue() }, 1000)
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [autoBattle, awaitingChoice, nextEnemyId, nextRarity, stopAtRarity])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-3">

        <div className="flex items-center justify-center">
          <div className="text-sm font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
            style={{ color: biome.theme.accentColor, borderColor: biome.theme.accentColor + '66' }}>
            {biome.name}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1"><PlayerCard /></div>
          <div className="flex-1">
            {currentEnemy ? <EnemyCard enemy={currentEnemy} /> : (
              <div className="rounded-xl border border-border bg-black/30 p-3 flex items-center justify-center h-full text-muted text-sm">
                Aguardando...
              </div>
            )}
          </div>
        </div>

        {/* Arena de batalha */}
        <div
          className="relative flex items-end justify-around py-4 overflow-hidden rounded-xl border border-border"
          style={{
            minHeight: 200,
            background: `linear-gradient(to bottom, ${biome.theme.accentColor}08, transparent)`,
          }}
        >
          {/* Personagem */}
          <div className="flex flex-col items-center gap-1 z-10">
            <img
              src={playerSprite}
              alt="personagem"
              className="object-contain object-bottom select-none"
              style={{
                height: 180,
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 16px rgba(168,85,247,0.35))',
              }}
              draggable={false}
            />
          </div>

          {/* VS */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="text-xs font-bold tracking-[0.4em] opacity-20 select-none"
              style={{ color: biome.theme.accentColor }}
            >
              VS
            </span>
          </div>

          {/* Monstro */}
          <div className="flex flex-col items-center gap-1 z-10">
            {currentEnemy ? (
              <SpriteImg
                id={currentEnemy.definitionId}
                emoji={MONSTER_DEFS[currentEnemy.definitionId]?.emoji ?? '👾'}
                kind="monster"
                size={160}
                style={{ filter: `drop-shadow(0 4px 16px ${biome.theme.accentColor}55)` }}
              />
            ) : (
              <span className="text-7xl opacity-30">❓</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/30 px-4 py-2 flex items-center gap-4 text-sm flex-wrap">
          <span>⚔️ {killCount} kills</span>
          <span className="text-qi">🔮 +{qiGained} Qi</span>
          <span className="text-gold">🪙 +{goldGained}</span>

          {/* Controles de auto-batalha */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAutoBattle(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-bold transition-colors ${
                autoBattle
                  ? 'bg-jade/20 border-jade text-jade'
                  : 'border-border text-muted hover:border-muted'
              }`}>
              🤖 Auto{autoBattle ? ' ON' : ' OFF'}
            </button>

            {autoBattle && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted">Parar em:</span>
                <select
                  value={stopAtRarity}
                  onChange={e => setStopAtRarity(e.target.value as Rarity | 'never')}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-text text-xs outline-none focus:border-jade">
                  {RARITY_PROGRESSION.map(r => (
                    <option key={r} value={r}>{RARITY_LABELS[r]}+</option>
                  ))}
                  <option value="never">Só Boss</option>
                  <option value="always">Nunca parar</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {drops.length > 0 && <DropsAccordion drops={drops} />}

        {awaitingChoice && (
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="text-center font-bold text-text">
              {autoBattle
                ? (nextDef?.isBoss ? '⚠️ Boss detectado!' : `⚠️ ${RARITY_LABELS[nextRarity]} detectado!`)
                : '⚔️ Inimigo derrotado!'}{' '}
              O que deseja fazer?
            </div>
            {nextDef && (
              <div className="text-center text-sm text-muted flex items-center justify-center gap-2 flex-wrap">
                Próximo:{' '}
                <span className="font-bold text-text">{nextDef.emoji} {nextDef.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded border font-bold tracking-widest"
                  style={{ color: RARITY_COLORS[nextRarity], borderColor: RARITY_COLORS[nextRarity] + '66' }}>
                  {RARITY_LABELS[nextRarity]}
                </span>
                {nextDef.isBoss && (
                  <span className="text-xs px-1.5 py-0.5 rounded border border-gold/50 text-gold">BOSS</span>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleContinue}
                className="py-2.5 rounded-lg font-bold text-sm bg-jade/20 border border-jade text-jade hover:bg-jade/30 transition-colors">
                Continuar lutando →
              </button>
              <button onClick={handleFlee}
                className="py-2.5 rounded-lg font-bold text-sm bg-danger/10 border border-danger text-danger hover:bg-danger/20 transition-colors">
                Fugir e voltar à base
              </button>
            </div>
          </div>
        )}

        <CombatLog entries={log} />
      </div>
    </div>
  )
}
