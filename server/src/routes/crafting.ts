import { Router, type Request, type Response } from 'express'
import type { PoolClient } from 'pg'
import { pool } from '../db'

const router = Router({ mergeParams: true })
type P = { id: string }

// ── Types ─────────────────────────────────────────────────────────────────────

type IngCost   = { itemId: string; quantity: number }
type InvItem   = { instanceId: string; definitionId: string; quantity: number; durability?: number; obtainedAt: number; upgradeLevel?: number; ascensionTier?: number }
type Equipped  = { weapon: InvItem|null; armor: InvItem|null; accessory: InvItem|null; ring: InvItem|null }
type Inv       = { items: InvItem[]; equipped: Equipped; maxSlots: number }
type SkillEnt  = { id: string; level: number; xp: number; xpToNext: number; [k: string]: unknown }
type SkillsBlob = { data?: SkillEnt[]; meditationEndsAt?: number; activeBuffs?: unknown[] }
type ForgeConfig = { upgrade?: Record<string, { level: number; materials: IngCost[]; failChance: number }[]>; ascension?: { tier: number; materials: IngCost[]; sacrificeCount: number; failChance?: number }[]; enhancementGoldBase?: number; enhancementGoldLevelMult?: number; enhancementGoldTierMult?: number; durabilityAscensionBonus?: number }
type DismantleCfg = { baseRate: number; maxRate: number; levelBonus: number; fallbackItemId: string; fallbackQtyPerTier: number; upgradeRecovery?: number; ascensionRecovery?: number }
type SkillXpCfg  = { baseXp: number; multiplier: number }
type CraftXpCfg  = { forja?: number[]; alquimia?: number[]; inscricao?: number[]; tierLevels?: number[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_UPGRADE_LEVEL       = 15
const MIN_UPGRADE_FOR_ASCENSION = 5
const MAX_ASC_BY_TIER: Record<number, number> = { 1:1, 2:2, 3:2, 4:3, 5:3, 6:4, 7:4, 8:5, 9:5, 10:5 }
const DUR_TYPES    = new Set(['weapon', 'armor', 'accessory'])
const STACKABLE    = new Set(['material', 'pill', 'talisman'])
const SKILL_ID: Record<string, string> = { forja: 'forging', alquimia: 'alchemy', inscricao: 'inscription' }

const DEFAULT_DISMANTLE: DismantleCfg = { baseRate: 0.40, maxRate: 0.70, levelBonus: 0.006, fallbackItemId: 'spiritual_essence', fallbackQtyPerTier: 2, upgradeRecovery: 0.80, ascensionRecovery: 0.80 }
const DEFAULT_SKILL_XP: SkillXpCfg   = { baseXp: 50, multiplier: 1.3 }
const GOLD_BASE  = 25, GOLD_LVL = 1.5, GOLD_TIER = 0.3

// ── Pure game-logic (mirrors client utils) ────────────────────────────────────

function makeId(d: string) { return `${d}-${Date.now()}-${Math.random().toString(36).slice(2,8)}` }

function skillLevelToTier(level: number, tierLevels?: number[]): number {
  if (tierLevels?.length) { for (let i = tierLevels.length-1; i >= 0; i--) { if (level >= tierLevels[i]) return i+1 } return 1 }
  return Math.min(10, Math.max(1, Math.ceil(level / 10)))
}

function craftFailChance(pt: number, rt: number, luck = 0): number {
  const d = rt - pt; if (d <= 0) return 0
  return Math.max(0, Math.round(Math.min(90, d*30) - luck*0.5))
}

function craftQualityBonus(pt: number, rt: number, luck = 0): number {
  return pt - rt >= 2 ? Math.floor((pt - rt) / 2) : 0
}

function craftGoldCost(tier: number): number { return Math.round(15 * Math.pow(2.1, Math.max(1,tier)-1)) }

function calcXpForLevel(level: number, cfg: SkillXpCfg): number { return Math.floor(cfg.baseXp * Math.pow(cfg.multiplier, level-1)) }

function applySkillXp(skills: SkillEnt[], skillId: string, amount: number, cfg: SkillXpCfg): SkillEnt[] {
  return skills.map(sk => {
    if (sk.id !== skillId) return sk
    let { xp, level } = sk; xp += amount
    let needed = calcXpForLevel(level, cfg)
    while (xp >= needed && level < 99) { xp -= needed; level++; needed = calcXpForLevel(level, cfg) }
    return { ...sk, xp, level, xpToNext: needed }
  })
}

function totalOf(items: InvItem[], defId: string): number {
  return items.filter(i => i.definitionId === defId).reduce((s, i) => s + i.quantity, 0)
}

function consumeFrom(inv: Inv, defId: string, qty: number): void {
  let rem = qty
  for (const it of inv.items) {
    if (rem <= 0) break
    if (it.definitionId !== defId) continue
    const take = Math.min(rem, it.quantity); it.quantity -= take; rem -= take
  }
  inv.items = inv.items.filter(it => it.quantity > 0)
}

function addToInv(inv: Inv, defId: string, qty: number, stackable: boolean, maxStack: number, itemType: string): void {
  if (stackable) {
    let rem = qty
    for (const it of inv.items) {
      if (rem <= 0) break
      if (it.definitionId !== defId || it.quantity >= maxStack) continue
      const add = Math.min(rem, maxStack - it.quantity); it.quantity += add; rem -= add
    }
    while (rem > 0 && inv.items.length < inv.maxSlots) {
      const add = Math.min(rem, maxStack)
      inv.items.push({ instanceId: makeId(defId), definitionId: defId, quantity: add, obtainedAt: Date.now() }); rem -= add
    }
  } else {
    for (let i = 0; i < qty && inv.items.length < inv.maxSlots; i++) {
      const it: InvItem = { instanceId: makeId(defId), definitionId: defId, quantity: 1, obtainedAt: Date.now() }
      if (DUR_TYPES.has(itemType)) it.durability = 100
      inv.items.push(it)
    }
  }
}

function parseSkillsBlob(raw: unknown): { skills: SkillEnt[]; rest: Omit<SkillsBlob,'data'> } {
  if (Array.isArray(raw)) return { skills: raw as SkillEnt[], rest: {} }
  const b = (raw ?? {}) as SkillsBlob
  return { skills: b.data ?? [], rest: { meditationEndsAt: b.meditationEndsAt, activeBuffs: b.activeBuffs } }
}

const FALLBACK_RING: InvItem = { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }

function invFromChar(raw: Inv | null): Inv {
  const eq = raw?.equipped
  return {
    items:    [...((raw?.items ?? []) as InvItem[])],
    equipped: {
      weapon:    eq?.weapon    ?? null,
      armor:     eq?.armor     ?? null,
      accessory: eq?.accessory ?? null,
      ring:      eq?.ring      ?? FALLBACK_RING,
    },
    maxSlots: raw?.maxSlots ?? 30,
  }
}

// Forge helpers
function getTierRows(cfg: ForgeConfig|undefined, tier: number) {
  if (!cfg?.upgrade || Array.isArray(cfg.upgrade)) return null
  const rows = cfg.upgrade[String(tier)]; return Array.isArray(rows) ? rows : null
}
function enhCost(tgt: number, tier: number, cfg?: ForgeConfig): IngCost[] {
  const rows = getTierRows(cfg, tier); if (rows) { const e = rows.find(u => u.level===tgt); if (e) return e.materials } return []
}
function enhFail(tgt: number, tier: number, cfg?: ForgeConfig): number {
  const rows = getTierRows(cfg, tier); if (rows) { const e = rows.find(u => u.level===tgt); if (e !== undefined) return e.failChance }
  if (tgt <= 5) return 0; return Math.min(50, (tgt-5)*5)
}
function enhGold(tgt: number, tier: number, cfg?: ForgeConfig): number {
  const base = cfg?.enhancementGoldBase ?? GOLD_BASE, lm = cfg?.enhancementGoldLevelMult ?? GOLD_LVL, tm = cfg?.enhancementGoldTierMult ?? GOLD_TIER
  return Math.round(Math.round(base * Math.pow(lm, Math.max(1,tgt)-1)) * (1 + (Math.max(1,tier)-1)*tm))
}
function ascCost(cur: number, cfg?: ForgeConfig): { materials: IngCost[]; sacrificeCount: number; failChance: number } {
  if (cfg?.ascension) { const e = cfg.ascension.find(a => a.tier===cur); if (e) return { materials: e.materials, sacrificeCount: e.sacrificeCount, failChance: e.failChance ?? 0 } }
  return { materials: [], sacrificeCount: cur+1, failChance: 0 }
}
function ascGold(cur: number, itemTier: number): number {
  return Math.round(300 * Math.pow(2.5, cur) * (1 + (Math.max(1,itemTier)-1)*0.25))
}
function maxDur(upg: number, asc = 0, bonus = 0.5): number { return Math.round(100 * Math.pow(1 + bonus, asc)) + upg * 10 }
function repairCostFn(curDur: number, upg: number, ings?: IngCost[]): IngCost[] {
  const md = maxDur(upg); if (curDur >= md) return []
  const pct = (md - curDur) / md
  if (ings?.length) return ings.map(c => ({ itemId: c.itemId, quantity: Math.max(1, Math.ceil(pct * c.quantity * 0.5)) }))
  const tier = Math.floor(upg/5)
  const costs: IngCost[] = [{ itemId: 'bone_fragment', quantity: Math.max(1, Math.ceil(pct*10*(tier+1))) }]
  if (tier >= 1) costs.push({ itemId: 'qi_crystal',        quantity: Math.max(1, Math.ceil(pct*3)) })
  if (tier >= 2) costs.push({ itemId: 'spiritual_essence', quantity: Math.max(1, Math.ceil(pct*2)) })
  if (tier >= 3) costs.push({ itemId: 'mystic_crystal',    quantity: Math.max(1, Math.ceil(pct*1)) })
  return costs
}
function calcDismantleRecovery(
  item: InvItem, forgeLevel: number, cfg: DismantleCfg, forgeCfg: ForgeConfig|undefined,
  itemTier: number, recipeIngs?: IngCost[],
): Record<string,number> {
  const rate = Math.min(cfg.maxRate, cfg.baseRate + forgeLevel * cfg.levelBonus)
  const agg: Record<string,number> = {}
  const add = (id: string, qty: number) => { if (qty > 0) agg[id] = (agg[id] ?? 0) + qty }
  if (recipeIngs?.length) { for (const ing of recipeIngs) add(ing.itemId, Math.max(1, Math.ceil(ing.quantity * rate))) }
  else { add(cfg.fallbackItemId, Math.max(1, Math.ceil(cfg.fallbackQtyPerTier * itemTier * rate))) }
  const upgLvl = item.upgradeLevel ?? 0, ascTier = item.ascensionTier ?? 0
  const upR = cfg.upgradeRecovery ?? DEFAULT_DISMANTLE.upgradeRecovery!, ascR = cfg.ascensionRecovery ?? DEFAULT_DISMANTLE.ascensionRecovery!
  if (upgLvl > 0 && upR > 0) { for (let l = 1; l <= upgLvl; l++) for (const c of enhCost(l, itemTier, forgeCfg)) add(c.itemId, Math.round(c.quantity * upR)) }
  if (ascTier > 0 && ascR > 0) { for (let t = 0; t < ascTier; t++) for (const c of ascCost(t, forgeCfg).materials) add(c.itemId, Math.round(c.quantity * ascR)) }
  return agg
}

async function loadSettings(client: PoolClient, keys: string[]): Promise<Record<string,unknown>> {
  const { rows } = await client.query<{ key: string; value: string }>(
    'SELECT key, value FROM game_settings WHERE key = ANY($1)', [keys]
  )
  const res: Record<string,unknown> = {}
  for (const r of rows) { try { res[r.key] = JSON.parse(r.value) } catch { res[r.key] = r.value } }
  return res
}

// ── POST /craft ───────────────────────────────────────────────────────────────

router.post('/craft', async (req: Request<P>, res: Response) => {
  const client = await pool.connect()
  try {
    const { recipeId, quantity } = req.body as { recipeId?: unknown; quantity?: unknown }
    const qty = Math.max(1, Math.min(999, Number(quantity) || 1))
    if (!recipeId || typeof recipeId !== 'string') return res.status(400).json({ error: 'recipeId obrigatório.' })

    await client.query('BEGIN')

    const { rows: charRows } = await client.query<{ inventory: Inv|null; skills: unknown; spirit_gold: number; luck: number }>(
      'SELECT inventory, skills, spirit_gold, luck FROM characters WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = charRows[0]

    const { rows: recipeRows } = await client.query<{ id: string; category: string; output_item_id: string; output_quantity: number; required_tier: number; ingredients: IngCost[] }>(
      'SELECT id, category, output_item_id, output_quantity, required_tier, ingredients FROM game_recipes WHERE id = $1 AND active = true',
      [recipeId]
    )
    if (!recipeRows.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Receita não encontrada.' }) }
    const recipe = recipeRows[0]

    const { rows: itemRows } = await client.query<{ type: string; tier: number; stackable: boolean; max_stack: number|null }>(
      'SELECT type, tier, stackable, max_stack FROM game_items WHERE id = $1', [recipe.output_item_id]
    )
    if (!itemRows.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item não encontrado.' }) }
    const outDef = itemRows[0]

    const settings   = await loadSettings(client, ['craft_xp_config', 'skill_xp_config', 'stack_config'])
    const craftXpCfg = (settings.craft_xp_config ?? {}) as CraftXpCfg
    const skillXpCfg = (settings.skill_xp_config ?? DEFAULT_SKILL_XP) as SkillXpCfg
    const stackCfg   = (settings.stack_config ?? {}) as Record<string,number>

    const skillId = SKILL_ID[recipe.category] ?? 'forging'
    const { skills: skillArr, rest: skillRest } = parseSkillsBlob(char.skills)
    const skill      = skillArr.find(s => s.id === skillId)
    const playerTier = skillLevelToTier(skill?.level ?? 1, craftXpCfg.tierLevels)
    const luck       = Number(char.luck ?? 0)
    const failPct    = craftFailChance(playerTier, recipe.required_tier, luck)
    const qualBonus  = craftQualityBonus(playerTier, recipe.required_tier, luck)

    const inv  = invFromChar(char.inventory)
    const ings = recipe.ingredients ?? []

    for (const ing of ings) {
      if (totalOf(inv.items, ing.itemId) < ing.quantity * qty) {
        await client.query('ROLLBACK'); return res.status(400).json({ error: 'Materiais insuficientes.' })
      }
    }
    const goldTotal = craftGoldCost(outDef.tier) * qty
    if (char.spirit_gold < goldTotal) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Ouro insuficiente.' }) }

    const outStackable = STACKABLE.has(outDef.type)
    const outMaxStack  = outDef.max_stack ?? (stackCfg[outDef.type] ?? 9999)
    const tierIdx      = Math.max(0, (recipe.required_tier ?? 1) - 1)
    const cat          = recipe.category as keyof Pick<CraftXpCfg, 'forja'|'alquimia'|'inscricao'>
    const xpOk  = craftXpCfg[cat]?.[tierIdx] ?? 25
    const xpFail = Math.max(1, Math.round(xpOk * 0.4))

    let skills = [...skillArr]
    // Garante que a skill alvo exista no array (personagens antigos podem não tê-la)
    if (!skills.some(s => s.id === skillId)) {
      skills.push({ id: skillId, level: 1, xp: 0, xpToNext: calcXpForLevel(1, skillXpCfg) } as SkillEnt)
    }
    const results: { success: boolean; bonus?: number }[] = []

    for (let i = 0; i < qty; i++) {
      for (const ing of ings) consumeFrom(inv, ing.itemId, ing.quantity)
      if (failPct > 0 && Math.random() * 100 < failPct) {
        skills = applySkillXp(skills, skillId, xpFail, skillXpCfg)
        results.push({ success: false }); continue
      }
      const luckExtra = luck > 0 && Math.random() * 100 < luck * 1.5 ? 1 : 0
      const bonus = qualBonus + luckExtra
      addToInv(inv, recipe.output_item_id, recipe.output_quantity + bonus, outStackable, outMaxStack, outDef.type)
      skills = applySkillXp(skills, skillId, xpOk, skillXpCfg)
      results.push({ success: true, bonus })
    }

    const newGold    = char.spirit_gold - goldTotal
    const skillsBlob = { ...skillRest, data: skills }
    await client.query(
      'UPDATE characters SET inventory=$1, skills=$2, spirit_gold=$3 WHERE id=$4 AND user_id=$5',
      [JSON.stringify(inv), JSON.stringify(skillsBlob), newGold, req.params.id, req.userId]
    )
    await client.query('COMMIT')
    return res.json({ inventory: inv, skills: skillsBlob, spirit_gold: newGold, results })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao craftar.' })
  } finally { client.release() }
})

// ── POST /forge/upgrade ───────────────────────────────────────────────────────

router.post('/forge/upgrade', async (req: Request<P>, res: Response) => {
  const client = await pool.connect()
  try {
    const { instanceId } = req.body as { instanceId?: unknown }
    if (!instanceId || typeof instanceId !== 'string') return res.status(400).json({ error: 'instanceId obrigatório.' })

    await client.query('BEGIN')

    const { rows: charRows } = await client.query<{ inventory: Inv|null; spirit_gold: number }>(
      'SELECT inventory, spirit_gold FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = charRows[0]
    const inv  = invFromChar(char.inventory)

    const item = inv.items.find(i => i.instanceId === instanceId)
    if (!item) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item não encontrado.' }) }

    const current = item.upgradeLevel ?? 0
    if (current >= MAX_UPGRADE_LEVEL) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Nível máximo atingido.' }) }
    const target = current + 1

    const { rows: defRows } = await client.query<{ tier: number }>('SELECT tier FROM game_items WHERE id=$1', [item.definitionId])
    const itemTier = defRows[0]?.tier ?? 1

    const settings = await loadSettings(client, ['forge_config'])
    const forgeCfg = (settings.forge_config ?? undefined) as ForgeConfig|undefined

    const costs = enhCost(target, itemTier, forgeCfg)
    const fail  = enhFail(target, itemTier, forgeCfg)
    const gold  = enhGold(target, itemTier, forgeCfg)

    for (const c of costs) {
      if (totalOf(inv.items, c.itemId) < c.quantity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Materiais insuficientes.' }) }
    }
    if (char.spirit_gold < gold) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Ouro insuficiente.' }) }

    for (const c of costs) consumeFrom(inv, c.itemId, c.quantity)
    const newGold = char.spirit_gold - gold

    const success = fail <= 0 || Math.random() * 100 >= fail
    if (success) {
      const newDur = item.durability !== undefined ? maxDur(target, item.ascensionTier ?? 0, forgeCfg?.durabilityAscensionBonus ?? 0.5) : undefined
      const updated: InvItem = { ...item, upgradeLevel: target, ...(newDur !== undefined && { durability: newDur }) }
      inv.items = inv.items.map(i => i.instanceId === instanceId ? updated : i)
      const eq = inv.equipped as Record<string, InvItem|null>
      for (const k of Object.keys(eq)) { if (eq[k]?.instanceId === instanceId) eq[k] = updated }
    }

    await client.query('UPDATE characters SET inventory=$1, spirit_gold=$2 WHERE id=$3 AND user_id=$4',
      [JSON.stringify(inv), newGold, req.params.id, req.userId])
    await client.query('COMMIT')
    return res.json({ inventory: inv, spirit_gold: newGold, success })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao aprimorar.' })
  } finally { client.release() }
})

// ── POST /forge/ascend ────────────────────────────────────────────────────────

router.post('/forge/ascend', async (req: Request<P>, res: Response) => {
  const client = await pool.connect()
  try {
    const { mainId, sacrificeIds } = req.body as { mainId?: unknown; sacrificeIds?: unknown }
    if (!mainId || typeof mainId !== 'string') return res.status(400).json({ error: 'mainId obrigatório.' })
    if (!Array.isArray(sacrificeIds) || sacrificeIds.some(s => typeof s !== 'string')) return res.status(400).json({ error: 'sacrificeIds inválido.' })
    const sacIds = sacrificeIds as string[]

    await client.query('BEGIN')

    const { rows: charRows } = await client.query<{ inventory: Inv|null; spirit_gold: number }>(
      'SELECT inventory, spirit_gold FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = charRows[0]
    const inv  = invFromChar(char.inventory)

    const item = inv.items.find(i => i.instanceId === mainId)
    if (!item) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item principal não encontrado.' }) }

    if ((item.upgradeLevel ?? 0) < MIN_UPGRADE_FOR_ASCENSION) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: `Requer aprimoramento mínimo +${MIN_UPGRADE_FOR_ASCENSION}.` })
    }

    const { rows: defRows } = await client.query<{ tier: number }>('SELECT tier FROM game_items WHERE id=$1', [item.definitionId])
    const itemTier = defRows[0]?.tier ?? 1
    const curTier  = item.ascensionTier ?? 0
    const maxAsc   = MAX_ASC_BY_TIER[itemTier] ?? 5

    if (curTier >= maxAsc) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Teto de ascensão atingido (máx. ${maxAsc}×).` }) }

    const settings = await loadSettings(client, ['forge_config'])
    const forgeCfg = (settings.forge_config ?? undefined) as ForgeConfig|undefined
    const { materials, sacrificeCount, failChance } = ascCost(curTier, forgeCfg)
    const goldCost = ascGold(curTier, itemTier)

    if (sacIds.length !== sacrificeCount) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Precisa de ${sacrificeCount} sacrifício(s).` }) }

    for (const sacId of sacIds) {
      if (sacId === mainId) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item não pode ser sacrificado por si mesmo.' }) }
      const sac = inv.items.find(i => i.instanceId === sacId)
      if (!sac || sac.definitionId !== item.definitionId || (sac.ascensionTier ?? 0) !== curTier) {
        await client.query('ROLLBACK'); return res.status(400).json({ error: 'Sacrifício inválido.' })
      }
    }

    for (const m of materials) {
      if (totalOf(inv.items, m.itemId) < m.quantity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Materiais insuficientes.' }) }
    }
    if (char.spirit_gold < goldCost) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Ouro insuficiente.' }) }

    for (const m of materials) consumeFrom(inv, m.itemId, m.quantity)
    const newGold = char.spirit_gold - goldCost

    // Remove sacrifices (deequip first)
    const sacSet = new Set(sacIds)
    const eq = inv.equipped as Record<string, InvItem|null>
    for (const k of Object.keys(eq)) { if (eq[k] && sacSet.has(eq[k]!.instanceId)) eq[k] = null }
    inv.items = inv.items.filter(i => !sacSet.has(i.instanceId))

    const success = failChance <= 0 || Math.random() * 100 >= failChance
    if (success) {
      const updated: InvItem = { ...item, ascensionTier: curTier+1, upgradeLevel: 0, ...(item.durability !== undefined && { durability: maxDur(0, curTier+1, forgeCfg?.durabilityAscensionBonus ?? 0.5) }) }
      inv.items = inv.items.map(i => i.instanceId === mainId ? updated : i)
      for (const k of Object.keys(eq)) { if (eq[k]?.instanceId === mainId) eq[k] = updated }
    }

    await client.query('UPDATE characters SET inventory=$1, spirit_gold=$2 WHERE id=$3 AND user_id=$4',
      [JSON.stringify(inv), newGold, req.params.id, req.userId])
    await client.query('COMMIT')
    return res.json({ inventory: inv, spirit_gold: newGold, success, reason: !success ? `A ascensão falhou! (${failChance}% de chance)` : undefined })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao ascender.' })
  } finally { client.release() }
})

// ── POST /dismantle ───────────────────────────────────────────────────────────

router.post('/dismantle', async (req: Request<P>, res: Response) => {
  const client = await pool.connect()
  try {
    const { instanceIds } = req.body as { instanceIds?: unknown }
    if (!Array.isArray(instanceIds) || !instanceIds.length || instanceIds.some(i => typeof i !== 'string')) {
      return res.status(400).json({ error: 'instanceIds deve ser array não-vazio de strings.' })
    }
    const ids = instanceIds as string[]

    await client.query('BEGIN')

    const { rows: charRows } = await client.query<{ inventory: Inv|null; skills: unknown }>(
      'SELECT inventory, skills FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const char = charRows[0]
    const inv  = invFromChar(char.inventory)

    const equippedIds = new Set(Object.values(inv.equipped).filter(Boolean).map(e => e!.instanceId))
    const toDismantle: InvItem[] = []
    for (const id of ids) {
      if (equippedIds.has(id)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Não é possível desmontar itens equipados.' }) }
      const it = inv.items.find(i => i.instanceId === id)
      if (!it) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Item ${id} não encontrado.` }) }
      toDismantle.push(it)
    }

    const { skills: skillArr } = parseSkillsBlob(char.skills)
    const forgeLevel = skillArr.find(s => s.id === 'forging')?.level ?? 1

    const settings    = await loadSettings(client, ['forge_config', 'dismantle_config'])
    const forgeCfg    = (settings.forge_config    ?? undefined)       as ForgeConfig|undefined
    const dismantleCfg = (settings.dismantle_config ?? DEFAULT_DISMANTLE) as DismantleCfg

    const defIds = [...new Set(toDismantle.map(i => i.definitionId))]
    const { rows: defRows } = await client.query<{ id: string; tier: number }>(
      'SELECT id, tier FROM game_items WHERE id = ANY($1)', [defIds]
    )
    const tierMap = new Map(defRows.map(r => [r.id, r.tier]))

    const { rows: recipeRows } = await client.query<{ output_item_id: string; ingredients: IngCost[] }>(
      'SELECT output_item_id, ingredients FROM game_recipes WHERE output_item_id = ANY($1) AND active = true', [defIds]
    )
    const recipeMap = new Map(recipeRows.map(r => [r.output_item_id, r.ingredients]))

    const total: Record<string,number> = {}
    for (const item of toDismantle) {
      const tier = tierMap.get(item.definitionId) ?? 1
      const rec  = calcDismantleRecovery(item, forgeLevel, dismantleCfg, forgeCfg, tier, recipeMap.get(item.definitionId))
      for (const [id, qty] of Object.entries(rec)) { total[id] = (total[id] ?? 0) + qty }
    }

    const idSet = new Set(ids)
    inv.items = inv.items.filter(i => !idSet.has(i.instanceId))
    for (const [defId, qty] of Object.entries(total)) addToInv(inv, defId, qty, true, 9999, 'material')

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2 AND user_id=$3',
      [JSON.stringify(inv), req.params.id, req.userId])
    await client.query('COMMIT')
    return res.json({ inventory: inv, recovered: Object.entries(total).map(([itemId, quantity]) => ({ itemId, quantity })) })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao desmontar.' })
  } finally { client.release() }
})

// ── POST /discard ─────────────────────────────────────────────────────────────

router.post('/discard', async (req: Request<P>, res: Response) => {
  const { instanceId, quantity } = req.body as { instanceId?: unknown; quantity?: unknown }
  if (!instanceId || typeof instanceId !== 'string') {
    return res.status(400).json({ error: 'instanceId obrigatório.' })
  }

  const qty = Math.max(1, Math.floor(Number(quantity) || 1))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query<{ inventory: Inv|null }>(
      'SELECT inventory FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }

    const inv  = invFromChar(rows[0].inventory)
    const item = inv.items.find(i => i.instanceId === instanceId)
    if (!item) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Item não encontrado.' })
    }

    const equippedIds = new Set(Object.values(inv.equipped).filter(Boolean).map(e => e!.instanceId))
    if (equippedIds.has(instanceId)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Não é possível descartar itens equipados.' })
    }

    if (item.quantity <= qty) {
      inv.items = inv.items.filter(i => i.instanceId !== instanceId)
    } else {
      inv.items = inv.items.map(i => i.instanceId === instanceId ? { ...i, quantity: i.quantity - qty } : i)
    }

    await client.query(
      'UPDATE characters SET inventory=$1 WHERE id=$2 AND user_id=$3',
      [JSON.stringify(inv), req.params.id, req.userId]
    )
    await client.query('COMMIT')
    return res.json({ inventory: inv })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[discard]', err)
    return res.status(500).json({ error: 'Erro ao descartar.' })
  } finally { client.release() }
})

// ── POST /repair ──────────────────────────────────────────────────────────────

router.post('/repair', async (req: Request<P>, res: Response) => {
  const client = await pool.connect()
  try {
    const { instanceId } = req.body as { instanceId?: unknown }
    if (!instanceId || typeof instanceId !== 'string') return res.status(400).json({ error: 'instanceId obrigatório.' })

    await client.query('BEGIN')

    const { rows: charRows } = await client.query<{ inventory: Inv|null }>(
      'SELECT inventory FROM characters WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!charRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }
    const inv = invFromChar(charRows[0].inventory)

    const item = inv.items.find(i => i.instanceId === instanceId)
    if (!item || item.durability === undefined) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item inválido.' }) }

    const upg = item.upgradeLevel ?? 0
    const asc = item.ascensionTier ?? 0
    const repairSettings = await loadSettings(client, ['forge_config'])
    const repairForgeCfg = (repairSettings.forge_config ?? undefined) as ForgeConfig|undefined
    const durBonus = repairForgeCfg?.durabilityAscensionBonus ?? 0.5
    const md  = maxDur(upg, asc, durBonus)
    if (item.durability >= md) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Durabilidade já completa.' }) }

    const { rows: recipeRows } = await client.query<{ ingredients: IngCost[] }>(
      'SELECT ingredients FROM game_recipes WHERE output_item_id=$1 AND active=true LIMIT 1', [item.definitionId]
    )
    const costs = repairCostFn(item.durability, upg, recipeRows[0]?.ingredients)

    for (const c of costs) {
      if (totalOf(inv.items, c.itemId) < c.quantity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Materiais insuficientes.' }) }
    }
    for (const c of costs) consumeFrom(inv, c.itemId, c.quantity)

    const updated: InvItem = { ...item, durability: md }
    inv.items = inv.items.map(i => i.instanceId === instanceId ? updated : i)
    const eq  = inv.equipped as Record<string, InvItem|null>
    for (const k of Object.keys(eq)) { if (eq[k]?.instanceId === instanceId) eq[k] = updated }

    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2 AND user_id=$3',
      [JSON.stringify(inv), req.params.id, req.userId])
    await client.query('COMMIT')
    return res.json({ inventory: inv })
  } catch (err) {
    await client.query('ROLLBACK'); console.error(err)
    return res.status(500).json({ error: 'Erro ao reparar.' })
  } finally { client.release() }
})

export default router
