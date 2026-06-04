import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'

interface PlayerPowerResult {
  player_name: string
  player_power: number
  realm: string
  realm_stage: string
  breakdown: {
    base_atk: number; base_hp: number; base_def: number
    eq_atk: number; eq_hp: number; eq_def: number
    dps: number; surv: number; realm_mult: number
  }
}

interface BiomePowerInfo {
  id: string; name: string; target_power: number; required_realm: string
}

export function PowerCalibrationPanel() {
  const [players,    setPlayers]    = useState<{ id: number; name: string; username: string }[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [result,     setResult]     = useState<PlayerPowerResult | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [savingId,   setSavingId]   = useState<string | null>(null)
  const [saved,      setSaved]      = useState<string | null>(null)
  const [scaleCfg,   setScaleCfg]   = useState({ scaleMin: 0.4, scaleMax: 1.5 })
  const [savingScale, setSavingScale] = useState(false)
  const [scaleMsg,   setScaleMsg]   = useState('')

  const biomes = useGameDataStore(s => s.biomes)
  const biomeList: BiomePowerInfo[] = Object.values(biomes)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(b => ({ id: b.id, name: b.name, target_power: b.targetPower ?? 0, required_realm: b.requiredRealm }))

  useEffect(() => {
    api.get<{ id: number; name: string; username: string }[]>('/api/admin/players/list')
      .then(setPlayers).catch(() => {})
    api.get<{ scaleMin: number; scaleMax: number }>('/api/admin/combat-scale-config')
      .then(setScaleCfg).catch(() => {})
  }, [])

  async function calcPower() {
    if (!selectedId) return
    setLoading(true); setResult(null)
    try {
      const r = await api.get<PlayerPowerResult>(`/api/admin/player-power/${selectedId}`)
      setResult(r)
    } catch { setResult(null) }
    finally { setLoading(false) }
  }

  async function setTargetPower(biomeId: string, power: number) {
    setSavingId(biomeId)
    try {
      await api.put(`/api/admin/biomes/${biomeId}`, {
        ...biomes[biomeId],
        target_power: power,
        // campos obrigatórios para o PUT
        name: biomes[biomeId]?.name, description: biomes[biomeId]?.description ?? '',
        required_realm: biomes[biomeId]?.requiredRealm, required_stage: biomes[biomeId]?.requiredStage,
        difficulty: biomes[biomeId]?.difficulty ?? 1, biome_type: biomes[biomeId]?.biomeType ?? 'fixed',
        active_days: biomes[biomeId]?.activeDays ?? [0,1,2,3,4,5,6],
        enemy_pool: biomes[biomeId]?.enemyPool ?? [],
        boss_id: biomes[biomeId]?.bossId ?? null, elite_id: biomes[biomeId]?.eliteId ?? null,
        min_kills_boss: biomes[biomeId]?.minKillsBeforeBoss ?? 25,
        min_kills_elite: biomes[biomeId]?.minKillsBeforeElite ?? 15,
        boss_spawn_chance: biomes[biomeId]?.bossSpawnChance ?? 0.20,
        rarity_weights: biomes[biomeId]?.normalRarityWeights ?? {},
        boss_rarity: biomes[biomeId]?.bossRarity ?? 'rare',
        gradient: biomes[biomeId]?.theme?.gradient ?? '',
        accent_color: biomes[biomeId]?.theme?.accentColor ?? '#4a9e7f',
        sort_order: biomes[biomeId]?.sortOrder ?? 0,
        active: true,
        location_id: biomes[biomeId]?.locationId ?? null,
        map_x: biomes[biomeId]?.mapX ?? 0, map_y: biomes[biomeId]?.mapY ?? 0,
      })
      setSaved(biomeId); setTimeout(() => setSaved(null), 2000)
      await useGameDataStore.getState().load()
    } finally { setSavingId(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel text-lg font-bold text-amber-400">Calibração de Poder</h2>
        <p className="text-xs text-slate-500 mt-1">
          Calcula o poder real de um personagem e usa como referência para definir o <code className="text-slate-300">target_power</code> dos biomas.
        </p>
      </div>

      {/* Escala de combate */}
      <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
        <p className="text-xs font-cinzel tracking-widest text-slate-500 uppercase">Multiplicador de Escala de Combate</p>
        <p className="text-xs text-slate-600">
          Fórmula: <code className="text-slate-400">scale = clamp(√(playerPower ÷ targetPower), min, max)</code>.<br />
          Personagens muito fortes para um mapa ficam limitados pelo máximo. Reduza o máximo para amenizar.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Mínimo (personagem fraco)</label>
            <input type="number" step="0.05" min="0.1" max="1"
              value={scaleCfg.scaleMin}
              onChange={e => setScaleCfg(c => ({ ...c, scaleMin: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-600" />
            <p className="text-[10px] text-slate-600">Recomendado: 0.4 — monstros ficam no mínimo a 40% do padrão</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Máximo (personagem muito forte)</label>
            <input type="number" step="0.05" min="1" max="3"
              value={scaleCfg.scaleMax}
              onChange={e => setScaleCfg(c => ({ ...c, scaleMax: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-600" />
            <p className="text-[10px] text-slate-600">Padrão antigo: 2.5 · Novo padrão: 1.5 — monstros ficam até 50% mais fortes</p>
          </div>
        </div>
        {scaleMsg && <p className="text-xs text-teal-400">{scaleMsg}</p>}
        <button disabled={savingScale} onClick={async () => {
          setSavingScale(true); setScaleMsg('')
          try {
            await api.post('/api/admin/combat-scale-config', scaleCfg)
            setScaleMsg(`Salvo! min=${scaleCfg.scaleMin} · max=${scaleCfg.scaleMax}`)
          } catch (e) { setScaleMsg(e instanceof Error ? e.message : 'Erro') }
          setSavingScale(false)
        }}
          className="px-4 py-2 text-sm font-bold border border-teal-700/60 text-teal-400 bg-teal-950/10 hover:bg-teal-950/30 disabled:opacity-40 transition-colors">
          {savingScale ? 'Salvando...' : '💾 Salvar Escala'}
        </button>
      </div>

      {/* Seleção de personagem */}
      <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
        <p className="text-xs font-cinzel tracking-widest text-slate-500 uppercase">Calcular poder de um personagem</p>
        <div className="flex gap-2">
          <select
            className="flex-1 bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-600"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(parseInt(e.target.value) || null)}
          >
            <option value="">Selecione um personagem...</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.username})</option>
            ))}
          </select>
          <button onClick={calcPower} disabled={!selectedId || loading}
            className="px-5 py-2 text-sm border border-teal-600 text-teal-400 bg-teal-950/20 hover:bg-teal-950/40 transition-colors disabled:opacity-50">
            {loading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>

        {result && (
          <div className="border border-slate-700 bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-cinzel font-bold text-amber-300 text-base">{result.player_name}</p>
                <p className="text-xs text-slate-500">{result.realm} · {result.realm_stage}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-teal-400">{result.player_power.toLocaleString()}</p>
                <p className="text-xs text-slate-500">poder real</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { l: '⚡ ATK base', v: result.breakdown.base_atk },
                { l: '⚡ ATK equip', v: result.breakdown.eq_atk },
                { l: '❤️ HP base', v: result.breakdown.base_hp },
                { l: '❤️ HP equip', v: result.breakdown.eq_hp },
                { l: '🛡️ DEF base', v: result.breakdown.base_def },
                { l: '🛡️ DEF equip', v: result.breakdown.eq_def },
                { l: '📊 DPS estimado', v: result.breakdown.dps.toFixed(1) },
                { l: '🔰 Sobrevivência', v: Math.round(result.breakdown.surv).toLocaleString() },
                { l: '🌟 Mult. Realm', v: `×${result.breakdown.realm_mult.toFixed(2)}` },
              ].map(r => (
                <div key={r.l} className="border border-slate-700 px-2 py-1.5 bg-slate-900/40">
                  <p className="text-slate-500">{r.l}</p>
                  <p className="text-slate-200 font-bold tabular-nums">{r.v}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              💡 Use este valor como <code className="text-slate-300">target_power</code> para o bioma ideal para este personagem.
              A escala é automática: players mais fracos enfrentam monstros menores, mais fortes enfrentam maiores.
            </p>
          </div>
        )}
      </div>

      {/* Lista de biomas com target_power */}
      <div className="border border-slate-700 bg-slate-900 p-4 space-y-2">
        <p className="text-xs font-cinzel tracking-widest text-slate-500 uppercase mb-3">Poder alvo por bioma</p>
        <div className="space-y-1.5">
          {biomeList.map(b => (
            <div key={b.id} className="flex items-center gap-3 border border-slate-800 px-3 py-2 bg-slate-800/30">
              <span className="flex-1 text-sm text-slate-300 truncate">{b.name}</span>
              <span className="text-[10px] text-slate-600 hidden sm:block">{b.required_realm}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0}
                  className="w-24 bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 text-right outline-none focus:border-amber-500 tabular-nums"
                  value={b.target_power}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 0
                    useGameDataStore.setState(s => ({
                      biomes: { ...s.biomes, [b.id]: { ...s.biomes[b.id], targetPower: v } }
                    }))
                  }}
                />
                <button
                  onClick={() => setTargetPower(b.id, biomes[b.id]?.targetPower ?? 0)}
                  disabled={savingId === b.id}
                  className={`text-xs px-2 py-1 border transition-colors ${saved === b.id ? 'border-teal-600 text-teal-400' : 'border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400'} disabled:opacity-50`}
                >
                  {saved === b.id ? '✓' : savingId === b.id ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
