import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { api } from '../../lib/api'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { LocationDefinition, BiomeDefinition } from '../../types'
import { isAtLeast } from '../../utils/cultivation'
import type { Realm, RealmStage } from '../../types'

const SVG_W    = 1500
const SVG_H    = 700
const NODE_R   = 38
const BIOME_R  = 15
const ORBIT_R  = 95
const MIN_SCALE = 0.25
const MAX_SCALE = 3.0
const INIT_SCALE = 0.72  // escala inicial — mostra o mapa todo

type TravelStatus = 'current' | 'accessible' | 'realm_locked' | 'boss_locked'

interface Props { onBack: () => void }

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cp = { x: (x1 + x2) / 2, y: Math.min(y1, y2) - Math.abs(x2 - x1) * 0.12 }
  return `M ${x1} ${y1} Q ${cp.x} ${cp.y} ${x2} ${y2}`
}

function biomePositions(cx: number, cy: number, count: number): { x: number; y: number }[] {
  if (count === 0) return []
  const spread = Math.min(count - 1, 3) * 30
  return Array.from({ length: count }, (_, i) => {
    const base   = -90 - spread / 2 + (count > 1 ? (spread / (count - 1)) * i : 0)
    const angle  = (base * Math.PI) / 180
    return { x: cx + ORBIT_R * Math.cos(angle), y: cy + ORBIT_R * Math.sin(angle) }
  })
}

const STATUS_COLOR: Record<TravelStatus, string> = {
  current:      '#14b8a6',
  accessible:   '#a78bfa',
  realm_locked: '#334155',
  boss_locked:  '#92400e',
}

export function WorldMapScreen({ onBack }: Props) {
  const { realm, realmStage, currentLocationId } = usePlayerStore()
  const locations  = useGameDataStore(s => s.locations)
  const biomes     = useGameDataStore(s => s.biomes)
  const biomeOrder = useGameDataStore(s => s.biomeOrder)
  const bestiary   = useBestiaryStore(s => s.entries)

  const [selected,  setSelected]  = useState<string | null>(null)
  const [traveling, setTraveling] = useState(false)
  const [travelMsg, setTravelMsg] = useState('')

  // ── Pan & Zoom ────────────────────────────────────────────────
  const containerRef  = useRef<HTMLDivElement>(null)
  const transformRef  = useRef({ scale: INIT_SCALE, x: 40, y: 40 })
  const [tf, setTf]   = useState(transformRef.current)

  const dragRef  = useRef({ dragging: false, startX: 0, startY: 0, ox: 0, oy: 0, moved: false })

  function applyTransform(next: typeof tf) {
    transformRef.current = next
    setTf({ ...next })
  }

  // Wheel → zoom centrado no cursor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const t    = transformRef.current
      const delta = e.deltaY < 0 ? 1.1 : 0.9
      const ns   = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * delta))
      const rect = el.getBoundingClientRect()
      const cx   = e.clientX - rect.left
      const cy   = e.clientY - rect.top
      const wx   = (cx - t.x) / t.scale
      const wy   = (cy - t.y) / t.scale
      applyTransform({ scale: ns, x: cx - wx * ns, y: cy - wy * ns })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const t = transformRef.current
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, ox: t.x, oy: t.y, moved: false }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d.dragging) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
    if (d.moved) applyTransform({ ...transformRef.current, x: d.ox + dx, y: d.oy + dy })
  }, [])

  const onMouseUp = useCallback(() => { dragRef.current.dragging = false }, [])

  // Touch
  const touchRef = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const t  = e.touches[0]
    const tr = transformRef.current
    touchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY, ox: tr.x, oy: tr.y }
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current
    if (!touch || e.touches.length !== 1) return
    const t  = e.touches[0]
    if (t.identifier !== touch.id) return
    const dx = t.clientX - touch.x
    const dy = t.clientY - touch.y
    applyTransform({ ...transformRef.current, x: touch.ox + dx, y: touch.oy + dy })
  }, [])

  function resetView() { applyTransform({ scale: INIT_SCALE, x: 40, y: 40 }) }
  function zoomIn()  { const s = Math.min(MAX_SCALE, tf.scale * 1.25); applyTransform({ ...tf, scale: s }) }
  function zoomOut() { const s = Math.max(MIN_SCALE, tf.scale * 0.8);  applyTransform({ ...tf, scale: s }) }

  // ── Dados ─────────────────────────────────────────────────────
  const locMap = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l])), [locations])

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

  function getTravelStatus(loc: LocationDefinition): TravelStatus {
    if (loc.id === currentLocationId) return 'current'
    const curr = locMap[currentLocationId]
    if (!curr?.connectedTo.includes(loc.id)) return 'realm_locked'
    if (!isAtLeast(realm, realmStage, loc.requiredRealm as Realm, loc.requiredStage as RealmStage)) return 'realm_locked'
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

  function handleNodeClick(locId: string, status: TravelStatus) {
    if (dragRef.current.moved) return  // foi drag, não click
    if (status !== 'realm_locked') {
      setSelected(prev => prev === locId ? null : locId)
      setTravelMsg('')
    }
  }

  const selectedLoc    = selected ? locMap[selected] : null
  const selectedStatus = selectedLoc ? getTravelStatus(selectedLoc) : null

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col select-none">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">
          ← Voltar
        </button>
        <h1 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider flex-1">Mapa do Mundo</h1>
        {travelMsg && (
          <span className={`text-sm ${travelMsg.startsWith('Chegou') ? 'text-teal-400' : 'text-red-400'}`}>
            {travelMsg}
          </span>
        )}
        {/* Controles de zoom */}
        <div className="flex items-center gap-1 border border-slate-700 bg-slate-900">
          <button onClick={zoomOut} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-bold transition-colors">−</button>
          <span className="text-xs text-slate-500 px-2 tabular-nums">{Math.round(tf.scale * 100)}%</span>
          <button onClick={zoomIn}  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-bold transition-colors">+</button>
          <button onClick={resetView} className="px-2 py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-colors border-l border-slate-700">↺</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>
        {/* Área do mapa — pan + zoom */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-slate-950"
          style={{ cursor: dragRef.current.dragging ? 'grabbing' : 'grab', minHeight: 400 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { touchRef.current = null }}
        >
          {/* Hint */}
          <div className="absolute bottom-2 left-3 text-[10px] text-slate-700 pointer-events-none">
            Scroll para zoom · Arrastar para mover
          </div>

          <svg
            width={SVG_W}
            height={SVG_H}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.scale})`,
              transformOrigin: '0 0',
              transition: 'none',
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Fundo */}
            <rect width={SVG_W} height={SVG_H} fill="#020617" />
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={SVG_H}
                stroke="#0f172a" strokeWidth="1" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 100} x2={SVG_W} y2={i * 100}
                stroke="#0f172a" strokeWidth="1" />
            ))}

            {/* Paths */}
            {locations.map(loc =>
              loc.connectedTo.map(tgtId => {
                const tgt = locMap[tgtId]
                if (!tgt || loc.id > tgtId) return null
                const active = getTravelStatus(loc) !== 'realm_locked' || getTravelStatus(tgt) !== 'realm_locked'
                return (
                  <path key={`${loc.id}-${tgtId}`}
                    d={bezierPath(loc.mapX, loc.mapY, tgt.mapX, tgt.mapY)}
                    stroke={active ? '#334155' : '#1e293b'}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={active ? undefined : '6 6'}
                    fill="none" opacity={0.9}
                  />
                )
              })
            )}

            {/* Sub-nós de bioma */}
            {locations.map(loc => {
              const lbs  = biomesByLoc[loc.id] ?? []
              const pos  = biomePositions(loc.mapX, loc.mapY, lbs.length)
              const dim  = getTravelStatus(loc) === 'realm_locked'
              return lbs.map((b, i) => {
                const p = pos[i]
                if (!p) return null
                const ac = b.theme?.accentColor ?? '#475569'
                return (
                  <g key={b.id} opacity={dim ? 0.25 : 0.75}>
                    <line x1={loc.mapX} y1={loc.mapY} x2={p.x} y2={p.y}
                      stroke={ac} strokeWidth="1" strokeDasharray="3 5" opacity={0.4} />
                    <circle cx={p.x} cy={p.y} r={BIOME_R}
                      fill={ac + '20'} stroke={ac} strokeWidth="1.5" />
                    <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fill={dim ? '#475569' : '#94a3b8'} fontSize={10} fontWeight="bold">
                      {b.difficulty}
                    </text>
                    <text x={p.x} y={p.y + BIOME_R + 11}
                      textAnchor="middle" fill={dim ? '#334155' : ac} fontSize={9} fontFamily="serif">
                      {b.name.split(' ').slice(0, 2).join(' ')}
                    </text>
                  </g>
                )
              })
            })}

            {/* Nós principais */}
            {locations.map(loc => {
              const status    = getTravelStatus(loc)
              const color     = STATUS_COLOR[status]
              const isCurrent = status === 'current'
              const isSel     = selected === loc.id
              const clickable = status !== 'realm_locked'

              return (
                <g key={loc.id}
                  style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
                  onClick={() => handleNodeClick(loc.id, status)}>
                  {isCurrent && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 14}
                      fill="none" stroke={color} strokeWidth="1" opacity={0.25}
                      filter="url(#glow)" />
                  )}
                  {isSel && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R + 7}
                      fill="none" stroke={color} strokeWidth="2.5" opacity={0.5} />
                  )}
                  <circle cx={loc.mapX} cy={loc.mapY} r={NODE_R}
                    fill={color + '22'}
                    stroke={color}
                    strokeWidth={isCurrent ? 3 : 1.5}
                    opacity={status === 'realm_locked' ? 0.4 : 1}
                    filter={isCurrent ? 'url(#glow)' : undefined}
                  />
                  <text x={loc.mapX} y={loc.mapY + 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={28} opacity={status === 'realm_locked' ? 0.3 : 1}>
                    {loc.emoji}
                  </text>
                  {status === 'realm_locked' && (
                    <text x={loc.mapX + 26} y={loc.mapY - 26} fontSize={16}>🔒</text>
                  )}
                  {status === 'boss_locked' && (
                    <text x={loc.mapX + 26} y={loc.mapY - 26} fontSize={16}>⚔️</text>
                  )}
                  <text x={loc.mapX} y={loc.mapY + NODE_R + 16}
                    textAnchor="middle"
                    fill={status === 'realm_locked' ? '#475569' : '#e2e8f0'}
                    fontSize={13} fontFamily="serif"
                    fontWeight={isCurrent ? 'bold' : 'normal'}>
                    {loc.name}
                  </text>
                  {isCurrent && (
                    <text x={loc.mapX} y={loc.mapY - NODE_R - 12}
                      textAnchor="middle" fill={color} fontSize={11} fontWeight="bold">
                      ← Aqui
                    </text>
                  )}
                  {status === 'realm_locked' && (
                    <text x={loc.mapX} y={loc.mapY + NODE_R + 30}
                      textAnchor="middle" fill="#475569" fontSize={10}>
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

              {(biomesByLoc[selectedLoc.id] ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1.5">Áreas de Combate</p>
                  <div className="space-y-1">
                    {(biomesByLoc[selectedLoc.id] ?? []).map(b => (
                      <div key={b.id} className="flex items-center gap-2 text-xs px-2 py-1 border border-slate-800 bg-slate-800/40">
                        <span className="font-bold" style={{ color: b.theme?.accentColor ?? '#94a3b8' }}>Dif.{b.difficulty}</span>
                        <span className="text-slate-300 flex-1">{b.name}</span>
                        <span className="text-slate-600 text-[10px]">{REALM_NAMES[b.requiredRealm]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                <div className="text-center text-teal-400 text-sm border border-teal-800/40 bg-teal-950/20 py-2">Você está aqui</div>
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
                <div className="text-center text-red-400/60 text-xs border border-red-900/40 py-2">⚔️ Derrote o boss obrigatório primeiro</div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-slate-600 text-sm space-y-2">
              <div className="text-4xl opacity-20 mb-3">🗺️</div>
              <p>Clique em uma localização</p>
              <div className="text-xs space-y-1.5 mt-4 text-left">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-teal-500 shrink-0" /> Localização atual</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-purple-500 shrink-0" /> Pode viajar</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-slate-600 shrink-0" /> Bloqueado</div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">Números menores = biomas de combate</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
