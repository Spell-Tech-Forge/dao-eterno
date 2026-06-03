import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'
import type { DbCharacter } from '../types'
import craftingRouter from './crafting'
import combatRouter from './combat'
import consumablesRouter from './consumables'

const router = Router()
const MAX_CHARACTERS = 1

router.use(requireAuth)
router.use(requireNoMaintenance)

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
    const { name, affinity, gender, classId } = req.body as Record<string, string>

    if (!name || name.trim().length < 2 || name.trim().length > 24) {
      return res.status(400).json({ error: 'Nome inválido (2–24 caracteres).' })
    }
    if (!classId) {
      return res.status(400).json({ error: 'Classe obrigatória.' })
    }

    // Valida que a classe existe
    const classRow = await pool.query<{ id: string }>(
      'SELECT id FROM game_classes WHERE id=$1 AND active=true',
      [classId]
    )
    if (!classRow.rows.length) {
      return res.status(400).json({ error: 'Classe inválida.' })
    }

    // Filtro de palavras proibidas
    try {
      const bwRow = await pool.query<{ value: string }>(
        "SELECT value FROM game_settings WHERE key='banned_words'"
      )
      if (bwRow.rows.length) {
        const banned: string[] = JSON.parse(bwRow.rows[0].value)
        const nameLower = name.trim().toLowerCase()
        const hit = banned.find(w => nameLower.includes(w))
        if (hit) return res.status(400).json({ error: 'Nome contém palavras não permitidas.' })
      }
    } catch { /* falha silenciosa — não bloqueia criação se DB falhar */ }

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

    const initialInv = JSON.stringify({
      items:    [{ instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }],
      equipped: { weapon: null, armor: null, accessory: null, ring: { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }, talisman: null },
      maxSlots: 30,
    })

    const result = await pool.query<DbCharacter>(
      `INSERT INTO characters (user_id, name, affinity, gender, class_id, qi_max, strength, agility, vitality, defense, perception, hp_current, hp_max, inventory)
       VALUES ($1, $2, $3, $4, $5, 400, $6, $7, $8, $9, $10, $11, $11, $12) RETURNING *`,
      [req.userId, name.trim(), affinity ?? 'Fogo', validGender, classId, str, agi, vit, def, per, hpMax, initialInv]
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

// ── Normalização bidirecional realm/stage ────────────────────────────────────
// ── Realm / Stage helpers ─────────────────────────────────────────────────────

const REALM_ORDER = [
  'body_tempering','houtian','xiantian','revolving_core','life_destruction',
  'divine_sea','divine_transformation','divine_lord','holy_lord',
  'world_king','empyrean','true_divinity','beyond_divinity',
]

const BODY_TEMPERING_STAGES = ['strength','muscle','bone','marrow','meridian','eight_gates','nine_stars']
const LIFE_DESTRUCTION_STAGES = ['destruction_1','destruction_2','destruction_3','destruction_4','destruction_5','destruction_6','destruction_7','destruction_8','destruction_9']
const STANDARD_STAGES = ['initial','middle','advanced','peak']

function getStagesForRealm(realm: string): string[] {
  if (realm === 'body_tempering')   return BODY_TEMPERING_STAGES
  if (realm === 'life_destruction') return LIFE_DESTRUCTION_STAGES
  return STANDARD_STAGES
}

// Converte legado português/antigo inglês → novo sistema canônico
const LEGACY_REALM: Record<string, string> = {
  'Refinamento de Qi':'body_tempering','qi_refining':'body_tempering',
  'Fundação Espiritual':'houtian','foundation':'houtian',
  'Núcleo Dourado':'xiantian','golden_core':'xiantian',
  'Alma Nascente':'revolving_core','nascent_soul':'revolving_core',
  'Transformação Espiritual':'divine_sea','spirit_transformation':'divine_sea',
  'Unificação':'divine_transformation','unification':'divine_transformation',
  'Ascensão':'divine_lord','ascension':'divine_lord',
  'Imortal':'holy_lord','immortal':'holy_lord',
}
const LEGACY_STAGE: Record<string, string> = {
  'Inicial':'initial','Médio':'middle','Avançado':'advanced','Pico':'peak',
}

function toEnRealm(r: string): string { return LEGACY_REALM[r] ?? r }
function toEnStage(s: string): string { return LEGACY_STAGE[s] ?? s }

// Nível numérico de cultivo para ordenação
function realmLevel(realm: string, stage: string): number {
  const r = toEnRealm(realm)
  const s = toEnStage(stage)
  const ri = REALM_ORDER.indexOf(r)
  if (ri === -1) return 0
  const stages = getStagesForRealm(r)
  const si = stages.indexOf(s)
  return ri * 10 + (si >= 0 ? si : 0) + 1
}

// ── Validadores e clamps ──────────────────────────────────────────────────────

const VALID_REALMS = new Set([
  ...REALM_ORDER,
  ...Object.keys(LEGACY_REALM),
])
const VALID_STAGES = new Set([
  ...STANDARD_STAGES, ...BODY_TEMPERING_STAGES, ...LIFE_DESTRUCTION_STAGES,
  'Inicial','Médio','Avançado','Pico',
])

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
    for (const slot of ['weapon', 'armor', 'accessory', 'ring', 'talisman']) {
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

// ── Qi rate helpers ───────────────────────────────────────────────────────────

const DEFAULT_QI_RATE_CONFIG: Record<string, Record<string, number>> = {
  body_tempering:        { strength: 1,        muscle: 1,        bone: 2,          marrow: 2,        meridian: 3,       eight_gates: 4,    nine_stars: 5      },
  houtian:               { initial: 8,         middle: 12,       advanced: 18,     peak: 28          },
  xiantian:              { initial: 50,        middle: 80,       advanced: 120,    peak: 180         },
  revolving_core:        { initial: 300,       middle: 500,      advanced: 800,    peak: 1200        },
  life_destruction:      { destruction_1: 2000, destruction_2: 3200, destruction_3: 5000, destruction_4: 8000, destruction_5: 13000, destruction_6: 20000, destruction_7: 32000, destruction_8: 50000, destruction_9: 80000 },
  divine_sea:            { initial: 130000,    middle: 200000,   advanced: 320000, peak: 500000      },
  divine_transformation: { initial: 800000,    middle: 1300000,  advanced: 2000000,peak: 3200000     },
  divine_lord:           { initial: 5000000,   middle: 8000000,  advanced: 13000000,peak: 20000000   },
  holy_lord:             { initial: 32000000,  middle: 50000000, advanced: 80000000,peak: 130000000  },
  world_king:            { initial: 200000000, middle: 320000000,advanced: 500000000,peak: 800000000 },
  empyrean:              { initial: 1300000000,middle: 2000000000,advanced: 3200000000,peak: 5000000000 },
  true_divinity:         { initial: 8000000000,middle: 13000000000,advanced: 20000000000,peak: 32000000000 },
  beyond_divinity:       { initial: 50000000000,middle: 80000000000,advanced: 130000000000,peak: 200000000000 },
}

function lookupQiRate(cfg: Record<string, Record<string, number>>, realm: string, stage: string): number {
  const r = toEnRealm(realm)
  const s = toEnStage(stage)
  return cfg[r]?.[s] ?? DEFAULT_QI_RATE_CONFIG[r]?.[s] ?? 1
}

// ── PUT /:id — sync do estado do personagem ───────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>
    const jsonbFields = new Set(['inventory', 'skills', 'bestiary'])

    type PendingEntry = { definitionId: string; quantity: number; obtainedAt: number }

    // Busca estado atual do personagem antes de qualquer update
    const curRow = await pool.query<{
      cultivation_power: string
      qi_current: number
      qi_max: number
      hp_current: number
      last_played_at: string | null
      created_at: string
      skills: { meditationEndsAt?: number } | null
      pending_items: PendingEntry[] | null
      realm: string
      realm_stage: string
    }>(
      'SELECT cultivation_power, qi_current, qi_max, hp_current, last_played_at, created_at, skills, pending_items, realm, realm_stage FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (!curRow.rows.length) {
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    const cur = curRow.rows[0]

    // Calcula Qi acumulado desde o último save com base no meditationEndsAt armazenado
    const nowMs       = Date.now()
    const referenceMs = cur.last_played_at
      ? new Date(cur.last_played_at).getTime()
      : new Date(cur.created_at).getTime()
    const meditationEndsAt   = (cur.skills?.meditationEndsAt ?? 0)
    const meditationActiveMs = Math.max(0, Math.min(meditationEndsAt - referenceMs, nowMs - referenceMs))

    let qiRateCfg = DEFAULT_QI_RATE_CONFIG
    try {
      const cfgRow = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='qi_rate_config'")
      if (cfgRow.rows.length) qiRateCfg = { ...DEFAULT_QI_RATE_CONFIG, ...JSON.parse(cfgRow.rows[0].value) }
    } catch {}
    const qiPerSecond = lookupQiRate(qiRateCfg, cur.realm, cur.realm_stage)

    const qiGain             = Math.max(0, Math.min(
      cur.qi_max - cur.qi_current,
      Math.floor(meditationActiveMs / 1000 * qiPerSecond)
    ))
    const serverQiCurrent        = cur.qi_current + qiGain
    const serverCultivationPower = Number(cur.cultivation_power) + qiGain

    // Itens pendentes adicionados pelo admin enquanto o jogador estava online
    const pendingItems: PendingEntry[] = cur.pending_items ?? []

    // Campos permitidos para sync — stats base e realm são protegidos (só via endpoints dedicados)
    const allowed = [
      'experience',
      'hp_current', 'hp_max',
      'spirit_gold', 'total_kills', 'last_played_at',
      'inventory', 'skills', 'bestiary',
    ]

    // Limites máximos por campo
    const numericBounds: Record<string, [number, number]> = {
      spirit_gold: [0, 2_000_000_000],
      total_kills: [0, 100_000_000],
      hp_current:  [0,   500_000],
      hp_max:      [1,   500_000],
      experience:  [0, 100_000_000_000],
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
        // hp_current só pode diminuir via PUT — aumentos são feitos pelo endpoint de heal
        if (key === 'hp_current' && clamped > cur.hp_current) continue
        sanitized = clamped
      // Inventário — sanitiza e mescla itens pendentes (admin)
      } else if (key === 'inventory') {
        sanitized = sanitizeInventory(val)
        if (pendingItems.length > 0) {
          const inv = sanitized as { items: { instanceId: string; definitionId: string; quantity: number; obtainedAt?: number }[]; equipped: Record<string, unknown>; maxSlots: number }
          for (const p of pendingItems) {
            const existing = inv.items.find(i => i.definitionId === p.definitionId && !(i as Record<string, unknown>).upgradeLevel && !(i as Record<string, unknown>).ascensionTier)
            if (existing) {
              existing.quantity = (existing.quantity ?? 1) + (p.quantity ?? 1)
            } else {
              inv.items.push({ instanceId: `${p.definitionId}-adm-${Date.now()}-${Math.random().toString(36).slice(2)}`, definitionId: p.definitionId, quantity: p.quantity ?? 1, obtainedAt: p.obtainedAt ?? Date.now() })
            }
          }
          sanitized = inv
        }
      }

      updates.push(`${key} = $${i++}`)
      values.push(jsonbFields.has(key) && sanitized !== null ? JSON.stringify(sanitized) : sanitized)
    }

    // qi_current e cultivation_power são sempre escritos pelo servidor
    updates.push(`qi_current = $${i++}`)
    values.push(serverQiCurrent)
    updates.push(`cultivation_power = $${i++}`)
    values.push(serverCultivationPower)

    // Acumula tempo de jogo enviado pelo cliente (delta em segundos, cap 1h por sync)
    const playtimeDelta = Math.max(0, Math.min(3600, Math.floor(Number(body.playtime_delta) || 0)))
    if (playtimeDelta > 0) {
      updates.push(`total_playtime_seconds = total_playtime_seconds + $${i++}`)
      values.push(playtimeDelta)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' })
    }

    // Limpa pending_items após mesclar
    if (pendingItems.length > 0) {
      updates.push(`pending_items = '[]'::jsonb`)
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

// ── POST /:id/heal — restaura HP ao máximo (custo de ouro validado no cliente) ──

router.post('/:id/heal', async (req, res) => {
  try {
    const { rows: [char] } = await pool.query<{ hp_max: number; spirit_gold: string }>(
      'SELECT hp_max, spirit_gold FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })

    const { gold_spent } = req.body as { gold_spent?: number }
    const newGold = gold_spent != null
      ? Math.max(0, Number(char.spirit_gold) - Math.max(0, Math.floor(Number(gold_spent))))
      : Number(char.spirit_gold)

    const { rows: [updated] } = await pool.query<{ hp_current: number; spirit_gold: string }>(
      'UPDATE characters SET hp_current = hp_max, spirit_gold = $1 WHERE id = $2 AND user_id = $3 RETURNING hp_current, spirit_gold',
      [newGold, req.params.id, req.userId]
    )
    return res.json({ hp_current: updated.hp_current, spirit_gold: updated.spirit_gold })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao restaurar HP.' })
  }
})

// ── POST /:id/meditate — registra ativação de meditação imediatamente no banco ──

router.post('/:id/meditate', async (req, res) => {
  try {
    const { minutes } = req.body as { minutes?: unknown }
    const mins = Number(minutes)
    if (!Number.isFinite(mins) || mins <= 0 || mins > 1440) {
      return res.status(400).json({ error: 'Duração inválida (1–1440 minutos).' })
    }

    const { rows } = await pool.query<{ skills: { meditationEndsAt?: number } | null }>(
      'SELECT skills FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })

    const now        = Date.now()
    const skills     = (rows[0].skills ?? {}) as Record<string, unknown>
    const currentEnd = (skills.meditationEndsAt as number | undefined) ?? 0
    skills.meditationEndsAt = Math.max(currentEnd, now) + mins * 60_000

    await pool.query(
      'UPDATE characters SET skills = $1 WHERE id = $2 AND user_id = $3',
      [JSON.stringify(skills), req.params.id, req.userId]
    )

    return res.json({ meditationEndsAt: skills.meditationEndsAt })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao ativar meditação.' })
  }
})

// ── POST /:id/breakthrough — rompimento server-authoritative ──────────────────

type StatDeltas = { strength: number; agility: number; vitality: number; defense: number; perception: number }

const DEFAULT_CLASS_DELTAS: Record<string, StatDeltas> = {
  cultivador_qi:    { strength: 2, agility: 4, vitality: 4, defense: 3, perception: 3 },
  espadachim:       { strength: 5, agility: 4, vitality: 2, defense: 2, perception: 3 },
  guerreiro_sabre:  { strength: 6, agility: 1, vitality: 3, defense: 5, perception: 1 },
  lanceiro:         { strength: 4, agility: 3, vitality: 3, defense: 4, perception: 2 },
  mestre_leque:     { strength: 1, agility: 5, vitality: 4, defense: 1, perception: 5 },
  eremita_bastao:   { strength: 1, agility: 2, vitality: 5, defense: 5, perception: 3 },
  arqueiro:         { strength: 1, agility: 4, vitality: 2, defense: 1, perception: 8 },
  sombra_veloz:     { strength: 1, agility: 7, vitality: 1, defense: 1, perception: 6 },
  trovejante:       { strength: 8, agility: 1, vitality: 2, defense: 4, perception: 1 },
  dancador_corrente:{ strength: 4, agility: 5, vitality: 2, defense: 3, perception: 2 },
}
const FALLBACK_DELTAS: StatDeltas = { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 4 }

router.post('/:id/breakthrough', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    type CharRow = {
      realm: string; realm_stage: string; cultivation_power: string
      qi_current: number; qi_max: number
      strength: number; agility: number; vitality: number; defense: number; perception: number
      luck: number; hp_current: number; hp_max: number; attribute_points: number
      talent_points: number
      inventory: { items: { instanceId: string; definitionId: string; quantity: number }[]; equipped: Record<string, unknown>; maxSlots: number } | null
      skills: { meditationEndsAt?: number } | null
      bestiary: { entries?: Record<string, { kills: number }> } | null
      last_played_at: string | null; created_at: string
      class_id: string | null
    }
    const charRow = await client.query<CharRow>(
      'SELECT realm, realm_stage, cultivation_power, qi_current, qi_max, ' +
      'strength, agility, vitality, defense, perception, luck, hp_current, hp_max, attribute_points, talent_points, ' +
      'inventory, skills, bestiary, last_played_at, created_at, class_id FROM characters WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRow.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    const cur = charRow.rows[0]

    // Computa Qi atual server-side (mesma lógica do PUT)
    const nowMs       = Date.now()
    const referenceMs = cur.last_played_at
      ? new Date(cur.last_played_at).getTime()
      : new Date(cur.created_at).getTime()
    const meditationEndsAt   = cur.skills?.meditationEndsAt ?? 0
    const meditationActiveMs = Math.max(0, Math.min(meditationEndsAt - referenceMs, nowMs - referenceMs))

    let btQiRateCfg = DEFAULT_QI_RATE_CONFIG
    try {
      const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='qi_rate_config'")
      if (cfgRow.rows.length) btQiRateCfg = { ...DEFAULT_QI_RATE_CONFIG, ...JSON.parse(cfgRow.rows[0].value) }
    } catch {}
    const btQiPerSecond = lookupQiRate(btQiRateCfg, cur.realm, cur.realm_stage)

    const qiGain             = Math.max(0, Math.min(cur.qi_max - cur.qi_current, Math.floor(meditationActiveMs / 1000 * btQiPerSecond)))
    const serverQiCurrent        = cur.qi_current + qiGain
    const serverCultivationPower = Number(cur.cultivation_power) + qiGain

    if (serverQiCurrent < cur.qi_max) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Qi insuficiente para romper.' })
    }

    // Requisitos do rompimento — normaliza realm/stage para canônico
    const btRow = await client.query<{
      next_realm: string; next_stage: string; new_max_qi: number
      required_items: { itemId: string; quantity: number }[] | null
      required_kills: { biomeId: string; count: number }[] | null
    }>(
      'SELECT next_realm, next_stage, new_max_qi, required_items, required_kills FROM game_breakthroughs WHERE realm = $1 AND stage = $2',
      [toEnRealm(cur.realm), toEnStage(cur.realm_stage)]
    )
    if (!btRow.rows.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Nenhum rompimento disponível para este reino/estágio.' })
    }
    const bt = btRow.rows[0]
    const requiredItems = bt.required_items ?? []
    const requiredKills = bt.required_kills ?? []

    // Valida kill requirements (contagem do bestiário por bioma)
    if (requiredKills.length > 0) {
      const bestiary = (cur as unknown as Record<string, unknown>).bestiary as { entries?: Record<string, { kills: number }> } | null
      const entries = bestiary?.entries ?? {}
      // Busca biomas para obter listas de monstros
      const biomeIds = requiredKills.map(r => r.biomeId)
      const { rows: biomeRows } = await client.query<{ id: string; enemy_pool: string[]; boss_id: string | null; elite_id: string | null }>(
        'SELECT id, enemy_pool, boss_id, elite_id FROM game_biomes WHERE id = ANY($1)',
        [biomeIds]
      )
      const biomeMonsters: Record<string, string[]> = {}
      for (const b of biomeRows) {
        biomeMonsters[b.id] = [
          ...(b.enemy_pool ?? []),
          ...(b.boss_id ? [b.boss_id] : []),
          ...(b.elite_id ? [b.elite_id] : []),
        ]
      }
      for (const req of requiredKills) {
        const monsters = biomeMonsters[req.biomeId] ?? []
        const totalKills = monsters.reduce((sum, mId) => sum + (entries[mId]?.kills ?? 0), 0)
        if (totalKills < req.count) {
          await client.query('ROLLBACK')
          return res.status(400).json({ error: `Mortes insuficientes no bioma. Necessário: ${req.count}, atual: ${totalKills}.` })
        }
      }
    }

    // stat_config (lê do banco; usa defaults se ausente)
    let hpPerVit          = 20
    let attrPointsPerBT   = 3
    let luckGainMin       = 1
    let luckGainMax       = 3
    try {
      const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
      if (cfgRow.rows.length) {
        const cfg = JSON.parse(cfgRow.rows[0].value)
        hpPerVit        = cfg.hpPerVit                 ?? hpPerVit
        attrPointsPerBT = cfg.attrPointsPerBreakthrough ?? attrPointsPerBT
        luckGainMin     = cfg.luckGainMin              ?? luckGainMin
        luckGainMax     = cfg.luckGainMax              ?? luckGainMax
      }
    } catch { /* usa defaults */ }

    // Deltas por classe — lê config admin, cai no default hardcoded
    let classDeltas: Record<string, StatDeltas> = { ...DEFAULT_CLASS_DELTAS }
    try {
      const cdRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='class_breakthrough_config'")
      if (cdRow.rows.length) classDeltas = { ...DEFAULT_CLASS_DELTAS, ...JSON.parse(cdRow.rows[0].value) }
    } catch {}
    const classId = cur.class_id ?? ''
    const d: StatDeltas = classDeltas[classId] ?? FALLBACK_DELTAS

    // Valida itens no inventário
    const inv = cur.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    for (const req of requiredItems) {
      const found = inv.items.find(i => i.definitionId === req.itemId)
      if (!found || found.quantity < req.quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Item insuficiente para romper.` })
      }
    }

    // Remove itens consumidos do inventário
    let newItems = [...inv.items]
    for (const req of requiredItems) {
      const idx = newItems.findIndex(i => i.definitionId === req.itemId)
      if (idx === -1) continue
      if (newItems[idx].quantity <= req.quantity) {
        newItems.splice(idx, 1)
      } else {
        newItems = newItems.map((it, j) => j === idx ? { ...it, quantity: it.quantity - req.quantity } : it)
      }
    }
    const newInv = { ...inv, items: newItems }

    // ── Life Destruction: chance de falha nas destruições 7, 8, 9 ───────────
    const RISKY_STAGES = new Set(['destruction_7', 'destruction_8', 'destruction_9'])
    const currentNormStage = toEnStage(cur.realm_stage)
    if (toEnRealm(cur.realm) === 'life_destruction' && RISKY_STAGES.has(currentNormStage)) {
      // Lê configuração de chance de falha
      let failChance = { fail_chance_7: 25, fail_chance_8: 40, fail_chance_9: 60 }
      try {
        const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='life_destruction_config'")
        if (cfgRow.rows.length) failChance = { ...failChance, ...JSON.parse(cfgRow.rows[0].value) }
      } catch {}

      const chanceMap: Record<string, number> = {
        destruction_7: failChance.fail_chance_7,
        destruction_8: failChance.fail_chance_8,
        destruction_9: failChance.fail_chance_9,
      }
      const failPct = chanceMap[currentNormStage] ?? 0
      const roll = Math.random() * 100

      if (roll < failPct) {
        // FALHOU — verificar talismã de preservação no inventário
        const preservationIds = ['talisma_preservacao_t1','talisma_preservacao_t2','talisma_preservacao_t3']
        const preservationItem = inv.items.find(i => preservationIds.includes(i.definitionId))
        const { preservationItemId } = req.body as { preservationItemId?: string }

        // Seleciona talismã especificado pelo player OU o primeiro disponível
        const talismaItem = preservationItemId
          ? inv.items.find(i => i.instanceId === preservationItemId && preservationIds.includes(i.definitionId))
          : preservationItem

        if (talismaItem) {
          // Sobreviveu — consome o talismã, não avança
          const newItemsSurvived = newItems.map(i =>
            i.instanceId === talismaItem.instanceId
              ? { ...i, quantity: i.quantity - 1 }
              : i
          ).filter(i => i.quantity > 0)
          const newInvSurvived = { ...inv, items: newItemsSurvived }
          await client.query(
            'UPDATE characters SET inventory=$1, last_played_at=NOW() WHERE id=$2 AND user_id=$3',
            [JSON.stringify(newInvSurvived), req.params.id, req.userId]
          )
          await client.query('COMMIT')
          return res.json({
            survived: true,
            failed: true,
            talisma_consumed: talismaItem.definitionId,
            message: 'A Destruição falhou! O Talismã de Preservação salvou sua vida.',
            realm: cur.realm, realm_stage: cur.realm_stage,
          })
        } else {
          // Morreu — materiais já foram consumidos (newItems), personagem vai para legends
          const newInvDead = { ...inv, items: newItems }
          await client.query(
            'UPDATE characters SET inventory=$1, last_played_at=NOW() WHERE id=$2 AND user_id=$3',
            [JSON.stringify(newInvDead), req.params.id, req.userId]
          )
          await client.query('COMMIT')
          return res.json({
            survived: false,
            failed: true,
            died: true,
            message: 'A Destruição falhou! Você foi destruído sem um Talismã de Preservação.',
          })
        }
      }
    }

    // Calcula novos stats
    // d já definido acima como classDeltas[classId]
    const vitDelta   = d.vitality ?? 0
    const newHpMax   = cur.hp_max + vitDelta * hpPerVit  // preserva bônus de equipamento
    const newHpCurrent = newHpMax                          // restaura HP completo
    const newAttrPoints = cur.attribute_points + attrPointsPerBT
    const luckGain   = luckGainMin + Math.floor(Math.random() * (luckGainMax - luckGainMin + 1))
    const newLevel   = realmLevel(bt.next_realm, bt.next_stage)

    // Pontos de talento por breakthrough (configurável via stat_config.talentPointsPerBreakthrough)
    let talentPtsPerBT = 1
    try {
      const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
      if (cfgRow.rows.length) {
        const cfg = JSON.parse(cfgRow.rows[0].value)
        talentPtsPerBT = cfg.talentPointsPerBreakthrough ?? 1
      }
    } catch { /* usa default */ }
    const newTalentPoints = (cur.talent_points ?? 0) + talentPtsPerBT

    const result = await client.query<DbCharacter>(
      `UPDATE characters SET
         realm = $1, realm_stage = $2, realm_level = $3,
         qi_current = 0, qi_max = $4, cultivation_power = $5,
         strength = strength + $6, agility = agility + $7, vitality = vitality + $8,
         defense = defense + $9, perception = perception + $10,
         hp_max = $11, hp_current = $12,
         attribute_points = $13, luck = luck + $14,
         talent_points = $15,
         inventory = $16, last_played_at = $17
       WHERE id = $18 AND user_id = $19 RETURNING *`,
      [
        bt.next_realm, bt.next_stage, newLevel,
        bt.new_max_qi, serverCultivationPower,
        d.strength, d.agility, d.vitality, d.defense, d.perception,
        newHpMax, newHpCurrent,
        newAttrPoints, luckGain,
        newTalentPoints,
        JSON.stringify(newInv), new Date().toISOString(),
        req.params.id, req.userId,
      ]
    )

    await client.query('COMMIT')
    return res.json({ ...result.rows[0], luck_gained: luckGain, talent_points_gained: talentPtsPerBT })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao processar rompimento.' })
  } finally {
    client.release()
  }
})

// ── POST /:id/spend-attribute — gasta ponto de atributo server-side ───────────

router.post('/:id/spend-attribute', async (req, res) => {
  try {
    const { attr } = req.body as { attr?: unknown }
    const VALID_ATTRS = ['strength', 'agility', 'vitality', 'defense', 'perception'] as const
    type ValidAttr = typeof VALID_ATTRS[number]
    if (typeof attr !== 'string' || !(VALID_ATTRS as readonly string[]).includes(attr)) {
      return res.status(400).json({ error: 'Atributo inválido.' })
    }
    const safeAttr = attr as ValidAttr

    const { rows } = await pool.query<{ attribute_points: number; agility: number }>(
      'SELECT attribute_points, agility FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    if (rows[0].attribute_points <= 0) {
      return res.status(400).json({ error: 'Sem pontos de atributo disponíveis.' })
    }

    let hpPerVit  = 20
    let baseSpeed = 2.0, speedPerAgi = 0.03, minAgiSpeed = 0.5
    try {
      const cfgRow = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
      if (cfgRow.rows.length) {
        const cfg = JSON.parse(cfgRow.rows[0].value)
        hpPerVit    = cfg.hpPerVit    ?? hpPerVit
        baseSpeed   = cfg.baseSpeed   ?? baseSpeed
        speedPerAgi = cfg.speedPerAgi ?? speedPerAgi
        minAgiSpeed = cfg.minAgiSpeed ?? minAgiSpeed
      }
    } catch { /* usa defaults */ }

    // Valida cap de agilidade: se adicionar 1 ponto não altera a velocidade de ataque base, rejeita
    if (safeAttr === 'agility') {
      const agi      = rows[0].agility
      const speedNow  = Math.max(minAgiSpeed, baseSpeed - agi       * speedPerAgi)
      const speedNext = Math.max(minAgiSpeed, baseSpeed - (agi + 1) * speedPerAgi)
      if (speedNext >= speedNow) {
        return res.status(400).json({ error: 'Agilidade já atingiu o limite máximo de velocidade de ataque.' })
      }
    }

    let result
    if (safeAttr === 'vitality') {
      result = await pool.query<DbCharacter>(
        `UPDATE characters SET
           vitality = vitality + 1,
           hp_max = hp_max + $1,
           hp_current = LEAST(hp_current + $1, hp_max + $1),
           attribute_points = attribute_points - 1
         WHERE id = $2 AND user_id = $3 RETURNING *`,
        [hpPerVit, req.params.id, req.userId]
      )
    } else {
      result = await pool.query<DbCharacter>(
        `UPDATE characters SET ${safeAttr} = ${safeAttr} + 1, attribute_points = attribute_points - 1
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [req.params.id, req.userId]
      )
    }

    if (!result.rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao gastar ponto de atributo.' })
  }
})

// ── POST /:id/talents/unlock — desbloqueia um nó de talento ──────────────────

router.post('/:id/talents/unlock', async (req, res) => {
  try {
    const { nodeId } = req.body as { nodeId?: unknown }
    if (typeof nodeId !== 'string' || !nodeId) {
      return res.status(400).json({ error: 'nodeId obrigatório.' })
    }

    const charRow = await pool.query<{
      realm: string; realm_stage: string; class_id: string | null
      talent_points: number; unlocked_talents: unknown
    }>(
      'SELECT realm, realm_stage, class_id, talent_points, unlocked_talents FROM characters WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    )
    if (!charRow.rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    const char = charRow.rows[0]

    const nodeRow = await pool.query<{
      id: string; class_id: string; required_realm: string; required_stage: string
      point_cost: number; max_level: number; required_node_id: string | null
    }>(
      'SELECT id, class_id, required_realm, required_stage, point_cost, max_level, required_node_id FROM game_talent_nodes WHERE id=$1 AND active=true',
      [nodeId]
    )
    if (!nodeRow.rows.length) return res.status(404).json({ error: 'Nó de talento não encontrado.' })
    const node = nodeRow.rows[0]
    const maxLevel = node.max_level ?? 1

    if (node.class_id !== char.class_id) {
      return res.status(400).json({ error: 'Este talento não pertence à sua classe.' })
    }

    // Normaliza unlocked_talents: aceita string[] (legado) ou Record<string,number> (novo)
    const raw = char.unlocked_talents
    const unlocked: Record<string, number> = Array.isArray(raw)
      ? Object.fromEntries((raw as string[]).map(id => [id, 1]))
      : (typeof raw === 'object' && raw !== null ? raw as Record<string, number> : {})

    const currentLevel = unlocked[nodeId] ?? 0
    if (currentLevel >= maxLevel) {
      return res.status(400).json({ error: maxLevel === 1 ? 'Talento já desbloqueado.' : `Talento já está no nível máximo (${maxLevel}).` })
    }

    if ((char.talent_points ?? 0) < node.point_cost) {
      return res.status(400).json({ error: 'Pontos de talento insuficientes.' })
    }

    // Verifica requisito de cultivo
    const charLevel = realmLevel(char.realm, char.realm_stage)
    const nodeLevel = realmLevel(node.required_realm, node.required_stage)
    if (charLevel < nodeLevel) {
      return res.status(400).json({ error: 'Cultivo insuficiente para este talento.' })
    }

    // Verifica pré-requisito de nó (precisa ter pelo menos nível 1)
    if (node.required_node_id && !(unlocked[node.required_node_id] ?? 0 >= 1)) {
      return res.status(400).json({ error: 'Desbloqueie o talento anterior primeiro.' })
    }

    const newUnlocked = { ...unlocked, [nodeId]: currentLevel + 1 }
    const newPoints   = char.talent_points - node.point_cost

    await pool.query(
      'UPDATE characters SET talent_points=$1, unlocked_talents=$2 WHERE id=$3 AND user_id=$4',
      [newPoints, JSON.stringify(newUnlocked), req.params.id, req.userId]
    )

    return res.json({ talent_points: newPoints, unlocked_talents: newUnlocked })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao desbloquear talento.' })
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

    const equipped_snapshot = char.inventory?.equipped ?? null

    // Snapshot completo para permitir restauração fiel pelo admin
    const character_snapshot = {
      hp_current:       char.hp_current,
      hp_max:           char.hp_max,
      qi_current:       char.qi_current,
      qi_max:           char.qi_max,
      cultivation_power: char.cultivation_power,
      spirit_gold:      char.spirit_gold,
      strength:         char.strength,
      agility:          char.agility,
      vitality:         char.vitality,
      defense:          char.defense,
      perception:       char.perception,
      luck:             char.luck,
      attribute_points: char.attribute_points,
      affinity:         char.affinity,
      gender:           char.gender,
      inventory:        char.inventory,
      skills:           char.skills,
      bestiary:         char.bestiary,
    }

    const legendResult = await client.query(
      `INSERT INTO legends (user_id, original_character_id, name, realm, realm_stage, realm_level, cultivation_power, cause_of_death, born_at, total_kills, equipped_snapshot, character_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.userId, char.id, char.name, char.realm, char.realm_stage, char.realm_level,
       char.qi_current, cause, char.created_at,
       char.total_kills ?? 0,
       JSON.stringify(equipped_snapshot),
       JSON.stringify(character_snapshot)]
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

// ── Equip / Unequip ────────────────────────────────────────────────────────────
router.patch('/:id/equip', async (req, res) => {
  const charId = parseInt(req.params.id)
  const userId = req.userId!
  const { slot, instanceId } = req.body as { slot: string; instanceId: string | null }

  const VALID_SLOTS = ['weapon', 'armor', 'accessory', 'ring', 'talisman'] as const
  if (!VALID_SLOTS.includes(slot as typeof VALID_SLOTS[number])) {
    return res.status(400).json({ error: 'Slot inválido.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [char] } = await client.query<{
      inventory: { items: unknown[]; equipped: Record<string, unknown>; maxSlots: number } | null
      class_id: string | null
    }>(
      'SELECT inventory, class_id FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [charId, userId]
    )
    if (!char) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const inv     = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const invEq   = (inv.equipped ?? {}) as Record<string, unknown>
    const RING_FB = { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }
    const eq      = {
      weapon:    invEq.weapon    ?? null,
      armor:     invEq.armor     ?? null,
      accessory: invEq.accessory ?? null,
      ring:      invEq.ring      ?? RING_FB,
      talisman:  invEq.talisman  ?? null,
      ...invEq,
    } as Record<string, unknown>

    let newMaxSlots = inv.maxSlots ?? 30

    if (instanceId === null) {
      eq[slot] = null
    } else {
      const item = (inv.items as Array<{ instanceId: string; definitionId: string }>).find(i => i.instanceId === instanceId)
      if (!item) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Item não encontrado no inventário.' })
      }

      // ── Validação de lock de classe (weapon / armor / accessory) ──
      if (['weapon', 'armor', 'accessory'].includes(slot) && char.class_id) {
        const { rows: [itemDef] } = await client.query<{ type: string; subtype: string | null }>(
          'SELECT type, subtype FROM game_items WHERE id = $1',
          [item.definitionId]
        )
        if (itemDef) {
          const { rows: [cls] } = await client.query<{
            allowed_weapon_type: string; allowed_armor_type: string; allowed_accessory_type: string
          }>(
            'SELECT allowed_weapon_type, allowed_armor_type, allowed_accessory_type FROM game_classes WHERE id = $1',
            [char.class_id]
          )
          if (cls && itemDef.subtype) {
            const allowed =
              slot === 'weapon'    ? cls.allowed_weapon_type :
              slot === 'armor'     ? cls.allowed_armor_type  :
              cls.allowed_accessory_type
            if (itemDef.subtype !== allowed) {
              await client.query('ROLLBACK')
              return res.status(400).json({ error: 'Este item não é compatível com a sua classe.' })
            }
          }
        }
      }

      eq[slot] = item

      // Anel: recalcula maxSlots a partir da definição do item
      if (slot === 'ring') {
        const { rows: [itemDef] } = await client.query<{ stats: { slots?: number } | null }>(
          'SELECT stats FROM game_items WHERE id = $1',
          [item.definitionId]
        )
        if (itemDef?.stats?.slots) newMaxSlots = itemDef.stats.slots
      }
    }

    const updatedInv = { ...inv, equipped: eq, maxSlots: newMaxSlots }
    await client.query(
      `UPDATE characters SET inventory = $1, last_played_at = NOW() WHERE id = $2`,
      [JSON.stringify(updatedInv), charId]
    )
    await client.query('COMMIT')
    return res.json({ equipped: eq, maxSlots: newMaxSlots })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[equip]', err)
    return res.status(500).json({ error: 'Erro ao equipar item.' })
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

// Fases 3 — crafting, forja, ascensão, desmonte, reparo server-side
router.use('/:id', craftingRouter)
router.use('/:id', combatRouter)
router.use('/:id', consumablesRouter)

// ── POST /:id/laws/study — estuda um fragmento de lei ──────────────────────

const LAW_LEVELS = ['none', 'fragment', 'initial', 'middle', 'advanced', 'complete'] as const
type LawLevel = typeof LAW_LEVELS[number]

router.post('/:id/laws/study', async (req, res) => {
  try {
    const { lawId } = req.body as { lawId?: string }
    if (!lawId) return res.status(400).json({ error: 'lawId obrigatório.' })

    // Busca definição da lei
    const lawRow = await pool.query<{
      id: string; min_realm_initial: string; min_realm_middle: string
      min_realm_advanced: string; min_realm_complete: string
      fragments_to_initial: number; fragments_to_middle: number
      fragments_to_advanced: number; fragments_to_complete: number
      fragment_item_id: string | null
    }>(
      'SELECT * FROM game_laws WHERE id=$1 AND active=true',
      [lawId]
    )
    if (!lawRow.rows.length) return res.status(404).json({ error: 'Lei não encontrada.' })
    const law = lawRow.rows[0]

    // Busca personagem
    const charRow = await pool.query<{
      realm: string; realm_stage: string; laws: Record<string, string> | null
      inventory: { items: { instanceId: string; definitionId: string; quantity: number }[] } | null
    }>(
      'SELECT realm, realm_stage, laws, inventory FROM characters WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    )
    if (!charRow.rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    const char = charRow.rows[0]

    const currentLevel: LawLevel = (char.laws?.[lawId] as LawLevel) ?? 'none'
    if (currentLevel === 'complete') return res.status(400).json({ error: 'Lei já completamente dominada.' })

    const nextLevelIdx = LAW_LEVELS.indexOf(currentLevel) + 1
    const nextLevel = LAW_LEVELS[nextLevelIdx] as LawLevel

    // Requisito de realm para o próximo nível
    const realmReq: Record<string, string> = {
      fragment: 'body_tempering',
      initial:  law.min_realm_initial,
      middle:   law.min_realm_middle,
      advanced: law.min_realm_advanced,
      complete: law.min_realm_complete,
    }
    const requiredRealm = realmReq[nextLevel]
    if (requiredRealm && realmLevel(char.realm, char.realm_stage) < realmLevel(requiredRealm, 'initial')) {
      return res.status(400).json({ error: `Cultivo insuficiente. Necessário: ${requiredRealm}.` })
    }

    // Custo em fragmentos
    const fragmentCost: Record<string, number> = {
      fragment: 1,
      initial:  law.fragments_to_initial,
      middle:   law.fragments_to_middle,
      advanced: law.fragments_to_advanced,
      complete: law.fragments_to_complete,
    }
    const cost = fragmentCost[nextLevel] ?? 1
    const fragmentItemId = law.fragment_item_id
    if (!fragmentItemId) return res.status(400).json({ error: 'Item de fragmento não configurado.' })

    const inv = char.inventory ?? { items: [] }
    const fragmentItem = inv.items.find(i => i.definitionId === fragmentItemId)
    if (!fragmentItem || fragmentItem.quantity < cost) {
      return res.status(400).json({ error: `Fragmentos insuficientes. Necessário: ${cost}.` })
    }

    // Consome fragmentos e avança
    const newItems = inv.items.map(i =>
      i.definitionId === fragmentItemId
        ? { ...i, quantity: i.quantity - cost }
        : i
    ).filter(i => i.quantity > 0)
    const newLaws = { ...(char.laws ?? {}), [lawId]: nextLevel }

    await pool.query(
      "UPDATE characters SET laws=$1, inventory=jsonb_set(inventory, '{items}', $2::jsonb) WHERE id=$3 AND user_id=$4",
      [JSON.stringify(newLaws), JSON.stringify(newItems), req.params.id, req.userId]
    )

    return res.json({ laws: newLaws, level: nextLevel, consumed: cost })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao estudar lei.' })
  }
})

export default router
