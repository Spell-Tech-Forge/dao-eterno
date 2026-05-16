import type { Screen } from '../../types'
import { usePlayerStore } from '../../store/playerStore'

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
      className={`flex items-center gap-3 bg-surface border rounded-xl p-3.5 text-left transition-all group
        ${disabled
          ? 'border-border opacity-50 cursor-not-allowed'
          : 'border-border hover:border-jade hover:bg-surface-2 cursor-pointer'}`}
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm transition-colors ${disabled ? 'text-muted' : 'text-gold group-hover:text-jade'}`}>
          {title}
        </div>
        <div className="text-xs text-muted mt-0.5">{description}</div>
        {badge && (
          <div className="text-xs font-semibold mt-1" style={{ color: badgeColor }}>{badge}</div>
        )}
      </div>
    </button>
  )
}

interface Props {
  onNavigate: (screen: Screen) => void
}

export function ServiceGrid({ onNavigate }: Props) {
  const { hp, maxHp, gold, fullRestoreHp, spendGold } = usePlayerStore()

  const isHpFull = hp >= maxHp
  const missingHp = maxHp - hp
  const healCost = isHpFull ? 0 : Math.max(3, Math.ceil(missingHp * 0.12))
  const canAffordHeal = gold >= healCost

  function handleHeal() {
    if (isHpFull || !canAffordHeal) return
    spendGold(healCost)
    fullRestoreHp()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Seita</h2>
        <span className="text-xs text-muted">Serviços e preparação</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ServiceCard
          emoji="🏠" title="Hospedagem"
          description={isHpFull ? 'Descanse e recupere seu HP completo.' : `Curar HP completo · ${healCost} 🪙`}
          badge={
            isHpFull ? 'HP cheio'
            : canAffordHeal ? `Curar por ${healCost} 🪙`
            : 'Ouro insuficiente'
          }
          badgeColor={isHpFull ? '#22c55e' : canAffordHeal ? '#f59e0b' : '#ef4444'}
          disabled={isHpFull || !canAffordHeal}
          onClick={handleHeal}
        />
        <ServiceCard
          emoji="🎒" title="Inventário"
          description="Equipamentos e materiais"
          onClick={() => onNavigate('inventory')}
        />
        <ServiceCard
          emoji="⚒️" title="Forja / Alquimia"
          description="Craft de armas e armaduras"
          onClick={() => onNavigate('crafting')}
        />
        <ServiceCard
          emoji="✨" title="Ascensão"
          description="Aprimorar e ascender itens"
          onClick={() => onNavigate('forge')}
        />
        <ServiceCard
          emoji="🏪" title="Mercado"
          description="Compra e venda de itens"
          onClick={() => onNavigate('market')}
        />
        <ServiceCard
          emoji="📖" title="Codex"
          description="Bestas, equipamentos e reinos"
          onClick={() => onNavigate('codex')}
        />
        <ServiceCard
          emoji="🧘" title="Meditação"
          description="Cultivar Qi passivamente"
          onClick={() => onNavigate('meditation')}
        />
        <ServiceCard
          emoji="🏆" title="Ranking"
          description="Hall dos cultivadores"
          onClick={() => onNavigate('ranking')}
        />
        <ServiceCard
          emoji="💾" title="Salvar"
          description="Exportar progresso"
          onClick={() => onNavigate('ranking')}
        />
      </div>
    </div>
  )
}
