import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { RankingCharacter, RankingLegend, EquippedSnapshot } from '../../types/server'
import { useAuthStore } from '../../store/authStore'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS } from '../../types'
import { effectiveRarity } from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'
import { TabBar } from '../ui/TabBar'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const REALM_COLORS: Record<string, string> = {
  'Refinamento de Qi':        '#c8b89a',
  'Fundação Espiritual':      '#4db6ac',
  'Núcleo Dourado':           '#7986cb',
  'Alma Nascente':            '#d4a84b',
  'Transformação Espiritual': '#f0c060',
  'Unificação':               '#ef5350',
  'Ascensão':                 '#70c8c0',
  'Imortal':                  '#fff176',
}

const RANK_STYLE: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'rgba(251,191,36,0.06)', text: '#fbbf24', badge: '🥇' },
  2: { bg: 'rgba(148,163,184,0.06)', text: '#94a3b8', badge: '🥈' },
  3: { bg: 'rgba(180,83,9,0.06)',  text: '#b45309', badge: '🥉' },
}

interface Props { onBack: () => void }

export function RankingTable({ onBack }: Props) {
  const [tab, setTab]         = useState('heroes')
  const [heroes, setHeroes]   = useState<RankingCharacter[]>([])
  const [legends, setLegends] = useState<RankingLegend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const currentName = usePlayerStore(s => s.name)

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
        const [h, l] = await Promise.all([
          api.get<RankingCharacter[]>('/api/ranking/heroes'),
          api.get<RankingLegend[]>('/api/ranking/legends'),
        ])
        setHeroes(h); setLegends(l)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="w-full md:max-w-[65vw] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button onClick={onBack}
          className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-cinzel font-bold text-slate-200 tracking-wider">Quadro de Glória</h1>
          <p className="text-xs text-slate-600">Registros eternos dos cultivadores do Dao</p>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="border border-slate-700 bg-slate-900">
        <TabBar
          tabs={[
            { id: 'heroes',  label: 'Hall dos Heróis',  icon: '⚔' },
            { id: 'legends', label: 'Hall das Lendas',  icon: '☽' },
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
              <p className="text-xs text-slate-700">Verifique a conexão com o servidor.</p>
            </div>
          )}

          {!loading && !error && tab === 'heroes'  && <HeroesHall  heroes={heroes}   currentName={currentName} />}
          {!loading && !error && tab === 'legends' && <LegendsHall legends={legends} />}
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
      {/* Kills */}
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

  if (heroes.length === 0) {
    return (
      <div className="text-center py-14 select-none">
        <div className="text-5xl opacity-10 mb-3">⚔</div>
        <p className="text-slate-500 text-sm">Nenhum herói registrado ainda.</p>
        <p className="text-slate-700 text-xs mt-1">Cultive seu poder e inscreva seu nome nos anais.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[2rem_1fr_auto_1rem] sm:grid-cols-[2.5rem_1fr_1fr_auto_1.2rem] gap-x-2 sm:gap-x-4 px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-cinzel tracking-widest uppercase text-slate-500">
        <span>#</span>
        <span>Cultivador</span>
        <span className="hidden sm:block">Reino</span>
        <span className="text-right">Poder</span>
        <span />
      </div>

      {heroes.map((h, i) => {
        const rank    = i + 1
        const style   = RANK_STYLE[rank]
        const isMe    = h.name === currentName
        const open    = expanded === h.id
        return (
          <div key={h.id}>
            <div
              onClick={() => setExpanded(open ? null : h.id)}
              className="grid grid-cols-[2rem_1fr_auto_1rem] sm:grid-cols-[2.5rem_1fr_1fr_auto_1.2rem] gap-x-2 sm:gap-x-4 px-3 py-3 border-b border-slate-800 text-sm transition-colors cursor-pointer hover:bg-slate-800/50"
              style={{ backgroundColor: isMe ? 'rgba(245,158,11,0.06)' : (style?.bg ?? 'transparent') }}
            >
              <span className="flex items-center">
                {style
                  ? <span className="text-base leading-none">{style.badge}</span>
                  : <span className="text-xs text-slate-600 tabular-nums">{rank}</span>
                }
              </span>
              <span className="truncate min-w-0 self-center">
                <span className={isMe ? 'text-amber-400 font-bold' : 'text-slate-200'}>{h.name}</span>
                {isMe && <span className="ml-1.5 text-[10px] text-amber-600 font-cinzel">← você</span>}
              </span>
              <span className="hidden sm:block text-xs truncate self-center" style={{ color: REALM_COLORS[h.realm] ?? '#64748b' }}>
                {h.realm} · {h.realm_stage}
              </span>
              <span className="text-right text-purple-400 font-bold tabular-nums self-center">
                {h.cultivation_power.toLocaleString()}
              </span>
              <span className="self-center text-slate-600 text-xs select-none">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
              <EquipRow equipped={h.equipped_snapshot} kills={h.total_kills ?? 0} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Hall das Lendas ───────────────────────────────────────────────
function LegendsHall({ legends }: { legends: RankingLegend[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (legends.length === 0) {
    return (
      <div className="text-center py-14 select-none">
        <div className="text-5xl opacity-10 mb-3">☽</div>
        <p className="text-slate-500 text-sm">O Hall das Lendas aguarda seus heróis caídos.</p>
        <p className="text-slate-700 text-xs mt-1">Os cultivadores que tombarem serão eternizados aqui.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[2rem_1fr_auto_1rem] sm:grid-cols-[2.5rem_1fr_1fr_auto_1.2rem] gap-x-2 sm:gap-x-4 px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-cinzel tracking-widest uppercase text-slate-500">
        <span>#</span>
        <span>Lenda</span>
        <span className="hidden sm:block">Reino</span>
        <span className="text-right">Poder</span>
        <span />
      </div>

      {legends.map((l, i) => {
        const rank  = i + 1
        const style = RANK_STYLE[rank]
        const open  = expanded === l.id
        return (
          <div key={l.id}>
            <div
              onClick={() => setExpanded(open ? null : l.id)}
              className="grid grid-cols-[2rem_1fr_auto_1rem] sm:grid-cols-[2.5rem_1fr_1fr_auto_1.2rem] gap-x-2 sm:gap-x-4 px-3 py-3 border-b border-slate-800 text-sm opacity-60 hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: style?.bg ?? 'transparent' }}
            >
              <span className="flex items-center">
                {style
                  ? <span className="text-base leading-none">{style.badge}</span>
                  : <span className="text-xs text-slate-600 tabular-nums">{rank}</span>
                }
              </span>
              <span className="text-slate-400 line-through decoration-slate-700 truncate self-center">{l.name}</span>
              <span className="hidden sm:block text-xs truncate self-center" style={{ color: (REALM_COLORS[l.realm] ?? '#64748b') + 'aa' }}>
                {l.realm} · {l.realm_stage}
              </span>
              <span className="text-right text-purple-400/60 font-bold tabular-nums self-center">
                {l.cultivation_power.toLocaleString()}
              </span>
              <span className="self-center text-slate-600 text-xs select-none">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
              <EquipRow equipped={l.equipped_snapshot} kills={l.total_kills ?? 0} faded />
            )}
          </div>
        )
      })}
    </div>
  )
}
