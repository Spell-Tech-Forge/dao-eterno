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
  const biomes     = useGameDataStore(s => s.biomes)
  const biomeOrder = useGameDataStore(s => s.biomeOrder)
  const playerLevel = realmStageToLevel(realm, realmStage)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text tracking-widest uppercase">Mapa de Aventura</h2>
        <span className="text-xs text-muted">Escolha o próximo bioma</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {biomeOrder.map((biomeId) => {
          const biome = biomes[biomeId]
          if (!biome) return null
          const requiredLevel = realmStageToLevel(biome.requiredRealm, biome.requiredStage)
          const locked = playerLevel < requiredLevel
          const tempAvail = isTemporaryAvailable(biome)
          const isTemp = biome.biomeType === 'temporary'
          return (
            <div
              key={biomeId}
              className={`rounded-xl border p-3.5 flex flex-col gap-2 transition-all ${
                locked ? 'border-border bg-surface opacity-50' : 'border-jade bg-surface hover:border-gold'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm" style={{ color: locked ? '#94a3b8' : biome.theme.accentColor }}>
                    {biome.name}
                  </span>
                  {isTemp && <span className="text-[10px] px-1 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold">⏳ Temp</span>}
                </div>
                <div className="text-xs text-muted mt-0.5 line-clamp-2">{biome.description}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  {REALM_NAMES[biome.requiredRealm]} · {STAGE_NAMES[biome.requiredStage]}
                </span>
                <span className="text-xs bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                  Dif. {biome.difficulty}/10
                </span>
              </div>
              {isTemp && biome.activeDays && (
                <div className="text-[10px] text-muted">
                  {biome.activeDays.map(d => DAY_NAMES[d]).join(' ')}
                  {biome.activeStartTime && ` · ${biome.activeStartTime}–${biome.activeEndTime}`}
                </div>
              )}
              {locked ? (
                <div className="text-center text-xs text-muted bg-surface-2 rounded-lg py-1.5 border border-border">
                  Bloqueado
                </div>
              ) : isTemp && !tempAvail ? (
                <div className="text-center text-xs text-muted bg-surface-2 rounded-lg py-1.5 border border-border">
                  Fora do horário
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
