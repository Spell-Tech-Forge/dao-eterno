import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { RankingCharacter, RankingLegend } from '../../types/server'
import { TabBar } from '../ui/TabBar'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const REALM_COLORS: Record<string, string> = {
  'Refinamento de Qi':        '#c8b89a',
  'Fundação Espiritual':      '#4db6ac',
  'Núcleo Dourado':           '#7986cb',
  'Alma Nascente':            '#d4a84b',
  'Transformação Espiritual': '#f0c060',
  'Unificação':               '#ef5350',
  'Ascensão':                 '#70c8c0',
  'Imortal':                  '#fff176',
}

interface Props {
  onBack: () => void
}

export function RankingTable({ onBack }: Props) {
  const [tab, setTab] = useState('heroes')
  const [heroes, setHeroes] = useState<RankingCharacter[]>([])
  const [legends, setLegends] = useState<RankingLegend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const [h, l] = await Promise.all([
          api.get<RankingCharacter[]>('/api/ranking/heroes'),
          api.get<RankingLegend[]>('/api/ranking/legends'),
        ])
        setHeroes(h)
        setLegends(l)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text">Quadro de Glória</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <TabBar
          tabs={[
            { id: 'heroes',  label: '⚔ Hall dos Heróis' },
            { id: 'legends', label: '☽ Hall das Lendas' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        <div className="p-4">
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Consultando os annais..." />
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-sm text-muted py-8">
              Erro ao carregar o ranking. Verifique a conexão com o servidor.
            </p>
          )}

          {!loading && !error && tab === 'heroes' && (
            <HeroesHall heroes={heroes} />
          )}

          {!loading && !error && tab === 'legends' && (
            <LegendsHall legends={legends} />
          )}
        </div>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>
  if (rank === 2) return <span className="text-base">🥈</span>
  if (rank === 3) return <span className="text-base">🥉</span>
  return <span className="text-xs text-muted text-center w-5">{rank}</span>
}

function HeroesHall({ heroes }: { heroes: RankingCharacter[] }) {
  if (heroes.length === 0) {
    return <p className="text-center text-muted text-sm py-8">Nenhum herói registrado ainda.</p>
  }
  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2rem_1fr_1fr_auto] gap-x-4 px-3 py-2 bg-surface-2 text-xs text-muted uppercase tracking-widest rounded-t">
        <span>#</span><span>Cultivador</span><span>Reino</span><span>Poder</span>
      </div>
      {heroes.map((h, i) => (
        <div
          key={h.id}
          className="grid grid-cols-[2rem_1fr_1fr_auto] gap-x-4 px-3 py-3 border-t border-border text-sm hover:bg-surface-2 transition-colors"
        >
          <span className="flex items-center"><RankBadge rank={i + 1} /></span>
          <span className="text-text truncate">{h.name} <span className="text-muted text-xs">({h.username})</span></span>
          <span className="truncate" style={{ color: REALM_COLORS[h.realm] ?? '#94a3b8', fontSize: '0.75rem' }}>
            {h.realm} · {h.realm_stage}
          </span>
          <span className="text-gold text-right">{h.cultivation_power.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function LegendsHall({ legends }: { legends: RankingLegend[] }) {
  if (legends.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-8">
        O Hall das Lendas aguarda seus heróis.
      </p>
    )
  }
  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2rem_1fr_1fr_auto] gap-x-4 px-3 py-2 bg-surface-2 text-xs text-muted uppercase tracking-widest rounded-t">
        <span>#</span><span>Lenda</span><span>Causa</span><span>Poder</span>
      </div>
      {legends.map((l, i) => (
        <div
          key={l.id}
          className="grid grid-cols-[2rem_1fr_1fr_auto] gap-x-4 px-3 py-3 border-t border-border text-sm opacity-80 hover:opacity-100 transition-opacity"
        >
          <span className="flex items-center"><RankBadge rank={i + 1} /></span>
          <span className="text-muted line-through decoration-slate-600 truncate">
            {l.name} <span className="no-underline text-xs">({l.username})</span>
          </span>
          <span className="text-xs text-red-700/70 truncate">{l.cause_of_death}</span>
          <span className="text-muted text-right">{l.cultivation_power.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
