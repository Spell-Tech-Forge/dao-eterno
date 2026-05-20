import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { useSkillsStore } from '../store/skillsStore'
import type { TickMessage } from '../types'

const worker = new Worker(
  new URL('../workers/gameLoop.worker.ts', import.meta.url),
  { type: 'module' }
)

export function useGameLoop() {
  const gainQi             = usePlayerStore((s) => s.gainQi)
  const gainSkillXp        = useSkillsStore((s) => s.gainSkillXp)
  const cleanExpiredBuffs  = usePlayerStore((s) => s.cleanExpiredBuffs)

  useEffect(() => {
    const handler = (e: MessageEvent<TickMessage>) => {
      if (e.data.type !== 'tick') return

      // Limpa buffs expirados a cada tick
      cleanExpiredBuffs()

      const { qi, maxQi, meditationEndsAt } = usePlayerStore.getState()
      if (Date.now() > meditationEndsAt) return
      if (qi >= maxQi) return

      gainQi(3)
      gainSkillXp('meditation', 1)
    }
    worker.addEventListener('message', handler)
    return () => worker.removeEventListener('message', handler)
  }, [gainQi, gainSkillXp, cleanExpiredBuffs])
}
