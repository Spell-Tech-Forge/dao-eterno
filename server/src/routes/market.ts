import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const LISTING_FEE    = 2
const DELIST_PENALTY = 5
const MAX_SLOTS      = 15

interface InventoryItem {
  instanceId: string
  definitionId: string
  quantity: number
  upgradeLevel?: number
  ascensionTier?: number
  durability?: number
  obtainedAt?: number
}

interface Inventory {
  items: InventoryItem[]
  equipped: Record<string, InventoryItem | null>
  maxSlots: number
}

// GET /api/market — active listings from other players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, seller_name, item_def_id, item_data, quantity, price, listed_at
       FROM market_listings
       WHERE active = true AND seller_id != $1
       ORDER BY listed_at DESC
       LIMIT 200`,
      [req.userId]
    )
    return res.json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar listagens.' })
  }
})

// GET /api/market/mine — my active listings + pending gold
router.get('/mine', async (req, res) => {
  try {
    const [listResult, userResult] = await Promise.all([
      pool.query(
        `SELECT id, item_def_id, item_data, quantity, price, listed_at
         FROM market_listings
         WHERE seller_id = $1 AND active = true
         ORDER BY listed_at DESC`,
        [req.userId]
      ),
      pool.query<{ pending_gold: string }>(
        'SELECT pending_gold FROM users WHERE id = $1',
        [req.userId]
      ),
    ])
    return res.json({
      listings: listResult.rows,
      pendingGold: Number(userResult.rows[0]?.pending_gold ?? 0),
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar suas listagens.' })
  }
})

// POST /api/market/list — list an item
router.post('/list', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { charId, instanceId, quantity, price } = req.body as {
      charId: number; instanceId: string; quantity: number; price: number
    }

    if (!charId || !instanceId || !quantity || !price || price < 2) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Dados inválidos.' })
    }

    const slotsResult = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM market_listings WHERE seller_id = $1 AND active = true',
      [req.userId]
    )
    if (parseInt(slotsResult.rows[0].count) >= MAX_SLOTS) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Slots de listagem cheios (máx ${MAX_SLOTS}).` })
    }

    const charResult = await client.query<{ inventory: Inventory; spirit_gold: string; name: string }>(
      'SELECT inventory, spirit_gold, name FROM characters WHERE id = $1 AND user_id = $2',
      [charId, req.userId]
    )
    if (!charResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const char = charResult.rows[0]
    const currentGold = Number(char.spirit_gold)
    if (currentGold < LISTING_FEE) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Ouro insuficiente (taxa: ${LISTING_FEE} 🪙).` })
    }

    const inv = char.inventory
    const itemIdx = inv.items.findIndex(i => i.instanceId === instanceId)
    if (itemIdx === -1) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Item não encontrado no inventário.' })
    }

    const item = inv.items[itemIdx]
    if ((item.quantity ?? 1) < quantity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Quantidade insuficiente.' })
    }

    const itemData: InventoryItem = { ...item, quantity }
    const newItems = [...inv.items]
    if (item.quantity <= quantity) {
      newItems.splice(itemIdx, 1)
    } else {
      newItems[itemIdx] = { ...item, quantity: item.quantity - quantity }
    }
    const newGold = currentGold - LISTING_FEE

    await client.query(
      'UPDATE characters SET inventory = $1, spirit_gold = $2 WHERE id = $3',
      [JSON.stringify({ ...inv, items: newItems }), newGold, charId]
    )

    const listResult = await client.query<{ id: string; listed_at: string }>(
      `INSERT INTO market_listings (seller_id, char_id, seller_name, item_def_id, item_data, quantity, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, listed_at`,
      [req.userId, charId, char.name, item.definitionId, JSON.stringify(itemData), quantity, price]
    )

    await client.query('COMMIT')
    return res.json({ ok: true, listing: listResult.rows[0], newGold })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao listar item.' })
  } finally {
    client.release()
  }
})

// DELETE /api/market/list/:id — delist item, return to inventory
router.delete('/list/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const listResult = await client.query(
      'SELECT * FROM market_listings WHERE id = $1 AND seller_id = $2 AND active = true FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!listResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Listagem não encontrada ou já encerrada.' })
    }

    const listing = listResult.rows[0]
    const charResult = await client.query<{ inventory: Inventory; spirit_gold: string }>(
      'SELECT inventory, spirit_gold FROM characters WHERE id = $1 AND user_id = $2',
      [listing.char_id, req.userId]
    )
    if (!charResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const char = charResult.rows[0]
    const currentGold = Number(char.spirit_gold)
    if (currentGold < DELIST_PENALTY) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Ouro insuficiente (multa: ${DELIST_PENALTY} 🪙).` })
    }

    const inv = char.inventory
    const returnedItem = listing.item_data as InventoryItem
    const newItems = [...inv.items]

    // Stack if same definition and no upgrades (stackable items like materials)
    const isUpgraded = (returnedItem.upgradeLevel ?? 0) > 0 || (returnedItem.ascensionTier ?? 0) > 0
    const existingIdx = !isUpgraded
      ? newItems.findIndex(i => i.definitionId === returnedItem.definitionId && !(i.upgradeLevel) && !(i.ascensionTier))
      : -1

    if (existingIdx !== -1) {
      newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + listing.quantity }
    } else {
      newItems.push({
        ...returnedItem,
        instanceId: `${returnedItem.definitionId}-${Date.now()}-r`,
        quantity: listing.quantity,
      })
    }

    const newGold = currentGold - DELIST_PENALTY

    await client.query(
      'UPDATE characters SET inventory = $1, spirit_gold = $2 WHERE id = $3',
      [JSON.stringify({ ...inv, items: newItems }), newGold, listing.char_id]
    )
    await client.query('UPDATE market_listings SET active = false WHERE id = $1', [req.params.id])

    await client.query('COMMIT')
    return res.json({ ok: true, newGold, returnedItem, returnedQty: listing.quantity })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao retirar item.' })
  } finally {
    client.release()
  }
})

// POST /api/market/buy/:id — purchase a listing
router.post('/buy/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { charId } = req.body as { charId: number }
    if (!charId) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'charId obrigatório.' })
    }

    const listResult = await client.query(
      'SELECT * FROM market_listings WHERE id = $1 AND active = true FOR UPDATE',
      [req.params.id]
    )
    if (!listResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Listagem não encontrada ou já vendida.' })
    }

    const listing = listResult.rows[0]
    if (listing.seller_id === req.userId) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Você não pode comprar seu próprio item.' })
    }

    const buyerResult = await client.query<{ inventory: Inventory; spirit_gold: string }>(
      'SELECT inventory, spirit_gold FROM characters WHERE id = $1 AND user_id = $2',
      [charId, req.userId]
    )
    if (!buyerResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const buyer = buyerResult.rows[0]
    const buyerGold = Number(buyer.spirit_gold)
    if (buyerGold < listing.price) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Ouro insuficiente.' })
    }

    const inv = buyer.inventory
    const boughtItem = listing.item_data as InventoryItem
    const newItems = [...inv.items]

    const isUpgraded = (boughtItem.upgradeLevel ?? 0) > 0 || (boughtItem.ascensionTier ?? 0) > 0
    const existingIdx = !isUpgraded
      ? newItems.findIndex(i => i.definitionId === boughtItem.definitionId && !(i.upgradeLevel) && !(i.ascensionTier))
      : -1

    if (existingIdx !== -1) {
      newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + listing.quantity }
    } else {
      if (newItems.length >= (inv.maxSlots ?? 30)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Inventário cheio.' })
      }
      newItems.push({
        ...boughtItem,
        instanceId: `${boughtItem.definitionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        quantity: listing.quantity,
        obtainedAt: Date.now(),
      })
    }

    const newBuyerGold = buyerGold - listing.price

    await client.query(
      'UPDATE characters SET inventory = $1, spirit_gold = $2 WHERE id = $3',
      [JSON.stringify({ ...inv, items: newItems }), newBuyerGold, charId]
    )
    await client.query(
      'UPDATE market_listings SET active = false, sold_at = NOW(), buyer_id = $1 WHERE id = $2',
      [req.userId, req.params.id]
    )
    // Gold só vai para o vendedor se ele ainda tiver um personagem vivo
    if (!listing.seller_dead) {
      await client.query(
        'UPDATE users SET pending_gold = pending_gold + $1 WHERE id = $2',
        [listing.price, listing.seller_id]
      )
    }

    await client.query('COMMIT')
    return res.json({ ok: true, newGold: newBuyerGold, boughtItem, quantity: listing.quantity })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao comprar item.' })
  } finally {
    client.release()
  }
})

// POST /api/market/claim — transfer pending gold to character
router.post('/claim', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { charId } = req.body as { charId: number }
    if (!charId) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'charId obrigatório.' })
    }

    const userResult = await client.query<{ pending_gold: string }>(
      'SELECT pending_gold FROM users WHERE id = $1 FOR UPDATE',
      [req.userId]
    )
    const pendingGold = Number(userResult.rows[0]?.pending_gold ?? 0)
    if (pendingGold <= 0) {
      await client.query('ROLLBACK')
      return res.json({ ok: true, newGold: null, claimed: 0 })
    }

    const charResult = await client.query<{ spirit_gold: string }>(
      'SELECT spirit_gold FROM characters WHERE id = $1 AND user_id = $2',
      [charId, req.userId]
    )
    if (!charResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const newGold = Number(charResult.rows[0].spirit_gold) + pendingGold
    await client.query('UPDATE characters SET spirit_gold = $1 WHERE id = $2', [newGold, charId])
    await client.query('UPDATE users SET pending_gold = 0 WHERE id = $1', [req.userId])

    await client.query('COMMIT')
    return res.json({ ok: true, newGold, claimed: pendingGold })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao coletar ouro.' })
  } finally {
    client.release()
  }
})

export default router
