import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireNoMaintenance)

// ── Tipos internos ────────────────────────────────────────────────────────────

interface SectCfgTier { tier: number; name: string; qiBonusPct: number; maxMembers: number; qiThreshold: number }
interface SectConfig {
  founding: { minRealm: string; minStage: string; goldCost: number; materials: { itemId: string; quantity: number }[] }
  tiers: SectCfgTier[]
  dailyWithdraw: Record<string, number>
  qiContributionPct: number
}

const DEFAULT_SECT_CONFIG: SectConfig = {
  founding: {
    minRealm: 'houtian', minStage: 'middle',
    goldCost: 50000,
    materials: [{ itemId: 'qi_crystal', quantity: 50 }, { itemId: 'beast_scale', quantity: 100 }],
  },
  tiers: [
    { tier: 1, name: 'Clã',           qiBonusPct: 5,  maxMembers: 20,  qiThreshold: 0 },
    { tier: 2, name: 'Seita',          qiBonusPct: 10, maxMembers: 50,  qiThreshold: 500000 },
    { tier: 3, name: 'Grande Seita',   qiBonusPct: 20, maxMembers: 100, qiThreshold: 5000000 },
    { tier: 4, name: 'Seita Sagrada',  qiBonusPct: 35, maxMembers: 200, qiThreshold: 50000000 },
  ],
  dailyWithdraw: { external: 10, internal: 50, elder: 200, founder: -1 },
  qiContributionPct: 1,
}

const REALM_ORDER = [
  'body_tempering','houtian','xiantian','revolving_core','life_destruction',
  'divine_sea','divine_transformation','divine_lord','holy_lord',
  'world_king','empyrean','true_divinity','beyond_divinity',
]
const STAGE_LVL: Record<string, number> = {
  strength:0,muscle:1,bone:2,marrow:3,meridian:4,eight_gates:5,nine_stars:6,
  initial:0,middle:1,advanced:2,peak:3,
  destruction_1:0,destruction_2:1,destruction_3:2,destruction_4:3,destruction_5:4,
  destruction_6:5,destruction_7:6,destruction_8:7,destruction_9:8,
}
function realmLevel(realm: string, stage: string): number {
  return REALM_ORDER.indexOf(realm) * 10 + (STAGE_LVL[stage] ?? 0)
}

async function loadSectConfig(client: typeof pool): Promise<SectConfig> {
  try {
    const { rows } = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='sect_config'")
    if (rows.length) return { ...DEFAULT_SECT_CONFIG, ...JSON.parse(rows[0].value) }
  } catch {}
  return DEFAULT_SECT_CONFIG
}

// Atualiza sect_qi_bonus_pct em todos os personagens de um usuário
async function syncQiBonus(client: typeof pool, userId: number, bonusPct: number) {
  await client.query('UPDATE characters SET sect_qi_bonus_pct=$1 WHERE user_id=$2', [bonusPct, userId])
}

// ── GET /api/sects — listar seitas (ranking) ──────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.emblem, s.motto, s.tier, s.collective_qi,
             COUNT(sm.user_id)::int AS member_count
      FROM sects s
      LEFT JOIN sect_members sm ON sm.sect_id = s.id
      GROUP BY s.id
      ORDER BY s.collective_qi DESC
      LIMIT 50
    `)
    const cfg = await loadSectConfig(pool)
    return res.json(rows.map(r => ({
      ...r,
      tier_name: cfg.tiers.find(t => t.tier === r.tier)?.name ?? 'Clã',
      qi_bonus_pct: cfg.tiers.find(t => t.tier === r.tier)?.qiBonusPct ?? 5,
    })))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao listar seitas.' })
  }
})

// ── GET /api/sects/my — seita do usuário atual ────────────────────────────────

router.get('/my', async (req, res) => {
  try {
    const { rows: memberRows } = await pool.query<{ sect_id: number; role: string; contribution: string }>(
      'SELECT sect_id, role, contribution FROM sect_members WHERE user_id=$1',
      [req.userId]
    )
    if (!memberRows.length) return res.json(null)
    const { sect_id, role, contribution } = memberRows[0]

    const { rows: [sect] } = await pool.query(`
      SELECT s.id, s.name, s.emblem, s.motto, s.tier, s.collective_qi, s.treasury, s.created_at,
             COUNT(sm.user_id)::int AS member_count
      FROM sects s
      LEFT JOIN sect_members sm ON sm.sect_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [sect_id])
    if (!sect) return res.json(null)

    const { rows: members } = await pool.query(`
      SELECT sm.user_id, sm.role, sm.contribution, u.username
      FROM sect_members sm
      JOIN users u ON u.id = sm.user_id
      WHERE sm.sect_id = $1
      ORDER BY
        CASE sm.role WHEN 'founder' THEN 0 WHEN 'elder' THEN 1 WHEN 'internal' THEN 2 ELSE 3 END,
        sm.contribution DESC
    `, [sect_id])

    const cfg = await loadSectConfig(pool)
    const tierCfg = cfg.tiers.find(t => t.tier === sect.tier) ?? cfg.tiers[0]
    const nextTierCfg = cfg.tiers.find(t => t.tier === sect.tier + 1)

    return res.json({
      ...sect,
      collective_qi: Number(sect.collective_qi),
      tier_name: tierCfg.name,
      qi_bonus_pct: tierCfg.qiBonusPct,
      max_members: tierCfg.maxMembers,
      next_tier_threshold: nextTierCfg?.qiThreshold ?? null,
      my_role: role,
      my_contribution: Number(contribution),
      members,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar seita.' })
  }
})

// ── POST /api/sects — criar seita ─────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { name, emblem, motto, locationId } = req.body as {
    name?: string; emblem?: string; motto?: string; locationId?: string
  }

  if (!name || name.trim().length < 2 || name.trim().length > 40)
    return res.status(400).json({ error: 'Nome deve ter 2–40 caracteres.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const cfg = await loadSectConfig(client)

    // Verifica se usuário já está em uma seita
    const { rows: existing } = await client.query(
      'SELECT 1 FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (existing.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Você já pertence a uma seita.' })
    }

    // Busca personagem ativo para checar realm e inventário
    const { rows: chars } = await client.query<{
      id: number; realm: string; realm_stage: string; spirit_gold: number; inventory: Record<string,unknown>|null
    }>(
      'SELECT id, realm, realm_stage, spirit_gold, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1',
      [req.userId]
    )
    if (!chars.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Nenhum personagem encontrado.' })
    }
    const char = chars[0]

    // Verifica reino mínimo
    const minLvl = realmLevel(cfg.founding.minRealm, cfg.founding.minStage)
    const charLvl = realmLevel(char.realm, char.realm_stage)
    if (charLvl < minLvl) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Requer ${cfg.founding.minRealm} ${cfg.founding.minStage} ou superior.` })
    }

    // Verifica localização (deve ser cidade com serviço de seita)
    if (locationId) {
      const { rows: locRows } = await client.query<{ type: string; services: string[] }>(
        'SELECT type, services FROM game_locations WHERE id=$1', [locationId]
      )
      if (!locRows.length || locRows[0].type !== 'city') {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Seitas só podem ser fundadas em cidades.' })
      }
    }

    // Verifica ouro
    if (Number(char.spirit_gold) < cfg.founding.goldCost) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Ouro insuficiente. Necessário: ${cfg.founding.goldCost.toLocaleString('pt-BR')}.` })
    }

    // Verifica e consome materiais
    const inv = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const invItems: { instanceId: string; definitionId: string; quantity: number }[] = (inv as any).items ?? []
    for (const req_mat of cfg.founding.materials) {
      const total = invItems.filter(i => i.definitionId === req_mat.itemId).reduce((s, i) => s + i.quantity, 0)
      if (total < req_mat.quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Material insuficiente: ${req_mat.itemId} (tem ${total}, precisa ${req_mat.quantity}).` })
      }
    }
    let newItems = [...invItems]
    for (const mat of cfg.founding.materials) {
      let remaining = mat.quantity
      newItems = newItems.map(i => {
        if (i.definitionId !== mat.itemId || remaining <= 0) return i
        const take = Math.min(i.quantity, remaining)
        remaining -= take
        return { ...i, quantity: i.quantity - take }
      }).filter(i => i.quantity > 0)
    }

    // Cria a seita
    const { rows: [newSect] } = await client.query<{ id: number }>(
      `INSERT INTO sects (name, emblem, motto, founder_user_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name.trim(), emblem ?? '🏛️', motto?.trim() ?? null, req.userId]
    )

    // Adiciona fundador como membro
    await client.query(
      `INSERT INTO sect_members (sect_id, user_id, role) VALUES ($1, $2, 'founder')`,
      [newSect.id, req.userId]
    )

    // Debita ouro e materiais
    const newGold = Number(char.spirit_gold) - cfg.founding.goldCost
    await client.query(
      'UPDATE characters SET spirit_gold=$1, inventory=$2 WHERE id=$3',
      [newGold, JSON.stringify({ ...(inv as any), items: newItems }), char.id]
    )

    // Aplica bônus de Qi do tier 1
    const bonusPct = cfg.tiers[0].qiBonusPct
    await syncQiBonus(client, req.userId, bonusPct)

    await client.query('COMMIT')
    return res.json({ ok: true, sect_id: newSect.id })
  } catch (err: unknown) {
    await client.query('ROLLBACK')
    if ((err as any)?.code === '23505') return res.status(400).json({ error: 'Já existe uma seita com esse nome.' })
    console.error(err)
    return res.status(500).json({ error: 'Erro ao criar seita.' })
  } finally {
    client.release()
  }
})

// ── POST /api/sects/:id/join — entrar na seita ────────────────────────────────

router.post('/:id/join', async (req, res) => {
  const sectId = parseInt(req.params.id)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: existing } = await client.query('SELECT 1 FROM sect_members WHERE user_id=$1', [req.userId])
    if (existing.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Você já pertence a uma seita.' })
    }

    const cfg = await loadSectConfig(client)
    const { rows: [sect] } = await client.query<{ tier: number; id: number }>(
      'SELECT id, tier FROM sects WHERE id=$1', [sectId]
    )
    if (!sect) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Seita não encontrada.' }) }

    const tierCfg = cfg.tiers.find(t => t.tier === sect.tier) ?? cfg.tiers[0]
    const { rows: [{ count }] } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM sect_members WHERE sect_id=$1', [sectId]
    )
    if (parseInt(count) >= tierCfg.maxMembers) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Seita está com capacidade máxima.' })
    }

    await client.query(
      `INSERT INTO sect_members (sect_id, user_id, role) VALUES ($1, $2, 'external')`,
      [sectId, req.userId]
    )
    await syncQiBonus(client, req.userId, tierCfg.qiBonusPct)

    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao entrar na seita.' })
  } finally {
    client.release()
  }
})

// ── DELETE /api/sects/leave — sair da seita ───────────────────────────────────

router.delete('/leave', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [member] } = await client.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }
    if (member.role === 'founder') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Fundador deve transferir a liderança ou dissolver a seita antes de sair.' })
    }

    await client.query('DELETE FROM sect_members WHERE user_id=$1', [req.userId])
    await syncQiBonus(client, req.userId, 0)

    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao sair da seita.' })
  } finally {
    client.release()
  }
})

// ── DELETE /api/sects/disband — dissolver seita (fundador) ───────────────────

router.delete('/disband', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [member] } = await client.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member || member.role !== 'founder') {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'Apenas o fundador pode dissolver a seita.' })
    }

    // Zera bônus de todos os membros
    const { rows: allMembers } = await client.query<{ user_id: number }>(
      'SELECT user_id FROM sect_members WHERE sect_id=$1', [member.sect_id]
    )
    for (const m of allMembers) await syncQiBonus(client, m.user_id, 0)

    await client.query('DELETE FROM sects WHERE id=$1', [member.sect_id])

    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao dissolver seita.' })
  } finally {
    client.release()
  }
})

// ── POST /api/sects/promote — promover/rebaixar membro ───────────────────────

router.post('/promote', async (req, res) => {
  const { targetUserId, newRole } = req.body as { targetUserId: number; newRole: string }
  const VALID_ROLES = ['elder', 'internal', 'external']
  if (!VALID_ROLES.includes(newRole)) return res.status(400).json({ error: 'Cargo inválido.' })

  try {
    const { rows: [me] } = await pool.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!me || !['founder', 'elder'].includes(me.role)) return res.status(403).json({ error: 'Sem permissão.' })
    if (me.role === 'elder' && newRole === 'elder') return res.status(403).json({ error: 'Anciões não podem promover outros anciões.' })

    const { rows: [target] } = await pool.query<{ role: string }>(
      'SELECT role FROM sect_members WHERE sect_id=$1 AND user_id=$2', [me.sect_id, targetUserId]
    )
    if (!target) return res.status(404).json({ error: 'Membro não encontrado.' })
    if (target.role === 'founder') return res.status(403).json({ error: 'Não é possível alterar o cargo do fundador.' })

    await pool.query('UPDATE sect_members SET role=$1 WHERE sect_id=$2 AND user_id=$3', [newRole, me.sect_id, targetUserId])
    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao alterar cargo.' })
  }
})

// ── DELETE /api/sects/kick/:userId — expulsar membro ─────────────────────────

router.delete('/kick/:userId', async (req, res) => {
  const targetUserId = parseInt(req.params.userId)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [me] } = await client.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!me || !['founder', 'elder'].includes(me.role)) {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Sem permissão.' })
    }

    const { rows: [target] } = await client.query<{ role: string }>(
      'SELECT role FROM sect_members WHERE sect_id=$1 AND user_id=$2', [me.sect_id, targetUserId]
    )
    if (!target) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Membro não encontrado.' }) }
    if (target.role === 'founder') { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Não pode expulsar o fundador.' }) }
    if (me.role === 'elder' && target.role === 'elder') { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Anciões não podem expulsar outros anciões.' }) }

    await client.query('DELETE FROM sect_members WHERE sect_id=$1 AND user_id=$2', [me.sect_id, targetUserId])
    await syncQiBonus(client, targetUserId, 0)

    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao expulsar membro.' })
  } finally {
    client.release()
  }
})

// ── POST /api/sects/deposit — depositar itens no almoxarifado ────────────────

router.post('/deposit', async (req, res) => {
  const { itemId, quantity } = req.body as { itemId: string; quantity: number }
  if (!itemId || !quantity || quantity < 1) return res.status(400).json({ error: 'itemId e quantity obrigatórios.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [member] } = await client.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }

    // Remove do inventário do personagem ativo
    const { rows: chars } = await client.query<{ id: number; inventory: Record<string,unknown>|null }>(
      'SELECT id, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [req.userId]
    )
    if (!chars.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = chars[0]
    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const items: any[] = inv.items ?? []

    const total = items.filter((i: any) => i.definitionId === itemId).reduce((s: number, i: any) => s + i.quantity, 0)
    if (total < quantity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Item insuficiente no inventário (tem ${total}, precisa ${quantity}).` })
    }

    let remaining = quantity
    const newItems = items.map((i: any) => {
      if (i.definitionId !== itemId || remaining <= 0) return i
      const take = Math.min(i.quantity, remaining)
      remaining -= take
      return { ...i, quantity: i.quantity - take }
    }).filter((i: any) => i.quantity > 0)

    // Adiciona ao almoxarifado da seita
    const { rows: [sect] } = await client.query<{ treasury: { definitionId: string; quantity: number }[] }>(
      'SELECT treasury FROM sects WHERE id=$1 FOR UPDATE', [member.sect_id]
    )
    const treasury = sect?.treasury ?? []
    const existing = treasury.find((t: any) => t.definitionId === itemId)
    let newTreasury
    if (existing) {
      newTreasury = treasury.map((t: any) => t.definitionId === itemId ? { ...t, quantity: t.quantity + quantity } : t)
    } else {
      newTreasury = [...treasury, { definitionId: itemId, quantity }]
    }

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items: newItems }), char.id])
    await client.query('UPDATE sects SET treasury=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(newTreasury), member.sect_id])

    await client.query('COMMIT')
    return res.json({ ok: true, treasury: newTreasury })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao depositar item.' })
  } finally {
    client.release()
  }
})

// ── POST /api/sects/withdraw — sacar itens do almoxarifado ───────────────────

router.post('/withdraw', async (req, res) => {
  const { itemId, quantity } = req.body as { itemId: string; quantity: number }
  if (!itemId || !quantity || quantity < 1) return res.status(400).json({ error: 'itemId e quantity obrigatórios.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [member] } = await client.query<{ sect_id: number; role: string; daily_withdrawn: number; last_withdraw_date: string | null }>(
      'SELECT sect_id, role, daily_withdrawn, last_withdraw_date FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }

    const cfg = await loadSectConfig(client)
    const dailyLimit = cfg.dailyWithdraw[member.role] ?? 10

    // Reset diário
    const today = new Date().toISOString().slice(0, 10)
    const lastDate = member.last_withdraw_date?.toString().slice(0, 10)
    const withdrawnToday = lastDate === today ? member.daily_withdrawn : 0

    if (dailyLimit !== -1 && withdrawnToday + quantity > dailyLimit) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Limite diário de saque atingido (${dailyLimit} itens/dia para ${member.role}).` })
    }

    // Remove do almoxarifado
    const { rows: [sect] } = await client.query<{ treasury: any[] }>(
      'SELECT treasury FROM sects WHERE id=$1 FOR UPDATE', [member.sect_id]
    )
    const treasury: any[] = sect?.treasury ?? []
    const treasuryItem = treasury.find(t => t.definitionId === itemId)
    if (!treasuryItem || treasuryItem.quantity < quantity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Almoxarifado não tem quantidade suficiente desse item.' })
    }

    const newTreasury = treasury
      .map(t => t.definitionId === itemId ? { ...t, quantity: t.quantity - quantity } : t)
      .filter(t => t.quantity > 0)

    // Adiciona ao inventário do personagem
    const { rows: chars } = await client.query<{ id: number; inventory: Record<string,unknown>|null }>(
      'SELECT id, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [req.userId]
    )
    if (!chars.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = chars[0]
    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const items: any[] = [...(inv.items ?? [])]
    const existing = items.find(i => i.definitionId === itemId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.push({ instanceId: `${itemId}-${Date.now()}`, definitionId: itemId, quantity, obtainedAt: Date.now() })
    }

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items }), char.id])
    await client.query('UPDATE sects SET treasury=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(newTreasury), member.sect_id])
    await client.query(
      'UPDATE sect_members SET daily_withdrawn=$1, last_withdraw_date=$2 WHERE user_id=$3',
      [withdrawnToday + quantity, today, req.userId]
    )

    await client.query('COMMIT')
    return res.json({ ok: true, treasury: newTreasury, inventory: { ...inv, items } })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao sacar item.' })
  } finally {
    client.release()
  }
})

export { DEFAULT_SECT_CONFIG, loadSectConfig }
export default router
