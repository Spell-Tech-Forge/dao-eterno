import type { ServerCharacter } from '../../types/server'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE } from '../../types/server'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { Realm, RealmStage } from '../../types'
import { Button } from '../ui/Button'

interface Props {
  character: ServerCharacter
  onPlay: (c: ServerCharacter) => void
  onDelete: (id: number) => void
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

function realmDisplay(raw: string) { return REALM_NAMES[(SERVER_TO_GAME_REALM[raw] ?? raw) as Realm] ?? raw }
function stageDisplay(raw: string) { return STAGE_NAMES[(SERVER_TO_GAME_STAGE[raw] ?? raw) as RealmStage] ?? raw }

export function CharacterCard({ character: c, onPlay, onDelete }: Props) {
  const displayRealm = realmDisplay(c.realm)
  const realmColor   = REALM_COLORS[displayRealm] ?? '#c8b89a'

  const confirmDelete = () => {
    if (window.confirm(`Abandonar "${c.name}" permanentemente?`)) onDelete(c.id)
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 p-5 hover:border-slate-500 transition-colors flex flex-col gap-4">
      <div>
        <h3 className="text-slate-200 text-sm tracking-wider">{c.name}</h3>
        <p className="text-xs mt-0.5" style={{ color: realmColor }}>
          {displayRealm} · {stageDisplay(c.realm_stage)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
        <Stat label="HP" value={`${c.hp_current}/${c.hp_max}`} color="#c62828" />
        <Stat label="Qi" value={`${c.qi_current}/${c.qi_max}`} color="#5c6bc0" />
        <Stat label="Ouro Esp." value={c.spirit_gold.toLocaleString()} color="#d4a84b" />
      </div>

      <div className="flex gap-2">
        <Button variant="gold" size="sm" className="flex-1" onClick={() => onPlay(c)}>
          Cultivar
        </Button>
        <Button variant="danger" size="sm" onClick={confirmDelete} title="Abandonar personagem">
          ✕
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span style={color ? { color } : undefined} className={color ? '' : 'text-slate-400'}>
        {value}
      </span>
    </div>
  )
}
