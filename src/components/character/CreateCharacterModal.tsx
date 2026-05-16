import { useState } from 'react'
import { api } from '../../lib/api'
import type { ServerCharacter } from '../../types/server'
import { AFFINITIES_FOR_CREATE } from '../../types/server'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateCharacterModal({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [affinity, setAffinity] = useState('Fogo')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (name.trim().length < 2) { setError('Nome deve ter ao menos 2 caracteres.'); return }
    if (name.trim().length > 24) { setError('Nome deve ter no máximo 24 caracteres.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post<ServerCharacter>('/api/characters', { name: name.trim(), affinity })
      setName('')
      setAffinity('Fogo')
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar personagem.')
    } finally {
      setLoading(false)
    }
  }

  const selected = AFFINITIES_FOR_CREATE.find(a => a.value === affinity)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Despertar do Cultivador">
      <div className="flex flex-col gap-5">
        <Input
          label="Nome do Cultivador"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do seu personagem"
          maxLength={24}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />

        <div>
          <p className="text-xs text-slate-500 tracking-widest uppercase mb-3">
            Afinidade Espiritual
          </p>
          <div className="grid grid-cols-5 gap-2">
            {AFFINITIES_FOR_CREATE.map(a => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAffinity(a.value)}
                className={[
                  'flex flex-col items-center gap-1 py-2.5 px-1 border text-center transition-all',
                  affinity === a.value
                    ? 'scale-105'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-500',
                ].join(' ')}
                style={affinity === a.value
                  ? { borderColor: a.color + '80', backgroundColor: a.color + '15' }
                  : {}}
              >
                <span className="text-lg">{a.emoji}</span>
                <span
                  className="text-xs"
                  style={{ color: affinity === a.value ? a.color : '#64748b' }}
                >
                  {a.value}
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <p className="text-xs text-slate-600 text-center mt-2">
              Afinidade de {selected.value} selecionada
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center py-2 border border-red-900/60 bg-red-950/30">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 justify-center">
            Cancelar
          </Button>
          <Button onClick={handleCreate} loading={loading} className="flex-1 justify-center">
            Despertar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
