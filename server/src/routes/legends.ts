import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import type { DbLegend } from '../types'

const router = Router()

router.use(requireAuth)

router.get('/mine', async (req, res) => {
  try {
    const result = await pool.query<DbLegend>(
      'SELECT * FROM legends WHERE user_id = $1 ORDER BY died_at DESC',
      [req.userId]
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar lendas.' })
  }
})

export default router
