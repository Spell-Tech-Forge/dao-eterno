import { usePlayerStore } from '../../store/playerStore'
import { useSkillsStore } from '../../store/skillsStore'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

const QI_POINTS = [
  { cy: 10,  color: '#c084fc', dur: '2.0s' },
  { cy: 30,  color: '#818cf8', dur: '1.8s' },
  { cy: 57,  color: '#60a5fa', dur: '2.2s' },
  { cy: 90,  color: '#4ade80', dur: '1.9s' },
  { cy: 120, color: '#facc15', dur: '2.1s' },
  { cy: 150, color: '#fb923c', dur: '1.7s' },
  { cy: 178, color: '#f87171', dur: '2.3s' },
]

function MeditationSilhouette({ fillPercent }: { fillPercent: number }) {
  const auraOpacity = 0.15 + Math.min(fillPercent, 1) * 0.35
  return (
    <svg viewBox="0 0 200 250" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="med-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="med-glow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="aura-bg" cx="50%" cy="55%" r="50%">
          <stop offset="0%"   stopColor="#a855f7" stopOpacity={auraOpacity} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="140" rx="92" ry="112" fill="url(#aura-bg)">
        <animate attributeName="rx" values="88;96;88" dur="3s" repeatCount="indefinite" />
        <animate attributeName="ry" values="108;116;108" dur="3s" repeatCount="indefinite" />
      </ellipse>

      <g fill="#1e1b3a">
        <circle cx="100" cy="32" r="21" />
        <rect x="92" y="51" width="16" height="15" rx="4" />
        <path d="M78 67 C62 82,42 112,28 144 C20 162,18 176,22 184 C29 188,40 184,46 175 C52 160,62 136,74 112 C82 96,90 80,94 68 Z" />
        <path d="M122 67 C138 82,158 112,172 144 C180 162,182 176,178 184 C171 188,160 184,154 175 C148 160,138 136,126 112 C118 96,110 80,106 68 Z" />
        <path d="M90 65 C86 82,82 102,80 122 C78 138,80 154,84 168 L116 168 C120 154,122 138,120 122 C118 102,114 82,110 65 Z" />
        <path d="M22 184 C16 202,24 220,40 230 C58 240,78 244,100 244 C122 244,142 240,160 230 C176 220,184 202,178 184 C171 188,160 184,154 175 C144 186,128 194,114 198 L100 200 L86 198 C72 194,56 186,46 175 C40 184,29 188,22 184 Z" />
      </g>

      <line x1="100" y1="10" x2="100" y2="178" stroke="#a855f7" strokeWidth="1" opacity="0.25" strokeDasharray="4 4">
        <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2s" repeatCount="indefinite" />
      </line>

      {QI_POINTS.map(({ cy, color, dur }, i) => (
        <g key={i}>
          <circle cx="100" cy={cy} r="11" fill={color} opacity="0.18" filter="url(#med-glow)">
            <animate attributeName="r"       values="9;14;9"         dur={dur} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.28;0.12" dur={dur} repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy={cy} r="5" fill={color} opacity="0.95" filter="url(#med-glow-sm)">
            <animate attributeName="opacity" values="0.75;1;0.75" dur={dur} repeatCount="indefinite" />
            <animate attributeName="r"       values="4.5;6;4.5"   dur={dur} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  )
}

interface Props { onBack: () => void }

export function MeditationScreen({ onBack }: Props) {
  const { qi, maxQi, realm, realmStage, totalQiAccumulated } = usePlayerStore()
  const meditationSkill = useSkillsStore((s) => s.skills.find((sk) => sk.id === 'meditation'))
  const setActive = useSkillsStore((s) => s.setActive)

  const fillPercent = qi / maxQi
  const qiPct = Math.min(100, fillPercent * 100)
  const isActive = meditationSkill?.active ?? false
  const qiFull = qi >= maxQi

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text flex-1">Meditação</h1>
        <span className="text-xs text-muted">{REALM_NAMES[realm]} · {STAGE_NAMES[realmStage]}</span>
      </div>

      {/* Skill card — em cima */}
      {meditationSkill && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧘</span>
              <div>
                <div className="font-bold text-text">{meditationSkill.name}</div>
                <div className="text-xs text-muted">{meditationSkill.description}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActive('meditation')}
            className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-all ${
              isActive
                ? 'bg-danger/10 border-danger text-danger hover:bg-danger/20'
                : 'bg-jade/20 border-jade text-jade hover:bg-jade/30'
            }`}
          >
            {isActive ? '⏸ Pausar meditação' : '▶ Iniciar meditação'}
          </button>
        </div>
      )}

      {/* Silhouette */}
      <div className="flex justify-center">
        <div className="w-56 h-64 sm:w-64 sm:h-72">
          <MeditationSilhouette fillPercent={fillPercent} />
        </div>
      </div>

      {/* Qi bar — embaixo */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: qiFull ? '#f59e0b' : '#a855f7' }}>
            Qi Espiritual {qiFull && '⚡'}
          </span>
          <span className="text-xs text-muted tabular-nums">
            {qi.toLocaleString()} / {maxQi.toLocaleString()}
          </span>
        </div>

        <div className="h-4 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${qiPct}%`,
              backgroundColor: qiFull ? '#f59e0b' : '#a855f7',
              boxShadow: qiFull ? '0 0 12px #f59e0b88' : '0 0 6px #a855f755',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {qiFull ? (
              <span className="text-gold font-semibold">Qi no limite</span>
            ) : isActive ? (
              <span className="text-jade">🧘 Meditando · +3 Qi/seg</span>
            ) : (
              <span className="text-danger">⏸ Meditação pausada</span>
            )}
          </span>
          <span>Acumulado: <span className="text-gold">{totalQiAccumulated.toLocaleString()}</span> Qi</span>
        </div>
      </div>

      {qiFull && (
        <div className="rounded-xl border border-gold/50 bg-gold/5 p-3 text-center text-sm text-gold font-semibold">
          ⚡ Qi no limite — volte ao hub para romper!
        </div>
      )}
    </div>
  )
}
