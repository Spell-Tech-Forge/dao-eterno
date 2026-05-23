import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useSkillsStore } from '../store/skillsStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { REALM_NAMES, STAGE_NAMES } from '../types'

// Fase 1 da migração server-side:
// qi_current e cultivation_power são computados pelo servidor — não enviados pelo cliente.
// O servidor retorna os valores autoritativos; atualizamos os stores com eles.

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
      realm:          REALM_NAMES[p.realm],
      realm_stage:    STAGE_NAMES[p.realmStage],
      hp_current:     p.hp,
      hp_max:         p.maxHp,
      qi_max:         p.maxQi,
      strength:       p.attributes.strength,
      agility:        p.attributes.agility,
      vitality:       p.attributes.vitality,
      defense:        p.attributes.defense,
      perception:     p.attributes.perception,
      luck:           p.luck,
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
