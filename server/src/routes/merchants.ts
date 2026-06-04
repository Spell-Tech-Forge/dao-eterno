import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireNoMaintenance)

// ── Helpers de reputação ──────────────────────────────────────────────────────

const REPUTATION_LEVELS = [
  { level: 0, name: 'Desconhecido', minPoints: 0,    discountPct: 0  },
  { level: 1, name: 'Neutro',       minPoints: 100,  discountPct: 5  },
  { level: 2, name: 'Amigável',     minPoints: 500,  discountPct: 10 },
  { level: 3, name: 'Honrado',      minPoints: 2000, discountPct: 15 },
  { level: 4, name: 'Exaltado',     minPoints: 5000, discountPct: 20 },
]

function getRepLevel(points: number) {
  let level = REPUTATION_LEVELS[0]
  for (const l of REPUTATION_LEVELS) { if (points >= l.minPoints) level = l }
  return level
}

function applyDiscount(price: number, discountPct: number): number {
  return Math.max(1, Math.floor(price * (1 - discountPct / 100)))
}

// ── GET /api/merchants?locationId=xxx ─────────────────────────────────────────

router.get('/', async (req, res) => {
  const { locationId } = req.query as { locationId?: string }
  if (!locationId) return res.status(400).json({ error: 'locationId obrigatório.' })

  try {
    const { rows: merchants } = await pool.query(
      `SELECT id, name, emoji, description, specialty, sort_order
       FROM game_merchants WHERE location_id=$1 AND active=TRUE ORDER BY sort_order, id`,
      [locationId]
    )

    const today = new Date().toISOString().slice(0, 10)
    const result = await Promise.all(merchants.map(async m => {
      // Estoque com todos os campos novos + compras de hoje + reputação
      const { rows: stock } = await pool.query(`
        SELECT ms.item_def_id, ms.price_gold, ms.daily_limit, ms.sort_order,
               ms.materials_cost, ms.dao_crystal_cost, ms.min_reputation, ms.rep_points_reward,
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

      // Reputação do jogador neste mercador
      const { rows: [rep] } = await pool.query<{ points: number }>(
        'SELECT points FROM merchant_reputation WHERE merchant_id=$1 AND user_id=$2',
        [m.id, req.userId]
      )
      const repPoints = rep?.points ?? 0
      const repLevel  = getRepLevel(repPoints)

      return {
        ...m,
        rep_points:  repPoints,
        rep_level:   repLevel.level,
        rep_name:    repLevel.name,
        discount_pct: repLevel.discountPct,
        stock: stock.filter(s => s.min_reputation <= repLevel.level),  // esconde itens bloqueados
        locked_stock_count: stock.filter(s => s.min_reputation > repLevel.level).length,
      }
    }))

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar mercadores.' })
  }
})

// ── POST /api/merchants/:merchantId/buy ───────────────────────────────────────

router.post('/:merchantId/buy', async (req, res) => {
  const merchantId = parseInt(req.params.merchantId)
  const { itemDefId, quantity } = req.body as { itemDefId: string; quantity: number }
  const qty = Math.max(1, Math.floor(quantity) || 1)
  if (!itemDefId) return res.status(400).json({ error: 'itemDefId obrigatório.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Busca estoque com novos campos
    const { rows: [stock] } = await client.query<{
      price_gold: number; daily_limit: number; materials_cost: { itemId: string; quantity: number }[]
      dao_crystal_cost: number; min_reputation: number; rep_points_reward: number
    }>(
      `SELECT ms.price_gold, ms.daily_limit, ms.materials_cost, ms.dao_crystal_cost,
              ms.min_reputation, ms.rep_points_reward
       FROM merchant_stock ms
       JOIN game_merchants gm ON gm.id = ms.merchant_id
       WHERE ms.merchant_id=$1 AND ms.item_def_id=$2 AND gm.active=TRUE`,
      [merchantId, itemDefId]
    )
    if (!stock) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Item não disponível neste mercador.' })
    }

    // Verifica reputação mínima
    const { rows: [rep] } = await client.query<{ points: number }>(
      'SELECT points FROM merchant_reputation WHERE merchant_id=$1 AND user_id=$2',
      [merchantId, req.userId]
    )
    const repPoints = rep?.points ?? 0
    const repLevel  = getRepLevel(repPoints)
    if (stock.min_reputation > repLevel.level) {
      await client.query('ROLLBACK')
      const needed = REPUTATION_LEVELS.find(l => l.level === stock.min_reputation)
      return res.status(403).json({ error: `Requer reputação "${needed?.name ?? 'Honrado'}" com este mercador.` })
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
        return res.status(400).json({ error: `Limite diário atingido (${stock.daily_limit}/dia).` })
      }
    }

    // Busca personagem
    const { rows: [char] } = await client.query<{
      id: number; spirit_gold: number; dao_crystals: number; inventory: Record<string, unknown> | null
    }>(
      'SELECT id, spirit_gold, dao_crystals, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1',
      [req.userId]
    )
    if (!char) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }

    // Calcula custo com desconto de reputação
    const discountPct  = repLevel.discountPct
    const finalGold    = applyDiscount(stock.price_gold * qty, discountPct)
    const finalCrystals = stock.dao_crystal_cost * qty
    const materialsCost: { itemId: string; quantity: number }[] = stock.materials_cost ?? []

    // Valida ouro
    if (finalGold > 0 && char.spirit_gold < finalGold) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Ouro insuficiente (precisa ${finalGold.toLocaleString('pt-BR')}).` })
    }

    // Valida Cristais do Dao
    if (finalCrystals > 0 && char.dao_crystals < finalCrystals) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Cristais do Dao insuficientes (precisa ${finalCrystals}).` })
    }

    // Valida e consome materiais do inventário
    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    let items: any[] = [...(inv.items ?? [])]
    for (const mat of materialsCost) {
      const needed = mat.quantity * qty
      const total = items.filter((i: any) => i.definitionId === mat.itemId).reduce((s: number, i: any) => s + i.quantity, 0)
      if (total < needed) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Material insuficiente: ${mat.itemId} (tem ${total}, precisa ${needed}).` })
      }
    }
    for (const mat of materialsCost) {
      let remaining = mat.quantity * qty
      items = items.map((i: any) => {
        if (i.definitionId !== mat.itemId || remaining <= 0) return i
        const take = Math.min(i.quantity, remaining); remaining -= take
        return { ...i, quantity: i.quantity - take }
      }).filter((i: any) => i.quantity > 0)
    }

    // Adiciona item comprado
    const { rows: [itemDef] } = await client.query<{ stackable: boolean; type: string }>(
      'SELECT stackable, type FROM game_items WHERE id=$1', [itemDefId]
    )
    if (!itemDef) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Item não encontrado.' }) }

    if (itemDef.stackable) {
      const ex = items.find((i: any) => i.definitionId === itemDefId)
      if (ex) { ex.quantity += qty }
      else items.push({ instanceId: `${itemDefId}-${Date.now()}`, definitionId: itemDefId, quantity: qty, obtainedAt: Date.now() })
    } else {
      for (let i = 0; i < qty; i++) {
        items.push({ instanceId: `${itemDefId}-${Date.now()}-${i}`, definitionId: itemDefId, quantity: 1, durability: 100, obtainedAt: Date.now() })
      }
    }

    // Debita pagamentos
    const updates: string[] = []
    const vals: unknown[] = []
    let p = 1
    if (finalGold > 0) { updates.push(`spirit_gold = spirit_gold - $${p++}`); vals.push(finalGold) }
    if (finalCrystals > 0) { updates.push(`dao_crystals = dao_crystals - $${p++}`); vals.push(finalCrystals) }
    updates.push(`inventory = $${p++}`); vals.push(JSON.stringify({ ...inv, items }))
    vals.push(char.id)
    await client.query(`UPDATE characters SET ${updates.join(', ')} WHERE id=$${p}`, vals)

    // Upsert de reputação
    const pointsEarned = stock.rep_points_reward * qty
    await client.query(`
      INSERT INTO merchant_reputation (merchant_id, user_id, points)
      VALUES ($1,$2,$3)
      ON CONFLICT (merchant_id, user_id) DO UPDATE SET points = merchant_reputation.points + $3
    `, [merchantId, req.userId, pointsEarned])

    // Registra compra diária
    await client.query(`
      INSERT INTO merchant_purchases (merchant_id, user_id, item_def_id, quantity_today, purchase_date)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (merchant_id, user_id, item_def_id)
      DO UPDATE SET
        quantity_today = CASE WHEN merchant_purchases.purchase_date=$5
          THEN merchant_purchases.quantity_today+$4 ELSE $4 END,
        purchase_date = $5
    `, [merchantId, req.userId, itemDefId, qty, today])

    // Atualiza char local para retorno
    await client.query('COMMIT')
    const newRep = (rep?.points ?? 0) + pointsEarned
    return res.json({
      ok: true,
      gold_spent: finalGold,
      crystals_spent: finalCrystals,
      discount_applied: discountPct,
      rep_points_earned: pointsEarned,
      new_rep_points: newRep,
      new_rep_level: getRepLevel(newRep),
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

// ── GET /api/merchants/reputation — reputação em todos os mercadores ──────────

router.get('/reputation', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT mr.merchant_id, mr.points, gm.name, gm.emoji, gm.location_id
      FROM merchant_reputation mr
      JOIN game_merchants gm ON gm.id = mr.merchant_id
      WHERE mr.user_id=$1 ORDER BY mr.points DESC
    `, [req.userId])
    return res.json(rows.map(r => ({
      ...r, ...getRepLevel(r.points), points: r.points,
    })))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro.' })
  }
})

// ── POST /api/merchants/sell-recipe — vender receita para o mercador ─────────

export const DEFAULT_RECIPE_SELL_PRICES: Record<number, number> = {
  2: 400, 3: 1200, 4: 3500, 5: 9000,
  6: 22000, 7: 55000, 8: 130000, 9: 300000, 10: 700000,
}

async function loadRecipeSellPrices(): Promise<Record<number, number>> {
  try {
    const { rows } = await pool.query<{ value: string }>(
      "SELECT value FROM game_settings WHERE key='recipe_sell_prices'"
    )
    if (rows.length) return { ...DEFAULT_RECIPE_SELL_PRICES, ...JSON.parse(rows[0].value) }
  } catch {}
  return DEFAULT_RECIPE_SELL_PRICES
}

router.post('/sell-recipe', async (req, res) => {
  const { instanceId } = req.body as { instanceId: string }
  if (!instanceId) return res.status(400).json({ error: 'instanceId obrigatório.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [char] } = await client.query<{ id: number; spirit_gold: number; inventory: Record<string,unknown>|null }>(
      'SELECT id, spirit_gold, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1',
      [req.userId]
    )
    if (!char) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }

    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const items: any[] = inv.items ?? []
    const item = items.find((i: any) => i.instanceId === instanceId)
    if (!item) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Item não encontrado no inventário.' }) }

    // Verifica que é receita
    const { rows: [def] } = await client.query<{ type: string; tier: number }>(
      'SELECT type, tier FROM game_items WHERE id=$1', [item.definitionId]
    )
    if (!def || def.type !== 'receita') {
      await client.query('ROLLBACK'); return res.status(400).json({ error: 'Apenas itens de receita podem ser vendidos aqui.' })
    }

    const prices = await loadRecipeSellPrices()
    const sellPrice = prices[def.tier] ?? 100  // preço por unidade — remove 1 item
    const newItems = items.map((i: any) => i.instanceId === instanceId
      ? { ...i, quantity: (i.quantity ?? 1) - 1 }
      : i
    ).filter((i: any) => (i.quantity ?? 1) > 0)

    await client.query('UPDATE characters SET spirit_gold=spirit_gold+$1, inventory=$2 WHERE id=$3',
      [sellPrice, JSON.stringify({ ...inv, items: newItems }), char.id])
    await client.query('COMMIT')
    return res.json({ ok: true, gold_earned: sellPrice, inventory: { ...inv, items: newItems } })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao vender receita.' })
  } finally { client.release() }
})

// ── GET /api/merchants/recipe-prices — preços de venda de receitas ───────────

router.get('/recipe-prices', async (_req, res) => {
  res.json(await loadRecipeSellPrices())
})

export { REPUTATION_LEVELS, getRepLevel }
export default router
