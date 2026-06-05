import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

export function RecipeSellPanel() {
  const sellRecipesEnabled = useSettingsStore(s => s.sellRecipesEnabled)
  const save               = useSettingsStore(s => s.save)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  async function toggle() {
    setSaving(true)
    setStatus('idle')
    try {
      await save({ sell_recipes_enabled: sellRecipesEnabled ? '0' : '1' })
      setStatus('ok')
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="border border-slate-700 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-sm tracking-wider text-slate-200">Venda de Receitas para NPCs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Habilita ou desabilita a aba "Vender Receitas" na tela de mercadores para todos os jogadores.
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            className={[
              'relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50',
              sellRecipesEnabled ? 'bg-teal-600' : 'bg-slate-700',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
              sellRecipesEnabled ? 'translate-x-8' : 'translate-x-1',
            ].join(' ')} />
          </button>
        </div>

        <div className={[
          'text-xs px-3 py-2 border font-medium tracking-wide',
          sellRecipesEnabled
            ? 'border-teal-700/60 bg-teal-950/20 text-teal-400'
            : 'border-slate-700 bg-slate-950 text-slate-500',
        ].join(' ')}>
          {sellRecipesEnabled
            ? '✓ Venda de receitas HABILITADA — jogadores podem vender receitas para NPCs'
            : '✗ Venda de receitas DESABILITADA — aba "Vender" oculta nos mercadores'}
        </div>

        {status === 'ok'    && <p className="text-xs text-teal-400">✓ Configuração salva</p>}
        {status === 'error' && <p className="text-xs text-red-400">✗ Erro ao salvar</p>}
      </div>
    </div>
  )
}
