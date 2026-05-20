import { create } from 'zustand'
import type { Realm, RealmStage, Affinity } from '../types'
import { INITIAL_MAX_QI } from '../data/breakthroughs'
import { computeMaxHp } from '../utils/stats'
import { useGameDataStore } from './gameDataStore'

export type SpendableAttr = 'strength' | 'agility' | 'vitality' | 'defense' | 'perception'

export interface ActiveBuff {
  id: string           // uuid de instância
  definitionId: string // ID do item pílula
  name: string         // nome para exibição
  endsAt: number       // epoch ms
  atk?:   number
  def?:   number
  hp?:    number
  crit?:  number
  speed?: number
}

interface Attributes {
  strength: number
  agility: number
  vitality: number
  defense: number
  perception: number
  affinity: Affinity
}

interface PlayerState {
  name: string
  hp: number
  maxHp: number
  qi: number
  maxQi: number
  gold: number
  luck: number
  realm: Realm
  realmStage: RealmStage
  attributes: Attributes
  attributePoints: number
  totalQiAccumulated: number
  rebirths: number
  meditationEndsAt: number  // epoch ms; 0 = inativo
  activeBuffs: ActiveBuff[]
  activateBuff: (def: import('../types').ItemDefinition) => void
  cleanExpiredBuffs: () => void
  fullRestoreHpTo: (effectiveMax: number) => void
  syncMaxHp: (newMaxHp: number) => void
  gainLuck: (amount: number) => void
  gainQi: (amount: number) => void
  setQiAfterBreakthrough: (newRealm: Realm, newStage: RealmStage, newMaxQi: number) => void
  refundAttributePoint: (attr: SpendableAttr) => void
  spendAttributePoint: (attr: SpendableAttr) => void
  applyBreakthroughPath: (deltas: Partial<Record<SpendableAttr, number>>) => void
  gainGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  takeDamage: (amount: number) => void
  restoreHp: (amount: number) => void
  fullRestoreHp: () => void
  setName: (name: string) => void
  activateMeditation: (minutes: number) => void
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
      name: 'Cultivador',
      hp: 100,
      maxHp: 100,
      qi: 0,
      maxQi: INITIAL_MAX_QI,
      gold: 0,
      luck: 0,
      realm: 'qi_refining',
      realmStage: 'initial',
      attributes: {
        strength: 5,
        agility: 5,
        vitality: 5,
        defense: 3,
        perception: 5,
        affinity: 'fire',
      },
      attributePoints: 0,
      totalQiAccumulated: 0,
      rebirths: 0,
      meditationEndsAt: 0,
      activeBuffs: [],

      activateBuff: (def) => set((s) => {
        const duration = (def.stats?.buffDuration ?? 0) * 60_000
        if (duration <= 0) return {}
        const now = Date.now()
        // Se já existe buff do mesmo item, estende o tempo a partir do atual ou do endsAt
        const existing = s.activeBuffs.find(b => b.definitionId === def.id)
        if (existing) {
          return {
            activeBuffs: s.activeBuffs.map(b =>
              b.definitionId === def.id
                ? { ...b, endsAt: Math.max(b.endsAt, now) + duration }
                : b
            ),
          }
        }
        const newBuff: ActiveBuff = {
          id:           `${def.id}-${now}-${Math.random().toString(36).slice(2)}`,
          definitionId: def.id,
          name:         def.name,
          endsAt:       now + duration,
          atk:          def.stats?.atk    || undefined,
          def:          def.stats?.def    || undefined,
          hp:           def.stats?.hp     || undefined,
          crit:         def.stats?.crit   || undefined,
          speed:        def.stats?.speed  || undefined,
        }
        return { activeBuffs: [...s.activeBuffs, newBuff] }
      }),

      cleanExpiredBuffs: () => set((s) => {
        const now = Date.now()
        const valid = s.activeBuffs.filter(b => b.endsAt > now)
        if (valid.length === s.activeBuffs.length) return {}
        return { activeBuffs: valid }
      }),

      fullRestoreHpTo: (effectiveMax) => set({ hp: effectiveMax }),

      gainLuck: (amount) => set((s) => ({ luck: s.luck + amount })),

      syncMaxHp: (newMaxHp) => set((s) => {
        const delta = newMaxHp - s.maxHp
        return {
          maxHp: newMaxHp,
          hp: Math.max(1, Math.min(newMaxHp, s.hp + delta)),
        }
      }),

      gainQi: (amount) => set((s) => {
        const gained = Math.min(amount, s.maxQi - s.qi)
        if (gained <= 0) return {}
        return {
          qi: s.qi + gained,
          // Number() garante soma numérica — evita concatenação se vier string do localStorage
          totalQiAccumulated: Number(s.totalQiAccumulated) + gained,
        }
      }),

      setQiAfterBreakthrough: (newRealm, newStage, newMaxQi) => set((s) => {
        const bonus = useGameDataStore.getState().statConfig?.attrPointsPerBreakthrough ?? 3
        return {
          realm: newRealm,
          realmStage: newStage,
          qi: 0,
          maxQi: newMaxQi,
          attributePoints: s.attributePoints + bonus,
        }
      }),

      applyBreakthroughPath: (deltas) => set((s) => {
        const newAttrs = { ...s.attributes }
        for (const [attr, delta] of Object.entries(deltas) as [SpendableAttr, number][]) {
          newAttrs[attr] = newAttrs[attr] + delta
        }
        const cfg = useGameDataStore.getState().statConfig ?? undefined
        const armorBonus = s.maxHp - computeMaxHp(s.attributes.vitality, cfg)
        const newMaxHp = computeMaxHp(newAttrs.vitality, cfg) + armorBonus
        return {
          attributes: newAttrs,
          maxHp: newMaxHp,
          hp: Math.min(s.hp + (newMaxHp - s.maxHp), newMaxHp),
        }
      }),

      refundAttributePoint: (attr) => set((s) => {
        if (s.attributes[attr] <= 1) return {}
        const newAttrs = { ...s.attributes, [attr]: s.attributes[attr] - 1 }
        if (attr === 'vitality') {
          const cfg = useGameDataStore.getState().statConfig ?? undefined
          const armorBonus = s.maxHp - computeMaxHp(s.attributes.vitality, cfg)
          const newMaxHp   = computeMaxHp(newAttrs.vitality, cfg) + armorBonus
          return {
            attributes:      newAttrs,
            attributePoints: s.attributePoints + 1,
            maxHp:           newMaxHp,
            hp:              Math.min(s.hp, newMaxHp),
          }
        }
        return { attributes: newAttrs, attributePoints: s.attributePoints + 1 }
      }),

      spendAttributePoint: (attr) => set((s) => {
        if (s.attributePoints <= 0) return {}
        const newAttrs = { ...s.attributes, [attr]: s.attributes[attr] + 1 }
        if (attr === 'vitality') {
          const cfg = useGameDataStore.getState().statConfig ?? undefined
          const armorBonus = s.maxHp - computeMaxHp(s.attributes.vitality, cfg)
          const newMaxHp = computeMaxHp(newAttrs.vitality, cfg) + armorBonus
          return {
            attributes: newAttrs,
            attributePoints: s.attributePoints - 1,
            maxHp: newMaxHp,
            hp: Math.min(s.hp + computeMaxHp(1, cfg), newMaxHp),
          }
        }
        return {
          attributes: newAttrs,
          attributePoints: s.attributePoints - 1,
        }
      }),

      gainGold: (amount) => set((s) => ({ gold: s.gold + amount })),

      spendGold: (amount) => {
        if (get().gold < amount) return false
        set((s) => ({ gold: s.gold - amount }))
        return true
      },

      takeDamage: (amount) => set((s) => ({ hp: Math.max(0, s.hp - amount) })),

      restoreHp: (amount) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),

      fullRestoreHp: () => set((s) => ({ hp: s.maxHp })),

      setName: (name) => set({ name }),

      activateMeditation: (minutes) => set((s) => ({
        meditationEndsAt: Math.max(s.meditationEndsAt, Date.now()) + minutes * 60_000,
      })),
    })
)
