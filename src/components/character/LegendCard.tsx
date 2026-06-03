import type { ServerLegend } from '../../types/server'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE } from '../../types/server'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { Realm, RealmStage } from '../../types'

interface Props {
  legend: ServerLegend
  rank?: number
}

const REALM_COLORS: Record<string, string> = {
  body_tempering:        '#c8b89a',
  houtian:               '#4db6ac',
  xiantian:              '#7986cb',
  revolving_core:        '#d4a84b',
  life_destruction:      '#ef5350',
  divine_sea:            '#42a5f5',
  divine_transformation: '#f0c060',
  divine_lord:           '#70c8c0',
  holy_lord:             '#fff176',
  world_king:            '#ce93d8',
  empyrean:              '#f48fb1',
  true_divinity:         '#80deea',
  beyond_divinity:       '#ffe082',
}

function realmDisplay(raw: string) {
  return REALM_NAMES[(SERVER_TO_GAME_REALM[raw] ?? raw) as Realm] ?? raw
}
function stageDisplay(raw: string) {
  return STAGE_NAMES[(SERVER_TO_GAME_STAGE[raw] ?? raw) as RealmStage] ?? raw
}

export function LegendCard({ legend: l, rank }: Props) {
  const realmKey   = SERVER_TO_GAME_REALM[l.realm] ?? l.realm
  const realmColor = REALM_COLORS[realmKey] ?? '#c8b89a'
  const bornDate   = new Date(l.born_at).toLocaleDateString('pt-BR')
  const diedDate   = new Date(l.died_at).toLocaleDateString('pt-BR')

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
            {realmDisplay(l.realm)} · {stageDisplay(l.realm_stage)}
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-600">Poder</div>
          <div className="text-slate-400">{Number(l.cultivation_power).toLocaleString()}</div>
        </div>
      </div>
      <div className="relative text-xs text-slate-600 border-t border-slate-700/40 pt-2 flex items-center gap-3">
        <span className="text-red-700/70">✦ {l.cause_of_death}</span>
        <span>{bornDate} → {diedDate}</span>
      </div>
    </div>
  )
}
