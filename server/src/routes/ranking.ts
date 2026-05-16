import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

// Hall dos Heróis — top cultivadores vivos
router.get('/heroes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.cultivation_power DESC
       LIMIT 50`
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar ranking.' })
  }
})

// Hall das Lendas — top cultivadores mortos
router.get('/legends', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.username
       FROM legends l
       JOIN users u ON l.user_id = u.id
       ORDER BY l.cultivation_power DESC
       LIMIT 50`
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar Hall das Lendas.' })
  }
})

export default router
