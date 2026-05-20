import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ItemsPanel }         from '../components/admin/ItemsPanel'
import { MonstersPanel }      from '../components/admin/MonstersPanel'
import { RecipesPanel }       from '../components/admin/RecipesPanel'
import { BiomesPanel }        from '../components/admin/BiomesPanel'
import { BreakthroughsPanel } from '../components/admin/BreakthroughsPanel'
import { SettingsPanel }      from '../components/admin/SettingsPanel'
import { CraftXpPanel }       from '../components/admin/CraftXpPanel'
import { ForgeConfigPanel }   from '../components/admin/ForgeConfigPanel'
import { StatsConfigPanel }      from '../components/admin/StatsConfigPanel'
import { DismantleConfigPanel } from '../components/admin/DismantleConfigPanel'
import { PlayersPanel }        from '../components/admin/PlayersPanel'
import { MarketPanel }         from '../components/admin/MarketPanel'

interface Props { onBack: () => void }

interface Stats {
  items: number; monsters: number; recipes: number
  biomes: number; breakthroughs: number
}

const TABS = [
  { id: 'players',       label: '👤 Jogadores'      },
  { id: 'market',        label: '🏪 Mercado'        },
  { id: 'items',         label: '⚔ Itens'          },
  { id: 'monsters',      label: '👾 Monstros'       },
  { id: 'recipes',       label: '⚗ Receitas'        },
  { id: 'biomes',        label: '🗺️ Biomas'          },
  { id: 'breakthroughs', label: '⚡ Breakthroughs'  },
  { id: 'settings',      label: '⚙ Settings'        },
  { id: 'craft-xp',      label: '✦ XP Craft'        },
  { id: 'forge-cfg',     label: '🔨 Forja Config'   },
  { id: 'stat-cfg',      label: '📊 Stats Config'    },
  { id: 'dismantle-cfg', label: '🔧 Desmonte'        },
] as const

type TabId = typeof TABS[number]['id']

const STAT_MAP: { label: string; key: keyof Stats; color: string }[] = [
  { label: 'Itens',          key: 'items',         color: '#f59e0b' },
  { label: 'Monstros',       key: 'monsters',      color: '#ef4444' },
  { label: 'Receitas',       key: 'recipes',       color: '#4ade80' },
  { label: 'Biomas',         key: 'biomes',        color: '#60a5fa' },
  { label: 'Breakthroughs',  key: 'breakthroughs', color: '#a855f7' },
]

export function AdminPage({ onBack }: Props) {
  const username = useAuthStore(s => s.user?.username ?? 'Admin')
  const signOut  = useAuthStore(s => s.signOut)
  const [tab, setTab]     = useState<TabId>('players')
  const [stats, setStats] = useState<Stats>({ items: 0, monsters: 0, recipes: 0, biomes: 0, breakthroughs: 0 })
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState('')
  const confirmInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<Stats>('/api/admin/stats').then(setStats).catch(() => {})
  }, [])

  const refreshStats = () => {
    api.get<Stats>('/api/admin/stats').then(setStats).catch(() => {})
  }

  const handleDeleteAllCharacters = async () => {
    setDeleting(true)
    try {
      const res = await api.delete<{ ok: boolean; deletedCharacters: number; deletedLegends: number }>(
        '/api/admin/characters/all'
      )
      setDeleteResult(`✓ ${res.deletedCharacters} personagens e ${res.deletedLegends} lendas deletados.`)
      setDeleteConfirmText('')
    } catch (e) {
      setDeleteResult(`Erro: ${e instanceof Error ? e.message : 'falha ao deletar'}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gold font-bold tracking-widest text-sm">道 永恆</span>
            <span className="text-xs text-danger font-bold tracking-widest uppercase px-2 py-0.5 border border-danger/40 bg-danger/10 rounded">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs hidden sm:block">{username}</span>
            <button onClick={onBack}
              className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:bg-surface-2 hover:text-text transition-colors">
              ← Voltar ao Jogo
            </button>
            <button onClick={signOut}
              className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:bg-surface-2 hover:text-text transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {STAT_MAP.map(s => (
            <div key={s.key}
              className="border border-slate-700 bg-slate-900 px-4 py-3 flex items-center justify-between">
              <span className="text-slate-500 text-xs">{s.label}</span>
              <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{stats[s.key]}</span>
            </div>
          ))}
        </div>

        {/* Zona de perigo */}
        <div className="flex items-center justify-end mb-6">
          <button onClick={() => { setDeleteModal(true); setDeleteResult(''); setDeleteConfirmText(''); setTimeout(() => confirmInputRef.current?.focus(), 50) }}
            className="text-xs px-3 py-1.5 border border-red-800/50 text-red-500 hover:bg-red-950/20 transition-colors">
            🗑 Deletar todos os personagens
          </button>
        </div>

        {/* Modal de confirmação */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="bg-slate-950 border border-red-900/60 w-full max-w-md p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-cinzel font-bold text-red-400 tracking-wider text-sm uppercase">
                  ⚠️ Deletar todos os personagens
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta ação irá apagar <span className="text-red-400 font-bold">permanentemente</span> todos os
                  personagens ativos e todas as lendas do banco de dados. Não pode ser desfeito.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500">
                  Digite <span className="font-mono text-red-400 font-bold">DELETAR TUDO</span> para confirmar:
                </label>
                <input
                  ref={confirmInputRef}
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETAR TUDO"
                  className="w-full bg-slate-900 border border-red-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-red-600 placeholder:text-slate-700"
                />
              </div>

              {deleteResult && (
                <div className={`text-xs px-3 py-2 border ${deleteResult.startsWith('✓')
                  ? 'border-teal-700/60 bg-teal-950/20 text-teal-400'
                  : 'border-red-800/60 bg-red-950/20 text-red-400'}`}>
                  {deleteResult}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => { setDeleteModal(false); setDeleteResult('') }}
                  className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAllCharacters}
                  disabled={deleteConfirmText !== 'DELETAR TUDO' || deleting}
                  className="px-4 py-2 text-sm border border-red-800/60 text-red-400 bg-red-950/20 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold">
                  {deleting ? 'Deletando...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Tab navigation */}
        <div className="flex flex-wrap border-b border-border mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={[
                'px-5 py-2.5 text-sm font-medium tracking-wider border-b-2 -mb-px transition-all',
                tab === t.id
                  ? 'text-gold border-gold bg-gold/5'
                  : 'text-muted border-transparent hover:text-text hover:border-border',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === 'players'       && <PlayersPanel />}
        {tab === 'market'        && <MarketPanel />}
        {tab === 'items'         && <ItemsPanel         onMutate={refreshStats} />}
        {tab === 'monsters'      && <MonstersPanel       onMutate={refreshStats} />}
        {tab === 'recipes'       && <RecipesPanel        onMutate={refreshStats} />}
        {tab === 'biomes'        && <BiomesPanel         onMutate={refreshStats} />}
        {tab === 'breakthroughs' && <BreakthroughsPanel  onMutate={refreshStats} />}
        {tab === 'settings'      && <SettingsPanel />}
        {tab === 'craft-xp'      && <CraftXpPanel />}
        {tab === 'forge-cfg'      && <ForgeConfigPanel />}
        {tab === 'stat-cfg'       && <StatsConfigPanel />}
        {tab === 'dismantle-cfg'  && <DismantleConfigPanel />}
      </div>
    </div>
  )
}
