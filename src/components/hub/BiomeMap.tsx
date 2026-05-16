import { usePlayerStore } from '../../store/playerStore'
import { BIOME_DEFS, BIOME_ORDER } from '../../data/biomes'
import { realmStageToLevel } from '../../data/breakthroughs'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

interface Props {
  onEnterBiome: (biomeId: string) => void
}

export function BiomeMap({ onEnterBiome }: Props) {
  const { realm, realmStage } = usePlayerStore()
  const playerLevel = realmStageToLevel(realm, realmStage)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Mapa de Aventura</h2>
        <span className="text-xs text-muted">Escolha o próximo bioma</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BIOME_ORDER.map((biomeId) => {
          const biome = BIOME_DEFS[biomeId]
          const requiredLevel = realmStageToLevel(biome.requiredRealm, biome.requiredStage)
          const locked = playerLevel < requiredLevel
          return (
            <div
              key={biomeId}
              className={`rounded-xl border p-3.5 flex flex-col gap-2 transition-all ${
                locked ? 'border-border bg-surface opacity-50' : 'border-jade bg-surface hover:border-gold'
              }`}
            >
              <div>
                <div className="font-bold text-sm" style={{ color: locked ? '#94a3b8' : biome.theme.accentColor }}>
                  {biome.name}
                </div>
                <div className="text-xs text-muted mt-0.5 line-clamp-2">{biome.description}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  {REALM_NAMES[biome.requiredRealm]} · {STAGE_NAMES[biome.requiredStage]}
                </span>
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  Boss após {biome.minKillsBeforeBoss}+ kills
                </span>
              </div>
              {locked ? (
                <div className="text-center text-xs text-muted bg-surface-2 rounded-lg py-1.5 border border-border">
                  Bloqueado
                </div>
              ) : (
                <button
                  onClick={() => onEnterBiome(biomeId)}
                  className="w-full text-sm font-bold py-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: biome.theme.accentColor, color: '#fff' }}
                >
                  Entrar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
