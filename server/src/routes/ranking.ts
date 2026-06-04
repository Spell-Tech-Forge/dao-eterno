import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireNoMaintenance)

const REALM_ORDER = `CASE realm
    WHEN 'body_tempering'        THEN  1 WHEN 'Refinamento de Qi'        THEN 1 WHEN 'qi_refining'          THEN 1
    WHEN 'houtian'               THEN  2 WHEN 'Fundação Espiritual'      THEN 2 WHEN 'foundation'           THEN 2
    WHEN 'xiantian'              THEN  3 WHEN 'Núcleo Dourado'           THEN 3 WHEN 'golden_core'          THEN 3
    WHEN 'revolving_core'        THEN  4 WHEN 'Alma Nascente'            THEN 4 WHEN 'nascent_soul'         THEN 4
    WHEN 'life_destruction'      THEN  5
    WHEN 'divine_sea'            THEN  6 WHEN 'Transformação Espiritual' THEN 5 WHEN 'spirit_transformation' THEN 5
    WHEN 'divine_transformation' THEN  7 WHEN 'Unificação'               THEN 6 WHEN 'unification'          THEN 6
    WHEN 'divine_lord'           THEN  8 WHEN 'Ascensão'                 THEN 7 WHEN 'ascension'            THEN 7
    WHEN 'holy_lord'             THEN  9 WHEN 'Imortal'                  THEN 8 WHEN 'immortal'             THEN 8
    WHEN 'world_king'            THEN 10
    WHEN 'empyrean'              THEN 11
    WHEN 'true_divinity'         THEN 12
    WHEN 'beyond_divinity'       THEN 13
    ELSE 0 END`

const STAGE_ORDER = `CASE realm_stage
    WHEN 'strength'      THEN 1 WHEN 'Inicial'  THEN 1 WHEN 'initial'  THEN 1
    WHEN 'muscle'        THEN 2 WHEN 'Médio'    THEN 2 WHEN 'middle'   THEN 2
    WHEN 'bone'          THEN 3 WHEN 'Avançado' THEN 3 WHEN 'advanced' THEN 3
    WHEN 'marrow'        THEN 4 WHEN 'Pico'     THEN 4 WHEN 'peak'     THEN 4
    WHEN 'meridian'      THEN 5
    WHEN 'eight_gates'   THEN 6
    WHEN 'nine_stars'    THEN 7
    WHEN 'destruction_1' THEN 1 WHEN 'destruction_2' THEN 2 WHEN 'destruction_3' THEN 3
    WHEN 'destruction_4' THEN 4 WHEN 'destruction_5' THEN 5 WHEN 'destruction_6' THEN 6
    WHEN 'destruction_7' THEN 7 WHEN 'destruction_8' THEN 8 WHEN 'destruction_9' THEN 9
    ELSE 0 END`

// Calcula poder real a partir de stats base + realm (sem necessidade de queries extras)
function calcBasePower(row: {
  strength: number; agility: number; vitality: number; defense: number; perception: number
  realm: string; realm_stage: string
}): number {
  const REALM_LVL: Record<string, number> = {
    body_tempering:0,houtian:10,xiantian:20,revolving_core:30,life_destruction:40,
    divine_sea:50,divine_transformation:60,divine_lord:70,holy_lord:80,
    world_king:90,empyrean:100,true_divinity:110,beyond_divinity:120,
    qi_refining:0,foundation:10,golden_core:20,nascent_soul:30,
    spirit_transformation:50,unification:60,ascension:70,immortal:80,
  }
  const STAGE_LVL: Record<string, number> = {
    strength:0,muscle:1,bone:2,marrow:3,meridian:4,eight_gates:5,nine_stars:6,
    initial:0,middle:1,advanced:2,peak:3,
    destruction_1:0,destruction_2:1,destruction_3:2,destruction_4:3,destruction_5:4,
    destruction_6:5,destruction_7:6,destruction_8:7,destruction_9:8,
  }
  const realmLvl = (REALM_LVL[row.realm] ?? 0) + (STAGE_LVL[row.realm_stage] ?? 0)
  const realmMult = Math.max(1, Math.pow(1.5, realmLvl / 4))

  const atk = (row.strength ?? 5) * 4
  const hp  = (row.vitality ?? 5) * 20
  const def = (row.defense  ?? 3) * 3
  const spd = Math.max(0.5, 2.0 - (row.agility ?? 5) * 0.03)
  const crit = 1 + (row.perception ?? 3) * 0.005

  const dps  = (atk / spd) * crit
  const surv = hp * (1 + def / 300)
  return Math.round(Math.sqrt(dps * surv) * realmMult)
}

// Hall dos Heróis
router.get('/heroes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.realm, c.realm_stage, c.realm_level,
              c.cultivation_power, c.qi_current, c.qi_max, c.total_kills,
              c.last_played_at, c.class_id,
              c.strength, c.agility, c.vitality, c.defense, c.perception,
              c.inventory->'equipped' AS equipped_snapshot,
              u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY ${REALM_ORDER} DESC,
                ${STAGE_ORDER} DESC,
                c.qi_current DESC
       LIMIT 50`
    )
    const rows = result.rows.map(r => ({
      ...r,
      player_power: calcBasePower(r),
    }))
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar ranking.' })
  }
})

// Hall das Lendas
router.get('/legends', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (l.user_id)
                l.id, l.name, l.realm, l.realm_stage, l.realm_level,
                l.cultivation_power, l.cause_of_death, l.born_at, l.died_at,
                l.total_kills, l.equipped_snapshot,
                COALESCE(l.class_id, l.character_snapshot->>'class_id') AS class_id,
                (l.character_snapshot->>'strength')::int   AS strength,
                (l.character_snapshot->>'agility')::int    AS agility,
                (l.character_snapshot->>'vitality')::int   AS vitality,
                (l.character_snapshot->>'defense')::int    AS defense,
                (l.character_snapshot->>'perception')::int AS perception,
                u.username
         FROM legends l
         JOIN users u ON l.user_id = u.id
         ORDER BY l.user_id,
                  ${REALM_ORDER} DESC,
                  ${STAGE_ORDER} DESC,
                  l.cultivation_power DESC
       ) best
       ORDER BY ${REALM_ORDER} DESC,
                ${STAGE_ORDER} DESC,
                best.cultivation_power DESC
       LIMIT 50`
    )
    const rows = result.rows.map(r => ({
      ...r,
      player_power: calcBasePower({
        strength:   r.strength   ?? 5,
        agility:    r.agility    ?? 5,
        vitality:   r.vitality   ?? 5,
        defense:    r.defense    ?? 3,
        perception: r.perception ?? 3,
        realm:      r.realm,
        realm_stage: r.realm_stage,
      }),
    }))
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar Hall das Lendas.' })
  }
})

export default router
