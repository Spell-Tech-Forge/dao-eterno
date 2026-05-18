import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { realmStageToLevel } from '../../data/breakthroughs'
import { REALM_NAMES, STAGE_NAMES } from '../../types'
import type { BiomeDefinition } from '../../types'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  onEnterBiome: (biomeId: string) => void
}

function isTemporaryAvailable(biome: BiomeDefinition): boolean {
  const now = new Date()
  if (biome.activeUntil && new Date(biome.activeUntil) < now) return false
  if (biome.activeDays && !biome.activeDays.includes(now.getDay())) return false
  if (biome.activeStartTime && biome.activeEndTime) {
    const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    if (cur < biome.activeStartTime || cur > biome.activeEndTime) return false
  }
  return true
}

function BiomeCard({ biomeId, biomes, playerLevel, onEnterBiome }: {
  biomeId: string
  biomes: Record<string, BiomeDefinition>
  playerLevel: number
  onEnterBiome: (id: string) => void
}) {
  const biome = biomes[biomeId]
  if (!biome) return null

  const requiredLevel = realmStageToLevel(biome.requiredRealm, biome.requiredStage)
  const locked    = playerLevel < requiredLevel
  const isTemp    = biome.biomeType === 'temporary'
  const tempAvail = isTemp ? isTemporaryAvailable(biome) : true
  const accent    = locked ? '#475569' : biome.theme.accentColor

  return (
    <div
      className={`border p-3.5 flex flex-col gap-2 transition-all ${
        locked
          ? 'border-slate-700 bg-slate-900 opacity-50'
          : 'border-slate-700 bg-slate-900 hover:border-amber-700/60'
      }`}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-cinzel font-bold text-sm" style={{ color: accent }}>
            {biome.name}
          </span>
          {isTemp && (
            <span className="text-[10px] px-1 py-0.5 bg-amber-950/40 border border-amber-800/40 text-amber-500/80">
              ⏳ Temp
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{biome.description}</div>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-500">
          {REALM_NAMES[biome.requiredRealm]} · {STAGE_NAMES[biome.requiredStage]}
        </span>
        <span className="text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-500">
          Dif. {biome.difficulty}/10
        </span>
      </div>

      {isTemp && biome.activeDays && (
        <div className="text-[10px] text-slate-600">
          {biome.activeDays.map(d => DAY_NAMES[d]).join(' ')}
          {biome.activeStartTime && ` · ${biome.activeStartTime}–${biome.activeEndTime}`}
        </div>
      )}

      {locked ? (
        <div className="text-center text-xs text-slate-500 bg-slate-800 border border-slate-700 py-1.5">
          🔒 Bloqueado
        </div>
      ) : isTemp && !tempAvail ? (
        <div className="text-center text-xs text-slate-500 bg-slate-800 border border-slate-700 py-1.5">
          ⏰ Fora do horário
        </div>
      ) : (
        <button
          onClick={() => onEnterBiome(biomeId)}
          className="w-full text-sm font-cinzel font-bold tracking-wider py-1.5 border transition-all hover:brightness-110 active:scale-95"
          style={{
            borderColor:     biome.theme.accentColor,
            color:           biome.theme.accentColor,
            backgroundColor: biome.theme.accentColor + '18',
          }}
        >
          Entrar
        </button>
      )}
    </div>
  )
}

export function BiomeMap({ onEnterBiome }: Props) {
  const { realm, realmStage } = usePlayerStore()
  const biomes     = useGameDataStore(s => s.biomes)
  const biomeOrder = useGameDataStore(s => s.biomeOrder)
  const playerLevel = realmStageToLevel(realm, realmStage)

  const fixedIds = biomeOrder.filter(id => biomes[id]?.biomeType !== 'temporary')
  const tempIds  = biomeOrder.filter(id => biomes[id]?.biomeType === 'temporary')

  return (
    <>
      {fixedIds.length > 0 && (
        <div className="border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-cinzel tracking-widest uppercase text-slate-500 whitespace-nowrap">
              Mapa de Aventura
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="text-amber-800 text-[10px]">✦</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {fixedIds.map(id => (
              <BiomeCard key={id} biomeId={id} biomes={biomes} playerLevel={playerLevel} onEnterBiome={onEnterBiome} />
            ))}
          </div>
        </div>
      )}

      {tempIds.length > 0 && (
        <div className="border border-violet-900/40 bg-slate-900 p-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-cinzel tracking-widest uppercase text-violet-500/70 whitespace-nowrap">
              Reinos Místicos
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-violet-900/40 to-transparent" />
            <span className="text-violet-700 text-[10px]">✦</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tempIds.map(id => (
              <BiomeCard key={id} biomeId={id} biomes={biomes} playerLevel={playerLevel} onEnterBiome={onEnterBiome} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
