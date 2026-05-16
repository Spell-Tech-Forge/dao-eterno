import { useInventoryStore } from '../../store/inventoryStore'

type SortField = 'name' | 'rarity' | 'atk' | 'def' | 'quantity' | 'obtainedAt'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'obtainedAt', label: 'Obtido' },
  { value: 'name', label: 'Nome' },
  { value: 'rarity', label: 'Raridade' },
  { value: 'atk', label: 'ATK' },
  { value: 'def', label: 'DEF' },
  { value: 'quantity', label: 'Quantidade' },
]

export function SortDropdown() {
  const { sortField, sortDir, setSort } = useInventoryStore()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Ordenar:</span>
      <div className="flex flex-wrap gap-1">
        {SORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSort(value)}
            className={`text-xs px-2 py-1 rounded border transition-all flex items-center gap-1 ${
              sortField === value
                ? 'bg-surface-2 border-jade text-jade'
                : 'border-border text-muted hover:border-border'
            }`}
          >
            {label}
            {sortField === value && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
