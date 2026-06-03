/** Converte unlocked_talents do servidor para Record<nodeId, level>.
 *  Aceita tanto o formato legado (string[]) quanto o novo (Record<string,number>). */
export function normalizeUnlockedTalents(raw: unknown): Record<string, number> {
  if (!raw) return {}
  if (Array.isArray(raw)) {
    const result: Record<string, number> = {}
    for (const id of raw as string[]) {
      result[id] = (result[id] ?? 0) + 1
    }
    return result
  }
  if (typeof raw === 'object') return raw as Record<string, number>
  return {}
}
