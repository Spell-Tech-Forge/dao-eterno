import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useSkillsStore } from '../store/skillsStore'

// Fase 5 — syncToServer() virou heartbeat.
// Campos gerenciados por endpoints dedicados (nunca mais enviados aqui):
//   inventory, bestiary          → /combat/resolve, /craft, /forge/*, /dismantle, /repair, /market/*
//   spirit_gold, total_kills     → /combat/resolve, /craft, /forge/*, /market/*
//   realm, stats, luck           → /breakthrough, /spend-attribute
//   qi_current, cultivation_power → calculados pelo servidor no GET e no próprio PUT
//   skills.data, meditationEndsAt → /craft (XP), /meditate
// Permanece aqui: HP (sem endpoint próprio) e activeBuffs + meditationEndsAt para não perder buffs/timer.

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p  = usePlayerStore.getState()
  const sk = useSkillsStore.getState()

  const updated = await api.put<{ qi_current: number; cultivation_power: string | number }>(
    `/api/characters/${char.id}`,
    {
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      last_played_at: new Date().toISOString(),
      skills:         { data: sk.skills, meditationEndsAt: p.meditationEndsAt, activeBuffs: p.activeBuffs },
    }
  )

  usePlayerStore.setState({
    qi:                 updated.qi_current,
    totalQiAccumulated: Number(updated.cultivation_power),
  })
}
