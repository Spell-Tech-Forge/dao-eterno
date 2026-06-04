import { useState } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useSkillsStore } from '../../store/skillsStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useEffectiveStats } from '../../hooks/useEffectiveStats'
import { useBattleHistoryStore, type BattleRun } from '../../store/battleHistoryStore'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { Realm, RealmStage } from '../../types'
import { skillLevelToTier, TIER_NAMES } from '../../utils/skillTiers'
import { Modal } from '../ui/Modal'

type Tab = 'stats' | 'history'

function StatRow({ emoji, label, value, detail }: { emoji: string; label: string; value: string | number; detail?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-800/60">
      <span className="w-5 text-center text-sm">{emoji}</span>
      <span className="flex-1 text-xs text-slate-400">{label}</span>
      <span className="text-xs font-bold text-slate-200 tabular-nums">{value}</span>
      {detail && <span className="text-[10px] text-slate-600">{detail}</span>}
    </div>
  )
}

function RunAccordion({ run }: { run: BattleRun }) {
  const [open, setOpen] = useState(false)
  const duration = run.endedAt
    ? Math.round((run.endedAt - run.startedAt) / 1000)
    : Math.round((Date.now() - run.startedAt) / 1000)
  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="border border-slate-700/60 bg-slate-900/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-sm" style={{ color: run.accentColor }}>{run.biomeName}</span>
        <div className="flex-1 flex items-center gap-3 text-[10px] text-slate-500">
          <span>⚔️ {run.totalKills} kills</span>
          <span>🔮 {run.totalQi.toLocaleString()} Qi</span>
          <span>🪙 {run.totalGold.toLocaleString()}</span>
          <span>⏱ {timeStr}</span>
          {!run.endedAt && <span className="text-teal-500 font-bold">● em andamento</span>}
        </div>
        <span className="text-slate-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-800 max-h-56 overflow-y-auto">
          {run.kills.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-3">Nenhum kill registrado ainda.</p>
          ) : (
            [...run.kills].reverse().map((k, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 border-b border-slate-800/40 text-xs">
                <span className="text-base shrink-0">{k.monsterEmoji}</span>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold ${k.isBoss ? 'text-amber-400' : k.isElite ? 'text-purple-400' : 'text-slate-300'}`}>
                    {k.monsterName}
                    {k.isBoss && ' [BOSS]'}
                    {k.isElite && ' [ELITE]'}
                  </span>
                  {k.drops.length > 0 && (
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      📦 {k.drops.map(d => `${d.emoji} ${d.name} ×${d.quantity}`).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-purple-400">+{k.qiGained} Qi</div>
                  <div className="text-amber-400">+{k.goldGained} 🪙</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CharacterSheet({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stats')

  const { name, hp, maxHp, qi, maxQi, realm, realmStage, attributes, luck, totalQiAccumulated, totalKills, classId, talentPoints, unlockedTalents } = usePlayerStore()
  const classes   = useGameDataStore(s => s.classes)
  const skills    = useSkillsStore(s => s.skills)
  const craftXpCfg = useGameDataStore(s => s.craftXpConfig)
  const tierLevels = craftXpCfg?.tierLevels
  const stats     = useEffectiveStats()
  const runs      = useBattleHistoryStore(s => s.runs)
  const clearAll  = useBattleHistoryStore(s => s.clearAll)

  const playerClass = classes.find(c => c.id === classId)

  const unlockedCount = Object.keys(unlockedTalents).filter(id => (unlockedTalents[id] ?? 0) > 0).length

  const craftSkills = skills.filter(s => ['forging','alchemy','inscription'].includes(s.id))

  const realmLabel = REALM_NAMES[realm as Realm] ?? realm
  const stageLabel = STAGE_NAMES[realmStage as RealmStage] ?? realmStage

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ficha do Personagem" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-slate-700 -mx-1 mb-4">
        {(['stats', 'history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider transition-colors border-b-2 -mb-px ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'stats' ? '📋 Stats' : '⚔️ Histórico'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border border-slate-700 bg-slate-900/60">
            <span className="text-4xl">{playerClass?.emoji ?? '🧙'}</span>
            <div className="flex-1">
              <p className="font-cinzel font-bold text-lg text-slate-200">{name}</p>
              <p className="text-xs mt-0.5" style={{ color: playerClass?.color ?? '#94a3b8' }}>
                {playerClass?.name ?? '—'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{realmLabel} — {stageLabel}</p>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="text-slate-400">❤️ {hp} / {maxHp}</div>
              <div className="text-purple-400">🔮 {qi.toLocaleString()} / {maxQi.toLocaleString()}</div>
            </div>
          </div>

          {/* Atributos base */}
          <div>
            <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">Atributos</p>
            <StatRow emoji="⚡" label="Força"      value={attributes.strength}   detail={`→ +${stats.effectiveAtk} ATK`} />
            <StatRow emoji="💨" label="Agilidade"  value={attributes.agility}    detail={`→ ${stats.effectiveSpeed.toFixed(2)}s/atk`} />
            <StatRow emoji="❤️" label="Vitalidade" value={attributes.vitality}   detail={`→ ${stats.effectiveMaxHp} HP máx`} />
            <StatRow emoji="🛡️" label="Defesa"     value={attributes.defense}    detail={`→ ${stats.effectiveDef} red. dano`} />
            <StatRow emoji="👁️" label="Percepção"  value={attributes.perception} detail={`→ +${stats.effectiveCrit}% crit dano`} />
            <StatRow emoji="🍀" label="Sorte"       value={luck}                  detail={`→ ${stats.effectiveCritChance.toFixed(1)}% chance crit`} />
          </div>

          {/* Stats de combate */}
          <div>
            <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">Combat Stats</p>
            <StatRow emoji="⚔️" label="ATK efetivo"     value={stats.effectiveAtk} />
            <StatRow emoji="🛡️" label="DEF efetiva"      value={stats.effectiveDef} />
            <StatRow emoji="❤️" label="HP máximo"        value={stats.effectiveMaxHp} />
            <StatRow emoji="⏱"  label="Velocidade"       value={`${stats.effectiveSpeed.toFixed(2)}s`} />
            <StatRow emoji="💥" label="Dano Crit"        value={`+${stats.effectiveCrit}%`} />
            <StatRow emoji="🎯" label="Chance Crit"      value={`${stats.effectiveCritChance.toFixed(1)}%`} />
            <StatRow emoji="📊" label="DPS estimado"     value={stats.effectiveDps} />
          </div>

          {/* Bônus de talentos */}
          {(() => {
            const tb = stats.talentBonus
            const list = [
              tb.atkPct     > 0 && `⚡ +${tb.atkPct}% ATK`,
              tb.defPct     > 0 && `🛡️ +${tb.defPct}% DEF`,
              tb.hpPct      > 0 && `❤️ +${tb.hpPct}% HP`,
              tb.critFlat   > 0 && `💥 +${tb.critFlat}% Crit`,
              tb.speedPct   > 0 && `💨 +${tb.speedPct}% Vel`,
              tb.qiRatePct  > 0 && `🌀 +${tb.qiRatePct}% Qi/s`,
              tb.luckFlat   > 0 && `🍀 +${tb.luckFlat} Sorte`,
            ].filter(Boolean) as string[]
            if (!list.length) return null
            return (
              <div>
                <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">
                  Talentos ({unlockedCount} nós)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map(b => (
                    <span key={b} className="text-[11px] px-2 py-0.5 border border-violet-800/40 bg-violet-950/20 text-violet-300">{b}</span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Skills */}
          <div>
            <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">Skills de Crafting</p>
            {craftSkills.map(s => {
              const tier = skillLevelToTier(s.level, tierLevels)
              const label = s.id === 'forging' ? '⚒️ Forja' : s.id === 'alchemy' ? '⚗️ Alquimia' : '✍️ Inscrição'
              return (
                <StatRow key={s.id} emoji="" label={label} value={`Nv.${s.level}`} detail={TIER_NAMES[tier] ?? `T${tier}`} />
              )
            })}
          </div>

          {/* Meta */}
          <div>
            <p className="text-[10px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">Progresso</p>
            <StatRow emoji="⚔️" label="Total de kills"     value={totalKills.toLocaleString()} />
            <StatRow emoji="🔮" label="Qi acumulado total" value={Number(totalQiAccumulated).toLocaleString()} />
            <StatRow emoji="🌟" label="Pontos de talento"  value={talentPoints} />
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">{runs.length} run{runs.length !== 1 ? 's' : ''} registrada{runs.length !== 1 ? 's' : ''}</p>
            {runs.length > 0 && (
              <button onClick={() => { if (confirm('Limpar histórico de batalha?')) clearAll() }}
                className="text-[10px] text-red-500/60 hover:text-red-400 border border-red-900/40 px-2 py-0.5 transition-colors">
                Limpar
              </button>
            )}
          </div>

          {runs.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">
              <div className="text-3xl mb-2 opacity-20">⚔️</div>
              <p>Nenhuma batalha registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {runs.map(run => (
                <RunAccordion key={run.id} run={run} />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
