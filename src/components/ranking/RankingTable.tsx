import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { RankingCharacter, RankingLegend, EquippedSnapshot } from '../../types/server'
import { useAuthStore } from '../../store/authStore'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS } from '../../types'
import type { Realm, RealmStage } from '../../types'
import { SERVER_TO_GAME_REALM, SERVER_TO_GAME_STAGE } from '../../types/server'
import { effectiveRarity } from '../../utils/forge'

function realmDisplay(raw: string)  { return REALM_NAMES[(SERVER_TO_GAME_REALM[raw] ?? raw) as Realm]  ?? raw }
function stageDisplay(raw: string)  { return STAGE_NAMES[(SERVER_TO_GAME_STAGE[raw] ?? raw) as RealmStage] ?? raw }
import { SpriteImg } from '../ui/SpriteImg'
import { TabBar } from '../ui/TabBar'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const REALM_COLORS: Record<string, string> = {
  body_tempering: '#c8b89a', houtian: '#4db6ac', xiantian: '#7986cb',
  revolving_core: '#d4a84b', life_destruction: '#ef5350',
  divine_sea: '#42a5f5', divine_transformation: '#f0c060',
  divine_lord: '#70c8c0', holy_lord: '#fff176',
  world_king: '#ce93d8', empyrean: '#f48fb1',
  true_divinity: '#80deea', beyond_divinity: '#ffe082',
  qi_refining: '#c8b89a', foundation: '#4db6ac', golden_core: '#7986cb',
  nascent_soul: '#d4a84b', spirit_transformation: '#f0c060',
  unification: '#ef5350', ascension: '#70c8c0', immortal: '#fff176',
}

// Formata números grandes: 1.5K, 2.3M, 4.1B, etc.
function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function isOnline(lastPlayedAt: string | null | undefined): boolean {
  if (!lastPlayedAt) return false
  return Date.now() - new Date(lastPlayedAt).getTime() < 5 * 60 * 1000
}

const RANK_STYLE: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'rgba(251,191,36,0.06)', text: '#fbbf24', badge: '🥇' },
  2: { bg: 'rgba(148,163,184,0.06)', text: '#94a3b8', badge: '🥈' },
  3: { bg: 'rgba(180,83,9,0.06)',  text: '#b45309', badge: '🥉' },
}

interface Props { onBack: () => void }

export function RankingTable({ onBack }: Props) {
  interface SectRank { id: number; name: string; emblem: string; tier: number; tier_name: string; collective_qi: number; member_count: number; qi_bonus_pct: number; motto: string | null }
  const [tab, setTab]         = useState('heroes')
  const [heroes, setHeroes]   = useState<RankingCharacter[]>([])
  const [legends, setLegends] = useState<RankingLegend[]>([])
  const [sects, setSects]     = useState<SectRank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const currentName = usePlayerStore(s => s.name)
  const TIER_COLOR: Record<number, string> = { 1: '#78716c', 2: '#14b8a6', 3: '#a78bfa', 4: '#f59e0b' }

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(false)
      try {
        const char = useAuthStore.getState().activeCharacter
        if (char) {
          const p = usePlayerStore.getState()
          await api.put(`/api/characters/${char.id}`, {
            cultivation_power: Number(p.totalQiAccumulated),
            realm:             REALM_NAMES[p.realm],
            realm_stage:       STAGE_NAMES[p.realmStage],
            qi_current:        p.qi,
            qi_max:            p.maxQi,
            spirit_gold:       p.gold,
            last_played_at:    new Date().toISOString(),
          }).catch(() => {})
        }
        const [h, l, s] = await Promise.all([
          api.get<RankingCharacter[]>('/api/ranking/heroes'),
          api.get<RankingLegend[]>('/api/ranking/legends'),
          api.get<SectRank[]>('/api/sects').catch(() => [] as SectRank[]),
        ])
        setHeroes(h); setLegends(l); setSects(s)
      } catch { setError(true) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-slate-800 bg-slate-900">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">Quadro de Glória</h1>
          <p className="text-xs text-slate-600">Registros eternos dos cultivadores do Dao</p>
        </div>
      </div>

      <div className="border border-slate-700 bg-slate-900">
        <TabBar
          tabs={[
            { id: 'heroes',  label: 'Hall dos Heróis',  icon: '⚔' },
            { id: 'legends', label: 'Hall das Lendas',  icon: '☽' },
            { id: 'sects',   label: 'Seitas',           icon: '🏛️' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        <div className="p-4">
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Consultando os anais..." />
            </div>
          )}
          {!loading && error && (
            <div className="text-center border border-slate-700 bg-slate-800/60 py-10 space-y-1">
              <div className="text-2xl opacity-30 select-none">⚠</div>
              <p className="text-sm text-slate-500">Erro ao carregar o ranking.</p>
            </div>
          )}
          {!loading && !error && tab === 'heroes'  && <HeroesHall  heroes={heroes}   currentName={currentName} />}
          {!loading && !error && tab === 'legends' && <LegendsHall legends={legends} />}
          {!loading && !error && tab === 'sects'   && (
            <div className="space-y-2">
              {sects.length === 0 ? (
                <div className="text-center text-slate-600 py-8 text-sm">Nenhuma seita registrada ainda.</div>
              ) : sects.map((s, idx) => {
                const style = RANK_STYLE[idx + 1] ?? {}
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 border border-slate-700/60"
                    style={{ backgroundColor: style.bg ?? undefined }}>
                    <div className="w-8 text-center text-lg">{style.badge ?? <span className="text-xs text-slate-500">#{idx+1}</span>}</div>
                    <span className="text-2xl">{s.emblem}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: style.text ?? '#94a3b8' }}>{s.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 border font-bold" style={{ borderColor: (TIER_COLOR[s.tier]??'#475569')+'55', color: TIER_COLOR[s.tier]??'#475569' }}>
                          {s.tier_name}
                        </span>
                      </div>
                      {s.motto && <p className="text-xs text-slate-600 italic truncate">"{s.motto}"</p>}
                      <div className="flex gap-3 mt-0.5 text-xs text-slate-600">
                        <span>👥 {s.member_count}</span>
                        <span>🌿 +{s.qi_bonus_pct}% Qi</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">{fmt(Number(s.collective_qi))}</div>
                      <div className="text-[10px] text-slate-600">Qi Coletivo</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Linha de equipamentos expandida ──────────────────────────────
function EquipRow({ equipped, kills, faded = false }: { equipped: EquippedSnapshot | null; kills: number; faded?: boolean }) {
  const itemDefs = useGameDataStore(s => s.items)
  const slots = [
    { key: 'weapon',    label: 'Arma',       item: equipped?.weapon    ?? null },
    { key: 'armor',     label: 'Armadura',   item: equipped?.armor     ?? null },
    { key: 'accessory', label: 'Acessório',  item: equipped?.accessory ?? null },
    { key: 'ring',      label: 'Anel',       item: equipped?.ring      ?? null },
  ] as const

  return (
    <div className={`px-3 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-4 flex-wrap ${faded ? 'opacity-60' : ''}`}>
      {slots.map(({ key, label, item }) => {
        const def  = item ? itemDefs[item.definitionId] : null
        const ascT = item?.ascensionTier ?? 0
        const upgL = item?.upgradeLevel ?? 0
        const effRar = def ? effectiveRarity(def.rarity, ascT) : 'common'
        const color  = def ? (RARITY_COLORS[effRar] ?? '#475569') : '#1e293b'
        return (
          <div key={key} className="flex items-center gap-1.5 border px-2 py-1.5 min-w-[110px]"
            style={{ borderColor: def ? color + '55' : '#1e293b', backgroundColor: def ? color + '08' : 'transparent' }}>
            {def ? (
              <>
                <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={22} />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium truncate" style={{ color }}>{def.name}</div>
                  <div className="text-[10px] text-slate-600">
                    {upgL > 0 && `+${upgL}`}{ascT > 0 && ` ✦${ascT}`}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[11px] text-slate-700 italic">{label} — vazio</div>
            )}
          </div>
        )
      })}
      <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 border border-slate-800 px-3 py-1.5">
        <span className="text-slate-600">⚔</span>
        <span className="tabular-nums font-bold text-slate-300">{kills.toLocaleString()}</span>
        <span className="text-slate-600">kills</span>
      </div>
    </div>
  )
}

// ── Hall dos Heróis ───────────────────────────────────────────────
function HeroesHall({ heroes, currentName }: { heroes: RankingCharacter[]; currentName: string }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const classes = useGameDataStore(s => s.classes)

  if (heroes.length === 0) {
    return (
      <div className="text-center py-14 select-none">
        <div className="text-5xl opacity-10 mb-3">⚔</div>
        <p className="text-slate-500 text-sm">Nenhum herói registrado ainda.</p>
      </div>
    )
  }

  // Mobile: # | Nome | Cls | Poder | expand
  // Desktop: # | Nome | Cls | Reino | Poder | Qi Acum. | expand
  const COLS = 'grid-cols-[2rem_1fr_1.5rem_4.5rem_1rem] sm:grid-cols-[2.5rem_1fr_1fr_1fr_5rem_5rem_1.2rem]'

  return (
    <div>
      <div className={`grid ${COLS} gap-x-2 sm:gap-x-3 px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-cinzel tracking-widest uppercase text-slate-500`}>
        <span>#</span>
        <span>Cultivador</span>
        <span className="text-center sm:text-left">Classe</span>
        <span className="hidden sm:block">Reino</span>
        <span className="text-right">Poder</span>
        <span className="hidden sm:block text-right">Qi Acum.</span>
        <span />
      </div>

      {heroes.map((h, i) => {
        const rank   = i + 1
        const style  = RANK_STYLE[rank]
        const isMe   = h.name === currentName
        const open   = expanded === h.id
        const online = isOnline(h.last_played_at)
        const cls    = classes.find(c => c.id === h.class_id)
        return (
          <div key={h.id}>
            <div
              onClick={() => setExpanded(open ? null : h.id)}
              className={`grid ${COLS} items-center gap-x-2 sm:gap-x-3 px-3 py-3 border-b border-slate-800 text-sm transition-colors cursor-pointer hover:bg-slate-800/50`}
              style={{ backgroundColor: isMe ? 'rgba(245,158,11,0.06)' : (style?.bg ?? 'transparent') }}
            >
              <span className="flex items-center">
                {style ? <span className="text-base leading-none">{style.badge}</span>
                       : <span className="text-xs text-slate-600 tabular-nums">{rank}</span>}
              </span>
              <span className="truncate min-w-0 flex items-center gap-1.5">
                {online && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" title="Online" />}
                <span className={isMe ? 'text-amber-400 font-bold' : 'text-slate-200'}>{h.name}</span>
                {isMe && <span className="ml-1 text-[10px] text-amber-600 font-cinzel">← você</span>}
              </span>
              <span className="flex items-center gap-1 min-w-0 text-xs" style={{ color: cls?.color ?? '#64748b' }}>
                <span className="text-base shrink-0">{cls?.emoji ?? '—'}</span>
                <span className="hidden sm:block">{cls?.name ?? '—'}</span>
              </span>
              <span className="hidden sm:block text-xs min-w-0 truncate" style={{ color: REALM_COLORS[h.realm] ?? '#64748b' }}>
                {realmDisplay(h.realm)} · {stageDisplay(h.realm_stage)}
              </span>
              <span className="text-right font-bold tabular-nums text-teal-400 text-xs">
                {h.player_power ? fmt(h.player_power) : '—'}
              </span>
              <span className="hidden sm:block text-right text-purple-400/80 font-bold tabular-nums text-xs">
                {fmt(Number(h.cultivation_power ?? 0))}
              </span>
              <span className="text-slate-600 text-xs select-none">{open ? '▲' : '▼'}</span>
            </div>
            {open && <EquipRow equipped={h.equipped_snapshot} kills={h.total_kills ?? 0} />}
          </div>
        )
      })}
    </div>
  )
}

// ── Hall das Lendas ───────────────────────────────────────────────
function LegendsHall({ legends }: { legends: RankingLegend[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const classes = useGameDataStore(s => s.classes)

  if (legends.length === 0) {
    return (
      <div className="text-center py-14 select-none">
        <div className="text-5xl opacity-10 mb-3">☽</div>
        <p className="text-slate-500 text-sm">O Hall das Lendas aguarda seus heróis caídos.</p>
      </div>
    )
  }

  const COLS = 'grid-cols-[2rem_1fr_1.5rem_4.5rem_1rem] sm:grid-cols-[2.5rem_1fr_1fr_1fr_5rem_5rem_1.2rem]'

  return (
    <div>
      <div className={`grid ${COLS} gap-x-2 sm:gap-x-3 px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-cinzel tracking-widest uppercase text-slate-500`}>
        <span>#</span>
        <span>Lenda</span>
        <span className="text-center sm:text-left">Classe</span>
        <span className="hidden sm:block">Reino</span>
        <span className="text-right">Poder</span>
        <span className="hidden sm:block text-right">Poder Cult.</span>
        <span />
      </div>

      {legends.map((l, i) => {
        const rank  = i + 1
        const style = RANK_STYLE[rank]
        const open  = expanded === l.id
        const cls   = classes.find(c => c.id === l.class_id)
        return (
          <div key={l.id}>
            <div
              onClick={() => setExpanded(open ? null : l.id)}
              className={`grid ${COLS} items-center gap-x-2 sm:gap-x-3 px-3 py-3 border-b border-slate-800 text-sm opacity-60 hover:opacity-90 transition-opacity cursor-pointer`}
              style={{ backgroundColor: style?.bg ?? 'transparent' }}
            >
              <span className="flex items-center">
                {style ? <span className="text-base leading-none">{style.badge}</span>
                       : <span className="text-xs text-slate-600 tabular-nums">{rank}</span>}
              </span>
              <span className="text-slate-400 line-through decoration-slate-700 truncate min-w-0">{l.name}</span>
              <span className="flex items-center gap-1 min-w-0 text-xs" style={{ color: cls ? cls.color + '88' : '#374151' }}>
                <span className="text-base shrink-0">{cls?.emoji ?? '—'}</span>
                <span className="hidden sm:block">{cls?.name ?? '—'}</span>
              </span>
              <span className="hidden sm:block text-xs min-w-0 truncate" style={{ color: (REALM_COLORS[l.realm] ?? '#64748b') + 'aa' }}>
                {realmDisplay(l.realm)} · {stageDisplay(l.realm_stage)}
              </span>
              <span className="text-right font-bold tabular-nums text-teal-400/70 text-xs">
                {l.player_power ? fmt(l.player_power) : '—'}
              </span>
              <span className="hidden sm:block text-right text-purple-400/60 font-bold tabular-nums text-xs">
                {fmt(Number(l.cultivation_power ?? 0))}
              </span>
              <span className="text-slate-600 text-xs select-none">{open ? '▲' : '▼'}</span>
            </div>
            {open && <EquipRow equipped={l.equipped_snapshot} kills={l.total_kills ?? 0} faded />}
          </div>
        )
      })}
    </div>
  )
}
