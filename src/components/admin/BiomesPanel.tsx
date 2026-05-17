import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'

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
}

interface DbMonster { id: string; name: string; emoji: string; biome_id: string }

const EMPTY: Omit<DbBiome, 'id'> & { id: string } = {
  id: '', name: '', description: '',
  required_realm: 'qi_refining', required_stage: 'initial',
  difficulty: 1, biome_type: 'fixed',
  active_days: [0,1,2,3,4,5,6], active_start_time: null, active_end_time: null,
  active_until: null,
  enemy_pool: [], boss_id: null,
  min_kills_boss: 10, boss_spawn_chance: 0.20,
  rarity_weights: { common: 60, uncommon: 40 },
  boss_rarity: 'rare',
  gradient: 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
  accent_color: '#4a9e7f', sort_order: 0, active: true,
}

interface Props { onMutate: () => void }

export function BiomesPanel({ onMutate }: Props) {
  const [biomes,   setBiomes]   = useState<DbBiome[]>([])
  const [monsters, setMonsters] = useState<DbMonster[]>([])
  const [editing,  setEditing]  = useState<DbBiome | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState('')

  const load = useCallback(async () => {
    const [bs, ms] = await Promise.all([
      api.get<DbBiome[]>('/api/admin/biomes'),
      api.get<DbMonster[]>('/api/admin/monsters'),
    ])
    setBiomes(bs)
    setMonsters(ms)
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function handleSave() {
    if (!editing) return
    setLoading(true)
    try {
      const payload = {
        ...editing,
        rarity_weights: editing.rarity_weights,
        enemy_pool: editing.enemy_pool,
        active_days: editing.active_days,
      }
      if (editing.id && biomes.find(b => b.id === editing.id)) {
        await api.put(`/api/admin/biomes/${editing.id}`, payload)
        flash('Bioma atualizado!')
      } else {
        await api.post('/api/admin/biomes', payload)
        flash('Bioma criado!')
      }
      setEditing(null); load(); onMutate()
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Excluir bioma "${id}"?`)) return
    await api.delete(`/api/admin/biomes/${id}`)
    flash('Excluído!'); load(); onMutate()
  }

  async function handleSeed() {
    const { BIOME_DEFS, BIOME_ORDER } = await import('../../data/biomes')
    const arr = BIOME_ORDER.map((id, i) => {
      const b = BIOME_DEFS[id]
      return {
        id: b.id, name: b.name, description: b.description,
        required_realm: b.requiredRealm, required_stage: b.requiredStage,
        difficulty: b.difficulty, biome_type: b.biomeType,
        enemy_pool: b.enemyPool, boss_id: b.bossId || null,
        min_kills_boss: b.minKillsBeforeBoss, boss_spawn_chance: b.bossSpawnChance,
        rarity_weights: b.normalRarityWeights, boss_rarity: b.bossRarity,
        gradient: b.theme.gradient, accent_color: b.theme.accentColor,
        sort_order: b.sortOrder ?? i, active_days: [0,1,2,3,4,5,6],
      }
    })
    const r = await api.post<{ inserted: number }>('/api/admin/biomes/seed', arr)
    flash(`${r.inserted} biomas importados!`); load(); onMutate()
  }

  if (editing) return (
    <BiomeForm
      biome={editing}
      monsters={monsters}
      loading={loading}
      msg={msg}
      onChange={b => setEditing(b)}
      onSave={handleSave}
      onCancel={() => setEditing(null)}
    />
  )

  return (
    <div className="space-y-4">
      {msg && <div className="text-xs px-3 py-2 rounded bg-jade/10 border border-jade text-jade">{msg}</div>}

      <div className="flex items-center gap-2">
        <button onClick={() => setEditing({ ...EMPTY })}
          className="px-4 py-2 bg-jade text-white rounded-lg text-sm font-bold hover:bg-jade/80">
          + Novo Bioma
        </button>
        <button onClick={handleSeed}
          className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-surface-2">
          Importar Padrão
        </button>
      </div>

      <div className="space-y-2">
        {biomes.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4">
            <div
              className="w-3 h-10 rounded-full shrink-0"
              style={{ background: b.gradient || b.accent_color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text">{b.name}</span>
                {b.biome_type === 'temporary' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold">⏳ Temporário</span>
                )}
                {!b.active && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 border border-danger/30 text-danger">Inativo</span>
                )}
              </div>
              <div className="text-xs text-muted mt-0.5 truncate">
                {REALMS.find(r => r.id === b.required_realm)?.label} · Dif. {b.difficulty}/10 · {b.enemy_pool?.length ?? 0} monstros
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(b)}
                className="px-3 py-1.5 text-xs border border-border rounded hover:bg-surface-2 text-muted">
                Editar
              </button>
              <button onClick={() => handleDelete(b.id)}
                className="px-3 py-1.5 text-xs border border-danger/40 rounded text-danger hover:bg-danger/10">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {biomes.length === 0 && (
          <div className="text-center text-muted text-sm py-12">
            Nenhum bioma no banco. Clique em "Importar Padrão" para começar.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Formulário de bioma ───────────────────────────────────────────

interface FormProps {
  biome: DbBiome; monsters: DbMonster[]
  loading: boolean; msg: string
  onChange: (b: DbBiome) => void
  onSave: () => void; onCancel: () => void
}

function BiomeForm({ biome, monsters, loading, msg, onChange, onSave, onCancel }: FormProps) {
  const set = (patch: Partial<DbBiome>) => onChange({ ...biome, ...patch })

  const toggleDay = (d: number) => {
    const days = biome.active_days ?? []
    set({ active_days: days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort() })
  }

  const setWeight = (rarity: string, val: string) => {
    const v = parseFloat(val)
    set({ rarity_weights: { ...biome.rarity_weights, [rarity]: isNaN(v) ? 0 : v } })
  }

  const addToPool = (id: string) => {
    if (id && !biome.enemy_pool.includes(id))
      set({ enemy_pool: [...biome.enemy_pool, id] })
  }
  const removeFromPool = (id: string) => set({ enemy_pool: biome.enemy_pool.filter(x => x !== id) })

  const isNew = !biome.id || biome.id === ''

  return (
    <div className="space-y-6">
      {msg && <div className="text-xs px-3 py-2 rounded bg-jade/10 border border-jade text-jade">{msg}</div>}

      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted hover:text-text text-sm">← Cancelar</button>
        <h2 className="text-base font-bold text-text flex-1">{isNew ? 'Novo Bioma' : `Editar: ${biome.name}`}</h2>
        <button onClick={onSave} disabled={loading}
          className="px-5 py-2 bg-jade text-white rounded-lg text-sm font-bold disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Coluna 1: Informações básicas */}
        <div className="space-y-4">
          <Section title="Informações Básicas">
            <Field label="ID">
              <input className={input} value={biome.id}
                onChange={e => set({ id: e.target.value })}
                placeholder="ex: forest_of_trials" disabled={!isNew} />
            </Field>
            <Field label="Nome">
              <input className={input} value={biome.name}
                onChange={e => set({ name: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea className={`${input} h-20 resize-none`} value={biome.description}
                onChange={e => set({ description: e.target.value })} />
            </Field>
          </Section>

          <Section title="Requisito de Acesso">
            <Field label="Reino">
              <select className={input} value={biome.required_realm}
                onChange={e => set({ required_realm: e.target.value })}>
                {REALMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Estágio">
              <select className={input} value={biome.required_stage}
                onChange={e => set({ required_stage: e.target.value })}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Dificuldade (1–10)">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={10} value={biome.difficulty}
                  onChange={e => set({ difficulty: parseInt(e.target.value) })}
                  className="flex-1" />
                <span className="text-gold font-bold w-4">{biome.difficulty}</span>
              </div>
            </Field>
          </Section>

          <Section title="Tipo de Bioma">
            <div className="flex gap-3">
              {(['fixed','temporary'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={biome.biome_type === t}
                    onChange={() => set({ biome_type: t })} />
                  <span className="text-sm text-text">{t === 'fixed' ? '🗺️ Fixo' : '⏳ Temporário'}</span>
                </label>
              ))}
            </div>

            {biome.biome_type === 'temporary' && (
              <div className="mt-3 space-y-3 pl-2 border-l border-gold/30">
                <Field label="Dias ativos">
                  <div className="flex gap-1 flex-wrap">
                    {DAY_NAMES.map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)}
                        className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                          biome.active_days?.includes(i)
                            ? 'bg-gold/20 border-gold text-gold'
                            : 'border-border text-muted'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Início">
                    <input type="time" className={input} value={biome.active_start_time ?? ''}
                      onChange={e => set({ active_start_time: e.target.value || null })} />
                  </Field>
                  <Field label="Fim">
                    <input type="time" className={input} value={biome.active_end_time ?? ''}
                      onChange={e => set({ active_end_time: e.target.value || null })} />
                  </Field>
                </div>
                <Field label="Expiração (opcional)">
                  <input type="datetime-local" className={input} value={biome.active_until?.slice(0,16) ?? ''}
                    onChange={e => set({ active_until: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </Field>
              </div>
            )}
          </Section>
        </div>

        {/* Coluna 2: Monstros e tema */}
        <div className="space-y-4">
          <Section title="Pool de Monstros">
            <MonsterPoolEditor
              pool={biome.enemy_pool}
              allMonsters={monsters}
              onAdd={addToPool}
              onRemove={removeFromPool}
            />
          </Section>

          <Section title="Boss">
            <Field label="Boss">
              <select className={input} value={biome.boss_id ?? ''}
                onChange={e => set({ boss_id: e.target.value || null })}>
                <option value="">— Nenhum —</option>
                {monsters.map(m => (
                  <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kills antes do boss">
                <input type="number" className={input} value={biome.min_kills_boss}
                  onChange={e => set({ min_kills_boss: parseInt(e.target.value) || 10 })} />
              </Field>
              <Field label="Chance boss (0–1)">
                <input type="number" step="0.01" min={0} max={1} className={input}
                  value={biome.boss_spawn_chance}
                  onChange={e => set({ boss_spawn_chance: parseFloat(e.target.value) || 0.2 })} />
              </Field>
            </div>
            <Field label="Raridade do boss">
              <select className={input} value={biome.boss_rarity}
                onChange={e => set({ boss_rarity: e.target.value })}>
                {RARITIES.map(r => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Pesos de Raridade">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {RARITIES.map(r => (
                <Field key={r} label={RARITY_LABELS[r]}>
                  <input type="number" min={0} className={input}
                    value={biome.rarity_weights[r] ?? 0}
                    onChange={e => setWeight(r, e.target.value)} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Visual">
            <Field label="Gradient CSS">
              <input className={input} value={biome.gradient}
                onChange={e => set({ gradient: e.target.value })}
                placeholder="linear-gradient(135deg, ...)" />
            </Field>
            <Field label="Cor de destaque">
              <div className="flex items-center gap-2">
                <input type="color" value={biome.accent_color}
                  onChange={e => set({ accent_color: e.target.value })}
                  className="w-10 h-9 rounded cursor-pointer border border-border bg-transparent" />
                <input className={`${input} flex-1`} value={biome.accent_color}
                  onChange={e => set({ accent_color: e.target.value })} />
              </div>
            </Field>
            <Field label="Ordem de exibição">
              <input type="number" className={input} value={biome.sort_order}
                onChange={e => set({ sort_order: parseInt(e.target.value) || 0 })} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={biome.active}
                onChange={e => set({ active: e.target.checked })} />
              <span className="text-sm text-text">Ativo</span>
            </label>
          </Section>
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted">{label}</label>
      {children}
    </div>
  )
}

function MonsterPoolEditor({
  pool, allMonsters, onAdd, onRemove,
}: {
  pool: string[]; allMonsters: DbMonster[]
  onAdd: (id: string) => void; onRemove: (id: string) => void
}) {
  const [sel, setSel] = useState('')
  const available = allMonsters.filter(m => !pool.includes(m.id))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select className={`${input} flex-1`} value={sel} onChange={e => setSel(e.target.value)}>
          <option value="">— Selecionar monstro —</option>
          {available.map(m => (
            <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
          ))}
        </select>
        <button onClick={() => { onAdd(sel); setSel('') }}
          disabled={!sel}
          className="px-3 py-1.5 bg-jade text-white rounded text-sm font-bold disabled:opacity-30">
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {pool.map(id => {
          const m = allMonsters.find(x => x.id === id)
          return (
            <span key={id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-surface-2 border border-border text-text">
              {m?.emoji} {m?.name ?? id}
              <button onClick={() => onRemove(id)} className="text-danger/60 hover:text-danger ml-0.5">×</button>
            </span>
          )
        })}
        {pool.length === 0 && <span className="text-xs text-muted">Nenhum monstro adicionado.</span>}
      </div>
    </div>
  )
}

const input = 'w-full bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-sm text-text outline-none focus:border-jade'
