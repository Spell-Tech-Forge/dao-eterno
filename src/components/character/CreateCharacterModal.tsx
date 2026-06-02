import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import type { ServerCharacter } from '../../types/server'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useSettingsStore } from '../../store/settingsStore'
import spriteMasculinoDefault from '../../assets/personagem_masculino_sprite.png'
import spriteFemininoDefault  from '../../assets/personagem_feminino_sprite.png'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

type Step = 'gender' | 'class' | 'name'

const GENDERS = [
  { value: 'masculino', label: 'Masculino', color: '#60a5fa', border: 'border-blue-500', glow: 'shadow-blue-500/30' },
  { value: 'feminino',  label: 'Feminino',  color: '#f472b6', border: 'border-pink-400', glow: 'shadow-pink-400/30' },
] as const

export function CreateCharacterModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep]     = useState<Step>('gender')
  const [name, setName]     = useState('')
  const [gender, setGender] = useState<'masculino' | 'feminino'>('masculino')
  const [classId, setClassId] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const classes = useGameDataStore(s => s.classes)
  const spriteMaleUrl   = useSettingsStore(s => s.characterSpriteMale)
  const spriteFemaleUrl = useSettingsStore(s => s.characterSpriteFemale)
  const loadSettings    = useSettingsStore(s => s.load)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      setStep('gender')
      setName('')
      setClassId('')
      setError('')
    }
  }, [isOpen, loadSettings])

  const handleCreate = async () => {
    if (name.trim().length < 2) { setError('Nome deve ter ao menos 2 caracteres.'); return }
    if (name.trim().length > 24) { setError('Nome deve ter no máximo 24 caracteres.'); return }
    if (!classId) { setError('Selecione uma classe.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post<ServerCharacter>('/api/characters', { name: name.trim(), affinity: 'Fogo', gender, classId })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar personagem.')
    } finally {
      setLoading(false)
    }
  }

  const selectedClass = classes.find(c => c.id === classId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Despertar do Cultivador" size="lg">
      <div className="flex flex-col gap-6">

        {/* Step 1: Gênero */}
        {step === 'gender' && (
          <>
            <p className="text-xs text-slate-500 tracking-widest uppercase">Aparência</p>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map(g => {
                const isSelected = gender === g.value
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={[
                      'relative flex flex-col items-center gap-2 pt-3 pb-3 border-2 transition-all duration-200',
                      isSelected
                        ? `${g.border} shadow-lg ${g.glow} bg-slate-800/80 scale-[1.02]`
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-500',
                    ].join(' ')}
                  >
                    <img
                      src={g.value === 'masculino' ? (spriteMaleUrl ?? spriteMasculinoDefault) : (spriteFemaleUrl ?? spriteFemininoDefault)}
                      alt={g.label}
                      className="w-24 h-24 object-contain object-bottom drop-shadow-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-xs font-medium tracking-wider" style={{ color: isSelected ? g.color : '#64748b' }}>
                      {g.label}
                    </span>
                    {isSelected && <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />}
                  </button>
                )
              })}
            </div>
            <Button onClick={() => setStep('class')} className="w-full justify-center">
              Próximo →
            </Button>
          </>
        )}

        {/* Step 2: Classe */}
        {step === 'class' && (
          <>
            <p className="text-xs text-slate-500 tracking-widest uppercase">Escolha sua Classe</p>
            {classes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nenhuma classe disponível.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {classes.map(c => {
                  const isSelected = classId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassId(c.id)}
                      className={[
                        'flex flex-col items-start gap-1 p-3 border-2 text-left transition-all duration-150',
                        isSelected
                          ? 'bg-slate-800/80 scale-[1.02]'
                          : 'border-slate-700 bg-slate-800/40 hover:border-slate-500',
                      ].join(' ')}
                      style={{ borderColor: isSelected ? c.color : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.emoji}</span>
                        <span className="text-sm font-medium text-slate-200">{c.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-tight line-clamp-2">{c.description}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{c.allowedWeaponType}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{c.allowedArmorType}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {selectedClass && (
              <div className="p-3 border border-slate-700 bg-slate-800/40 text-sm text-slate-300">
                <span className="font-medium" style={{ color: selectedClass.color }}>{selectedClass.emoji} {selectedClass.name}</span>
                <span className="text-slate-400 ml-2">selecionada</span>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('gender')} className="flex-1 justify-center">← Voltar</Button>
              <Button onClick={() => { if (!classId) { setError('Selecione uma classe.'); return } setError(''); setStep('name') }} className="flex-1 justify-center" disabled={!classId}>
                Próximo →
              </Button>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </>
        )}

        {/* Step 3: Nome */}
        {step === 'name' && (
          <>
            <div className="flex items-center gap-2 p-3 border border-slate-700 bg-slate-800/30">
              {selectedClass && (
                <span className="text-2xl">{selectedClass.emoji}</span>
              )}
              <div>
                <p className="text-xs text-slate-500">Classe escolhida</p>
                <p className="text-sm font-medium" style={{ color: selectedClass?.color ?? '#94a3b8' }}>
                  {selectedClass?.name ?? '—'}
                </p>
              </div>
            </div>

            <Input
              label="Nome do Cultivador"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do seu personagem"
              maxLength={24}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />

            {error && (
              <p className="text-sm text-red-400 text-center py-2 border border-red-900/60 bg-red-950/30">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('class')} className="flex-1 justify-center">← Voltar</Button>
              <Button onClick={handleCreate} loading={loading} className="flex-1 justify-center">
                Despertar
              </Button>
            </div>
          </>
        )}

      </div>
    </Modal>
  )
}
