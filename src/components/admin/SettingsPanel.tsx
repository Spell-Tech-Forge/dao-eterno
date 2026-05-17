import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useSettingsStore } from '../../store/settingsStore'

export function SettingsPanel() {
  const loadSettings = useSettingsStore(s => s.load)
  const globalItem     = useSettingsStore(s => s.itemSpriteSize)
  const globalMonster  = useSettingsStore(s => s.monsterSpriteSize)
  const globalMaterial = useSettingsStore(s => s.materialSpriteSize)

  const [itemSize,     setItemSize]     = useState(globalItem)
  const [monsterSize,  setMonsterSize]  = useState(globalMonster)
  const [materialSize, setMaterialSize] = useState(globalMaterial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setItemSize(globalItem)
    setMonsterSize(globalMonster)
    setMaterialSize(globalMaterial)
  }, [globalItem, globalMonster, globalMaterial])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await api.put<{ ok: boolean }>('/api/admin/settings', {
      item_sprite_size:     String(itemSize),
      monster_sprite_size:  String(monsterSize),
      material_sprite_size: String(materialSize),
    })
    await loadSettings()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SizeField = ({
    label, value, onChange, preview,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    preview: string
  }) => (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">{label}</label>
        <span className="text-xs text-muted bg-surface-2 border border-border rounded px-2 py-0.5">{value}px</span>
      </div>

      <input
        type="range"
        min={16}
        max={96}
        step={4}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-jade"
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted w-16">Mínimo</span>
        <div className="flex-1 flex justify-between text-xs text-muted">
          {[16, 32, 48, 64, 80, 96].map(v => (
            <button key={v} onClick={() => onChange(v)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                value === v ? 'bg-jade/20 text-jade border border-jade/40' : 'hover:text-text'
              }`}>
              {v}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted w-16 text-right">Máximo</span>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border">
        <span className="text-xs text-muted shrink-0">Preview:</span>
        <div className="flex items-center gap-4 flex-wrap">
          <span style={{ fontSize: value * 0.72 }}>{preview}</span>
          <span className="text-xs text-muted">{value}×{value}px</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted">
        Configure o tamanho padrão dos sprites. Lugares com tamanho fixo (batalha, detalhes) não são afetados.
      </div>

      <SizeField
        label="Tamanho dos sprites de itens"
        value={itemSize}
        onChange={setItemSize}
        preview="⚔️"
      />

      <SizeField
        label="Tamanho dos sprites de materiais e pílulas"
        value={materialSize}
        onChange={setMaterialSize}
        preview="🌿"
      />

      <SizeField
        label="Tamanho dos sprites de monstros"
        value={monsterSize}
        onChange={setMonsterSize}
        preview="👾"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && (
          <span className="text-sm text-jade">✓ Salvo! As mudanças aparecem em até 3 min para todos os jogadores.</span>
        )}
      </div>
    </div>
  )
}
