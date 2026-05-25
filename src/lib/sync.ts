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
// Permanece: HP (sem endpoint próprio), last_played_at e playtime_delta.

let lastSyncMs = 0

export function initSyncTimer() { lastSyncMs = Date.now() }

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p = usePlayerStore.getState()

  const now = Date.now()
  const playtimeDelta = lastSyncMs > 0 ? Math.max(0, Math.floor((now - lastSyncMs) / 1000)) : 0
  lastSyncMs = now

  const updated = await api.put<{ qi_current: number; cultivation_power: string | number; total_playtime_seconds?: number }>(
    `/api/characters/${char.id}`,
    {
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      last_played_at: new Date().toISOString(),
      playtime_delta: playtimeDelta,
    }
  )

  usePlayerStore.setState({
    qi:                   updated.qi_current,
    totalQiAccumulated:   Number(updated.cultivation_power),
    ...(updated.total_playtime_seconds != null
      ? { totalPlaytimeSeconds: updated.total_playtime_seconds }
      : {}),
  })
}
