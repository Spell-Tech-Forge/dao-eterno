import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type {
  ForgeConfig,
  IngredientCost,
  UpgradeLevelConfig,
  AscensionTierConfig,
} from '../../utils/forge'

const DEFAULT_CONFIG: ForgeConfig = {
  upgrade: Array.from({ length: 15 }, (_, i) => ({
    level: i + 1,
    materials: [],
    failChance: i < 5 ? 0 : Math.min(50, (i - 4) * 5),
  })),
  ascension: Array.from({ length: 5 }, (_, i) => ({
    tier: i,
    materials: [],
    sacrificeCount: i + 1,
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
  onAddMaterial,
  onChangeMaterialId,
  onChangeMaterialQty,
  onRemoveMaterial,
}: {
  row: AscensionTierConfig
  isOdd: boolean
  onChangeSacrificeCount: (v: number) => void
  onAddMaterial:          () => void
  onChangeMaterialId:     (idx: number, v: string) => void
  onChangeMaterialQty:    (idx: number, v: number) => void
  onRemoveMaterial:       (idx: number) => void
}) {
  const label = `Ascensão ${['I', 'II', 'III', 'IV', 'V'][row.tier] ?? row.tier}`

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
            type="number"
            min={1}
            max={10}
            value={row.sacrificeCount}
            onChange={e => onChangeSacrificeCount(Math.max(1, Number(e.target.value)))}
            className="w-14 text-center bg-slate-800 border border-slate-700 text-amber-300 text-xs px-1.5 py-1 focus:outline-none focus:border-amber-500 tabular-nums"
          />
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

// ── ForgeConfigPanel ──────────────────────────────────────────
type ForgeTab = 'upgrade' | 'ascension'

export function ForgeConfigPanel() {
  const [config,  setConfig]  = useState<ForgeConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState<ForgeTab>('upgrade')

  useEffect(() => {
    api.get<ForgeConfig>('/api/admin/forge-config')
      .then(data => { setConfig(data); setLoading(false) })
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

  // ── Upgrade mutators ──────────────────────────────────────
  function updateUpgrade(levelIdx: number, patch: Partial<UpgradeLevelConfig>) {
    setConfig(prev => {
      const upgrade = prev.upgrade.map((row, i) =>
        i === levelIdx ? { ...row, ...patch } : row
      )
      return { ...prev, upgrade }
    })
  }

  function addUpgradeMaterial(levelIdx: number) {
    setConfig(prev => {
      const upgrade = prev.upgrade.map((row, i) =>
        i === levelIdx
          ? { ...row, materials: [...row.materials, { itemId: '', quantity: 1 }] }
          : row
      )
      return { ...prev, upgrade }
    })
  }

  function setUpgradeMaterialId(levelIdx: number, matIdx: number, itemId: string) {
    setConfig(prev => {
      const upgrade = prev.upgrade.map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, itemId } : m)
        return { ...row, materials }
      })
      return { ...prev, upgrade }
    })
  }

  function setUpgradeMaterialQty(levelIdx: number, matIdx: number, quantity: number) {
    setConfig(prev => {
      const upgrade = prev.upgrade.map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.map((m, j) => j === matIdx ? { ...m, quantity } : m)
        return { ...row, materials }
      })
      return { ...prev, upgrade }
    })
  }

  function removeUpgradeMaterial(levelIdx: number, matIdx: number) {
    setConfig(prev => {
      const upgrade = prev.upgrade.map((row, i) => {
        if (i !== levelIdx) return row
        const materials = row.materials.filter((_, j) => j !== matIdx)
        return { ...row, materials }
      })
      return { ...prev, upgrade }
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
          {/* ── Cabeçalho da tabela ── */}
          <div className={`px-3 py-2 border-b border-slate-700 bg-slate-900 flex items-center gap-4 text-xs text-slate-500 font-medium tracking-widest uppercase`}>
            <div className={tab === 'upgrade' ? 'w-16' : 'w-28'}>Nível</div>
            <div className="w-28">
              {tab === 'upgrade' ? 'Chance Falha' : 'Sacrifícios'}
            </div>
            <div className="flex-1">Materiais (item_id + qtd)</div>
          </div>

          {/* ── Upgrade rows ── */}
          {tab === 'upgrade' && config.upgrade.map((row, i) => (
            <UpgradeRow
              key={row.level}
              row={row}
              isOdd={i % 2 !== 0}
              onChangeFailChance={v   => updateUpgrade(i, { failChance: v })}
              onAddMaterial={()       => addUpgradeMaterial(i)}
              onChangeMaterialId={(j, v)  => setUpgradeMaterialId(i, j, v)}
              onChangeMaterialQty={(j, v) => setUpgradeMaterialQty(i, j, v)}
              onRemoveMaterial={j     => removeUpgradeMaterial(i, j)}
            />
          ))}

          {/* ── Ascension rows ── */}
          {tab === 'ascension' && config.ascension.map((row, i) => (
            <AscensionRow
              key={row.tier}
              row={row}
              isOdd={i % 2 !== 0}
              onChangeSacrificeCount={v   => updateAscension(i, { sacrificeCount: v })}
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
