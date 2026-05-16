interface Tab {
  id: string
  label: string
  icon?: string
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-slate-700/60">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex-1 py-3 px-4 text-sm tracking-wider transition-all duration-200',
            'border-b-2 -mb-px',
            activeTab === tab.id
              ? 'text-amber-400 border-amber-600 bg-amber-950/10'
              : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600',
          ].join(' ')}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
