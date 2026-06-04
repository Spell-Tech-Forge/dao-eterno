import { useState, useEffect } from 'react'
import { useSectStore, type SectListItem } from '../../store/sectStore'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { RARITY_COLORS } from '../../types'

const ROLE_LABEL: Record<string, string> = {
  founder: '👑 Fundador', elder: '⚔️ Ancião', internal: '🔹 Disc. Interno', external: '⬜ Disc. Externo',
}
const TIER_COLOR: Record<number, string> = { 1: '#78716c', 2: '#14b8a6', 3: '#a78bfa', 4: '#f59e0b' }

interface Props { onBack: () => void }

export function SectScreen({ onBack }: Props) {
  const { sect, loaded, load } = useSectStore()
  const { realm, realmStage, currentLocationId, sectQiBonusPct } = usePlayerStore()
  const { items } = useInventoryStore()
  const itemDefs = useGameDataStore(s => s.items)
  const [tab, setTab] = useState<'info' | 'treasury' | 'members' | 'browse'>('info')
  const [working, setWorking] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Criar seita
  const [createMode, setCreateMode] = useState(false)
  const [sectName, setSectName] = useState('')
  const [sectEmblem, setSectEmblem] = useState('🏛️')
  const [sectMotto, setSectMotto] = useState('')

  // Browse
  const [sects, setSects] = useState<SectListItem[]>([])
  const [loadingBrowse, setLoadingBrowse] = useState(false)

  // Treasury
  const [depositItem, setDepositItem] = useState('')
  const [depositQty, setDepositQty] = useState('1')
  const [withdrawItem, setWithdrawItem] = useState('')
  const [withdrawQty, setWithdrawQty] = useState('1')

  async function doAction(fn: () => Promise<unknown>, successMsg: string) {
    setWorking(true); setMsg(null)
    try {
      await fn(); setMsg({ text: successMsg, ok: true }); await load()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally { setWorking(false) }
  }

  async function loadBrowse() {
    setLoadingBrowse(true)
    try { setSects(await api.get<SectListItem[]>('/api/sects')) } catch {}
    setLoadingBrowse(false)
  }

  useEffect(() => { if (tab === 'browse') loadBrowse() }, [tab])

  const materialItems = items.filter(i => {
    const def = itemDefs[i.definitionId]
    return def && ['material', 'pill', 'talisman', 'receita'].includes(def.type)
  })

  if (!loaded) return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 py-8 text-center text-slate-500">Carregando...</div>
  )

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 bg-slate-950 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors">← Voltar</button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">Seita</h1>
          {sectQiBonusPct > 0 && (
            <p className="text-xs text-teal-400">+{sectQiBonusPct}% taxa de Qi ativo</p>
          )}
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
          {msg.text}
        </div>
      )}

      {/* ── SEM SEITA ── */}
      {!sect && (
        <div className="space-y-4">
          {!createMode ? (
            <div className="border border-slate-700 bg-slate-900 p-6 text-center space-y-4">
              <div className="text-4xl">🏛️</div>
              <p className="text-slate-400 text-sm">Você não pertence a nenhuma seita.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setCreateMode(true)}
                  className="px-4 py-2 text-sm border border-amber-600/60 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-colors font-cinzel tracking-wide"
                >
                  ⚔️ Fundar Seita
                </button>
                <button
                  onClick={() => setTab('browse')}
                  className="px-4 py-2 text-sm border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  🔍 Buscar Seitas
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-amber-700/40 bg-slate-900 p-5 space-y-4">
              <div className="text-sm font-cinzel font-bold text-amber-400 tracking-wider">Fundar Nova Seita</div>
              <p className="text-xs text-slate-500">Requer Pós-Celestial Médio+, 50.000 ouro, 50× Cristal de Qi e 100× Escama de Besta.</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={sectEmblem} onChange={e => setSectEmblem(e.target.value)} maxLength={2}
                    className="w-12 bg-slate-800 border border-slate-700 text-xl text-center py-1.5 focus:outline-none focus:border-amber-600 text-slate-200"
                    placeholder="🏛️" />
                  <input value={sectName} onChange={e => setSectName(e.target.value)} maxLength={40}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:border-amber-600"
                    placeholder="Nome da seita (2-40 caracteres)" />
                </div>
                <input value={sectMotto} onChange={e => setSectMotto(e.target.value)} maxLength={120}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:border-amber-600"
                  placeholder="Lema (opcional)" />
              </div>
              <div className="flex gap-2">
                <button
                  disabled={working || sectName.trim().length < 2}
                  onClick={() => doAction(
                    () => api.post('/api/sects', { name: sectName.trim(), emblem: sectEmblem, motto: sectMotto.trim() || undefined, locationId: currentLocationId }),
                    'Seita fundada com sucesso!'
                  ).then(() => setCreateMode(false))}
                  className="flex-1 py-2 text-sm font-bold border border-amber-600/60 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 disabled:opacity-40 transition-colors"
                >
                  {working ? 'Processando...' : '⚔️ Fundar'}
                </button>
                <button onClick={() => setCreateMode(false)} className="px-4 text-sm border border-slate-700 text-slate-500 hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Browse tab */}
          {tab === 'browse' && (
            <div className="space-y-2">
              {loadingBrowse ? (
                <div className="text-center text-slate-500 py-6 text-sm">Carregando...</div>
              ) : sects.length === 0 ? (
                <div className="text-center text-slate-600 py-6 text-sm">Nenhuma seita encontrada.</div>
              ) : sects.map(s => (
                <div key={s.id} className="border border-slate-700 bg-slate-900 p-3 flex items-center gap-3">
                  <span className="text-2xl">{s.emblem}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 border font-bold" style={{ borderColor: TIER_COLOR[s.tier]+'55', color: TIER_COLOR[s.tier] }}>
                        {s.tier_name}
                      </span>
                    </div>
                    {s.motto && <p className="text-xs text-slate-500 truncate italic">"{s.motto}"</p>}
                    <div className="flex gap-3 mt-0.5 text-xs text-slate-600">
                      <span>👥 {s.member_count} membros</span>
                      <span>🌿 +{s.qi_bonus_pct}% Qi</span>
                      <span>✨ {Number(s.collective_qi).toLocaleString('pt-BR')} Qi coletivo</span>
                    </div>
                  </div>
                  <button
                    disabled={working}
                    onClick={() => doAction(() => api.post(`/api/sects/${s.id}/join`, {}), `Entrou em ${s.name}!`)}
                    className="px-3 py-1.5 text-xs border border-teal-700/60 text-teal-400 hover:bg-teal-950/30 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COM SEITA ── */}
      {sect && (
        <div className="space-y-4">
          {/* Cabeçalho da seita */}
          <div className="border bg-slate-900 p-4" style={{ borderColor: TIER_COLOR[sect.tier]+'55' }}>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{sect.emblem}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-cinzel font-bold text-slate-200 text-base">{sect.name}</span>
                  <span className="text-xs px-2 py-0.5 border font-bold" style={{ borderColor: TIER_COLOR[sect.tier]+'55', color: TIER_COLOR[sect.tier] }}>
                    {sect.tier_name}
                  </span>
                  <span className="text-xs text-teal-400 border border-teal-700/40 px-1.5 py-0.5">+{sect.qi_bonus_pct}% Qi</span>
                </div>
                {sect.motto && <p className="text-xs text-slate-500 italic mt-0.5">"{sect.motto}"</p>}
                <p className="text-xs text-slate-500 mt-1">{ROLE_LABEL[sect.my_role]} · Contribuição: {sect.my_contribution.toLocaleString('pt-BR')} Qi</p>
              </div>
            </div>

            {/* Barra de progresso do tier */}
            {sect.next_tier_threshold && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Qi Coletivo</span>
                  <span>{sect.collective_qi.toLocaleString('pt-BR')} / {sect.next_tier_threshold.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(100, (sect.collective_qi / sect.next_tier_threshold) * 100)}%`,
                    backgroundColor: TIER_COLOR[sect.tier],
                  }} />
                </div>
              </div>
            )}
            {!sect.next_tier_threshold && (
              <p className="mt-2 text-xs text-amber-400">✨ Tier máximo atingido!</p>
            )}

            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>👥 {sect.member_count}/{sect.max_members}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {(['info','treasury','members'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-cinzel tracking-wider transition-colors border-b-2 -mb-px ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {{ info: '📋 Info', treasury: '📦 Almoxarifado', members: '👥 Membros' }[t]}
              </button>
            ))}
          </div>

          {/* ── Tab: Info ── */}
          {tab === 'info' && (
            <div className="space-y-3">
              <div className="border border-slate-700 bg-slate-900 p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Membros</span><div className="text-slate-200 font-bold">{sect.member_count}/{sect.max_members}</div></div>
                <div><span className="text-slate-500">Bônus de Qi</span><div className="text-teal-400 font-bold">+{sect.qi_bonus_pct}%</div></div>
                <div><span className="text-slate-500">Qi Coletivo</span><div className="text-amber-400 font-bold">{sect.collective_qi.toLocaleString('pt-BR')}</div></div>
                <div><span className="text-slate-500">Minha Contribuição</span><div className="text-violet-400 font-bold">{sect.my_contribution.toLocaleString('pt-BR')}</div></div>
              </div>

              {/* Ações */}
              <div className="space-y-2">
                {sect.my_role !== 'founder' && (
                  <button
                    disabled={working}
                    onClick={() => doAction(() => api.delete('/api/sects/leave'), 'Você saiu da seita.')}
                    className="w-full py-2 text-xs border border-red-800/50 text-red-400 hover:bg-red-950/20 disabled:opacity-40 transition-colors"
                  >
                    Sair da Seita
                  </button>
                )}
                {sect.my_role === 'founder' && (
                  <button
                    disabled={working}
                    onClick={() => { if (confirm('Tem certeza que deseja dissolver a seita? Esta ação é irreversível.')) doAction(() => api.delete('/api/sects/disband'), 'Seita dissolvida.') }}
                    className="w-full py-2 text-xs border border-red-800/50 text-red-500 hover:bg-red-950/20 disabled:opacity-40 transition-colors"
                  >
                    💀 Dissolver Seita
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Almoxarifado ── */}
          {tab === 'treasury' && (
            <div className="space-y-4">
              {/* Depositar */}
              <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Depositar</div>
                <div className="flex gap-2">
                  <select value={depositItem} onChange={e => setDepositItem(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-teal-600">
                    <option value="">— Selecionar item —</option>
                    {materialItems.map(i => {
                      const def = itemDefs[i.definitionId]
                      return <option key={i.instanceId} value={i.definitionId}>{def?.emoji} {def?.name} ×{i.quantity}</option>
                    })}
                  </select>
                  <input type="number" min={1} value={depositQty} onChange={e => setDepositQty(e.target.value)}
                    className="w-16 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-teal-600" />
                  <button disabled={working || !depositItem}
                    onClick={() => doAction(() => api.post('/api/sects/deposit', { itemId: depositItem, quantity: Number(depositQty) }), 'Item depositado!')}
                    className="px-3 py-2 text-xs border border-teal-700/60 text-teal-400 hover:bg-teal-950/30 disabled:opacity-40 transition-colors">
                    Depositar
                  </button>
                </div>
              </div>

              {/* Inventário do almoxarifado */}
              <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Almoxarifado da Seita</div>
                {sect.treasury.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">Almoxarifado vazio.</p>
                ) : (
                  <div className="space-y-2">
                    {sect.treasury.map(t => {
                      const def = itemDefs[t.definitionId]
                      const color = def ? RARITY_COLORS[def.rarity] : '#475569'
                      return (
                        <div key={t.definitionId} className="flex items-center gap-2 p-2 border border-slate-800">
                          <span className="text-base">{def?.emoji ?? '📦'}</span>
                          <span className="flex-1 text-xs text-slate-300">{def?.name ?? t.definitionId}</span>
                          <span className="text-xs font-bold tabular-nums" style={{ color }}>×{t.quantity}</span>
                          <div className="flex gap-1 items-center">
                            <input type="number" min={1} max={t.quantity} defaultValue={1}
                              id={`wq-${t.definitionId}`}
                              className="w-14 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-1.5 py-1 focus:outline-none" />
                            <button
                              disabled={working}
                              onClick={() => {
                                const qty = Number((document.getElementById(`wq-${t.definitionId}`) as HTMLInputElement)?.value ?? 1)
                                doAction(() => api.post('/api/sects/withdraw', { itemId: t.definitionId, quantity: qty }), 'Item sacado!')
                              }}
                              className="px-2 py-1 text-[10px] border border-amber-700/50 text-amber-400 hover:bg-amber-950/20 disabled:opacity-40 transition-colors"
                            >Sacar</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Membros ── */}
          {tab === 'members' && (
            <div className="border border-slate-700 bg-slate-900">
              <div className="divide-y divide-slate-800">
                {sect.members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">{m.username}</span>
                        <span className="text-[10px] text-slate-500">{ROLE_LABEL[m.role]}</span>
                      </div>
                      <div className="text-xs text-slate-600">Contribuição: {Number(m.contribution).toLocaleString('pt-BR')} Qi</div>
                    </div>
                    {/* Ações de gestão — apenas fundador/ancião */}
                    {(sect.my_role === 'founder' || sect.my_role === 'elder') && m.user_id !== useAuthStore.getState().user?.id && m.role !== 'founder' && (
                      <div className="flex gap-1">
                        {sect.my_role === 'founder' && m.role !== 'elder' && (
                          <button disabled={working} onClick={() => doAction(() => api.post('/api/sects/promote', { targetUserId: m.user_id, newRole: 'elder' }), 'Promovido a Ancião.')}
                            className="text-[10px] px-2 py-1 border border-violet-700/50 text-violet-400 hover:bg-violet-950/20 disabled:opacity-40">Ancião</button>
                        )}
                        {m.role === 'external' && (
                          <button disabled={working} onClick={() => doAction(() => api.post('/api/sects/promote', { targetUserId: m.user_id, newRole: 'internal' }), 'Promovido a Disc. Interno.')}
                            className="text-[10px] px-2 py-1 border border-teal-700/50 text-teal-400 hover:bg-teal-950/20 disabled:opacity-40">Promover</button>
                        )}
                        {m.role === 'internal' && (
                          <button disabled={working} onClick={() => doAction(() => api.post('/api/sects/promote', { targetUserId: m.user_id, newRole: 'external' }), 'Rebaixado.')}
                            className="text-[10px] px-2 py-1 border border-slate-600 text-slate-400 hover:bg-slate-800 disabled:opacity-40">Rebaixar</button>
                        )}
                        <button disabled={working} onClick={() => doAction(() => api.delete(`/api/sects/kick/${m.user_id}`), `${m.username} foi expulso.`)}
                          className="text-[10px] px-2 py-1 border border-red-800/50 text-red-400 hover:bg-red-950/20 disabled:opacity-40">Expulsar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
