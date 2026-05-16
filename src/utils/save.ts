// Zustand persist handles individual store saves.
// These utilities handle full export/import for backup.

export function exportSave(): string {
  const keys = ['dao-eterno-player', 'dao-eterno-inventory', 'dao-eterno-skills', 'dao-eterno-bestiary']
  const data: Record<string, unknown> = {}
  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (raw) data[key] = JSON.parse(raw)
  }
  return btoa(JSON.stringify(data))
}

export function importSave(encoded: string): boolean {
  try {
    const data = JSON.parse(atob(encoded)) as Record<string, unknown>
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value))
    }
    window.location.reload()
    return true
  } catch {
    return false
  }
}

export function clearSave(): void {
  const keys = ['dao-eterno-player', 'dao-eterno-inventory', 'dao-eterno-skills', 'dao-eterno-bestiary']
  keys.forEach(k => localStorage.removeItem(k))
  window.location.reload()
}
