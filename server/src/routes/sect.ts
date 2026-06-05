import { Router } from 'express'
import type { PoolClient } from 'pg'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

type Queryable = Pick<PoolClient, 'query'>

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
  library: { dailyLearnLimit: Record<string, number> }
  training: { hpByTier: number[] }
  missions: {
    dailyKills: { min: number; max: number; tokenReward: number }
    dailyQi: { min: number; max: number; tokenReward: number }
    dailyCrafts: { min: number; max: number; tokenReward: number }
    weeklyKills: { min: number; max: number; tokenReward: number }
    weeklyQi: { min: number; max: number; tokenReward: number }
    weeklyCrafts: { min: number; max: number; tokenReward: number }
    extraReward: { itemId: string; quantity: number } | null
  }
  wars: { durationDays: number; tributePct: number; minTierToAttack: number }
  artifact: {
    emoji: string
    levels: { level: number; atkPct: number; hpPct: number; defPct: number; qiRatePct: number; materials: { itemId: string; quantity: number }[] }[]
  }
  territory: { durationDays: number; dropBonusPct: number; claimTokenCost: number }
  inheritance: { qiPct: number }
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
  library: { dailyLearnLimit: { external: 1, internal: 3, elder: 10, founder: -1 } },
  training: { hpByTier: [500000, 2000000, 10000000, 50000000] },
  missions: {
    dailyKills:   { min: 100,     max: 500,       tokenReward: 10 },
    dailyQi:      { min: 100000,  max: 1000000,   tokenReward: 10 },
    dailyCrafts:  { min: 5,       max: 20,        tokenReward: 10 },
    weeklyKills:  { min: 1000,    max: 5000,      tokenReward: 50 },
    weeklyQi:     { min: 1000000, max: 10000000,  tokenReward: 50 },
    weeklyCrafts: { min: 50,      max: 200,       tokenReward: 50 },
    extraReward:  { itemId: 'qi_crystal', quantity: 5 },
  },
  wars: { durationDays: 7, tributePct: 5, minTierToAttack: 1 },
  artifact: {
    emoji: '🏮',
    levels: [
      { level:1,  atkPct:1,  hpPct:1,  defPct:0,  qiRatePct:0,  materials:[{itemId:'qi_crystal',quantity:100}] },
      { level:2,  atkPct:2,  hpPct:2,  defPct:1,  qiRatePct:0,  materials:[{itemId:'qi_crystal',quantity:200},{itemId:'beast_scale',quantity:50}] },
      { level:3,  atkPct:3,  hpPct:3,  defPct:2,  qiRatePct:1,  materials:[{itemId:'spiritual_feather',quantity:100},{itemId:'spiritual_essence',quantity:50}] },
      { level:4,  atkPct:5,  hpPct:4,  defPct:3,  qiRatePct:2,  materials:[{itemId:'mystic_scale',quantity:80},{itemId:'mystic_crystal',quantity:40}] },
      { level:5,  atkPct:6,  hpPct:5,  defPct:4,  qiRatePct:3,  materials:[{itemId:'core_fragment',quantity:60},{itemId:'core_essence',quantity:30}] },
      { level:6,  atkPct:8,  hpPct:7,  defPct:5,  qiRatePct:4,  materials:[{itemId:'soul_fragment',quantity:50},{itemId:'soul_crystal',quantity:25}] },
      { level:7,  atkPct:10, hpPct:9,  defPct:6,  qiRatePct:5,  materials:[{itemId:'king_scale',quantity:40},{itemId:'king_core',quantity:20}] },
      { level:8,  atkPct:12, hpPct:11, defPct:8,  qiRatePct:6,  materials:[{itemId:'imperial_fragment',quantity:30},{itemId:'imperial_essence',quantity:15}] },
      { level:9,  atkPct:15, hpPct:14, defPct:10, qiRatePct:8,  materials:[{itemId:'sacred_feather',quantity:20},{itemId:'sacred_essence',quantity:10}] },
      { level:10, atkPct:20, hpPct:18, defPct:12, qiRatePct:10, materials:[{itemId:'dao_fragment',quantity:10},{itemId:'dao_essence',quantity:5}] },
    ],
  },
  territory: { durationDays: 7, dropBonusPct: 20, claimTokenCost: 500 },
  inheritance: { qiPct: 5 },
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

async function loadSectConfig(client: Queryable): Promise<SectConfig> {
  try {
    const { rows } = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='sect_config'")
    if (rows.length) return { ...DEFAULT_SECT_CONFIG, ...JSON.parse(rows[0].value) }
  } catch {}
  return DEFAULT_SECT_CONFIG
}

// Atualiza sect_qi_bonus_pct em todos os personagens de um usuário
async function syncQiBonus(client: Queryable, userId: number, bonusPct: number) {
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
      const REALM_PT: Record<string,string> = {houtian:'Pré-Celestial',xiantian:'Pós-Celestial',body_tempering:'Temperamento Corporal',revolving_core:'Núcleo Giratório',life_destruction:'Destruição da Vida',divine_sea:'Mar Divino',divine_transformation:'Transformação Divina',divine_lord:'Senhor Divino',holy_lord:'Senhor Sagrado',world_king:'Rei do Mundo',empyrean:'Empíreo',true_divinity:'Verdadeira Divindade',beyond_divinity:'Além da Divindade'}
      const STAGE_PT: Record<string,string> = {initial:'Inicial',middle:'Médio',advanced:'Avançado',peak:'Pico',strength:'Força',muscle:'Músculo',bone:'Osso',marrow:'Medula',meridian:'Meridiano',eight_gates:'Oito Portões',nine_stars:'Nove Estrelas'}
      return res.status(400).json({ error: `Requer ${REALM_PT[cfg.founding.minRealm] ?? cfg.founding.minRealm} ${STAGE_PT[cfg.founding.minStage] ?? cfg.founding.minStage} ou superior.` })
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
    await syncQiBonus(client, req.userId!, bonusPct)

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
    await syncQiBonus(client, req.userId!, tierCfg.qiBonusPct)

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
    await syncQiBonus(client, req.userId!, 0)

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

// ── Helpers de missão ────────────────────────────────────────────────────────

function randBetween(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)) }

async function generateMissions(client: Queryable, sectId: number, cfg: SectConfig) {
  const now = new Date()
  const kinds: Array<{ kind: string; type: 'daily' | 'weekly'; cfgKey: keyof typeof cfg.missions }> = [
    { kind: 'kills',  type: 'daily',  cfgKey: 'dailyKills'   },
    { kind: 'qi',     type: 'daily',  cfgKey: 'dailyQi'      },
    { kind: 'crafts', type: 'daily',  cfgKey: 'dailyCrafts'  },
    { kind: 'kills',  type: 'weekly', cfgKey: 'weeklyKills'  },
    { kind: 'qi',     type: 'weekly', cfgKey: 'weeklyQi'     },
    { kind: 'crafts', type: 'weekly', cfgKey: 'weeklyCrafts' },
  ]
  for (const { kind, type, cfgKey } of kinds) {
    const { rows: existing } = await client.query(
      'SELECT 1 FROM sect_missions WHERE sect_id=$1 AND type=$2 AND mission_kind=$3 AND ends_at > NOW() AND completed_at IS NULL',
      [sectId, type, kind]
    )
    if (existing.length) continue
    const mcfg = cfg.missions[cfgKey] as { min: number; max: number; tokenReward: number }
    const target = randBetween(mcfg.min, mcfg.max)
    const endsAt = new Date(now)
    if (type === 'daily')  endsAt.setHours(endsAt.getHours() + 24)
    if (type === 'weekly') endsAt.setDate(endsAt.getDate() + 7)
    await client.query(
      `INSERT INTO sect_missions (sect_id, type, mission_kind, target_value, token_reward, extra_reward, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sectId, type, kind, target, mcfg.tokenReward, cfg.missions.extraReward ? JSON.stringify(cfg.missions.extraReward) : null, endsAt]
    )
  }
}

export async function updateMissionProgress(
  client: Queryable,
  sectId: number,
  kind: 'kills' | 'qi' | 'crafts',
  amount: number,
  userId: number
) {
  const cfg = await loadSectConfig(client)
  // Atualiza progresso
  await client.query(`
    UPDATE sect_missions
    SET current_value = LEAST(target_value, current_value + $1),
        participants  = CASE
          WHEN participants::jsonb @> to_jsonb($2::int) THEN participants
          ELSE participants::jsonb || to_jsonb($2::int)
        END
    WHERE sect_id = $3 AND mission_kind = $4 AND completed_at IS NULL AND ends_at > NOW()
  `, [amount, userId, sectId, kind])

  // Verifica e conclui missões completas
  const { rows: done } = await client.query<{ id: number; token_reward: number; extra_reward: { itemId: string; quantity: number } | null; participants: number[] }>(
    `SELECT id, token_reward, extra_reward, participants
     FROM sect_missions
     WHERE sect_id=$1 AND mission_kind=$2 AND completed_at IS NULL AND ends_at > NOW()
       AND current_value >= target_value AND rewarded = FALSE`,
    [sectId, kind]
  )
  for (const mission of done) {
    await client.query('UPDATE sect_missions SET completed_at=NOW(), rewarded=TRUE WHERE id=$1', [mission.id])
    const participantIds: number[] = Array.isArray(mission.participants) ? mission.participants : []
    for (const uid of participantIds) {
      await client.query('UPDATE sect_members SET tokens = tokens + $1 WHERE sect_id=$2 AND user_id=$3', [mission.token_reward, sectId, uid])
      if (mission.extra_reward) {
        const { rows: chars } = await client.query<{ id: number; inventory: Record<string,unknown>|null }>(
          'SELECT id, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [uid]
        )
        if (chars.length) {
          const inv: any = chars[0].inventory ?? { items: [], equipped: {}, maxSlots: 30 }
          const items: any[] = [...(inv.items ?? [])]
          const ex = items.find((i: any) => i.definitionId === mission.extra_reward!.itemId)
          if (ex) ex.quantity += mission.extra_reward.quantity
          else items.push({ instanceId: `${mission.extra_reward.itemId}-${Date.now()}`, definitionId: mission.extra_reward.itemId, quantity: mission.extra_reward.quantity, obtainedAt: Date.now() })
          await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items }), chars[0].id])
        }
      }
    }
  }
  // Gera novas se não houver ativas
  await generateMissions(client, sectId, cfg)
}

// ── GET /api/sects/missions — missões da seita ────────────────────────────────

router.get('/missions', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number; tokens: number }>(
      'SELECT sect_id, tokens FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json({ missions: [], tokens: 0 })

    const cfg = await loadSectConfig(pool)
    const client = await pool.connect()
    try {
      await generateMissions(client, member.sect_id, cfg)
      client.release()
    } catch { client.release() }

    const { rows: missions } = await pool.query(
      `SELECT id, type, mission_kind, target_value, current_value, token_reward, extra_reward,
              started_at, ends_at, completed_at, rewarded,
              (participants::jsonb @> to_jsonb($2::int)) AS i_participated
       FROM sect_missions WHERE sect_id=$1 ORDER BY type, mission_kind`,
      [member.sect_id, req.userId]
    )
    return res.json({ missions, tokens: member.tokens })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao buscar missões.' })
  }
})

// ── POST /api/sects/library/deposit — depositar receita ──────────────────────

router.post('/library/deposit', async (req, res) => {
  const { itemId, quantity } = req.body as { itemId: string; quantity: number }
  if (!itemId || !quantity || quantity < 1) return res.status(400).json({ error: 'itemId e quantity obrigatórios.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [member] } = await client.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }

    // Verifica que o item é uma receita
    const { rows: [itemDef] } = await client.query<{ type: string }>(
      'SELECT type FROM game_items WHERE id=$1', [itemId]
    )
    if (!itemDef || itemDef.type !== 'receita') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Apenas itens de receita podem ser depositados na biblioteca.' })
    }

    // Remove do inventário
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
      return res.status(400).json({ error: `Item insuficiente (tem ${total}, precisa ${quantity}).` })
    }
    let remaining = quantity
    const newItems = items.map((i: any) => {
      if (i.definitionId !== itemId || remaining <= 0) return i
      const take = Math.min(i.quantity, remaining); remaining -= take
      return { ...i, quantity: i.quantity - take }
    }).filter((i: any) => i.quantity > 0)

    // Adiciona à biblioteca
    const { rows: [sect] } = await client.query<{ library: { definitionId: string; quantity: number }[] }>(
      'SELECT library FROM sects WHERE id=$1 FOR UPDATE', [member.sect_id]
    )
    const lib = sect?.library ?? []
    const existing = lib.find((t: any) => t.definitionId === itemId)
    const newLib = existing
      ? lib.map((t: any) => t.definitionId === itemId ? { ...t, quantity: t.quantity + quantity } : t)
      : [...lib, { definitionId: itemId, quantity }]

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items: newItems }), char.id])
    await client.query('UPDATE sects SET library=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(newLib), member.sect_id])
    await client.query('COMMIT')
    return res.json({ ok: true, library: newLib })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao depositar na biblioteca.' })
  } finally { client.release() }
})

// ── POST /api/sects/library/learn — aprender receita da biblioteca ────────────

router.post('/library/learn', async (req, res) => {
  const { itemId } = req.body as { itemId: string }
  if (!itemId) return res.status(400).json({ error: 'itemId obrigatório.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await loadSectConfig(client)

    const { rows: [member] } = await client.query<{ sect_id: number; role: string; daily_library_learned: number; last_library_date: string | null }>(
      'SELECT sect_id, role, daily_library_learned, last_library_date FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }

    const limit = cfg.library.dailyLearnLimit[member.role] ?? 1
    const today = new Date().toISOString().slice(0, 10)
    const lastDate = member.last_library_date?.toString().slice(0, 10)
    const learnedToday = lastDate === today ? member.daily_library_learned : 0
    if (limit !== -1 && learnedToday >= limit) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Limite diário de aprendizado atingido (${limit}/dia para ${member.role}).` })
    }

    // Remove da biblioteca
    const { rows: [sect] } = await client.query<{ library: any[] }>(
      'SELECT library FROM sects WHERE id=$1 FOR UPDATE', [member.sect_id]
    )
    const lib: any[] = sect?.library ?? []
    const libItem = lib.find(t => t.definitionId === itemId)
    if (!libItem || libItem.quantity < 1) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Receita não disponível na biblioteca.' })
    }
    const newLib = lib.map(t => t.definitionId === itemId ? { ...t, quantity: t.quantity - 1 } : t).filter(t => t.quantity > 0)

    // Adiciona ao unlocked_recipes do personagem
    const { rows: chars } = await client.query<{ id: number; unlocked_recipes: string[] }>(
      'SELECT id, unlocked_recipes FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [req.userId]
    )
    if (!chars.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = chars[0]
    const recipeId = itemId.replace(/^receita_/, '')
    const current = Array.isArray(char.unlocked_recipes) ? char.unlocked_recipes : []
    const newUnlocked = current.includes(recipeId) ? current : [...current, recipeId]

    await client.query('UPDATE sects SET library=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(newLib), member.sect_id])
    await client.query('UPDATE characters SET unlocked_recipes=$1 WHERE id=$2', [JSON.stringify(newUnlocked), char.id])
    await client.query('UPDATE sect_members SET daily_library_learned=$1, last_library_date=$2 WHERE user_id=$3',
      [learnedToday + 1, today, req.userId])
    await client.query('COMMIT')
    return res.json({ ok: true, library: newLib, unlocked_recipes: newUnlocked, learned_recipe: recipeId })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao aprender receita.' })
  } finally { client.release() }
})

// ── GET /api/sects/shop — loja da seita ──────────────────────────────────────

router.get('/shop', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number; tokens: number }>(
      'SELECT sect_id, tokens FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json({ shop: [], tokens: 0 })
    const { rows: [sect] } = await pool.query<{ shop: any[] }>('SELECT shop FROM sects WHERE id=$1', [member.sect_id])
    return res.json({ shop: sect?.shop ?? [], tokens: member.tokens })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro ao buscar loja.' }) }
})

// ── POST /api/sects/shop/buy — comprar item da loja ──────────────────────────

router.post('/shop/buy', async (req, res) => {
  const { itemId, quantity } = req.body as { itemId: string; quantity: number }
  const qty = Math.max(1, quantity || 1)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [member] } = await client.query<{ sect_id: number; tokens: number }>(
      'SELECT sect_id, tokens FROM sect_members WHERE user_id=$1 FOR UPDATE', [req.userId]
    )
    if (!member) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não está em nenhuma seita.' }) }
    const { rows: [sect] } = await client.query<{ shop: any[] }>('SELECT shop FROM sects WHERE id=$1', [member.sect_id])
    const shopItem = (sect?.shop ?? []).find((s: any) => s.itemId === itemId)
    if (!shopItem) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item não disponível na loja.' }) }
    if (shopItem.stock !== -1 && shopItem.stock < qty) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: `Estoque insuficiente (${shopItem.stock} disponíveis).` })
    }
    const totalCost = shopItem.tokenCost * qty
    if (member.tokens < totalCost) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: `Tokens insuficientes (tem ${member.tokens}, precisa ${totalCost}).` })
    }
    // Debita tokens
    await client.query('UPDATE sect_members SET tokens = tokens - $1 WHERE user_id=$2', [totalCost, req.userId])
    // Atualiza estoque
    if (shopItem.stock !== -1) {
      const newShop = (sect.shop).map((s: any) => s.itemId === itemId ? { ...s, stock: s.stock - qty } : s).filter((s: any) => s.stock !== 0)
      await client.query('UPDATE sects SET shop=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(newShop), member.sect_id])
    }
    // Adiciona ao inventário
    const { rows: chars } = await client.query<{ id: number; inventory: Record<string,unknown>|null }>(
      'SELECT id, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [req.userId]
    )
    if (chars.length) {
      const inv: any = chars[0].inventory ?? { items: [], equipped: {}, maxSlots: 30 }
      const items: any[] = [...(inv.items ?? [])]
      const ex = items.find((i: any) => i.definitionId === itemId)
      if (ex) ex.quantity += qty
      else items.push({ instanceId: `${itemId}-${Date.now()}`, definitionId: itemId, quantity: qty, obtainedAt: Date.now() })
      await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items }), chars[0].id])
    }
    await client.query('COMMIT')
    return res.json({ ok: true, tokens_spent: totalCost })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao comprar item.' })
  } finally { client.release() }
})

// ── POST /api/sects/shop/configure — configurar loja (fundador/ancião) ────────

router.post('/shop/configure', async (req, res) => {
  const { shop } = req.body as { shop: { itemId: string; tokenCost: number; stock: number }[] }
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member || !['founder', 'elder'].includes(member.role))
      return res.status(403).json({ error: 'Apenas fundador/ancião pode configurar a loja.' })
    await pool.query('UPDATE sects SET shop=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(shop ?? []), member.sect_id])
    return res.json({ ok: true })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro ao configurar loja.' }) }
})

// ── POST /api/sects/wars/declare — declarar guerra ───────────────────────────

router.post('/wars/declare', async (req, res) => {
  const { defenderSectId } = req.body as { defenderSectId: number }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await loadSectConfig(client)
    const { rows: [member] } = await client.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member || member.role !== 'founder') {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Apenas o fundador pode declarar guerra.' })
    }
    if (member.sect_id === defenderSectId) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: 'Não pode declarar guerra a si mesmo.' })
    }
    const { rows: [attacker] } = await client.query<{ tier: number }>('SELECT tier FROM sects WHERE id=$1', [member.sect_id])
    if (!attacker || attacker.tier < cfg.wars.minTierToAttack) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: `Tier mínimo para declarar guerra: ${cfg.wars.minTierToAttack}.` })
    }
    // Verifica se não há guerra ativa entre essas seitas
    const { rows: existing } = await client.query(
      `SELECT 1 FROM sect_wars WHERE ((attacker_sect_id=$1 AND defender_sect_id=$2) OR (attacker_sect_id=$2 AND defender_sect_id=$1)) AND resolved=FALSE`,
      [member.sect_id, defenderSectId]
    )
    if (existing.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Já existe uma guerra ativa entre essas seitas.' }) }

    const { rows: [defender] } = await client.query<{ id: number; spirit_gold: number | null }>('SELECT id FROM sects WHERE id=$1', [defenderSectId])
    if (!defender) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Seita defensora não encontrada.' }) }

    const endsAt = new Date(); endsAt.setDate(endsAt.getDate() + cfg.wars.durationDays)
    const { rows: [war] } = await client.query<{ id: number }>(
      `INSERT INTO sect_wars (attacker_sect_id, defender_sect_id, ends_at) VALUES ($1,$2,$3) RETURNING id`,
      [member.sect_id, defenderSectId, endsAt]
    )
    await client.query('COMMIT')
    return res.json({ ok: true, war_id: war.id, ends_at: endsAt })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao declarar guerra.' })
  } finally { client.release() }
})

// ── GET /api/sects/wars — guerras da minha seita ─────────────────────────────

router.get('/wars', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json([])
    const { rows: wars } = await pool.query(`
      SELECT w.*, sa.name AS attacker_name, sa.emblem AS attacker_emblem,
             sd.name AS defender_name, sd.emblem AS defender_emblem
      FROM sect_wars w
      JOIN sects sa ON sa.id = w.attacker_sect_id
      JOIN sects sd ON sd.id = w.defender_sect_id
      WHERE w.attacker_sect_id=$1 OR w.defender_sect_id=$1
      ORDER BY w.started_at DESC LIMIT 10
    `, [member.sect_id])
    return res.json({ wars, my_sect_id: member.sect_id })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro ao buscar guerras.' }) }
})

// ── POST /api/sects/wars/:id/resolve — resolver guerra ───────────────────────

router.post('/wars/:id/resolve', async (req, res) => {
  const warId = parseInt(req.params.id)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await loadSectConfig(client)
    const { rows: [war] } = await client.query<{
      id: number; attacker_sect_id: number; defender_sect_id: number
      attacker_points: number; defender_points: number; resolved: boolean; ends_at: string
    }>('SELECT * FROM sect_wars WHERE id=$1 FOR UPDATE', [warId])
    if (!war) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Guerra não encontrada.' }) }
    if (war.resolved) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Guerra já foi resolvida.' }) }
    if (new Date(war.ends_at) > new Date()) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Guerra ainda em andamento.' }) }

    const winnerId = war.attacker_points >= war.defender_points ? war.attacker_sect_id : war.defender_sect_id
    const loserId  = winnerId === war.attacker_sect_id ? war.defender_sect_id : war.attacker_sect_id

    // Calcula tributo: % do Qi coletivo do perdedor em ouro
    const { rows: [loser] } = await client.query<{ collective_qi: string }>('SELECT collective_qi FROM sects WHERE id=$1', [loserId])
    const tributeGold = Math.floor(Number(loser.collective_qi) * cfg.wars.tributePct / 100)

    // Distribui ouro do tributo entre os membros da seita vencedora
    const { rows: winners } = await client.query<{ user_id: number }>('SELECT user_id FROM sect_members WHERE sect_id=$1', [winnerId])
    const goldPerMember = winners.length > 0 ? Math.floor(tributeGold / winners.length) : 0
    if (goldPerMember > 0) {
      for (const w of winners) {
        await client.query('UPDATE characters SET spirit_gold = spirit_gold + $1 WHERE user_id=$2', [goldPerMember, w.user_id])
      }
    }

    await client.query(
      'UPDATE sect_wars SET resolved=TRUE, winner_sect_id=$1, tribute_gold=$2 WHERE id=$3',
      [winnerId, tributeGold, warId]
    )
    await client.query('COMMIT')
    return res.json({ ok: true, winner_sect_id: winnerId, tribute_gold: tributeGold, gold_per_member: goldPerMember })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao resolver guerra.' })
  } finally { client.release() }
})

// ── Artefato helper ───────────────────────────────────────────────────────────

async function syncArtifactLevel(client: Queryable, sectId: number, level: number) {
  const { rows: members } = await client.query<{ user_id: number }>(
    'SELECT user_id FROM sect_members WHERE sect_id=$1', [sectId]
  )
  for (const m of members) {
    await client.query('UPDATE characters SET sect_artifact_level=$1 WHERE user_id=$2', [level, m.user_id])
  }
}

// ── GET /api/sects/artifact — artefato da seita ───────────────────────────────

router.get('/artifact', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json(null)
    const { rows: [sect] } = await pool.query<{ artifact_level: number; name: string; emblem: string }>(
      'SELECT artifact_level, name, emblem FROM sects WHERE id=$1', [member.sect_id]
    )
    const cfg = await loadSectConfig(pool)
    return res.json({ artifact_level: sect?.artifact_level ?? 0, artifact_cfg: cfg.artifact, sect_name: sect?.name, sect_emblem: sect?.emblem })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro ao buscar artefato.' }) }
})

// ── POST /api/sects/artifact/upgrade — melhorar artefato ─────────────────────

router.post('/artifact/upgrade', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [member] } = await client.query<{ sect_id: number; role: string }>(
      'SELECT sect_id, role FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member || !['founder','elder'].includes(member.role)) {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Apenas fundador/ancião pode melhorar o artefato.' })
    }
    const cfg = await loadSectConfig(client)
    const { rows: [sect] } = await client.query<{ artifact_level: number }>(
      'SELECT artifact_level FROM sects WHERE id=$1 FOR UPDATE', [member.sect_id]
    )
    const curLevel = sect?.artifact_level ?? 0
    const nextLevel = cfg.artifact.levels.find(l => l.level === curLevel + 1)
    if (!nextLevel) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: 'Artefato já está no nível máximo.' })
    }
    // Verifica e consome materiais do inventário do fundador/ancião
    const { rows: chars } = await client.query<{ id: number; inventory: Record<string,unknown>|null }>(
      'SELECT id, inventory FROM characters WHERE user_id=$1 ORDER BY realm_level DESC LIMIT 1', [req.userId]
    )
    if (!chars.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = chars[0]
    const inv: any = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const items: any[] = inv.items ?? []
    for (const mat of nextLevel.materials) {
      const total = items.filter((i: any) => i.definitionId === mat.itemId).reduce((s: number, i: any) => s + i.quantity, 0)
      if (total < mat.quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Material insuficiente: ${mat.itemId} (tem ${total}, precisa ${mat.quantity}).` })
      }
    }
    let remaining: Record<string, number> = {}
    for (const mat of nextLevel.materials) remaining[mat.itemId] = mat.quantity
    const newItems = items.map((i: any) => {
      if (!remaining[i.definitionId] || remaining[i.definitionId] <= 0) return i
      const take = Math.min(i.quantity, remaining[i.definitionId])
      remaining[i.definitionId] -= take
      return { ...i, quantity: i.quantity - take }
    }).filter((i: any) => i.quantity > 0)

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify({ ...inv, items: newItems }), char.id])
    await client.query('UPDATE sects SET artifact_level=artifact_level+1, updated_at=NOW() WHERE id=$1', [member.sect_id])
    await syncArtifactLevel(client, member.sect_id, curLevel + 1)
    await client.query('COMMIT')
    return res.json({ ok: true, new_level: curLevel + 1 })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao melhorar artefato.' })
  } finally { client.release() }
})

// ── GET /api/sects/territory — território da seita ───────────────────────────

router.get('/territory', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json(null)
    const { rows: [territory] } = await pool.query(
      `SELECT st.*, s.name AS sect_name, s.emblem AS sect_emblem,
              gl.name AS biome_name
       FROM sect_territories st
       LEFT JOIN game_biomes gl ON gl.id = st.biome_id
       JOIN sects s ON s.id = st.sect_id
       WHERE st.sect_id=$1 AND st.expires_at > NOW()`,
      [member.sect_id]
    )
    return res.json(territory ?? null)
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro ao buscar território.' }) }
})

// ── POST /api/sects/territory/claim — reivindicar território ─────────────────

router.post('/territory/claim', async (req, res) => {
  const { biomeId } = req.body as { biomeId: string }
  if (!biomeId) return res.status(400).json({ error: 'biomeId obrigatório.' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cfg = await loadSectConfig(client)
    const { rows: [member] } = await client.query<{ sect_id: number; tokens: number; role: string }>(
      'SELECT sect_id, tokens, role FROM sect_members WHERE user_id=$1 FOR UPDATE', [req.userId]
    )
    if (!member || !['founder','elder'].includes(member.role)) {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Apenas fundador/ancião pode reivindicar território.' })
    }
    if (member.tokens < cfg.territory.claimTokenCost) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: `Tokens insuficientes (precisa ${cfg.territory.claimTokenCost}).` })
    }
    const { rows: [biome] } = await client.query('SELECT id, name FROM game_biomes WHERE id=$1', [biomeId])
    if (!biome) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Bioma não encontrado.' }) }

    const endsAt = new Date(); endsAt.setDate(endsAt.getDate() + cfg.territory.durationDays)
    await client.query('UPDATE sect_members SET tokens=tokens-$1 WHERE user_id=$2', [cfg.territory.claimTokenCost, req.userId])
    await client.query(
      `INSERT INTO sect_territories (sect_id, biome_id, drop_bonus_pct, expires_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (biome_id) DO UPDATE SET sect_id=$1, drop_bonus_pct=$3, expires_at=$4, claimed_at=NOW()`,
      [member.sect_id, biomeId, cfg.territory.dropBonusPct, endsAt]
    )
    await client.query('COMMIT')
    return res.json({ ok: true, expires_at: endsAt, biome_name: biome.name })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao reivindicar território.' })
  } finally { client.release() }
})

// ── GET /api/sects/territories — mapa de todos os territórios ────────────────

router.get('/territories/all', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT st.biome_id, st.drop_bonus_pct, st.expires_at,
             s.name AS sect_name, s.emblem AS sect_emblem, s.id AS sect_id,
             gb.name AS biome_name
      FROM sect_territories st
      JOIN sects s ON s.id = st.sect_id
      LEFT JOIN game_biomes gb ON gb.id = st.biome_id
      WHERE st.expires_at > NOW()
    `)
    return res.json(rows)
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro.' }) }
})

// ── GET /api/sects/rivalry/:id — histórico de rivalidade com outra seita ─────

router.get('/rivalry/:id', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query<{ sect_id: number }>(
      'SELECT sect_id FROM sect_members WHERE user_id=$1', [req.userId]
    )
    if (!member) return res.json({ wins: 0, losses: 0, draws: 0, wars: [] })
    const targetId = parseInt(req.params.id)
    const { rows: wars } = await pool.query(
      `SELECT * FROM sect_wars
       WHERE ((attacker_sect_id=$1 AND defender_sect_id=$2) OR (attacker_sect_id=$2 AND defender_sect_id=$1))
       ORDER BY started_at DESC`,
      [member.sect_id, targetId]
    )
    const wins   = wars.filter(w => w.resolved && w.winner_sect_id === member.sect_id).length
    const losses = wars.filter(w => w.resolved && w.winner_sect_id !== null && w.winner_sect_id !== member.sect_id).length
    const draws  = wars.filter(w => w.resolved && w.winner_sect_id === null).length
    return res.json({ wins, losses, draws, wars })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro.' }) }
})

export { DEFAULT_SECT_CONFIG, loadSectConfig }
export default router
