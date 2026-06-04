import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../lib/api'

const SVG_W = 1500
const SVG_H = 1100
const DISPLAY_SCALE = 0.52  // tamanho exibido no painel

interface LocNode {
  id: string; name: string; emoji: string; type: string
  map_x: number; map_y: number; connected_to: string[]
  required_realm: string; sort_order: number
}
interface BiomeNode {
  id: string; name: string; accent_color: string
  map_x: number; map_y: number; location_id: string
  sort_order: number
}

type DragTarget = { kind: 'loc' | 'biome'; id: string }

// Cor por tier (baseado no sort_order)
const TIER_COLORS = ['#78716c','#14b8a6','#7986cb','#d4a84b','#f59e0b',
  '#6366f1','#e8642a','#4488ff','#aa44ff','#ffffff']

function tierColor(sortOrder: number) {
  return TIER_COLORS[Math.min(sortOrder - 1, TIER_COLORS.length - 1)] ?? '#94a3b8'
}

export function WorldMapEditorPanel({ onMutate }: { onMutate: () => void }) {
  const [locs,   setLocs]   = useState<LocNode[]>([])
  const [biomes, setBiomes] = useState<BiomeNode[]>([])
  const [dirty,  setDirty]  = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const [selected, setSelected] = useState<DragTarget | null>(null)
  const [showBiomes, setShowBiomes] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  const dragging = useRef<DragTarget | null>(null)
  const svgRef   = useRef<SVGSVGElement>(null)
  const startPos = useRef<{mx:number;my:number;ox:number;oy:number} | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<LocNode[]>('/api/admin/locations'),
      api.get<BiomeNode[]>('/api/admin/biomes'),
    ]).then(([l, b]) => {
      setLocs(l.sort((a,b) => a.sort_order - b.sort_order))
      setBiomes(b.sort((a,b) => a.sort_order - b.sort_order))
    }).catch(() => {})
  }, [])

  // ── Drag handlers ────────────────────────────────────────────────

  const getSvgPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scale = SVG_W / rect.width
    return {
      x: Math.round(Math.max(0, Math.min(SVG_W, (e.clientX - rect.left) * scale))),
      y: Math.round(Math.max(0, Math.min(SVG_H, (e.clientY - rect.top)  * scale))),
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, target: DragTarget) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = target
    setSelected(target)
    const pos = getSvgPos(e)
    const node = target.kind === 'loc'
      ? locs.find(l => l.id === target.id)
      : biomes.find(b => b.id === target.id)
    startPos.current = { mx: pos.x, my: pos.y, ox: node?.map_x ?? 0, oy: node?.map_y ?? 0 }
  }, [locs, biomes, getSvgPos])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !startPos.current) return
    const pos = getSvgPos(e)
    const dx = pos.x - startPos.current.mx
    const dy = pos.y - startPos.current.my
    const nx = Math.round(startPos.current.ox + dx)
    const ny = Math.round(startPos.current.oy + dy)
    const { kind, id } = dragging.current
    if (kind === 'loc') {
      setLocs(prev => prev.map(l => l.id === id ? { ...l, map_x: nx, map_y: ny } : l))
    } else {
      setBiomes(prev => prev.map(b => b.id === id ? { ...b, map_x: nx, map_y: ny } : b))
    }
    setDirty(prev => new Set([...prev, `${kind}:${id}`]))
  }, [getSvgPos])

  const handleMouseUp = useCallback(() => {
    dragging.current = null
    startPos.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // ── Save ─────────────────────────────────────────────────────────

  async function saveAll() {
    setSaving(true); setMsg('')
    let ok = 0, fail = 0
    for (const key of dirty) {
      const [kind, id] = key.split(':')
      try {
        if (kind === 'loc') {
          const l = locs.find(x => x.id === id)!
          await api.put(`/api/admin/locations/${id}`, l)
        } else {
          const b = biomes.find(x => x.id === id)!
          await api.put(`/api/admin/biomes/${id}`, b)
        }
        ok++
      } catch { fail++ }
    }
    setDirty(new Set())
    setMsg(fail ? `Salvo: ${ok} | Erro: ${fail}` : `✓ ${ok} itens salvos!`)
    setSaving(false)
    onMutate()
  }

  // ── Nó selecionado ───────────────────────────────────────────────

  const selNode = selected
    ? selected.kind === 'loc'
      ? locs.find(l => l.id === selected.id)
      : biomes.find(b => b.id === selected.id)
    : null

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">
          Editor Visual do Mapa
        </span>
        <div className="flex gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showBiomes} onChange={e => setShowBiomes(e.target.checked)} />
            Biomas
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            Nomes
          </label>
          {dirty.size > 0 && (
            <button disabled={saving} onClick={saveAll}
              className="px-4 py-1.5 text-xs font-bold border border-teal-700/60 text-teal-400 bg-teal-950/10 hover:bg-teal-950/30 disabled:opacity-40 transition-colors">
              {saving ? 'Salvando...' : `💾 Salvar (${dirty.size} alterações)`}
            </button>
          )}
        </div>
      </div>

      {msg && <div className="text-xs text-teal-400 border border-teal-800/40 px-3 py-2 bg-teal-950/20">{msg}</div>}

      {/* Painel principal: mapa + info */}
      <div className="flex gap-4 items-start">

        {/* SVG Map */}
        <div className="flex-1 min-w-0 border border-slate-700 bg-slate-950 overflow-auto"
          style={{ cursor: dragging.current ? 'grabbing' : 'default' }}>
          <svg
            ref={svgRef}
            width={SVG_W * DISPLAY_SCALE}
            height={SVG_H * DISPLAY_SCALE}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ display: 'block', userSelect: 'none' }}
            onClick={() => setSelected(null)}
          >
            {/* Background */}
            <rect width={SVG_W} height={SVG_H} fill="#0a0a12" />

            {/* Grid lines suaves */}
            {[...Array(16)].map((_,i) => (
              <line key={`gx${i}`} x1={i*100} y1={0} x2={i*100} y2={SVG_H} stroke="#1a1a2e" strokeWidth={1} />
            ))}
            {[...Array(12)].map((_,i) => (
              <line key={`gy${i}`} x1={0} y1={i*100} x2={SVG_W} y2={i*100} stroke="#1a1a2e" strokeWidth={1} />
            ))}

            {/* Linhas de conexão entre cidades */}
            {locs.map(loc =>
              loc.connected_to?.map(connId => {
                const target = locs.find(l => l.id === connId)
                if (!target || target.id < loc.id) return null
                return (
                  <line key={`${loc.id}-${connId}`}
                    x1={loc.map_x} y1={loc.map_y} x2={target.map_x} y2={target.map_y}
                    stroke="#2a3a5a" strokeWidth={2} strokeDasharray="8 4" />
                )
              })
            )}

            {/* Linhas cidade → biomas */}
            {showBiomes && biomes.map(b => {
              const parent = locs.find(l => l.id === b.location_id)
              if (!parent) return null
              return (
                <line key={`link-${b.id}`}
                  x1={parent.map_x} y1={parent.map_y} x2={b.map_x} y2={b.map_y}
                  stroke="#1e3a2a" strokeWidth={1.5} strokeDasharray="4 3" />
              )
            })}

            {/* Biomas */}
            {showBiomes && biomes.map(b => {
              const parentLoc = locs.find(l => l.id === b.location_id)
              const color = parentLoc ? tierColor(parentLoc.sort_order) : '#475569'
              const isSelected = selected?.kind === 'biome' && selected?.id === b.id
              const isDirty = dirty.has(`biome:${b.id}`)
              return (
                <g key={b.id}
                  style={{ cursor: 'grab' }}
                  onMouseDown={e => handleMouseDown(e, { kind: 'biome', id: b.id })}
                  onClick={e => { e.stopPropagation(); setSelected({ kind: 'biome', id: b.id }) }}
                >
                  <circle cx={b.map_x} cy={b.map_y} r={isSelected ? 16 : 12}
                    fill={color + '25'} stroke={isDirty ? '#f59e0b' : color + '88'}
                    strokeWidth={isSelected ? 2.5 : 1.5} />
                  <circle cx={b.map_x} cy={b.map_y} r={5}
                    fill={color} />
                  {showLabels && (
                    <text x={b.map_x} y={b.map_y + 22}
                      textAnchor="middle" fontSize={9} fill={color + 'bb'} fontFamily="sans-serif">
                      {b.name.length > 16 ? b.name.slice(0, 14) + '…' : b.name}
                    </text>
                  )}
                  {isDirty && (
                    <circle cx={b.map_x + 9} cy={b.map_y - 9} r={4} fill="#f59e0b" />
                  )}
                </g>
              )
            })}

            {/* Cidades/Localizações */}
            {locs.map(loc => {
              const color = tierColor(loc.sort_order)
              const isSelected = selected?.kind === 'loc' && selected?.id === loc.id
              const isDirty = dirty.has(`loc:${loc.id}`)
              const isVillage = loc.type === 'village'
              const R = isVillage ? 22 : 28
              return (
                <g key={loc.id}
                  style={{ cursor: 'grab' }}
                  onMouseDown={e => handleMouseDown(e, { kind: 'loc', id: loc.id })}
                  onClick={e => { e.stopPropagation(); setSelected({ kind: 'loc', id: loc.id }) }}
                >
                  {/* Glow */}
                  <circle cx={loc.map_x} cy={loc.map_y} r={R + 12}
                    fill={color + '15'} />
                  {/* Borda seleção */}
                  {isSelected && (
                    <circle cx={loc.map_x} cy={loc.map_y} r={R + 6}
                      fill="none" stroke={color} strokeWidth={2} strokeDasharray="5 3" />
                  )}
                  {/* Círculo principal */}
                  <circle cx={loc.map_x} cy={loc.map_y} r={R}
                    fill={color + '30'} stroke={isDirty ? '#f59e0b' : color}
                    strokeWidth={isSelected ? 3 : 2} />
                  {/* Emoji */}
                  <text x={loc.map_x} y={loc.map_y + 6}
                    textAnchor="middle" fontSize={18} fontFamily="sans-serif">
                    {loc.emoji}
                  </text>
                  {/* Nome */}
                  {showLabels && (
                    <text x={loc.map_x} y={loc.map_y + R + 16}
                      textAnchor="middle" fontSize={11} fill={color} fontFamily="sans-serif" fontWeight="bold">
                      {loc.name.length > 18 ? loc.name.slice(0, 16) + '…' : loc.name}
                    </text>
                  )}
                  {/* Ponto de alteração pendente */}
                  {isDirty && (
                    <circle cx={loc.map_x + R - 2} cy={loc.map_y - R + 2} r={6} fill="#f59e0b" />
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Painel lateral: info do nó selecionado */}
        <div className="w-52 shrink-0 space-y-3">
          {selNode ? (
            <div className="border border-slate-700 bg-slate-900 p-3 space-y-2">
              <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">
                {selected?.kind === 'loc' ? '🏙️ Cidade/Vila' : '🗺️ Bioma'}
              </div>
              <div className="text-sm font-bold text-slate-200">{selNode.name}</div>
              <div className="text-xs text-slate-500 font-mono">id: {selNode.id}</div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">X</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-2 py-1 focus:outline-none focus:border-teal-600"
                    value={selNode.map_x}
                    onChange={e => {
                      const v = Number(e.target.value)
                      if (selected?.kind === 'loc') setLocs(p => p.map(l => l.id === selected.id ? {...l, map_x: v} : l))
                      else setBiomes(p => p.map(b => b.id === selected!.id ? {...b, map_x: v} : b))
                      setDirty(prev => new Set([...prev, `${selected?.kind}:${selected?.id}`]))
                    }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Y</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-2 py-1 focus:outline-none focus:border-teal-600"
                    value={selNode.map_y}
                    onChange={e => {
                      const v = Number(e.target.value)
                      if (selected?.kind === 'loc') setLocs(p => p.map(l => l.id === selected.id ? {...l, map_y: v} : l))
                      else setBiomes(p => p.map(b => b.id === selected!.id ? {...b, map_y: v} : b))
                      setDirty(prev => new Set([...prev, `${selected?.kind}:${selected?.id}`]))
                    }} />
                </div>
              </div>

              {dirty.has(`${selected?.kind}:${selected?.id}`) && (
                <div className="text-[10px] text-amber-400 flex items-center gap-1">
                  🟡 Alteração pendente
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-700 bg-slate-900 p-3 text-xs text-slate-600 text-center">
              Clique num nó<br/>para selecionar
            </div>
          )}

          {/* Legenda */}
          <div className="border border-slate-700 bg-slate-900 p-3 space-y-2">
            <div className="text-[10px] font-cinzel text-slate-500 uppercase tracking-wider">Legenda</div>
            {[
              {t:1,n:'T1 — Vila'},{t:2,n:'T2 — Jade'},{t:3,n:'T3 — Brumas'},
              {t:4,n:'T4 — Espiritual'},{t:5,n:'T5 — Núcleo'},
              {t:6,n:'T6 — Almas'},{t:7,n:'T7 — Imperial'},
              {t:8,n:'T8 — Estrelas'},{t:9,n:'T9 — Celestial'},{t:10,n:'T10 — Dao'},
            ].map(({t,n}) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: tierColor(t)}} />
                <span className="text-[10px] text-slate-400">{n}</span>
              </div>
            ))}
          </div>

          {/* Dicas */}
          <div className="border border-slate-700 bg-slate-900 p-3 space-y-1">
            <div className="text-[10px] font-cinzel text-slate-500 uppercase tracking-wider mb-2">Dicas</div>
            <div className="text-[10px] text-slate-600">🖱️ Arraste para mover</div>
            <div className="text-[10px] text-slate-600">🖱️ Clique para selecionar</div>
            <div className="text-[10px] text-slate-600">🟡 Ponto amarelo = pendente</div>
            <div className="text-[10px] text-slate-600">⭕ Círculos grandes = cidades</div>
            <div className="text-[10px] text-slate-600">• Pontos pequenos = biomas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
