import { useState, useMemo } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { normalizeUnlockedTalents } from '../../utils/talents'
import type { TalentNode, Realm, RealmStage } from '../../types'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import { REALM_ORDER, getStagesForRealm, isAtLeast } from '../../utils/cultivation'

const EFFECT_LABELS: Record<string, string> = {
  atk_pct:      '⚔️ ATK',
  def_pct:      '🛡️ DEF',
  hp_pct:       '❤️ HP',
  crit_pct:     '💥 CRIT',
  speed_pct:    '⚡ Velocidade',
  qi_rate_pct:  '🌀 Qi/s',
  luck_flat:    '🍀 Sorte',
  drop_rate_pct:'✨ Drop',
}

function formatEffect(node: TalentNode, level = 1): string {
  const label = EFFECT_LABELS[node.effectType] ?? node.effectType
  const value = node.effectValue * level
  const sign  = value >= 0 ? '+' : ''
  const suffix = node.effectType.endsWith('_pct') ? '%' : ''
  return `${label} ${sign}${value}${suffix}`
}

// Custo para desbloquear o próximo nível: multi-nível usa 2N-1, nível único usa pointCost fixo
function nextLevelCost(node: TalentNode, currentLevel: number): number {
  const maxLevel = node.maxLevel ?? 1
  if (maxLevel <= 1) return node.pointCost
  return 2 * (currentLevel + 1) - 1
}

type NodeStatus = 'maxed' | 'unlocked' | 'available' | 'prereq_missing' | 'realm_missing' | 'no_points'

function getNodeStatus(
  node: TalentNode,
  unlockedTalents: Record<string, number>,
  talentPoints: number,
  playerRealm: Realm,
  playerStage: RealmStage,
): NodeStatus {
  const currentLevel = unlockedTalents[node.id] ?? 0
  const maxLevel = node.maxLevel ?? 1

  if (currentLevel >= maxLevel) return 'maxed'

  const realmOk = isAtLeast(playerRealm, playerStage, node.requiredRealm, node.requiredStage)
  if (!realmOk) return 'realm_missing'

  if (node.requiredNodeId && !(unlockedTalents[node.requiredNodeId] ?? 0 >= 1)) return 'prereq_missing'
  const cost = nextLevelCost(node, currentLevel)
  if (talentPoints < cost) return 'no_points'
  if (currentLevel > 0) return 'unlocked' // tem nível, pode evoluir
  return 'available'
}

interface Props { onBack: () => void }

export function TalentsScreen({ onBack }: Props) {
  const { talentPoints, unlockedTalents, classId, realm, realmStage } = usePlayerStore()
  const classes     = useGameDataStore(s => s.classes)
  const talentNodes = useGameDataStore(s => s.talentNodes)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [error, setError]         = useState('')

  const playerClass = classes.find(c => c.id === classId)

  const classNodes = useMemo(
    () => Object.values(talentNodes)
      .filter(n => n.classId === classId)
      .sort((a, b) => {
        const ra = REALM_ORDER.indexOf(a.requiredRealm as Realm), rb = REALM_ORDER.indexOf(b.requiredRealm as Realm)
        if (ra !== rb) return ra - rb
        const sa = getStagesForRealm(a.requiredRealm).indexOf(a.requiredStage as RealmStage)
        const sb = getStagesForRealm(b.requiredRealm).indexOf(b.requiredStage as RealmStage)
        return sa - sb
      }),
    [talentNodes, classId]
  )

  const unlockedCount  = classNodes.filter(n => (unlockedTalents[n.id] ?? 0) > 0).length
  const availableCount = classNodes.filter(n => {
    const s = getNodeStatus(n, unlockedTalents, talentPoints, realm, realmStage)
    return s === 'available' || s === 'unlocked'
  }).length

  async function handleUnlock(node: TalentNode) {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setUnlocking(node.id)
    setError('')
    try {
      const res = await api.post<{ talent_points: number; unlocked_talents: unknown }>(
        `/api/characters/${char.id}/talents/unlock`,
        { nodeId: node.id }
      )
      usePlayerStore.setState({
        talentPoints:    res.talent_points,
        unlockedTalents: normalizeUnlockedTalents(res.unlocked_talents),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear talento.')
    } finally {
      setUnlocking(null)
    }
  }

  const byRealm = useMemo(() => {
    const groups: Record<string, TalentNode[]> = {}
    for (const node of classNodes) {
      const key = node.requiredRealm
      if (!groups[key]) groups[key] = []
      groups[key].push(node)
    }
    return groups
  }, [classNodes])

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 py-3 border-b border-slate-800 bg-slate-900 mb-6">
          <button onClick={onBack}
            className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            ← Voltar
          </button>
          <h1 className="font-cinzel text-lg tracking-widest uppercase text-amber-400">Talentos</h1>
        </div>

        {/* Info da classe */}
        {playerClass ? (
          <div className="border border-slate-700 bg-slate-900 p-4 mb-6 flex items-start gap-4">
            <span className="text-4xl">{playerClass.emoji}</span>
            <div className="flex-1">
              <p className="font-cinzel tracking-wider text-base" style={{ color: playerClass.color }}>
                {playerClass.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">{playerClass.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold" style={{ color: talentPoints > 0 ? '#a78bfa' : '#475569' }}>
                {talentPoints}
              </p>
              <p className="text-xs text-slate-500">pontos</p>
              <p className="text-xs text-slate-500 mt-1">{unlockedCount}/{classNodes.length} nós</p>
            </div>
          </div>
        ) : (
          <div className="border border-slate-700 bg-slate-900 p-6 mb-6 text-center text-slate-500 text-sm">
            Nenhuma classe associada a este personagem.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 border border-red-900/60 bg-red-950/30 text-sm text-red-400">{error}</div>
        )}

        {availableCount > 0 && talentPoints > 0 && (
          <div className="mb-4 p-3 border border-purple-800/50 bg-purple-950/20 text-sm text-purple-300">
            {availableCount} talento{availableCount > 1 ? 's' : ''} disponível{availableCount > 1 ? 'is' : ''} para evoluir
          </div>
        )}

        {/* Árvore por reino */}
        <div className="space-y-6">
          {REALM_ORDER.map(realmKey => {
            const nodes = byRealm[realmKey]
            if (!nodes?.length) return null

            const realmIdx    = REALM_ORDER.indexOf(realmKey)
            const playerRealm = REALM_ORDER.indexOf(realm)
            const realmPassed = playerRealm > realmIdx
            const realmActive = playerRealm === realmIdx

            return (
              <div key={realmKey}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-px flex-1 ${realmPassed ? 'bg-gradient-to-r from-teal-800/60 to-transparent' : 'bg-gradient-to-r from-slate-700/60 to-transparent'}`} />
                  <span className={`text-xs font-cinzel tracking-widest uppercase px-2 ${
                    realmActive ? 'text-teal-400' : realmPassed ? 'text-slate-500' : 'text-slate-700'
                  }`}>
                    {REALM_NAMES[realmKey as Realm]}
                  </span>
                  <div className={`h-px flex-1 ${realmPassed ? 'bg-gradient-to-l from-teal-800/60 to-transparent' : 'bg-gradient-to-l from-slate-700/60 to-transparent'}`} />
                </div>

                <div className="space-y-2">
                  {[...nodes]
                    .sort((a, b) => getStagesForRealm(realmKey).indexOf(a.requiredStage as RealmStage) - getStagesForRealm(realmKey).indexOf(b.requiredStage as RealmStage))
                    .map(node => {
                      const status = getNodeStatus(node, unlockedTalents, talentPoints, realm, realmStage)
                      const isUnlocking = unlocking === node.id
                      const currentLevel = unlockedTalents[node.id] ?? 0
                      const maxLevel = node.maxLevel ?? 1
                      const isMultiLevel = maxLevel > 1
                      const cost = nextLevelCost(node, currentLevel)

                      const borderColor = {
                        maxed:         '#14b8a6',
                        unlocked:      '#a78bfa',
                        available:     '#7c3aed',
                        prereq_missing:'#334155',
                        realm_missing: '#1e293b',
                        no_points:     '#334155',
                      }[status]

                      const canUpgrade = status === 'available' || status === 'unlocked'
                      const prereqNode = node.requiredNodeId ? talentNodes[node.requiredNodeId] : null

                      return (
                        <div
                          key={node.id}
                          className={`border p-3 transition-all bg-slate-900 ${status === 'realm_missing' ? 'opacity-40' : ''}`}
                          style={{ borderColor }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <div className="text-lg shrink-0 mt-0.5">
                              {status === 'maxed'         ? '✅' :
                               status === 'unlocked'      ? '⬆️' :
                               status === 'available'     ? '⬡' :
                               status === 'realm_missing' ? '🔒' :
                               status === 'prereq_missing'? '⛔' : '○'}
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${
                                  status === 'maxed'    ? 'text-teal-300' :
                                  canUpgrade           ? 'text-purple-300' : 'text-slate-400'
                                }`}>{node.name}</span>

                                {/* Indicador de nível */}
                                {isMultiLevel && (
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: maxLevel }).map((_, i) => (
                                      <div key={i} className="w-2.5 h-2.5 rounded-full border"
                                        style={{
                                          backgroundColor: i < currentLevel ? '#a78bfa' : 'transparent',
                                          borderColor: i < currentLevel ? '#a78bfa' : '#475569',
                                        }} />
                                    ))}
                                    <span className="text-[10px] text-slate-500 ml-0.5">{currentLevel}/{maxLevel}</span>
                                  </div>
                                )}

                                <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700">
                                  {STAGE_NAMES[node.requiredStage as RealmStage]}
                                </span>
                                {status === 'maxed' ? (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-950/60 border border-teal-700/60 font-bold text-teal-400 tracking-widest">
                                    MAX
                                  </span>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-800 border border-slate-700 font-bold"
                                    style={{ color: talentPoints >= cost ? '#a78bfa' : '#ef4444' }}>
                                    {cost} pt
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mt-0.5">{node.description}</p>

                              {/* Efeito atual e próximo nível */}
                              {isMultiLevel && currentLevel > 0 ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs font-semibold text-teal-400">
                                    Atual: {formatEffect(node, currentLevel)}
                                  </p>
                                  {currentLevel < maxLevel && (
                                    <p className="text-xs text-purple-400">
                                      → Nív. {currentLevel + 1}: {formatEffect(node, currentLevel + 1)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs font-semibold mt-1" style={{ color: status === 'maxed' ? '#14b8a6' : '#a78bfa' }}>
                                  {formatEffect(node, Math.max(1, currentLevel))}
                                  {isMultiLevel && currentLevel === 0 && maxLevel > 1 && (
                                    <span className="text-slate-500 ml-1">(até {formatEffect(node, maxLevel)} nív. {maxLevel})</span>
                                  )}
                                </p>
                              )}

                              {prereqNode && (
                                <p className="text-[10px] text-slate-600 mt-1">Requer: {prereqNode.name}</p>
                              )}
                              {status === 'realm_missing' && (
                                <p className="text-[10px] text-slate-600 mt-1">
                                  Requer {REALM_NAMES[node.requiredRealm as Realm]} — {STAGE_NAMES[node.requiredStage as RealmStage]}
                                </p>
                              )}
                            </div>

                            {/* Botão */}
                            {canUpgrade && (
                              <button
                                onClick={() => handleUnlock(node)}
                                disabled={!!isUnlocking || talentPoints < cost}
                                className="shrink-0 px-3 py-1.5 text-xs font-semibold border border-purple-600 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUnlocking ? '...' : currentLevel === 0 ? `Desbloquear (${cost}pt)` : `Evoluir (${cost}pt)`}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>

        {classNodes.length === 0 && playerClass && (
          <div className="text-center py-12 text-slate-600 text-sm">Nenhum talento disponível para esta classe.</div>
        )}
      </div>
    </div>
  )
}
