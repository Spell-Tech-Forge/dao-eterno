import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Realm, RealmStage, Affinity } from '../types'
import { INITIAL_MAX_QI } from '../data/breakthroughs'
import { computeMaxHp } from '../utils/stats'

type SpendableAttr = 'strength' | 'agility' | 'vitality' | 'defense' | 'perception'

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
  fullRestoreHpTo: (effectiveMax: number) => void
  syncMaxHp: (newMaxHp: number) => void
  gainLuck: (amount: number) => void
  gainQi: (amount: number) => void
  setQiAfterBreakthrough: (newRealm: Realm, newStage: RealmStage, newMaxQi: number) => void
  spendAttributePoint: (attr: SpendableAttr) => void
  applyBreakthroughPath: (deltas: Partial<Record<SpendableAttr, number>>) => void
  gainGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  takeDamage: (amount: number) => void
  restoreHp: (amount: number) => void
  fullRestoreHp: () => void
  setName: (name: string) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
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

      setQiAfterBreakthrough: (newRealm, newStage, newMaxQi) => set((s) => ({
        realm: newRealm,
        realmStage: newStage,
        qi: 0,
        maxQi: newMaxQi,
        attributePoints: s.attributePoints + 3,
      })),

      applyBreakthroughPath: (deltas) => set((s) => {
        const newAttrs = { ...s.attributes }
        for (const [attr, delta] of Object.entries(deltas) as [SpendableAttr, number][]) {
          newAttrs[attr] = newAttrs[attr] + delta
        }
        const armorBonus = s.maxHp - computeMaxHp(s.attributes.vitality)
        const newMaxHp = computeMaxHp(newAttrs.vitality) + armorBonus
        return {
          attributes: newAttrs,
          maxHp: newMaxHp,
          hp: Math.min(s.hp + (newMaxHp - s.maxHp), newMaxHp),
        }
      }),

      spendAttributePoint: (attr) => set((s) => {
        if (s.attributePoints <= 0) return {}
        const newAttrs = { ...s.attributes, [attr]: s.attributes[attr] + 1 }
        if (attr === 'vitality') {
          const armorBonus = s.maxHp - computeMaxHp(s.attributes.vitality)
          const newMaxHp = computeMaxHp(newAttrs.vitality) + armorBonus
          return {
            attributes: newAttrs,
            attributePoints: s.attributePoints - 1,
            maxHp: newMaxHp,
            hp: Math.min(s.hp + 20, newMaxHp),
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
    }),
    {
      name: 'dao-eterno-player',
      onRehydrateStorage: () => (state) => {
        // Migração: corrige totalQiAccumulated corrompido como string ("033...")
        // Usa qi atual como baseline mínima — é o mínimo que o personagem acumulou
        if (state && typeof state.totalQiAccumulated !== 'number') {
          state.totalQiAccumulated = typeof state.qi === 'number' ? state.qi : 0
        }
      },
    }
  )
)
