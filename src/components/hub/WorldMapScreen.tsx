import { useState, useMemo } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { api } from '../../lib/api'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { LocationDefinition } from '../../types'
import { isAtLeast } from '../../utils/cultivation'
import type { Realm, RealmStage } from '../../types'

const VIEWBOX = '0 0 1600 620'
const NODE_R  = 32  // raio do nó

type TravelStatus = 'current' | 'accessible' | 'realm_locked' | 'boss_locked'

interface Props {
  onBack: () => void
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
}

export function WorldMapScreen({ onBack }: Props) {
  const { realm, realmStage, currentLocationId } = usePlayerStore()
  const locations = useGameDataStore(s => s.locations)
  const bestiary  = useBestiaryStore(s => s.entries)

  const [selected,    setSelected]    = useState<string | null>(null)
  const [traveling,   setTraveling]   = useState(false)
  const [travelMsg,   setTravelMsg]   = useState('')

  const locMap = useMemo(
    () => Object.fromEntries(locations.map(l => [l.id, l])),
    [locations]
  )

  function getTravelStatus(loc: LocationDefinition): TravelStatus {
    if (loc.id === currentLocationId) return 'current'

    const currLoc = locMap[currentLocationId]
    if (!currLoc?.connectedTo.includes(loc.id)) return 'realm_locked' // não conectado

    const realmOk = isAtLeast(realm, realmStage, loc.requiredRealm as Realm, loc.requiredStage as RealmStage)
    if (!realmOk) return 'realm_locked'

    if (loc.requiredBossId) {
      const kills = bestiary[loc.requiredBossId]?.kills ?? 0
      if (kills < 1) return 'boss_locked'
    }

    return 'accessible'
  }

  async function handleTravel(locationId: string) {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setTraveling(true)
    setTravelMsg('')
    try {
      const res = await api.post<{ current_location_id: string }>(
        `/api/characters/${char.id}/travel`,
        { locationId }
      )
      usePlayerStore.setState({ currentLocationId: res.current_location_id })
      setSelected(null)
      setTravelMsg(`Chegou em ${locMap[locationId]?.name ?? locationId}!`)
    } catch (err) {
      setTravelMsg(err instanceof Error ? err.message : 'Erro ao viajar.')
    } finally {
      setTraveling(false)
    }
  }

  const selectedLoc  = selected ? locMap[selected] : null
  const selectedStatus = selectedLoc ? getTravelStatus(selectedLoc) : null

  const COLORS: Record<TravelStatus, string> = {
    current:      '#14b8a6',
    accessible:   '#a78bfa',
    realm_locked: '#334155',
    boss_locked:  '#7c3aed55',
  }

  const TYPE_ICON: Record<string, string> = { village: '🏘️', city: '🏙️' }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <h1 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">Mapa do Mundo</h1>
        {travelMsg && (
          <span className={`text-sm ml-4 ${travelMsg.startsWith('Chegou') ? 'text-teal-400' : 'text-red-400'}`}>
            {travelMsg}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* SVG Map */}
        <div className="flex-1 overflow-auto p-4">
          <svg viewBox={VIEWBOX} className="w-full max-w-4xl mx-auto" style={{ minHeight: 280 }}>
            {/* Fundo */}
            <defs>
              <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>
            <rect width="1600" height="620" fill="url(#bgGrad)" />

            {/* Grade sutil */}
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={620}
                stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 8" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 100} x2={1600} y2={i * 100}
                stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 8" />
            ))}

            {/* Paths entre localizações */}
            {locations.map(loc =>
              loc.connectedTo.map(targetId => {
                const target = locMap[targetId]
                if (!target) return null
                if (loc.id > targetId) return null // evita duplicata
                const statusA = getTravelStatus(loc)
                const statusB = getTravelStatus(target)
                const isActive = statusA !== 'realm_locked' || statusB !== 'realm_locked'
                return (
                  <path key={`${loc.id}-${targetId}`}
                    d={bezierPath(loc.mapX, loc.mapY, target.mapX, target.mapY)}
                    stroke={isActive ? '#334155' : '#1e293b'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? undefined : '6 6'}
                    fill="none"
                    opacity={0.7}
                  />
                )
              })
            )}

            {/* Nós de localização */}
            {locations.map(loc => {
              const status = getTravelStatus(loc)
              const color  = COLORS[status]
              const isSelected = selected === loc.id
              const isCurrent  = status === 'current'

              return (
                <g key={loc.id}
                  style={{ cursor: status === 'realm_locked' ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (status !== 'realm_locked') {
                      setSelected(selected === loc.id ? null : loc.id)
                      setTravelMsg('')
                    }
                  }}
                >
                  {/* Anel pulsante para localização atual */}
                  {isCurrent && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 10}
                      fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
                  )}

                  {/* Anel de seleção */}
                  {isSelected && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 6}
                      fill="none" stroke={color} strokeWidth="2" />
                  )}

                  {/* Nó principal */}
                  <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R}
                    fill={color + '22'}
                    stroke={color}
                    strokeWidth={isCurrent ? 2.5 : 1.5}
                  />

                  {/* Ícone */}
                  <text x={loc.mapX} y={loc.mapY + 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={22} opacity={status === 'realm_locked' ? 0.35 : 1}>
                    {loc.emoji}
                  </text>

                  {/* Cadeado para bloqueados */}
                  {(status === 'realm_locked' || status === 'boss_locked') && (
                    <text x={loc.mapX + 20} y={loc.mapY - 18}
                      textAnchor="middle" dominantBaseline="middle" fontSize={14}>
                      {status === 'boss_locked' ? '⚔️' : '🔒'}
                    </text>
                  )}

                  {/* Nome */}
                  <text x={loc.mapX} y={loc.mapY + NODE_R + 14}
                    textAnchor="middle"
                    fill={status === 'realm_locked' ? '#475569' : '#e2e8f0'}
                    fontSize={12}
                    fontFamily="serif"
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                  >
                    {loc.name}
                  </text>

                  {/* Req de realm */}
                  {status === 'realm_locked' && (
                    <text x={loc.mapX} y={loc.mapY + NODE_R + 28}
                      textAnchor="middle" fill="#475569" fontSize={10}>
                      {REALM_NAMES[loc.requiredRealm]} {STAGE_NAMES[loc.requiredStage]}
                    </text>
                  )}

                  {/* Badge "Aqui" */}
                  {isCurrent && (
                    <text x={loc.mapX} y={loc.mapY - NODE_R - 8}
                      textAnchor="middle" fill={color} fontSize={10} fontWeight="bold">
                      ← Aqui
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Painel lateral de detalhe */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 p-4 space-y-4 overflow-y-auto">
          {selectedLoc ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-4xl shrink-0">{selectedLoc.emoji}</span>
                <div>
                  <p className="font-cinzel font-bold text-base text-amber-300">{selectedLoc.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 border mr-1 ${selectedLoc.type === 'city' ? 'border-amber-700 text-amber-500' : 'border-teal-800 text-teal-600'}`}>
                    {TYPE_ICON[selectedLoc.type]} {selectedLoc.type === 'city' ? 'Cidade' : 'Vila'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{selectedLoc.description}</p>

              {/* Serviços */}
              <div>
                <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1.5">Serviços</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedLoc.services ?? []).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 border border-slate-700 text-slate-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Requisito */}
              {selectedStatus !== 'current' && (
                <div className="border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs space-y-1">
                  <p className="text-slate-500">Requisito de cultivo:</p>
                  <p className="text-slate-300 font-semibold">
                    {REALM_NAMES[selectedLoc.requiredRealm]} — {STAGE_NAMES[selectedLoc.requiredStage]}
                  </p>
                  {selectedLoc.requiredBossId && (
                    <p className={`text-xs ${selectedStatus === 'boss_locked' ? 'text-red-400' : 'text-teal-400'}`}>
                      ⚔️ Boss obrigatório: {selectedLoc.requiredBossId} {selectedStatus === 'boss_locked' ? '(não derrotado)' : '✓'}
                    </p>
                  )}
                </div>
              )}

              {/* Botão de viagem */}
              {selectedStatus === 'current' && (
                <div className="text-center text-teal-400 text-sm border border-teal-800/40 bg-teal-950/20 py-2">
                  Você está aqui
                </div>
              )}
              {selectedStatus === 'accessible' && (
                <button
                  onClick={() => handleTravel(selectedLoc.id)}
                  disabled={traveling}
                  className="w-full py-2.5 font-cinzel font-bold text-sm border border-purple-600 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-colors disabled:opacity-50"
                >
                  {traveling ? 'Viajando...' : `🧳 Viajar para ${selectedLoc.name}`}
                </button>
              )}
              {selectedStatus === 'realm_locked' && (
                <div className="text-center text-slate-600 text-xs border border-slate-800 py-2">
                  🔒 Cultivo insuficiente
                </div>
              )}
              {selectedStatus === 'boss_locked' && (
                <div className="text-center text-red-400/60 text-xs border border-red-900/40 bg-red-950/10 py-2">
                  ⚔️ Derrote o boss obrigatório primeiro
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-600 text-sm space-y-2">
              <div className="text-4xl opacity-30">🗺️</div>
              <p>Clique em uma localização para ver detalhes</p>
              <p className="text-xs">Verde = sua localização atual</p>
              <p className="text-xs">Roxo = pode viajar</p>
              <p className="text-xs">Cinza = bloqueado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
