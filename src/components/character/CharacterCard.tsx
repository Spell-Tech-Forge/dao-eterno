import type { ServerCharacter } from '../../types/server'
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

export function CharacterCard({ character: c, onPlay, onDelete }: Props) {
  const realmColor = REALM_COLORS[c.realm] ?? '#c8b89a'

  const confirmDelete = () => {
    if (window.confirm(`Abandonar "${c.name}" permanentemente?`)) onDelete(c.id)
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 p-5 hover:border-slate-500 transition-colors flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-slate-200 text-sm tracking-wider">{c.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: realmColor }}>
            {c.realm} · {c.realm_stage}
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">Poder</div>
          <div className="text-amber-400">{c.cultivation_power.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
        <Stat label="HP" value={`${c.hp_current}/${c.hp_max}`} color="#c62828" />
        <Stat label="Qi" value={`${c.qi_current}/${c.qi_max}`} color="#5c6bc0" />
        <Stat label="Afinidade" value={c.affinity} />
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
