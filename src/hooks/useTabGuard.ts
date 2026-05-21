import { useState, useEffect, useRef } from 'react'

const HEARTBEAT_KEY = 'dao-tab-session'
const HEARTBEAT_INTERVAL = 5000
const SESSION_TIMEOUT = 12000

interface Session { tabId: string; ts: number }

export function useTabGuard() {
  const tabId = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [isBlocked, setIsBlocked] = useState(false)
  const isBlockedRef = useRef(false)

  function claimSession() {
    const session: Session = { tabId: tabId.current, ts: Date.now() }
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(session))
  }

  function takeOver() {
    claimSession()
    isBlockedRef.current = false
    setIsBlocked(false)
  }

  useEffect(() => {
    const raw = localStorage.getItem(HEARTBEAT_KEY)
    if (raw) {
      try {
        const session = JSON.parse(raw) as Session
        if (session.tabId !== tabId.current && Date.now() - session.ts < SESSION_TIMEOUT) {
          isBlockedRef.current = true
          setIsBlocked(true)
        } else {
          claimSession()
        }
      } catch {
        claimSession()
      }
    } else {
      claimSession()
    }

    const interval = setInterval(() => {
      if (!isBlockedRef.current) claimSession()
    }, HEARTBEAT_INTERVAL)

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== HEARTBEAT_KEY) return
      if (!e.newValue) return
      try {
        const session = JSON.parse(e.newValue) as Session
        if (session.tabId !== tabId.current) {
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
        const current = localStorage.getItem(HEARTBEAT_KEY)
        if (current) {
          const session = JSON.parse(current) as Session
          if (session.tabId === tabId.current) localStorage.removeItem(HEARTBEAT_KEY)
        }
      } catch {}
    }
  }, [])

  return { isBlocked, takeOver }
}
