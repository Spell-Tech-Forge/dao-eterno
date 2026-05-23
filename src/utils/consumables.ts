import { useGameDataStore } from '../store/gameDataStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore, INITIAL_EQUIPPED } from '../store/inventoryStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import type { InventoryItem } from '../types'
import type { ActiveBuff } from '../store/playerStore'

export function isBuffPill(itemId: string): boolean {
  const def = useGameDataStore.getState().items[itemId]
  return !!(def?.stats?.buffDuration && def.stats.buffDuration > 0)
}

export function pillEffectLabel(itemId: string): string {
  const def = useGameDataStore.getState().items[itemId]
  if (!def?.stats) return ''
  if (def.stats.buffDuration) {
    const parts: string[] = []
    if (def.stats.atk)  parts.push(`+${def.stats.atk} ATK`)
    if (def.stats.def)  parts.push(`+${def.stats.def} DEF`)
    if (def.stats.hp)   parts.push(`+${def.stats.hp} HP`)
    if (def.stats.crit) parts.push(`+${def.stats.crit}% Crit`)
    if (def.stats.speed) parts.push(`+${def.stats.speed}s Vel`)
    return `${parts.join(', ')} por ${def.stats.buffDuration}min`
  }
  const parts: string[] = []
  if (def.stats.hp)                parts.push(`+${def.stats.hp}% HP`)
  if (def.stats.qi)                parts.push(`+${def.stats.qi} Qi`)
  if (def.stats.meditationMinutes) parts.push(`+${def.stats.meditationMinutes}min meditação`)
  return parts.join(', ')
}

export async function usePill(instanceId: string): Promise<boolean> {
  const char = useAuthStore.getState().activeCharacter
  if (!char) return false

  const invItem = useInventoryStore.getState().items.find(i => i.instanceId === instanceId)
  if (!invItem) return false

  const def = useGameDataStore.getState().items[invItem.definitionId]
  if (!def || def.type !== 'pill') return false

  const hp_current = usePlayerStore.getState().hp

  try {
    const res = await api.post<{
      inventory: { items: InventoryItem[]; equipped: typeof INITIAL_EQUIPPED; maxSlots: number }
      hp_current: number
      hp_max: number
      qi_current: number
      skills: { activeBuffs: ActiveBuff[]; meditationEndsAt: number }
    }>(`/api/characters/${char.id}/use-item`, { instanceId, hp_current })

    useInventoryStore.setState({
      items:    res.inventory.items,
      equipped: res.inventory.equipped ?? { ...INITIAL_EQUIPPED },
      maxSlots: res.inventory.maxSlots,
    })
    usePlayerStore.setState({
      hp:               res.hp_current,
      maxHp:            res.hp_max,
      qi:               res.qi_current,
      activeBuffs:      res.skills.activeBuffs,
      meditationEndsAt: res.skills.meditationEndsAt,
    })
    return true
  } catch (err) {
    console.warn('[use-item]', err)
    return false
  }
}
