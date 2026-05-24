import { Router, type Request, type Response } from 'express'
import { pool } from '../db'
import { randomUUID } from 'crypto'

const router = Router({ mergeParams: true })
type P = { id: string }

// ── Types ─────────────────────────────────────────────────────────────────────

type InvItem  = { instanceId: string; definitionId: string; quantity: number; durability?: number; obtainedAt: number; upgradeLevel?: number; ascensionTier?: number }
type Equipped = { weapon: InvItem|null; armor: InvItem|null; accessory: InvItem|null; ring: InvItem|null }
type Inv      = { items: InvItem[]; equipped: Equipped; maxSlots: number }
type BestiaryEntry = { monsterId: string; kills: number; firstKilledAt: number; discoveredDrops: string[] }
type BestiaryBlob  = { entries: Record<string, BestiaryEntry>; discoveredItems: string[] }

interface DropEntry  { itemId: string; chance: number; quantityMin: number; quantityMax: number }
interface MonsterRow { id: string; qi_reward: number; gold_reward_min: number; gold_reward_max: number; drop_table: DropEntry[]; level_min: number; level_max: number }
interface KillRecord { monsterId: string; rarity: string; level: number }

// ── In-memory combat sessions ──────────────────────────────────────────────────

interface CombatSession {
  charId:    number
  userId:    number
  biomeId:   string
  startedAt: number
  killCount: number
}

const combatSessions = new Map<string, CombatSession>()
const SESSION_TTL_MS  = 30 * 60 * 1000

// Purge expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [token, s] of combatSessions) {
    if (now - s.startedAt > SESSION_TTL_MS) combatSessions.delete(token)
  }
}, 5 * 60 * 1000).unref()

// ── POST /combat/start ─────────────────────────────────────────────────────────

router.post('/combat/start', async (req: Request<P>, res: Response) => {
  const charId = parseInt(req.params.id)
  const userId = req.userId!
  const { biomeId } = req.body as { biomeId?: string }

  if (!biomeId || typeof biomeId !== 'string') {
    return res.status(400).json({ error: 'biomeId obrigatório.' })
  }

  const { rows: [char] } = await pool.query(
    'SELECT id FROM characters WHERE id=$1 AND user_id=$2',
    [charId, userId]
  )
  if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })

  const { rows: [biomeRow] } = await pool.query(
    'SELECT id FROM game_biomes WHERE id=$1', [biomeId]
  )
  if (!biomeRow) return res.status(400).json({ error: 'Bioma inválido.' })

  // Invalidate any existing session for this character before issuing a new one
  for (const [token, s] of combatSessions) {
    if (s.charId === charId && s.userId === userId) combatSessions.delete(token)
  }

  const sessionToken = randomUUID()
  combatSessions.set(sessionToken, { charId, userId, biomeId, startedAt: Date.now(), killCount: 0 })

  return res.json({ sessionToken })
})

// ── Game logic — mirrors src/utils/combat.ts rollDrops ────────────────────────

const MAX_KILLS_PER_SECOND = 4
const MAX_SESSION_MS       = 20 * 60 * 1000  // 20 min — janela máxima aceita do cliente
const HARD_KILL_CAP        = 500             // teto absoluto por request, independente do tempo
const VALID_RARITIES       = new Set(['common', 'spiritual', 'rare', 'ancient', 'legendary'])

function rollDropsServer(dropTable: DropEntry[], luck = 0): { itemId: string; quantity: number }[] {
  const bonusRolls    = Math.floor(luck / 50)
  const partialChance = (luck % 50) / 50
  const luckChance    = Math.min(0.5, luck * 0.004)
  const luckQtyMult   = 1 + luck * 0.01

  const rollOnce = () =>
    (dropTable ?? []).reduce<{ itemId: string; quantity: number }[]>((acc, e) => {
      if (Math.random() < Math.min(1, e.chance + luckChance)) {
        const base = e.quantityMin + Math.floor(Math.random() * (e.quantityMax - e.quantityMin + 1))
        acc.push({ itemId: e.itemId, quantity: Math.max(1, Math.round(base * luckQtyMult)) })
      }
      return acc
    }, [])

  const merge = (a: { itemId: string; quantity: number }[], b: { itemId: string; quantity: number }[]) => {
    for (const d of b) {
      const ex = a.find(x => x.itemId === d.itemId)
      if (ex) ex.quantity += d.quantity
      else a.push({ ...d })
    }
    return a
  }

  let result = rollOnce()
  for (let i = 0; i < bonusRolls; i++) result = merge(result, rollOnce())
  if (Math.random() < partialChance) result = merge(result, rollOnce())
  return result
}

// ── POST /combat/resolve ───────────────────────────────────────────────────────

router.post('/combat/resolve', async (req: Request<P>, res: Response) => {
  const charId = parseInt(req.params.id)
  const userId = req.userId!
  const { biomeId, kills, elapsedMs, totalAttacks = 0, sessionToken } = req.body as {
    biomeId: string
    kills: KillRecord[]
    elapsedMs: number
    totalAttacks?: number
    sessionToken?: string
  }

  // Validate session token — must match character, user, and biome
  if (!sessionToken) {
    return res.status(400).json({ error: 'sessionToken obrigatório.' })
  }
  const session = combatSessions.get(sessionToken)
  if (!session || session.charId !== charId || session.userId !== userId || session.biomeId !== biomeId) {
    return res.status(401).json({ error: 'Sessão de combate inválida ou expirada.' })
  }

  if (!Array.isArray(kills) || kills.length === 0) {
    return res.status(400).json({ error: 'kills deve ser um array não-vazio.' })
  }

  // Valida estrutura de cada kill — rejeita entradas malformadas ou com raridade inválida
  const sanitizedKills: KillRecord[] = kills
    .filter(k =>
      k && typeof k.monsterId === 'string' && k.monsterId.length > 0 &&
      typeof k.rarity === 'string' && VALID_RARITIES.has(k.rarity) &&
      typeof k.level === 'number' && Number.isFinite(k.level)
    )
    .map(k => ({ monsterId: k.monsterId, rarity: k.rarity, level: Math.max(1, Math.floor(k.level)) }))

  if (sanitizedKills.length === 0) {
    return res.status(400).json({ error: 'Nenhum kill válido no payload.' })
  }

  // Cap de tempo: limita elapsedMs ao máximo de sessão para impedir inflação de kills via tempo falso
  const safeElapsed = Math.min(Math.max(0, Number(elapsedMs)), MAX_SESSION_MS)
  const timeBasedCap = Math.max(1, Math.ceil((safeElapsed / 1000) * MAX_KILLS_PER_SECOND))
  const capped = sanitizedKills.slice(0, Math.min(timeBasedCap, HARD_KILL_CAP))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [char] } = await client.query<{
      id: number; luck: number; spirit_gold: number; total_kills: number
      inventory: Inv | null; bestiary: BestiaryBlob | null; qi_current: number; qi_max: number
    }>(
      `SELECT id, luck, spirit_gold, total_kills, inventory, bestiary, qi_current, qi_max
       FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [charId, userId]
    )
    if (!char) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    // Validate biome and get its monster pool
    const { rows: [biomeRow] } = await client.query<{
      enemy_pool: string[]; boss_id: string | null; elite_id: string | null
    }>(
      `SELECT enemy_pool, boss_id, elite_id FROM game_biomes WHERE id=$1`,
      [biomeId]
    )
    if (!biomeRow) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Bioma inválido.' })
    }

    const allowed = new Set<string>([
      ...(biomeRow.enemy_pool ?? []),
      ...(biomeRow.boss_id   ? [biomeRow.boss_id]   : []),
      ...(biomeRow.elite_id  ? [biomeRow.elite_id]  : []),
    ])

    const safeKills = capped.filter(k => allowed.has(k.monsterId))
    if (safeKills.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Nenhum kill válido para o bioma.' })
    }

    // Fetch monster rows for all unique monsters in this batch
    const monsterIds = [...new Set(safeKills.map(k => k.monsterId))]
    const { rows: monsters } = await client.query<MonsterRow>(
      `SELECT id, qi_reward, gold_reward_min, gold_reward_max, drop_table, level_min, level_max
       FROM game_monsters WHERE id = ANY($1)`,
      [monsterIds]
    )
    const monMap = new Map(monsters.map(m => [m.id, m]))

    // Determine stackability for all possible drop items
    const allDropItemIds = new Set<string>()
    for (const m of monsters) {
      for (const e of (m.drop_table ?? [])) allDropItemIds.add(e.itemId)
    }
    const stackMap = new Map<string, boolean>()
    if (allDropItemIds.size > 0) {
      const { rows: itemRows } = await client.query<{ id: string; stackable: boolean }>(
        `SELECT id, stackable FROM game_items WHERE id = ANY($1)`,
        [[...allDropItemIds]]
      )
      for (const r of itemRows) stackMap.set(r.id, r.stackable)
    }

    // Work on copies of inventory + bestiary
    const EMPTY_EQ: Equipped = { weapon: null, armor: null, accessory: null, ring: null }
    const INITIAL_RING: InvItem = { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }
    const inv: Inv = char.inventory
      ? {
          items:    [...((char.inventory.items ?? []) as InvItem[])],
          equipped: { ...((char.inventory.equipped ?? EMPTY_EQ) as Equipped) },
          maxSlots: char.inventory.maxSlots ?? 30,
        }
      : {
          items:    [INITIAL_RING],
          equipped: { weapon: null, armor: null, accessory: null, ring: INITIAL_RING },
          maxSlots: 30,
        }
    const bestiary: BestiaryBlob = {
      entries:         { ...(char.bestiary?.entries ?? {}) },
      discoveredItems: [...(char.bestiary?.discoveredItems ?? [])],
    }

    let totalGold = 0
    let totalQi   = 0
    const allDrops: { itemId: string; quantity: number }[] = []

    for (const kill of safeKills) {
      const mon = monMap.get(kill.monsterId)
      if (!mon) continue

      const drops = rollDropsServer(mon.drop_table ?? [], char.luck ?? 0)

      for (const d of drops) {
        const isStack = stackMap.get(d.itemId) ?? false
        if (isStack) {
          const ex = inv.items.find(i => i.definitionId === d.itemId)
          if (ex) {
            ex.quantity += d.quantity
          } else {
            inv.items.push({
              instanceId:  `${d.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              definitionId: d.itemId,
              quantity:    d.quantity,
              obtainedAt:  Date.now(),
            })
          }
        } else {
          inv.items.push({
            instanceId:  `${d.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            definitionId: d.itemId,
            quantity:    1,
            durability:  100,
            obtainedAt:  Date.now(),
          })
        }

        const ex = allDrops.find(x => x.itemId === d.itemId)
        if (ex) ex.quantity += d.quantity
        else allDrops.push({ ...d })
      }

      const gold = mon.gold_reward_min + Math.floor(Math.random() * (mon.gold_reward_max - mon.gold_reward_min + 1))
      totalGold += gold
      totalQi   += mon.qi_reward ?? 0

      const entry = bestiary.entries[kill.monsterId]
      bestiary.entries[kill.monsterId] = {
        monsterId:       kill.monsterId,
        kills:           (entry?.kills ?? 0) + 1,
        firstKilledAt:   entry?.firstKilledAt ?? Date.now(),
        discoveredDrops: [...new Set([...(entry?.discoveredDrops ?? []), ...drops.map(d => d.itemId)])],
      }
      for (const d of drops) {
        if (!bestiary.discoveredItems.includes(d.itemId)) bestiary.discoveredItems.push(d.itemId)
      }
    }

    // Weapon: degrades per player attack (0.1/attack); armor: per kill (1/kill approx.)
    const wep = inv.equipped.weapon
    const arm = inv.equipped.armor
    if (wep && typeof wep.durability === 'number') {
      const cappedAtk = Math.min(Number(totalAttacks), safeKills.length * 30)
      const wepLoss = cappedAtk > 0 ? cappedAtk * 0.1 : safeKills.length
      inv.equipped.weapon = { ...wep, durability: Math.max(0, wep.durability - wepLoss) }
    }
    if (arm && typeof arm.durability === 'number') {
      inv.equipped.armor = { ...arm, durability: Math.max(0, arm.durability - safeKills.length) }
    }
    // Sync durability back to items array
    const wepId = inv.equipped.weapon?.instanceId
    const armId = inv.equipped.armor?.instanceId
    if (wepId || armId) {
      inv.items = inv.items.map(item => {
        if (wepId && item.instanceId === wepId) return { ...item, durability: inv.equipped.weapon!.durability }
        if (armId && item.instanceId === armId) return { ...item, durability: inv.equipped.armor!.durability }
        return item
      })
    }

    const newGold  = Number(char.spirit_gold ?? 0) + totalGold
    const newKills = (char.total_kills  ?? 0) + safeKills.length
    // Cap qi_current at qi_max to prevent overflow past the cultivation threshold
    const newQi    = Math.min((char.qi_current ?? 0) + totalQi, char.qi_max ?? Infinity)

    await client.query(
      `UPDATE characters
       SET spirit_gold=$1, total_kills=$2, inventory=$3, bestiary=$4, qi_current=$5, last_played_at=NOW()
       WHERE id=$6`,
      [newGold, newKills, JSON.stringify(inv), JSON.stringify(bestiary), newQi, charId]
    )

    await client.query('COMMIT')
    session.killCount += safeKills.length
    return res.json({ inventory: inv, spirit_gold: newGold, total_kills: newKills, drops: allDrops })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[combat/resolve]', err)
    return res.status(500).json({ error: 'Erro ao processar combate.' })
  } finally {
    client.release()
  }
})

export default router
