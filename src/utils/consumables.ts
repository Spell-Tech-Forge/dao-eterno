import { useGameDataStore } from '../store/gameDataStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'

// Retorna descrição do efeito de uma pílula
export function pillEffectLabel(itemId: string): string {
  const def = useGameDataStore.getState().items[itemId]
  if (!def?.stats) return ''
  const parts: string[] = []
  if (def.stats.hp)                parts.push(`+${def.stats.hp}% HP`)
  if (def.stats.qi)                parts.push(`+${def.stats.qi} Qi`)
  if (def.stats.meditationMinutes) parts.push(`+${def.stats.meditationMinutes}min meditação`)
  return parts.join(', ')
}

// Usa uma pílula do inventário e aplica o efeito no player
export function usePill(instanceId: string): boolean {
  const { items, removeItem } = useInventoryStore.getState()
  const { restoreHp, gainQi, maxHp, activateMeditation } = usePlayerStore.getState()

  const invItem = items.find((i) => i.instanceId === instanceId)
  if (!invItem) return false

  const def = useGameDataStore.getState().items[invItem.definitionId]
  if (!def || def.type !== 'pill') return false

  if (def.stats?.hp)                restoreHp(Math.round(maxHp * def.stats.hp / 100))
  if (def.stats?.qi)                gainQi(def.stats.qi)
  if (def.stats?.meditationMinutes) activateMeditation(def.stats.meditationMinutes)

  removeItem(instanceId, 1)
  return true
}
