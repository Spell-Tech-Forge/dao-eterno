import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'

// Heartbeat final — todos os campos críticos gerenciados por endpoints dedicados:
//   inventory, bestiary          → /combat/resolve, /craft, /forge/*, /dismantle, /repair, /market/*
//   spirit_gold, total_kills     → /combat/resolve, /craft, /forge/*, /market/*
//   realm, stats, luck           → /breakthrough, /spend-attribute
//   qi_current, cultivation_power → calculados pelo servidor no próprio PUT
//   skills.data, meditationEndsAt → /craft (XP), /meditate, /use-item
//   activeBuffs                   → /use-item
// Permanece: HP (sem endpoint próprio) e last_played_at.

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p = usePlayerStore.getState()

  const updated = await api.put<{ qi_current: number; cultivation_power: string | number }>(
    `/api/characters/${char.id}`,
    {
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      last_played_at: new Date().toISOString(),
    }
  )

  usePlayerStore.setState({
    qi:                 updated.qi_current,
    totalQiAccumulated: Number(updated.cultivation_power),
  })
}
