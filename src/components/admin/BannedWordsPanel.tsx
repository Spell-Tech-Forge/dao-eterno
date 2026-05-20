import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'

export function BannedWordsPanel() {
  const [words, setWords]     = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null)
  const [input, setInput]     = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<string[]>('/api/admin/banned-words')
      .then(setWords)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save(next: string[]) {
    setSaving(true); setMsg(null)
    try {
      await api.post('/api/admin/banned-words', { words: next })
      setMsg({ text: `Lista salva — ${next.length} palavra(s).`, ok: true })
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro ao salvar.', ok: false })
    } finally {
      setSaving(false)
    }
  }

  function addWord() {
    const w = input.trim().toLowerCase()
    if (!w) return
    if (words.includes(w)) { setInput(''); return }
    const next = [...words, w].sort()
    setWords(next)
    setInput('')
    inputRef.current?.focus()
  }

  function removeWord(w: string) {
    setWords(prev => prev.filter(x => x !== w))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addWord()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">Filtro de Palavras</h2>
          <p className="text-xs text-slate-500 mt-1">
            Palavras proibidas em nomes de personagens. Verificação por substring, sem distinção de maiúsculas.
          </p>
        </div>
        <button
          onClick={() => save(words)}
          disabled={saving || loading}
          className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Adicionar palavra */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite uma palavra e pressione Enter ou Adicionar..."
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
          disabled={loading}
        />
        <button
          onClick={addWord}
          disabled={!input.trim() || loading}
          className="px-4 py-2 text-sm font-bold border border-teal-700 text-teal-400 bg-teal-950/20 hover:bg-teal-900/30 transition-colors disabled:opacity-40"
        >
          + Adicionar
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Carregando...</div>
      ) : words.length === 0 ? (
        <div className="border border-slate-700 bg-slate-900 py-10 text-center text-slate-600 text-sm">
          Nenhuma palavra na lista. Adicione acima e clique em Salvar.
        </div>
      ) : (
        <div className="border border-slate-700 bg-slate-900 p-4">
          <div className="text-xs text-slate-500 mb-3 font-cinzel tracking-wider uppercase">
            {words.length} palavra{words.length !== 1 ? 's' : ''} na lista
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map(w => (
              <div
                key={w}
                className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-700 bg-slate-800 text-sm text-slate-300"
              >
                <span className="font-mono">{w}</span>
                <button
                  onClick={() => removeWord(w)}
                  className="text-slate-600 hover:text-red-400 transition-colors leading-none text-base font-bold ml-1"
                  title="Remover"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Exemplo: adicionar "admin" bloqueia nomes como "Admin123", "superadmin", "adminzão".
        Clique em Salvar após fazer alterações.
      </p>
    </div>
  )
}
