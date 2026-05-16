import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { useSkillsStore } from '../store/skillsStore'
import type { TickMessage } from '../types'

const worker = new Worker(
  new URL('../workers/gameLoop.worker.ts', import.meta.url),
  { type: 'module' }
)

export function useGameLoop() {
  const gainQi = usePlayerStore((s) => s.gainQi)
  const gainSkillXp = useSkillsStore((s) => s.gainSkillXp)
  const skills = useSkillsStore((s) => s.skills)

  useEffect(() => {
    const handler = (e: MessageEvent<TickMessage>) => {
      if (e.data.type !== 'tick') return
      if (!skills.find((sk) => sk.id === 'meditation')?.active) return

      // Para quando Qi está no máximo — Qi excedente é descartado
      const { qi, maxQi } = usePlayerStore.getState()
      if (qi >= maxQi) return

      gainQi(3)
      gainSkillXp('meditation', 1)
    }
    worker.addEventListener('message', handler)
    return () => worker.removeEventListener('message', handler)
  }, [skills, gainQi, gainSkillXp])
}
