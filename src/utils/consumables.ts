import { ITEM_DEFS } from '../data/items'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'

// Retorna descrição do efeito de uma pílula
export function pillEffectLabel(itemId: string): string {
  const def = ITEM_DEFS[itemId]
  if (!def?.stats) return ''
  const parts: string[] = []
  if (def.stats.hp)  parts.push(`+${def.stats.hp}% HP`)
  if (def.stats.qi)  parts.push(`+${def.stats.qi} Qi`)
  return parts.join(', ')
}

// Usa uma pílula do inventário e aplica o efeito no player
export function usePill(instanceId: string): boolean {
  const { items, removeItem } = useInventoryStore.getState()
  const { restoreHp, gainQi, maxHp } = usePlayerStore.getState()

  const invItem = items.find((i) => i.instanceId === instanceId)
  if (!invItem) return false

  const def = ITEM_DEFS[invItem.definitionId]
  if (!def || def.type !== 'pill') return false

  // Aplica efeito
  if (def.stats?.hp)  restoreHp(Math.round(maxHp * def.stats.hp / 100))
  if (def.stats?.qi)  gainQi(def.stats.qi)

  removeItem(instanceId, 1)
  return true
}
