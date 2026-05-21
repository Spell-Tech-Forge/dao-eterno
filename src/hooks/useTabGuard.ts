import { useState, useEffect, useRef } from 'react'

const HEARTBEAT_KEY      = 'dao-tab-session'
const TAB_ID_SESSION_KEY = 'dao-tab-id'
const HEARTBEAT_INTERVAL = 5000
const SESSION_TIMEOUT    = 12000

interface Session {
  tabId:  string
  userId: number
  ts:     number
}

// tabId persiste via sessionStorage → sobrevive a refreshes mas não a novas abas
function getOrCreateTabId(): string {
  const existing = sessionStorage.getItem(TAB_ID_SESSION_KEY)
  if (existing) return existing
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem(TAB_ID_SESSION_KEY, id)
  return id
}

export function useTabGuard(userId: number | undefined) {
  const tabId = useRef(getOrCreateTabId())
  const [isBlocked, setIsBlocked] = useState(false)
  const isBlockedRef = useRef(false)

  function claimSession() {
    if (!userId) return
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({ tabId: tabId.current, userId, ts: Date.now() } satisfies Session))
  }

  function takeOver() {
    claimSession()
    isBlockedRef.current = false
    setIsBlocked(false)
  }

  useEffect(() => {
    if (!userId) return

    const checkAndClaim = () => {
      const raw = localStorage.getItem(HEARTBEAT_KEY)
      if (raw) {
        try {
          const session = JSON.parse(raw) as Session
          const sameUser    = session.userId === userId
          const differentTab = session.tabId !== tabId.current
          const recent      = Date.now() - session.ts < SESSION_TIMEOUT
          if (sameUser && differentTab && recent) {
            isBlockedRef.current = true
            setIsBlocked(true)
            return
          }
        } catch {}
      }
      claimSession()
      isBlockedRef.current = false
      setIsBlocked(false)
    }

    checkAndClaim()

    const interval = setInterval(() => {
      if (!isBlockedRef.current) claimSession()
    }, HEARTBEAT_INTERVAL)

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== HEARTBEAT_KEY || !e.newValue) return
      try {
        const session = JSON.parse(e.newValue) as Session
        if (session.tabId !== tabId.current && session.userId === userId) {
          isBlockedRef.current = true
          setIsBlocked(true)
        }
      } catch {}
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      try {
        const raw = localStorage.getItem(HEARTBEAT_KEY)
        if (raw) {
          const session = JSON.parse(raw) as Session
          if (session.tabId === tabId.current && session.userId === userId) {
            localStorage.removeItem(HEARTBEAT_KEY)
          }
        }
      } catch {}
    }
  }, [userId])

  return { isBlocked, takeOver }
}
