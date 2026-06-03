import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { BulkImportButton } from './BulkImportButton'

interface DbLocation {
  id: string; name: string; description: string; emoji: string
  type: string; required_realm: string; required_stage: string
  required_boss_id: string | null
  map_x: number; map_y: number
  connected_to: string[]; services: string[]
  sort_order: number; active: boolean
}

const ALL_SERVICES = [
  'meditation','talents','inventory','codex','ranking','map',
  'forge','ascension','crafting','market','training','skills','laws','changelog',
]
const SERVICE_LABELS: Record<string, string> = {
  meditation:'Meditação', talents:'Talentos', inventory:'Inventário',
  codex:'Codex', ranking:'Ranking', map:'Mapa',
  forge:'Forja', ascension:'Ascensão', crafting:'Crafting',
  market:'Mercado', training:'Treino', skills:'Skills',
  laws:'Leis', changelog:'Changelog',
}

const VILLAGE_SERVICES = ['meditation','talents','inventory','codex','ranking','map','skills','changelog']
const CITY_SERVICES    = ALL_SERVICES

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

const EMPTY: Omit<DbLocation,'id'> & { id: string } = {
  id:'', name:'', description:'', emoji:'🗺️', type:'village',
  required_realm:'body_tempering', required_stage:'strength',
  required_boss_id: null, map_x:0, map_y:0,
  connected_to:[], services: VILLAGE_SERVICES,
  sort_order:0, active:true,
}

export function LocationsPanel() {
  const [locations, setLocations] = useState<DbLocation[]>([])
  const [draft, setDraft]         = useState<typeof EMPTY>({ ...EMPTY })
  const [editing, setEditing]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  const load = () => api.get<DbLocation[]>('/api/admin/locations').then(setLocations).catch(() => {})
  useEffect(() => { load() }, [])

  function startEdit(loc: DbLocation) {
    setEditing(loc.id)
    setDraft({
      ...loc,
      connected_to: Array.isArray(loc.connected_to) ? loc.connected_to : [],
      services:     Array.isArray(loc.services)     ? loc.services     : [],
    })
    setMsg('')
  }
  function startNew() { setEditing('__new__'); setDraft({ ...EMPTY }); setMsg('') }
  function cancel()   { setEditing(null); setMsg('') }

  async function handleSave() {
    setSaving(true); setMsg('')
    try {
      if (editing === '__new__') {
        await api.post('/api/admin/locations', draft)
      } else {
        await api.put(`/api/admin/locations/${editing}`, draft)
      }
      setMsg('Salvo!')
      setEditing(null)
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Deletar localização "${id}"?`)) return
    await api.delete(`/api/admin/locations/${id}`)
    await load()
  }

  async function handleSeed(data: unknown) {
    await api.post('/api/admin/locations/seed', data)
    await load()
    setMsg('Seed aplicado!')
  }

  function toggleService(svc: string) {
    setDraft(d => ({
      ...d,
      services: d.services.includes(svc)
        ? d.services.filter(s => s !== svc)
        : [...d.services, svc],
    }))
  }

  function setConnections(raw: string) {
    setDraft(d => ({ ...d, connected_to: raw.split(',').map(s => s.trim()).filter(Boolean) }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400">Localizações do Mapa</h2>
        <div className="flex gap-2">
          <BulkImportButton label="Seed JSON" onImport={handleSeed} />
          <button onClick={startNew}
            className="px-4 py-2 text-xs border border-teal-600 text-teal-400 hover:bg-teal-950/30 transition-colors">
            + Nova Localização
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-teal-400 border border-teal-800 bg-teal-950/20 px-3 py-2">{msg}</p>}

      {/* Formulário de edição */}
      {editing && (
        <div className="border border-slate-700 bg-slate-900 p-4 space-y-4">
          <h3 className="font-cinzel text-sm text-amber-300">{editing === '__new__' ? 'Nova Localização' : `Editando: ${editing}`}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500">ID</label>
              <input className={inp} value={draft.id} disabled={editing !== '__new__'}
                onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500">Nome</label>
              <input className={inp} value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-xs text-slate-500">Emoji</label>
              <input className={inp} value={draft.emoji}
                onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500">Tipo</label>
              <select className={inp} value={draft.type}
                onChange={e => {
                  const t = e.target.value
                  setDraft(d => ({ ...d, type: t, services: t === 'village' ? VILLAGE_SERVICES : CITY_SERVICES }))
                }}>
                <option value="village">village</option>
                <option value="city">city</option>
              </select></div>
            <div><label className="text-xs text-slate-500">Map X</label>
              <input type="number" className={inp} value={draft.map_x}
                onChange={e => setDraft(d => ({ ...d, map_x: parseFloat(e.target.value) || 0 }))} /></div>
            <div><label className="text-xs text-slate-500">Map Y</label>
              <input type="number" className={inp} value={draft.map_y}
                onChange={e => setDraft(d => ({ ...d, map_y: parseFloat(e.target.value) || 0 }))} /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-slate-500">Realm mínimo</label>
              <input className={inp} value={draft.required_realm}
                onChange={e => setDraft(d => ({ ...d, required_realm: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500">Estágio mínimo</label>
              <input className={inp} value={draft.required_stage}
                onChange={e => setDraft(d => ({ ...d, required_stage: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500">Boss ID obrigatório</label>
              <input className={inp} placeholder="(opcional)" value={draft.required_boss_id ?? ''}
                onChange={e => setDraft(d => ({ ...d, required_boss_id: e.target.value || null }))} /></div>
          </div>

          <div>
            <label className="text-xs text-slate-500">Descrição</label>
            <textarea className={`${inp} h-16 resize-none`} value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-500">Conexões (IDs separados por vírgula)</label>
            <input className={inp} value={draft.connected_to.join(', ')} onChange={e => setConnections(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-2">Serviços disponíveis</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map(svc => (
                <button key={svc} onClick={() => toggleService(svc)}
                  className={`text-xs px-2 py-1 border transition-colors ${draft.services.includes(svc) ? 'border-teal-600 bg-teal-950/40 text-teal-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                  {SERVICE_LABELS[svc] ?? svc}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={cancel}
              className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {locations.map(loc => (
          <div key={loc.id} className="border border-slate-700 bg-slate-900 p-3 flex items-start gap-3">
            <span className="text-2xl shrink-0">{loc.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-cinzel font-bold text-sm text-amber-300">{loc.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 border ${loc.type === 'city' ? 'border-amber-700 text-amber-500' : 'border-teal-800 text-teal-600'}`}>
                  {loc.type}
                </span>
                <span className="text-xs text-slate-600">{loc.id}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{loc.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] text-slate-600">Realm: {loc.required_realm}/{loc.required_stage}</span>
                {loc.required_boss_id && <span className="text-[10px] text-red-600">Boss: {loc.required_boss_id}</span>}
                <span className="text-[10px] text-slate-700">→ {(loc.connected_to ?? []).join(', ')}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(loc.services ?? []).map(s => (
                  <span key={s} className="text-[10px] px-1 border border-slate-800 text-slate-600">{SERVICE_LABELS[s] ?? s}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(loc)}
                className="px-2 py-1 text-xs border border-slate-700 text-slate-400 hover:border-teal-600 hover:text-teal-400 transition-colors">
                Editar
              </button>
              <button onClick={() => handleDelete(loc.id)}
                className="px-2 py-1 text-xs border border-slate-700 text-slate-400 hover:border-red-700 hover:text-red-400 transition-colors">
                ✕
              </button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-8">Nenhuma localização. Use o Seed JSON para importar.</p>
        )}
      </div>
    </div>
  )
}
