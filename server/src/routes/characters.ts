import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import type { DbCharacter } from '../types'

const router = Router()
const MAX_CHARACTERS = 1

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query<DbCharacter>(
      'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar personagens.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, affinity, gender } = req.body as Record<string, string>

    if (!name || name.trim().length < 2 || name.trim().length > 24) {
      return res.status(400).json({ error: 'Nome inválido (2–24 caracteres).' })
    }

    const count = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM characters WHERE user_id = $1',
      [req.userId]
    )
    if (parseInt(count.rows[0].count) >= MAX_CHARACTERS) {
      return res.status(400).json({ error: `Limite de ${MAX_CHARACTERS} cultivadores atingido.` })
    }

    const validGender = gender === 'feminino' ? 'feminino' : 'masculino'

    // Lê stat_config para aplicar os atributos iniciais configurados pelo admin
    let str = 5, agi = 5, vit = 5, def = 3, per = 3
    let hpPerVit = 20
    try {
      const cfgRow = await pool.query<{ value: string }>(
        "SELECT value FROM game_settings WHERE key='stat_config'"
      )
      if (cfgRow.rows.length > 0) {
        const cfg = JSON.parse(cfgRow.rows[0].value)
        str      = cfg.initialStrength   ?? str
        agi      = cfg.initialAgility    ?? agi
        vit      = cfg.initialVitality   ?? vit
        def      = cfg.initialDefense    ?? def
        per      = cfg.initialPerception ?? per
        hpPerVit = cfg.hpPerVit          ?? hpPerVit
      }
    } catch { /* usa defaults acima */ }

    const hpMax = Math.max(1, Math.round(vit * hpPerVit))

    const result = await pool.query<DbCharacter>(
      `INSERT INTO characters (user_id, name, affinity, gender, qi_max, strength, agility, vitality, defense, perception, hp_current, hp_max)
       VALUES ($1, $2, $3, $4, 400, $5, $6, $7, $8, $9, $10, $10) RETURNING *`,
      [req.userId, name.trim(), affinity ?? 'Fogo', validGender, str, agi, vit, def, per, hpMax]
    )

    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao criar personagem.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query<DbCharacter>(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    return res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar personagem.' })
  }
})

// ── Validadores e clamps ──────────────────────────────────────────────────────

const VALID_REALMS = new Set([
  'qi_refining', 'foundation_building', 'core_formation', 'nascent_soul',
  'spirit_severing', 'void_refinement', 'body_integration', 'mahayana', 'immortal',
])
const VALID_STAGES = new Set(['initial', 'early', 'middle', 'late'])

function clampInt(val: unknown, min: number, max: number): number | undefined {
  if (val === undefined || val === null) return undefined
  const n = Number(val)
  if (!Number.isFinite(n)) return undefined
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

// Validação básica de inventário: rejeita valores fora dos limites razoáveis
// para evitar que itens sejam criados/modificados arbitrariamente via API.
function sanitizeInventory(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const inv = raw as Record<string, unknown>

  const MAX_SLOTS      = 200
  const MAX_UPGRADE    = 15
  const MAX_ASCENSION  = 5
  const MAX_DUR        = 250
  const MAX_QTY        = 9_999
  const MAX_GOLD_SLOTS = 2_000_000_000

  // Clamp maxSlots
  if (typeof inv.maxSlots === 'number') {
    inv.maxSlots = Math.max(1, Math.min(MAX_SLOTS, Math.trunc(inv.maxSlots)))
  }

  // Sanitize item array
  if (Array.isArray(inv.items)) {
    inv.items = inv.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') return item
      const it = item as Record<string, unknown>
      if (typeof it.upgradeLevel  === 'number') it.upgradeLevel  = Math.max(0, Math.min(MAX_UPGRADE,   Math.trunc(it.upgradeLevel)))
      if (typeof it.ascensionTier === 'number') it.ascensionTier = Math.max(0, Math.min(MAX_ASCENSION, Math.trunc(it.ascensionTier)))
      if (typeof it.durability    === 'number') it.durability    = Math.max(0, Math.min(MAX_DUR,       Math.trunc(it.durability)))
      if (typeof it.quantity      === 'number') it.quantity      = Math.max(1, Math.min(MAX_QTY,       Math.trunc(it.quantity)))
      return it
    })
  }

  // Sanitize equipped slots
  if (inv.equipped && typeof inv.equipped === 'object') {
    const eq = inv.equipped as Record<string, unknown>
    for (const slot of ['weapon', 'armor', 'accessory', 'ring']) {
      const s = eq[slot]
      if (s && typeof s === 'object') {
        const si = s as Record<string, unknown>
        if (typeof si.upgradeLevel  === 'number') si.upgradeLevel  = Math.max(0, Math.min(MAX_UPGRADE,   Math.trunc(si.upgradeLevel)))
        if (typeof si.ascensionTier === 'number') si.ascensionTier = Math.max(0, Math.min(MAX_ASCENSION, Math.trunc(si.ascensionTier)))
        if (typeof si.durability    === 'number') si.durability    = Math.max(0, Math.min(MAX_DUR,       Math.trunc(si.durability)))
      }
    }
  }

  // Unused but defensive: se existir pending_gold inline, clamp também
  if (typeof inv.pendingGold === 'number') {
    inv.pendingGold = Math.max(0, Math.min(MAX_GOLD_SLOTS, Math.trunc(inv.pendingGold)))
  }

  return inv
}

// ── PUT /:id — sync do estado do personagem ───────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>
    const jsonbFields = new Set(['inventory', 'skills', 'bestiary'])

    // Campos permitidos para sync — cada um passa por validação/clamping
    const allowed = [
      'cultivation_power', 'experience', 'realm', 'realm_stage', 'realm_level',
      'hp_current', 'hp_max', 'qi_current', 'qi_max',
      'strength', 'agility', 'vitality', 'defense', 'perception', 'luck',
      'spirit_gold', 'last_played_at',
      'inventory', 'skills', 'bestiary',
    ]

    // Limites máximos por campo
    const numericBounds: Record<string, [number, number]> = {
      strength:          [1, 2_000],
      agility:           [1, 2_000],
      vitality:          [1, 2_000],
      defense:           [1, 2_000],
      perception:        [1, 2_000],
      luck:              [0,   500],
      spirit_gold:       [0, 2_000_000_000],
      hp_current:        [0,   500_000],
      hp_max:            [1,   500_000],
      qi_current:        [0, 100_000_000],
      qi_max:            [1, 100_000_000],
      cultivation_power: [0, 100_000_000_000],
      realm_level:       [0,   999],
      experience:        [0, 100_000_000_000],
    }

    const updates: string[] = []
    const values: unknown[] = []
    let i = 1

    for (const key of allowed) {
      const val = body[key]
      if (val === undefined) continue

      let sanitized: unknown = val

      // Campos enum — só aceita valores conhecidos
      if (key === 'realm') {
        if (!VALID_REALMS.has(String(val))) continue
        sanitized = String(val)
      } else if (key === 'realm_stage') {
        if (!VALID_STAGES.has(String(val))) continue
        sanitized = String(val)
      // Campos numéricos com limites
      } else if (key in numericBounds) {
        const [min, max] = numericBounds[key]
        const clamped = clampInt(val, min, max)
        if (clamped === undefined) continue
        sanitized = clamped
      // Inventário — sanitiza estrutura interna
      } else if (key === 'inventory') {
        sanitized = sanitizeInventory(val)
      }

      updates.push(`${key} = $${i++}`)
      values.push(jsonbFields.has(key) && sanitized !== null ? JSON.stringify(sanitized) : sanitized)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' })
    }

    values.push(req.params.id, req.userId)
    const result = await pool.query<DbCharacter>(
      `UPDATE characters SET ${updates.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    return res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao atualizar personagem.' })
  }
})

// Permadeath: move character to legends table
router.post('/:id/die', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const charResult = await client.query<DbCharacter>(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (charResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const char = charResult.rows[0]
    const cause = (req.body as Record<string, string>).cause_of_death ?? 'Causas desconhecidas'

    const legendResult = await client.query(
      `INSERT INTO legends (user_id, original_character_id, name, realm, realm_stage, realm_level, cultivation_power, cause_of_death, born_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.userId, char.id, char.name, char.realm, char.realm_stage, char.realm_level, char.cultivation_power, cause, char.created_at]
    )

    await client.query('DELETE FROM characters WHERE id = $1', [char.id])
    // Listagens do mercado do player morto ficam visíveis, mas gold vai para o sistema
    await client.query(
      'UPDATE market_listings SET seller_dead = true WHERE seller_id = $1 AND active = true',
      [req.userId]
    )
    await client.query('COMMIT')

    return res.json({ legend: legendResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao registrar morte.' })
  } finally {
    client.release()
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM characters WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao deletar personagem.' })
  }
})

export default router
