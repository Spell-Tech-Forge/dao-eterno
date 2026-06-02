import type { ItemDefinition, ClassDefinition } from '../types'

export function canEquipItem(
  item: ItemDefinition,
  playerClass: ClassDefinition | null | undefined,
  slot: 'weapon' | 'armor' | 'accessory',
): boolean {
  if (!playerClass) return true  // sem classe = sem lock

  if (slot === 'weapon')    return (item.subtype ?? '') === playerClass.allowedWeaponType
  if (slot === 'armor')     return (item.subtype ?? '') === playerClass.allowedArmorType
  if (slot === 'accessory') return (item.subtype ?? '') === playerClass.allowedAccessoryType
  return true
}
