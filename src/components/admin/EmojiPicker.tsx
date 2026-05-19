import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  { label: 'Armas & Combate',    emojis: ['⚔️','🗡️','🏹','🔱','🛡️','💥','🪃','🗺️','⚡','🔥','💣','🪖'] },
  { label: 'Magia & Espiritual', emojis: ['✨','💫','🌟','🔮','🪄','💎','🌀','⭐','🔯','🌙','☀️','🪬','📿','🧿'] },
  { label: 'Natureza',           emojis: ['🌿','🍀','🌸','🌺','🌻','🍄','🌾','🌱','🌲','🪨','💧','❄️','🔥','🌊','🍃'] },
  { label: 'Criaturas',          emojis: ['🐉','🦁','🐯','🦊','🐺','🦂','🦎','🐍','🦅','🦋','🐝','🦈','👾','💀','🦴','🐻','🐗','🦌'] },
  { label: 'Materiais',          emojis: ['💠','🪙','💰','🪵','🪨','⚙️','🔩','🧱','🫧','💡','🔋','🧲','🪤','🧩'] },
  { label: 'Alquimia & Pílulas', emojis: ['💊','🧪','⚗️','🫙','🍵','🍶','🏺','🌡️','🧴','🫗','🍷','🧃'] },
  { label: 'Talismãs & Símbolos',emojis: ['☯️','⚕️','🔰','♾️','👁️','⚜️','🎋','📜','🔑','🗝️','🪦','🎴','🀄','🎲'] },
  { label: 'Acessórios',         emojis: ['💍','👑','📿','🧿','🎀','🪬','🧣','🥋','🧤','🪖','🎭','🏅'] },
  { label: 'Geral',              emojis: ['📦','🎁','🗃️','📖','🎯','🏆','🎪','🌍','🗻','🏔️','⛩️','🏯'] },
]

interface Props {
  value:      string
  onChange:   (v: string) => void
  spriteUrl?: string | null
  label?:     string
}

export function EmojiPicker({ value, onChange, spriteUrl, label = 'Emoji' }: Props) {
  const [open,   setOpen]   = useState(false)
  const [custom, setCustom] = useState('')
  const ref    = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) { setCustom(''); return }
    setTimeout(() => inputRef.current?.focus(), 50)
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function pick(e: string) { onChange(e); setOpen(false); setCustom('') }

  function handleCustomKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && custom.trim()) { pick(custom.trim()); e.preventDefault() }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 bg-slate-800 border px-3 py-2 text-left transition-colors ${
          open ? 'border-amber-500/60' : 'border-slate-700 hover:border-slate-500'
        }`}
      >
        {spriteUrl ? (
          <img src={spriteUrl} alt="sprite" className="w-7 h-7 object-contain shrink-0" />
        ) : (
          <span className="text-2xl leading-none shrink-0">{value || '📦'}</span>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-slate-200">{value || '📦'}</span>
          {spriteUrl && <span className="ml-2 text-[10px] text-teal-400">+ sprite</span>}
        </div>
        <span className="text-slate-600 text-xs shrink-0">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-96 bg-slate-900 border border-slate-700 shadow-2xl">

          {/* Input direto */}
          <div className="p-2 border-b border-slate-800 space-y-1.5">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest">
              Digite ou cole um emoji e pressione Enter
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Cole ou digite o emoji..."
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={handleCustomKey}
                className="flex-1 bg-slate-800 border border-slate-700 px-2 py-1.5 text-lg text-slate-200 outline-none focus:border-amber-500/60"
              />
              {custom && (
                <button type="button" onClick={() => pick(custom.trim())}
                  className="px-3 py-1.5 text-xs border border-teal-700/60 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors whitespace-nowrap">
                  Usar ↵
                </button>
              )}
            </div>
          </div>

          {/* Sprite info */}
          {spriteUrl && (
            <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2 bg-teal-950/10">
              <img src={spriteUrl} alt="sprite" className="w-8 h-8 object-contain shrink-0" />
              <span className="text-xs text-teal-400">Sprite configurada — exibida no jogo no lugar do emoji</span>
            </div>
          )}

          {/* Grade de categorias */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-3">
            {CATEGORIES.map(cat => (
              <div key={cat.label}>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">{cat.label}</div>
                <div className="flex flex-wrap gap-0.5">
                  {cat.emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      title={e}
                      onClick={() => pick(e)}
                      className={`text-xl w-9 h-9 flex items-center justify-center rounded transition-colors ${
                        value === e
                          ? 'bg-amber-950/40 ring-1 ring-amber-500/60'
                          : 'hover:bg-slate-700'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
