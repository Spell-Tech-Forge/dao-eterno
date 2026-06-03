import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { BulkImportButton } from './BulkImportButton'

interface DbLaw {
  id: string; name: string; description: string; emoji: string; affinity: string | null
  bonus_fragment: Record<string, number>; bonus_initial: Record<string, number>
  bonus_middle: Record<string, number>; bonus_advanced: Record<string, number>; bonus_complete: Record<string, number>
  min_realm_initial: string; min_realm_middle: string; min_realm_advanced: string; min_realm_complete: string
  fragments_to_initial: number; fragments_to_middle: number; fragments_to_advanced: number; fragments_to_complete: number
  fragment_item_id: string | null; sort_order: number; active: boolean
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

const LEVEL_LABELS = ['fragment','initial','middle','advanced','complete']
const BONUS_STATS = ['atk_pct','def_pct','hp_pct','crit_pct','speed_pct','qi_rate_pct']

export function LawsPanel() {
  const [laws, setLaws]   = useState<DbLaw[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<DbLaw>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try { setLaws(await api.get<DbLaw[]>('/api/admin/laws')) }
    catch { setMsg('Erro ao carregar leis.') }
  }

  function startEdit(l: DbLaw) { setEditing(l.id); setDraft({ ...l }); setMsg('') }

  async function save() {
    setSaving(true)
    try {
      await api.put(`/api/admin/laws/${editing}`, draft)
      setMsg('Salvo.')
      setEditing(null)
      await load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro.') }
    finally { setSaving(false) }
  }

  async function deleteLaw(id: string) {
    if (!confirm(`Deletar lei "${id}"?`)) return
    try { await api.delete(`/api/admin/laws/${id}`); await load() }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Erro.') }
  }

  function setBonus(level: string, stat: string, val: number) {
    const key = `bonus_${level}` as keyof DbLaw
    setDraft(d => ({ ...d, [key]: { ...(d[key] as Record<string, number> ?? {}), [stat]: val } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-cinzel tracking-wider text-amber-400">Leis ({laws.length})</h2>
        <BulkImportButton endpoint="/api/admin/laws/seed" label="Importar leis.json" onSuccess={load} />
      </div>

      {msg && <p className="text-xs text-teal-400 border border-teal-900/50 px-3 py-2 bg-teal-950/20">{msg}</p>}

      {editing && draft && (
        <div className="border border-slate-700 bg-slate-900/60 p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase">Editar: {editing}</p>
          <div className="grid grid-cols-3 gap-2">
            <input className={inp} placeholder="Nome" value={draft.name ?? ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            <input className={inp} placeholder="Emoji" value={draft.emoji ?? ''} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} />
            <input className={inp} placeholder="Afinidade (ou vazio)" value={draft.affinity ?? ''} onChange={e => setDraft(d => ({ ...d, affinity: e.target.value || null }))} />
          </div>
          <textarea className={inp} rows={2} placeholder="Descrição" value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="ID do item fragmento" value={draft.fragment_item_id ?? ''} onChange={e => setDraft(d => ({ ...d, fragment_item_id: e.target.value || null }))} />
            <input type="number" className={inp} placeholder="Ordem" value={draft.sort_order ?? 0} onChange={e => setDraft(d => ({ ...d, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          {/* Bônus por nível */}
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Bônus por Nível</p>
          {LEVEL_LABELS.map(lv => (
            <div key={lv} className="space-y-1">
              <p className="text-xs text-slate-400 capitalize">{lv}</p>
              <div className="grid grid-cols-3 gap-1">
                {BONUS_STATS.map(stat => (
                  <label key={stat} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-16 shrink-0">{stat}</span>
                    <input type="number" min="0" step="0.5" className="w-full bg-slate-800 border border-slate-700 px-1 py-0.5 text-xs text-slate-200 outline-none"
                      value={(draft[`bonus_${lv}` as keyof DbLaw] as Record<string, number>)?.[stat] ?? 0}
                      onChange={e => setBonus(lv, stat, parseFloat(e.target.value) || 0)} />
                  </label>
                ))}
              </div>
            </div>
          ))}
          {/* Requisitos de realm */}
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Requisitos de Reino</p>
          <div className="grid grid-cols-2 gap-2">
            {['initial','middle','advanced','complete'].map(lv => (
              <label key={lv} className="text-xs text-slate-400">
                <span className="block mb-0.5">Min Realm ({lv})</span>
                <input className={inp} value={(draft as Record<string, unknown>)[`min_realm_${lv}`] as string ?? ''} onChange={e => setDraft(d => ({ ...d, [`min_realm_${lv}`]: e.target.value }))} />
              </label>
            ))}
          </div>
          {/* Custo em fragmentos */}
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Fragmentos Necessários</p>
          <div className="grid grid-cols-4 gap-2">
            {['initial','middle','advanced','complete'].map(lv => (
              <label key={lv} className="text-xs text-slate-400">
                <span className="block mb-0.5">→ {lv}</span>
                <input type="number" className={inp} value={(draft as Record<string, unknown>)[`fragments_to_${lv}`] as number ?? 5} onChange={e => setDraft(d => ({ ...d, [`fragments_to_${lv}`]: parseInt(e.target.value) || 1 }))} />
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/30 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {laws.map(l => (
          <div key={l.id} className="border border-slate-800 bg-slate-900/30 p-3 flex items-center gap-3">
            <span className="text-2xl">{l.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">{l.name}</span>
                <span className="text-xs text-slate-600">#{l.id}</span>
                {l.affinity && <span className="text-[10px] px-1 bg-slate-800 text-slate-400">{l.affinity}</span>}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{l.description.slice(0, 80)}…</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => startEdit(l)} className="px-2 py-0.5 text-[10px] border border-slate-600 text-slate-400 hover:bg-slate-800">Edit</button>
              <button onClick={() => deleteLaw(l.id)} className="px-2 py-0.5 text-[10px] border border-red-900 text-red-500 hover:bg-red-950/20">Del</button>
            </div>
          </div>
        ))}
        {laws.length === 0 && <p className="text-xs text-slate-600 text-center py-6">Nenhuma lei. Use "Importar leis.json".</p>}
      </div>
    </div>
  )
}
