import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()

router.use(requireAuth)
router.use(requireNoMaintenance)

const REALM_ORDER_SQL = `
  CASE realm
    WHEN 'Refinamento de Qi'        THEN 1
    WHEN 'Fundação Espiritual'      THEN 2
    WHEN 'Núcleo Dourado'           THEN 3
    WHEN 'Alma Nascente'            THEN 4
    WHEN 'Transformação Espiritual' THEN 5
    WHEN 'Unificação'               THEN 6
    WHEN 'Ascensão'                 THEN 7
    WHEN 'Imortal'                  THEN 8
    ELSE 0
  END`

const STAGE_ORDER_SQL = `
  CASE realm_stage
    WHEN 'Inicial'  THEN 1
    WHEN 'Médio'    THEN 2
    WHEN 'Avançado' THEN 3
    WHEN 'Pico'     THEN 4
    ELSE 0
  END`

// Hall dos Heróis — top cultivadores vivos
router.get('/heroes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.realm, c.realm_stage, c.realm_level,
              c.cultivation_power, c.total_kills,
              c.inventory->'equipped' AS equipped_snapshot,
              u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY ${REALM_ORDER_SQL} DESC,
                ${STAGE_ORDER_SQL} DESC,
                c.cultivation_power DESC
       LIMIT 50`
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar ranking.' })
  }
})

// Hall das Lendas — top cultivadores mortos
router.get('/legends', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.name, l.realm, l.realm_stage, l.realm_level,
              l.cultivation_power, l.cause_of_death, l.born_at, l.died_at,
              l.total_kills, l.equipped_snapshot,
              u.username
       FROM legends l
       JOIN users u ON l.user_id = u.id
       ORDER BY ${REALM_ORDER_SQL} DESC,
                ${STAGE_ORDER_SQL} DESC,
                l.cultivation_power DESC
       LIMIT 50`
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar Hall das Lendas.' })
  }
})

export default router
