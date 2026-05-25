import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import { SpriteImg } from '../ui/SpriteImg'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import { effectiveRarity } from '../../utils/forge'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: number
  username: string
  email: string
  is_admin: boolean
  created_at: string
  banned_at: string | null
  ban_reason: string | null
  char_id: number | null
  char_name: string | null
  realm: string | null
  realm_stage: string | null
  realm_level: number | null
  cultivation_power: number | null
  spirit_gold: string | null
  strength: number | null
  agility: number | null
  vitality: number | null
  defense: number | null
  perception: number | null
  luck: number | null
  hp_current: number | null
  hp_max: number | null
  qi_current: number | null
  qi_max: number | null
  last_played_at: string | null
  char_created_at: string | null
}

interface InventoryItem {
  instanceId: string
  definitionId: string
  quantity: number
  upgradeLevel?: number
  ascensionTier?: number
  durability?: number
}

interface CharacterFull {
  id: number
  name: string
  realm: string
  realm_stage: string
  realm_level: number
  cultivation_power: string | number
  spirit_gold: string | number
  hp_current: number
  hp_max: number
  qi_current: number
  qi_max: number
  strength: number
  agility: number
  vitality: number
  defense: number
  perception: number
  luck: number
  affinity: string
  gender: string
  created_at: string
  last_played_at: string
  inventory: {
    items: InventoryItem[]
    equipped: { weapon: InventoryItem | null; armor: InventoryItem | null; accessory: InventoryItem | null; ring: InventoryItem | null }
    maxSlots: number
  } | null
  skills: { data?: { id: string; level: number; xp: number }[] } | null
}

interface Legend {
  id: number
  name: string
  realm: string
  realm_stage: string
  realm_level: number
  cultivation_power: string | number
  total_kills: number
  cause_of_death: string
  born_at: string
  died_at: string
}

interface DetailedUser {
  user: {
    id: number; username: string; email: string
    is_admin: boolean; created_at: string; pending_gold: string
    banned_at: string | null; ban_reason: string | null
  }
  characters: CharacterFull[]
  legends: Legend[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REALM_LABELS: Record<string, string> = {
  qi_refining: 'Refinamento de Qi', foundation_building: 'Construção da Fundação',
  core_formation: 'Formação do Núcleo', nascent_soul: 'Alma Nascente',
  spirit_severing: 'Separação do Espírito', void_refinement: 'Refinamento do Vazio',
  body_integration: 'Integração Corporal', mahayana: 'Mahayana', immortal: 'Imortal',
}
const STAGE_LABELS: Record<string, string> = {
  initial: 'Inicial', early: 'Inicial Avançado', middle: 'Médio', late: 'Tardio',
}
const SKILL_LABELS: Record<string, string> = {
  forging: 'Forja', alchemy: 'Alquimia', inscription: 'Inscrição', meditation: 'Meditação',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StatPill({ label, value, color = '#94a3b8' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 border border-slate-700 bg-slate-900 min-w-[60px]">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold tabular-nums mt-0.5" style={{ color }}>{value}</span>
    </div>
  )
}

// ── Modal de detalhe ──────────────────────────────────────────────────────────

function DetailModal({
  userId, onClose, onAction,
}: {
  userId: number
  onClose: () => void
  onAction: () => void
}) {
  const [detail, setDetail]       = useState<DetailedUser | null>(null)
  const [loading, setLoading]     = useState(true)
  const [banReason, setBanReason] = useState('')
  const [confirmDel, setConfirmDel]         = useState(false)
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null)
  const [working, setWorking]               = useState(false)
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null)
  const [qiInput, setQiInput]     = useState('')
  const [goldInput, setGoldInput] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [itemToGive, setItemToGive] = useState('')
  const [itemQty, setItemQty]       = useState('1')
  const [statsInputs, setStatsInputs]   = useState<Record<string, string>>({})
  const [skillInputs, setSkillInputs]   = useState<Record<string, string>>({})
  const itemDefs = useGameDataStore(s => s.items)

  useEffect(() => {
    setLoading(true)
    api.get<DetailedUser>(`/api/admin/users/${userId}`)
      .then(setDetail)
      .catch(() => setMsg({ text: 'Erro ao carregar detalhes.', ok: false }))
      .finally(() => setLoading(false))
  }, [userId])

  async function doAction(fn: () => Promise<unknown>, successMsg: string) {
    setWorking(true); setMsg(null)
    try {
      await fn()
      setMsg({ text: successMsg, ok: true })
      onAction()
      // Reload detail
      const updated = await api.get<DetailedUser>(`/api/admin/users/${userId}`)
      setDetail(updated)
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro.', ok: false })
    } finally {
      setWorking(false)
    }
  }

  const char = detail?.characters[0] ?? null
  const inv  = char?.inventory ?? null
  const equipped = inv?.equipped
  const items    = inv?.items ?? []
  const skills   = char?.skills?.data ?? []

  const allItemsSorted = Object.values(itemDefs)
    .filter(d => !itemSearch || d.name.toLowerCase().includes(itemSearch.toLowerCase()) || d.id.includes(itemSearch.toLowerCase()))
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))

  const materialItems = items.filter(i => {
    const def = itemDefs[i.definitionId]
    return def?.type === 'material' || def?.type === 'pill' || def?.type === 'talisman'
  })
  const equipItems = items.filter(i => {
    const def = itemDefs[i.definitionId]
    return def?.type === 'weapon' || def?.type === 'armor' || def?.type === 'accessory' || def?.type === 'ring'
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-950 border border-slate-700 w-full max-w-3xl my-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 sticky top-0 bg-slate-950 z-10">
          <span className="font-cinzel font-bold text-amber-400 tracking-wider text-sm">
            Detalhes do Jogador
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">Carregando...</div>
        ) : !detail ? (
          <div className="flex items-center justify-center py-16 text-red-400">Erro ao carregar.</div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Feedback */}
            {msg && (
              <div className={`text-sm px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-800 text-red-400 bg-red-950/20'}`}>
                {msg.text}
              </div>
            )}

            {/* Info do usuário */}
            <div className="border border-slate-700 bg-slate-900">
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
                <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Conta</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-500 w-20 shrink-0">Username</span>
                  <span className="text-slate-200 font-bold">{detail.user.username}</span>
                  {detail.user.is_admin && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-amber-500/50 text-amber-400 font-bold">ADMIN</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 w-20 shrink-0">E-mail</span>
                  <span className="text-slate-400">{detail.user.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 w-20 shrink-0">Registro</span>
                  <span className="text-slate-400">{fmtDate(detail.user.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 w-20 shrink-0">Ouro mercado</span>
                  <span className="text-amber-400 font-bold">{Number(detail.user.pending_gold).toLocaleString('pt-BR')} 🪙</span>
                </div>
                {detail.user.banned_at && (
                  <div className="col-span-2 flex items-start gap-2 bg-red-950/30 border border-red-800/50 px-3 py-2">
                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Banido</span>
                    <span className="text-red-300 text-xs">{detail.user.ban_reason}</span>
                    <span className="text-red-500 text-xs ml-auto">{fmtDate(detail.user.banned_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Personagem */}
            {char ? (
              <>
                <div className="border border-slate-700 bg-slate-900">
                  <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 flex items-center gap-3">
                    <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Personagem</span>
                    <span className="text-xs text-slate-400 font-bold">{char.name}</span>
                    <span className="text-xs text-slate-600">({char.gender} · {char.affinity})</span>
                    <span className="ml-auto text-xs text-slate-600">último acesso: {fmtDate(char.last_played_at)}</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {/* Cultivo */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Cultivo:</span>
                      <span className="text-sm font-bold text-violet-400">
                        {REALM_LABELS[char.realm] ?? char.realm} · {STAGE_LABELS[char.realm_stage] ?? char.realm_stage}
                      </span>
                      <span className="text-xs text-slate-600">Nv.{char.realm_level}</span>
                      <span className="ml-auto text-xs text-slate-600">
                        Poder: <span className="text-slate-400 font-bold">{Number(char.cultivation_power).toLocaleString('pt-BR')}</span>
                      </span>
                    </div>

                    {/* Barras HP/Qi */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'HP', cur: char.hp_current, max: char.hp_max, color: '#22c55e' },
                        { label: 'Qi', cur: char.qi_current, max: char.qi_max, color: '#a855f7' },
                      ].map(({ label, cur, max, color }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-5">{label}</span>
                          <div className="flex-1 h-2 bg-slate-800 overflow-hidden">
                            <div className="h-full" style={{ width: `${Math.min(100, (cur / Math.max(1, max)) * 100)}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-xs tabular-nums text-slate-500">{cur.toLocaleString('pt-BR')}/{max.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2">
                      <StatPill label="Força"     value={char.strength}   color="#f97316" />
                      <StatPill label="Agilidade" value={char.agility}    color="#60a5fa" />
                      <StatPill label="Vitalidade" value={char.vitality}  color="#22c55e" />
                      <StatPill label="Defesa"    value={char.defense}    color="#a78bfa" />
                      <StatPill label="Percepção" value={char.perception} color="#f59e0b" />
                      <StatPill label="Sorte"     value={char.luck}       color="#4ade80" />
                      <StatPill label="Gold"      value={`${Number(char.spirit_gold).toLocaleString('pt-BR')} 🪙`} color="#f59e0b" />
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map(sk => (
                          <div key={sk.id} className="flex items-center gap-1.5 text-xs border border-slate-700 bg-slate-800 px-2 py-1">
                            <span className="text-slate-400">{SKILL_LABELS[sk.id] ?? sk.id}</span>
                            <span className="font-bold text-amber-400">Nv.{sk.level}</span>
                            <span className="text-slate-600">{sk.xp.toLocaleString('pt-BR')} XP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inventário */}
                <div className="border border-slate-700 bg-slate-900">
                  <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50 flex items-center gap-3">
                    <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Inventário</span>
                    <span className="text-xs text-slate-600">{items.length}/{inv?.maxSlots ?? 30} slots</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-600">{equipItems.length} equip · {materialItems.length} materiais</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">

                    {/* Equipados */}
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Arsenal equipado</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                          const eq     = equipped?.[slot]
                          const def    = eq ? itemDefs[eq.definitionId] : null
                          const effRar = def ? effectiveRarity(def.rarity, eq?.ascensionTier ?? 0) : 'common'
                          const color  = def ? RARITY_COLORS[effRar] : '#334155'
                          return (
                            <div key={slot} className="p-2 min-h-[52px]"
                              style={{ border: `1px solid ${color}55`, backgroundColor: `${color}0d` }}>
                              <div className="text-[10px] uppercase tracking-wider mb-1 font-bold"
                                style={{ color: def ? color : '#475569' }}>
                                {{ weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório' }[slot]}
                              </div>
                              {def ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={16} />
                                    <span className="text-xs text-slate-300 truncate">{def.name}</span>
                                    {(eq?.upgradeLevel ?? 0) > 0 && (
                                      <span className="text-xs font-bold shrink-0" style={{ color }}>+{eq!.upgradeLevel}</span>
                                    )}
                                    {(eq?.ascensionTier ?? 0) > 0 && (
                                      <span className="text-xs font-bold shrink-0" style={{ color }}>✦{eq!.ascensionTier}</span>
                                    )}
                                  </div>
                                  <div className="text-[9px] mt-1 font-semibold tracking-widest uppercase" style={{ color: `${color}aa` }}>
                                    {RARITY_LABELS[effRar]}
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-700 italic">— vazio —</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Equipamentos não equipados */}
                    {equipItems.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Equipamentos na mochila ({equipItems.length})</div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {equipItems.map(item => {
                            const def    = itemDefs[item.definitionId]
                            const effRar = def ? effectiveRarity(def.rarity, item.ascensionTier ?? 0) : 'common'
                            const color  = def ? RARITY_COLORS[effRar] : '#475569'
                            return (
                              <div key={item.instanceId} className="flex items-center gap-1 text-xs px-2 py-1"
                                style={{ border: `1px solid ${color}55`, backgroundColor: `${color}0d` }}>
                                {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={12} />}
                                <span className="text-slate-300">{def?.name ?? item.definitionId}</span>
                                {(item.upgradeLevel ?? 0) > 0 && (
                                  <span className="font-bold" style={{ color }}>+{item.upgradeLevel}</span>
                                )}
                                {(item.ascensionTier ?? 0) > 0 && (
                                  <span className="font-bold" style={{ color }}>✦{item.ascensionTier}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Materiais */}
                    {materialItems.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Materiais e pílulas ({materialItems.length} tipos)</div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {materialItems.map(item => {
                            const def   = itemDefs[item.definitionId]
                            const color = def ? RARITY_COLORS[def.rarity] : '#475569'
                            return (
                              <div key={item.instanceId} className="flex items-center gap-1 text-xs px-2 py-1"
                                style={{ border: `1px solid ${color}44`, backgroundColor: `${color}0d` }}>
                                {def && <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={12} />}
                                <span className="text-slate-300">{def?.name ?? item.definitionId}</span>
                                <span className="font-bold" style={{ color: color }}>×{item.quantity}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-slate-700 bg-slate-900 px-4 py-6 text-center text-slate-600 text-sm">
                Sem personagem ativo
              </div>
            )}

            {/* Lendas */}
            {detail.legends.length > 0 && (
              <div className="border border-slate-700 bg-slate-900">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
                  <span className="text-xs font-cinzel tracking-widest uppercase text-slate-500">Lendas ({detail.legends.length})</span>
                </div>
                <div className="divide-y divide-slate-800">
                  {detail.legends.map(leg => (
                    <div key={leg.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                      <span className="text-slate-300 font-semibold w-28 truncate">{leg.name}</span>
                      <span className="text-violet-400 shrink-0">{REALM_LABELS[leg.realm] ?? leg.realm}</span>
                      <span className="text-slate-600 flex-1 truncate">💀 {leg.cause_of_death}</span>
                      <span className="text-slate-600 shrink-0">{fmtDate(leg.died_at)}</span>
                      {/* Restaurar só aparece se não há personagem ativo */}
                      {detail.characters.length === 0 && !detail.user.is_admin && (
                        confirmRestore === leg.id ? (
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => doAction(
                                () => api.post(`/api/admin/users/${detail.user.id}/legends/${leg.id}/restore`, {}),
                                `${leg.name} restaurado com sucesso.`
                              ).then(() => setConfirmRestore(null))}
                              disabled={working}
                              className="px-2 py-1 text-[10px] border border-emerald-600 text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50"
                            >
                              {working ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmRestore(null)}
                              className="px-2 py-1 text-[10px] border border-slate-600 text-slate-400 hover:bg-slate-800"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestore(leg.id)}
                            className="px-2 py-1 text-[10px] border border-emerald-800/60 text-emerald-500 hover:bg-emerald-950/30 shrink-0"
                          >
                            Restaurar
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações — não permite se o usuário for admin */}
            {!detail.user.is_admin && (
              <div className="border border-slate-700 bg-slate-900">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
                  <span className="text-xs font-cinzel tracking-widest uppercase text-red-500">Ações Administrativas</span>
                </div>
                <div className="px-4 py-4 space-y-4">

                  {/* Editar Qi */}
                  {char && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">Editar Qi</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Atual: <span className="text-violet-400 font-bold">{char.qi_current.toLocaleString('pt-BR')}</span>
                          {' / '}
                          <span className="text-slate-400">{char.qi_max.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number" min={0} max={char.qi_max}
                          value={qiInput}
                          onChange={e => setQiInput(e.target.value)}
                          placeholder={`0 – ${char.qi_max.toLocaleString('pt-BR')}`}
                          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-violet-600 tabular-nums"
                        />
                        <button
                          onClick={() => doAction(
                            () => api.patch(`/api/admin/inventory/${char.id}/qi`, { amount: Number(qiInput) }),
                            `Qi atualizado para ${Number(qiInput).toLocaleString('pt-BR')}.`
                          ).then(() => setQiInput(''))}
                          disabled={working || qiInput === '' || isNaN(Number(qiInput)) || Number(qiInput) < 0}
                          className="px-3 py-2 text-xs border border-violet-700/60 text-violet-400 bg-violet-950/10 hover:bg-violet-950/30 transition-colors font-bold disabled:opacity-40"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dar Item */}
                  {char && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">Dar Item</div>
                        <div className="text-xs text-slate-500 mt-0.5">Adiciona um item diretamente ao inventário do personagem.</div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={e => { setItemSearch(e.target.value); setItemToGive('') }}
                          placeholder="Buscar item..."
                          className="w-36 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-600"
                        />
                        <select
                          value={itemToGive}
                          onChange={e => setItemToGive(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-amber-600"
                        >
                          <option value="">— selecionar item —</option>
                          {allItemsSorted.map(it => (
                            <option key={it.id} value={it.id}>{it.emoji} {it.name}</option>
                          ))}
                        </select>
                        <input
                          type="number" min={1}
                          value={itemQty}
                          onChange={e => setItemQty(e.target.value)}
                          placeholder="Qtd"
                          className="w-16 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-amber-600 tabular-nums"
                        />
                        <button
                          onClick={() => doAction(
                            () => api.post(`/api/admin/inventory/${char.id}/add`, { definitionId: itemToGive, quantity: Math.max(1, Number(itemQty) || 1) }),
                            'Item adicionado ao inventário.'
                          ).then(() => setItemToGive(''))}
                          disabled={working || !itemToGive}
                          className="px-3 py-2 text-xs border border-amber-700/60 text-amber-400 bg-amber-950/10 hover:bg-amber-950/30 transition-colors font-bold disabled:opacity-40"
                        >
                          Dar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editar Ouro */}
                  {char && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">Editar Ouro Espiritual</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Atual: <span className="text-amber-400 font-bold">{Number(char.spirit_gold).toLocaleString('pt-BR')} 🪙</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number" min={0}
                          value={goldInput}
                          onChange={e => setGoldInput(e.target.value)}
                          placeholder="Novo valor..."
                          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-600 tabular-nums"
                        />
                        <button
                          onClick={() => doAction(
                            () => api.patch(`/api/admin/inventory/${char.id}/gold`, { amount: Number(goldInput) }),
                            `Ouro atualizado para ${Number(goldInput).toLocaleString('pt-BR')}.`
                          ).then(() => setGoldInput(''))}
                          disabled={working || goldInput === '' || isNaN(Number(goldInput)) || Number(goldInput) < 0}
                          className="px-3 py-2 text-xs border border-amber-700/60 text-amber-400 bg-amber-950/10 hover:bg-amber-950/30 transition-colors font-bold disabled:opacity-40"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editar Atributos */}
                  {char && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">Editar Atributos</div>
                        <div className="text-xs text-slate-500 mt-0.5">Deixe em branco os campos que não deseja alterar.</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {([
                          { key: 'strength',   label: 'FOR', cur: char.strength,   color: '#f97316' },
                          { key: 'agility',    label: 'AGI', cur: char.agility,    color: '#60a5fa' },
                          { key: 'vitality',   label: 'VIT', cur: char.vitality,   color: '#22c55e' },
                          { key: 'defense',    label: 'DEF', cur: char.defense,    color: '#a78bfa' },
                          { key: 'perception', label: 'PER', cur: char.perception, color: '#f59e0b' },
                          { key: 'luck',       label: 'SOR', cur: char.luck,       color: '#4ade80' },
                          { key: 'hp_max',     label: 'HP máx',  cur: char.hp_max,      color: '#f87171' },
                          { key: 'hp_current', label: 'HP atual', cur: char.hp_current,  color: '#86efac' },
                          { key: 'qi_max',     label: 'Qi máx',  cur: char.qi_max,      color: '#c084fc' },
                          { key: 'qi_current', label: 'Qi atual', cur: char.qi_current,  color: '#d8b4fe' },
                        ] as { key: string; label: string; cur: number; color: string }[]).map(({ key, label, cur, color }) => (
                          <div key={key} className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>{label}</div>
                            <div className="text-[10px] text-slate-600">atual: {cur}</div>
                            <input
                              type="number" min={0}
                              value={statsInputs[key] ?? ''}
                              onChange={e => setStatsInputs(s => ({ ...s, [key]: e.target.value }))}
                              placeholder={String(cur)}
                              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-slate-500 tabular-nums"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const payload: Record<string, number> = {}
                          for (const [k, v] of Object.entries(statsInputs)) {
                            if (v !== '' && !isNaN(Number(v))) payload[k] = Number(v)
                          }
                          doAction(
                            () => api.patch(`/api/admin/inventory/${char.id}/stats`, payload),
                            'Atributos atualizados.'
                          ).then(() => setStatsInputs({}))
                        }}
                        disabled={working || Object.values(statsInputs).every(v => v === '')}
                        className="px-3 py-2 text-xs border border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 transition-colors font-bold disabled:opacity-40"
                      >
                        Aplicar Atributos
                      </button>
                    </div>
                  )}

                  {/* Editar Habilidades de Crafting */}
                  {char && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">Habilidades de Crafting</div>
                        <div className="text-xs text-slate-500 mt-0.5">Define o nível da habilidade. XP é resetado para 0.</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: 'forging',     label: 'Forja',    color: '#f97316' },
                          { key: 'alchemy',     label: 'Alquimia', color: '#a78bfa' },
                          { key: 'inscription', label: 'Inscrição', color: '#60a5fa' },
                        ] as { key: string; label: string; color: string }[]).map(({ key, label, color }) => {
                          const cur = skills.find(s => s.id === key)?.level ?? 1
                          return (
                            <div key={key} className="space-y-1">
                              <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>{label}</div>
                              <div className="text-[10px] text-slate-600">atual: Nv.{cur}</div>
                              <input
                                type="number" min={1} max={99}
                                value={skillInputs[key] ?? ''}
                                onChange={e => setSkillInputs(s => ({ ...s, [key]: e.target.value }))}
                                placeholder={String(cur)}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-slate-500 tabular-nums"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => {
                          const payload: Record<string, number> = {}
                          for (const [k, v] of Object.entries(skillInputs)) {
                            if (v !== '' && !isNaN(Number(v))) payload[k] = Number(v)
                          }
                          doAction(
                            () => api.patch(`/api/admin/inventory/${char.id}/skills`, payload),
                            'Habilidades atualizadas.'
                          ).then(() => setSkillInputs({}))
                        }}
                        disabled={working || Object.values(skillInputs).every(v => v === '')}
                        className="px-3 py-2 text-xs border border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 transition-colors font-bold disabled:opacity-40"
                      >
                        Aplicar Habilidades
                      </button>
                    </div>
                  )}

                  {/* Delete character */}
                  {char && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-300">Deletar Personagem</div>
                        <div className="text-xs text-slate-500 mt-0.5">Remove o personagem ativo. O usuário poderá criar um novo.</div>
                      </div>
                      {!confirmDel ? (
                        <button
                          onClick={() => setConfirmDel(true)}
                          className="px-3 py-1.5 text-xs border border-orange-700/60 text-orange-400 hover:bg-orange-950/20 transition-colors font-bold"
                        >
                          Deletar Personagem
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 text-xs border border-slate-600 text-slate-400">
                            Cancelar
                          </button>
                          <button
                            onClick={() => doAction(
                              () => api.delete(`/api/admin/users/${detail.user.id}/character`),
                              'Personagem deletado.'
                            ).then(() => setConfirmDel(false))}
                            disabled={working}
                            className="px-3 py-1.5 text-xs border border-red-700 text-red-400 bg-red-950/20 font-bold disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ban / Unban */}
                  <div className="border-t border-slate-800 pt-4">
                    {detail.user.banned_at ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-300">Conta Banida</div>
                          <div className="text-xs text-slate-500 mt-0.5">Motivo: {detail.user.ban_reason}</div>
                        </div>
                        <button
                          onClick={() => doAction(
                            () => api.post(`/api/admin/users/${detail.user.id}/unban`, {}),
                            'Conta desbanida.'
                          )}
                          disabled={working}
                          className="px-3 py-1.5 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/20 transition-colors font-bold disabled:opacity-50"
                        >
                          Desbanir
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-300">Banir Usuário</div>
                          <div className="text-xs text-slate-500 mt-0.5">O usuário receberá o motivo ao tentar se conectar.</div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={banReason}
                            onChange={e => setBanReason(e.target.value)}
                            placeholder="Motivo do banimento..."
                            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-red-600"
                          />
                          <button
                            onClick={() => doAction(
                              () => api.post(`/api/admin/users/${detail.user.id}/ban`, { reason: banReason }),
                              'Usuário banido.'
                            ).then(() => setBanReason(''))}
                            disabled={working || !banReason.trim()}
                            className="px-3 py-2 text-xs border border-red-800/60 text-red-400 bg-red-950/10 hover:bg-red-950/30 transition-colors font-bold disabled:opacity-40"
                          >
                            Banir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────────────────

export function PlayersPanel() {
  const [users, setUsers]           = useState<UserRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const itemDefs = useGameDataStore(s => s.items)
  const loadGameData = useGameDataStore(s => s.load)

  const loadUsers = useCallback(() => {
    setLoading(true)
    api.get<UserRow[]>('/api/admin/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUsers()
    // Garante que temos definições de itens para o modal de detalhe
    if (Object.keys(itemDefs).length === 0) loadGameData()
  }, [loadUsers, loadGameData, itemDefs])

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.char_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-bold text-amber-400 tracking-wider">Jogadores</h2>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário, e-mail ou personagem..."
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 w-72 focus:outline-none focus:border-amber-500"
          />
          <span className="text-xs text-slate-500">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Carregando...</div>
      ) : (
        <div className="border border-slate-700 bg-slate-900 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                {['Usuário', 'Personagem', 'Reino', 'Gold', 'Último acesso', 'Status', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-500 font-cinzel tracking-wider uppercase text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(u => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(u.id)}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-200">{u.username}</div>
                    <div className="text-slate-600 mt-0.5">{u.email}</div>
                    {u.is_admin && <span className="text-[9px] text-amber-400 font-bold">ADMIN</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {u.char_name
                      ? <span className="text-slate-300">{u.char_name}</span>
                      : <span className="text-slate-700 italic">sem personagem</span>}
                  </td>
                  <td className="px-3 py-2.5 text-violet-400">
                    {u.realm ? (REALM_LABELS[u.realm] ?? u.realm) : '—'}
                    {u.realm_stage ? <span className="text-slate-600 ml-1">· {STAGE_LABELS[u.realm_stage] ?? u.realm_stage}</span> : null}
                  </td>
                  <td className="px-3 py-2.5 text-amber-400 font-bold tabular-nums">
                    {u.spirit_gold != null ? Number(u.spirit_gold).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{fmtDate(u.last_played_at)}</td>
                  <td className="px-3 py-2.5">
                    {u.banned_at
                      ? <span className="px-1.5 py-0.5 border border-red-800/60 text-red-400 font-bold text-[10px]">BANIDO</span>
                      : <span className="px-1.5 py-0.5 border border-teal-800/60 text-teal-400 text-[10px]">Ativo</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedId(u.id) }}
                      className="text-[10px] px-2 py-1 border border-slate-600 text-slate-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-slate-600 py-8">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}

      {selectedId !== null && (
        <DetailModal
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={loadUsers}
        />
      )}
    </div>
  )
}
