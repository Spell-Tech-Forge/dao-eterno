import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BattleKill {
  timestamp:    number
  monsterId:    string
  monsterName:  string
  monsterEmoji: string
  isBoss:       boolean
  isElite:      boolean
  qiGained:     number
  goldGained:   number
  drops:        { name: string; emoji: string; quantity: number }[]
}

export interface BattleRun {
  id:         string
  biomeId:    string
  biomeName:  string
  accentColor:string
  startedAt:  number
  endedAt:    number | null
  kills:      BattleKill[]
  totalQi:    number
  totalGold:  number
  totalKills: number
}

interface BattleHistoryState {
  runs:         BattleRun[]
  currentRunId: string | null
  startRun:  (biomeId: string, biomeName: string, accentColor: string) => void
  endRun:    () => void
  addKill:   (kill: Omit<BattleKill, 'timestamp'>) => void
  clearAll:  () => void
}

const MAX_RUNS = 30

export const useBattleHistoryStore = create<BattleHistoryState>()(
  persist(
    (set, get) => ({
      runs:         [],
      currentRunId: null,

      startRun: (biomeId, biomeName, accentColor) => {
        const id = `run_${Date.now()}`
        const newRun: BattleRun = {
          id, biomeId, biomeName, accentColor,
          startedAt: Date.now(), endedAt: null,
          kills: [], totalQi: 0, totalGold: 0, totalKills: 0,
        }
        set(s => ({
          currentRunId: id,
          runs: [newRun, ...s.runs].slice(0, MAX_RUNS),
        }))
      },

      endRun: () => {
        const { currentRunId, runs } = get()
        if (!currentRunId) return
        set({
          currentRunId: null,
          runs: runs.map(r => r.id === currentRunId ? { ...r, endedAt: Date.now() } : r),
        })
      },

      addKill: (kill) => {
        const { currentRunId, runs } = get()
        if (!currentRunId) return
        const entry: BattleKill = { ...kill, timestamp: Date.now() }
        set({
          runs: runs.map(r => r.id === currentRunId
            ? {
                ...r,
                kills:      [...r.kills, entry],
                totalQi:    r.totalQi    + entry.qiGained,
                totalGold:  r.totalGold  + entry.goldGained,
                totalKills: r.totalKills + 1,
              }
            : r
          ),
        })
      },

      clearAll: () => set({ runs: [], currentRunId: null }),
    }),
    { name: 'dao-battle-history' }
  )
)
