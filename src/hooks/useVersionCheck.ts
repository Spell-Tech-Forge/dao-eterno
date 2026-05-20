import { useEffect, useRef, useState } from 'react'
import { useCombatStore } from '../store/combatStore'

const POLL_INTERVAL = 60_000  // 60s

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
  const [pendingReload, setPendingReload] = useState(false)

  // Armazena o buildTime inicial da sessão
  useEffect(() => {
    fetchBuildTime().then(t => { initialBuildTime.current = t })
  }, [])

  // Polling a cada 60s
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

  // Recarrega quando houver versão nova E o jogador não estiver em combate
  useEffect(() => {
    if (pendingReload && !active) {
      window.location.reload()
    }
  }, [pendingReload, active])
}
