import { CHANGELOG, type ChangeType } from '../../data/changelog'

interface Props { onBack: () => void }

const TYPE_META: Record<ChangeType, { label: string; color: string; bg: string }> = {
  feature: { label: 'Novidade',      color: '#4ade80', bg: 'rgba(74,222,128,0.08)'  },
  fix:     { label: 'Correção',      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
  balance: { label: 'Balanceamento', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  content: { label: 'Conteúdo',      color: '#a855f7', bg: 'rgba(168,85,247,0.08)'  },
  system:  { label: 'Sistema',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${d} ${months[parseInt(m) - 1]} ${y}`
}

export function PatchNotesScreen({ onBack }: Props) {
  const latest = CHANGELOG[0]?.version

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">
            Notas de Atualização
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico de mudanças do Dao Eterno
          </p>
        </div>
        <span className="text-xs text-amber-400 border border-amber-700/40 px-2 py-1 font-cinzel">
          v{latest}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {CHANGELOG.map((note, idx) => {
          const meta    = TYPE_META[note.type]
          const isNew   = idx === 0

          return (
            <div
              key={note.version}
              className="border bg-slate-900 overflow-hidden"
              style={{ borderColor: isNew ? meta.color + '55' : '#334155' }}
            >
              {/* Card header */}
              <div
                className="px-5 py-3 flex items-center gap-3 border-b border-slate-800"
                style={{ backgroundColor: isNew ? meta.bg : undefined }}
              >
                {/* Versão */}
                <span
                  className="font-cinzel font-bold text-base tracking-wider shrink-0"
                  style={{ color: isNew ? meta.color : '#94a3b8' }}
                >
                  v{note.version}
                </span>

                {/* Divider */}
                <span className="text-slate-700">·</span>

                {/* Tipo */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 border uppercase tracking-widest shrink-0"
                  style={{
                    color:           meta.color,
                    borderColor:     meta.color + '55',
                    backgroundColor: meta.bg,
                  }}
                >
                  {meta.label}
                </span>

                {/* Título */}
                <span className="font-semibold text-sm text-slate-200 flex-1 min-w-0 truncate">
                  {note.title}
                </span>

                {/* Novo badge */}
                {isNew && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 border shrink-0 animate-pulse"
                    style={{ color: meta.color, borderColor: meta.color + '66', backgroundColor: meta.bg }}
                  >
                    NOVO
                  </span>
                )}

                {/* Data */}
                <span className="text-xs text-slate-600 shrink-0 tabular-nums">
                  {formatDate(note.date)}
                </span>
              </div>

              {/* Lista de mudanças */}
              <ul className="px-5 py-3 space-y-1.5">
                {note.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-700 pt-2 pb-6 font-cinzel tracking-widest">
        ✦ O Dao Eterno — todos os registros ✦
      </div>
    </div>
  )
}
