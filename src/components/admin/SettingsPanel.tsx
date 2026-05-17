import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import { useSettingsStore } from '../../store/settingsStore'

// ── Upload de frame ───────────────────────────────────────────────

interface FrameUploadProps {
  label:    string
  settingKey: string
  value:    string | null
  onSaved:  (url: string | null) => void
}

function FrameUpload({ label, settingKey, value, onSaved }: FrameUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [bust,    setBust]    = useState(() => Date.now())

  const previewSrc = value ? `${value}?t=${bust}` : null

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Máximo 4 MB.'); return }
    setError(''); setLoading(true)
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('dao_token') ?? ''
    try {
      const res  = await fetch(`/api/upload?type=frame&id=${encodeURIComponent(settingKey)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
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
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="text-sm font-semibold text-text">{label}</div>

      <div className="flex items-center gap-4">
        {/* Preview do frame */}
        <div className="relative w-16 h-16 shrink-0 border border-border rounded-lg bg-surface-2 overflow-hidden flex items-center justify-center">
          {previewSrc ? (
            <img key={bust} src={previewSrc} alt="frame" className="w-full h-full object-fill" />
          ) : (
            <span className="text-muted text-xs text-center leading-tight px-1">Sem frame</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
            className="px-3 py-1.5 text-xs border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 disabled:opacity-50 transition-colors">
            {loading ? 'Enviando...' : value ? '↑ Trocar frame' : '↑ Enviar frame'}
          </button>
          {value && (
            <button type="button" onClick={handleRemove}
              className="px-3 py-1.5 text-xs border border-danger/40 text-danger bg-danger/5 rounded hover:bg-danger/15 transition-colors">
              Remover
            </button>
          )}
          <span className="text-xs text-muted">PNG / GIF com fundo transparente · max 4 MB</span>
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────

export function SettingsPanel() {
  const loadSettings   = useSettingsStore(s => s.load)
  const globalItem     = useSettingsStore(s => s.itemSpriteSize)
  const globalMonster  = useSettingsStore(s => s.monsterSpriteSize)
  const globalMaterial = useSettingsStore(s => s.materialSpriteSize)
  const globalFrameEq  = useSettingsStore(s => s.frameEquipmentUrl)
  const globalFramePill= useSettingsStore(s => s.framePillUrl)
  const globalFrameMat = useSettingsStore(s => s.frameMaterialUrl)

  const [itemSize,     setItemSize]     = useState(globalItem)
  const [monsterSize,  setMonsterSize]  = useState(globalMonster)
  const [materialSize, setMaterialSize] = useState(globalMaterial)
  const [frameEq,      setFrameEq]      = useState(globalFrameEq)
  const [framePill,    setFramePill]    = useState(globalFramePill)
  const [frameMat,     setFrameMat]     = useState(globalFrameMat)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    setItemSize(globalItem)
    setMonsterSize(globalMonster)
    setMaterialSize(globalMaterial)
    setFrameEq(globalFrameEq)
    setFramePill(globalFramePill)
    setFrameMat(globalFrameMat)
  }, [globalItem, globalMonster, globalMaterial, globalFrameEq, globalFramePill, globalFrameMat])

  const handleSaveSizes = async () => {
    setSaving(true); setSaved(false)
    await api.put('/api/admin/settings', {
      item_sprite_size:     String(itemSize),
      monster_sprite_size:  String(monsterSize),
      material_sprite_size: String(materialSize),
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

        <SizeField label="Sprites de itens (equipamentos)"    value={itemSize}     onChange={setItemSize}     preview="⚔️" />
        <SizeField label="Sprites de materiais e pílulas"     value={materialSize} onChange={setMaterialSize} preview="🌿" />
        <SizeField label="Sprites de monstros"                value={monsterSize}  onChange={setMonsterSize}  preview="👾" />

        <div className="flex items-center gap-3">
          <button onClick={handleSaveSizes} disabled={saving}
            className="px-5 py-2 text-sm border border-jade text-jade bg-jade/10 rounded hover:bg-jade/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar tamanhos'}
          </button>
          {saved && <span className="text-sm text-jade">✓ Salvo! Mudanças aparecem em até 3 min.</span>}
        </div>
      </section>

      {/* ── Frames dos cards ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Frames dos Cards de Item</h2>
        <p className="text-xs text-muted">
          Imagem de borda decorativa exibida sobre os cards. Use PNG ou GIF com fundo transparente e borda visível nas bordas.
          Quando configurado, substitui a borda CSS colorida por raridade. O centro deve ser transparente para o ícone aparecer.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <FrameUpload
            label="🗡️ Equipamentos (arma, armadura, anel)"
            settingKey="frame_equipment_url"
            value={frameEq}
            onSaved={url => { setFrameEq(url); loadSettings() }}
          />
          <FrameUpload
            label="💊 Pílulas"
            settingKey="frame_pill_url"
            value={framePill}
            onSaved={url => { setFramePill(url); loadSettings() }}
          />
          <FrameUpload
            label="🌿 Materiais e Talismãs"
            settingKey="frame_material_url"
            value={frameMat}
            onSaved={url => { setFrameMat(url); loadSettings() }}
          />
        </div>

        <div className="rounded-xl border border-border/40 bg-surface/50 p-3 text-xs text-muted space-y-1">
          <div className="font-semibold text-text/60 mb-1">Dica de criação do frame:</div>
          <div>• Crie uma imagem quadrada (ex: 128×128 px)</div>
          <div>• As bordas devem ter a arte decorativa (ex: dragão, runas, jade)</div>
          <div>• O centro (~60% da imagem) deve ser transparente (alfa 0)</div>
          <div>• Salve como PNG-24 com canal alfa ou GIF transparente</div>
          <div>• A imagem é redimensionada para cobrir o card inteiro via <code>object-fill</code></div>
        </div>
      </section>

    </div>
  )
}
