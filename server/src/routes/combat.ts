import { Router, type Request, type Response } from 'express'
import { pool } from '../db'
import { randomUUID } from 'crypto'
import { updateMissionProgress } from './sect'

const router = Router({ mergeParams: true })
type P = { id: string }

// ── Types ─────────────────────────────────────────────────────────────────────

type InvItem  = { instanceId: string; definitionId: string; quantity: number; durability?: number; obtainedAt: number; upgradeLevel?: number; ascensionTier?: number }
type Equipped = { weapon: InvItem|null; armor: InvItem|null; accessory: InvItem|null; ring: InvItem|null; talisman: InvItem|null }
type Inv      = { items: InvItem[]; equipped: Equipped; maxSlots: number }
type BestiaryEntry = { monsterId: string; kills: number; firstKilledAt: number; discoveredDrops: string[] }
type BestiaryBlob  = { entries: Record<string, BestiaryEntry>; discoveredItems: string[] }

interface DropEntry  { itemId: string; chance: number; quantityMin: number; quantityMax: number }
interface MonsterRow { id: string; qi_reward: number; gold_reward_min: number; gold_reward_max: number; drop_table: DropEntry[]; level_min: number; level_max: number }
interface KillRecord { monsterId: string; rarity: string; level: number }

// ── In-memory combat sessions ──────────────────────────────────────────────────

interface CombatSession {
  charId:          number
  userId:          number
  biomeId:         string
  startedAt:       number
  killCount:       number
  lastResolveAt:   number
  powerScale:      number
  territoryBonus:  number  // bônus de drop% do território controlado pela seita
}

const combatSessions = new Map<string, CombatSession>()

// ── Cálculo de poder real do personagem ───────────────────────────────────────

interface CharPowerRow {
  strength: number; agility: number; vitality: number; defense: number; perception: number; luck: number
  realm: string; realm_stage: string; inventory: { equipped?: Record<string, unknown> } | null
}

const REALM_ORDER_POWER = [
  'body_tempering','houtian','xiantian','revolving_core','life_destruction',
  'divine_sea','divine_transformation','divine_lord','holy_lord',
  'world_king','empyrean','true_divinity','beyond_divinity',
]
const STAGE_ORDER_POWER: Record<string, number> = {
  strength:1, muscle:2, bone:3, marrow:4, meridian:5, eight_gates:6, nine_stars:7,
  initial:1, middle:2, advanced:3, peak:4,
  destruction_1:1,destruction_2:2,destruction_3:3,destruction_4:4,
  destruction_5:5,destruction_6:6,destruction_7:7,destruction_8:8,destruction_9:9,
}

function realmLevelPower(realm: string, stage: string): number {
  const ri = REALM_ORDER_POWER.indexOf(realm)
  if (ri === -1) return 0
  const maxStages = realm === 'body_tempering' ? 7 : realm === 'life_destruction' ? 9 : 4
  const si = (STAGE_ORDER_POWER[stage] ?? 1) - 1
  return ri * 10 + Math.min(si, maxStages - 1)
}

async function calculatePlayerPower(char: CharPowerRow): Promise<number> {
  // Stats base (usando fórmulas padrão do jogo)
  const baseAtk = char.strength   * 4    // atkPerStr default
  const baseHp  = char.vitality   * 20   // hpPerVit default
  const baseDef = char.defense    * 3    // defPerDef default
  const baseSpd    = Math.max(0.5, 2.0 - char.agility * 0.03)
  const critChance = (char.luck ?? 0) * 0.5
  const critDmg    = char.perception * 5

  // Bônus de equipamento (lê do JSON de inventário)
  let eqAtk = 0, eqDef = 0, eqHp = 0
  try {
    const eq = char.inventory?.equipped as Record<string, {
      definitionId: string; upgradeLevel?: number; ascensionTier?: number
    } | null> | undefined
    if (eq) {
      const slots = ['weapon','armor','accessory'] as const
      const ids = slots.map(s => eq[s]?.definitionId).filter(Boolean) as string[]
      if (ids.length > 0) {
        const { rows: items } = await pool.query<{
          id: string; stats: Record<string, number>
        }>(
          `SELECT id, stats FROM game_items WHERE id = ANY($1)`, [ids]
        )
        for (const slot of slots) {
          const equipped = eq[slot]; if (!equipped) continue
          const item = items.find(i => i.id === equipped.definitionId); if (!item) continue
          const upgLvl  = equipped.upgradeLevel  ?? 0
          const ascTier = equipped.ascensionTier ?? 0
          const mult    = 1 + upgLvl * 0.05 * (1 + ascTier * 0.5)
          const s       = item.stats ?? {}
          eqAtk += (s.atk ?? 0) * mult
          eqDef += (s.def ?? 0) * mult
          eqHp  += (s.hp  ?? 0) * mult
        }
      }
    }
  } catch { /* seguro — sem equip não quebra o fluxo */ }

  const totalAtk = baseAtk + eqAtk
  const totalHp  = baseHp  + eqHp
  const totalDef = baseDef + eqDef

  const critMult = 1 + (critChance / 100) * (critDmg / 100)
  const dps      = (totalAtk / baseSpd) * critMult

  // Sobrevivência (HP × bônus de DEF)
  const surv     = totalHp * (1 + totalDef / 300)

  // Multiplicador de realm (exponencial — cada 4 níveis de realm = 1.5×)
  const realmLvl  = realmLevelPower(char.realm, char.realm_stage)
  const realmMult = Math.max(1, Math.pow(1.5, realmLvl / 4))

  return Math.round(Math.sqrt(dps * surv) * realmMult)
}
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

  const { rows: [char] } = await pool.query<CharPowerRow & { id: number; hp_current: number }>(
    `SELECT id, hp_current, strength, agility, vitality, defense, perception, luck,
            realm, realm_stage, inventory
     FROM characters WHERE id=$1 AND user_id=$2`,
    [charId, userId]
  )
  if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })
  if ((char.hp_current ?? 0) <= 0) {
    return res.status(403).json({ error: 'Personagem não pode combater com HP zerado.' })
  }

  const { rows: [biomeRow] } = await pool.query<{ id: string; target_power: number }>(
    'SELECT id, target_power FROM game_biomes WHERE id=$1', [biomeId]
  )
  if (!biomeRow) return res.status(400).json({ error: 'Bioma inválido.' })

  // Calcula poder real do personagem e escala do bioma
  let powerScale = 1.0
  const targetPower = biomeRow.target_power ?? 0
  if (targetPower > 0) {
    let scaleMin = 0.4, scaleMax = 1.5
    try {
      const { rows: scaleCfg } = await pool.query<{ value: string }>(
        "SELECT value FROM game_settings WHERE key='combat_scale_config'"
      )
      if (scaleCfg.length) {
        const cfg = JSON.parse(scaleCfg[0].value)
        scaleMin = cfg.scaleMin ?? scaleMin
        scaleMax = cfg.scaleMax ?? scaleMax
      }
    } catch {}
    const playerPower = await calculatePlayerPower(char)
    const ratio       = playerPower / targetPower
    powerScale        = Math.min(scaleMax, Math.max(scaleMin, Math.sqrt(ratio)))
  }

  // Invalidate any existing session for this character before issuing a new one
  for (const [token, s] of combatSessions) {
    if (s.charId === charId && s.userId === userId) combatSessions.delete(token)
  }

  // Verifica território da seita do jogador neste bioma
  let territoryBonus = 0
  try {
    const { rows: terrRows } = await pool.query<{ drop_bonus_pct: number }>(
      `SELECT st.drop_bonus_pct FROM sect_territories st
       JOIN sect_members sm ON sm.sect_id = st.sect_id
       JOIN characters c ON c.user_id = sm.user_id
       WHERE c.id=$1 AND st.biome_id=$2 AND st.expires_at > NOW()`,
      [charId, biomeId]
    )
    if (terrRows.length) territoryBonus = terrRows[0].drop_bonus_pct
  } catch {}

  const sessionToken = randomUUID()
  combatSessions.set(sessionToken, { charId, userId, biomeId, startedAt: Date.now(), killCount: 0, lastResolveAt: 0, powerScale, territoryBonus })

  return res.json({ sessionToken, powerScale, territoryBonus })
})

// ── Game logic — mirrors src/utils/combat.ts rollDrops ────────────────────────

// Retorna Set de receita_* permitidos para a classe, ou null se sem restrição
async function buildClassRecipeFilter(
  client: { query: <T extends Record<string,unknown>>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }> },
  classId: string | null,
  allDropItemIds: Set<string>,
): Promise<Set<string> | null> {
  if (!classId) return null

  const recipeItemIds = [...allDropItemIds].filter(id => id.startsWith('receita_'))
  if (recipeItemIds.length === 0) return null

  const { rows: [cls] } = await client.query<{ allowed_weapon_type: string; allowed_armor_type: string; allowed_accessory_type: string }>(
    'SELECT allowed_weapon_type, allowed_armor_type, allowed_accessory_type FROM game_classes WHERE id=$1',
    [classId]
  )
  if (!cls) return null

  const recipeIds = recipeItemIds.map(id => id.replace(/^receita_/, ''))
  const { rows: recipeRows } = await client.query<{ id: string; output_item_id: string }>(
    'SELECT id, output_item_id FROM game_recipes WHERE id = ANY($1)',
    [recipeIds]
  )
  const recipeToOutput = new Map(recipeRows.map(r => [r.id, r.output_item_id]))

  const outputIds = [...new Set(recipeRows.map(r => r.output_item_id))]
  const { rows: outputItems } = await client.query<{ id: string; type: string; subtype: string | null }>(
    'SELECT id, type, subtype FROM game_items WHERE id = ANY($1)',
    [outputIds]
  )
  const outputMap = new Map(outputItems.map(i => [i.id, i]))

  const allowed = new Set<string>()
  for (const recipeItemId of recipeItemIds) {
    const recipeId  = recipeItemId.replace(/^receita_/, '')
    const outputId  = recipeToOutput.get(recipeId)
    if (!outputId) continue
    const out = outputMap.get(outputId)
    if (!out) { allowed.add(recipeItemId); continue }

    // Itens não-equipáveis (material, pílula etc.) sempre podem dropar
    if (!['weapon', 'armor', 'accessory'].includes(out.type) || !out.subtype) {
      allowed.add(recipeItemId); continue
    }

    const ok =
      (out.type === 'weapon'    && out.subtype === cls.allowed_weapon_type)   ||
      (out.type === 'armor'     && out.subtype === cls.allowed_armor_type)    ||
      (out.type === 'accessory' && out.subtype === cls.allowed_accessory_type)
    if (ok) allowed.add(recipeItemId)
  }
  return allowed
}

const MAX_KILLS_PER_SECOND = 4
const MAX_SESSION_MS       = 20 * 60 * 1000  // 20 min — janela máxima aceita do cliente
const HARD_KILL_CAP        = 500             // teto absoluto por request, independente do tempo
const VALID_RARITIES       = new Set(['common', 'uncommon', 'spiritual', 'rare', 'ancient', 'legendary'])

function rollDropsServer(dropTable: DropEntry[], luck = 0, dropMult = 1.0): { itemId: string; quantity: number }[] {
  const bonusRolls    = Math.floor(luck / 50)
  const partialChance = (luck % 50) / 50
  const luckChance    = Math.min(0.5, luck * 0.004)
  const luckQtyMult   = 1 + luck * 0.01

  const rollOnce = () =>
    (dropTable ?? []).reduce<{ itemId: string; quantity: number }[]>((acc, e) => {
      if (Math.random() < Math.min(1, (e.chance + luckChance) * dropMult)) {
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
  const { biomeId, kills, elapsedMs, totalAttacks = 0, hitsReceived = 0, sessionToken } = req.body as {
    biomeId: string
    kills: KillRecord[]
    elapsedMs: number
    totalAttacks?: number
    hitsReceived?: number
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

  // Cap baseado em tempo REAL medido no servidor — ignora elapsedMs do cliente para evitar inflate
  const windowStart = session.lastResolveAt > 0 ? session.lastResolveAt : session.startedAt
  const serverElapsed = Math.min(Date.now() - windowStart, MAX_SESSION_MS)
  const timeBasedCap = Math.max(1, Math.ceil((serverElapsed / 1000) * MAX_KILLS_PER_SECOND))
  const capped = sanitizedKills.slice(0, Math.min(timeBasedCap, HARD_KILL_CAP))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [char] } = await client.query<{
      id: number; luck: number; spirit_gold: number; total_kills: number
      inventory: Inv | null; bestiary: BestiaryBlob | null; qi_current: number; qi_max: number
      auto_dismantle_items: string[]; unlocked_recipes: string[]; class_id: string | null
    }>(
      `SELECT id, luck, spirit_gold, total_kills, inventory, bestiary, qi_current, qi_max, auto_dismantle_items, unlocked_recipes, class_id
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
      const { rows: itemRows } = await client.query<{ id: string; stackable: boolean; type: string }>(
        `SELECT id, stackable, type FROM game_items WHERE id = ANY($1)`,
        [[...allDropItemIds]]
      )
      const STACK_TYPES = new Set(['material', 'pill', 'talisman', 'receita'])
      for (const r of itemRows) stackMap.set(r.id, r.stackable || STACK_TYPES.has(r.type))
    }

    // Receitas permitidas para a classe do player (null = sem filtro)
    const allowedRecipeItems = await buildClassRecipeFilter(client, char.class_id, allDropItemIds)

    // Work on copies of inventory + bestiary
    const INITIAL_RING: InvItem = { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }
    const charEq = char.inventory?.equipped as Equipped | undefined
    const inv: Inv = char.inventory
      ? {
          items:    [...((char.inventory.items ?? []) as InvItem[])],
          equipped: {
            weapon:    charEq?.weapon    ?? null,
            armor:     charEq?.armor     ?? null,
            accessory: charEq?.accessory ?? null,
            ring:      charEq?.ring      ?? INITIAL_RING,
            talisman:  charEq?.talisman  ?? null,
          },
          maxSlots: char.inventory.maxSlots ?? 30,
        }
      : {
          items:    [INITIAL_RING],
          equipped: { weapon: null, armor: null, accessory: null, ring: INITIAL_RING, talisman: null },
          maxSlots: 30,
        }
    const bestiary: BestiaryBlob = {
      entries:         { ...(char.bestiary?.entries ?? {}) },
      discoveredItems: [...(char.bestiary?.discoveredItems ?? [])],
    }

    let totalGold = 0
    let totalQi   = 0
    const allDrops: { itemId: string; quantity: number }[] = []
    const unlockedRecipes = new Set<string>(Array.isArray(char.unlocked_recipes) ? char.unlocked_recipes : [])

    let dropMult = 1.0
    try {
      const { rows: rateRows } = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='rates_config'")
      if (rateRows.length) {
        const cfg = JSON.parse(rateRows[0].value)
        if (typeof cfg.drop_rate_multiplier === 'number') dropMult = cfg.drop_rate_multiplier
      }
    } catch { /* usa padrão */ }

    for (const kill of safeKills) {
      const mon = monMap.get(kill.monsterId)
      if (!mon) continue

      const territoryLuck = (session.territoryBonus ?? 0) > 0
        ? (char.luck ?? 0) + Math.floor((session.territoryBonus / 100) * 50)
        : (char.luck ?? 0)
      const drops = rollDropsServer(mon.drop_table ?? [], territoryLuck, dropMult)

      for (const d of drops) {
        // Receitas: filtros de classe, duplicata e já aprendida
        if (d.itemId.startsWith('receita_')) {
          if (allowedRecipeItems !== null && !allowedRecipeItems.has(d.itemId)) continue
          const recipeId = d.itemId.replace(/^receita_/, '')
          if (unlockedRecipes.has(recipeId)) continue
          if (inv.items.some(i => i.definitionId === d.itemId)) continue
        }

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

    // Weapon: degrades per player attack (0.1/attack); armor: per hit received (0.5/hit)
    const wep = inv.equipped.weapon
    const arm = inv.equipped.armor
    if (wep && typeof wep.durability === 'number') {
      const cappedAtk = Math.min(Number(totalAttacks), safeKills.length * 30)
      const wepLoss = cappedAtk > 0 ? cappedAtk * 0.1 : safeKills.length
      inv.equipped.weapon = { ...wep, durability: Math.max(0, wep.durability - wepLoss) }
    }
    if (arm && typeof arm.durability === 'number') {
      const cappedHits = Math.min(Number(hitsReceived), safeKills.length * 30)
      const armorLoss  = cappedHits * 0.5
      inv.equipped.armor = { ...arm, durability: Math.max(0, arm.durability - armorLoss) }
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

    // Aplica powerScale nas recompensas (escala suave via sqrt)
    const scale     = session.powerScale ?? 1.0
    const scaledQi  = Math.round(totalQi   * scale)
    const scaledGold = Math.round(totalGold * scale)

    const newGold  = Number(char.spirit_gold ?? 0) + scaledGold
    const newKills = (char.total_kills  ?? 0) + safeKills.length
    const newQi    = Math.min((char.qi_current ?? 0) + scaledQi, char.qi_max ?? Infinity)

    // ── Auto-dismantle: remove itens configurados e converte em materiais ───
    const autoList: string[] = Array.isArray(char.auto_dismantle_items) ? char.auto_dismantle_items : []
    if (autoList.length > 0) {
      try {
        const RECIPE_DISMANTLE: Record<number, {itemId:string;quantity:number}[]> = {
          1:[{itemId:'bone_fragment',quantity:1}],
          2:[{itemId:'beast_scale',quantity:1}],
          3:[{itemId:'spiritual_feather',quantity:1}],
          4:[{itemId:'mystic_scale',quantity:1}],
          5:[{itemId:'core_fragment',quantity:1}],
          6:[{itemId:'soul_fragment',quantity:1}],
          7:[{itemId:'king_scale',quantity:1}],
          8:[{itemId:'imperial_fragment',quantity:1}],
          9:[{itemId:'sacred_feather',quantity:1}],
          10:[{itemId:'dao_fragment',quantity:1}],
        }
        const toDismantle = inv.items.filter((i: any) => autoList.includes(i.definitionId))
        if (toDismantle.length > 0) {
          const defIds = [...new Set(toDismantle.map((i: any) => i.definitionId))]
          const { rows: defs } = await client.query<{id:string;tier:number}>(
            'SELECT id, tier FROM game_items WHERE id = ANY($1)', [defIds]
          )
          const tierMap = new Map(defs.map(d=>[d.id,d.tier]))
          // Remove os itens do inventário e coleta materiais a retornar
          const matTotals: Record<string,number> = {}
          inv.items = (inv.items as any[]).filter((i: any) => {
            if (!autoList.includes(i.definitionId)) return true
            const tier = tierMap.get(i.definitionId) ?? 1
            const mats = RECIPE_DISMANTLE[Math.min(tier,10)] ?? [{itemId:'bone_fragment',quantity:1}]
            const qty = i.quantity ?? 1
            for (const m of mats) matTotals[m.itemId] = (matTotals[m.itemId]??0) + m.quantity * qty
            return false
          })
          // Adiciona materiais recuperados
          for (const [matId, qty] of Object.entries(matTotals)) {
            const ex = (inv.items as any[]).find((i: any) => i.definitionId === matId)
            if (ex) ex.quantity = (ex.quantity??0) + qty
            else (inv.items as any[]).push({instanceId:`${matId}-auto-${Date.now()}`,definitionId:matId,quantity:qty,obtainedAt:Date.now()})
          }
        }
      } catch { /* auto-dismantle falha silenciosamente */ }
    }

    await client.query(
      `UPDATE characters
       SET spirit_gold=$1, total_kills=$2, inventory=$3, bestiary=$4, qi_current=$5, last_played_at=NOW()
       WHERE id=$6`,
      [newGold, newKills, JSON.stringify(inv), JSON.stringify(bestiary), newQi, charId]
    )

    // Contribui % do Qi ganho ao coletivo da seita
    if (scaledQi > 0) {
      try {
        const { rows: cfg } = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='sect_config'")
        const pct: number = cfg.length ? (JSON.parse(cfg[0].value).qiContributionPct ?? 1) : 1
        const contribution = Math.floor(scaledQi * pct / 100)
        if (contribution > 0) {
          // Busca sect_id do usuário via sect_members
          const { rows: memberRows } = await client.query<{ sect_id: number }>(
            'SELECT sm.sect_id FROM sect_members sm JOIN characters c ON c.user_id = sm.user_id WHERE c.id=$1',
            [charId]
          )
          if (memberRows.length) {
            const sectId = memberRows[0].sect_id
            // Atualiza Qi coletivo e verifica upgrade de tier
            await client.query(`
              UPDATE sects SET collective_qi = collective_qi + $1, updated_at = NOW()
              WHERE id = $2`, [contribution, sectId])
            await client.query(`
              UPDATE sect_members sm SET contribution = contribution + $1
              FROM characters c WHERE c.user_id = sm.user_id AND c.id = $2 AND sm.sect_id = $3`,
              [contribution, charId, sectId])
            const { rows: updTier } = await client.query<{ tier: number }>(`
              WITH tiers(tier, threshold, bonus) AS (VALUES (2,500000,10),(3,5000000,20),(4,50000000,35))
              UPDATE sects s SET tier = t_new.tier
              FROM (
                SELECT MAX(t.tier) AS tier FROM tiers t, sects s2
                WHERE s2.id = $1 AND t.threshold <= s2.collective_qi
              ) t_new
              WHERE s.id = $1 AND t_new.tier > s.tier
              RETURNING s.tier`, [sectId])
            if (updTier.length) {
              const bonusMap: Record<number,number> = {1:5,2:10,3:20,4:35}
              const newBonus = bonusMap[updTier[0].tier] ?? 5
              const { rows: membRows } = await client.query<{ user_id: number }>(
                'SELECT user_id FROM sect_members WHERE sect_id=$1', [sectId])
              for (const m of membRows) {
                await client.query('UPDATE characters SET sect_qi_bonus_pct=$1 WHERE user_id=$2', [newBonus, m.user_id])
              }
            }
            // Tracking de missões de kills e pontos de guerra
            if (safeKills.length > 0) {
              const { rows: memberRows2 } = await client.query<{ user_id: number }>(
                'SELECT sm.user_id FROM sect_members sm JOIN characters c ON c.user_id = sm.user_id WHERE c.id=$1',
                [charId]
              )
              if (memberRows2.length) {
                await updateMissionProgress(client, sectId, 'kills', safeKills.length, memberRows2[0].user_id)
              }
              await client.query(`
                UPDATE sect_wars
                SET attacker_points = CASE WHEN attacker_sect_id=$1 THEN attacker_points+$2 ELSE attacker_points END,
                    defender_points = CASE WHEN defender_sect_id=$1 THEN defender_points+$2 ELSE defender_points END
                WHERE (attacker_sect_id=$1 OR defender_sect_id=$1) AND resolved=FALSE AND ends_at>NOW()
              `, [sectId, safeKills.length])
            }
          }
        }
      } catch { /* não quebra o combate se falhar */ }
    }

    await client.query('COMMIT')
    session.killCount += safeKills.length
    session.lastResolveAt = Date.now()
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
