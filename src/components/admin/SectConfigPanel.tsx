import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'

interface SectTierCfg { tier: number; name: string; qiBonusPct: number; maxMembers: number; qiThreshold: number }
interface SectCfg {
  founding: { minRealm: string; minStage: string; goldCost: number; materials: { itemId: string; quantity: number }[] }
  tiers: SectTierCfg[]
  dailyWithdraw: Record<string, number>
  qiContributionPct: number
  library?: { dailyLearnLimit: Record<string, number> }
  training?: { hpByTier: number[] }
  missions?: Record<string, { min?: number; max?: number; tokenReward?: number }>
  wars?: { durationDays: number; tributePct: number; minTierToAttack: number }
}

interface AdminSect {
  id: number; name: string; emblem: string; tier: number; collective_qi: string | number
  member_count: number; founder_name: string | null; created_at: string
}

const ROLES = ['external', 'internal', 'elder', 'founder'] as const
const ROLE_LABELS: Record<string, string> = { external: 'Disc. Externo', internal: 'Disc. Interno', elder: 'Ancião', founder: 'Fundador' }

const inp = 'w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600'

export function SectConfigPanel({ onMutate }: { onMutate: () => void }) {
  const [cfg, setCfg] = useState<SectCfg | null>(null)
  const [sects, setSects] = useState<AdminSect[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'config' | 'sects'>('config')

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      api.get<SectCfg>('/api/admin/sect-config'),
      api.get<AdminSect[]>('/api/admin/sects'),
    ])
    setCfg(c); setSects(s)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!cfg) return
    setSaving(true); setMsg(null)
    try {
      await api.post('/api/admin/sect-config', cfg)
      setMsg({ text: 'Configuração salva!', ok: true })
      onMutate()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally { setSaving(false) }
  }

  async function deleteSect(id: number, name: string) {
    if (!confirm(`Dissolver seita "${name}"? Esta ação é irreversível.`)) return
    try {
      await api.delete(`/api/admin/sects/${id}`)
      await load(); onMutate()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro') }
  }

  if (!cfg) return <div className="text-slate-500 text-sm text-center py-8">Carregando...</div>

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['config','sects'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider border-b-2 -mb-px transition-colors ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {{ config: '⚙️ Configurações', sects: '🏛️ Seitas Ativas' }[t]}
          </button>
        ))}
      </div>

      {/* ── Config ── */}
      {tab === 'config' && (
        <div className="space-y-5">

          {/* Fundação */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Requisitos de Fundação
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Reino mínimo</label>
                <input className={inp} value={cfg.founding.minRealm}
                  onChange={e => setCfg(c => c ? { ...c, founding: { ...c.founding, minRealm: e.target.value } } : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Estágio mínimo</label>
                <input className={inp} value={cfg.founding.minStage}
                  onChange={e => setCfg(c => c ? { ...c, founding: { ...c.founding, minStage: e.target.value } } : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Custo em Ouro</label>
                <input type="number" className={inp} value={cfg.founding.goldCost}
                  onChange={e => setCfg(c => c ? { ...c, founding: { ...c.founding, goldCost: Number(e.target.value) } } : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">% Qi → Coletivo (por kill)</label>
                <input type="number" step="0.1" min="0" max="100" className={inp} value={cfg.qiContributionPct}
                  onChange={e => setCfg(c => c ? { ...c, qiContributionPct: Number(e.target.value) } : c)} />
              </div>
            </div>
            <div className="px-4 pb-3 space-y-2">
              <div className="text-xs text-slate-500">Materiais de fundação</div>
              {cfg.founding.materials.map((mat, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inp} value={mat.itemId}
                    onChange={e => setCfg(c => { if (!c) return c; const mats = [...c.founding.materials]; mats[i] = { ...mats[i], itemId: e.target.value }; return { ...c, founding: { ...c.founding, materials: mats } } })}
                    placeholder="ID do item" />
                  <input type="number" className="w-24 bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-teal-600" value={mat.quantity}
                    onChange={e => setCfg(c => { if (!c) return c; const mats = [...c.founding.materials]; mats[i] = { ...mats[i], quantity: Number(e.target.value) }; return { ...c, founding: { ...c.founding, materials: mats } } })} />
                </div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Tiers da Seita
            </div>
            <div className="px-4 py-3 space-y-3">
              {cfg.tiers.map((tier, i) => (
                <div key={tier.tier} className="grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">T{tier.tier} Nome</label>
                    <input className={inp} value={tier.name}
                      onChange={e => setCfg(c => { if (!c) return c; const t = [...c.tiers]; t[i] = { ...t[i], name: e.target.value }; return { ...c, tiers: t } })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Bônus Qi %</label>
                    <input type="number" className={inp} value={tier.qiBonusPct}
                      onChange={e => setCfg(c => { if (!c) return c; const t = [...c.tiers]; t[i] = { ...t[i], qiBonusPct: Number(e.target.value) }; return { ...c, tiers: t } })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Máx. Membros</label>
                    <input type="number" className={inp} value={tier.maxMembers}
                      onChange={e => setCfg(c => { if (!c) return c; const t = [...c.tiers]; t[i] = { ...t[i], maxMembers: Number(e.target.value) }; return { ...c, tiers: t } })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Qi p/ subir</label>
                    <input type="number" className={inp} value={tier.qiThreshold}
                      onChange={e => setCfg(c => { if (!c) return c; const t = [...c.tiers]; t[i] = { ...t[i], qiThreshold: Number(e.target.value) }; return { ...c, tiers: t } })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limite de saque diário */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Limite de Saque Diário (itens) · -1 = ilimitado
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              {ROLES.map(role => (
                <div key={role} className="space-y-1">
                  <label className="text-xs text-slate-500">{ROLE_LABELS[role]}</label>
                  <input type="number" min={-1} className={inp} value={cfg.dailyWithdraw[role] ?? 0}
                    onChange={e => setCfg(c => c ? { ...c, dailyWithdraw: { ...c.dailyWithdraw, [role]: Number(e.target.value) } } : c)} />
                </div>
              ))}
            </div>
          </div>

          {/* Biblioteca */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Biblioteca de Técnicas — Limite Diário de Aprendizado
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              {ROLES.map(role => (
                <div key={role} className="space-y-1">
                  <label className="text-xs text-slate-500">{ROLE_LABELS[role]}</label>
                  <input type="number" min={-1} className={inp} value={(cfg as any).library?.dailyLearnLimit?.[role] ?? 1}
                    onChange={e => setCfg(c => c ? { ...c, library: { ...c.library, dailyLearnLimit: { ...(c as any).library?.dailyLearnLimit, [role]: Number(e.target.value) } } } as any : c)} />
                </div>
              ))}
            </div>
          </div>

          {/* Sala de Treino */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Sala de Treino — HP do Manequim por Tier
            </div>
            <div className="px-4 py-3 grid grid-cols-4 gap-3">
              {[1,2,3,4].map(tier => (
                <div key={tier} className="space-y-1">
                  <label className="text-xs text-slate-500">T{tier} HP</label>
                  <input type="number" className={inp} value={(cfg as any).training?.hpByTier?.[tier-1] ?? 500000}
                    onChange={e => setCfg(c => { if (!c) return c; const hp = [...((c as any).training?.hpByTier ?? [500000,2000000,10000000,50000000])]; hp[tier-1] = Number(e.target.value); return { ...c, training: { ...((c as any).training ?? {}), hpByTier: hp } } as any })} />
                </div>
              ))}
            </div>
          </div>

          {/* Missões */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Missões — Recompensas de Tokens
            </div>
            <div className="px-4 py-3 space-y-2">
              {(['dailyKills','dailyQi','dailyCrafts','weeklyKills','weeklyQi','weeklyCrafts'] as const).map(key => (
                <div key={key} className="grid grid-cols-3 gap-2 items-end">
                  <label className="text-xs text-slate-500 col-span-1">{key}</label>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Mín</label>
                    <input type="number" className={inp} value={(cfg as any).missions?.[key]?.min ?? 0}
                      onChange={e => setCfg(c => c ? { ...c, missions: { ...(c as any).missions, [key]: { ...(c as any).missions?.[key], min: Number(e.target.value) } } } as any : c)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Tokens</label>
                    <input type="number" className={inp} value={(cfg as any).missions?.[key]?.tokenReward ?? 10}
                      onChange={e => setCfg(c => c ? { ...c, missions: { ...(c as any).missions, [key]: { ...(c as any).missions?.[key], tokenReward: Number(e.target.value) } } } as any : c)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guerras */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Guerras de Seita
            </div>
            <div className="px-4 py-3 grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Duração (dias)</label>
                <input type="number" className={inp} value={(cfg as any).wars?.durationDays ?? 7}
                  onChange={e => setCfg(c => c ? { ...c, wars: { ...(c as any).wars, durationDays: Number(e.target.value) } } as any : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Tributo (%Qi)</label>
                <input type="number" className={inp} value={(cfg as any).wars?.tributePct ?? 5}
                  onChange={e => setCfg(c => c ? { ...c, wars: { ...(c as any).wars, tributePct: Number(e.target.value) } } as any : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Tier mínimo p/ atacar</label>
                <input type="number" min={1} max={4} className={inp} value={(cfg as any).wars?.minTierToAttack ?? 1}
                  onChange={e => setCfg(c => c ? { ...c, wars: { ...(c as any).wars, minTierToAttack: Number(e.target.value) } } as any : c)} />
              </div>
            </div>
          </div>

          {/* Território */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Território
            </div>
            <div className="px-4 py-3 grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Duração (dias)</label>
                <input type="number" className={inp} value={(cfg as any).territory?.durationDays ?? 7}
                  onChange={e => setCfg(c => c ? { ...c, territory: { ...(c as any).territory, durationDays: Number(e.target.value) } } as any : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Bônus de Drop %</label>
                <input type="number" className={inp} value={(cfg as any).territory?.dropBonusPct ?? 20}
                  onChange={e => setCfg(c => c ? { ...c, territory: { ...(c as any).territory, dropBonusPct: Number(e.target.value) } } as any : c)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Custo em Tokens</label>
                <input type="number" className={inp} value={(cfg as any).territory?.claimTokenCost ?? 500}
                  onChange={e => setCfg(c => c ? { ...c, territory: { ...(c as any).territory, claimTokenCost: Number(e.target.value) } } as any : c)} />
              </div>
            </div>
          </div>

          {/* Herança */}
          <div className="border border-slate-700 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
              Herança de Seita (% do Qi acumulado ao morrer)
            </div>
            <div className="px-4 py-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">% do Qi acumulado → coletivo da seita</label>
                <input type="number" min={0} max={100} className={inp} value={(cfg as any).inheritance?.qiPct ?? 5}
                  onChange={e => setCfg(c => c ? { ...c, inheritance: { ...(c as any).inheritance, qiPct: Number(e.target.value) } } as any : c)} />
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-2.5 text-sm font-bold border border-teal-700/60 text-teal-400 bg-teal-950/10 hover:bg-teal-950/30 disabled:opacity-40 transition-colors">
            {saving ? 'Salvando...' : '💾 Salvar Configuração'}
          </button>
        </div>
      )}

      {/* ── Seitas Ativas ── */}
      {tab === 'sects' && (
        <div className="border border-slate-700 bg-slate-900">
          {sects.length === 0 ? (
            <div className="text-center text-slate-600 py-8 text-sm">Nenhuma seita criada ainda.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {sects.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{s.emblem}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{s.name}</span>
                      <span className="text-xs text-slate-500">Tier {s.tier}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-x-3">
                      <span>👑 {s.founder_name ?? '—'}</span>
                      <span>👥 {s.member_count} membros</span>
                      <span>✨ {Number(s.collective_qi).toLocaleString('pt-BR')} Qi</span>
                    </div>
                  </div>
                  <button onClick={() => deleteSect(s.id, s.name)}
                    className="text-xs px-2 py-1 border border-red-800/50 text-red-400 hover:bg-red-950/20 transition-colors">
                    Dissolver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
