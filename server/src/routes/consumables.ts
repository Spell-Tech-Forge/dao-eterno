import { Router, type Request, type Response } from 'express'
import { pool } from '../db'

const router = Router({ mergeParams: true })
type P = { id: string }

// ── Types ─────────────────────────────────────────────────────────────────────

type InvItem  = { instanceId: string; definitionId: string; quantity: number; durability?: number; obtainedAt: number; upgradeLevel?: number; ascensionTier?: number }
type Equipped = { weapon: InvItem|null; armor: InvItem|null; accessory: InvItem|null; ring: InvItem|null }
type Inv      = { items: InvItem[]; equipped: Equipped; maxSlots: number }

type ActiveBuff = {
  id: string; definitionId: string; name: string; endsAt: number
  atk?: number; def?: number; hp?: number; crit?: number; speed?: number
}
type SkillEnt   = { id: string; level: number; xp: number; xpToNext: number }
type SkillsBlob = { data?: SkillEnt[]; meditationEndsAt?: number; activeBuffs?: ActiveBuff[] }

// ── POST /use-item ─────────────────────────────────────────────────────────────

router.post('/use-item', async (req: Request<P>, res: Response) => {
  const charId     = parseInt(req.params.id)
  const userId     = req.userId!
  const { instanceId, hp_current: clientHp } = req.body as { instanceId: string; hp_current?: number }

  if (!instanceId) return res.status(400).json({ error: 'instanceId obrigatório.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [char] } = await client.query<{
      id: number; hp_current: number; hp_max: number; qi_current: number; qi_max: number
      inventory: Inv | null; skills: SkillsBlob | null
    }>(
      `SELECT id, hp_current, hp_max, qi_current, qi_max, inventory, skills
       FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [charId, userId]
    )
    if (!char) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    // Build inventory
    const EMPTY_EQ: Equipped = { weapon: null, armor: null, accessory: null, ring: null }
    const inv: Inv = {
      items:    [...((char.inventory?.items ?? []) as InvItem[])],
      equipped: { ...((char.inventory?.equipped ?? EMPTY_EQ) as Equipped) },
      maxSlots: char.inventory?.maxSlots ?? 30,
    }

    const itemIdx = inv.items.findIndex(i => i.instanceId === instanceId)
    if (itemIdx === -1) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Item não encontrado no inventário.' })
    }
    const invItem = inv.items[itemIdx]

    // Fetch item definition
    const { rows: [itemDef] } = await client.query<{
      id: string; type: string; name: string
      stats: { hp?: number; qi?: number; meditationMinutes?: number; buffDuration?: number; atk?: number; def?: number; crit?: number; speed?: number } | null
    }>(
      `SELECT id, type, name, stats FROM game_items WHERE id=$1`,
      [invItem.definitionId]
    )
    if (!itemDef || itemDef.type !== 'pill') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Item não é uma pílula.' })
    }

    const stats = itemDef.stats ?? {}
    const now   = Date.now()

    // Build skills blob, preserving existing data
    const skills: SkillsBlob = {
      data:             (char.skills?.data as SkillEnt[] | undefined) ?? [],
      meditationEndsAt: char.skills?.meditationEndsAt ?? 0,
      activeBuffs:      (char.skills?.activeBuffs as ActiveBuff[] | undefined) ?? [],
    }

    // Use client's hp_current if provided (more accurate than stale DB value for heal calc)
    let newHp    = clientHp !== undefined ? Math.max(0, Math.min(char.hp_max, clientHp)) : char.hp_current
    let newMaxHp = char.hp_max
    let newQi    = char.qi_current

    if (stats.buffDuration && stats.buffDuration > 0) {
      // ── Buff pill — replaces active buff ─────────────────────────────────────
      const duration   = stats.buffDuration * 60_000
      const validBuffs = skills.activeBuffs!.filter(b => b.endsAt > now)
      const oldBuffHp  = validBuffs.reduce((acc, b) => acc + (b.hp ?? 0), 0)
      const newBuffHp  = stats.hp ?? 0
      const hpDelta    = newBuffHp - oldBuffHp

      const newBuff: ActiveBuff = {
        id:           `${itemDef.id}-${now}-${Math.random().toString(36).slice(2)}`,
        definitionId: itemDef.id,
        name:         itemDef.name,
        endsAt:       now + duration,
        atk:          stats.atk   || undefined,
        def:          stats.def   || undefined,
        hp:           stats.hp    || undefined,
        crit:         stats.crit  || undefined,
        speed:        stats.speed || undefined,
      }

      newMaxHp = Math.max(1, newMaxHp + hpDelta)
      newHp    = Math.max(1, Math.min(newMaxHp, newHp + hpDelta))
      skills.activeBuffs = [newBuff]
    } else {
      // ── Instant pill ─────────────────────────────────────────────────────────
      if (stats.hp) {
        newHp = Math.min(newMaxHp, newHp + Math.round(newMaxHp * stats.hp / 100))
      }
      if (stats.qi) {
        newQi = Math.min(char.qi_max, newQi + stats.qi)
      }
      if (stats.meditationMinutes && stats.meditationMinutes > 0) {
        const base = Math.max(skills.meditationEndsAt ?? 0, now)
        skills.meditationEndsAt = base + stats.meditationMinutes * 60_000
      }
    }

    // Remove 1 unit from inventory
    if (invItem.quantity > 1) {
      inv.items[itemIdx] = { ...invItem, quantity: invItem.quantity - 1 }
    } else {
      inv.items.splice(itemIdx, 1)
    }

    await client.query(
      `UPDATE characters
       SET hp_current=$1, hp_max=$2, qi_current=$3, inventory=$4, skills=$5, last_played_at=NOW()
       WHERE id=$6`,
      [newHp, newMaxHp, newQi, JSON.stringify(inv), JSON.stringify(skills), charId]
    )

    await client.query('COMMIT')
    return res.json({
      inventory:        inv,
      hp_current:       newHp,
      hp_max:           newMaxHp,
      qi_current:       newQi,
      skills:           { activeBuffs: skills.activeBuffs, meditationEndsAt: skills.meditationEndsAt },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[use-item]', err)
    return res.status(500).json({ error: 'Erro ao usar item.' })
  } finally {
    client.release()
  }
})

export default router
