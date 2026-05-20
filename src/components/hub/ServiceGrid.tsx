import type { Screen } from '../../types'
import { usePlayerStore } from '../../store/playerStore'
import { syncToServer } from '../../lib/sync'

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
}

export function ServiceGrid({ onNavigate }: Props) {
  const { hp, maxHp, gold, fullRestoreHp, spendGold } = usePlayerStore()

  const isHpFull      = hp >= maxHp
  const missingHp     = maxHp - hp
  const healCost      = isHpFull ? 0 : Math.max(3, Math.ceil(missingHp * 0.12))
  const canAffordHeal = gold >= healCost

  function handleHeal() {
    if (isHpFull || !canAffordHeal) return
    spendGold(healCost)
    fullRestoreHp()
    syncToServer().catch(err => console.warn('[sync] descanso:', err))
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-cinzel tracking-widest uppercase text-slate-500 whitespace-nowrap">Seita</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
        <span className="text-amber-800 text-[10px]">✦</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ServiceCard
          emoji="🏕️" title="Descanso"
          description={isHpFull ? 'HP completamente restaurado.' : `Restaurar HP completo · ${healCost} 🪙`}
          badge={
            isHpFull        ? 'HP cheio'
            : canAffordHeal ? `Restaurar por ${healCost} 🪙`
            : 'Ouro insuficiente'
          }
          badgeColor={isHpFull ? '#22c55e' : canAffordHeal ? '#f59e0b' : '#ef4444'}
          disabled={isHpFull || !canAffordHeal}
          onClick={handleHeal}
        />
        <ServiceCard emoji="🎒" title="Inventário"    description="Equipamentos e materiais"      onClick={() => onNavigate('inventory')} />
        <ServiceCard emoji="⚒️" title="Forja / Alquimia" description="Craft de armas e armaduras" onClick={() => onNavigate('crafting')} />
        <ServiceCard emoji="✨" title="Ascensão"      description="Aprimorar e ascender itens"    onClick={() => onNavigate('forge')} />
        <ServiceCard emoji="🏪" title="Mercado"       description="Compra e venda de itens"       onClick={() => onNavigate('market')} />
        <ServiceCard emoji="📖" title="Codex"         description="Bestas, equipamentos e reinos" onClick={() => onNavigate('codex')} />
        <ServiceCard emoji="🧘" title="Meditação"     description="Cultivar Qi passivamente"      onClick={() => onNavigate('meditation')} />
        <ServiceCard emoji="🏆" title="Ranking"       description="Hall dos cultivadores"         onClick={() => onNavigate('ranking')} />
      </div>
    </div>
  )
}
