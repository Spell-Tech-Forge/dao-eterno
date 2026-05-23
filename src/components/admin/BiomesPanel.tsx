import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import { SpriteUpload } from './SpriteUpload'
import { BulkImportButton } from './BulkImportButton'

const REALMS = [
  { id: 'qi_refining',           label: 'Refinamento de Qi' },
  { id: 'foundation',            label: 'Fundação Espiritual' },
  { id: 'golden_core',           label: 'Núcleo Dourado' },
  { id: 'nascent_soul',          label: 'Alma Nascente' },
  { id: 'spirit_transformation', label: 'Transformação Espiritual' },
  { id: 'unification',           label: 'Unificação' },
  { id: 'ascension',             label: 'Ascensão' },
  { id: 'immortal',              label: 'Imortal' },
]
const STAGES = [
  { id: 'initial',  label: 'Inicial'  },
  { id: 'middle',   label: 'Médio'    },
  { id: 'advanced', label: 'Avançado' },
  { id: 'peak',     label: 'Pico'     },
]
const RARITIES = ['common','uncommon','spiritual','rare','ancient','legendary']
const RARITY_LABELS: Record<string, string> = {
  common:'Mortal', uncommon:'Espiritual', spiritual:'Terrestre',
  rare:'Celestial', ancient:'Sagrado', legendary:'Imortal',
}
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

interface StatMod { hp: number; atk: number; def: number }
interface StatModifiers { common: StatMod; elite: StatMod; boss: StatMod }
const DEFAULT_MODS: StatModifiers = {
  common: { hp: 100, atk: 100, def: 100 },
  elite:  { hp: 100, atk: 100, def: 100 },
  boss:   { hp: 100, atk: 100, def: 100 },
}

interface DbBiome {
  id: string; name: string; description: string
  required_realm: string; required_stage: string
  difficulty: number; biome_type: string
  active_days: number[]; active_start_time: string | null; active_end_time: string | null
  active_until: string | null
  enemy_pool: string[]; boss_id: string | null
  min_kills_boss: number; boss_spawn_chance: number
  rarity_weights: Record<string, number>; boss_rarity: string
  gradient: string; accent_color: string; sort_order: number; active: boolean
  background_url: string | null; background_position: string | null
  stat_modifiers: StatModifiers | null
}

interface DbMonster { id: string; name: string; emoji: string; biome_id: string; level_min: number; level_max: number }

const EMPTY: Omit<DbBiome, 'id'> & { id: string } = {
  id: '', name: '', description: '',
  required_realm: 'qi_refining', required_stage: 'initial',
  difficulty: 1, biome_type: 'fixed',
  active_days: [0,1,2,3,4,5,6], active_start_time: null, active_end_time: null, active_until: null,
  enemy_pool: [], boss_id: null,
  min_kills_boss: 10, boss_spawn_chance: 0.20,
  rarity_weights: { common: 60, uncommon: 40 },
  boss_rarity: 'rare',
  gradient: 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
  accent_color: '#4a9e7f', sort_order: 0, active: true, background_url: null, background_position: null,
  stat_modifiers: null,
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

// ── Modal de posicionamento ───────────────────────────────────────

function parsePosition(pos: string): [number, number] {
  const parts = pos.trim().split(/\s+/)
  const parse = (s: string): number => {
    if (s === 'center') return 50
    if (s === 'left' || s === 'top') return 0
    if (s === 'right' || s === 'bottom') return 100
    const v = parseFloat(s)
    return isNaN(v) ? 50 : v
  }
  return [parse(parts[0] ?? '50%'), parse(parts[1] ?? '50%')]
}

function ImagePositionModal({ imageUrl, position, onApply, onClose }: {
  imageUrl: string; position: string; onApply: (pos: string) => void; onClose: () => void
}) {
  const [x, y] = parsePosition(position)
  const [posX, setPosX] = useState(x)
  const [posY, setPosY] = useState(y)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const dragStart  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current || !previewRef.current || !imgNatural) return
      const rect   = previewRef.current.getBoundingClientRect()
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      const aspect  = imgNatural.w / imgNatural.h
      const cAspect = rect.width / rect.height
      let dispW: number, dispH: number
      if (aspect > cAspect) { dispH = rect.height; dispW = imgNatural.w * (rect.height / imgNatural.h) }
      else                  { dispW = rect.width;  dispH = imgNatural.h * (rect.width  / imgNatural.w) }
      const hiddenW = Math.max(1, dispW - rect.width)
      const hiddenH = Math.max(1, dispH - rect.height)
      setPosX(Math.max(0, Math.min(100, dragStart.current.px - (dx / hiddenW) * 100)))
      setPosY(Math.max(0, Math.min(100, dragStart.current.py - (dy / hiddenH) * 100)))
    }
    const onUp = () => { dragStart.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [imgNatural])

  const posStr = `${Math.round(posX)}% ${Math.round(posY)}%`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="border border-slate-700 bg-slate-950 w-full max-w-5xl mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel font-bold text-slate-200 tracking-wider text-sm">Posicionar Imagem de Fundo</h2>
            <p className="text-xs text-slate-500 mt-0.5">Arraste para escolher a área visível na arena de batalha.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg">✕</button>
        </div>
        <div ref={previewRef} onMouseDown={e => { dragStart.current = { mx: e.clientX, my: e.clientY, px: posX, py: posY }; e.preventDefault() }}
          className="relative overflow-hidden border border-slate-600 select-none"
          style={{ height: 240, cursor: 'grab', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: posStr }}>
          <div className="absolute inset-0 border-2 border-white/25 border-dashed pointer-events-none" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 border border-white/20 pointer-events-none">
            <span className="text-white/40 text-[10px] tracking-[0.3em] font-cinzel uppercase">Arena</span>
          </div>
          {!imgNatural && <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Carregando...</div>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Posição Horizontal</span>
              <span className="tabular-nums text-slate-300">{Math.round(posX)}%</span>
            </div>
            <input type="range" min={0} max={100} value={posX}
              onChange={e => setPosX(Number(e.target.value))} className="w-full accent-purple-500" />
            <div className="flex justify-between text-[10px] text-slate-600"><span>Esquerda</span><span>Direita</span></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Posição Vertical</span>
              <span className="tabular-nums text-slate-300">{Math.round(posY)}%</span>
            </div>
            <input type="range" min={0} max={100} value={posY}
              onChange={e => setPosY(Number(e.target.value))} className="w-full accent-purple-500" />
            <div className="flex justify-between text-[10px] text-slate-600"><span>Topo</span><span>Base</span></div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-600 font-mono">{posStr}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
            <button onClick={() => { onApply(posStr); onClose() }}
              className="px-4 py-1.5 text-xs border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors">Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────

interface Props { onMutate: () => void }

export function BiomesPanel({ onMutate }: Props) {
  const [biomes,       setBiomes]       = useState<DbBiome[]>([])
  const [monsters,     setMonsters]     = useState<DbMonster[]>([])
  const [editing,      setEditing]      = useState<DbBiome | null>(null)
  const [isNew,        setIsNew]        = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [msg,          setMsg]          = useState('')
  const [modOpen,      setModOpen]      = useState<string | null>(null)
  const [modDraft,     setModDraft]     = useState<StatModifiers>(DEFAULT_MODS)
  const [modSaving,    setModSaving]    = useState(false)

  const load = useCallback(async () => {
    const [bs, ms] = await Promise.all([
      api.get<DbBiome[]>('/api/admin/biomes'),
      api.get<DbMonster[]>('/api/admin/monsters'),
    ])
    setBiomes(bs); setMonsters(ms)
  }, [])
  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function handleSave() {
    if (!editing) return
    setLoading(true)
    try {
      const payload = { ...editing }
      if (editing.id && biomes.find(b => b.id === editing.id))
        await api.put(`/api/admin/biomes/${editing.id}`, payload)
      else
        await api.post('/api/admin/biomes', payload)
      flash(isNew ? 'Bioma criado!' : 'Bioma atualizado!')
      setEditing(null); load(); onMutate()
    } catch (e) { flash(e instanceof Error ? e.message : 'Erro.') }
    finally { setLoading(false) }
  }

  function openModifiers(b: DbBiome) {
    setModOpen(b.id)
    setModDraft(b.stat_modifiers ?? DEFAULT_MODS)
  }

  async function saveModifiers(biomeId: string) {
    setModSaving(true)
    try {
      await api.put(`/api/admin/biomes/${biomeId}/modifiers`, modDraft)
      flash('Modificadores salvos!')
      setModOpen(null)
      load(); onMutate()
    } catch { flash('Erro ao salvar modificadores.') }
    finally { setModSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Excluir bioma "${id}"?`)) return
    await api.delete(`/api/admin/biomes/${id}`)
    flash('Excluído!'); load(); onMutate()
  }

  async function handleDeleteAll() {
    if (!confirm(`Excluir TODOS os ${biomes.length} biomas? Essa ação não pode ser desfeita.`)) return
    await api.delete('/api/admin/biomes')
    flash('Todos excluídos!'); load(); onMutate()
  }

  async function handleToggleActive(b: DbBiome) {
    await api.put(`/api/admin/biomes/${b.id}`, { ...b, active: !b.active })
    flash(b.active ? `"${b.name}" desativado.` : `"${b.name}" ativado!`)
    load(); onMutate()
  }

  if (editing) return (
    <BiomeForm biome={editing} isNew={isNew} monsters={monsters} loading={loading} msg={msg}
      onChange={b => setEditing(b)} onSave={handleSave} onCancel={() => setEditing(null)} />
  )

  return (
    <div className="space-y-4">
      {msg && <div className="text-xs px-3 py-2 border border-teal-700/60 bg-teal-950/20 text-teal-400">{msg}</div>}

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => { setIsNew(true); setEditing({ ...EMPTY }) }}
          className="px-4 py-2 text-sm border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors">
          + Novo Bioma
        </button>
        <BulkImportButton endpoint="/api/admin/biomes/seed" label="Importar JSON" onSuccess={load} />
        <button onClick={handleDeleteAll}
          className="px-4 py-1.5 text-sm border border-red-900/60 text-red-400 bg-red-950/10 hover:bg-red-950/30 transition-colors">
          🗑 Excluir Tudo
        </button>
      </div>

      <div className="space-y-2">
        {biomes.map(b => (
          <div key={b.id} className="border border-slate-700 bg-slate-900">
            <div className="p-4 flex items-center gap-4 hover:bg-slate-800/40 transition-colors">
              <div className="w-1 h-10 shrink-0 self-stretch" style={{ background: b.accent_color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel font-bold text-slate-200 text-sm">{b.name}</span>
                  {b.biome_type === 'temporary' && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-violet-700/50 text-violet-400">⏳ Temporário</span>
                  )}
                  {b.stat_modifiers && hasCustomMods(b.stat_modifiers) && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-amber-700/50 text-amber-400">⚡ Modificado</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {REALMS.find(r => r.id === b.required_realm)?.label} · Dif. {b.difficulty}/10 · {b.enemy_pool?.length ?? 0} monstros
                </div>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <button onClick={() => modOpen === b.id ? setModOpen(null) : openModifiers(b)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    modOpen === b.id
                      ? 'border-amber-500/60 text-amber-400 bg-amber-950/20'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                  }`}>
                  ⚡ Stats
                </button>
                <button onClick={() => handleToggleActive(b)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    b.active
                      ? 'border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40'
                      : 'border-red-800/40 text-red-400 bg-red-950/10 hover:bg-red-950/30'
                  }`}>
                  {b.active ? '● Ativo' : '○ Inativo'}
                </button>
                <button onClick={() => { setIsNew(false); setEditing(b) }}
                  className="px-3 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDelete(b.id)}
                  className="px-3 py-1.5 text-xs border border-red-800/40 text-red-400 hover:bg-red-950/20 transition-colors">
                  Excluir
                </button>
              </div>
            </div>

            {modOpen === b.id && (
              <div className="border-t border-slate-700 bg-slate-950 p-4 space-y-3">
                <div className="text-xs font-cinzel font-bold uppercase tracking-widest text-amber-500/70 mb-2">
                  Modificadores de Stats — {b.name}
                </div>
                <ModifiersGrid mods={modDraft} onChange={setModDraft} />
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => saveModifiers(b.id)} disabled={modSaving}
                    className="px-4 py-1.5 text-xs border border-amber-500/60 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-colors disabled:opacity-50">
                    {modSaving ? 'Salvando...' : 'Salvar modificadores'}
                  </button>
                  <button onClick={() => { setModDraft(DEFAULT_MODS) }}
                    className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                    Resetar para 100%
                  </button>
                  <button onClick={() => setModOpen(null)}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors ml-auto">
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {biomes.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-12 border border-slate-800">Nenhum bioma cadastrado.</div>
        )}
      </div>
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────────────

interface FormProps {
  biome: DbBiome; isNew: boolean; monsters: DbMonster[]
  loading: boolean; msg: string
  onChange: (b: DbBiome) => void; onSave: () => void; onCancel: () => void
}

function BiomeForm({ biome, isNew, monsters, loading, msg, onChange, onSave, onCancel }: FormProps) {
  const set = (patch: Partial<DbBiome>) => onChange({ ...biome, ...patch })
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [bossTierFilter, setBossTierFilter] = useState<number | 'all'>('all')

  const bossTiers = [...new Set(monsters.map(m => m.level_min))].sort((a, b) => a - b)
  const filteredBossMonsters = bossTierFilter === 'all'
    ? monsters
    : monsters.filter(m => m.level_min === bossTierFilter)

  const toggleDay  = (d: number) => {
    const days = biome.active_days ?? []
    set({ active_days: days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort() })
  }
  const setWeight  = (rarity: string, val: string) => {
    const v = parseFloat(val)
    set({ rarity_weights: { ...biome.rarity_weights, [rarity]: isNaN(v) ? 0 : v } })
  }
  const addToPool  = (id: string) => { if (id && !biome.enemy_pool.includes(id)) set({ enemy_pool: [...biome.enemy_pool, id] }) }
  const removeFromPool = (id: string) => set({ enemy_pool: biome.enemy_pool.filter(x => x !== id) })

  return (
    <div className="space-y-5">
      {msg && <div className="text-xs px-3 py-2 border border-teal-700/60 bg-teal-950/20 text-teal-400">{msg}</div>}

      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onCancel} className="text-xs border border-slate-700 text-slate-400 px-3 py-1.5 hover:bg-slate-800 transition-colors">← Voltar</button>
        <h2 className="font-cinzel font-bold text-amber-400 tracking-wider text-base flex-1">
          {isNew ? 'Novo Bioma' : `Editar: ${biome.name}`}
        </h2>
        <button onClick={onSave} disabled={loading}
          className="px-5 py-2 border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-sm font-bold transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Coluna 1 */}
        <div className="space-y-4">
          <Section title="Informações Básicas">
            <Field label="ID">
              <input className={inp} value={biome.id} onChange={e => set({ id: e.target.value })}
                placeholder="ex: forest_of_trials" disabled={!isNew} />
            </Field>
            <Field label="Nome">
              <input className={inp} value={biome.name} onChange={e => set({ name: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea className={`${inp} h-20 resize-none`} value={biome.description}
                onChange={e => set({ description: e.target.value })} />
            </Field>
          </Section>

          <Section title="Requisito de Acesso">
            <Field label="Reino">
              <select className={inp} value={biome.required_realm} onChange={e => set({ required_realm: e.target.value })}>
                {REALMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Estágio">
              <select className={inp} value={biome.required_stage} onChange={e => set({ required_stage: e.target.value })}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Dificuldade (1–10)">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={10} value={biome.difficulty}
                  onChange={e => set({ difficulty: parseInt(e.target.value) })} className="flex-1 accent-amber-500" />
                <span className="text-amber-400 font-bold tabular-nums w-4">{biome.difficulty}</span>
              </div>
            </Field>
          </Section>

          <Section title="Tipo de Bioma">
            <div className="flex gap-4">
              {(['fixed','temporary'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input type="radio" checked={biome.biome_type === t} onChange={() => set({ biome_type: t })} className="accent-amber-500" />
                  {t === 'fixed' ? '🗺️ Fixo' : '⏳ Temporário'}
                </label>
              ))}
            </div>
            {biome.biome_type === 'temporary' && (
              <div className="mt-3 space-y-3 pl-3 border-l border-amber-800/40">
                <Field label="Dias ativos">
                  <div className="flex gap-1 flex-wrap">
                    {DAY_NAMES.map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)}
                        className={`px-2 py-1 text-xs font-bold border transition-all ${
                          biome.active_days?.includes(i)
                            ? 'bg-amber-950/30 border-amber-500/60 text-amber-400'
                            : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Início">
                    <input type="time" className={inp} value={biome.active_start_time ?? ''}
                      onChange={e => set({ active_start_time: e.target.value || null })} />
                  </Field>
                  <Field label="Fim">
                    <input type="time" className={inp} value={biome.active_end_time ?? ''}
                      onChange={e => set({ active_end_time: e.target.value || null })} />
                  </Field>
                </div>
                <Field label="Expiração (opcional)">
                  <input type="datetime-local" className={inp} value={biome.active_until?.slice(0,16) ?? ''}
                    onChange={e => set({ active_until: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </Field>
              </div>
            )}
          </Section>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-4">
          <Section title="Pool de Monstros">
            <MonsterPoolEditor pool={biome.enemy_pool} allMonsters={monsters} onAdd={addToPool} onRemove={removeFromPool} />
          </Section>

          <Section title="Boss">
            <Field label="Boss">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-0.5">Tier:</span>
                  <button onClick={() => setBossTierFilter('all')}
                    className={`text-xs px-2 py-0.5 border transition-all ${bossTierFilter === 'all'
                      ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
                    Todos
                  </button>
                  {bossTiers.map(t => (
                    <button key={t} onClick={() => setBossTierFilter(bossTierFilter === t ? 'all' : t)}
                      className={`text-xs px-2 py-0.5 border transition-all ${bossTierFilter === t
                        ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
                      T{t}
                    </button>
                  ))}
                </div>
                <select className={inp} value={biome.boss_id ?? ''} onChange={e => set({ boss_id: e.target.value || null })}>
                  <option value="">— Nenhum —</option>
                  {filteredBossMonsters.map(m => (
                    <option key={m.id} value={m.id}>{m.emoji} {m.name} (T{m.level_min})</option>
                  ))}
                </select>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kills antes do boss">
                <input type="number" className={inp} value={biome.min_kills_boss}
                  onChange={e => set({ min_kills_boss: parseInt(e.target.value) || 10 })} />
              </Field>
              <Field label="Chance boss (0–1)">
                <input type="number" step="0.01" min={0} max={1} className={inp}
                  value={biome.boss_spawn_chance}
                  onChange={e => set({ boss_spawn_chance: parseFloat(e.target.value) || 0.2 })} />
              </Field>
            </div>
            <Field label="Raridade do boss">
              <select className={inp} value={biome.boss_rarity} onChange={e => set({ boss_rarity: e.target.value })}>
                {RARITIES.map(r => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Pesos de Raridade">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {RARITIES.map(r => (
                <Field key={r} label={RARITY_LABELS[r]}>
                  <input type="number" min={0} className={inp} value={biome.rarity_weights[r] ?? 0}
                    onChange={e => setWeight(r, e.target.value)} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Visual">
            <Field label="Gradient CSS (fundo padrão)">
              <input className={inp} value={biome.gradient} onChange={e => set({ gradient: e.target.value })}
                placeholder="linear-gradient(135deg, ...)" />
            </Field>
            <Field label="Cor de destaque">
              <div className="flex items-center gap-2">
                <input type="color" value={biome.accent_color} onChange={e => set({ accent_color: e.target.value })}
                  className="w-10 h-9 cursor-pointer border border-slate-700 bg-transparent" />
                <input className={`${inp} flex-1`} value={biome.accent_color} onChange={e => set({ accent_color: e.target.value })} />
              </div>
            </Field>
            <Field label="Ordem de exibição">
              <input type="number" className={inp} value={biome.sort_order}
                onChange={e => set({ sort_order: parseInt(e.target.value) || 0 })} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={biome.active} onChange={e => set({ active: e.target.checked })} className="accent-teal-500" />
              Ativo
            </label>
            <div className="pt-1 space-y-2">
              <SpriteUpload value={biome.background_url} onChange={url => set({ background_url: url })}
                type="biome" entityId={biome.id} label="Imagem de fundo da arena (PNG / GIF)" />
              {!biome.id && <p className="text-xs text-slate-600">Salve o bioma primeiro para habilitar o upload de fundo.</p>}
              {biome.background_url && (
                <button type="button" onClick={() => setShowPositionModal(true)}
                  className="w-full py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors text-center">
                  🎯 Posicionar imagem na arena
                </button>
              )}
              {showPositionModal && biome.background_url && (
                <ImagePositionModal imageUrl={biome.background_url}
                  position={biome.background_position ?? '50% 50%'}
                  onApply={pos => set({ background_position: pos })}
                  onClose={() => setShowPositionModal(false)} />
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
      <div className="text-xs font-cinzel font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2 mb-1">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function hasCustomMods(m: StatModifiers): boolean {
  for (const type of ['common', 'elite', 'boss'] as const)
    for (const stat of ['hp', 'atk', 'def'] as const)
      if (m[type][stat] !== 100) return true
  return false
}

const MOD_LABELS: Record<string, string> = { common: 'Comuns', elite: 'Elites', boss: 'Boss' }
const STAT_LABELS: Record<string, string> = { hp: 'HP', atk: 'ATK', def: 'DEF' }

function ModifiersGrid({ mods, onChange }: { mods: StatModifiers; onChange: (m: StatModifiers) => void }) {
  const set = (type: keyof StatModifiers, stat: keyof StatMod, val: string) => {
    const v = parseInt(val)
    onChange({ ...mods, [type]: { ...mods[type], [stat]: isNaN(v) ? 100 : Math.max(1, Math.min(999, v)) } })
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-slate-600 font-normal pb-2 pr-4 w-20"></th>
            {(['hp', 'atk', 'def'] as const).map(s => (
              <th key={s} className="text-center text-slate-500 font-bold pb-2 px-2 w-24">{STAT_LABELS[s]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(['common', 'elite', 'boss'] as const).map(type => (
            <tr key={type} className="border-t border-slate-800">
              <td className="py-2 pr-4 text-slate-400 font-bold">{MOD_LABELS[type]}</td>
              {(['hp', 'atk', 'def'] as const).map(stat => {
                const val = mods[type][stat]
                const isCustom = val !== 100
                return (
                  <td key={stat} className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={1} max={999} value={val}
                        onChange={e => set(type, stat, e.target.value)}
                        className={`w-16 bg-slate-800 border px-2 py-1 text-center outline-none focus:border-amber-600 tabular-nums ${
                          isCustom ? 'border-amber-700/60 text-amber-300' : 'border-slate-700 text-slate-300'
                        }`}
                      />
                      <span className={`text-[10px] ${isCustom ? 'text-amber-500' : 'text-slate-600'}`}>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-slate-600 mt-2">100% = sem alteração · 150% = +50% · 50% = −50%</p>
    </div>
  )
}

function MonsterPoolEditor({ pool, allMonsters, onAdd, onRemove }: {
  pool: string[]; allMonsters: DbMonster[]; onAdd: (id: string) => void; onRemove: (id: string) => void
}) {
  const [sel, setSel]           = useState('')
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all')

  const tiers = [...new Set(allMonsters.map(m => m.level_min))].sort((a, b) => a - b)

  const available = allMonsters.filter(m =>
    !pool.includes(m.id) &&
    (tierFilter === 'all' || m.level_min === tierFilter)
  )

  return (
    <div className="space-y-2">
      {/* Filtro por tier */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-0.5">Tier:</span>
        <button onClick={() => { setTierFilter('all'); setSel('') }}
          className={`text-xs px-2 py-0.5 border transition-all ${tierFilter === 'all'
            ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
          Todos
        </button>
        {tiers.map(t => (
          <button key={t} onClick={() => { setTierFilter(tierFilter === t ? 'all' : t); setSel('') }}
            className={`text-xs px-2 py-0.5 border transition-all ${tierFilter === t
              ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
              : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
            T{t}
          </button>
        ))}
      </div>

      {/* Select + botão adicionar */}
      <div className="flex gap-2">
        <select className={`${inp} flex-1`} value={sel} onChange={e => setSel(e.target.value)}>
          <option value="">— Selecionar monstro ({available.length}) —</option>
          {available.map(m => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name} (T{m.level_min})
            </option>
          ))}
        </select>
        <button onClick={() => { onAdd(sel); setSel('') }} disabled={!sel}
          className="px-3 py-1.5 border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 text-sm font-bold transition-colors disabled:opacity-30">
          +
        </button>
      </div>

      {/* Pool atual */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {pool.map(id => {
          const m = allMonsters.find(x => x.id === id)
          return (
            <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300">
              {m?.emoji} {m?.name ?? id}
              {m && <span className="text-slate-600 text-[10px]">T{m.level_min}</span>}
              <button onClick={() => onRemove(id)} className="text-red-500/60 hover:text-red-400 ml-0.5">×</button>
            </span>
          )
        })}
        {pool.length === 0 && <span className="text-xs text-slate-600">Nenhum monstro adicionado.</span>}
      </div>
    </div>
  )
}
