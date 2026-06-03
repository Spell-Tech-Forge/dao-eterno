import { useState, useEffect, useRef, useCallback } from 'react'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { usePlayerStore } from '../../store/playerStore'

const DUMMY_HP = 999_999_999

interface HitLog {
  id: number
  damage: number
  isCrit: boolean
  time: number
}

interface Props { onBack: () => void }

export function TrainingScreen({ onBack }: Props) {
  const stats  = useEffectiveStats()
  usePlayerStore()

  const [running,   setRunning]   = useState(false)
  const [hits,      setHits]      = useState<HitLog[]>([])
  const [totalDmg,  setTotalDmg]  = useState(0)
  const [elapsed,   setElapsed]   = useState(0)   // ms
  const [hitCount,  setHitCount]  = useState(0)
  const [critCount, setCritCount] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef    = useRef<number>(0)
  const idRef       = useRef(0)
  const totalRef    = useRef(0)
  const hitRef      = useRef(0)
  const critRef     = useRef(0)

  const atk         = stats.effectiveAtk
  const speed       = stats.effectiveSpeed   // s por ataque
  const critChance  = stats.effectiveCritChance / 100
  const critMult    = 1 + stats.effectiveCrit / 100

  function rollHit(): { damage: number; isCrit: boolean } {
    const isCrit = Math.random() < critChance
    const raw    = Math.max(1, Math.round(atk * (0.9 + Math.random() * 0.2)))
    const damage = isCrit ? Math.round(raw * critMult) : raw
    return { damage, isCrit }
  }

  const doAttack = useCallback(() => {
    const { damage, isCrit } = rollHit()
    totalRef.current += damage
    hitRef.current   += 1
    if (isCrit) critRef.current += 1

    const entry: HitLog = { id: idRef.current++, damage, isCrit, time: Date.now() }
    setHits(prev => [entry, ...prev].slice(0, 30))
    setTotalDmg(totalRef.current)
    setHitCount(hitRef.current)
    setCritCount(critRef.current)
    setElapsed(Date.now() - startRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atk, critChance, critMult])

  function start() {
    totalRef.current = 0
    hitRef.current   = 0
    critRef.current  = 0
    idRef.current    = 0
    startRef.current = Date.now()
    setHits([])
    setTotalDmg(0)
    setHitCount(0)
    setCritCount(0)
    setElapsed(0)
    setRunning(true)
    intervalRef.current = setInterval(doAttack, speed * 1000)
  }

  function stop() {
    setRunning(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Atualiza elapsed enquanto rodando
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 500)
    return () => clearInterval(t)
  }, [running])

  const elapsedSec = elapsed / 1000
  const realDps    = elapsedSec > 0 ? Math.round(totalDmg / elapsedSec) : 0
  const critPct    = hitCount > 0 ? Math.round((critCount / hitCount) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <button onClick={onBack}
            className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            ← Voltar
          </button>
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider flex-1">🥊 Sala de Treino</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Manequim */}
          <div className="border border-slate-700 bg-slate-900 p-4 flex flex-col items-center gap-4">
            <div className={`text-7xl transition-all ${running ? 'animate-pulse' : ''}`}>🥊</div>
            <div className="text-center">
              <p className="font-cinzel font-bold text-slate-200 text-lg">Manequim de Treino</p>
              <p className="text-xs text-slate-500 mt-1">HP: ∞ (não pode morrer)</p>
            </div>

            {/* Barra de HP "infinita" */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-emerald-400 font-bold">{DUMMY_HP.toLocaleString()} HP</p>

            <button
              onClick={running ? stop : start}
              className={`w-full py-2.5 font-cinzel font-bold text-sm border transition-all ${
                running
                  ? 'border-red-700 bg-red-950/30 text-red-400 hover:bg-red-900/40'
                  : 'border-teal-700 bg-teal-950/30 text-teal-300 hover:bg-teal-900/40'
              }`}
            >
              {running ? '⏹ Parar' : '▶ Iniciar Treino'}
            </button>
          </div>

          {/* Stats e métricas */}
          <div className="space-y-3">
            {/* Stats do personagem */}
            <div className="border border-slate-700 bg-slate-900 p-3">
              <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-2">Stats de Combate</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-500">⚔️ ATK base</span>
                <span className="text-amber-400 font-bold">{atk}</span>
                <span className="text-slate-500">⏱ Velocidade</span>
                <span className="text-blue-400 font-bold">{speed.toFixed(2)}s/atk</span>
                <span className="text-slate-500">💥 Crit chance</span>
                <span className="text-yellow-400 font-bold">{stats.effectiveCritChance.toFixed(1)}%</span>
                <span className="text-slate-500">🎯 Crit dano</span>
                <span className="text-orange-400 font-bold">+{stats.effectiveCrit}%</span>
                <span className="text-slate-500">📊 DPS teórico</span>
                <span className="text-purple-400 font-bold">{stats.effectiveDps}</span>
              </div>
            </div>

            {/* Métricas em tempo real */}
            {(running || hitCount > 0) && (
              <div className="border border-teal-800/40 bg-teal-950/20 p-3">
                <p className="text-[10px] font-cinzel tracking-widest text-teal-500 uppercase mb-2">Métricas em Tempo Real</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-500">⏱ Tempo</span>
                  <span className="text-teal-300 font-bold">{elapsedSec.toFixed(1)}s</span>
                  <span className="text-slate-500">⚔️ Ataques</span>
                  <span className="text-teal-300 font-bold">{hitCount}</span>
                  <span className="text-slate-500">💥 Crits</span>
                  <span className="text-yellow-400 font-bold">{critCount} ({critPct}%)</span>
                  <span className="text-slate-500">💀 Total dano</span>
                  <span className="text-red-400 font-bold">{totalDmg.toLocaleString()}</span>
                  <span className="text-slate-500">📊 DPS real</span>
                  <span className="text-purple-400 font-bold tabular-nums">{realDps.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Log de hits */}
        {hits.length > 0 && (
          <div className="border border-slate-700 bg-slate-900 p-3">
            <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-2">Log de Golpes (últimos 30)</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-hidden">
              {hits.map(h => (
                <span key={h.id}
                  className={`text-xs px-1.5 py-0.5 border font-bold tabular-nums ${
                    h.isCrit
                      ? 'border-yellow-700 bg-yellow-950/30 text-yellow-400'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}>
                  {h.isCrit && '💥 '}{h.damage.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 text-center">
          O treino não consome itens nem Qi. Use para calibrar sua build antes de aventuras.
        </p>
      </div>
    </div>
  )
}
