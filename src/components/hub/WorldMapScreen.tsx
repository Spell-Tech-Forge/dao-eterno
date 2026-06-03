import { useState, useMemo } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { api } from '../../lib/api'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { LocationDefinition, BiomeDefinition } from '../../types'
import { isAtLeast } from '../../utils/cultivation'
import type { Realm, RealmStage } from '../../types'

// ViewBox compacto — conteúdo usa ~200-900 x, ~80-500 y
const VIEWBOX  = '120 60 820 460'
const NODE_R   = 36   // raio dos nós de localização
const BIOME_R  = 14   // raio dos nós de bioma
const ORBIT_R  = 90   // distância dos biomas ao nó pai

type TravelStatus = 'current' | 'accessible' | 'realm_locked' | 'boss_locked'

interface Props { onBack: () => void }

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cp = { x: (x1 + x2) / 2, y: Math.min(y1, y2) - Math.abs(x2 - x1) * 0.12 }
  return `M ${x1} ${y1} Q ${cp.x} ${cp.y} ${x2} ${y2}`
}

// Posiciona biomas em arco ao redor do nó pai
function biomePositions(cx: number, cy: number, count: number, startAngle = -90): { x: number; y: number }[] {
  if (count === 0) return []
  const step = count === 1 ? 0 : 120 / (count - 1)
  return Array.from({ length: count }, (_, i) => {
    const angle = ((startAngle - 60 + step * i) * Math.PI) / 180
    return { x: cx + ORBIT_R * Math.cos(angle), y: cy + ORBIT_R * Math.sin(angle) }
  })
}

export function WorldMapScreen({ onBack }: Props) {
  const { realm, realmStage, currentLocationId } = usePlayerStore()
  const locations = useGameDataStore(s => s.locations)
  const biomes    = useGameDataStore(s => s.biomes)
  const biomeOrder = useGameDataStore(s => s.biomeOrder)
  const bestiary  = useBestiaryStore(s => s.entries)

  const [selected,   setSelected]   = useState<string | null>(null)
  const [traveling,  setTraveling]  = useState(false)
  const [travelMsg,  setTravelMsg]  = useState('')

  const locMap = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l])), [locations])

  // Biomas por localização
  const biomesByLoc = useMemo(() => {
    const map: Record<string, BiomeDefinition[]> = {}
    biomeOrder.forEach(id => {
      const b = biomes[id]
      if (!b?.locationId) return
      if (!map[b.locationId]) map[b.locationId] = []
      map[b.locationId].push(b)
    })
    return map
  }, [biomes, biomeOrder])

  // Imagem de fundo global (da primeira localização que tiver, ou de uma config futura)
  const bgLoc = locations.find(l => l.backgroundUrl)

  function getTravelStatus(loc: LocationDefinition): TravelStatus {
    if (loc.id === currentLocationId) return 'current'
    const currLoc = locMap[currentLocationId]
    if (!currLoc?.connectedTo.includes(loc.id)) return 'realm_locked'
    const ok = isAtLeast(realm, realmStage, loc.requiredRealm as Realm, loc.requiredStage as RealmStage)
    if (!ok) return 'realm_locked'
    if (loc.requiredBossId && !(bestiary[loc.requiredBossId]?.kills >= 1)) return 'boss_locked'
    return 'accessible'
  }

  async function handleTravel(locationId: string) {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setTraveling(true); setTravelMsg('')
    try {
      const res = await api.post<{ current_location_id: string }>(
        `/api/characters/${char.id}/travel`, { locationId }
      )
      usePlayerStore.setState({ currentLocationId: res.current_location_id })
      setSelected(null)
      setTravelMsg(`Chegou em ${locMap[locationId]?.name}!`)
    } catch (err) {
      setTravelMsg(err instanceof Error ? err.message : 'Erro ao viajar.')
    } finally { setTraveling(false) }
  }

  const selectedLoc    = selected ? locMap[selected] : null
  const selectedStatus = selectedLoc ? getTravelStatus(selectedLoc) : null

  const STATUS_COLOR: Record<TravelStatus, string> = {
    current:      '#14b8a6',
    accessible:   '#a78bfa',
    realm_locked: '#334155',
    boss_locked:  '#7c2d12',
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
          ← Voltar
        </button>
        <h1 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">Mapa do Mundo</h1>
        {travelMsg && (
          <span className={`text-sm ml-4 ${travelMsg.startsWith('Chegou') ? 'text-teal-400' : 'text-red-400'}`}>
            {travelMsg}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>
        {/* SVG Map — ocupa toda a área disponível */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 400 }}>
          {/* Background image se configurada */}
          {bgLoc?.backgroundUrl && (
            <div className="absolute inset-0" style={{
              backgroundImage: `url(${bgLoc.backgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: bgLoc.backgroundPosition ?? 'center',
              opacity: 0.15,
            }} />
          )}

          <svg
            viewBox={VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {!bgLoc?.backgroundUrl && <rect x="120" y="60" width="820" height="460" fill="url(#bgGrad)" />}

            {/* Grade sutil */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={150 + i * 90} y1="60" x2={150 + i * 90} y2="520"
                stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 9" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`h${i}`} x1="120" y1={100 + i * 90} x2="940" y2={100 + i * 90}
                stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 9" />
            ))}

            {/* Paths entre localizações */}
            {locations.map(loc =>
              loc.connectedTo.map(tgtId => {
                const tgt = locMap[tgtId]
                if (!tgt || loc.id > tgtId) return null
                const stA = getTravelStatus(loc)
                const stB = getTravelStatus(tgt)
                const active = stA !== 'realm_locked' || stB !== 'realm_locked'
                return (
                  <path key={`${loc.id}-${tgtId}`}
                    d={bezierPath(loc.mapX, loc.mapY, tgt.mapX, tgt.mapY)}
                    stroke={active ? '#475569' : '#1e293b'}
                    strokeWidth={active ? 2 : 1}
                    strokeDasharray={active ? undefined : '5 5'}
                    fill="none" opacity={0.8}
                  />
                )
              })
            )}

            {/* Nós de bioma (sub-nós orbitando as cidades) */}
            {locations.map(loc => {
              const locBiomes = biomesByLoc[loc.id] ?? []
              const positions = biomePositions(loc.mapX, loc.mapY, locBiomes.length)
              const locStatus = getTravelStatus(loc)
              const isCurrentLoc = locStatus === 'current'
              return locBiomes.map((b, i) => {
                const pos = positions[i]
                if (!pos) return null
                const dimmed = !isCurrentLoc
                return (
                  <g key={b.id} opacity={dimmed ? 0.35 : 0.85}
                    style={{ cursor: isCurrentLoc ? 'default' : 'default' }}>
                    {/* Linha do bioma ao nó pai */}
                    <line x1={loc.mapX} y1={loc.mapY} x2={pos.x} y2={pos.y}
                      stroke={b.theme?.accentColor ?? '#334155'} strokeWidth="1"
                      strokeDasharray="3 4" opacity={0.5} />
                    {/* Círculo do bioma */}
                    <circle cx={pos.x} cy={pos.y} r={BIOME_R}
                      fill={(b.theme?.accentColor ?? '#334155') + '22'}
                      stroke={b.theme?.accentColor ?? '#334155'}
                      strokeWidth="1"
                    />
                    {/* Nome do bioma */}
                    <text x={pos.x} y={pos.y + BIOME_R + 9}
                      textAnchor="middle"
                      fill={b.theme?.accentColor ?? '#475569'}
                      fontSize={8}
                      fontFamily="serif">
                      {b.name.split(' ').slice(0, 2).join(' ')}
                    </text>
                    {/* Dif */}
                    <text x={pos.x} y={pos.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={dimmed ? '#334155' : '#94a3b8'}
                      fontSize={9} fontWeight="bold">
                      {b.difficulty}
                    </text>
                  </g>
                )
              })
            })}

            {/* Nós principais de localização */}
            {locations.map(loc => {
              const status     = getTravelStatus(loc)
              const color      = STATUS_COLOR[status]
              const isCurrent  = status === 'current'
              const isSelected = selected === loc.id
              const clickable  = status !== 'realm_locked'

              return (
                <g key={loc.id}
                  style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
                  onClick={() => {
                    if (clickable) { setSelected(isSelected ? null : loc.id); setTravelMsg('') }
                  }}>
                  {/* Anel externo para localização atual */}
                  {isCurrent && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 12}
                      fill="none" stroke={color} strokeWidth="1" opacity={0.3}
                      filter="url(#glow)" />
                  )}
                  {/* Anel de seleção */}
                  {isSelected && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 6}
                      fill="none" stroke={color} strokeWidth="2" opacity={0.6} />
                  )}
                  {/* Nó principal */}
                  <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R}
                    fill={color + '28'}
                    stroke={color}
                    strokeWidth={isCurrent ? 2.5 : 1.5}
                    opacity={status === 'realm_locked' ? 0.4 : 1}
                    filter={isCurrent ? 'url(#glow)' : undefined}
                  />
                  {/* Ícone */}
                  <text x={loc.mapX} y={loc.mapY + 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={26} opacity={status === 'realm_locked' ? 0.3 : 1}>
                    {loc.emoji}
                  </text>
                  {/* Lock / boss */}
                  {status === 'realm_locked' && (
                    <text x={loc.mapX + 24} y={loc.mapY - 24} fontSize={14}>🔒</text>
                  )}
                  {status === 'boss_locked' && (
                    <text x={loc.mapX + 24} y={loc.mapY - 24} fontSize={14}>⚔️</text>
                  )}
                  {/* Nome */}
                  <text x={loc.mapX} y={loc.mapY + NODE_R + 14}
                    textAnchor="middle"
                    fill={status === 'realm_locked' ? '#475569' : '#e2e8f0'}
                    fontSize={11} fontFamily="serif"
                    fontWeight={isCurrent ? 'bold' : 'normal'}>
                    {loc.name}
                  </text>
                  {/* Badge "Aqui" */}
                  {isCurrent && (
                    <text x={loc.mapX} y={loc.mapY - NODE_R - 10}
                      textAnchor="middle" fill={color} fontSize={9} fontWeight="bold">
                      ← Aqui
                    </text>
                  )}
                  {/* Req bloqueado */}
                  {status === 'realm_locked' && (
                    <text x={loc.mapX} y={loc.mapY + NODE_R + 26}
                      textAnchor="middle" fill="#475569" fontSize={8.5}>
                      {REALM_NAMES[loc.requiredRealm]} {STAGE_NAMES[loc.requiredStage]}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Painel lateral */}
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 p-4 space-y-4 overflow-y-auto shrink-0">
          {selectedLoc ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-4xl shrink-0">{selectedLoc.emoji}</span>
                <div>
                  <p className="font-cinzel font-bold text-base text-amber-300">{selectedLoc.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 border ${selectedLoc.type === 'city' ? 'border-amber-700 text-amber-500' : 'border-teal-800 text-teal-600'}`}>
                    {selectedLoc.type === 'city' ? '🏙️ Cidade' : '🏘️ Vila'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{selectedLoc.description}</p>

              {/* Biomas disponíveis */}
              {(biomesByLoc[selectedLoc.id] ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1.5">Áreas de Combate</p>
                  <div className="space-y-1">
                    {(biomesByLoc[selectedLoc.id] ?? []).map(b => (
                      <div key={b.id} className="flex items-center gap-2 text-xs px-2 py-1 border border-slate-800 bg-slate-800/40">
                        <span className="font-bold" style={{ color: b.theme?.accentColor ?? '#94a3b8' }}>
                          Dif.{b.difficulty}
                        </span>
                        <span className="text-slate-300 flex-1">{b.name}</span>
                        <span className="text-slate-600 text-[10px]">{REALM_NAMES[b.requiredRealm]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serviços */}
              <div>
                <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1.5">Serviços</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedLoc.services ?? []).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 border border-slate-700 text-slate-400">{s}</span>
                  ))}
                </div>
              </div>

              {/* Requisito de viagem */}
              {selectedStatus !== 'current' && (
                <div className="border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs space-y-1">
                  <p className="text-slate-300 font-semibold">
                    {REALM_NAMES[selectedLoc.requiredRealm]} — {STAGE_NAMES[selectedLoc.requiredStage]}
                  </p>
                  {selectedLoc.requiredBossId && (
                    <p className={selectedStatus === 'boss_locked' ? 'text-red-400' : 'text-teal-400'}>
                      ⚔️ Boss: {selectedLoc.requiredBossId} {selectedStatus === 'boss_locked' ? '(pendente)' : '✓'}
                    </p>
                  )}
                </div>
              )}

              {selectedStatus === 'current' && (
                <div className="text-center text-teal-400 text-sm border border-teal-800/40 bg-teal-950/20 py-2">
                  Você está aqui
                </div>
              )}
              {selectedStatus === 'accessible' && (
                <button onClick={() => handleTravel(selectedLoc.id)} disabled={traveling}
                  className="w-full py-2.5 font-cinzel font-bold text-sm border border-purple-600 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-colors disabled:opacity-50">
                  {traveling ? 'Viajando...' : `🧳 Viajar para ${selectedLoc.name}`}
                </button>
              )}
              {selectedStatus === 'realm_locked' && (
                <div className="text-center text-slate-600 text-xs border border-slate-800 py-2">🔒 Cultivo insuficiente</div>
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
              <p>Clique em uma localização</p>
              <div className="text-xs space-y-1 mt-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-teal-500 inline-block" /> Localização atual</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-purple-500 inline-block" /> Pode viajar</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-slate-600 inline-block" /> Bloqueado</div>
                <div className="flex items-center gap-2 mt-2 text-[10px]"><span className="text-slate-500">Nós menores = biomas de combate</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
