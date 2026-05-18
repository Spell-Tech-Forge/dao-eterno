import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { CraftXpConfig } from '../../utils/forge'

const TIER_LABELS = [
  'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5',
  'Tier 6', 'Tier 7', 'Tier 8', 'Tier 9', 'Tier 10',
]

const DEFAULT_CONFIG: CraftXpConfig = {
  forja:     [10, 25, 50, 90, 140, 200, 280, 380, 520, 700],
  alquimia:  [12, 30, 60, 110, 160, 230, 320, 430, 580, 750],
  inscricao: [8,  20, 40, 70,  110, 160, 230, 310, 420, 580],
}

export function CraftXpPanel() {
  const [config,  setConfig]  = useState<CraftXpConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<CraftXpConfig>('/api/admin/craft-xp-config')
      .then(data => { setConfig(data); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  function setCell(cat: keyof CraftXpConfig, idx: number, val: number) {
    setConfig(prev => {
      const arr = [...prev[cat]]
      arr[idx] = val
      return { ...prev, [cat]: arr }
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
                <th className="text-left py-2 px-3 text-slate-500 font-normal text-xs tracking-widest uppercase w-24">
                  Tier
                </th>
                <th className="py-2 px-3 text-amber-400 font-cinzel text-xs tracking-wider text-center">
                  Forja
                </th>
                <th className="py-2 px-3 text-teal-400 font-cinzel text-xs tracking-wider text-center">
                  Alquimia
                </th>
                <th className="py-2 px-3 text-slate-300 font-cinzel text-xs tracking-wider text-center">
                  Inscrição
                </th>
              </tr>
            </thead>
            <tbody>
              {TIER_LABELS.map((label, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}
                >
                  <td className="py-2 px-3 text-xs text-slate-500 font-medium">{label}</td>

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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        XP concedido ao jogador por cada craft bem-sucedido naquele tier. Índice 0 = Tier 1, índice 9 = Tier 10.
      </p>
    </div>
  )
}
