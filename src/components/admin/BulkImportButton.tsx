import { useRef, useState } from 'react'
import { api } from '../../lib/api'

interface Props {
  endpoint: string
  label?: string
  onSuccess: () => void
}

export function BulkImportButton({ endpoint, label = 'Importar JSON', onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg]       = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('loading'); setMsg('')
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const arr: unknown[] = Array.isArray(parsed) ? parsed : Object.values(parsed)
      const result = await api.post<{ inserted: number }>(endpoint, arr)
      setMsg(`✓ ${result.inserted} inseridos/atualizados`)
      setStatus('ok')
      onSuccess()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao importar')
      setStatus('error')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef} type="file" accept=".json"
        className="hidden" onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === 'loading'}
        className="px-4 py-1.5 text-sm border border-violet-700/60 text-violet-400 bg-violet-950/20 hover:bg-violet-950/40 transition-colors disabled:opacity-40"
      >
        {status === 'loading' ? 'Importando...' : `↑ ${label}`}
      </button>
      {msg && (
        <span className={`text-xs ${status === 'ok' ? 'text-teal-400' : 'text-red-400'}`}>
          {msg}
        </span>
      )}
    </div>
  )
}
