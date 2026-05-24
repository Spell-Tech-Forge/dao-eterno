import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()

router.use(requireAuth)
router.use(requireNoMaintenance)

// Handles both Portuguese (legacy) and English (post-migration) values stored in DB
const REALM_ORDER = `CASE realm
    WHEN 'Refinamento de Qi'        THEN 1 WHEN 'qi_refining'          THEN 1
    WHEN 'Fundação Espiritual'      THEN 2 WHEN 'foundation'           THEN 2
    WHEN 'Núcleo Dourado'           THEN 3 WHEN 'golden_core'          THEN 3
    WHEN 'Alma Nascente'            THEN 4 WHEN 'nascent_soul'         THEN 4
    WHEN 'Transformação Espiritual' THEN 5 WHEN 'spirit_transformation' THEN 5
    WHEN 'Unificação'               THEN 6 WHEN 'unification'          THEN 6
    WHEN 'Ascensão'                 THEN 7 WHEN 'ascension'            THEN 7
    WHEN 'Imortal'                  THEN 8 WHEN 'immortal'             THEN 8
    ELSE 0 END`

const STAGE_ORDER = `CASE realm_stage
    WHEN 'Inicial'  THEN 1 WHEN 'initial'  THEN 1
    WHEN 'Médio'    THEN 2 WHEN 'middle'   THEN 2
    WHEN 'Avançado' THEN 3 WHEN 'advanced' THEN 3
    WHEN 'Pico'     THEN 4 WHEN 'peak'     THEN 4
    ELSE 0 END`

// Hall dos Heróis — top cultivadores vivos
router.get('/heroes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.realm, c.realm_stage, c.realm_level,
              c.cultivation_power, c.qi_current, c.qi_max, c.total_kills,
              c.last_played_at,
              c.inventory->'equipped' AS equipped_snapshot,
              u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY ${REALM_ORDER} DESC,
                ${STAGE_ORDER} DESC,
                c.qi_current DESC
       LIMIT 50`
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar ranking.' })
  }
})

// Hall das Lendas — top cultivadores mortos (usa cultivation_power pois qi_current já era 0 na morte)
router.get('/legends', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.name, l.realm, l.realm_stage, l.realm_level,
              l.cultivation_power, l.cause_of_death, l.born_at, l.died_at,
              l.total_kills, l.equipped_snapshot,
              u.username
       FROM legends l
       JOIN users u ON l.user_id = u.id
       ORDER BY ${REALM_ORDER} DESC,
                ${STAGE_ORDER} DESC,
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
