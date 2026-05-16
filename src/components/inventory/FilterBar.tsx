import type { ItemType, Rarity } from '../../types'
import { RARITY_LABELS, RARITY_COLORS } from '../../types'
import { useInventoryStore } from '../../store/inventoryStore'

const TYPE_OPTIONS: { value: ItemType | 'all'; label: string }[] = [
  { value: 'all',       label: 'Tudo' },
  { value: 'weapon',    label: 'Armas' },
  { value: 'armor',     label: 'Armaduras' },
  { value: 'accessory', label: 'Acessórios' },
  { value: 'ring',      label: 'Anéis' },
  { value: 'material',  label: 'Materiais' },
  { value: 'pill',      label: 'Pílulas' },
  { value: 'talisman',  label: 'Talismãs' },
]

const RARITY_ORDER: Rarity[] = ['common','uncommon','spiritual','rare','ancient','legendary']

const RARITY_OPTIONS: { value: Rarity | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Todas', color: '#94a3b8' },
  ...RARITY_ORDER.map(r => ({ value: r, label: RARITY_LABELS[r], color: RARITY_COLORS[r] })),
]

export function FilterBar() {
  const { filter, setFilter } = useInventoryStore()

  return (
    <div className="space-y-2">
      {/* Type filter */}
      <div className="flex flex-wrap gap-1">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter({ type: value })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              filter.type === value
                ? 'bg-jade/20 border-jade text-jade'
                : 'bg-surface border-border text-muted hover:border-jade/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Rarity filter */}
      <div className="flex flex-wrap gap-1">
        {RARITY_OPTIONS.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setFilter({ rarity: value })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              filter.rarity === value ? 'opacity-100' : 'opacity-50 hover:opacity-75'
            }`}
            style={filter.rarity === value
              ? { borderColor: color, color, backgroundColor: color + '22' }
              : { borderColor: '#2a2a4e', color: '#94a3b8' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={filter.search}
        onChange={(e) => setFilter({ search: e.target.value })}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder-muted outline-none focus:border-jade"
      />
    </div>
  )
}
