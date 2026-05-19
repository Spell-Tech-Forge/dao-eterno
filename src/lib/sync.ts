import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useSkillsStore } from '../store/skillsStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { REALM_NAMES, STAGE_NAMES } from '../types'

export async function syncToServer() {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return
  const p   = usePlayerStore.getState()
  const inv = useInventoryStore.getState()
  const sk  = useSkillsStore.getState()
  const bes = useBestiaryStore.getState()

  await api.put(`/api/characters/${char.id}`, {
    realm:             REALM_NAMES[p.realm],
    realm_stage:       STAGE_NAMES[p.realmStage],
    cultivation_power: p.totalQiAccumulated,
    hp_current:        p.hp,
    hp_max:            p.maxHp,
    qi_current:        p.qi,
    qi_max:            p.maxQi,
    strength:          p.attributes.strength,
    agility:           p.attributes.agility,
    vitality:          p.attributes.vitality,
    defense:           p.attributes.defense,
    perception:        p.attributes.perception,
    luck:              p.luck,
    spirit_gold:       p.gold,
    last_played_at:    new Date().toISOString(),
    inventory: { items: inv.items, equipped: inv.equipped, maxSlots: inv.maxSlots },
    skills:    { data: sk.skills, meditationEndsAt: p.meditationEndsAt },
    bestiary:  { entries: bes.entries, discoveredItems: bes.discoveredItems },
  }).catch(() => { /* silently fail */ })
}
