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

// ── Upload de frame de raridade ───────────────────────────────────

function RarityFrameUpload({ rarity, value, onSaved }: { rarity: Rarity; value: string | null; onSaved: (url: string | null) => void }) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [bust,    setBust]    = useState(() => Date.now())
  const color      = RARITY_COLORS[rarity]
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
      const res  = await fetch(`/api/upload?type=frame&id=${encodeURIComponent(settingKey)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      const url = data.url ?? null
      await api.put('/api/admin/settings', { [settingKey]: url ?? '' })
      onSaved(url); setBust(Date.now())
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro.') }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  const handleRemove = async () => {
    await api.put('/api/admin/settings', { [settingKey]: '' })
    onSaved(null)
  }

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: color + '55', backgroundColor: color + '08' }}>
      <span className="text-xs font-bold px-2 py-0.5 border"
        style={{ color, borderColor: color + '55' }}>
        {RARITY_LABELS[rarity]}
      </span>
      <div className="relative w-full aspect-square border flex items-center justify-center overflow-hidden"
        style={{ borderColor: color + '44', maxHeight: 100 }}>
        {value
          ? <img key={bust} src={`${value}?t=${bust}`} alt="frame" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
          : <span className="text-slate-600 text-xs">Sem frame</span>}
        {value && <span className="text-2xl z-10 pointer-events-none select-none">⚔️</span>}
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
          className="flex-1 px-2 py-1.5 text-xs border transition-colors disabled:opacity-50"
          style={{ borderColor: color + '55', color, backgroundColor: color + '10' }}>
          {loading ? '...' : value ? '↑ Trocar' : '↑ Upload'}
        </button>
        {value && (
          <button type="button" onClick={handleRemove}
            className="px-2 py-1.5 text-xs border border-red-800/40 text-red-400 hover:bg-red-950/20 transition-colors">✕</button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Upload de sprite de personagem ────────────────────────────────

function CharacterSpriteUpload({ label, settingKey, value, onSaved, color }: {
  label: string; settingKey: string; value: string | null; onSaved: (url: string | null) => void; color: string
}) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [bust,    setBust]    = useState(() => Date.now())

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Máx 4 MB.'); return }
    setError(''); setLoading(true)
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('dao_token') ?? ''
    try {
      const res  = await fetch(`/api/upload?type=character&id=${encodeURIComponent(settingKey)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      const url = data.url ?? null
      await api.put('/api/admin/settings', { [settingKey]: url ?? '' })
      onSaved(url); setBust(Date.now())
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro.') }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  const handleRemove = async () => {
    await api.put('/api/admin/settings', { [settingKey]: '' })
    onSaved(null)
  }

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: color + '55', backgroundColor: color + '08' }}>
      <div className="text-xs font-bold" style={{ color }}>{label}</div>
      <div className="relative w-full border flex items-center justify-center overflow-hidden"
        style={{ borderColor: color + '44', height: 160 }}>
        {value
          ? <img key={bust} src={`${value}?t=${bust}`} alt={label} className="h-full w-full object-contain" style={{ imageRendering: 'pixelated' }} />
          : <span className="text-slate-600 text-xs">Sem sprite</span>}
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
          className="flex-1 px-2 py-1.5 text-xs border transition-colors disabled:opacity-50"
          style={{ borderColor: color + '55', color, backgroundColor: color + '10' }}>
          {loading ? '...' : value ? '↑ Trocar' : '↑ Upload'}
        </button>
        {value && (
          <button type="button" onClick={handleRemove}
            className="px-2 py-1.5 text-xs border border-red-800/40 text-red-400 hover:bg-red-950/20 transition-colors">✕</button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────

export function SettingsPanel() {
  const loadSettings     = useSettingsStore(s => s.load)
  const globalItem       = useSettingsStore(s => s.itemSpriteSize)
  const globalMonster    = useSettingsStore(s => s.monsterSpriteSize)
  const globalMaterial   = useSettingsStore(s => s.materialSpriteSize)
  const globalCardSize   = useSettingsStore(s => s.itemCardSize)
  const globalBadgeSize  = useSettingsStore(s => s.itemBadgeSize)
  const globalEquipW     = useSettingsStore(s => s.equipCardWidth)
  const globalEquipH     = useSettingsStore(s => s.equipCardHeight)
  const globalEquipText  = useSettingsStore(s => s.equipTextSize)
  const globalEquipBtn   = useSettingsStore(s => s.equipBtnSize)
  const globalEquipIcons = useSettingsStore(s => s.equipBtnIcons)
  const globalFrameSlice = useSettingsStore(s => s.frameSlice)
  const globalFrameWidth = useSettingsStore(s => s.frameWidth)
  const globalFrames     = useSettingsStore(s => s.rarityFrames)
  const globalCombatMonster  = useSettingsStore(s => s.combatMonsterSize)
  const globalCombatPlayer   = useSettingsStore(s => s.combatPlayerSize)
  const globalCharMale       = useSettingsStore(s => s.characterSpriteMale)
  const globalCharFemale     = useSettingsStore(s => s.characterSpriteFemale)
  const globalCharMaleMed    = useSettingsStore(s => s.characterSpriteMaleMeditation)
  const globalCharFemaleMed  = useSettingsStore(s => s.characterSpriteFemaleMeditation)

  const [itemSize,       setItemSize]       = useState(globalItem)
  const [combatMonster,  setCombatMonster]  = useState(globalCombatMonster)
  const [combatPlayer,   setCombatPlayer]   = useState(globalCombatPlayer)
  const [monsterSize,  setMonsterSize]  = useState(globalMonster)
  const [materialSize, setMaterialSize] = useState(globalMaterial)
  const [cardSize,     setCardSize]     = useState(globalCardSize)
  const [badgeSize,    setBadgeSize]    = useState(globalBadgeSize)
  const [equipW,       setEquipW]       = useState(globalEquipW)
  const [equipH,       setEquipH]       = useState(globalEquipH)
  const [equipText,    setEquipText]    = useState(globalEquipText)
  const [equipBtn,     setEquipBtn]     = useState(globalEquipBtn)
  const [equipIcons,   setEquipIcons]   = useState(globalEquipIcons)
  const [frameSlice,   setFrameSlice]   = useState(globalFrameSlice)
  const [frameWidth,   setFrameWidth]   = useState(globalFrameWidth)
  const [frames,       setFrames]       = useState(globalFrames)
  const [charMale,     setCharMale]     = useState(globalCharMale)
  const [charFemale,   setCharFemale]   = useState(globalCharFemale)
  const [charMaleMed,  setCharMaleMed]  = useState(globalCharMaleMed)
  const [charFemaleMed,setCharFemaleMed]= useState(globalCharFemaleMed)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setItemSize(globalItem); setMonsterSize(globalMonster); setMaterialSize(globalMaterial)
    setCardSize(globalCardSize); setBadgeSize(globalBadgeSize)
    setEquipW(globalEquipW); setEquipH(globalEquipH); setEquipText(globalEquipText)
    setEquipBtn(globalEquipBtn); setEquipIcons(globalEquipIcons)
    setFrameSlice(globalFrameSlice); setFrameWidth(globalFrameWidth); setFrames(globalFrames)
    setCombatMonster(globalCombatMonster); setCombatPlayer(globalCombatPlayer)
    setCharMale(globalCharMale); setCharFemale(globalCharFemale)
    setCharMaleMed(globalCharMaleMed); setCharFemaleMed(globalCharFemaleMed)
  }, [globalItem, globalMonster, globalMaterial, globalCardSize, globalBadgeSize,
      globalEquipW, globalEquipH, globalEquipText, globalEquipBtn, globalEquipIcons,
      globalFrameSlice, globalFrameWidth, globalFrames,
      globalCombatMonster, globalCombatPlayer,
      globalCharMale, globalCharFemale, globalCharMaleMed, globalCharFemaleMed])

  const handleSaveSizes = async () => {
    setSaving(true); setSaved(false)
    await api.put('/api/admin/settings', {
      item_sprite_size:     String(itemSize),
      monster_sprite_size:  String(monsterSize),
      material_sprite_size: String(materialSize),
      item_card_size:       String(cardSize),
      item_badge_size:      String(badgeSize),
      equip_card_width:     String(equipW),
      equip_card_height:    String(equipH),
      equip_text_size:      String(equipText),
      equip_btn_size:       String(equipBtn),
      equip_btn_icons:      equipIcons ? '1' : '0',
      frame_slice:          String(frameSlice),
      frame_width:          String(frameWidth),
      combat_monster_size:  String(combatMonster),
      combat_player_size:   String(combatPlayer),
    })
    await loadSettings()
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SizeField = ({ label, value, onChange, preview, min = 16, max = 200, step = 4, presets }: {
    label: string; value: number; onChange: (v: number) => void; preview: string
    min?: number; max?: number; step?: number; presets?: number[]
  }) => {
    const pts = presets ?? [min, Math.round((min + max) * 0.25), Math.round((min + max) * 0.5),
                             Math.round((min + max) * 0.75), max]
    return (
      <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200">{label}</label>
          <span className="text-xs text-slate-500 border border-slate-700 bg-slate-800 px-2 py-0.5 tabular-nums">{value}px</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))} className="w-full accent-teal-500" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-8">Min</span>
          <div className="flex-1 flex justify-between text-xs text-slate-500">
            {pts.map(v => (
              <button key={v} onClick={() => onChange(v)}
                className={`px-1.5 py-0.5 border transition-colors ${
                  value === v
                    ? 'bg-teal-950/30 border-teal-700/60 text-teal-400'
                    : 'border-transparent hover:text-slate-300'}`}>
                {v}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-600 w-8 text-right">Max</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700">
          <span className="text-xs text-slate-500 shrink-0">Preview:</span>
          <span style={{ fontSize: Math.min(value * 0.72, 48) }}>{preview}</span>
          <span className="text-xs text-slate-600">{value}px</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Tamanho dos sprites ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <h2 className="font-cinzel text-sm font-bold text-slate-200 tracking-widest uppercase flex-1">
            Tamanho dos Sprites
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Tamanho padrão dos ícones nos cards. Lugares com tamanho fixo (batalha, detalhes) não são afetados.
        </p>

        <SizeField label="Sprites de itens (equipamentos)"            value={itemSize}    onChange={setItemSize}    preview="⚔️" />
        <SizeField label="Sprites de materiais e pílulas"             value={materialSize} onChange={setMaterialSize} preview="🌿" />
        <SizeField label="Sprites de monstros (Codex / Bestiário)"   value={monsterSize}  onChange={setMonsterSize}  preview="👾" />
        <SizeField label="Tamanho dos cards de material/pílula"       value={cardSize}    onChange={setCardSize}     preview="💊" />
        <SizeField label="Tamanho do badge nos cards de material"
          value={badgeSize} onChange={setBadgeSize} preview="🏷️" min={8} max={24} step={1} presets={[8,10,12,14,18,24]} />

        <div className="grid grid-cols-2 gap-4">
          <SizeField label="Largura do card de equipamento" value={equipW} onChange={setEquipW}
            min={100} max={300} step={10} presets={[100,140,180,220,260,300]} preview="↔️" />
          <SizeField label="Altura do card de equipamento"  value={equipH} onChange={setEquipH}
            min={150} max={400} step={10} presets={[150,200,250,300,350,400]} preview="↕️" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SizeField label="Texto do card (nome/stats)" value={equipText} onChange={setEquipText}
            min={8} max={16} step={1} presets={[8,10,11,12,14,16]} preview="Aa" />
          <SizeField label="Tamanho dos botões do card"   value={equipBtn}  onChange={setEquipBtn}
            min={8} max={16} step={1} presets={[8,10,11,12,14,16]} preview="⚙️" />
        </div>

        <div className="border border-slate-700 bg-slate-900 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Ícones nos botões</div>
            <div className="text-xs text-slate-500 mt-0.5">Exibe emoji antes do texto do botão (ex: 💍 Equipar)</div>
          </div>
          <button onClick={() => setEquipIcons(v => !v)}
            className={`relative w-12 h-6 border transition-all ${
              equipIcons ? 'bg-teal-900/30 border-teal-700' : 'bg-slate-800 border-slate-700'}`}>
            <span className={`absolute top-0.5 w-5 h-5 transition-all ${
              equipIcons ? 'left-6 bg-teal-500' : 'left-0.5 bg-slate-600'}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSaveSizes} disabled={saving}
            className="px-5 py-2 text-sm border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar tamanhos'}
          </button>
          {saved && <span className="text-sm text-teal-400">✓ Salvo!</span>}
        </div>
      </section>

      {/* ── Sprites na Batalha ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <h2 className="font-cinzel text-sm font-bold text-slate-200 tracking-widest uppercase flex-1">
            Sprites na Batalha
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Tamanho dos sprites exibidos na arena de combate. Independentes dos tamanhos do Codex.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <SizeField label="Monstro (arena)" value={combatMonster} onChange={setCombatMonster}
            preview="👾" min={80} max={400} step={8} presets={[80, 120, 160, 220, 280, 400]} />
          <SizeField label="Personagem (arena)" value={combatPlayer} onChange={setCombatPlayer}
            preview="🧙" min={80} max={400} step={8} presets={[80, 120, 180, 240, 300, 400]} />
        </div>
      </section>

      {/* ── Frames por raridade ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <h2 className="font-cinzel text-sm font-bold text-slate-200 tracking-widest uppercase flex-1">
            Frames de Raridade
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Borda decorativa sobre os cards de item. PNG ou GIF com centro transparente para o ícone aparecer.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <SizeField label="Slice da borda (% da imagem que é borda)"
            value={frameSlice} onChange={setFrameSlice}
            min={5} max={49} step={1} presets={[10,20,30,40,45,49]} preview="✂️" />
          <SizeField label="Espessura visual da borda (px)"
            value={frameWidth} onChange={setFrameWidth}
            min={2} max={64} step={2} presets={[4,8,12,16,24,32]} preview="📐" />
        </div>

        <div className="border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-500 mb-1">Como calibrar:</div>
          <div>• <b>Slice</b>: % da imagem que contém a borda. Para 1024×1024 com borda de ~300px, use ~30%.</div>
          <div>• <b>Espessura</b>: pixels da borda no card. Slice 25–35% + Espessura 8–16px costuma ficar bom.</div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {RARITY_PROGRESSION.map(rarity => (
            <RarityFrameUpload key={rarity} rarity={rarity} value={frames[rarity]}
              onSaved={url => { setFrames(prev => ({ ...prev, [rarity]: url })); loadSettings() }} />
          ))}
        </div>
      </section>

      {/* ── Sprites de personagem ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <h2 className="font-cinzel text-sm font-bold text-slate-200 tracking-widest uppercase flex-1">
            Sprites de Personagem
          </h2>
        </div>
        <p className="text-xs text-slate-600">PNG ou GIF com fundo transparente. Usa sprite padrão quando não configurado.</p>

        <div className="text-xs text-slate-500 font-cinzel uppercase tracking-widest">Seleção de Personagem</div>
        <div className="grid grid-cols-2 gap-4">
          <CharacterSpriteUpload label="Masculino — Seleção" settingKey="character_sprite_male_url"
            value={charMale} color="#60a5fa" onSaved={url => { setCharMale(url); loadSettings() }} />
          <CharacterSpriteUpload label="Feminino — Seleção" settingKey="character_sprite_female_url"
            value={charFemale} color="#f472b6" onSaved={url => { setCharFemale(url); loadSettings() }} />
        </div>

        <div className="text-xs text-slate-500 font-cinzel uppercase tracking-widest">Meditação</div>
        <div className="grid grid-cols-2 gap-4">
          <CharacterSpriteUpload label="Masculino — Meditação" settingKey="character_sprite_male_meditation_url"
            value={charMaleMed} color="#60a5fa" onSaved={url => { setCharMaleMed(url); loadSettings() }} />
          <CharacterSpriteUpload label="Feminino — Meditação" settingKey="character_sprite_female_meditation_url"
            value={charFemaleMed} color="#f472b6" onSaved={url => { setCharFemaleMed(url); loadSettings() }} />
        </div>
      </section>

    </div>
  )
}
