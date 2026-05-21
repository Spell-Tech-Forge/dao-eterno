import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'

const router = Router()
router.use(requireAuth)
router.use(requireAdmin)

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// ═══════════════════════════════════════════════════════════════
//  ITENS
// ═══════════════════════════════════════════════════════════════

router.get('/items', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_items ORDER BY type, name')
  res.json(rows)
})

router.post('/items', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const id = (b.id as string | undefined)?.trim() || slugify(b.name as string)
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_items (id, name, emoji, type, rarity, description, stats, stackable, max_stack, tier, sprite_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, b.name, b.emoji || '📦', b.type, b.rarity || 'common',
       b.description || '', b.stats || {}, b.stackable || false,
       b.max_stack != null ? Number(b.max_stack) : null,
       b.tier ?? 1, b.sprite_url || null]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar item.'
    res.status(400).json({ error: msg })
  }
})

router.put('/items/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_items SET name=$1,emoji=$2,type=$3,rarity=$4,description=$5,
     stats=$6,stackable=$7,active=$8,sprite_url=$9,tier=$10,max_stack=$11,updated_at=NOW()
     WHERE id=$12 RETURNING *`,
    [b.name, b.emoji, b.type, b.rarity, b.description,
     b.stats || {}, b.stackable || false, b.active !== false,
     b.sprite_url ?? null, b.tier ?? 1,
     b.max_stack != null ? Number(b.max_stack) : null,
     req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Item não encontrado.' })
  res.json(rows[0])
})

router.delete('/items/:id', async (req, res) => {
  await pool.query('DELETE FROM game_items WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// Seed: recebe array de itens do frontend e faz upsert
router.post('/items/seed', async (req, res) => {
  const items = req.body as Record<string, unknown>[]
  let count = 0
  for (const item of items) {
    await pool.query(
      `INSERT INTO game_items (id,name,emoji,type,rarity,description,stats,stackable,tier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, emoji=$3, type=$4, rarity=$5, description=$6,
         stats=$7, stackable=$8, tier=$9, updated_at=NOW()`,
      [item.id, item.name, item.emoji || '📦', item.type, item.rarity || 'common',
       item.description || '', item.stats || {}, item.stackable || false, item.tier ?? 1]
    )
    count++
  }
  res.json({ inserted: count })
})

// ═══════════════════════════════════════════════════════════════
//  MONSTROS
// ═══════════════════════════════════════════════════════════════

router.get('/monsters', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_monsters ORDER BY biome_id, level_min')
  res.json(rows)
})

router.post('/monsters', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const id = (b.id as string | undefined)?.trim() || slugify(b.name as string)
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_monsters
       (id,name,emoji,level_min,level_max,rarity,biome_id,is_boss,
        base_hp,base_atk,base_def,speed,qi_reward,gold_reward_min,gold_reward_max,drop_table,sprite_url,required_realm)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [id, b.name, b.emoji || '👾', b.level_min || 1, b.level_max || 5,
       b.rarity || 'common', b.biome_id, b.is_boss || false,
       b.base_hp || 50, b.base_atk || 5, b.base_def || 1, b.speed || 1.5,
       b.qi_reward || 10, b.gold_reward_min || 1, b.gold_reward_max || 5,
       JSON.stringify(b.drop_table || []), b.sprite_url || null,
       b.required_realm || 'qi_refining']
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar monstro.'
    res.status(400).json({ error: msg })
  }
})

router.put('/monsters/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_monsters SET
     name=$1,emoji=$2,level_min=$3,level_max=$4,rarity=$5,biome_id=$6,is_boss=$7,is_elite=$8,
     base_hp=$9,base_atk=$10,base_def=$11,speed=$12,qi_reward=$13,
     gold_reward_min=$14,gold_reward_max=$15,drop_table=$16,active=$17,
     sprite_url=$18,required_realm=$19,updated_at=NOW()
     WHERE id=$20 RETURNING *`,
    [b.name, b.emoji, b.level_min, b.level_max, b.rarity, b.biome_id, b.is_boss, b.is_elite ?? false,
     b.base_hp, b.base_atk, b.base_def, b.speed, b.qi_reward,
     b.gold_reward_min, b.gold_reward_max, JSON.stringify(b.drop_table || []),
     b.active !== false, b.sprite_url ?? null,
     b.required_realm || 'qi_refining', req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Monstro não encontrado.' })
  res.json(rows[0])
})

router.delete('/monsters/:id', async (req, res) => {
  await pool.query('DELETE FROM game_monsters WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

router.post('/monsters/seed', async (req, res) => {
  const monsters = req.body as Record<string, unknown>[]
  let count = 0
  for (const m of monsters) {
    await pool.query(
      `INSERT INTO game_monsters
       (id,name,emoji,level_min,level_max,rarity,biome_id,is_boss,
        base_hp,base_atk,base_def,speed,qi_reward,gold_reward_min,gold_reward_max,drop_table,required_realm,is_elite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, emoji=$3, level_min=$4, level_max=$5, rarity=$6,
         biome_id=$7, is_boss=$8, base_hp=$9, base_atk=$10, base_def=$11,
         speed=$12, qi_reward=$13, gold_reward_min=$14, gold_reward_max=$15,
         drop_table=$16, required_realm=$17, is_elite=$18, updated_at=NOW()`,
      [m.id, m.name, m.emoji || '👾', m.level_min || 1, m.level_max || 5,
       m.rarity || 'common', m.biome_id, m.is_boss || false,
       m.base_hp || 50, m.base_atk || 5, m.base_def || 1, m.speed || 1.5,
       m.qi_reward || 10, m.gold_reward_min || 1, m.gold_reward_max || 5,
       JSON.stringify(m.drop_table || []), m.required_realm || 'qi_refining',
       m.is_elite || false]
    )
    count++
  }
  res.json({ inserted: count })
})

// ═══════════════════════════════════════════════════════════════
//  RECEITAS
// ═══════════════════════════════════════════════════════════════

router.get('/recipes', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_recipes ORDER BY category, required_tier, name')
  res.json(rows)
})

router.post('/recipes', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const id = (b.id as string | undefined)?.trim() || slugify(b.name as string)
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_recipes (id,name,category,output_item_id,output_quantity,required_tier,ingredients)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, b.name, b.category || 'forja', b.output_item_id, b.output_quantity || 1,
       b.required_tier || 1, JSON.stringify(b.ingredients || [])]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar receita.'
    res.status(400).json({ error: msg })
  }
})

router.put('/recipes/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_recipes SET
     name=$1,category=$2,output_item_id=$3,output_quantity=$4,
     required_tier=$5,ingredients=$6,active=$7,updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [b.name, b.category, b.output_item_id, b.output_quantity,
     b.required_tier, JSON.stringify(b.ingredients || []),
     b.active !== false, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Receita não encontrada.' })
  res.json(rows[0])
})

router.delete('/recipes/:id', async (req, res) => {
  await pool.query('DELETE FROM game_recipes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

router.post('/recipes/seed', async (req, res) => {
  const recipes = req.body as Record<string, unknown>[]
  let count = 0
  for (const r of recipes) {
    await pool.query(
      `INSERT INTO game_recipes (id,name,category,output_item_id,output_quantity,required_tier,ingredients)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, category=$3, output_item_id=$4, output_quantity=$5,
         required_tier=$6, ingredients=$7, updated_at=NOW()`,
      [r.id, r.name, r.category || 'forja', r.output_item_id, r.output_quantity || 1,
       r.required_tier || 1, JSON.stringify(r.ingredients || [])]
    )
    count++
  }
  res.json({ inserted: count })
})

// Configurações do jogo (admin)
router.get('/settings', async (_req, res) => {
  const result = await pool.query<{ key: string; value: string }>('SELECT key, value FROM game_settings')
  const settings: Record<string, string> = {}
  result.rows.forEach(r => { settings[r.key] = r.value })
  res.json(settings)
})

router.put('/settings', async (req, res) => {
  const allowed = new Set([
    'item_sprite_size', 'monster_sprite_size', 'material_sprite_size',
    'item_card_size', 'item_badge_size',
    'equip_card_width', 'equip_card_height',
    'equip_text_size', 'equip_btn_size', 'equip_btn_icons',
    'frame_slice', 'frame_width',
    'combat_monster_size', 'combat_player_size', 'combat_arena_height', 'combat_arena_blur',
    'frame_common_url', 'frame_uncommon_url', 'frame_spiritual_url',
    'frame_rare_url', 'frame_ancient_url', 'frame_legendary_url',
    'character_sprite_male_url', 'character_sprite_female_url',
    'character_sprite_male_meditation_url', 'character_sprite_female_meditation_url',
  ])
  const entries = Object.entries(req.body as Record<string, string>).filter(([k]) => allowed.has(k))
  if (!entries.length) return res.status(400).json({ error: 'Nenhuma configuração válida.' })
  await Promise.all(entries.map(([k, v]) =>
    pool.query('INSERT INTO game_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2', [k, v])
  ))
  return res.json({ ok: true })
})

// Mapa público de sprites — usado pelo jogo para substituir emojis
// Não precisa de admin, só de auth
router.get('/sprites', async (_req, res) => {
  const [items, monsters] = await Promise.all([
    pool.query<{ id: string; sprite_url: string }>('SELECT id, sprite_url FROM game_items WHERE sprite_url IS NOT NULL'),
    pool.query<{ id: string; sprite_url: string }>('SELECT id, sprite_url FROM game_monsters WHERE sprite_url IS NOT NULL'),
  ])
  const result = {
    items:    Object.fromEntries(items.rows.map(r => [r.id, r.sprite_url])),
    monsters: Object.fromEntries(monsters.rows.map(r => [r.id, r.sprite_url])),
  }
  res.json(result)
})

// ═══════════════════════════════════════════════════════════════
//  BIOMAS
// ═══════════════════════════════════════════════════════════════

router.get('/biomes', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_biomes ORDER BY sort_order, id')
  res.json(rows)
})

router.post('/biomes', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const id = (b.id as string | undefined)?.trim() || slugify(b.name as string)
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_biomes
       (id,name,description,required_realm,required_stage,difficulty,biome_type,
        active_days,active_start_time,active_end_time,active_until,
        enemy_pool,boss_id,elite_id,min_kills_boss,min_kills_elite,boss_spawn_chance,
        rarity_weights,boss_rarity,gradient,accent_color,sort_order,background_url,background_position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
      [
        id, b.name, b.description ?? '', b.required_realm ?? 'qi_refining', b.required_stage ?? 'initial',
        b.difficulty ?? 1, b.biome_type ?? 'fixed',
        JSON.stringify(b.active_days ?? [0,1,2,3,4,5,6]),
        b.active_start_time ?? null, b.active_end_time ?? null, b.active_until ?? null,
        JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null, b.elite_id ?? null,
        b.min_kills_boss ?? 25, b.min_kills_elite ?? 15, b.boss_spawn_chance ?? 0.20,
        JSON.stringify(b.rarity_weights ?? {}), b.boss_rarity ?? 'rare',
        b.gradient ?? 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
        b.accent_color ?? '#4a9e7f', b.sort_order ?? 0, b.background_url ?? null,
        b.background_position ?? null,
      ]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar bioma.' })
  }
})

router.put('/biomes/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_biomes SET
     name=$1,description=$2,required_realm=$3,required_stage=$4,difficulty=$5,
     biome_type=$6,active_days=$7,active_start_time=$8,active_end_time=$9,active_until=$10,
     enemy_pool=$11,boss_id=$12,elite_id=$13,min_kills_boss=$14,min_kills_elite=$15,boss_spawn_chance=$16,
     rarity_weights=$17,boss_rarity=$18,gradient=$19,accent_color=$20,
     sort_order=$21,active=$22,background_url=$23,background_position=$24,updated_at=NOW()
     WHERE id=$25 RETURNING *`,
    [
      b.name, b.description ?? '', b.required_realm, b.required_stage,
      b.difficulty ?? 1, b.biome_type ?? 'fixed',
      JSON.stringify(b.active_days ?? [0,1,2,3,4,5,6]),
      b.active_start_time ?? null, b.active_end_time ?? null, b.active_until ?? null,
      JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null, b.elite_id ?? null,
      b.min_kills_boss ?? 25, b.min_kills_elite ?? 15, b.boss_spawn_chance ?? 0.20,
      JSON.stringify(b.rarity_weights ?? {}), b.boss_rarity ?? 'rare',
      b.gradient, b.accent_color, b.sort_order ?? 0,
      b.active !== false, b.background_url ?? null, b.background_position ?? null,
      req.params.id,
    ]
  )
  if (!rows.length) return res.status(404).json({ error: 'Bioma não encontrado.' })
  res.json(rows[0])
})

router.delete('/biomes/:id', async (req, res) => {
  await pool.query('DELETE FROM game_biomes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

router.post('/biomes/seed', async (req, res) => {
  const biomes = req.body as Record<string, unknown>[]
  let count = 0
  for (const b of biomes) {
    await pool.query(
      `INSERT INTO game_biomes
       (id,name,description,required_realm,required_stage,difficulty,biome_type,
        enemy_pool,boss_id,elite_id,min_kills_boss,min_kills_elite,boss_spawn_chance,rarity_weights,
        boss_rarity,gradient,accent_color,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, description=$3, required_realm=$4, required_stage=$5,
         difficulty=$6, biome_type=$7, enemy_pool=$8, boss_id=$9,
         elite_id=$10, min_kills_boss=$11, min_kills_elite=$12, boss_spawn_chance=$13,
         rarity_weights=$14, boss_rarity=$15, gradient=$16, accent_color=$17, sort_order=$18`,
      [
        b.id, b.name, b.description ?? '', b.required_realm ?? 'qi_refining',
        b.required_stage ?? 'initial', b.difficulty ?? 1, b.biome_type ?? 'fixed',
        JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null, b.elite_id ?? null,
        b.min_kills_boss ?? 25, b.min_kills_elite ?? 15, b.boss_spawn_chance ?? 0.20,
        JSON.stringify(b.rarity_weights ?? {}), b.boss_rarity ?? 'rare',
        b.gradient ?? 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
        b.accent_color ?? '#4a9e7f', b.sort_order ?? 0,
      ]
    )
    count++
  }
  res.json({ inserted: count })
})

// ═══════════════════════════════════════════════════════════════
//  BREAKTHROUGHS
// ═══════════════════════════════════════════════════════════════

router.get('/breakthroughs', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_breakthroughs ORDER BY realm, stage')
  res.json(rows)
})

router.put('/breakthroughs/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_breakthroughs SET
     next_realm=$1,next_stage=$2,new_max_qi=$3,required_items=$4,active=$5,updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [b.next_realm, b.next_stage, b.new_max_qi, JSON.stringify(b.required_items ?? []),
     b.active !== false, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Breakthrough não encontrado.' })
  res.json(rows[0])
})

router.post('/breakthroughs/seed', async (req, res) => {
  const entries = req.body as Record<string, unknown>[]
  let count = 0
  for (const e of entries) {
    await pool.query(
      `INSERT INTO game_breakthroughs (id,realm,stage,next_realm,next_stage,new_max_qi,required_items)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [e.id, e.realm, e.stage, e.next_realm, e.next_stage, e.new_max_qi,
       JSON.stringify(e.required_items ?? [])]
    )
    count++
  }
  res.json({ inserted: count })
})

// ═══════════════════════════════════════════════════════════════
//  CRAFT XP CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CRAFT_XP_CONFIG = {
  forja:     [10, 25, 50, 90, 140, 200, 280, 380, 520, 700],
  alquimia:  [12, 30, 60, 110, 160, 230, 320, 430, 580, 750],
  inscricao: [8,  20, 40, 70,  110, 160, 230, 310, 420, 580],
}

router.get('/craft-xp-config', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM game_settings WHERE key='craft_xp_config'"
  )
  if (!rows.length) return res.json(DEFAULT_CRAFT_XP_CONFIG)
  try {
    return res.json(JSON.parse(rows[0].value))
  } catch {
    return res.json(DEFAULT_CRAFT_XP_CONFIG)
  }
})

router.post('/craft-xp-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('craft_xp_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  FORGE CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_FORGE_CONFIG = {
  upgrade: [
    { level: 1,  materials: [], failChance: 0  },
    { level: 2,  materials: [], failChance: 0  },
    { level: 3,  materials: [], failChance: 0  },
    { level: 4,  materials: [], failChance: 0  },
    { level: 5,  materials: [], failChance: 0  },
    { level: 6,  materials: [], failChance: 10 },
    { level: 7,  materials: [], failChance: 15 },
    { level: 8,  materials: [], failChance: 20 },
    { level: 9,  materials: [], failChance: 25 },
    { level: 10, materials: [], failChance: 30 },
    { level: 11, materials: [], failChance: 35 },
    { level: 12, materials: [], failChance: 40 },
    { level: 13, materials: [], failChance: 45 },
    { level: 14, materials: [], failChance: 48 },
    { level: 15, materials: [], failChance: 50 },
  ],
  ascension: [
    { tier: 0, materials: [], sacrificeCount: 1 },
    { tier: 1, materials: [], sacrificeCount: 2 },
    { tier: 2, materials: [], sacrificeCount: 3 },
    { tier: 3, materials: [], sacrificeCount: 4 },
    { tier: 4, materials: [], sacrificeCount: 5 },
  ],
}

router.get('/forge-config', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM game_settings WHERE key='forge_config'"
  )
  if (!rows.length) return res.json(DEFAULT_FORGE_CONFIG)
  try {
    return res.json(JSON.parse(rows[0].value))
  } catch {
    return res.json(DEFAULT_FORGE_CONFIG)
  }
})

router.post('/forge-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('forge_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

// ── Stat Config ────────────────────────────────────────────────────
const DEFAULT_STAT_CONFIG = {
  atkPerStr: 4, baseSpeed: 2.0, speedPerAgi: 0.03, minAgiSpeed: 0.5,
  hpPerVit: 20, defPerDef: 3, critPerPer: 0.5,
  weaponSpeedDiv: 200, minAttackSpeed: 0.25,
  initialStrength: 5, initialAgility: 5, initialVitality: 5,
  initialDefense: 3, initialPerception: 3,
  attrPointsPerBreakthrough: 3,
}

router.get('/stat-config', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM game_settings WHERE key='stat_config'"
  )
  if (!rows.length) return res.json(DEFAULT_STAT_CONFIG)
  try { return res.json(JSON.parse(rows[0].value)) }
  catch { return res.json(DEFAULT_STAT_CONFIG) }
})

router.post('/stat-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('stat_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

const DEFAULT_DISMANTLE_CONFIG = {
  baseRate: 0.80, maxRate: 0.95, levelBonus: 0.006,
  fallbackItemId: 'spiritual_essence', fallbackQtyPerTier: 2,
  upgradeRecovery: 0.80, ascensionRecovery: 0.80,
}

router.get('/dismantle-config', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM game_settings WHERE key='dismantle_config'"
  )
  if (!rows.length) return res.json(DEFAULT_DISMANTLE_CONFIG)
  try { return res.json({ ...DEFAULT_DISMANTLE_CONFIG, ...JSON.parse(rows[0].value) }) }
  catch { return res.json(DEFAULT_DISMANTLE_CONFIG) }
})

router.post('/dismantle-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('dismantle_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

// Stats gerais para o dashboard
router.get('/stats', async (_req, res) => {
  const [items, monsters, recipes, biomes, breakthroughs] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM game_items'),
    pool.query('SELECT COUNT(*) FROM game_monsters'),
    pool.query('SELECT COUNT(*) FROM game_recipes'),
    pool.query('SELECT COUNT(*) FROM game_biomes'),
    pool.query('SELECT COUNT(*) FROM game_breakthroughs'),
  ])
  res.json({
    items:         parseInt(items.rows[0].count),
    monsters:      parseInt(monsters.rows[0].count),
    recipes:       parseInt(recipes.rows[0].count),
    biomes:        parseInt(biomes.rows[0].count),
    breakthroughs: parseInt(breakthroughs.rows[0].count),
  })
})

// ═══════════════════════════════════════════════════════════════
//  GESTÃO DE JOGADORES
// ═══════════════════════════════════════════════════════════════

router.get('/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.username, u.email, u.is_admin, u.created_at,
        u.banned_at, u.ban_reason,
        c.id          AS char_id,
        c.name        AS char_name,
        c.realm, c.realm_stage, c.realm_level,
        c.cultivation_power, c.spirit_gold,
        c.strength, c.agility, c.vitality, c.defense, c.perception, c.luck,
        c.hp_current, c.hp_max, c.qi_current, c.qi_max,
        c.last_played_at, c.created_at AS char_created_at
      FROM users u
      LEFT JOIN characters c ON c.user_id = u.id
      ORDER BY u.created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao listar usuários.' })
  }
})

router.get('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const [userRes, charRes, legendRes] = await Promise.all([
      pool.query(
        'SELECT id, username, email, is_admin, created_at, banned_at, ban_reason, pending_gold FROM users WHERE id = $1',
        [userId]
      ),
      pool.query('SELECT * FROM characters WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM legends WHERE user_id = $1 ORDER BY died_at DESC', [userId]),
    ])
    if (!userRes.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' })
    res.json({ user: userRes.rows[0], characters: charRes.rows, legends: legendRes.rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao buscar detalhes do usuário.' })
  }
})

router.delete('/users/:userId/character', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM characters WHERE user_id = $1',
      [req.params.userId]
    )
    res.json({ ok: true, deleted: rowCount ?? 0 })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao deletar personagem.' })
  }
})

router.post('/users/:userId/ban', async (req, res) => {
  try {
    const { reason } = req.body as { reason?: string }
    await pool.query(
      'UPDATE users SET banned_at = NOW(), ban_reason = $1 WHERE id = $2',
      [(reason ?? '').trim() || 'Violação dos termos de uso.', req.params.userId]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao banir usuário.' })
  }
})

router.post('/users/:userId/unban', async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = $1',
      [req.params.userId]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao desbanir usuário.' })
  }
})

// ═══════════════════════════════════════════════════════════════
//  GESTÃO DO MERCADO
// ═══════════════════════════════════════════════════════════════

router.get('/market-listings', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ml.id, ml.seller_name, ml.item_def_id, ml.item_data,
        ml.quantity, ml.price, ml.listed_at, ml.seller_dead,
        u.username AS seller_username, u.banned_at IS NOT NULL AS seller_banned
      FROM market_listings ml
      LEFT JOIN users u ON u.id = ml.seller_id
      WHERE ml.active = true
      ORDER BY ml.seller_dead DESC, ml.listed_at ASC
    `)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao listar.' })
  }
})

router.delete('/market-listings/:listingId', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE market_listings SET active = false WHERE id = $1 AND active = true',
      [req.params.listingId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Listagem não encontrada ou já removida.' })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao remover listagem.' })
  }
})

// ═══════════════════════════════════════════════════════════════
//  FILTRO DE PALAVRAS
// ═══════════════════════════════════════════════════════════════

router.get('/banned-words', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>(
      "SELECT value FROM game_settings WHERE key='banned_words'"
    )
    const words: string[] = rows.length ? JSON.parse(rows[0].value) : []
    res.json(words)
  } catch { res.json([]) }
})

router.post('/banned-words', async (req, res) => {
  try {
    const words = (req.body as { words?: unknown }).words
    if (!Array.isArray(words)) return res.status(400).json({ error: 'Esperado array de palavras.' })
    const clean = [...new Set(
      words.map(w => String(w).trim().toLowerCase()).filter(w => w.length > 0)
    )]
    await pool.query(
      "INSERT INTO game_settings (key,value) VALUES ('banned_words',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [JSON.stringify(clean)]
    )
    res.json({ ok: true, count: clean.length })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro.' })
  }
})

// ═══════════════════════════════════════════════════════════════
//  GESTÃO DE INVENTÁRIO (por personagem)
// ═══════════════════════════════════════════════════════════════

router.get('/inventory/:charId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, inventory, spirit_gold FROM characters WHERE id = $1',
      [req.params.charId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    res.json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao buscar inventário.' })
  }
})

router.post('/inventory/:charId/add', async (req, res) => {
  try {
    const { definitionId, quantity = 1 } = req.body as { definitionId: string; quantity?: number }
    if (!definitionId) return res.status(400).json({ error: 'definitionId obrigatório.' })

    const [charRes, itemRes] = await Promise.all([
      pool.query<{ inventory: Record<string, unknown> }>('SELECT inventory FROM characters WHERE id = $1', [req.params.charId]),
      pool.query<{ stackable: boolean }>('SELECT stackable FROM game_items WHERE id = $1', [definitionId]),
    ])
    if (!charRes.rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })
    if (!itemRes.rows.length) return res.status(404).json({ error: 'Item não encontrado.' })

    const inv = (charRes.rows[0].inventory ?? { items: [], equipped: {}, maxSlots: 30 }) as {
      items: { instanceId: string; definitionId: string; quantity: number; obtainedAt: number }[]
      equipped: Record<string, unknown>
      maxSlots: number
    }
    const isStackable = itemRes.rows[0].stackable
    const items = inv.items ?? []

    if (isStackable) {
      const existing = items.find(i => i.definitionId === definitionId)
      if (existing) {
        existing.quantity += quantity
      } else {
        items.push({ instanceId: `${definitionId}-adm-${Date.now()}`, definitionId, quantity, obtainedAt: Date.now() })
      }
    } else {
      items.push({ instanceId: `${definitionId}-adm-${Date.now()}-${Math.random().toString(36).slice(2)}`, definitionId, quantity: 1, obtainedAt: Date.now() })
    }
    inv.items = items

    await pool.query('UPDATE characters SET inventory = $1 WHERE id = $2', [JSON.stringify(inv), req.params.charId])
    res.json({ ok: true, inventory: inv })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao adicionar item.' })
  }
})

router.delete('/inventory/:charId/item/:instanceId', async (req, res) => {
  try {
    const { rows } = await pool.query<{ inventory: Record<string, unknown> }>(
      'SELECT inventory FROM characters WHERE id = $1',
      [req.params.charId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Personagem não encontrado.' })

    const inv = (rows[0].inventory ?? { items: [], equipped: {}, maxSlots: 30 }) as {
      items: { instanceId: string }[]
      equipped: Record<string, { instanceId?: string } | null>
      maxSlots: number
    }
    inv.items = inv.items.filter(i => i.instanceId !== req.params.instanceId)

    // Remove do equipado também se necessário
    for (const slot of Object.keys(inv.equipped)) {
      if (inv.equipped[slot]?.instanceId === req.params.instanceId) {
        inv.equipped[slot] = null
      }
    }

    await pool.query('UPDATE characters SET inventory = $1 WHERE id = $2', [JSON.stringify(inv), req.params.charId])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao remover item.' })
  }
})

router.patch('/inventory/:charId/gold', async (req, res) => {
  try {
    const { amount } = req.body as { amount: number }
    if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ error: 'Valor inválido.' })
    await pool.query('UPDATE characters SET spirit_gold = $1 WHERE id = $2', [amount, req.params.charId])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao atualizar ouro.' })
  }
})

// ═══════════════════════════════════════════════════════════════
//  STACK CONFIG (tamanho máximo de pilha por categoria)
// ═══════════════════════════════════════════════════════════════

router.get('/stack-config', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>(
      "SELECT value FROM game_settings WHERE key='stack_config'"
    )
    const defaults = { material: 9999, pill: 99, talisman: 99 }
    if (!rows.length) return res.json(defaults)
    try { return res.json({ ...defaults, ...JSON.parse(rows[0].value) }) }
    catch { return res.json(defaults) }
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar stack config.' })
  }
})

router.post('/stack-config', async (req, res) => {
  try {
    const value = JSON.stringify(req.body)
    await pool.query(
      "INSERT INTO game_settings (key,value) VALUES ('stack_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [value]
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar stack config.' })
  }
})

router.post('/stack-config/normalize', async (_req, res) => {
  const client = await pool.connect()
  try {
    // Carrega configurações atuais
    const [cfgRow, itemsRow, charsRow] = await Promise.all([
      client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stack_config'"),
      client.query<{ id: string; type: string; stackable: boolean; max_stack: number | null }>(
        'SELECT id, type, stackable, max_stack FROM game_items'
      ),
      client.query<{ id: number; inventory: Record<string, unknown> | null; name: string }>(
        'SELECT id, name, inventory FROM characters'
      ),
    ])

    const stackDefaults: Record<string, number> = { material: 9999, pill: 99, talisman: 99 }
    if (cfgRow.rows.length) {
      try { Object.assign(stackDefaults, JSON.parse(cfgRow.rows[0].value)) } catch {}
    }

    const itemMap = new Map(itemsRow.rows.map(r => [r.id, r]))
    const STACKABLE = new Set(['material', 'pill', 'talisman'])

    let charsUpdated = 0
    let stacksSplit  = 0
    let itemsDropped = 0

    for (const char of charsRow.rows) {
      if (!char.inventory) continue
      const inv = char.inventory as {
        items: { instanceId: string; definitionId: string; quantity: number; [k: string]: unknown }[]
        equipped: Record<string, unknown>
        maxSlots: number
      }
      if (!Array.isArray(inv.items)) continue

      const maxSlots = inv.maxSlots ?? 30
      const newItems: typeof inv.items = []
      let changed = false

      for (const item of inv.items) {
        const def = itemMap.get(item.definitionId)
        if (!def || !STACKABLE.has(def.type)) {
          newItems.push(item)
          continue
        }
        const maxStack: number = def.max_stack != null
          ? def.max_stack
          : (stackDefaults[def.type] ?? Infinity)

        if (item.quantity <= maxStack) {
          newItems.push(item)
          continue
        }

        // Precisa dividir
        changed = true
        let remaining = item.quantity
        let first = true
        while (remaining > 0) {
          const qty = Math.min(remaining, maxStack)
          if (first) {
            newItems.push({ ...item, quantity: qty })
            first = false
          } else if (newItems.length < maxSlots) {
            newItems.push({
              ...item,
              instanceId: `${item.definitionId}-norm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              quantity: qty,
            })
            stacksSplit++
          } else {
            itemsDropped += remaining
            break
          }
          remaining -= qty
        }
      }

      if (changed) {
        inv.items = newItems
        await client.query('UPDATE characters SET inventory = $1 WHERE id = $2', [JSON.stringify(inv), char.id])
        charsUpdated++
      }
    }

    res.json({ ok: true, charsUpdated, stacksSplit, itemsDropped })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao normalizar inventários.' })
  } finally {
    client.release()
  }
})

// ── Skill XP Config ────────────────────────────────────────────────
router.get('/skill-xp-config', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>(
      "SELECT value FROM game_settings WHERE key='skill_xp_config'"
    )
    const defaults = { baseXp: 50, multiplier: 1.3 }
    if (!rows.length) return res.json(defaults)
    try { return res.json({ ...defaults, ...JSON.parse(rows[0].value) }) }
    catch { return res.json(defaults) }
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar skill XP config.' })
  }
})

router.post('/skill-xp-config', async (req, res) => {
  try {
    const value = JSON.stringify(req.body)
    await pool.query(
      "INSERT INTO game_settings (key,value) VALUES ('skill_xp_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [value]
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar skill XP config.' })
  }
})

// ── Zona de Perigo ─────────────────────────────────────────────────
router.delete('/characters/all', async (_req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount: chars }   = await client.query('DELETE FROM characters')
    const { rowCount: legends } = await client.query('DELETE FROM legends')
    await client.query('COMMIT')
    res.json({ ok: true, deletedCharacters: chars ?? 0, deletedLegends: legends ?? 0 })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Erro ao deletar personagens.' })
  } finally {
    client.release()
  }
})

export default router
