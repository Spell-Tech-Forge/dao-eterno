import { useState, useEffect } from 'react'
import { useSectStore, type SectListItem } from '../../store/sectStore'
import { usePlayerStore } from '../../store/playerStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { RARITY_COLORS } from '../../types'
import { TrainingScreen } from '../training/TrainingScreen'

const ROLE_LABEL: Record<string, string> = {
  founder: '👑 Fundador', elder: '⚔️ Ancião', internal: '🔹 Disc. Interno', external: '⬜ Disc. Externo',
}
const TIER_COLOR: Record<number, string> = { 1: '#78716c', 2: '#14b8a6', 3: '#a78bfa', 4: '#f59e0b' }

interface Props { onBack: () => void }

export function SectScreen({ onBack }: Props) {
  const { sect, loaded, load } = useSectStore()
  const { currentLocationId, sectQiBonusPct } = usePlayerStore()
  const { items } = useInventoryStore()
  const itemDefs = useGameDataStore(s => s.items)
  const [tab, setTab] = useState<'info'|'treasury'|'library'|'missions'|'shop'|'artifact'|'territory'|'training'|'wars'|'members'|'browse'>('info')
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

  // Biblioteca
  const [libDepositItem, setLibDepositItem] = useState('')
  const [libDepositQty, setLibDepositQty] = useState('1')
  const [library, setLibrary] = useState<{ definitionId: string; quantity: number }[]>([])

  // Missões
  interface Mission { id: number; type: string; mission_kind: string; target_value: number; current_value: number; token_reward: number; extra_reward: null | { itemId: string; quantity: number }; ends_at: string; completed_at: string | null; i_participated: boolean }
  const [missions, setMissions] = useState<Mission[]>([])
  const [myTokens, setMyTokens] = useState(0)
  const [loadingMissions, setLoadingMissions] = useState(false)

  // Loja
  interface ShopItem { itemId: string; tokenCost: number; stock: number }
  const [shop, setShop] = useState<ShopItem[]>([])
  const [shopEdit, setShopEdit] = useState(false)
  const [shopDraft, setShopDraft] = useState<ShopItem[]>([])

  // Guerras
  interface War { id: number; attacker_sect_id: number; defender_sect_id: number; attacker_name: string; defender_name: string; attacker_emblem: string; defender_emblem: string; attacker_points: number; defender_points: number; ends_at: string; resolved: boolean; winner_sect_id: number | null; tribute_gold: string }
  const [wars, setWars] = useState<War[]>([])
  const [mySectId, setMySectId] = useState<number | null>(null)
  const [declareTarget, setDeclareTarget] = useState('')

  // Artefato
  interface ArtifactData { artifact_level: number; artifact_cfg: { emoji: string; levels: { level: number; atkPct: number; hpPct: number; defPct: number; qiRatePct: number; materials: { itemId: string; quantity: number }[] }[] } }
  const [artifactData, setArtifactData] = useState<ArtifactData | null>(null)

  // Território
  interface Territory { biome_id: string; biome_name: string; drop_bonus_pct: number; expires_at: string; sect_name: string }
  interface AllTerritory { biome_id: string; biome_name: string; drop_bonus_pct: number; expires_at: string; sect_name: string; sect_emblem: string }
  const [myTerritory, setMyTerritory] = useState<Territory | null | undefined>(undefined)
  const [allTerritories, setAllTerritories] = useState<AllTerritory[]>([])
  const [claimBiomeId, setClaimBiomeId] = useState('')
  const biomes = useGameDataStore(s => s.biomes)
  const biomeList = Object.values(biomes)

  async function loadMissions() {
    setLoadingMissions(true)
    try { const d = await api.get<{ missions: Mission[]; tokens: number }>('/api/sects/missions'); setMissions(d.missions); setMyTokens(d.tokens) } catch {}
    setLoadingMissions(false)
  }
  async function loadShop() {
    try { const d = await api.get<{ shop: ShopItem[]; tokens: number }>('/api/sects/shop'); setShop(d.shop); setMyTokens(d.tokens) } catch {}
  }
  async function loadWars() {
    try { const d = await api.get<{ wars: War[]; my_sect_id: number }>('/api/sects/wars'); setWars(d.wars); setMySectId(d.my_sect_id) } catch {}
  }

  async function loadArtifact() {
    try { setArtifactData(await api.get<ArtifactData>('/api/sects/artifact')) } catch {}
  }
  async function loadTerritory() {
    try {
      const [mine, all] = await Promise.all([
        api.get<Territory | null>('/api/sects/territory'),
        api.get<AllTerritory[]>('/api/sects/territories/all'),
      ])
      setMyTerritory(mine); setAllTerritories(all)
    } catch {}
  }

  useEffect(() => {
    if (tab === 'missions') loadMissions()
    if (tab === 'shop') loadShop()
    if (tab === 'wars') loadWars()
    if (tab === 'library' && sect) setLibrary(sect.library ?? [])
    if (tab === 'artifact') loadArtifact()
    if (tab === 'territory') loadTerritory()
  }, [tab, sect])

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
              <p className="text-xs text-slate-500">Requer Pré-Celestial Médio+, 50.000 ouro, 50× Cristal de Qi e 100× Escama de Besta.</p>
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
          <div className="flex overflow-x-auto border-b border-slate-700 scrollbar-hide">
            {([
              ['info','📋 Info'], ['treasury','📦 Depósito'], ['library','📚 Biblioteca'],
              ['missions','⚔️ Missões'], ['shop','🎁 Loja'], ['artifact','🏮 Artefato'],
              ['territory','🗺️ Território'], ['training','🥊 Treino'],
              ['wars','💣 Guerras'], ['members','👥 Membros'],
            ] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-cinzel tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {label}
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

              {/* Legados */}
              {sect.legacies && sect.legacies.length > 0 && (
                <div className="border border-slate-700 bg-slate-900 p-4 space-y-2">
                  <div className="text-xs font-cinzel text-slate-500 tracking-widest uppercase">⚰️ Legados de Membros Caídos</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {[...sect.legacies].reverse().map((leg, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-1 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">{leg.charName}</span>
                        <span className="text-slate-600">·</span>
                        <span>{leg.realm}</span>
                        <span className="ml-auto text-violet-400">+{leg.qi.toLocaleString('pt-BR')} Qi coletivo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* ── Tab: Biblioteca ── */}
          {tab === 'library' && (
            <div className="space-y-4">
              <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Depositar Receita</div>
                <div className="flex gap-2">
                  <select value={libDepositItem} onChange={e => setLibDepositItem(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-amber-600">
                    <option value="">— Selecionar receita —</option>
                    {items.filter(i => itemDefs[i.definitionId]?.type === 'receita').map(i => {
                      const def = itemDefs[i.definitionId]
                      return <option key={i.instanceId} value={i.definitionId}>{def?.emoji} {def?.name} ×{i.quantity}</option>
                    })}
                  </select>
                  <input type="number" min={1} value={libDepositQty} onChange={e => setLibDepositQty(e.target.value)}
                    className="w-16 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none" />
                  <button disabled={working || !libDepositItem}
                    onClick={() => doAction(
                      async () => { const r = await api.post<{ library: typeof library }>('/api/sects/library/deposit', { itemId: libDepositItem, quantity: Number(libDepositQty) }); setLibrary(r.library) },
                      'Receita depositada!'
                    )}
                    className="px-3 py-2 text-xs border border-amber-700/60 text-amber-400 hover:bg-amber-950/20 disabled:opacity-40 transition-colors">
                    Depositar
                  </button>
                </div>
              </div>
              <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Receitas Disponíveis</div>
                {library.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">Biblioteca vazia. Deposite receitas para seus companheiros de seita.</p>
                ) : library.map(t => {
                  const def = itemDefs[t.definitionId]
                  const color = def ? RARITY_COLORS[def.rarity] : '#475569'
                  const recipeId = t.definitionId.replace(/^receita_/, '')
                  const alreadyKnown = usePlayerStore.getState().unlockedRecipes.includes(recipeId)
                  return (
                    <div key={t.definitionId} className="flex items-center gap-2 p-2 border border-slate-800">
                      <span className="text-base">{def?.emoji ?? '📜'}</span>
                      <span className="flex-1 text-xs text-slate-300">{def?.name ?? t.definitionId}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color }}>×{t.quantity}</span>
                      <button
                        disabled={working || alreadyKnown}
                        onClick={() => doAction(
                          async () => { const r = await api.post<{ library: typeof library; unlocked_recipes: string[] }>('/api/sects/library/learn', { itemId: t.definitionId }); setLibrary(r.library); usePlayerStore.setState({ unlockedRecipes: r.unlocked_recipes }) },
                          alreadyKnown ? 'Já aprendida.' : 'Receita aprendida!'
                        )}
                        className="px-2 py-1 text-[10px] border border-teal-700/50 text-teal-400 hover:bg-teal-950/20 disabled:opacity-40 transition-colors">
                        {alreadyKnown ? '✓ Aprendida' : 'Aprender'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tab: Missões ── */}
          {tab === 'missions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Seus tokens: <span className="text-amber-400 font-bold">🏅 {myTokens}</span></span>
                <button onClick={loadMissions} className="text-xs text-slate-500 hover:text-slate-300">↻ Atualizar</button>
              </div>
              {loadingMissions ? (
                <div className="text-center text-slate-500 py-6 text-sm">Carregando...</div>
              ) : missions.length === 0 ? (
                <div className="text-center text-slate-600 py-6 text-sm">Nenhuma missão ativa.</div>
              ) : (
                <div className="space-y-2">
                  {(['daily','weekly'] as const).map(type => {
                    const typeMissions = missions.filter(m => m.type === type)
                    if (!typeMissions.length) return null
                    return (
                      <div key={type} className="border border-slate-700 bg-slate-900">
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 text-xs font-cinzel tracking-widest uppercase text-slate-500">
                          {type === 'daily' ? '📅 Missão Diária' : '📆 Missão Semanal'}
                        </div>
                        <div className="divide-y divide-slate-800">
                          {typeMissions.map(m => {
                            const pct = Math.min(100, (m.current_value / m.target_value) * 100)
                            const kindLabel: Record<string, string> = { kills: 'Kills', qi: 'Qi Coletivo', crafts: 'Crafts' }
                            const done = !!m.completed_at
                            const endsIn = Math.max(0, new Date(m.ends_at).getTime() - Date.now())
                            const endsHrs = Math.floor(endsIn / 3600000)
                            return (
                              <div key={m.id} className={`px-4 py-3 space-y-2 ${done ? 'opacity-60' : ''}`}>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-200">{kindLabel[m.mission_kind] ?? m.mission_kind}</span>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {done ? <span className="text-teal-400">✓ Concluída</span> : <span>⏳ {endsHrs}h restantes</span>}
                                    <span className="text-amber-400">🏅 +{m.token_reward}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-slate-500">
                                    <span>{m.current_value.toLocaleString('pt-BR')} / {m.target_value.toLocaleString('pt-BR')}</span>
                                    <span>{pct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: done ? '#22c55e' : '#a78bfa' }} />
                                  </div>
                                </div>
                                {m.extra_reward && <p className="text-[10px] text-slate-600">+ {itemDefs[m.extra_reward.itemId]?.name ?? m.extra_reward.itemId} ×{m.extra_reward.quantity}</p>}
                                {m.i_participated && !done && <p className="text-[10px] text-teal-500">✓ Você contribuiu</p>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Loja ── */}
          {tab === 'shop' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Seus tokens: <span className="text-amber-400 font-bold">🏅 {myTokens}</span></span>
                {(sect.my_role === 'founder' || sect.my_role === 'elder') && (
                  <button onClick={() => { setShopEdit(!shopEdit); setShopDraft([...shop]) }}
                    className="text-xs border border-slate-600 text-slate-400 px-2 py-1 hover:bg-slate-800 transition-colors">
                    {shopEdit ? '✕ Cancelar' : '⚙️ Editar Loja'}
                  </button>
                )}
              </div>

              {shopEdit ? (
                <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                  <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Configurar Loja</div>
                  {shopDraft.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={s.itemId} onChange={e => setShopDraft(d => d.map((x, j) => j === i ? { ...x, itemId: e.target.value } : x))}
                        className="flex-1 bg-slate-800 border border-slate-700 text-xs px-2 py-1.5 text-slate-200 focus:outline-none" placeholder="ID do item" />
                      <input type="number" value={s.tokenCost} onChange={e => setShopDraft(d => d.map((x, j) => j === i ? { ...x, tokenCost: Number(e.target.value) } : x))}
                        className="w-16 bg-slate-800 border border-slate-700 text-xs px-2 py-1.5 text-slate-200 focus:outline-none" placeholder="Tokens" />
                      <input type="number" value={s.stock} onChange={e => setShopDraft(d => d.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) } : x))}
                        className="w-16 bg-slate-800 border border-slate-700 text-xs px-2 py-1.5 text-slate-200 focus:outline-none" placeholder="Estoque (-1=∞)" />
                      <button onClick={() => setShopDraft(d => d.filter((_, j) => j !== i))} className="text-red-400 text-xs px-1">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setShopDraft(d => [...d, { itemId: '', tokenCost: 10, stock: -1 }])}
                    className="text-xs border border-slate-700 text-slate-400 px-3 py-1 hover:bg-slate-800 w-full">+ Adicionar item</button>
                  <button disabled={working} onClick={() => doAction(async () => { await api.post('/api/sects/shop/configure', { shop: shopDraft }); setShop(shopDraft); setShopEdit(false) }, 'Loja configurada!')}
                    className="text-xs border border-teal-700/60 text-teal-400 px-3 py-1.5 hover:bg-teal-950/20 w-full disabled:opacity-40">Salvar</button>
                </div>
              ) : shop.length === 0 ? (
                <div className="text-center text-slate-600 py-6 text-sm">Loja vazia.{(sect.my_role === 'founder' || sect.my_role === 'elder') && ' Configure itens para venda.'}</div>
              ) : (
                <div className="space-y-2">
                  {shop.map(s => {
                    const def = itemDefs[s.itemId]
                    return (
                      <div key={s.itemId} className="border border-slate-700 bg-slate-900 p-3 flex items-center gap-3">
                        <span className="text-xl">{def?.emoji ?? '❓'}</span>
                        <div className="flex-1">
                          <div className="text-sm text-slate-200">{def?.name ?? s.itemId}</div>
                          <div className="text-xs text-slate-500">Estoque: {s.stock === -1 ? '∞' : s.stock}</div>
                        </div>
                        <div className="text-amber-400 font-bold text-sm">🏅 {s.tokenCost}</div>
                        <button disabled={working || myTokens < s.tokenCost || s.stock === 0}
                          onClick={() => doAction(() => api.post('/api/sects/shop/buy', { itemId: s.itemId, quantity: 1 }), `${def?.name ?? s.itemId} comprado!`).then(loadShop)}
                          className="px-3 py-1.5 text-xs border border-amber-700/60 text-amber-400 hover:bg-amber-950/20 disabled:opacity-40 transition-colors">
                          Comprar
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Artefato ── */}
          {tab === 'artifact' && (
            <div className="space-y-4">
              {!artifactData ? (
                <div className="text-center text-slate-500 py-6 text-sm">Carregando...</div>
              ) : (
                <>
                  <div className="border bg-slate-900 p-5 text-center space-y-2" style={{ borderColor: TIER_COLOR[sect.tier]+'55' }}>
                    <div className="text-5xl">{artifactData.artifact_cfg.emoji}</div>
                    <div className="font-cinzel font-bold text-slate-200 text-base">Artefato da Seita</div>
                    <div className="text-xs text-slate-500">Nível {artifactData.artifact_level} / {artifactData.artifact_cfg.levels.length}</div>
                    {artifactData.artifact_level > 0 && (() => {
                      const b = artifactData.artifact_cfg.levels[artifactData.artifact_level - 1]
                      return (
                        <div className="flex gap-3 justify-center text-xs flex-wrap">
                          {b.atkPct > 0 && <span className="text-orange-400 border border-orange-700/40 px-2 py-0.5">+{b.atkPct}% ATK</span>}
                          {b.hpPct > 0 && <span className="text-green-400 border border-green-700/40 px-2 py-0.5">+{b.hpPct}% HP</span>}
                          {b.defPct > 0 && <span className="text-violet-400 border border-violet-700/40 px-2 py-0.5">+{b.defPct}% DEF</span>}
                          {b.qiRatePct > 0 && <span className="text-teal-400 border border-teal-700/40 px-2 py-0.5">+{b.qiRatePct}% Qi</span>}
                        </div>
                      )
                    })()}
                  </div>
                  {artifactData.artifact_level < artifactData.artifact_cfg.levels.length && (() => {
                    const next = artifactData.artifact_cfg.levels[artifactData.artifact_level]
                    return (
                      <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                        <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Próximo Nível — {next.level}</div>
                        <div className="flex gap-2 flex-wrap text-xs">
                          {next.atkPct > 0 && <span className="text-orange-300">→ +{next.atkPct}% ATK</span>}
                          {next.hpPct > 0 && <span className="text-green-300">→ +{next.hpPct}% HP</span>}
                          {next.defPct > 0 && <span className="text-violet-300">→ +{next.defPct}% DEF</span>}
                          {next.qiRatePct > 0 && <span className="text-teal-300">→ +{next.qiRatePct}% Qi</span>}
                        </div>
                        <div className="text-xs text-slate-500">Materiais necessários:</div>
                        <div className="flex gap-2 flex-wrap">
                          {next.materials.map(m => {
                            const def = itemDefs[m.itemId]
                            const have = items.filter(i => i.definitionId === m.itemId).reduce((s: number, i) => s + (i.quantity ?? 0), 0)
                            const ok = have >= m.quantity
                            return (
                              <span key={m.itemId} className="text-xs px-2 py-0.5 border bg-slate-800"
                                style={{ borderColor: ok ? '#22c55e55' : '#ef444455', color: ok ? '#22c55e' : '#ef4444' }}>
                                {def?.emoji} {def?.name ?? m.itemId} {have}/{m.quantity}
                              </span>
                            )
                          })}
                        </div>
                        {(() => {
                          const canUpgrade = next.materials.every(m =>
                            items.filter(i => i.definitionId === m.itemId).reduce((s: number, i) => s + (i.quantity ?? 0), 0) >= m.quantity
                          )
                          return canUpgrade ? (
                            <button disabled={working}
                              onClick={() => doAction(() => api.post('/api/sects/artifact/upgrade', {}).then(loadArtifact), `Artefato elevado ao nível ${next.level}!`)}
                              className="w-full py-2 text-sm font-bold border border-amber-600/60 text-amber-400 bg-amber-950/10 hover:bg-amber-950/30 disabled:opacity-40 transition-colors">
                              🏮 Melhorar Artefato
                            </button>
                          ) : (
                            <p className="text-xs text-slate-600 text-center">Materiais insuficientes para melhorar.</p>
                          )
                        })()}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Território ── */}
          {tab === 'territory' && (
            <div className="space-y-4">
              {myTerritory && (
                <div className="border border-teal-700/50 bg-teal-950/20 p-4 space-y-2">
                  <div className="text-xs font-cinzel text-teal-400 tracking-widest uppercase">Território Controlado</div>
                  <div className="text-sm font-bold text-slate-200">{myTerritory.biome_name ?? myTerritory.biome_id}</div>
                  <div className="text-xs text-slate-400">+{myTerritory.drop_bonus_pct}% drops · Expira: {new Date(myTerritory.expires_at).toLocaleDateString('pt-BR')}</div>
                </div>
              )}
              <div className="border border-slate-700 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Reivindicar Bioma (500 tokens)</div>
                <div className="flex gap-2">
                  <select value={claimBiomeId} onChange={e => setClaimBiomeId(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-amber-600">
                    <option value="">— Selecionar bioma —</option>
                    {biomeList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button disabled={working || !claimBiomeId}
                    onClick={() => doAction(() => api.post('/api/sects/territory/claim', { biomeId: claimBiomeId }).then(loadTerritory), 'Território reivindicado!')}
                    className="px-3 py-2 text-xs border border-amber-700/60 text-amber-400 hover:bg-amber-950/20 disabled:opacity-40 transition-colors">
                    🗺️ Reivindicar
                  </button>
                </div>
              </div>
              {allTerritories.length > 0 && (
                <div className="border border-slate-700 bg-slate-900 p-4 space-y-2">
                  <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Territórios Ativos no Mundo</div>
                  {allTerritories.map(t => (
                    <div key={t.biome_id} className="flex items-center gap-2 text-xs py-1.5 border-b border-slate-800">
                      <span>{t.sect_emblem}</span>
                      <span className="flex-1 text-slate-300">{t.biome_name ?? t.biome_id}</span>
                      <span className="text-slate-500">{t.sect_name}</span>
                      <span className="text-teal-400">+{t.drop_bonus_pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Treino ── */}
          {tab === 'training' && (
            <TrainingScreen
              onBack={() => setTab('info')}
              dummyHp={[500000, 2000000, 10000000, 50000000][sect.tier - 1] ?? 500000}
              title={`Manequim da Seita — ${sect.tier_name}`}
            />
          )}

          {/* ── Tab: Guerras ── */}
          {tab === 'wars' && (
            <div className="space-y-3">
              {sect.my_role === 'founder' && (
                <div className="border border-slate-700 bg-slate-900 p-4 space-y-2">
                  <div className="text-xs font-cinzel text-slate-400 tracking-widest uppercase">Declarar Guerra</div>
                  <div className="flex gap-2">
                    <input value={declareTarget} onChange={e => setDeclareTarget(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-red-600"
                      placeholder="ID da seita alvo (número)" type="number" />
                    <button disabled={working || !declareTarget}
                      onClick={() => doAction(() => api.post('/api/sects/wars/declare', { defenderSectId: Number(declareTarget) }), 'Guerra declarada!').then(loadWars)}
                      className="px-3 py-2 text-xs border border-red-700/60 text-red-400 hover:bg-red-950/20 disabled:opacity-40 transition-colors">
                      ⚔️ Declarar
                    </button>
                  </div>
                </div>
              )}
              {wars.length === 0 ? (
                <div className="text-center text-slate-600 py-6 text-sm">Nenhuma guerra ativa ou recente.</div>
              ) : wars.map(w => {
                const isAttacker = w.attacker_sect_id === mySectId
                const myPoints = isAttacker ? w.attacker_points : w.defender_points
                const oppPoints = isAttacker ? w.defender_points : w.attacker_points
                const oppName = isAttacker ? w.defender_name : w.attacker_name
                const oppEmoji = isAttacker ? w.defender_emblem : w.attacker_emblem
                const endsIn = Math.max(0, new Date(w.ends_at).getTime() - Date.now())
                const endsHrs = Math.floor(endsIn / 3600000)
                const won = w.resolved && w.winner_sect_id === mySectId
                return (
                  <div key={w.id} className={`border p-4 space-y-2 ${w.resolved ? 'border-slate-700 opacity-70' : 'border-red-700/40 bg-red-950/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{oppEmoji}</span>
                      <div className="flex-1">
                        <span className="font-bold text-slate-200 text-sm">vs {oppName}</span>
                        {w.resolved ? (
                          <div className="text-xs mt-0.5">{won ? <span className="text-teal-400">✓ Vitória — tributo: {Number(w.tribute_gold).toLocaleString('pt-BR')} ouro</span> : <span className="text-red-400">✗ Derrota</span>}</div>
                        ) : <div className="text-xs text-slate-500">⏳ Encerra em {endsHrs}h</div>}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>Seus pontos: <span className="text-amber-400 font-bold">{myPoints}</span></span>
                      <span>Oponente: <span className="text-slate-300 font-bold">{oppPoints}</span></span>
                    </div>
                    {!w.resolved && endsIn <= 0 && (
                      <button disabled={working}
                        onClick={() => doAction(() => api.post(`/api/sects/wars/${w.id}/resolve`, {}), 'Guerra resolvida!').then(loadWars)}
                        className="text-xs border border-teal-700/60 text-teal-400 px-3 py-1 hover:bg-teal-950/20 disabled:opacity-40 w-full">
                        Resolver Guerra
                      </button>
                    )}
                  </div>
                )
              })}
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
