import type { Screen } from '../../types'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

interface ServiceCardProps {
  emoji: string
  title: string
  description: string
  badge?: string
  badgeColor?: string
  disabled?: boolean
  onClick: () => void
}

function ServiceCard({ emoji, title, description, badge, badgeColor = '#22c55e', disabled, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 bg-slate-900 border p-3.5 text-left transition-all group
        ${disabled
          ? 'border-slate-700 opacity-50 cursor-not-allowed'
          : 'border-slate-700 hover:border-teal-700 hover:bg-slate-800 cursor-pointer'}`}
    >
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={`font-cinzel tracking-wider text-sm transition-colors
          ${disabled ? 'text-slate-500' : 'text-amber-400 group-hover:text-teal-400'}`}>
          {title}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        {badge && (
          <div className="text-xs font-semibold mt-1" style={{ color: badgeColor }}>{badge}</div>
        )}
      </div>
    </button>
  )
}

interface Props {
  onNavigate: (screen: Screen) => void
  locationServices?: string[]
}

export function ServiceGrid({ onNavigate, locationServices }: Props) {
  const { hp, maxHp, gold, fullRestoreHp, spendGold, talentPoints } = usePlayerStore()

  const isHpFull      = hp >= maxHp
  const missingHp     = maxHp - hp
  const healCost      = isHpFull ? 0 : Math.max(3, Math.ceil(missingHp * 0.12))
  const canAffordHeal = gold >= healCost

  function handleHeal() {
    if (isHpFull || !canAffordHeal) return
    spendGold(healCost)
    fullRestoreHp()
    const char = useAuthStore.getState().activeCharacter
    if (char) {
      api.post(`/api/characters/${char.id}/heal`, { gold_spent: healCost })
        .catch(err => console.warn('[heal]', err))
    }
  }

  // Se locationServices for fornecido, filtra; se não, mostra tudo (modo legado)
  const has = (svc: string) => !locationServices || locationServices.includes(svc)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {/* Mapa — sempre visível */}
      <ServiceCard
        emoji="🗺️" title="Mapa do Mundo"
        description="Explore e viaje entre localizações"
        onClick={() => onNavigate('worldmap')}
      />

      {/* Descanso — meditation */}
      {has('meditation') && (
        <ServiceCard
          emoji="🏕️" title="Descanso"
          description={isHpFull ? 'HP completamente restaurado.' : `Restaurar HP completo · ${healCost.toLocaleString('pt-BR')} 🪙`}
          badge={
            isHpFull        ? 'HP cheio'
            : canAffordHeal ? `Restaurar por ${healCost.toLocaleString('pt-BR')} 🪙`
            : 'Ouro insuficiente'
          }
          badgeColor={isHpFull ? '#22c55e' : canAffordHeal ? '#f59e0b' : '#ef4444'}
          disabled={isHpFull || !canAffordHeal}
          onClick={handleHeal}
        />
      )}

      {/* Meditação */}
      {has('meditation') && (
        <ServiceCard emoji="🧘" title="Meditação" description="Cultivar Qi passivamente" onClick={() => onNavigate('meditation')} />
      )}

      {/* Talentos */}
      {has('talents') && (
        <ServiceCard
          emoji="🌟" title="Talentos"
          description="Árvore de talentos passivos da sua classe"
          badge={talentPoints > 0 ? `${talentPoints} ponto${talentPoints > 1 ? 's' : ''} disponível${talentPoints > 1 ? 'is' : ''}` : undefined}
          badgeColor="#a78bfa"
          onClick={() => onNavigate('talents')}
        />
      )}

      {/* Inventário */}
      {has('inventory') && (
        <ServiceCard emoji="🎒" title="Inventário" description="Equipamentos e materiais" onClick={() => onNavigate('inventory')} />
      )}

      {/* Codex */}
      {has('codex') && (
        <ServiceCard emoji="📖" title="Codex" description="Bestas, equipamentos e reinos" onClick={() => onNavigate('codex')} />
      )}

      {/* Ranking */}
      {has('ranking') && (
        <ServiceCard emoji="🏆" title="Ranking" description="Hall dos cultivadores" onClick={() => onNavigate('ranking')} />
      )}

      {/* Skills */}
      {has('skills') && (
        <ServiceCard emoji="✦" title="Habilidades" description="Skills de forja, alquimia e inscrição" onClick={() => onNavigate('skills')} />
      )}

      {/* Forja & Crafting — só em cidades */}
      {has('crafting') && (
        <ServiceCard emoji="⚒️" title="Forja / Alquimia" description="Craft de armas e armaduras" onClick={() => onNavigate('crafting')} />
      )}

      {/* Ascensão — só em cidades */}
      {has('ascension') && (
        <ServiceCard emoji="✨" title="Ascensão" description="Aprimorar e ascender itens" onClick={() => onNavigate('forge')} />
      )}

      {/* Mercado — só em cidades */}
      {has('market') && (
        <ServiceCard emoji="🏪" title="Mercado" description="Compra e venda de itens" onClick={() => onNavigate('market')} />
      )}

      {/* Leis — só em cidades */}
      {has('laws') && (
        <ServiceCard emoji="⚖️" title="Leis do Universo" description="Compreensão das leis fundamentais" onClick={() => onNavigate('laws')} />
      )}

      {/* Treino — só em cidades */}
      {has('training') && (
        <ServiceCard emoji="🥊" title="Sala de Treino" description="Teste seu dano com o manequim infinito" onClick={() => onNavigate('training')} />
      )}

      {/* Changelog — sempre */}
      {has('changelog') && (
        <ServiceCard emoji="📜" title="Notas de Versão" description="Novidades e correções" onClick={() => onNavigate('changelog')} />
      )}
    </div>
  )
}
