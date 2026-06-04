import { useEffect, useRef, useState } from 'react'
import { useCombatStore } from '../store/combatStore'

const POLL_INTERVAL = 30_000  // 30s — detecta deploy rapidamente

async function fetchBuildTime(): Promise<number | null> {
  try {
    const r = await fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    if (!r.ok) return null
    const data = await r.json() as { buildTime?: unknown }
    return typeof data.buildTime === 'number' ? data.buildTime : null
  } catch {
    return null
  }
}

export function useVersionCheck() {
  const active           = useCombatStore(s => s.active)
  const initialBuildTime = useRef<number | null>(null)
  const [pendingReload,  setPendingReload]  = useState(false)
  const [countdown,      setCountdown]      = useState<number | null>(null)

  // Armazena buildTime inicial da sessão
  useEffect(() => {
    fetchBuildTime().then(t => { initialBuildTime.current = t })
  }, [])

  // Polling a cada 30s
  useEffect(() => {
    const id = setInterval(async () => {
      const current = await fetchBuildTime()
      if (
        current !== null &&
        initialBuildTime.current !== null &&
        current !== initialBuildTime.current
      ) {
        setPendingReload(true)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Quando há versão nova e player NÃO está em combate → recarrega com aviso de 4s
  useEffect(() => {
    if (!pendingReload || active) return

    // Inicia contagem regressiva de 4s antes de recarregar
    setCountdown(4)
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(tick)
          window.location.reload()
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [pendingReload, active])

  return { pendingReload, countdown }
}
