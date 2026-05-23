import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface MaintenanceConfig {
  enabled: boolean
  message: string
}

const DEFAULT_MESSAGE = 'O servidor está em manutenção. Voltamos em breve!\n\nAgradecemos a compreensão, cultivador.'

export function MaintenancePanel() {
  const [config, setConfig]   = useState<MaintenanceConfig>({ enabled: false, message: DEFAULT_MESSAGE })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [status, setStatus]   = useState<'idle' | 'ok' | 'error'>('idle')

  useEffect(() => {
    api.get<MaintenanceConfig>('/api/admin/maintenance')
      .then(data => setConfig({ enabled: data.enabled, message: data.message || DEFAULT_MESSAGE }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setStatus('idle')
    try {
      await api.post('/api/admin/maintenance', config)
      setStatus('ok')
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-slate-500 text-sm py-8 text-center">Carregando...</div>

  return (
    <div className="max-w-xl space-y-6">
      <div className="border border-slate-700 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-sm tracking-wider text-slate-200">Modo Manutenção</h2>
            <p className="text-xs text-slate-500 mt-0.5">Bloqueia login e registro de todos os usuários não-admin.</p>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
            className={[
              'relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none',
              config.enabled ? 'bg-amber-500' : 'bg-slate-700',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                config.enabled ? 'translate-x-8' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>

        <div className={[
          'text-xs px-3 py-2 border rounded font-medium tracking-wide',
          config.enabled
            ? 'border-amber-700/60 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 bg-slate-950 text-slate-500',
        ].join(' ')}>
          {config.enabled ? '⚠️ Manutenção ATIVA — usuários não podem entrar' : '✓ Servidor ABERTO — login normal'}
        </div>
      </div>

      <div className="border border-slate-700 bg-slate-900 p-5 space-y-3">
        <div>
          <label className="text-xs text-slate-400 tracking-wider uppercase">Mensagem exibida aos jogadores</label>
          <p className="text-xs text-slate-600 mt-0.5">Suporta quebras de linha. Será exibida no modal de manutenção.</p>
        </div>
        <textarea
          value={config.message}
          onChange={e => setConfig(c => ({ ...c, message: e.target.value }))}
          rows={6}
          className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-600/60 resize-none placeholder:text-slate-700 font-mono"
          placeholder={DEFAULT_MESSAGE}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 text-sm border border-amber-700/60 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-colors disabled:opacity-40"
        >
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
        {status === 'ok'    && <span className="text-xs text-teal-400">✓ Salvo com sucesso</span>}
        {status === 'error' && <span className="text-xs text-red-400">✗ Erro ao salvar</span>}
      </div>

      <div className="border border-slate-800 bg-slate-900/50 p-4 space-y-2">
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Prévia do modal</p>
        <div className="border border-amber-900/40 bg-slate-950 p-4 space-y-3">
          <div className="text-center space-y-1">
            <div className="text-amber-500/80 font-bold tracking-[0.3em] text-sm" style={{ fontFamily: 'serif' }}>
              道 永恆
            </div>
            <div className="text-xs text-slate-500 tracking-[0.4em]">EM MANUTENÇÃO</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-900/40" />
            <span className="text-amber-800 text-xs">✦</span>
            <div className="flex-1 h-px bg-amber-900/40" />
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed whitespace-pre-line">
            {config.message || DEFAULT_MESSAGE}
          </p>
        </div>
      </div>
    </div>
  )
}
