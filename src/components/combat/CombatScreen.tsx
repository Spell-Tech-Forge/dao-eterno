import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useGameDataStore } from '../../store/gameDataStore'
import { useCombatStore } from '../../store/combatStore'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { spawnEnemy, rollRarity, rollDamage, rollDrops, enemyAtk, enemyDef, qiRewardScaled, goldRewardScaled } from '../../utils/combat'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { RARITY_LABELS, RARITY_COLORS, RARITY_PROGRESSION } from '../../types'
import type { Rarity } from '../../types'
import { PlayerCard } from './PlayerCard'
import { EnemyCard } from './EnemyCard'
import { EquipmentCard } from './EquipmentCard'
import { CombatLog } from './CombatLog'
import { SpriteImg } from '../ui/SpriteImg'
import spriteMasculino from '../../assets/personagem_masculino_sprite.png'
import spriteFeminino  from '../../assets/personagem_feminino_sprite.png'

interface Props {
  biomeId: string
  onExit: () => void
  onDeath?: (causeOfDeath: string) => void
}

let combatInterval: ReturnType<typeof setInterval> | null = null

// ── Drops accordion ───────────────────────────────────────────────

function DropsAccordion({ drops }: { drops: { itemId: string; quantity: number }[] }) {
  const [open, setOpen] = useState(false)
  const itemDefs = useGameDataStore(s => s.items)

  const grouped = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of drops) map.set(d.itemId, (map.get(d.itemId) ?? 0) + d.quantity)
    return Array.from(map.entries()).map(([itemId, quantity]) => ({ itemId, quantity }))
  }, [drops])

  const totalTypes = grouped.length
  const totalItems = grouped.reduce((s, d) => s + d.quantity, 0)

  return (
    <div className="border border-slate-700 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-800 transition-colors">
        <span className="font-cinzel font-semibold text-slate-200">
          Drops Coletados
          <span className="ml-2 text-xs text-slate-500 font-normal font-sans">
            {totalItems} itens · {totalTypes} tipo{totalTypes !== 1 ? 's' : ''}
          </span>
        </span>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-slate-700 pt-2">
          {grouped.map(d => {
            const def = itemDefs[d.itemId]
            return (
              <span key={d.itemId} className="inline-flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 px-2 py-1">
                {def
                  ? <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={14} />
                  : <span>❓</span>}
                {def?.name ?? d.itemId} ×{d.quantity}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Modal de morte ────────────────────────────────────────────────

function DeathModal({ cause, onConfirm }: { cause: string; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
      <div className="border border-red-900/60 bg-slate-950 w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6 text-center">

        <div className="text-7xl select-none" style={{ filter: 'drop-shadow(0 0 24px #ef444488)' }}>
          💀
        </div>

        <div className="space-y-2">
          <h2 className="font-cinzel text-xl font-bold text-red-400 tracking-wider">
            O Cultivador Caiu
          </h2>
          <p className="text-sm text-slate-400">{cause}</p>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Seu caminho chegou ao fim.<br />
            A morte é apenas mais um degrau do Dao eterno.
          </p>
        </div>

        <div className="w-full border-t border-slate-800 pt-4">
          <button
            onClick={onConfirm}
            className="w-full py-3 border border-red-800/60 bg-red-950/30 text-red-400 font-cinzel font-semibold tracking-widest text-sm hover:bg-red-950/60 transition-colors">
            Voltar à Criação
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tela de combate ───────────────────────────────────────────────

export function CombatScreen({ biomeId, onExit, onDeath }: Props) {
  const biomes   = useGameDataStore(s => s.biomes)
  const monsters = useGameDataStore(s => s.monsters)
  const biome    = biomes[biomeId]
  const gender   = useAuthStore(s => s.activeCharacter?.gender ?? 'masculino')

  const spriteMaleUrl      = useSettingsStore(s => s.characterSpriteMale)
  const spriteFemaleUrl    = useSettingsStore(s => s.characterSpriteFemale)
  const combatMonsterSize  = useSettingsStore(s => s.combatMonsterSize)
  const combatPlayerSize   = useSettingsStore(s => s.combatPlayerSize)
  const combatArenaHeight  = useSettingsStore(s => s.combatArenaHeight)
  const combatArenaBlur    = useSettingsStore(s => s.combatArenaBlur)
  const playerSprite = gender === 'feminino'
    ? (spriteFemaleUrl ?? spriteFeminino)
    : (spriteMaleUrl   ?? spriteMasculino)

  const currentEnemy    = useCombatStore(s => s.currentEnemy)
  const killCount       = useCombatStore(s => s.killCount)
  const qiGained        = useCombatStore(s => s.qiGained)
  const goldGained      = useCombatStore(s => s.goldGained)
  const drops           = useCombatStore(s => s.drops)
  const log             = useCombatStore(s => s.log)
  const active          = useCombatStore(s => s.active)
  const awaitingChoice  = useCombatStore(s => s.awaitingChoice)
  const nextEnemyId     = useCombatStore(s => s.nextEnemyId)
  const nextEnemyRarity = useCombatStore(s => s.nextEnemyRarity)
  const startCombat     = useCombatStore(s => s.startCombat)
  const endCombat       = useCombatStore(s => s.endCombat)
  const setEnemy        = useCombatStore(s => s.setEnemy)
  const damageEnemy     = useCombatStore(s => s.damageEnemy)
  const onEnemyKilled   = useCombatStore(s => s.onEnemyKilled)
  const confirmContinue = useCombatStore(s => s.confirmContinue)
  const addLog          = useCombatStore(s => s.addLog)

  const { takeDamage, gainQi, gainGold } = usePlayerStore()
  const addItem          = useInventoryStore(s => s.addItem)
  const reduceDurability = useInventoryStore(s => s.reduceDurability)
  const recordKill       = useBestiaryStore(s => s.recordKill)

  const { effectiveAtk, effectiveDef, effectiveCrit, effectiveCritChance, effectiveSpeed } = useEffectiveStats()

  // Refs for real-time combat — kept in sync so the interval always reads current values
  const playerNextAttackAt  = useRef(0)
  const enemyNextAttackAt   = useRef(0)
  const effectiveSpeedRef   = useRef(effectiveSpeed)
  const playerAtkRef        = useRef(effectiveAtk)
  const playerDefRef        = useRef(effectiveDef)
  const playerCritDmgRef    = useRef(effectiveCrit)        // bônus de dano crítico (%)
  const playerCritChanceRef = useRef(effectiveCritChance)  // chance de crítico (%)

  useEffect(() => { effectiveSpeedRef.current   = effectiveSpeed        }, [effectiveSpeed])
  useEffect(() => { playerAtkRef.current        = effectiveAtk          }, [effectiveAtk])
  useEffect(() => { playerDefRef.current        = effectiveDef          }, [effectiveDef])
  useEffect(() => { playerCritDmgRef.current    = effectiveCrit         }, [effectiveCrit])
  useEffect(() => { playerCritChanceRef.current = effectiveCritChance   }, [effectiveCritChance])

  // Modal de morte
  const [deathCause, setDeathCause] = useState<string | null>(null)

  const spawnNext = useCallback((enemyId: string, forcedRarity?: Rarity) => {
    const def = useGameDataStore.getState().monsters[enemyId]
    if (!def) return
    const enemy = spawnEnemy(def, forcedRarity)
    setEnemy(enemy)
    addLog('enter', `${def.name}${def.isBoss ? ' [BOSS]' : def.isElite ? ' [ELITE]' : ''} aparece!`)
  }, [setEnemy, addLog])

  useEffect(() => {
    startCombat(biomeId)
    return () => { if (combatInterval) { clearInterval(combatInterval); combatInterval = null } }
  }, [biomeId, startCombat])

  // Spawn primeiro inimigo — só enquanto o combate está ativo
  useEffect(() => {
    if (active && !currentEnemy && !awaitingChoice) {
      const pool = biome.enemyPool
      const enemyId = pool[Math.floor(Math.random() * pool.length)]
      spawnNext(enemyId, rollRarity(biome.normalRarityWeights))
    }
  }, [active, currentEnemy, awaitingChoice, spawnNext, biome])

  // Real-time combat loop — each combatant attacks independently by their own speed
  useEffect(() => {
    if (awaitingChoice || !currentEnemy) {
      if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
      return
    }
    if (combatInterval) clearInterval(combatInterval)

    const def = useGameDataStore.getState().monsters[currentEnemy.definitionId]
    if (!def) return

    // Both combatants wait their full attack cycle before first strike
    const now = Date.now()
    playerNextAttackAt.current = now + effectiveSpeedRef.current * 1000
    enemyNextAttackAt.current  = now + def.speed * 1000
    useCombatStore.getState().incrementPlayerAttackKey()
    useCombatStore.getState().incrementEnemyAttackKey()

    combatInterval = setInterval(() => {
      const store = useCombatStore.getState()
      const playerStore = usePlayerStore.getState()
      const enemy = store.currentEnemy
      if (!enemy || store.awaitingChoice) return

      const monsterDef = useGameDataStore.getState().monsters[enemy.definitionId]
      if (!monsterDef) return

      const tick = Date.now()

      // ── Player attacks ────────────────────────────────────────────
      if (tick >= playerNextAttackAt.current) {
        const speed = effectiveSpeedRef.current
        playerNextAttackAt.current = tick + speed * 1000
        useCombatStore.getState().incrementPlayerAttackKey()

        const { damage: pDmg, isCrit } = rollDamage(playerAtkRef.current, playerCritChanceRef.current, playerCritDmgRef.current)
        const actualPDmg = Math.max(1, pDmg - enemyDef(monsterDef, enemy))
        damageEnemy(actualPDmg)
        addLog('player_attack', `Você atacou por ${actualPDmg}${isCrit ? ' (CRÍTICO!)' : ''}`)

        const updated = useCombatStore.getState().currentEnemy
        if (updated && updated.currentHp <= 0) {
          const dropsRolled = rollDrops(monsterDef, enemy.rarity, usePlayerStore.getState().luck)
          dropsRolled.forEach(d => addItem(d.itemId, d.quantity))
          const qi   = qiRewardScaled(monsterDef.qiReward, enemy.rarity)
          const gold = goldRewardScaled(monsterDef.goldReward.min, monsterDef.goldReward.max, enemy.rarity)
          gainQi(qi)
          gainGold(gold)
          recordKill(monsterDef.id, dropsRolled.map(d => d.itemId))

          const killsSinceBoss  = store.killsSinceLastBoss
          const killsSinceElite = store.killsSinceLastElite
          // Lê bioma fresh para evitar stale closure e garantir dados atualizados do store
          const freshBiome = useGameDataStore.getState().biomes[store.biomeId ?? '']
          const activeBiome = freshBiome ?? biome
          const spawnChance = (activeBiome && Number.isFinite(activeBiome.bossSpawnChance) && activeBiome.bossSpawnChance > 0 && activeBiome.bossSpawnChance < 1)
            ? activeBiome.bossSpawnChance
            : 0.20
          const minKillsBoss  = activeBiome.minKillsBeforeBoss  ?? 25
          const minKillsElite = activeBiome.minKillsBeforeElite ?? 15
          const eliteId       = activeBiome.eliteId ?? null

          let nextId: string
          if (monsterDef.isBoss || monsterDef.isElite) {
            // Após boss ou elite: volta para pool normal
            nextId = activeBiome.enemyPool[Math.floor(Math.random() * activeBiome.enemyPool.length)]
          } else if (activeBiome.bossId && killsSinceBoss >= minKillsBoss && Math.random() < spawnChance) {
            nextId = activeBiome.bossId
          } else if (eliteId && killsSinceElite >= minKillsElite && Math.random() < 0.20) {
            nextId = eliteId
          } else {
            nextId = activeBiome.enemyPool[Math.floor(Math.random() * activeBiome.enemyPool.length)]
          }

          const nextDef = useGameDataStore.getState().monsters[nextId]
          const preRolledRarity = nextDef
            ? (nextDef.isBoss ? activeBiome.bossRarity : nextDef.isElite ? 'common' : rollRarity(activeBiome.normalRarityWeights))
            : 'common'
          reduceDurability('weapon', 1)
          addLog('player_kill', `${monsterDef.name} derrotado! +${qi} Qi, +${gold} 🪙`)
          if (dropsRolled.length > 0) {
            addLog('drop', `Drops: ${dropsRolled.map(d => `${useGameDataStore.getState().items[d.itemId]?.name ?? d.itemId} ×${d.quantity}`).join(', ')}`)
          }
          onEnemyKilled(qi, gold, dropsRolled, nextId, preRolledRarity, monsterDef.isBoss, monsterDef.isElite ?? false)
          return
        }
      }

      // ── Enemy attacks ─────────────────────────────────────────────
      if (tick >= enemyNextAttackAt.current) {
        enemyNextAttackAt.current = tick + monsterDef.speed * 1000
        useCombatStore.getState().incrementEnemyAttackKey()

        if (playerStore.hp <= 0) return
        const eDmg = Math.max(1, enemyAtk(monsterDef, enemy) - playerDefRef.current)
        takeDamage(eDmg)
        reduceDurability('armor', 0.5)
        addLog('enemy_attack', `${monsterDef.name} atacou por ${eDmg}`)

        if (usePlayerStore.getState().hp <= 0) {
          if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
          addLog('death', '💀 Você foi derrotado! O Caminho chega ao fim...')
          const cause = monsterDef?.name ? `Derrotado por ${monsterDef.name}` : 'Derrotado em batalha'
          endCombat()
          if (onDeath) {
            setDeathCause(cause)
          } else {
            usePlayerStore.getState().restoreHp(1)
            onExit()
          }
          return
        }
      }

    }, 100)

    return () => { if (combatInterval) { clearInterval(combatInterval); combatInterval = null } }
  }, [awaitingChoice, currentEnemy?.definitionId])

  const handleFlee = () => {
    addLog('flee', 'Você fugiu e voltou à base.')
    if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
    endCombat()
    onExit()
  }

  const handleContinue = () => {
    // Garantir que o interval do inimigo anterior está limpo antes de spawnar o próximo
    if (combatInterval) { clearInterval(combatInterval); combatInterval = null }
    const { nextEnemyId: storedNextId, nextEnemyRarity: storedNextRarity } = useCombatStore.getState()
    confirmContinue()
    if (storedNextId) spawnNext(storedNextId, storedNextRarity ?? undefined)
  }

  const nextDef    = nextEnemyId     ? monsters[nextEnemyId] : null
  const nextRarity = nextEnemyRarity ?? (nextDef?.rarity ?? 'common')

  // ── Auto-batalha ────────────────────────────────────────────────
  const [autoBattle, setAutoBattle]     = useState(false)
  const [stopAtRarity, setStopAtRarity] = useState<Rarity | 'never' | 'always'>('spiritual')
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    if (!autoBattle || !awaitingChoice) return

    if (stopAtRarity !== 'always') {
      const isBossStop  = nextDef?.isBoss ?? false
      const isEliteStop = nextDef?.isElite ?? false
      const rarityIndex = RARITY_PROGRESSION.indexOf(nextRarity as Rarity)
      const threshIndex = stopAtRarity !== 'never' ? RARITY_PROGRESSION.indexOf(stopAtRarity) : 999
      if (isBossStop || isEliteStop || rarityIndex >= threshIndex) return
    }

    autoTimerRef.current = setTimeout(() => { handleContinue() }, 1000)
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [autoBattle, awaitingChoice, nextEnemyId, nextRarity, stopAtRarity])

  // ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Modal de morte — bloqueia a tela até clicar */}
      {deathCause && onDeath && (
        <DeathModal cause={deathCause} onConfirm={() => onDeath(deathCause)} />
      )}

      <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-3">

        {/* ── Bioma ── */}
        <div className="flex items-center justify-center pb-1">
          <span className="text-sm font-cinzel font-bold tracking-widest uppercase px-4 py-1 border"
            style={{ color: biome.theme.accentColor, borderColor: biome.theme.accentColor + '55' }}>
            {biome.name}
          </span>
        </div>

        {/* ── Cards de status ── */}
        <div className="flex gap-3 items-stretch">
          {/* Arsenal — vertical, largura fixa, à esquerda do player */}
          <div className="w-44 shrink-0">
            <EquipmentCard />
          </div>
          <div className="flex-1 min-w-0">
            <PlayerCard />
          </div>
          <div className="flex-1 min-w-0">
            {currentEnemy ? <EnemyCard enemy={currentEnemy} /> : (
              <div className="border border-slate-800 bg-slate-900 p-3 flex items-center justify-center h-full text-slate-600 text-sm">
                Aguardando...
              </div>
            )}
          </div>
        </div>

        {/* ── Arena ── */}
        <div
          className="relative flex items-end justify-around py-4 overflow-hidden border border-slate-800"
          style={{ height: combatArenaHeight }}
        >
          {/* Camada de fundo (blur isolado dos sprites) */}
          <div className="absolute inset-0 z-0" style={
            biome.backgroundUrl
              ? {
                  backgroundImage: `url(${biome.backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: biome.backgroundPosition ?? 'center',
                  filter: combatArenaBlur > 0 ? `blur(${combatArenaBlur}px)` : undefined,
                  transform: combatArenaBlur > 0 ? 'scale(1.05)' : undefined,
                }
              : { background: `linear-gradient(to bottom, ${biome.theme.accentColor}10, transparent)` }
          } />
          {/* Personagem */}
          <div className="flex flex-col items-center z-10">
            <img
              src={playerSprite}
              alt="personagem"
              className="object-contain object-bottom select-none"
              style={{
                height: combatPlayerSize,
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 16px rgba(168,85,247,0.35))',
              }}
              draggable={false}
            />
          </div>

          {/* VS */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold tracking-[0.4em] opacity-20 select-none font-cinzel"
              style={{ color: biome.theme.accentColor }}>
              VS
            </span>
          </div>

          {/* Monstro */}
          <div className="flex flex-col items-center z-10">
            {currentEnemy ? (
              <SpriteImg
                id={currentEnemy.definitionId}
                emoji={monsters[currentEnemy.definitionId]?.emoji ?? '👾'}
                kind="monster"
                size={combatMonsterSize}
                style={{ filter: `drop-shadow(0 4px 16px ${biome.theme.accentColor}55)` }}
              />
            ) : (
              <span className="text-7xl opacity-30">❓</span>
            )}
          </div>
        </div>

        {/* ── Placar + auto-batalha ── */}
        <div className="border border-slate-800 bg-slate-900 px-4 py-2 flex items-center gap-4 text-sm flex-wrap">
          <span className="text-slate-400">⚔️ <span className="text-slate-200">{killCount}</span> kills</span>
          <span className="text-purple-400">🔮 +{qiGained} Qi</span>
          <span className="text-amber-400">🪙 +{goldGained}</span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAutoBattle(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1 border font-bold transition-colors ${
                autoBattle
                  ? 'bg-teal-400/10 border-teal-400/50 text-teal-400'
                  : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}>
              🤖 Auto{autoBattle ? ' ON' : ' OFF'}
            </button>

            {autoBattle && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">Parar em:</span>
                <select
                  value={stopAtRarity}
                  onChange={e => setStopAtRarity(e.target.value as Rarity | 'never' | 'always')}
                  className="bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 text-xs outline-none focus:border-teal-400">
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

        {/* ── Drops ── */}
        {drops.length > 0 && <DropsAccordion drops={drops} />}

        {/* ── Painel de escolha (pós-kill) ── */}
        {awaitingChoice && (
          <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="text-center font-cinzel font-bold text-slate-200 text-sm tracking-wider">
              {autoBattle
                ? (nextDef?.isBoss
                    ? '⚠️ Boss Detectado!'
                    : `⚠️ ${RARITY_LABELS[nextRarity]} Detectado!`)
                : '⚔️ Inimigo Derrotado!'
              }
            </div>

            {nextDef && (
              <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-slate-400">
                <span>Próximo:</span>
                <span className="font-bold text-slate-200 inline-flex items-center gap-1">
                  <SpriteImg id={nextDef.id} emoji={nextDef.emoji} kind="monster" size={20} />
                  {nextDef.name}
                </span>
                <span className="text-xs px-1.5 py-0.5 border font-bold tracking-widest"
                  style={{ color: RARITY_COLORS[nextRarity], borderColor: RARITY_COLORS[nextRarity] + '55' }}>
                  {RARITY_LABELS[nextRarity]}
                </span>
                {nextDef.isBoss && (
                  <span className="text-xs px-1.5 py-0.5 border border-amber-500/50 text-amber-400">BOSS</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleContinue}
                className="py-2.5 font-cinzel font-bold text-sm border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors tracking-wider">
                Continuar →
              </button>
              <button onClick={handleFlee}
                className="py-2.5 font-cinzel font-bold text-sm border border-red-900/50 text-red-400 bg-red-950/10 hover:bg-red-950/30 transition-colors tracking-wider">
                Fugir
              </button>
            </div>
          </div>
        )}

        {/* ── Log ── */}
        <CombatLog entries={log} />
      </div>
    </div>
  )
}
