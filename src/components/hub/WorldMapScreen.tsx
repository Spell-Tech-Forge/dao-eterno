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
import { realmStageToLevel } from '../../data/breakthroughs'

const SVG_W     = 1500
const SVG_H     = 700
const LOC_R     = 38
const BIOME_R   = 22
const MIN_SCALE = 0.25
const MAX_SCALE = 3.0
const INIT_SCALE = 0.72

type TravelStatus = 'current' | 'accessible' | 'realm_locked' | 'boss_locked'
type Selection   = { type: 'location'; id: string } | { type: 'biome'; id: string } | null

interface Props {
  onBack: () => void
  onEnterBiome: (biomeId: string) => void
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cp = { x: (x1 + x2) / 2, y: Math.min(y1, y2) - Math.abs(x2 - x1) * 0.12 }
  return `M ${x1} ${y1} Q ${cp.x} ${cp.y} ${x2} ${y2}`
}

// Posiciona biomas sem map_x/map_y definidos (fallback automático)
function fallbackBiomePos(cx: number, cy: number, idx: number, total: number) {
  const spread = 120
  const start  = -spread / 2
  const step   = total > 1 ? spread / (total - 1) : 0
  const angle  = ((start + step * idx - 90) * Math.PI) / 180
  const r      = 100
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

const STATUS_COLOR: Record<TravelStatus, string> = {
  current:      '#14b8a6',
  accessible:   '#a78bfa',
  realm_locked: '#334155',
  boss_locked:  '#92400e',
}

export function WorldMapScreen({ onBack, onEnterBiome }: Props) {
  const { realm, realmStage, currentLocationId } = usePlayerStore()
  const locations  = useGameDataStore(s => s.locations)
  const biomes     = useGameDataStore(s => s.biomes)
  const biomeOrder = useGameDataStore(s => s.biomeOrder)
  const bestiary   = useBestiaryStore(s => s.entries)

  const [selection, setSelection] = useState<Selection>(null)
  const [traveling, setTraveling] = useState(false)
  const [travelMsg, setTravelMsg] = useState('')

  // ── Pan & Zoom ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const tfRef        = useRef({ scale: INIT_SCALE, x: 40, y: 40 })
  const [tf, setTf]  = useState(tfRef.current)
  const dragRef      = useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false })
  const touchRef     = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null)

  function applyTf(next: typeof tf) { tfRef.current = next; setTf({ ...next }) }

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const t  = tfRef.current
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * (e.deltaY < 0 ? 1.12 : 0.88)))
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top
      applyTf({ scale: ns, x: cx - (cx - t.x) / t.scale * ns, y: cy - (cy - t.y) / t.scale * ns })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const t = tfRef.current
    dragRef.current = { on: true, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, moved: false }
  }, [])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current; if (!d.on) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
    if (d.moved) applyTf({ ...tfRef.current, x: d.ox + dx, y: d.oy + dy })
  }, [])
  const onMouseUp = useCallback(() => { dragRef.current.on = false }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0], tr = tfRef.current
    touchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY, ox: tr.x, oy: tr.y }
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current; if (!touch || e.touches.length !== 1) return
    const t = e.touches[0]; if (t.identifier !== touch.id) return
    applyTf({ ...tfRef.current, x: touch.ox + (t.clientX - touch.x), y: touch.oy + (t.clientY - touch.y) })
  }, [])

  function resetView() { applyTf({ scale: INIT_SCALE, x: 40, y: 40 }) }
  function zoomIn()    { applyTf({ ...tfRef.current, scale: Math.min(MAX_SCALE, tfRef.current.scale * 1.25) }) }
  function zoomOut()   { applyTf({ ...tfRef.current, scale: Math.max(MIN_SCALE, tfRef.current.scale * 0.8) }) }

  // ── Data ───────────────────────────────────────────────────────
  const locMap = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l])), [locations])

  const biomesByLoc = useMemo(() => {
    const map: Record<string, BiomeDefinition[]> = {}
    biomeOrder.forEach(id => {
      const b = biomes[id]; if (!b?.locationId) return
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

  function isBiomeLocked(b: BiomeDefinition): boolean {
    const reqLevel = realmStageToLevel(b.requiredRealm, b.requiredStage)
    const plLevel  = realmStageToLevel(realm, realmStage)
    return plLevel < reqLevel
  }

  function isBossLocked(biomesList: BiomeDefinition[], idx: number): boolean {
    if (idx === 0) return false
    const bossId = biomesList[idx - 1]?.bossId
    return !!bossId && !(bestiary[bossId]?.kills >= 1)
  }

  async function handleTravel(locationId: string) {
    const char = useAuthStore.getState().activeCharacter; if (!char) return
    setTraveling(true); setTravelMsg('')
    try {
      const res = await api.post<{ current_location_id: string }>(`/api/characters/${char.id}/travel`, { locationId })
      usePlayerStore.setState({ currentLocationId: res.current_location_id })
      setSelection(null)
      setTravelMsg(`Chegou em ${locMap[locationId]?.name}!`)
    } catch (err) { setTravelMsg(err instanceof Error ? err.message : 'Erro ao viajar.') }
    finally { setTraveling(false) }
  }

  function handleClick(type: 'location' | 'biome', id: string) {
    if (dragRef.current.moved) return
    setSelection(prev => (prev?.id === id ? null : { type, id }))
    setTravelMsg('')
  }

  // ── Render helpers ──────────────────────────────────────────────
  const selLoc    = selection?.type === 'location' ? locMap[selection.id] : null
  const selBiome  = selection?.type === 'biome'    ? biomes[selection.id] : null
  const selLocStatus = selLoc ? getTravelStatus(selLoc) : null

  function getBiomePos(b: BiomeDefinition, idx: number, total: number, parent: LocationDefinition) {
    if ((b.mapX ?? 0) !== 0 || (b.mapY ?? 0) !== 0) return { x: b.mapX!, y: b.mapY! }
    return fallbackBiomePos(parent.mapX, parent.mapY, idx, total)
  }

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
        <div className="flex items-center gap-1 border border-slate-700 bg-slate-900">
          <button onClick={zoomOut} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-bold transition-colors">−</button>
          <span className="text-xs text-slate-500 px-2 tabular-nums">{Math.round(tf.scale * 100)}%</span>
          <button onClick={zoomIn}  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-bold transition-colors">+</button>
          <button onClick={resetView} className="px-2 py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-colors border-l border-slate-700">↺</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>
        {/* Mapa */}
        <div ref={containerRef}
          className="flex-1 overflow-hidden relative bg-slate-950"
          style={{ cursor: dragRef.current.on ? 'grabbing' : 'grab', minHeight: 400 }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          onTouchEnd={() => { touchRef.current = null }}
        >
          <div className="absolute bottom-2 left-3 text-[10px] text-slate-700 pointer-events-none z-10">
            Scroll para zoom · Arrastar para mover
          </div>

          <svg width={SVG_W} height={SVG_H} style={{
            position: 'absolute', top: 0, left: 0,
            transform: `translate(${tf.x}px,${tf.y}px) scale(${tf.scale})`,
            transformOrigin: '0 0',
          }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Fundo */}
            <rect width={SVG_W} height={SVG_H} fill="#020617" />
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={SVG_H} stroke="#0f172a" strokeWidth="1" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i*100} x2={SVG_W} y2={i*100} stroke="#0f172a" strokeWidth="1" />
            ))}

            {/* Paths entre localizações */}
            {locations.map(loc =>
              loc.connectedTo.map(tgtId => {
                const tgt = locMap[tgtId]; if (!tgt || loc.id > tgtId) return null
                const active = getTravelStatus(loc) !== 'realm_locked' || getTravelStatus(tgt) !== 'realm_locked'
                return (
                  <path key={`${loc.id}-${tgtId}`}
                    d={bezierPath(loc.mapX, loc.mapY, tgt.mapX, tgt.mapY)}
                    stroke={active ? '#334155' : '#1e293b'} strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={active ? undefined : '6 6'} fill="none" opacity={0.9} />
                )
              })
            )}

            {/* Linhas bioma → cidade + nós de bioma */}
            {locations.map(loc => {
              const lbs     = biomesByLoc[loc.id] ?? []
              const locSt   = getTravelStatus(loc)
              const dimAll  = locSt === 'realm_locked'
              return lbs.map((b, i) => {
                const pos   = getBiomePos(b, i, lbs.length, loc)
                const ac    = b.theme?.accentColor ?? '#475569'
                const locked = dimAll || isBiomeLocked(b) || isBossLocked(lbs, i)
                const isSel  = selection?.id === b.id
                return (
                  <g key={b.id} opacity={dimAll ? 0.2 : locked ? 0.45 : 1}
                    style={{ cursor: locked || dimAll ? 'not-allowed' : 'pointer' }}
                    onClick={() => !dimAll && handleClick('biome', b.id)}>
                    {/* Linha ao nó pai */}
                    <line x1={loc.mapX} y1={loc.mapY} x2={pos.x} y2={pos.y}
                      stroke={ac} strokeWidth="1.5" strokeDasharray="4 5" opacity={0.4} />
                    {/* Anel de seleção */}
                    {isSel && (
                      <circle cx={pos.x} cy={pos.y} r={BIOME_R + 6}
                        fill="none" stroke={ac} strokeWidth="2" opacity={0.5} />
                    )}
                    {/* Nó */}
                    <circle cx={pos.x} cy={pos.y} r={BIOME_R}
                      fill={ac + '22'} stroke={ac} strokeWidth={isSel ? 2 : 1.5} />
                    {/* Dificuldade */}
                    <text x={pos.x} y={pos.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={locked ? '#475569' : '#e2e8f0'} fontSize={11} fontWeight="bold">
                      {b.difficulty}
                    </text>
                    {/* Nome */}
                    <text x={pos.x} y={pos.y + BIOME_R + 12}
                      textAnchor="middle" fill={locked ? '#334155' : ac} fontSize={9} fontFamily="serif">
                      {b.name.split(' ').slice(0, 2).join(' ')}
                    </text>
                    {/* Lock */}
                    {locked && !dimAll && (
                      <text x={pos.x + BIOME_R - 4} y={pos.y - BIOME_R + 4} fontSize={11}>🔒</text>
                    )}
                  </g>
                )
              })
            })}

            {/* Nós de localização */}
            {locations.map(loc => {
              const status   = getTravelStatus(loc)
              const color    = STATUS_COLOR[status]
              const isCur    = status === 'current'
              const isSel    = selection?.id === loc.id
              const clickable = status !== 'realm_locked'
              return (
                <g key={loc.id}
                  style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
                  onClick={() => handleClick('location', loc.id)}>
                  {isCur && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={LOC_R + 14}
                      fill="none" stroke={color} strokeWidth="1" opacity={0.25} filter="url(#glow)" />
                  )}
                  {isSel && (
                    <circle cx={loc.mapX} cy={loc.mapY} r={LOC_R + 7}
                      fill="none" stroke={color} strokeWidth="2.5" opacity={0.5} />
                  )}
                  <circle cx={loc.mapX} cy={loc.mapY} r={LOC_R}
                    fill={color + '22'} stroke={color}
                    strokeWidth={isCur ? 3 : 1.5}
                    opacity={status === 'realm_locked' ? 0.4 : 1}
                    filter={isCur ? 'url(#glow)' : undefined} />
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
                  <text x={loc.mapX} y={loc.mapY + LOC_R + 16}
                    textAnchor="middle"
                    fill={status === 'realm_locked' ? '#475569' : '#e2e8f0'}
                    fontSize={13} fontFamily="serif"
                    fontWeight={isCur ? 'bold' : 'normal'}>
                    {loc.name}
                  </text>
                  {isCur && (
                    <text x={loc.mapX} y={loc.mapY - LOC_R - 12}
                      textAnchor="middle" fill={color} fontSize={11} fontWeight="bold">
                      ← Aqui
                    </text>
                  )}
                  {status === 'realm_locked' && (
                    <text x={loc.mapX} y={loc.mapY + LOC_R + 30}
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
          {/* Localização selecionada */}
          {selLoc && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-4xl shrink-0">{selLoc.emoji}</span>
                <div>
                  <p className="font-cinzel font-bold text-base text-amber-300">{selLoc.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 border ${selLoc.type === 'city' ? 'border-amber-700 text-amber-500' : 'border-teal-800 text-teal-600'}`}>
                    {selLoc.type === 'city' ? '🏙️ Cidade' : '🏘️ Vila'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{selLoc.description}</p>
              {selLocStatus !== 'current' && (
                <div className="border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs space-y-1">
                  <p className="text-slate-300 font-semibold">
                    {REALM_NAMES[selLoc.requiredRealm]} — {STAGE_NAMES[selLoc.requiredStage]}
                  </p>
                  {selLoc.requiredBossId && (
                    <p className={selLocStatus === 'boss_locked' ? 'text-red-400' : 'text-teal-400'}>
                      ⚔️ Boss: {selLoc.requiredBossId} {selLocStatus === 'boss_locked' ? '(pendente)' : '✓'}
                    </p>
                  )}
                </div>
              )}
              {selLocStatus === 'current'    && <div className="text-center text-teal-400 text-sm border border-teal-800/40 bg-teal-950/20 py-2">Você está aqui</div>}
              {selLocStatus === 'accessible' && (
                <button onClick={() => handleTravel(selLoc.id)} disabled={traveling}
                  className="w-full py-2.5 font-cinzel font-bold text-sm border border-purple-600 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-colors disabled:opacity-50">
                  {traveling ? 'Viajando...' : `🧳 Viajar para ${selLoc.name}`}
                </button>
              )}
              {selLocStatus === 'realm_locked' && <div className="text-center text-slate-600 text-xs border border-slate-800 py-2">🔒 Cultivo insuficiente</div>}
              {selLocStatus === 'boss_locked'  && <div className="text-center text-red-400/60 text-xs border border-red-900/40 py-2">⚔️ Derrote o boss obrigatório primeiro</div>}
            </>
          )}

          {/* Bioma selecionado */}
          {selBiome && (() => {
            const ac      = selBiome.theme?.accentColor ?? '#94a3b8'
            const inLoc   = selBiome.locationId === currentLocationId
            const locked  = isBiomeLocked(selBiome)
            const locBiomes = biomesByLoc[selBiome.locationId ?? ''] ?? []
            const idx       = locBiomes.findIndex(b => b.id === selBiome.id)
            const bossLocked = isBossLocked(locBiomes, idx)
            const canEnter  = inLoc && !locked && !bossLocked
            return (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border flex items-center justify-center text-2xl font-bold"
                    style={{ borderColor: ac + '60', backgroundColor: ac + '15', color: ac }}>
                    {selBiome.difficulty}
                  </div>
                  <div>
                    <p className="font-cinzel font-bold text-sm" style={{ color: ac }}>{selBiome.name}</p>
                    <p className="text-[10px] text-slate-500">{REALM_NAMES[selBiome.requiredRealm]} — {STAGE_NAMES[selBiome.requiredStage]}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{selBiome.description}</p>
                {!inLoc && (
                  <div className="text-xs border border-slate-700 bg-slate-800/40 px-3 py-2 text-slate-500">
                    📍 Localização: <span className="text-slate-300">{locMap[selBiome.locationId ?? '']?.name ?? selBiome.locationId}</span>
                    <br />Viaje até lá para explorar.
                  </div>
                )}
                {locked && inLoc && (
                  <div className="text-center text-slate-600 text-xs border border-slate-800 py-2">🔒 Cultivo insuficiente</div>
                )}
                {bossLocked && inLoc && (
                  <div className="text-center text-orange-400/70 text-xs border border-orange-900/40 py-2">⚔️ Derrote o boss anterior primeiro</div>
                )}
                {canEnter && (
                  <button onClick={() => { onEnterBiome(selBiome.id) }}
                    className="w-full py-2.5 font-cinzel font-bold text-sm border transition-all hover:brightness-110"
                    style={{ borderColor: ac, color: ac, backgroundColor: ac + '18' }}>
                    ⚔️ Explorar {selBiome.name}
                  </button>
                )}
              </>
            )
          })()}

          {/* Placeholder */}
          {!selLoc && !selBiome && (
            <div className="text-center py-10 text-slate-600 text-sm space-y-2">
              <div className="text-4xl opacity-20 mb-3">🗺️</div>
              <p>Clique em uma localização ou bioma</p>
              <div className="text-xs space-y-1.5 mt-4 text-left">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-teal-500 shrink-0" /> Localização atual</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-purple-500 shrink-0" /> Pode viajar</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-slate-600 shrink-0" /> Bloqueado</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">Nós menores = biomas de combate</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
