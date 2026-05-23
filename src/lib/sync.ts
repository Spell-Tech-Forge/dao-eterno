import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useSkillsStore } from '../store/skillsStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { useCombatStore } from '../store/combatStore'

// Fases 1–4 da migração server-side:
// qi_current, cultivation_power — computados pelo servidor (Fase 1)
// realm, realm_stage, stats base, luck — gerenciados via endpoints dedicados (Fase 2)
// crafting/forge/dismantle — gerenciados via endpoints dedicados (Fase 3)
// Durante combate ativo: inventory, spirit_gold, total_kills e bestiary são gerenciados
// por POST /combat/resolve — omitidos aqui para evitar conflito com drops server-side (Fase 4)

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p   = usePlayerStore.getState()
  const inv = useInventoryStore.getState()
  const sk  = useSkillsStore.getState()
  const bes = useBestiaryStore.getState()

  const inCombat = useCombatStore.getState().active

  const updated = await api.put<{ qi_current: number; cultivation_power: string | number }>(
    `/api/characters/${char.id}`,
    {
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      last_played_at: new Date().toISOString(),
      skills:         { data: sk.skills, meditationEndsAt: p.meditationEndsAt, activeBuffs: p.activeBuffs },
      // Omitidos durante combate — gerenciados por /combat/resolve para evitar dupla-contagem
      ...(inCombat ? {} : {
        spirit_gold: p.gold,
        total_kills: p.totalKills,
        inventory:   { items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots },
        bestiary:    { entries: bes.entries, discoveredItems: bes.discoveredItems },
      }),
    }
  )

  // Corrige os stores com os valores calculados pelo servidor
  usePlayerStore.setState({
    qi:                 updated.qi_current,
    totalQiAccumulated: Number(updated.cultivation_power),
  })
}
