import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/items', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_items WHERE active = true ORDER BY type, name'
    )
    res.json(rows.map(r => ({
      id:          r.id,
      name:        r.name,
      emoji:       r.emoji,
      type:        r.type,
      rarity:      r.rarity,
      description: r.description ?? '',
      stats:       r.stats ?? {},
      stackable:   r.stackable ?? false,
    })))
  } catch {
    res.json([])
  }
})

router.get('/recipes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_recipes WHERE active = true ORDER BY category, required_tier, name'
    )
    res.json(rows.map(r => ({
      id:             r.id,
      name:           r.name,
      category:       r.category,
      outputItemId:   r.output_item_id,
      outputQuantity: r.output_quantity,
      requiredTier:   r.required_tier,
      ingredients:    r.ingredients ?? [],
    })))
  } catch {
    res.json([])
  }
})

export default router
