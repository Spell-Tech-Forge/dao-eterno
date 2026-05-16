import type { ServerLegend } from '../../types/server'

interface Props {
  legend: ServerLegend
  rank?: number
}

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

export function LegendCard({ legend: l, rank }: Props) {
  const realmColor = REALM_COLORS[l.realm] ?? '#c8b89a'
  const bornDate = new Date(l.born_at).toLocaleDateString('pt-BR')
  const diedDate = new Date(l.died_at).toLocaleDateString('pt-BR')

  return (
    <div className="relative overflow-hidden border border-slate-700/50 bg-slate-800/30 p-4">
      {rank !== undefined && (
        <span className="absolute -right-1 -top-2 text-6xl font-bold text-slate-700/20 select-none leading-none">
          {rank}
        </span>
      )}
      <div className="relative flex items-start justify-between mb-2">
        <div>
          <h3 className="text-slate-500 text-sm line-through decoration-slate-600 tracking-wider">
            {l.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: realmColor + '99' }}>
            {l.realm} · {l.realm_stage}
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-600">Poder</div>
          <div className="text-slate-400">{l.cultivation_power.toLocaleString()}</div>
        </div>
      </div>
      <div className="relative text-xs text-slate-600 border-t border-slate-700/40 pt-2 flex items-center gap-3">
        <span className="text-red-700/70">✦ {l.cause_of_death}</span>
        <span>{bornDate} → {diedDate}</span>
      </div>
    </div>
  )
}
