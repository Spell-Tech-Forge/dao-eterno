import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireNoMaintenance)

// ── GET /api/merchants?locationId=xxx — mercadores da localização ─────────────

router.get('/', async (req, res) => {
  const { locationId } = req.query as { locationId?: string }
  if (!locationId) return res.status(400).json({ error: 'locationId obrigatório.' })

  try {
    const { rows: merchants } = await pool.query<{
      id: number; name: string; emoji: string; description: string; specialty: string; sort_order: number
    }>(
      `SELECT id, name, emoji, description, specialty, sort_order
       FROM game_merchants WHERE location_id=$1 AND active=TRUE ORDER BY sort_order, id`,
      [locationId]
    )

    // Para cada mercador carrega o estoque com limite diário do jogador
    const today = new Date().toISOString().slice(0, 10)
    const result = await Promise.all(merchants.map(async m => {
      const { rows: stock } = await pool.query(`
        SELECT ms.item_def_id, ms.price_gold, ms.daily_limit, ms.sort_order,
               COALESCE(mp.quantity_today, 0) AS bought_today
        FROM merchant_stock ms
        LEFT JOIN merchant_purchases mp
          ON mp.merchant_id = ms.merchant_id
         AND mp.user_id = $2
         AND mp.item_def_id = ms.item_def_id
         AND mp.purchase_date = $3
        WHERE ms.merchant_id = $1
        ORDER BY ms.sort_order, ms.id
      `, [m.id, req.userId, today])
      return { ...m, stock }
    }))

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar mercadores.' })
  }
})

// ── POST /api/merchants/:merchantId/buy — comprar item ───────────────────────

router.post('/:merchantId/buy', async (req, res) => {
  const merchantId = parseInt(req.params.merchantId)
  const { itemDefId, quantity } = req.body as { itemDefId: string; quantity: number }
  const qty = Math.max(1, Math.floor(quantity) || 1)

  if (!itemDefId) return res.status(400).json({ error: 'itemDefId obrigatório.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Busca mercador e item no estoque
    const { rows: [stock] } = await client.query<{
      price_gold: number; daily_limit: number; merchant_location: string
    }>(
      `SELECT ms.price_gold, ms.daily_limit, gm.location_id AS merchant_location
       FROM merchant_stock ms
       JOIN game_merchants gm ON gm.id = ms.merchant_id
       WHERE ms.merchant_id = $1 AND ms.item_def_id = $2 AND gm.active = TRUE`,
      [merchantId, itemDefId]
    )
    if (!stock) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Item não disponível neste mercador.' })
    }

    // Verifica limite diário
    const today = new Date().toISOString().slice(0, 10)
    if (stock.daily_limit > 0) {
      const { rows: [purchase] } = await client.query<{ quantity_today: number }>(
        `SELECT quantity_today FROM merchant_purchases
         WHERE merchant_id=$1 AND user_id=$2 AND item_def_id=$3 AND purchase_date=$4`,
        [merchantId, req.userId, itemDefId, today]
      )
      const boughtToday = purchase?.quantity_today ?? 0
      if (boughtToday + qty > stock.daily_limit) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: `Limite diário atingido (${stock.daily_limit}/dia). Já comprou ${boughtToday}.`
        })
      }
    }

    // Busca personagem para debitar ouro e adicionar ao inventário
    const { rows: [char] } = await client.query<{
      id: number; spirit_gold: number; inventory: Record<string, unknown> | null
    }>(
      'SELECT id, spirit_gold, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1',
      [req.userId]
    )
    if (!char) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }

    const totalCost = stock.price_gold * qty
    if (char.spirit_gold < totalCost) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Ouro insuficiente (precisa ${totalCost.toLocaleString('pt-BR')}).` })
    }

    // Verifica se o item existe
    const { rows: [itemDef] } = await client.query<{ stackable: boolean; type: string }>(
      'SELECT stackable, type FROM game_items WHERE id=$1', [itemDefId]
    )
    if (!itemDef) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Item não encontrado.' }) }

    // Adiciona ao inventário
    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const items: any[] = [...(inv.items ?? [])]
    if (itemDef.stackable) {
      const ex = items.find((i: any) => i.definitionId === itemDefId)
      if (ex) {
        ex.quantity += qty
      } else {
        items.push({ instanceId: `${itemDefId}-${Date.now()}`, definitionId: itemDefId, quantity: qty, obtainedAt: Date.now() })
      }
    } else {
      for (let i = 0; i < qty; i++) {
        items.push({
          instanceId: `${itemDefId}-${Date.now()}-${i}`,
          definitionId: itemDefId,
          quantity: 1,
          durability: 100,
          obtainedAt: Date.now(),
        })
      }
    }

    // Atualiza DB
    await client.query(
      'UPDATE characters SET spirit_gold=spirit_gold-$1, inventory=$2 WHERE id=$3',
      [totalCost, JSON.stringify({ ...inv, items }), char.id]
    )

    // Registra compra (upsert)
    await client.query(`
      INSERT INTO merchant_purchases (merchant_id, user_id, item_def_id, quantity_today, purchase_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (merchant_id, user_id, item_def_id)
      DO UPDATE SET
        quantity_today = CASE
          WHEN merchant_purchases.purchase_date = $5
          THEN merchant_purchases.quantity_today + $4
          ELSE $4
        END,
        purchase_date = $5
    `, [merchantId, req.userId, itemDefId, qty, today])

    await client.query('COMMIT')
    return res.json({
      ok: true,
      gold_spent: totalCost,
      inventory: { ...inv, items },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao comprar item.' })
  } finally {
    client.release()
  }
})

export default router
