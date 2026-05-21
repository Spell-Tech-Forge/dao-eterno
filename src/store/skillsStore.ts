import { create } from 'zustand'
import { calcSkillXpForLevel, DEFAULT_SKILL_XP_CONFIG } from '../utils/forge'
import { useGameDataStore } from './gameDataStore'

export interface SkillData {
  id: string
  name: string
  category: 'body' | 'mind' | 'creation' | 'world'
  emoji: string
  description: string
  level: number
  xp: number
  xpToNext: number
  active: boolean
}

function skillXp(level: number): number {
  const cfg = useGameDataStore.getState().skillXpConfig ?? DEFAULT_SKILL_XP_CONFIG
  return calcSkillXpForLevel(level, cfg)
}

export const INITIAL_SKILLS: SkillData[] = [
  // Body
  { id: 'meditation', name: 'Meditação', category: 'body', emoji: '🧘', description: 'Gera Qi passivamente. Base de tudo.', level: 1, xp: 0, xpToNext: 50, active: true },
  { id: 'body_strengthening', name: 'Fortalecimento Corporal', category: 'body', emoji: '💪', description: 'Aumenta HP e resistência física.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'martial_arts', name: 'Artes Marciais', category: 'body', emoji: '🥋', description: 'XP passivo de combate. Desbloqueia técnicas.', level: 1, xp: 0, xpToNext: 50, active: false },
  // Mind
  { id: 'scripture_study', name: 'Estudo de Escrituras', category: 'mind', emoji: '📜', description: 'Desbloqueia técnicas e passivas.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'dao_perception', name: 'Percepção do Dao', category: 'mind', emoji: '👁️', description: 'Necessária para breakthroughs.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'seal_formation', name: 'Formação de Selos', category: 'mind', emoji: '🔮', description: 'Cria arrays de proteção e buff.', level: 1, xp: 0, xpToNext: 50, active: false },
  // Creation
  { id: 'alchemy', name: 'Alquimia', category: 'creation', emoji: '⚗️', description: 'Refina pílulas. Qualidade melhora com nível.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'forging', name: 'Forja', category: 'creation', emoji: '⚒️', description: 'Cria armas, armaduras e anéis espaciais.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'inscription', name: 'Inscrição', category: 'creation', emoji: '✍️', description: 'Cria talismãs de efeito único.', level: 1, xp: 0, xpToNext: 50, active: false },
  // World
  { id: 'herb_gathering', name: 'Coleta de Ervas', category: 'world', emoji: '🌿', description: 'Ingredientes para alquimia.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'mining', name: 'Mineração', category: 'world', emoji: '⛏️', description: 'Ingredientes para forja.', level: 1, xp: 0, xpToNext: 50, active: false },
  { id: 'exploration', name: 'Exploração', category: 'world', emoji: '🗺️', description: 'Descobre regiões e receitas secretas.', level: 1, xp: 0, xpToNext: 50, active: false },
]

interface SkillsState {
  skills: SkillData[]
  gainSkillXp: (skillId: string, amount: number) => void
  setActive: (skillId: string) => void
  recalculateXpToNext: () => void
}

export const useSkillsStore = create<SkillsState>()((set) => ({
  skills: INITIAL_SKILLS,

  gainSkillXp: (skillId, amount) => set((s) => ({
    skills: s.skills.map(sk => {
      if (sk.id !== skillId) return sk
      let newXp = sk.xp + amount
      let newLevel = sk.level
      let needed = sk.xpToNext
      while (newXp >= needed && newLevel < 99) {
        newXp -= needed
        newLevel++
        needed = skillXp(newLevel)
      }
      return { ...sk, xp: newXp, level: newLevel, xpToNext: needed }
    }),
  })),

  setActive: (skillId) => set((s) => ({
    skills: s.skills.map(sk =>
      sk.id === skillId ? { ...sk, active: !sk.active } : sk
    ),
  })),

  // Recalcula xpToNext para todos os níveis atuais com a config vigente.
  // Chamar após hidratar skills do servidor ou após salvar nova skill XP config.
  recalculateXpToNext: () => set((s) => ({
    skills: s.skills.map(sk => ({ ...sk, xpToNext: skillXp(sk.level) })),
  })),
}))
