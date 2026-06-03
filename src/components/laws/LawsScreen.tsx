import { useState } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import type { LawDefinition, LawLevel } from '../../types'
import { isAtLeast } from '../../utils/cultivation'

const LAW_LEVEL_NAMES: Record<LawLevel, string> = {
  none:     'Nenhuma',
  fragment: 'Fragmento',
  initial:  'Inicial',
  middle:   'Médio',
  advanced: 'Avançado',
  complete: 'Completo',
}
const LAW_LEVEL_ORDER: LawLevel[] = ['none','fragment','initial','middle','advanced','complete']

const LAW_LEVEL_COLOR: Record<LawLevel, string> = {
  none:     '#334155',
  fragment: '#94a3b8',
  initial:  '#4ade80',
  middle:   '#60a5fa',
  advanced: '#a78bfa',
  complete: '#fbbf24',
}

interface Props { onBack: () => void }

export function LawsScreen({ onBack }: Props) {
  const { laws, realm, realmStage } = usePlayerStore()
  const { items } = useInventoryStore()
  const lawDefs = useGameDataStore(s => s.laws)
  const itemDefs = useGameDataStore(s => s.items)
  const [studying, setStudying] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function handleStudy(law: LawDefinition) {
    const char = useAuthStore.getState().activeCharacter
    if (!char) return
    setStudying(law.id)
    setMsg('')
    try {
      const res = await api.post<{ laws: Record<string, string>; level: string; consumed: number }>(
        `/api/characters/${char.id}/laws/study`,
        { lawId: law.id }
      )
      usePlayerStore.setState({ laws: res.laws })
      setMsg(`${law.emoji} ${law.name}: avançou para ${LAW_LEVEL_NAMES[res.level as LawLevel]}! (${res.consumed} fragmento${res.consumed > 1 ? 's' : ''} consumido${res.consumed > 1 ? 's' : ''})`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao estudar lei.')
    } finally {
      setStudying(null)
    }
  }

  function getNextLevel(current: LawLevel): LawLevel | null {
    const idx = LAW_LEVEL_ORDER.indexOf(current)
    if (idx === -1 || idx >= LAW_LEVEL_ORDER.length - 1) return null
    return LAW_LEVEL_ORDER[idx + 1]
  }

  function getFragmentCount(law: LawDefinition): number {
    if (!law.fragmentItemId) return 0
    return items.find(i => i.definitionId === law.fragmentItemId)?.quantity ?? 0
  }

  function getFragmentCost(law: LawDefinition, nextLevel: LawLevel): number {
    if (nextLevel === 'fragment') return 1
    if (nextLevel === 'initial')  return law.fragmentsToInitial
    if (nextLevel === 'middle')   return law.fragmentsToMiddle
    if (nextLevel === 'advanced') return law.fragmentsToAdvanced
    if (nextLevel === 'complete') return law.fragmentsToComplete
    return 0
  }

  function getRealmReq(law: LawDefinition, nextLevel: LawLevel): string {
    if (nextLevel === 'fragment') return 'body_tempering'
    if (nextLevel === 'initial')  return law.minRealmInitial
    if (nextLevel === 'middle')   return law.minRealmMiddle
    if (nextLevel === 'advanced') return law.minRealmAdvanced
    if (nextLevel === 'complete') return law.minRealmComplete
    return 'body_tempering'
  }

  function canStudy(law: LawDefinition, nextLevel: LawLevel): boolean {
    const cost = getFragmentCost(law, nextLevel)
    if (getFragmentCount(law) < cost) return false
    const reqRealm = getRealmReq(law, nextLevel)
    return isAtLeast(realm, realmStage, reqRealm, 'initial')
  }

  function formatBonus(bonus: Record<string, number>): string {
    return Object.entries(bonus)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => {
        const label = k === 'atk_pct' ? 'ATK' : k === 'def_pct' ? 'DEF' : k === 'hp_pct' ? 'HP' : k === 'crit_pct' ? 'CRIT' : k === 'speed_pct' ? 'Vel' : k === 'qi_rate_pct' ? 'Qi/s' : k
        return `+${v}% ${label}`
      }).join('  ')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}
            className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            ← Voltar
          </button>
          <h1 className="font-cinzel text-lg tracking-widest uppercase text-amber-400">Leis do Universo</h1>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          As Leis governam a realidade. Compreendê-las transcende o cultivo comum e fortalece permanentemente
          o cultivador. Estude fragmentos de cada Lei para avançar sua compreensão.
        </p>

        {msg && (
          <div className="mb-4 p-3 border border-teal-900/60 bg-teal-950/20 text-sm text-teal-300">
            {msg}
          </div>
        )}

        <div className="space-y-4">
          {lawDefs.map(law => {
            const currentLevel = (laws[law.id] as LawLevel) ?? 'none'
            const nextLevel    = getNextLevel(currentLevel)
            const fragmentQty  = getFragmentCount(law)
            const fragDef      = law.fragmentItemId ? itemDefs[law.fragmentItemId] : null
            const isStudying   = studying === law.id
            const isComplete   = currentLevel === 'complete'
            const color        = LAW_LEVEL_COLOR[currentLevel]

            const nextCost  = nextLevel ? getFragmentCost(law, nextLevel) : 0
            const nextRealmReq = nextLevel ? getRealmReq(law, nextLevel) : ''
            const canAdvance = nextLevel ? canStudy(law, nextLevel) : false

            return (
              <div key={law.id}
                className="border bg-slate-900/40 p-4"
                style={{ borderColor: currentLevel !== 'none' ? color + '55' : '#1e293b' }}>

                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0">{law.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-cinzel text-sm font-medium text-slate-200">{law.name}</span>
                      {law.affinity && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400">{law.affinity}</span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-sm"
                        style={{ backgroundColor: color + '22', color }}>
                        {LAW_LEVEL_NAMES[currentLevel]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{law.description}</p>

                    {/* Bônus atual */}
                    {currentLevel !== 'none' && (
                      <p className="text-xs text-teal-400 mb-2">
                        Bônus atual: {formatBonus(
                          currentLevel === 'fragment' ? law.bonusFragment :
                          currentLevel === 'initial'  ? law.bonusInitial  :
                          currentLevel === 'middle'   ? law.bonusMiddle   :
                          currentLevel === 'advanced' ? law.bonusAdvanced :
                          law.bonusComplete
                        )}
                      </p>
                    )}

                    {/* Próximo nível */}
                    {nextLevel && (
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        <span className="text-slate-500">
                          Próximo: <span className="text-slate-300">{LAW_LEVEL_NAMES[nextLevel]}</span>
                          {' '}→ {formatBonus(
                            nextLevel === 'fragment' ? law.bonusFragment :
                            nextLevel === 'initial'  ? law.bonusInitial  :
                            nextLevel === 'middle'   ? law.bonusMiddle   :
                            nextLevel === 'advanced' ? law.bonusAdvanced :
                            law.bonusComplete
                          )}
                        </span>
                        {fragDef && (
                          <span className="text-slate-500">
                            {fragDef.emoji} {fragDef.name}: <span style={{ color: fragmentQty >= nextCost ? '#4ade80' : '#ef4444' }}>{fragmentQty}/{nextCost}</span>
                          </span>
                        )}
                        {!isAtLeast(realm, realmStage, nextRealmReq, 'initial') && (
                          <span className="text-amber-600 text-[10px]">Requer: {nextRealmReq}</span>
                        )}
                      </div>
                    )}

                    {isComplete && (
                      <p className="text-xs text-amber-400 mt-1">Lei completamente dominada.</p>
                    )}
                  </div>

                  {/* Botão estudar */}
                  {nextLevel && (
                    <button
                      onClick={() => handleStudy(law)}
                      disabled={!canAdvance || !!isStudying}
                      className="shrink-0 px-3 py-1.5 text-xs border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={canAdvance ? {
                        borderColor: color, color, backgroundColor: color + '11',
                      } : { borderColor: '#334155', color: '#475569' }}>
                      {isStudying ? '...' : 'Estudar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {lawDefs.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">
              Nenhuma Lei disponível. Importe as leis no painel admin.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
