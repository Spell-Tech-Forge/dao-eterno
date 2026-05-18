import { useState, useEffect } from 'react'
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
import { StatsConfigPanel }   from '../components/admin/StatsConfigPanel'

interface Props { onBack: () => void }

interface Stats {
  items: number; monsters: number; recipes: number
  biomes: number; breakthroughs: number
}

const TABS = [
  { id: 'items',         label: '⚔ Itens'          },
  { id: 'monsters',      label: '👾 Monstros'       },
  { id: 'recipes',       label: '⚗ Receitas'        },
  { id: 'biomes',        label: '🗺️ Biomas'          },
  { id: 'breakthroughs', label: '⚡ Breakthroughs'  },
  { id: 'settings',      label: '⚙ Settings'        },
  { id: 'craft-xp',      label: '✦ XP Craft'        },
  { id: 'forge-cfg',     label: '🔨 Forja Config'   },
  { id: 'stat-cfg',      label: '📊 Stats Config'    },
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
  const [tab, setTab]     = useState<TabId>('items')
  const [stats, setStats] = useState<Stats>({ items: 0, monsters: 0, recipes: 0, biomes: 0, breakthroughs: 0 })

  useEffect(() => {
    api.get<Stats>('/api/admin/stats').then(setStats).catch(() => {})
  }, [])

  const refreshStats = () => {
    api.get<Stats>('/api/admin/stats').then(setStats).catch(() => {})
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
        <div className="grid grid-cols-5 gap-3 mb-6">
          {STAT_MAP.map(s => (
            <div key={s.key}
              className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between">
              <span className="text-muted text-xs">{s.label}</span>
              <span className="text-xl font-bold" style={{ color: s.color }}>{stats[s.key]}</span>
            </div>
          ))}
        </div>

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
        {tab === 'items'         && <ItemsPanel         onMutate={refreshStats} />}
        {tab === 'monsters'      && <MonstersPanel       onMutate={refreshStats} />}
        {tab === 'recipes'       && <RecipesPanel        onMutate={refreshStats} />}
        {tab === 'biomes'        && <BiomesPanel         onMutate={refreshStats} />}
        {tab === 'breakthroughs' && <BreakthroughsPanel  onMutate={refreshStats} />}
        {tab === 'settings'      && <SettingsPanel />}
        {tab === 'craft-xp'      && <CraftXpPanel />}
        {tab === 'forge-cfg'     && <ForgeConfigPanel />}
        {tab === 'stat-cfg'      && <StatsConfigPanel />}
      </div>
    </div>
  )
}
