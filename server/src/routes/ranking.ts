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

interface CharRow {
  strength: number; agility: number; vitality: number; defense: number; perception: number
  luck: number; realm: string; realm_stage: string
  inventory: {
    equipped?: {
      weapon?:    { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
      armor?:     { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
      accessory?: { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null
    }
  } | null
}

// Coleta IDs únicos de todos os itens equipados de uma lista de personagens
function collectEquippedIds(rows: CharRow[]): string[] {
  const ids = new Set<string>()
  for (const r of rows) {
    const eq = r.inventory?.equipped
    if (!eq) continue
    for (const slot of ['weapon','armor','accessory'] as const) {
      const def = eq[slot]?.definitionId
      if (def) ids.add(def)
    }
  }
  return [...ids]
}

// Fórmula idêntica à da Ficha do Personagem (CharacterSheet.tsx)
function calcPower(
  row: CharRow,
  itemStats: Map<string, { atk?: number; def?: number; hp?: number }>
): number {
  const realmLvl  = (REALM_LVL[row.realm] ?? 0) + (STAGE_LVL[row.realm_stage] ?? 0)
  const realmMult = Math.max(1, Math.pow(1.5, realmLvl / 4))

  // Stats base (fórmulas padrão do jogo)
  let totalAtk = (row.strength ?? 5) * 4
  let totalHp  = (row.vitality ?? 5) * 20
  let totalDef = (row.defense  ?? 3) * 3
  const baseSpd = Math.max(0.5, 2.0 - (row.agility ?? 5) * 0.03)

  // Bônus de equipamentos
  const eq = row.inventory?.equipped
  if (eq) {
    for (const slot of ['weapon','armor','accessory'] as const) {
      const e = eq[slot]; if (!e) continue
      const s = itemStats.get(e.definitionId); if (!s) continue
      const upgLvl  = e.upgradeLevel  ?? 0
      const ascTier = e.ascensionTier ?? 0
      const mult    = 1 + upgLvl * 0.05 * (1 + ascTier * 0.5)
      totalAtk += (s.atk ?? 0) * mult
      totalDef += (s.def ?? 0) * mult
      totalHp  += (s.hp  ?? 0) * mult
    }
  }

  const critChance = (row.luck ?? 0) * 0.5       // % de chance de crit
  const critDmg    = (row.perception ?? 3) * 5   // % de bônus de dano crítico (não total)
  const critMult   = 1 + (critChance / 100) * (critDmg / 100)

  const dps  = (totalAtk / baseSpd) * critMult
  const surv = totalHp * (1 + totalDef / 300)
  return Math.round(Math.sqrt(dps * surv) * realmMult)
}

// ── Hall dos Heróis ──────────────────────────────────────────────────────────
router.get('/heroes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.realm, c.realm_stage, c.realm_level,
              c.cultivation_power, c.qi_current, c.qi_max, c.total_kills,
              c.last_played_at, c.class_id,
              c.strength, c.agility, c.vitality, c.defense, c.perception, c.luck,
              c.inventory,
              c.inventory->'equipped' AS equipped_snapshot,
              u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY ${REALM_ORDER} DESC, ${STAGE_ORDER} DESC, c.qi_current DESC
       LIMIT 50`
    )
    const rows = result.rows as (CharRow & Record<string, unknown>)[]

    // Batch: busca stats de todos os itens equipados de uma vez
    const itemIds = collectEquippedIds(rows)
    const itemStatsMap = new Map<string, { atk?: number; def?: number; hp?: number }>()
    if (itemIds.length > 0) {
      const { rows: items } = await pool.query<{ id: string; stats: Record<string, number> }>(
        `SELECT id, stats FROM game_items WHERE id = ANY($1)`, [itemIds]
      )
      for (const item of items) itemStatsMap.set(item.id, item.stats ?? {})
    }

    return res.json(rows.map(r => ({ ...r, player_power: calcPower(r, itemStatsMap) })))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar ranking.' })
  }
})

// ── Hall das Lendas ───────────────────────────────────────────────────────────
router.get('/legends', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (l.user_id)
                l.id, l.name, l.realm, l.realm_stage, l.realm_level,
                l.cultivation_power, l.cause_of_death, l.born_at, l.died_at,
                l.total_kills, l.equipped_snapshot,
                COALESCE(l.class_id, l.character_snapshot->>'class_id') AS class_id,
                COALESCE((l.character_snapshot->>'strength')::int,   5)  AS strength,
                COALESCE((l.character_snapshot->>'agility')::int,    5)  AS agility,
                COALESCE((l.character_snapshot->>'vitality')::int,   5)  AS vitality,
                COALESCE((l.character_snapshot->>'defense')::int,    3)  AS defense,
                COALESCE((l.character_snapshot->>'perception')::int, 3)  AS perception,
                COALESCE((l.character_snapshot->>'luck')::int,       0)  AS luck,
                l.character_snapshot->'inventory' AS inventory,
                u.username
         FROM legends l
         JOIN users u ON l.user_id = u.id
         ORDER BY l.user_id, ${REALM_ORDER} DESC, ${STAGE_ORDER} DESC, l.cultivation_power DESC
       ) best
       ORDER BY ${REALM_ORDER} DESC, ${STAGE_ORDER} DESC, best.cultivation_power DESC
       LIMIT 50`
    )
    const rows = result.rows as (CharRow & Record<string, unknown>)[]

    const itemIds = collectEquippedIds(rows)
    const itemStatsMap = new Map<string, { atk?: number; def?: number; hp?: number }>()
    if (itemIds.length > 0) {
      const { rows: items } = await pool.query<{ id: string; stats: Record<string, number> }>(
        `SELECT id, stats FROM game_items WHERE id = ANY($1)`, [itemIds]
      )
      for (const item of items) itemStatsMap.set(item.id, item.stats ?? {})
    }

    return res.json(rows.map(r => ({ ...r, player_power: calcPower(r, itemStatsMap) })))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar Hall das Lendas.' })
  }
})

export default router
