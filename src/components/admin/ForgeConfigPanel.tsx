import { useState, useEffect, useMemo } from 'react'
import { api } from '../../lib/api'
import type {
  ForgeConfig,
  IngredientCost,
  UpgradeLevelConfig,
  AscensionTierConfig,
} from '../../utils/forge'
import { DEFAULT_UPGRADE_BONUS, DEFAULT_ASCENSION_BONUS, itemStatMultiplier } from '../../utils/forge'

function makeDefaultTierRows(): UpgradeLevelConfig[] {
  return Array.from({ length: 15 }, (_, i) => ({
    level: i + 1,
    materials: [],
    failChance: i < 5 ? 0 : i < 10 ? (i - 4) * 5 : ([35, 40, 45, 48, 50][i - 10] ?? 50),
  }))
}

function makeDefaultUpgrade(): Record<string, UpgradeLevelConfig[]> {
  const result: Record<string, UpgradeLevelConfig[]> = {}
  for (let t = 1; t <= 10; t++) result[String(t)] = makeDefaultTierRows()
  return result
}

const DEFAULT_CONFIG: ForgeConfig = {
  upgrade: makeDefaultUpgrade(),
  ascension: Array.from({ length: 5 }, (_, i) => ({
    tier: i,
    materials: [],
    sacrificeCount: i + 1,
    failChance: 0,
  })),
}

const MAX_MATERIAL_SLOTS = 4

// ── Material slot row ─────────────────────────────────────────
function MaterialSlot({
  mat,
  onChangeId,
  onChangeQty,
  onRemove,
}: {
  mat: IngredientCost
  onChangeId:  (v: string) => void
  onChangeQty: (v: number) => void
  onRemove:    () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        placeholder="item_id"
        value={mat.itemId}
        onChange={e => onChangeId(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1 focus:outline-none focus:border-amber-500"
        style={{ width: 180 }}
      />
      <input
        type="number"
        min={1}
        value={mat.quantity}
        onChange={e => onChangeQty(Math.max(1, Number(e.target.value)))}
        className="bg-slate-800 border border-slate-700 text-amber-300 text-xs px-2 py-1 text-center focus:outline-none focus:border-amber-500 tabular-nums"
        style={{ width: 60 }}
      />
      <button
        onClick={onRemove}
        className="text-red-500 hover:text-red-300 text-xs px-1.5 py-1 border border-red-800/50 hover:border-red-600 transition-colors"
        title="Remover"
      >
        ✕
      </button>
    </div>
  )
}

// ── Upgrade row ───────────────────────────────────────────────
function UpgradeRow({
  row,
  isOdd,
  onChangeFailChance,
  onAddMaterial,
  onChangeMaterialId,
  onChangeMaterialQty,
  onRemoveMaterial,
}: {
  row: UpgradeLevelConfig
  isOdd: boolean
  onChangeFailChance:  (v: number) => void
  onAddMaterial:       () => void
  onChangeMaterialId:  (idx: number, v: string) => void
  onChangeMaterialQty: (idx: number, v: number) => void
  onRemoveMaterial:    (idx: number) => void
}) {
  return (
    <div className={`px-3 py-2.5 border-b border-slate-800/60 ${isOdd ? 'bg-slate-900' : 'bg-slate-950'}`}>
      <div className="flex items-start gap-4">

        {/* Nível */}
        <div className="w-16 shrink-0 pt-0.5">
          <span className="text-xs font-bold text-amber-400 font-cinzel">+{row.level}</span>
        </div>

        {/* Chance de falha */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Falha</span>
          <input
            type="number"
            min={0}
            max={100}
            value={row.failChance}
            onChange={e => onChangeFailChance(Math.max(0, Math.min(100, Number(e.target.value))))}
            className={`w-14 text-center bg-slate-800 border text-xs px-1.5 py-1 focus:outline-none tabular-nums ${
              row.failChance > 0
                ? 'border-red-700 text-red-400 focus:border-red-500'
                : 'border-slate-700 text-slate-400 focus:border-slate-500'
            }`}
          />
          <span className="text-xs text-slate-600">%</span>
        </div>

        {/* Materiais */}
        <div className="flex-1 space-y-1.5">
          {row.materials.map((mat, i) => (
            <MaterialSlot
              key={i}
              mat={mat}
              onChangeId={v  => onChangeMaterialId(i, v)}
              onChangeQty={v => onChangeMaterialQty(i, v)}
              onRemove={() => onRemoveMaterial(i)}
            />
          ))}
          {row.materials.length < MAX_MATERIAL_SLOTS && (
            <button
              onClick={onAddMaterial}
              className="text-xs text-teal-400 border border-teal-800 hover:border-teal-600 hover:bg-teal-900/20 px-2 py-0.5 transition-colors"
            >
              + Material
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ascension row ─────────────────────────────────────────────
function AscensionRow({
  row,
  isOdd,
  onChangeSacrificeCount,
  onChangeFailChance,
  onAddMaterial,
  onChangeMaterialId,
  onChangeMaterialQty,
  onRemoveMaterial,
}: {
  row: AscensionTierConfig
  isOdd: boolean
  onChangeSacrificeCount: (v: number) => void
  onChangeFailChance:     (v: number) => void
  onAddMaterial:          () => void
  onChangeMaterialId:     (idx: number, v: string) => void
  onChangeMaterialQty:    (idx: number, v: number) => void
  onRemoveMaterial:       (idx: number) => void
}) {
  const label = `Ascensão ${['I', 'II', 'III', 'IV', 'V'][row.tier] ?? row.tier}`
  const failChance = row.failChance ?? 0
  const failColor  = failChance === 0 ? '#22c55e' : failChance <= 20 ? '#f59e0b' : failChance <= 40 ? '#f97316' : '#ef4444'

  return (
    <div className={`px-3 py-2.5 border-b border-slate-800/60 ${isOdd ? 'bg-slate-900' : 'bg-slate-950'}`}>
      <div className="flex items-start gap-4">

        {/* Label */}
        <div className="w-28 shrink-0 pt-0.5">
          <span className="text-xs font-bold text-teal-400 font-cinzel">{label}</span>
        </div>

        {/* Sacrifícios */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Sacrifícios</span>
          <input
            type="number" min={1} max={10} value={row.sacrificeCount}
            onChange={e => onChangeSacrificeCount(Math.max(1, Number(e.target.value)))}
            className="w-14 text-center bg-slate-800 border border-slate-700 text-amber-300 text-xs px-1.5 py-1 focus:outline-none focus:border-amber-500 tabular-nums"
          />
        </div>

        {/* Chance de falha */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Falha</span>
          <input
            type="number" min={0} max={100} value={failChance}
            onChange={e => onChangeFailChance(Math.max(0, Math.min(100, Number(e.target.value))))}
            className={`w-14 text-center bg-slate-800 border text-xs px-1.5 py-1 focus:outline-none tabular-nums ${
              failChance > 0 ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-slate-500'
            }`}
            style={{ color: failColor }}
          />
          <span className="text-xs text-slate-600">%</span>
        </div>

        {/* Materiais */}
        <div className="flex-1 space-y-1.5">
          {row.materials.map((mat, i) => (
            <MaterialSlot
              key={i} mat={mat}
              onChangeId={v  => onChangeMaterialId(i, v)}
              onChangeQty={v => onChangeMaterialQty(i, v)}
              onRemove={() => onRemoveMaterial(i)}
            />
          ))}
          {row.materials.length < MAX_MATERIAL_SLOTS && (
            <button onClick={onAddMaterial}
              className="text-xs text-teal-400 border border-teal-800 hover:border-teal-600 hover:bg-teal-900/20 px-2 py-0.5 transition-colors">
              + Material
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card de ganho de stats por upgrade/ascensão ──────────────
function StatGainCard({ upgradeBonus, ascensionBonus, onChangeUpgrade, onChangeAscension }: {
  upgradeBonus:   number
  ascensionBonus: number
  onChangeUpgrade:   (v: number) => void
  onChangeAscension: (v: number) => void
}) {
  const maxMult = useMemo(
    () => itemStatMultiplier(15, 5, { upgradeBonus, ascensionBonus }),
    [upgradeBonus, ascensionBonus],
  )
  const upgPct = Math.round(upgradeBonus   * 100 * 10) / 10
  const ascPct = Math.round(ascensionBonus * 100 * 10) / 10

  return (
    <div className="border border-teal-800/40 bg-teal-950/10 p-3 space-y-3">
      <div className="text-xs font-cinzel font-bold text-teal-400 tracking-wider">
        Ganho de Stats por Nível
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Bônus por nível de aprimoramento</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={1} step={0.01}
              value={upgradeBonus}
              onChange={e => onChangeUpgrade(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              className="w-20 text-center bg-slate-800 border border-teal-700/50 text-teal-300 text-xs px-1.5 py-1 focus:outline-none focus:border-teal-500 tabular-nums"
            />
            <span className="text-xs text-slate-400">= <span className="text-teal-400 font-bold">+{upgPct}% / nível</span></span>
          </div>
          <div className="text-[10px] text-slate-600">
            +15 → ×{itemStatMultiplier(15, 0, { upgradeBonus, ascensionBonus }).toFixed(2)} stats base
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Bônus por tier de ascensão</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={1} step={0.01}
              value={ascensionBonus}
              onChange={e => onChangeAscension(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              className="w-20 text-center bg-slate-800 border border-teal-700/50 text-teal-300 text-xs px-1.5 py-1 focus:outline-none focus:border-teal-500 tabular-nums"
            />
            <span className="text-xs text-slate-400">= <span className="text-teal-400 font-bold">+{ascPct}% / tier</span></span>
          </div>
          <div className="text-[10px] text-slate-600">
            5 ascensões → ×{itemStatMultiplier(0, 5, { upgradeBonus, ascensionBonus }).toFixed(2)} stats base
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">
        Multiplicador máximo (+15 e 5 ascensões): <span className="text-amber-400 font-bold">×{maxMult.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ── Preset rápido de falha para aprimoramento ────────────────
function QuickFailPreset({ onApply }: {
  onApply: (guarantee: number, startPct: number, stepPct: number, maxPct: number) => void
}) {
  const [guarantee, setGuarantee] = useState(5)   // garantia até esse nível
  const [startPct,  setStartPct]  = useState(5)   // % inicial no primeiro nível arriscado
  const [stepPct,   setStepPct]   = useState(5)   // incremento por nível
  const [maxPct,    setMaxPct]    = useState(50)  // teto

  const preview = Array.from({ length: 15 }, (_, i) => {
    const lvl = i + 1
    if (lvl <= guarantee) return { lvl, pct: 0 }
    const pct = Math.min(maxPct, startPct + (lvl - guarantee - 1) * stepPct)
    return { lvl, pct: Math.round(pct) }
  })

  return (
    <div className="border border-amber-800/40 bg-amber-950/10 p-3 space-y-2.5">
      <div className="text-xs font-cinzel font-bold text-amber-400 tracking-wider">
        Preset rápido — aplicar a todos os tiers
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {[
          { label: 'Garantia até +', val: guarantee, set: setGuarantee, min:0, max:14 },
          { label: 'Falha inicial (%)', val: startPct, set: setStartPct,  min:0, max:100 },
          { label: 'Incremento/nível (%)', val: stepPct, set: setStepPct, min:0, max:50 },
          { label: 'Máximo (%)', val: maxPct, set: setMaxPct, min:0, max:100 },
        ].map(({ label, val, set, min, max }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-slate-500 whitespace-nowrap">{label}</span>
            <input
              type="number" min={min} max={max} value={val}
              onChange={e => set(Math.max(min, Math.min(max, Number(e.target.value))))}
              className="w-14 text-center bg-slate-800 border border-slate-700 text-amber-300 text-xs px-1.5 py-1 focus:outline-none focus:border-amber-500 tabular-nums"
            />
          </div>
        ))}
        <button
          onClick={() => onApply(guarantee, startPct, stepPct, maxPct)}
          className="px-3 py-1.5 text-xs font-bold border border-amber-600 text-amber-400 bg-amber-950/30 hover:bg-amber-900/30 transition-colors"
        >
          Aplicar a todos
        </button>
      </div>
      {/* Mini preview */}
      <div className="flex flex-wrap gap-1">
        {preview.map(({ lvl, pct }) => {
          const color = pct === 0 ? '#22c55e' : pct <= 15 ? '#f59e0b' : pct <= 30 ? '#f97316' : '#ef4444'
          return (
            <span key={lvl} className="text-[10px] px-1.5 py-0.5 border tabular-nums"
              style={{ color, borderColor: color + '55', backgroundColor: color + '10' }}>
              +{lvl}: {pct}%
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Migrate old flat config if needed ────────────────────────
function migrateConfig(raw: unknown): ForgeConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG
  const r = raw as Record<string, unknown>

  let upgrade: Record<string, UpgradeLevelConfig[]>
  if (Array.isArray(r.upgrade)) {
    // Old flat structure: promote to tier "1" and fill rest with defaults
    upgrade = makeDefaultUpgrade()
    upgrade['1'] = r.upgrade as UpgradeLevelConfig[]
  } else if (r.upgrade && typeof r.upgrade === 'object') {
    upgrade = r.upgrade as Record<string, UpgradeLevelConfig[]>
    // Ensure all 10 tiers exist
    for (let t = 1; t <= 10; t++) {
      if (!upgrade[String(t)]) upgrade[String(t)] = makeDefaultTierRows()
    }
  } else {
    upgrade = makeDefaultUpgrade()
  }

  const ascension = Array.isArray(r.ascension)
    ? (r.ascension as AscensionTierConfig[])
    : DEFAULT_CONFIG.ascension

  return { upgrade, ascension }
}

// ── ForgeConfigPanel ──────────────────────────────────────────
type ForgeTab = 'upgrade' | 'ascension'

export function ForgeConfigPanel() {
  const [config,       setConfig]       = useState<ForgeConfig>(DEFAULT_CONFIG)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [tab,          setTab]          = useState<ForgeTab>('upgrade')
  const [selectedTier, setSelectedTier] = useState(1)

  useEffect(() => {
    api.get<unknown>('/api/admin/forge-config')
      .then(data => { setConfig(migrateConfig(data)); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/forge-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  // ── Upgrade mutators (per tier) ───────────────────────────
  function getTierRows(tier: number): UpgradeLevelConfig[] {
    return config.upgrade[String(tier)] ?? makeDefaultTierRows()
  }

  function updateUpgrade(tier: number, levelIdx: number, patch: Partial<UpgradeLevelConfig>) {
    setConfig(prev => {
      const rows = (prev.upgrade[String(tier)] ?? makeDefaultTierRows()).map((row, i) =>
        i === levelIdx ? { ...row, ...patch } : row
      )
      return { ...prev, upgrade: { ...prev.upgrade, [String(tier)]: rows } }
    })
  }

  function addUpgradeMaterial(tier: number, levelIdx: number) {
    setConfig(prev => {
      const rows = (prev.upgrade[String(tier)] ?? makeDefaultTierRows()).map((row, i) =>
        i === levelIdx
          ? { ...row, materials: [...row.materials, { itemId: '', quantity: 1 }] }
          : row
      )
      return { ...prev, upgrade: { ...prev.upgrade, [String(tier)]: rows } }
    })
  }

  function setUpgradeMaterialId(tier: number, levelIdx: number, matIdx: number, itemId: string) {
    setConfig(prev => {
      const rows = (prev.upgrade[String(tier)] ?? makeDefaultTierRows()).map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, itemId } : m)
        return { ...row, materials }
      })
      return { ...prev, upgrade: { ...prev.upgrade, [String(tier)]: rows } }
    })
  }

  function setUpgradeMaterialQty(tier: number, levelIdx: number, matIdx: number, quantity: number) {
    setConfig(prev => {
      const rows = (prev.upgrade[String(tier)] ?? makeDefaultTierRows()).map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, quantity } : m)
        return { ...row, materials }
      })
      return { ...prev, upgrade: { ...prev.upgrade, [String(tier)]: rows } }
    })
  }

  function removeUpgradeMaterial(tier: number, levelIdx: number, matIdx: number) {
    setConfig(prev => {
      const rows = (prev.upgrade[String(tier)] ?? makeDefaultTierRows()).map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.filter((_, j) => j !== matIdx)
        return { ...row, materials }
      })
      return { ...prev, upgrade: { ...prev.upgrade, [String(tier)]: rows } }
    })
  }

  // ── Ascension mutators ────────────────────────────────────
  function updateAscension(tierIdx: number, patch: Partial<AscensionTierConfig>) {
    setConfig(prev => {
      const ascension = prev.ascension.map((row, i) =>
        i === tierIdx ? { ...row, ...patch } : row
      )
      return { ...prev, ascension }
    })
  }

  function addAscensionMaterial(tierIdx: number) {
    setConfig(prev => {
      const ascension = prev.ascension.map((row, i) =>
        i === tierIdx
          ? { ...row, materials: [...row.materials, { itemId: '', quantity: 1 }] }
          : row
      )
      return { ...prev, ascension }
    })
  }

  function setAscensionMaterialId(tierIdx: number, matIdx: number, itemId: string) {
    setConfig(prev => {
      const ascension = prev.ascension.map((row, i) => {
        if (i !== tierIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, itemId } : m)
        return { ...row, materials }
      })
      return { ...prev, ascension }
    })
  }

  function setAscensionMaterialQty(tierIdx: number, matIdx: number, quantity: number) {
    setConfig(prev => {
      const ascension = prev.ascension.map((row, i) => {
        if (i !== tierIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, quantity } : m)
        return { ...row, materials }
      })
      return { ...prev, ascension }
    })
  }

  function removeAscensionMaterial(tierIdx: number, matIdx: number) {
    setConfig(prev => {
      const ascension = prev.ascension.map((row, i) => {
        if (i !== tierIdx) return row
        const materials = row.materials.filter((_, j) => j !== matIdx)
        return { ...row, materials }
      })
      return { ...prev, ascension }
    })
  }

  const currentTierRows = getTierRows(selectedTier)

  return (
    <div className="space-y-6">

      {/* ── Título + Save ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
          Configuração da Forja
        </h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-teal-400">✓ Salvo com sucesso.</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <span className="text-amber-600 text-xs">✦</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600 tracking-widest uppercase">Materiais e custos por nível</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-amber-600 text-xs">✦</span>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex border-b border-slate-800">
        {(['upgrade', 'ascension'] as ForgeTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-5 py-2.5 text-sm font-medium tracking-wider border-b-2 -mb-px transition-all',
              tab === t
                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600',
            ].join(' ')}
          >
            {t === 'upgrade' ? 'Aprimoramento' : 'Ascensão'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Carregando configuração...</div>
      ) : (
        <>
          {/* ── Preset rápido de chance de falha (upgrade tab) ── */}
          {tab === 'upgrade' && (
            <QuickFailPreset
              onApply={(guarantee, startPct, stepPct, maxPct) => {
                setConfig(prev => {
                  const newUpgrade = { ...prev.upgrade }
                  for (let t = 1; t <= 10; t++) {
                    const rows = (prev.upgrade[String(t)] ?? makeDefaultTierRows()).map(row => {
                      if (row.level <= guarantee) return { ...row, failChance: 0 }
                      const chance = startPct + (row.level - guarantee - 1) * stepPct
                      return { ...row, failChance: Math.min(maxPct, Math.round(chance)) }
                    })
                    newUpgrade[String(t)] = rows
                  }
                  return { ...prev, upgrade: newUpgrade }
                })
              }}
            />
          )}

          {/* ── Card de ganho de stats ── */}
          {tab === 'upgrade' && (
            <StatGainCard
              upgradeBonus={config.upgradeBonus ?? DEFAULT_UPGRADE_BONUS}
              ascensionBonus={config.ascensionBonus ?? DEFAULT_ASCENSION_BONUS}
              onChangeUpgrade={v => setConfig(c => ({ ...c, upgradeBonus: v }))}
              onChangeAscension={v => setConfig(c => ({ ...c, ascensionBonus: v }))}
            />
          )}

          {/* ── Tier selector (upgrade tab only) ── */}
          {tab === 'upgrade' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 tracking-widest uppercase mr-1">Tier do item:</span>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={[
                    'px-3 py-1 text-xs font-bold font-cinzel border transition-all',
                    selectedTier === t
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300',
                  ].join(' ')}
                >
                  T{t}
                </button>
              ))}
            </div>
          )}

          {/* ── Cabeçalho da tabela ── */}
          <div className="px-3 py-2 border-b border-slate-700 bg-slate-900 flex items-center gap-4 text-xs text-slate-500 font-medium tracking-widest uppercase">
            <div className={tab === 'upgrade' ? 'w-16' : 'w-28'}>Nível</div>
            <div className="w-28">Sacrifícios / Falha</div>
            {tab === 'ascension' && <div className="w-28">Falha (%)</div>}
            <div className="flex-1">Materiais (item_id + qtd)</div>
          </div>

          {/* ── Upgrade rows ── */}
          {tab === 'upgrade' && currentTierRows.map((row, i) => (
            <UpgradeRow
              key={row.level}
              row={row}
              isOdd={i % 2 !== 0}
              onChangeFailChance={v       => updateUpgrade(selectedTier, i, { failChance: v })}
              onAddMaterial={()          => addUpgradeMaterial(selectedTier, i)}
              onChangeMaterialId={(j, v)  => setUpgradeMaterialId(selectedTier, i, j, v)}
              onChangeMaterialQty={(j, v) => setUpgradeMaterialQty(selectedTier, i, j, v)}
              onRemoveMaterial={j        => removeUpgradeMaterial(selectedTier, i, j)}
            />
          ))}

          {/* ── Ascension rows ── */}
          {tab === 'ascension' && config.ascension.map((row, i) => (
            <AscensionRow
              key={row.tier}
              row={row}
              isOdd={i % 2 !== 0}
              onChangeSacrificeCount={v   => updateAscension(i, { sacrificeCount: v })}
              onChangeFailChance={v       => updateAscension(i, { failChance: v })}
              onAddMaterial={()           => addAscensionMaterial(i)}
              onChangeMaterialId={(j, v)  => setAscensionMaterialId(i, j, v)}
              onChangeMaterialQty={(j, v) => setAscensionMaterialQty(i, j, v)}
              onRemoveMaterial={j         => removeAscensionMaterial(i, j)}
            />
          ))}
        </>
      )}

      <p className="text-xs text-slate-600">
        item_id deve corresponder ao ID de um item cadastrado no banco.
        Materiais vazios significam que aquele nível não exige materiais.
      </p>
    </div>
  )
}
