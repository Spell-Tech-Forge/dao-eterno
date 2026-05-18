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
      `INSERT INTO game_items (id, name, emoji, type, rarity, description, stats, stackable, tier, sprite_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, b.name, b.emoji || '📦', b.type, b.rarity || 'common',
       b.description || '', b.stats || {}, b.stackable || false, b.tier ?? 1, b.sprite_url || null]
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
     stats=$6,stackable=$7,active=$8,sprite_url=$9,tier=$10,updated_at=NOW()
     WHERE id=$11 RETURNING *`,
    [b.name, b.emoji, b.type, b.rarity, b.description,
     b.stats || {}, b.stackable || false, b.active !== false,
     b.sprite_url ?? null, b.tier ?? 1, req.params.id]
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
       ON CONFLICT (id) DO NOTHING`,
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
     name=$1,emoji=$2,level_min=$3,level_max=$4,rarity=$5,biome_id=$6,is_boss=$7,
     base_hp=$8,base_atk=$9,base_def=$10,speed=$11,qi_reward=$12,
     gold_reward_min=$13,gold_reward_max=$14,drop_table=$15,active=$16,
     sprite_url=$17,required_realm=$18,updated_at=NOW()
     WHERE id=$19 RETURNING *`,
    [b.name, b.emoji, b.level_min, b.level_max, b.rarity, b.biome_id, b.is_boss,
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
        base_hp,base_atk,base_def,speed,qi_reward,gold_reward_min,gold_reward_max,drop_table,required_realm)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.name, m.emoji || '👾', m.level_min || 1, m.level_max || 5,
       m.rarity || 'common', m.biome_id, m.is_boss || false,
       m.base_hp || 50, m.base_atk || 5, m.base_def || 1, m.speed || 1.5,
       m.qi_reward || 10, m.gold_reward_min || 1, m.gold_reward_max || 5,
       JSON.stringify(m.drop_table || []), m.required_realm || 'qi_refining']
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
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
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
        enemy_pool,boss_id,min_kills_boss,boss_spawn_chance,
        rarity_weights,boss_rarity,gradient,accent_color,sort_order,background_url,background_position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [
        id, b.name, b.description ?? '', b.required_realm ?? 'qi_refining', b.required_stage ?? 'initial',
        b.difficulty ?? 1, b.biome_type ?? 'fixed',
        JSON.stringify(b.active_days ?? [0,1,2,3,4,5,6]),
        b.active_start_time ?? null, b.active_end_time ?? null, b.active_until ?? null,
        JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null,
        b.min_kills_boss ?? 10, b.boss_spawn_chance ?? 0.20,
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
     enemy_pool=$11,boss_id=$12,min_kills_boss=$13,boss_spawn_chance=$14,
     rarity_weights=$15,boss_rarity=$16,gradient=$17,accent_color=$18,
     sort_order=$19,active=$20,background_url=$21,background_position=$22,updated_at=NOW()
     WHERE id=$23 RETURNING *`,
    [
      b.name, b.description ?? '', b.required_realm, b.required_stage,
      b.difficulty ?? 1, b.biome_type ?? 'fixed',
      JSON.stringify(b.active_days ?? [0,1,2,3,4,5,6]),
      b.active_start_time ?? null, b.active_end_time ?? null, b.active_until ?? null,
      JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null,
      b.min_kills_boss ?? 10, b.boss_spawn_chance ?? 0.20,
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
        enemy_pool,boss_id,min_kills_boss,boss_spawn_chance,rarity_weights,
        boss_rarity,gradient,accent_color,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [
        b.id, b.name, b.description ?? '', b.required_realm ?? 'qi_refining',
        b.required_stage ?? 'initial', b.difficulty ?? 1, b.biome_type ?? 'fixed',
        JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null,
        b.min_kills_boss ?? 10, b.boss_spawn_chance ?? 0.20,
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

export default router
