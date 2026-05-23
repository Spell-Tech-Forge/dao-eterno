import { useState, useEffect } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import { TabBar } from '../components/ui/TabBar'

interface MaintenanceStatus { enabled: boolean; message: string }

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null)
  const [adminBypass, setAdminBypass] = useState(false)

  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then((data: MaintenanceStatus) => setMaintenance(data))
      .catch(() => setMaintenance({ enabled: false, message: '' }))
  }, [])

  const showMaintenance = maintenance?.enabled && !adminBypass

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-amber-950/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-8 select-none">
          <div className="text-4xl sm:text-5xl font-bold tracking-[0.3em] text-amber-500/80 mb-1"
               style={{ fontFamily: 'serif', textShadow: '0 0 40px rgba(217,119,6,0.3)' }}>
            道 永恆
          </div>
          <div className="text-xs text-slate-600 tracking-[0.5em] uppercase mt-2">Dao Eterno</div>
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/60" />
            <span className="text-amber-800 text-xs">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/60" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60">
          <TabBar
            tabs={[
              { id: 'login',    label: 'Entrar' },
              { id: 'register', label: 'Iniciar Jornada' },
            ]}
            activeTab={tab}
            onChange={id => setTab(id as 'login' | 'register')}
          />
          <div className="p-5 sm:p-8">
            {tab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-700 tracking-widest">
          O Dao aguarda os dignos.
        </p>
      </div>

      {/* Modal de manutenção */}
      {showMaintenance && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="space-y-1">
              <div
                className="text-3xl font-bold tracking-[0.3em] text-amber-500/80"
                style={{ fontFamily: 'serif', textShadow: '0 0 40px rgba(217,119,6,0.3)' }}
              >
                道 永恆
              </div>
              <div className="text-xs text-slate-500 tracking-[0.5em] uppercase">Em Manutenção</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/60" />
              <span className="text-amber-800 text-xs">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/60" />
            </div>

            <div className="border border-amber-900/30 bg-slate-900 px-6 py-5">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {maintenance?.message}
              </p>
            </div>

            <button
              onClick={() => setAdminBypass(true)}
              className="text-xs text-slate-700 hover:text-slate-500 transition-colors"
            >
              Área do administrador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
