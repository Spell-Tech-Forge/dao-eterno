import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useSkillsStore } from '../store/skillsStore'
import { useBestiaryStore } from '../store/bestiaryStore'

// Fases 1 + 2 da migração server-side:
// qi_current, cultivation_power — computados pelo servidor (Fase 1)
// realm, realm_stage, stats base, luck — gerenciados via endpoints dedicados (Fase 2)
// O cliente envia apenas: HP, gold, kills, inventário, skills, bestiary.

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p   = usePlayerStore.getState()
  const inv = useInventoryStore.getState()
  const sk  = useSkillsStore.getState()
  const bes = useBestiaryStore.getState()

  const updated = await api.put<{ qi_current: number; cultivation_power: string | number }>(
    `/api/characters/${char.id}`,
    {
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      spirit_gold:    p.gold,
      total_kills:    p.totalKills,
      last_played_at: new Date().toISOString(),
      inventory: { items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots },
      skills:    { data: sk.skills, meditationEndsAt: p.meditationEndsAt, activeBuffs: p.activeBuffs },
      bestiary:  { entries: bes.entries, discoveredItems: bes.discoveredItems },
    }
  )

  // Corrige os stores com os valores calculados pelo servidor
  usePlayerStore.setState({
    qi:                 updated.qi_current,
    totalQiAccumulated: Number(updated.cultivation_power),
  })
}
