import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import type { DbCharacter } from '../types'

const router = Router()
const MAX_CHARACTERS = 3

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
    const { name, affinity } = req.body as Record<string, string>

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

    const result = await pool.query<DbCharacter>(
      `INSERT INTO characters (user_id, name, affinity)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, name.trim(), affinity ?? 'Fogo']
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

router.put('/:id', async (req, res) => {
  try {
    const allowed = [
      'cultivation_power', 'experience', 'realm', 'realm_stage', 'realm_level',
      'hp_current', 'hp_max', 'qi_current', 'qi_max',
      'strength', 'agility', 'vitality', 'defense', 'perception',
      'spirit_gold', 'last_played_at',
    ]

    const updates: string[] = []
    const values: unknown[] = []
    let i = 1

    for (const key of allowed) {
      if ((req.body as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${key} = $${i++}`)
        values.push((req.body as Record<string, unknown>)[key])
      }
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
