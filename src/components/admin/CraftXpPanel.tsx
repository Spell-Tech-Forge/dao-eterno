import { useState, useEffect, useMemo } from 'react'
import { api } from '../../lib/api'
import type { CraftXpConfig, SkillXpConfig } from '../../utils/forge'
import { DEFAULT_TIER_LEVELS, DEFAULT_SKILL_XP_CONFIG, calcSkillXpForLevel } from '../../utils/forge'
import { useGameDataStore } from '../../store/gameDataStore'
import { useSkillsStore } from '../../store/skillsStore'

const TIER_LABELS = [
  'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5',
  'Tier 6', 'Tier 7', 'Tier 8', 'Tier 9', 'Tier 10',
]

const DEFAULT_CONFIG: CraftXpConfig = {
  forja:      [10, 25, 50, 90, 140, 200, 280, 380, 520, 700],
  alquimia:   [12, 30, 60, 110, 160, 230, 320, 430, 580, 750],
  inscricao:  [8,  20, 40, 70,  110, 160, 230, 310, 420, 580],
  tierLevels: [...DEFAULT_TIER_LEVELS],
}

export function CraftXpPanel() {
  const [config,     setConfig]     = useState<CraftXpConfig>(DEFAULT_CONFIG)
  const [skillCfg,   setSkillCfg]   = useState<SkillXpConfig>(DEFAULT_SKILL_XP_CONFIG)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState('')
  const [skillSaving, setSkillSaving] = useState(false)
  const [skillSaved,  setSkillSaved]  = useState(false)
  const loadSkillXpConfig = useGameDataStore(s => s.loadSkillXpConfig)

  useEffect(() => {
    Promise.all([
      api.get<CraftXpConfig>('/api/admin/craft-xp-config'),
      api.get<SkillXpConfig>('/api/admin/skill-xp-config'),
    ]).then(([craft, skill]) => {
      setConfig(craft)
      setSkillCfg(skill)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSaveSkillXp() {
    setSkillSaving(true); setSkillSaved(false)
    try {
      await api.post('/api/admin/skill-xp-config', skillCfg)
      void loadSkillXpConfig()
      useSkillsStore.getState().recalculateXpToNext()
      setSkillSaved(true)
      setTimeout(() => setSkillSaved(false), 2500)
    } catch { /* silent */ }
    finally { setSkillSaving(false) }
  }

  // Preview: XP necessário por nível (até nível 30)
  const previewLevels = useMemo(() => {
    let cum = 0
    return Array.from({ length: 30 }, (_, i) => {
      const lvl = i + 1
      const xp  = calcSkillXpForLevel(lvl, skillCfg)
      cum += xp
      return { lvl, xp, cum }
    })
  }, [skillCfg])

  function setCell(cat: 'forja' | 'alquimia' | 'inscricao', idx: number, val: number) {
    setConfig(prev => {
      const arr = [...prev[cat]]
      arr[idx] = val
      return { ...prev, [cat]: arr }
    })
  }

  function setTierLevel(idx: number, val: number) {
    setConfig(prev => {
      const arr = [...(prev.tierLevels ?? DEFAULT_TIER_LEVELS)]
      arr[idx] = Math.max(1, val)
      return { ...prev, tierLevels: arr }
    })
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.post('/api/admin/craft-xp-config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Título ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">
          XP de Crafting
        </h2>
        <div className="flex items-center gap-3">
          {saved  && <span className="text-sm text-teal-400">✓ Salvo com sucesso.</span>}
          {error  && <span className="text-sm text-red-400">{error}</span>}
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
      <div className="flex items-center gap-3 text-slate-600">
        <span className="text-amber-600 text-xs">✦</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600 tracking-widest uppercase">XP concedido por nível de tier</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-amber-600 text-xs">✦</span>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Carregando configuração...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-500 font-normal text-xs tracking-widest uppercase w-20">
                  Tier
                </th>
                <th className="py-2 px-3 text-violet-400 font-cinzel text-xs tracking-wider text-center">
                  Nível Mín
                </th>
                <th className="py-2 px-3 text-amber-400 font-cinzel text-xs tracking-wider text-center">
                  Forja XP
                </th>
                <th className="py-2 px-3 text-teal-400 font-cinzel text-xs tracking-wider text-center">
                  Alquimia XP
                </th>
                <th className="py-2 px-3 text-slate-300 font-cinzel text-xs tracking-wider text-center">
                  Inscrição XP
                </th>
              </tr>
            </thead>
            <tbody>
              {TIER_LABELS.map((label, idx) => {
                const tierLvl = (config.tierLevels ?? DEFAULT_TIER_LEVELS)[idx] ?? DEFAULT_TIER_LEVELS[idx]
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}>
                    <td className="py-2 px-3 text-xs text-slate-500 font-medium">{label}</td>

                    {/* Nível Mínimo */}
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="number"
                        min={1}
                        value={tierLvl}
                        onChange={e => setTierLevel(idx, Number(e.target.value))}
                        className="w-20 text-center bg-slate-800 border border-slate-700 text-violet-300 text-sm px-2 py-1 focus:outline-none focus:border-violet-500 tabular-nums"
                      />
                    </td>

                    {/* Forja */}
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={config.forja[idx] ?? 0}
                        onChange={e => setCell('forja', idx, Number(e.target.value))}
                        className="w-20 text-center bg-slate-800 border border-slate-700 text-amber-300 text-sm px-2 py-1 focus:outline-none focus:border-amber-500 tabular-nums"
                      />
                    </td>

                    {/* Alquimia */}
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={config.alquimia[idx] ?? 0}
                        onChange={e => setCell('alquimia', idx, Number(e.target.value))}
                        className="w-20 text-center bg-slate-800 border border-slate-700 text-teal-300 text-sm px-2 py-1 focus:outline-none focus:border-teal-500 tabular-nums"
                      />
                    </td>

                    {/* Inscrição */}
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={config.inscricao[idx] ?? 0}
                        onChange={e => setCell('inscricao', idx, Number(e.target.value))}
                        className="w-20 text-center bg-slate-800 border border-slate-700 text-slate-300 text-sm px-2 py-1 focus:outline-none focus:border-slate-500 tabular-nums"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        <strong className="text-slate-500">Nível Mín:</strong> nível mínimo de skill para desbloquear o tier (padrão: T1=1, T2=11, T3=21...).
        {' '}<strong className="text-slate-500">XP:</strong> concedido por craft bem-sucedido naquele tier.
      </p>

      {/* ── Seção: XP por nível ── */}
      <div className="flex items-center gap-3 text-slate-600">
        <span className="text-amber-600 text-xs">✦</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600 tracking-widest uppercase">XP necessário por nível</span>
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-amber-600 text-xs">✦</span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Fórmula: <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5">floor(baseXp × multiplicador^(nível-1))</code>.
        Alterações entram em vigor imediatamente para novos ganhos de XP; o nível atual dos jogadores é mantido.
      </p>

      <div className="flex items-end gap-6 flex-wrap">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Base XP (nível 1)</label>
          <input
            type="number" min={1} step={1}
            value={skillCfg.baseXp}
            onChange={e => setSkillCfg(prev => ({ ...prev, baseXp: Math.max(1, Number(e.target.value)) }))}
            className="w-28 text-center bg-slate-800 border border-slate-700 text-amber-300 text-sm px-2 py-1.5 focus:outline-none focus:border-amber-500 tabular-nums"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Multiplicador</label>
          <input
            type="number" min={1.0} max={5.0} step={0.01}
            value={skillCfg.multiplier}
            onChange={e => setSkillCfg(prev => ({ ...prev, multiplier: Math.max(1, Number(e.target.value)) }))}
            className="w-28 text-center bg-slate-800 border border-slate-700 text-violet-300 text-sm px-2 py-1.5 focus:outline-none focus:border-violet-500 tabular-nums"
          />
        </div>
        <div className="flex items-center gap-3">
          {skillSaved && <span className="text-sm text-teal-400">✓ Salvo.</span>}
          <button
            onClick={handleSaveSkillXp}
            disabled={skillSaving}
            className="px-5 py-2 text-sm font-semibold border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {skillSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Preview tabela */}
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full max-w-lg">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-1.5 px-3 text-slate-600 font-normal w-16">Nível</th>
              <th className="text-right py-1.5 px-3 text-amber-400 font-cinzel tracking-wider">XP Necessário</th>
              <th className="text-right py-1.5 px-3 text-slate-500 font-cinzel tracking-wider">XP Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {previewLevels.map(({ lvl, xp, cum }) => (
              <tr key={lvl} className={lvl % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}>
                <td className="py-1 px-3 text-slate-500 tabular-nums">{lvl}</td>
                <td className="py-1 px-3 text-right text-amber-300 tabular-nums font-medium">{xp.toLocaleString()}</td>
                <td className="py-1 px-3 text-right text-slate-500 tabular-nums">{cum.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-700 mt-2">Preview dos primeiros 30 níveis · atualiza em tempo real.</p>
      </div>
    </div>
  )
}
