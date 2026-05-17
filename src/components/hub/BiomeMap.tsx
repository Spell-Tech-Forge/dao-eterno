import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { realmStageToLevel } from '../../data/breakthroughs'
import { REALM_NAMES, STAGE_NAMES } from '../../types'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  onEnterBiome: (biomeId: string) => void
}

function isTemporaryAvailable(biome: import('../../types').BiomeDefinition): boolean {
  if (biome.biomeType !== 'temporary') return true
  const now = new Date()
  if (biome.activeUntil && new Date(biome.activeUntil) < now) return false
  if (biome.activeDays && !biome.activeDays.includes(now.getDay())) return false
  if (biome.activeStartTime && biome.activeEndTime) {
    const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    if (cur < biome.activeStartTime || cur > biome.activeEndTime) return false
  }
  return true
}

export function BiomeMap({ onEnterBiome }: Props) {
  const { realm, realmStage } = usePlayerStore()
  const biomes      = useGameDataStore(s => s.biomes)
  const biomeOrder  = useGameDataStore(s => s.biomeOrder)
  const playerLevel = realmStageToLevel(realm, realmStage)

  return (
    <div>
      {/* Cabeçalho de seção */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-cinzel tracking-widest uppercase text-muted whitespace-nowrap">Mapa de Aventura</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        <span className="text-gold/30 text-[10px]">✦</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {biomeOrder.map((biomeId) => {
          const biome = biomes[biomeId]
          if (!biome) return null

          const requiredLevel = realmStageToLevel(biome.requiredRealm, biome.requiredStage)
          const locked     = playerLevel < requiredLevel
          const isTemp     = biome.biomeType === 'temporary'
          const tempAvail  = isTemporaryAvailable(biome)
          const accentColor = locked ? '#94a3b8' : biome.theme.accentColor

          return (
            <div
              key={biomeId}
              className={`border p-3.5 flex flex-col gap-2 transition-all ${
                locked
                  ? 'border-border bg-surface opacity-50'
                  : 'border-jade bg-surface hover:border-gold'
              }`}
            >
              {/* Nome + badge temporário */}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-cinzel font-bold text-sm" style={{ color: accentColor }}>
                    {biome.name}
                  </span>
                  {isTemp && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold">
                      ⏳ Temp
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted mt-0.5 line-clamp-2">{biome.description}</div>
              </div>

              {/* Tags de requisito */}
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  {REALM_NAMES[biome.requiredRealm]} · {STAGE_NAMES[biome.requiredStage]}
                </span>
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  Dif. {biome.difficulty}/10
                </span>
              </div>

              {/* Horário do bioma temporário */}
              {isTemp && biome.activeDays && (
                <div className="text-[10px] text-muted">
                  {biome.activeDays.map(d => DAY_NAMES[d]).join(' ')}
                  {biome.activeStartTime && ` · ${biome.activeStartTime}–${biome.activeEndTime}`}
                </div>
              )}

              {/* CTA */}
              {locked ? (
                <div className="text-center text-xs text-muted bg-surface-2 border border-border py-1.5">
                  🔒 Bloqueado
                </div>
              ) : isTemp && !tempAvail ? (
                <div className="text-center text-xs text-muted bg-surface-2 border border-border py-1.5">
                  ⏰ Fora do horário
                </div>
              ) : (
                <button
                  onClick={() => onEnterBiome(biomeId)}
                  className="w-full text-sm font-cinzel font-bold tracking-wider py-1.5 border transition-all hover:brightness-110 active:scale-95"
                  style={{
                    borderColor: biome.theme.accentColor,
                    color: biome.theme.accentColor,
                    backgroundColor: biome.theme.accentColor + '18',
                  }}
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
