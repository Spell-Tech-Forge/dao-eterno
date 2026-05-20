import { useGameDataStore } from '../store/gameDataStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'

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

export function usePill(instanceId: string): boolean {
  const { items, removeItem } = useInventoryStore.getState()
  const { restoreHp, gainQi, maxHp, activateMeditation, activateBuff } = usePlayerStore.getState()

  const invItem = items.find((i) => i.instanceId === instanceId)
  if (!invItem) return false

  const def = useGameDataStore.getState().items[invItem.definitionId]
  if (!def || def.type !== 'pill') return false

  if (def.stats?.buffDuration) {
    activateBuff(def)
  } else {
    if (def.stats?.hp)                restoreHp(Math.round(maxHp * def.stats.hp / 100))
    if (def.stats?.qi)                gainQi(def.stats.qi)
    if (def.stats?.meditationMinutes) activateMeditation(def.stats.meditationMinutes)
  }

  removeItem(instanceId, 1)
  return true
}
