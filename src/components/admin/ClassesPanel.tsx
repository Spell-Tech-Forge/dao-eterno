import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import { BulkImportButton } from './BulkImportButton'

interface SpriteConfig { frameW: number; frameH: number; cols: number; frameCount: number; frameDuration: number }

interface DbClass {
  id: string; name: string; emoji: string; description: string
  allowed_weapon_type: string; allowed_armor_type: string; allowed_accessory_type: string
  color: string; sort_order: number; active: boolean
  sprite_url: string | null
  sprite_config: SpriteConfig | null
}

const EMPTY: Omit<DbClass, 'id'> & { id: string } = {
  id: '', name: '', emoji: '⚔️', description: '',
  allowed_weapon_type: '', allowed_armor_type: '', allowed_accessory_type: '',
  color: '#4a9e7f', sort_order: 0, active: true, sprite_url: null, sprite_config: null,
}

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

export function ClassesPanel() {
  const [classes, setClasses]   = useState<DbClass[]>([])
  const [draft, setDraft]       = useState<typeof EMPTY>({ ...EMPTY })
  const [editing, setEditing]   = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSpriteUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const token = localStorage.getItem('dao_token')
      const classId = editing && editing !== '__new__' ? editing : draft.id || 'new_class'
      const res = await fetch(`/api/upload?type=class&id=${classId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload.')
      setDraft(d => ({ ...d, sprite_url: data.url! }))
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro no upload.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  useEffect(() => { load() }, [])

  async function load() {
    try { setClasses(await api.get<DbClass[]>('/api/admin/classes')) }
    catch { setMsg('Erro ao carregar classes.') }
  }

  function startEdit(c: DbClass) {
    setEditing(c.id)
    setDraft({ ...c })
    setMsg('')
  }

  function startNew() {
    setEditing('__new__')
    setDraft({ ...EMPTY })
    setMsg('')
  }

  async function save() {
    if (!draft.name || !draft.allowed_weapon_type || !draft.allowed_armor_type || !draft.allowed_accessory_type) {
      setMsg('Nome e tipos de equipamento são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      if (editing === '__new__') {
        if (!draft.id) { setMsg('ID obrigatório.'); setSaving(false); return }
        await api.post('/api/admin/classes', draft)
      } else {
        await api.put(`/api/admin/classes/${editing}`, draft)
      }
      setMsg('Salvo com sucesso.')
      setEditing(null)
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  async function deleteClass(id: string) {
    if (!confirm(`Deletar classe "${id}"?`)) return
    try {
      await api.delete(`/api/admin/classes/${id}`)
      await load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro ao deletar.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-cinzel tracking-wider text-amber-400">Classes ({classes.length})</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <BulkImportButton endpoint="/api/admin/classes/seed" label="Importar classes.json" onSuccess={load} />
          <button onClick={startNew}
            className="px-3 py-1.5 text-xs border border-amber-700 text-amber-400 hover:bg-amber-950/30 transition-colors">
            + Nova Classe
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-teal-400 border border-teal-900/50 px-3 py-2 bg-teal-950/20">{msg}</p>}

      {/* Form de edição */}
      {editing && (
        <div className="border border-slate-700 bg-slate-900/60 p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest">{editing === '__new__' ? 'Nova Classe' : `Editar: ${editing}`}</p>
          {editing === '__new__' && (
            <input className={inp} placeholder="ID (ex: espadachim)" value={draft.id}
              onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} />
          )}
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Nome" value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            <input className={inp} placeholder="Emoji" value={draft.emoji}
              onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} />
          </div>
          <textarea className={inp} placeholder="Descrição" rows={2} value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <input className={inp} placeholder="Tipo de arma (ex: espada)" value={draft.allowed_weapon_type}
              onChange={e => setDraft(d => ({ ...d, allowed_weapon_type: e.target.value }))} />
            <input className={inp} placeholder="Tipo de armadura (ex: couro)" value={draft.allowed_armor_type}
              onChange={e => setDraft(d => ({ ...d, allowed_armor_type: e.target.value }))} />
            <input className={inp} placeholder="Tipo de acessório (ex: standard)" value={draft.allowed_accessory_type}
              onChange={e => setDraft(d => ({ ...d, allowed_accessory_type: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cor</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={draft.color}
                  onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                  className="h-9 w-12 bg-slate-800 border border-slate-700 cursor-pointer" />
                <input className={inp} value={draft.color}
                  onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Ordem</label>
              <input type="number" className={inp} value={draft.sort_order}
                onChange={e => setDraft(d => ({ ...d, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          {/* Sprite / ícone da classe */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">Ícone da classe (imagem)</label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-14 h-14 border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                {draft.sprite_url
                  ? <img src={draft.sprite_url} alt="sprite" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                  : <span className="text-2xl">{draft.emoji}</span>
                }
              </div>
              <div className="flex-1 space-y-1">
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full px-3 py-1.5 text-xs border border-slate-600 text-slate-300 hover:border-teal-600 hover:text-teal-300 transition-colors text-left disabled:opacity-50">
                  {uploading ? '⏳ Enviando...' : '📁 Selecionar imagem (PNG/WebP)'}
                </button>
                <input className={`${inp} text-xs`} placeholder="Ou cole uma URL" value={draft.sprite_url ?? ''}
                  onChange={e => setDraft(d => ({ ...d, sprite_url: e.target.value || null }))} />
                {draft.sprite_url && (
                  <button onClick={() => setDraft(d => ({ ...d, sprite_url: null }))}
                    className="text-[10px] text-red-400 hover:text-red-300">Remover imagem</button>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSpriteUpload} />
          </div>

          {/* Sprite sheet config */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 block">Sprite Sheet Config (JSON) — opcional</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-teal-600 font-mono resize-y"
              rows={3}
              placeholder={'{"frameW":504,"frameH":442,"cols":6,"frameCount":36,"frameDuration":52}'}
              value={draft.sprite_config ? JSON.stringify(draft.sprite_config, null, 2) : ''}
              onChange={e => {
                const raw = e.target.value.trim()
                if (!raw) { setDraft(d => ({ ...d, sprite_config: null })); return }
                try { setDraft(d => ({ ...d, sprite_config: JSON.parse(raw) as SpriteConfig })) } catch { /* invalid JSON */ }
              }}
            />
            <p className="text-[10px] text-slate-600">frameW, frameH, cols, frameCount, frameDuration (ms)</p>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={draft.active}
              onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
            Ativo
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/30 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-4 py-1.5 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de classes */}
      <div className="space-y-2">
        {classes.map(c => (
          <div key={c.id} className="border border-slate-700 bg-slate-900/40 p-3 flex items-center gap-3">
            <span className="text-2xl">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: c.color }}>{c.name}</span>
                <span className="text-xs text-slate-600">#{c.id}</span>
                {!c.active && <span className="text-xs text-red-500">inativo</span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                <span>⚔️ {c.allowed_weapon_type}</span>
                <span>🛡️ {c.allowed_armor_type}</span>
                <span>💍 {c.allowed_accessory_type}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(c)}
                className="px-2.5 py-1 text-xs border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
                Editar
              </button>
              <button onClick={() => deleteClass(c.id)}
                className="px-2.5 py-1 text-xs border border-red-900 text-red-500 hover:bg-red-950/20 transition-colors">
                Del
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-6">Nenhuma classe cadastrada. Use "Importar JSON" para carregar as classes padrão.</p>
        )}
      </div>
    </div>
  )
}
