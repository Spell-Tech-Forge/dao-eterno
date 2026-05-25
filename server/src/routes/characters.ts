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
    const { name, affinity, gender } = req.body as Record<string, string>

    if (!name || name.trim().length < 2 || name.trim().length > 24) {
      return res.status(400).json({ error: 'Nome inválido (2–24 caracteres).' })
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
      equipped: { weapon: null, armor: null, accessory: null, ring: { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 } },
      maxSlots: 30,
    })

    const result = await pool.query<DbCharacter>(
      `INSERT INTO characters (user_id, name, affinity, gender, qi_max, strength, agility, vitality, defense, perception, hp_current, hp_max, inventory)
       VALUES ($1, $2, $3, $4, 400, $5, $6, $7, $8, $9, $10, $10, $11) RETURNING *`,
      [req.userId, name.trim(), affinity ?? 'Fogo', validGender, str, agi, vit, def, per, hpMax, initialInv]
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
// game_breakthroughs usa inglês (qi_refining/initial).
// Characters podem ter inglês (DEFAULT) ou português (legado).
// toEnRealm/toEnStage convertem qualquer formato para inglês (canônico da tabela).
// toPtRealm/toPtStage convertem para português (usado no REALM_LEVEL_MAP).

const TO_EN_REALM: Record<string, string> = {
  'Refinamento de Qi':       'qi_refining',
  'Fundação Espiritual':     'foundation',
  'Núcleo Dourado':          'golden_core',
  'Alma Nascente':           'nascent_soul',
  'Transformação Espiritual':'spirit_transformation',
  'Unificação':              'unification',
  'Ascensão':                'ascension',
  'Imortal':                 'immortal',
}
const TO_EN_STAGE: Record<string, string> = {
  'Inicial': 'initial', 'Médio': 'middle', 'Avançado': 'advanced', 'Pico': 'peak',
}
const TO_PT_REALM: Record<string, string> = {
  'qi_refining':           'Refinamento de Qi',
  'foundation':            'Fundação Espiritual',
  'golden_core':           'Núcleo Dourado',
  'nascent_soul':          'Alma Nascente',
  'spirit_transformation': 'Transformação Espiritual',
  'unification':           'Unificação',
  'ascension':             'Ascensão',
  'immortal':              'Imortal',
}
const TO_PT_STAGE: Record<string, string> = {
  'initial': 'Inicial', 'middle': 'Médio', 'advanced': 'Avançado', 'peak': 'Pico',
}

function toEnRealm(r: string): string { return TO_EN_REALM[r] ?? r }
function toEnStage(s: string): string { return TO_EN_STAGE[s] ?? s }
function toPtRealm(r: string): string { return TO_PT_REALM[r] ?? r }
function toPtStage(s: string): string { return TO_PT_STAGE[s] ?? s }

// ── Mapa reino → nível de rompimento (1–32) ───────────────────────────────────

const REALM_LEVEL_MAP: Record<string, Record<string, number>> = {
  'Refinamento de Qi':        { 'Inicial': 1,  'Médio': 2,  'Avançado': 3,  'Pico': 4  },
  'Fundação Espiritual':      { 'Inicial': 5,  'Médio': 6,  'Avançado': 7,  'Pico': 8  },
  'Núcleo Dourado':           { 'Inicial': 9,  'Médio': 10, 'Avançado': 11, 'Pico': 12 },
  'Alma Nascente':            { 'Inicial': 13, 'Médio': 14, 'Avançado': 15, 'Pico': 16 },
  'Transformação Espiritual': { 'Inicial': 17, 'Médio': 18, 'Avançado': 19, 'Pico': 20 },
  'Unificação':               { 'Inicial': 21, 'Médio': 22, 'Avançado': 23, 'Pico': 24 },
  'Ascensão':                 { 'Inicial': 25, 'Médio': 26, 'Avançado': 27, 'Pico': 28 },
  'Imortal':                  { 'Inicial': 29, 'Médio': 30, 'Avançado': 31, 'Pico': 32 },
}

// Aceita qualquer formato (inglês ou português) — converte para português para lookup
function realmLevel(realm: string, stage: string): number {
  const pt = toPtRealm(realm)
  const st = toPtStage(stage)
  return REALM_LEVEL_MAP[pt]?.[st] ?? 0
}

// ── Validadores e clamps ──────────────────────────────────────────────────────

const VALID_REALMS = new Set([
  'Refinamento de Qi', 'Fundação Espiritual', 'Núcleo Dourado', 'Alma Nascente',
  'Transformação Espiritual', 'Unificação', 'Ascensão', 'Imortal',
])
const VALID_STAGES = new Set(['Inicial', 'Médio', 'Avançado', 'Pico'])

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
    for (const slot of ['weapon', 'armor', 'accessory', 'ring']) {
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

// ── PUT /:id — sync do estado do personagem ───────────────────────────────────

const QI_PER_SECOND = 3 // taxa real do worker (1 tick/s × 3 Qi/tick)

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
    }>(
      'SELECT cultivation_power, qi_current, qi_max, hp_current, last_played_at, created_at, skills, pending_items FROM characters WHERE id = $1 AND user_id = $2',
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
    const qiGain             = Math.max(0, Math.min(
      cur.qi_max - cur.qi_current,
      Math.floor(meditationActiveMs / 1000 * QI_PER_SECOND)
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

type BreakthroughPath = {
  id: string
  deltas: { strength: number; agility: number; vitality: number; defense: number; perception: number }
}

const DEFAULT_BT_PATHS: BreakthroughPath[] = [
  { id: 'offensive', deltas: { strength: 5, agility: 5, vitality: 2, defense: 2, perception: 2 } },
  { id: 'defensive', deltas: { strength: 2, agility: 2, vitality: 5, defense: 5, perception: 2 } },
  { id: 'balanced',  deltas: { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 3 } },
]

router.post('/:id/breakthrough', async (req, res) => {
  const client = await pool.connect()
  try {
    const { pathId } = req.body as { pathId?: unknown }
    if (typeof pathId !== 'string' || !pathId) {
      return res.status(400).json({ error: 'pathId obrigatório.' })
    }

    await client.query('BEGIN')

    type CharRow = {
      realm: string; realm_stage: string; cultivation_power: string
      qi_current: number; qi_max: number
      strength: number; agility: number; vitality: number; defense: number; perception: number
      luck: number; hp_current: number; hp_max: number; attribute_points: number
      inventory: { items: { instanceId: string; definitionId: string; quantity: number }[]; equipped: Record<string, unknown>; maxSlots: number } | null
      skills: { meditationEndsAt?: number } | null
      last_played_at: string | null; created_at: string
    }
    const charRow = await client.query<CharRow>(
      'SELECT realm, realm_stage, cultivation_power, qi_current, qi_max, ' +
      'strength, agility, vitality, defense, perception, luck, hp_current, hp_max, attribute_points, ' +
      'inventory, skills, last_played_at, created_at FROM characters WHERE id = $1 AND user_id = $2 FOR UPDATE',
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
    const qiGain             = Math.max(0, Math.min(cur.qi_max - cur.qi_current, Math.floor(meditationActiveMs / 1000 * QI_PER_SECOND)))
    const serverQiCurrent        = cur.qi_current + qiGain
    const serverCultivationPower = Number(cur.cultivation_power) + qiGain

    if (serverQiCurrent < cur.qi_max) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Qi insuficiente para romper.' })
    }

    // Requisitos do rompimento — normaliza para inglês (formato canônico da tabela).
    // Cobre personagens em inglês (DEFAULT) e em português (legado).
    const btRow = await client.query<{
      next_realm: string; next_stage: string; new_max_qi: number
      required_items: { itemId: string; quantity: number }[] | null
    }>(
      'SELECT next_realm, next_stage, new_max_qi, required_items FROM game_breakthroughs WHERE realm = $1 AND stage = $2',
      [toEnRealm(cur.realm), toEnStage(cur.realm_stage)]
    )
    if (!btRow.rows.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Nenhum rompimento disponível para este reino/estágio.' })
    }
    const bt = btRow.rows[0]
    const requiredItems = bt.required_items ?? []

    // stat_config (lê do banco; usa defaults se ausente)
    let hpPerVit          = 20
    let attrPointsPerBT   = 3
    let luckGainMin       = 1
    let luckGainMax       = 3
    let paths: BreakthroughPath[] = DEFAULT_BT_PATHS
    try {
      const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
      if (cfgRow.rows.length) {
        const cfg = JSON.parse(cfgRow.rows[0].value)
        hpPerVit        = cfg.hpPerVit                ?? hpPerVit
        attrPointsPerBT = cfg.attrPointsPerBreakthrough ?? attrPointsPerBT
        luckGainMin     = cfg.luckGainMin             ?? luckGainMin
        luckGainMax     = cfg.luckGainMax             ?? luckGainMax
        if (Array.isArray(cfg.breakthroughPaths) && cfg.breakthroughPaths.length) {
          paths = cfg.breakthroughPaths as BreakthroughPath[]
        }
      }
    } catch { /* usa defaults */ }

    const path = paths.find(p => p.id === pathId)
    if (!path) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Caminho de rompimento inválido.' })
    }

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

    // Calcula novos stats
    const d          = path.deltas
    const vitDelta   = d.vitality ?? 0
    const newHpMax   = cur.hp_max + vitDelta * hpPerVit  // preserva bônus de equipamento
    const newHpCurrent = newHpMax                          // restaura HP completo
    const newAttrPoints = cur.attribute_points + attrPointsPerBT
    const luckGain   = luckGainMin + Math.floor(Math.random() * (luckGainMax - luckGainMin + 1))
    const newLevel   = realmLevel(bt.next_realm, bt.next_stage)

    const result = await client.query<DbCharacter>(
      `UPDATE characters SET
         realm = $1, realm_stage = $2, realm_level = $3,
         qi_current = 0, qi_max = $4, cultivation_power = $5,
         strength = strength + $6, agility = agility + $7, vitality = vitality + $8,
         defense = defense + $9, perception = perception + $10,
         hp_max = $11, hp_current = $12,
         attribute_points = $13, luck = luck + $14,
         inventory = $15, last_played_at = $16
       WHERE id = $17 AND user_id = $18 RETURNING *`,
      [
        bt.next_realm, bt.next_stage, newLevel,
        bt.new_max_qi, serverCultivationPower,
        d.strength, d.agility, d.vitality, d.defense, d.perception,
        newHpMax, newHpCurrent,
        newAttrPoints, luckGain,
        JSON.stringify(newInv), new Date().toISOString(),
        req.params.id, req.userId,
      ]
    )

    await client.query('COMMIT')
    return res.json({ ...result.rows[0], luck_gained: luckGain })
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

    const legendResult = await client.query(
      `INSERT INTO legends (user_id, original_character_id, name, realm, realm_stage, realm_level, cultivation_power, cause_of_death, born_at, total_kills, equipped_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.userId, char.id, char.name, char.realm, char.realm_stage, char.realm_level,
       char.qi_current, cause, char.created_at,
       char.total_kills ?? 0,
       JSON.stringify(equipped_snapshot)]
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

  const VALID_SLOTS = ['weapon', 'armor', 'accessory', 'ring'] as const
  if (!VALID_SLOTS.includes(slot as typeof VALID_SLOTS[number])) {
    return res.status(400).json({ error: 'Slot inválido.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [char] } = await client.query<{ inventory: { items: unknown[]; equipped: Record<string, unknown>; maxSlots: number } | null }>(
      'SELECT inventory FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [charId, userId]
    )
    if (!char) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const inv = char.inventory ?? { items: [], equipped: {}, maxSlots: 30 }
    const eq  = { weapon: null, armor: null, accessory: null, ring: null, ...inv.equipped } as Record<string, unknown>

    let newMaxSlots = inv.maxSlots ?? 30

    if (instanceId === null) {
      eq[slot] = null
    } else {
      const item = (inv.items as Array<{ instanceId: string; definitionId: string }>).find(i => i.instanceId === instanceId)
      if (!item) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Item não encontrado no inventário.' })
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

export default router
