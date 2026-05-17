import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import { useSettingsStore } from '../../store/settingsStore'
import { RARITY_COLORS, RARITY_LABELS, RARITY_PROGRESSION } from '../../types'
import type { Rarity } from '../../types'

const RARITY_KEY: Record<Rarity, string> = {
  common:    'frame_common_url',
  uncommon:  'frame_uncommon_url',
  spiritual: 'frame_spiritual_url',
  rare:      'frame_rare_url',
  ancient:   'frame_ancient_url',
  legendary: 'frame_legendary_url',
}

// ── Upload de frame ───────────────────────────────────────────────

interface FrameUploadProps {
  rarity:     Rarity
  value:      string | null
  onSaved:    (url: string | null) => void
}

function RarityFrameUpload({ rarity, value, onSaved }: FrameUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [bust,    setBust]    = useState(() => Date.now())
  const color     = RARITY_COLORS[rarity]
  const settingKey = RARITY_KEY[rarity]

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Máx 4 MB.'); return }
    setError(''); setLoading(true)
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('dao_token') ?? ''
    try {
      const res  = await fetch(
        `/api/upload?type=frame&id=${encodeURIComponent(settingKey)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      )
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      const url = data.url ?? null
      await api.put('/api/admin/settings', { [settingKey]: url ?? '' })
      onSaved(url)
      setBust(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    await api.put('/api/admin/settings', { [settingKey]: '' })
    onSaved(null)
  }

  return (
    <div className="rounded-xl border bg-surface p-3 space-y-2.5"
      style={{ borderColor: color + '55' }}>

      {/* Header de raridade */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: color + '66', backgroundColor: color + '15' }}>
          {RARITY_LABELS[rarity]}
        </span>
      </div>

      {/* Preview */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border flex items-center justify-center"
        style={{ borderColor: color + '44', backgroundColor: color + '08', maxHeight: 120 }}>
        {value ? (
          <img key={bust} src={`${value}?t=${bust}`} alt="frame"
            className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
        ) : (
          <span className="text-muted text-xs">Sem frame</span>
        )}
        {/* Ícone de exemplo dentro do frame */}
        {value && (
          <span className="text-2xl z-10 pointer-events-none select-none">⚔️</span>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
          className="flex-1 px-2 py-1.5 text-xs border rounded transition-colors disabled:opacity-50"
          style={{ borderColor: color + '66', color, backgroundColor: color + '10' }}>
          {loading ? '...' : value ? '↑ Trocar' : '↑ Upload'}
        </button>
        {value && (
          <button type="button" onClick={handleRemove}
            className="px-2 py-1.5 text-xs border border-danger/40 text-danger rounded hover:bg-danger/10 transition-colors">
            ✕
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp"
        className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────

export function SettingsPanel() {
  const loadSettings   = useSettingsStore(s => s.load)
  const globalItem     = useSettingsStore(s => s.itemSpriteSize)
  const globalMonster  = useSettingsStore(s => s.monsterSpriteSize)
  const globalMaterial = useSettingsStore(s => s.materialSpriteSize)
  const globalCardSize = useSettingsStore(s => s.itemCardSize)
  const globalFrames   = useSettingsStore(s => s.rarityFrames)

  const [itemSize,     setItemSize]     = useState(globalItem)
  const [monsterSize,  setMonsterSize]  = useState(globalMonster)
  const [materialSize, setMaterialSize] = useState(globalMaterial)
  const [cardSize,     setCardSize]     = useState(globalCardSize)
  const [frames,       setFrames]       = useState(globalFrames)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setItemSize(globalItem)
    setMonsterSize(globalMonster)
    setMaterialSize(globalMaterial)
    setCardSize(globalCardSize)
    setFrames(globalFrames)
  }, [globalItem, globalMonster, globalMaterial, globalCardSize, globalFrames])

  const handleSaveSizes = async () => {
    setSaving(true); setSaved(false)
    await api.put('/api/admin/settings', {
      item_sprite_size:     String(itemSize),
      monster_sprite_size:  String(monsterSize),
      material_sprite_size: String(materialSize),
      item_card_size:       String(cardSize),
    })
    await loadSettings()
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SizeField = ({ label, value, onChange, preview }: {
    label: string; value: number; onChange: (v: number) => void; preview: string
  }) => (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">{label}</label>
        <span className="text-xs text-muted bg-surface-2 border border-border rounded px-2 py-0.5">{value}px</span>
      </div>
      <input type="range" min={16} max={96} step={4} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-jade" />
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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border">
        <span className="text-xs text-muted shrink-0">Preview:</span>
        <span style={{ fontSize: value * 0.72 }}>{preview}</span>
        <span className="text-xs text-muted">{value}×{value}px</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">

      {/* ── Tamanho dos sprites ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Tamanho dos Sprites</h2>
        <p className="text-xs text-muted">
          Tamanho padrão dos ícones nos cards. Lugares com tamanho fixo (batalha, detalhes) não são afetados.
        </p>
        <SizeField label="Sprites de itens (equipamentos)"                 value={itemSize}     onChange={setItemSize}     preview="⚔️" />
        <SizeField label="Sprites de materiais e pílulas"                value={materialSize} onChange={setMaterialSize} preview="🌿" />
        <SizeField label="Sprites de monstros"                           value={monsterSize}  onChange={setMonsterSize}  preview="👾" />
        <SizeField label="Tamanho dos cards de material/pílula (quadrado)" value={cardSize}  onChange={setCardSize}     preview="💊" />
        <div className="flex items-center gap-3">
          <button onClick={handleSaveSizes} disabled={saving}
            className="px-5 py-2 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar tamanhos'}
          </button>
          {saved && <span className="text-sm text-jade">✓ Salvo! Mudanças aparecem em até 3 min.</span>}
        </div>
      </section>

      {/* ── Frames por raridade ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Frames de Raridade</h2>
        <p className="text-xs text-muted">
          Imagem de borda decorativa exibida sobre os cards de item. Cada raridade pode ter seu próprio frame.
          Use PNG ou GIF com fundo transparente — o centro deve ser transparente para o ícone aparecer.
          Quando configurado, substitui a borda CSS colorida.
        </p>

        <div className="grid grid-cols-6 gap-3">
          {RARITY_PROGRESSION.map(rarity => (
            <RarityFrameUpload
              key={rarity}
              rarity={rarity}
              value={frames[rarity]}
              onSaved={url => {
                setFrames(prev => ({ ...prev, [rarity]: url }))
                loadSettings()
              }}
            />
          ))}
        </div>

        <div className="rounded-xl border border-border/40 bg-surface/50 p-3 text-xs text-muted space-y-1">
          <div className="font-semibold text-text/60 mb-1">Dica de criação:</div>
          <div>• Imagem quadrada (ex: 128×128 px) com borda decorativa nas extremidades</div>
          <div>• Centro (~60% da área) transparente para o ícone do item aparecer</div>
          <div>• Salve como PNG-24 com canal alfa ou GIF transparente</div>
          <div>• GIF animado é suportado — ótimo para raridades lendárias</div>
        </div>
      </section>

    </div>
  )
}
