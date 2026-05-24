import { create } from 'zustand'
import type { ActiveEnemy, CombatLogEntry, Rarity } from '../types'
import { usePlayerStore } from './playerStore'

let logId = 0

interface CombatState {
  active: boolean
  biomeId: string | null
  currentEnemy: ActiveEnemy | null
  killCount: number
  killsSinceLastBoss: number
  killsSinceLastElite: number
  qiGained: number
  goldGained: number
  drops: { itemId: string; quantity: number }[]
  confirmedDrops: { itemId: string; quantity: number }[]
  log: CombatLogEntry[]
  awaitingChoice: boolean
  nextEnemyId: string | null
  nextEnemyRarity: Rarity | null
  playerAttackKey: number
  enemyAttackKey: number
  startCombat: (biomeId: string) => void
  endCombat: () => void
  setEnemy: (enemy: ActiveEnemy) => void
  damageEnemy: (amount: number) => void
  onEnemyKilled: (qi: number, gold: number, drops: { itemId: string; quantity: number }[], nextEnemyId: string, nextEnemyRarity: Rarity, wasBoss: boolean, wasElite: boolean) => void
  confirmContinue: () => void
  addLog: (type: CombatLogEntry['type'], text: string) => void
  addConfirmedDrops: (drops: { itemId: string; quantity: number }[]) => void
  incrementPlayerAttackKey: () => void
  incrementEnemyAttackKey: () => void
}

export const useCombatStore = create<CombatState>()((set) => ({
  active: false,
  biomeId: null,
  currentEnemy: null,
  killCount: 0,
  killsSinceLastBoss: 0,
  killsSinceLastElite: 0,
  qiGained: 0,
  goldGained: 0,
  drops: [],
  confirmedDrops: [],
  log: [],
  awaitingChoice: false,
  nextEnemyId: null,
  nextEnemyRarity: null,
  playerAttackKey: 0,
  enemyAttackKey: 0,

  startCombat: (biomeId) => set({
    active: true, biomeId,
    killCount: 0, killsSinceLastBoss: 0, killsSinceLastElite: 0,
    qiGained: 0, goldGained: 0,
    drops: [], confirmedDrops: [], log: [], awaitingChoice: false, nextEnemyId: null, nextEnemyRarity: null,
  }),

  endCombat: () => set({
    active: false, biomeId: null, currentEnemy: null,
    awaitingChoice: false, nextEnemyId: null, nextEnemyRarity: null,
  }),

  setEnemy: (enemy) => set({ currentEnemy: enemy }),

  damageEnemy: (amount) => set((s) => {
    if (!s.currentEnemy) return {}
    return { currentEnemy: { ...s.currentEnemy, currentHp: Math.max(0, s.currentEnemy.currentHp - amount) } }
  }),

  onEnemyKilled: (qi, gold, drops, nextEnemyId, nextEnemyRarity, wasBoss, wasElite) => {
    usePlayerStore.getState().addKill()
    return set((s) => ({
    killCount: s.killCount + 1,
    killsSinceLastBoss: wasBoss ? 0 : s.killsSinceLastBoss + 1,
    killsSinceLastElite: (wasBoss || wasElite) ? 0 : s.killsSinceLastElite + 1,
    qiGained:   (Number.isFinite(s.qiGained)   ? s.qiGained   : 0) + (Number.isFinite(qi)   ? qi   : 0),
    goldGained: (Number.isFinite(s.goldGained)  ? s.goldGained : 0) + (Number.isFinite(gold) ? gold : 0),
    drops: [...s.drops, ...drops],
    awaitingChoice: true,
    nextEnemyId,
    nextEnemyRarity,
  }))
  },

  confirmContinue: () => set({ awaitingChoice: false, currentEnemy: null }),

  addLog: (type, text) => set((s) => ({
    log: [{ id: logId++, type, text, timestamp: Date.now() }, ...s.log].slice(0, 50),
  })),

  addConfirmedDrops: (incoming) => set((s) => {
    const map = new Map<string, number>()
    for (const d of s.confirmedDrops) map.set(d.itemId, d.quantity)
    for (const d of incoming) map.set(d.itemId, (map.get(d.itemId) ?? 0) + d.quantity)
    return { confirmedDrops: Array.from(map.entries()).map(([itemId, quantity]) => ({ itemId, quantity })) }
  }),

  incrementPlayerAttackKey: () => set((s) => ({ playerAttackKey: s.playerAttackKey + 1 })),
  incrementEnemyAttackKey:  () => set((s) => ({ enemyAttackKey:  s.enemyAttackKey  + 1 })),
}))
