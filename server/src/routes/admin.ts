import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'
import { invalidateMaintenanceCache } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireAdmin)

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// Reconstrói stats base a partir do nível de cultivo (fallback sem snapshot).
// Usa Caminho do Equilíbrio (+3 em todos por rompimento) como padrão neutro.
function computeBaseStatsFromCultivation(realm: string, stage: string) {
  const REALMS = ['qi_refining','foundation','golden_core','nascent_soul','spirit_transformation','unification','ascension','immortal']
  const STAGES = ['initial','middle','advanced','peak']
  const level = REALMS.indexOf(realm) * 4 + STAGES.indexOf(stage) + 1
  const bt = Math.max(0, level - 1)  // número de rompimentos

  const QI_MAX: Record<string, number> = {
    qi_refining_initial: 400,   qi_refining_middle: 400,      qi_refining_advanced: 800,     qi_refining_peak: 1500,
    foundation_initial: 3000,   foundation_middle: 6000,       foundation_advanced: 12000,    foundation_peak: 25000,
    golden_core_initial: 50000, golden_core_middle: 100000,    golden_core_advanced: 200000,  golden_core_peak: 400000,
    nascent_soul_initial: 800000, nascent_soul_middle: 1500000, nascent_soul_advanced: 3000000, nascent_soul_peak: 6000000,
    spirit_transformation_initial: 12000000, spirit_transformation_middle: 25000000,
    spirit_transformation_advanced: 50000000, spirit_transformation_peak: 100000000,
    unification_initial: 200000000, unification_middle: 500000000,
    unification_advanced: 1000000000, unification_peak: 2000000000,
    ascension_initial: 5000000000, ascension_middle: 10000000000,
    ascension_advanced: 25000000000, ascension_peak: 50000000000,
    immortal_initial: 100000000000,
  }

  const vit     = 5 + bt * 3
  const qi_max  = QI_MAX[`${realm}_${stage}`] ?? 400
  return {
    strength:   5 + bt * 3,
    agility:    5 + bt * 3,
    vitality:   vit,
    defense:    3 + bt * 3,
    perception: 3 + bt * 3,
    luck:       bt,  // mínimo do range aleatório (1–3 por rompimento)
    hp_max:     vit * 20,
    qi_max,
  }
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
      `INSERT INTO game_items (id, name, emoji, type, subtype, rarity, description, stats, stackable, max_stack, tier, sprite_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id, b.name, b.emoji || '📦', b.type,
       (b.subtype as string | undefined)?.trim() || null,
       b.rarity || 'common', b.description || '', b.stats || {},
       b.stackable || false,
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
    `UPDATE game_items SET name=$1,emoji=$2,type=$3,subtype=$4,rarity=$5,description=$6,
     stats=$7,stackable=$8,active=$9,sprite_url=$10,tier=$11,max_stack=$12,updated_at=NOW()
     WHERE id=$13 RETURNING *`,
    [b.name, b.emoji, b.type,
     (b.subtype as string | undefined)?.trim() || null,
     b.rarity, b.description,
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

router.delete('/items', async (_req, res) => {
  const { rowCount } = await pool.query('DELETE FROM game_items')
  res.json({ ok: true, deleted: rowCount ?? 0 })
})

// Seed: recebe array de itens do frontend e faz upsert
router.post('/items/seed', async (req, res) => {
  const items = req.body as Record<string, unknown>[]
  let count = 0
  for (const item of items) {
    await pool.query(
      `INSERT INTO game_items (id,name,emoji,type,rarity,description,stats,stackable,tier,subtype)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, emoji=$3, type=$4, rarity=$5, description=$6,
         stats=$7, stackable=$8, tier=$9, subtype=$10, updated_at=NOW()`,
      [item.id, item.name, item.emoji || '📦', item.type, item.rarity || 'common',
       item.description || '', item.stats || {}, item.stackable || false, item.tier ?? 1,
       item.subtype ?? null]
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
        base_hp,base_atk,base_def,speed,qi_reward,gold_reward_min,gold_reward_max,drop_table,sprite_url,required_realm,sprite_config)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [id, b.name, b.emoji || '👾', b.level_min || 1, b.level_max || 5,
       b.rarity || 'common', b.biome_id, b.is_boss || false,
       b.base_hp || 50, b.base_atk || 5, b.base_def || 1, b.speed || 1.5,
       b.qi_reward || 10, b.gold_reward_min || 1, b.gold_reward_max || 5,
       JSON.stringify(b.drop_table || []), b.sprite_url || null,
       b.required_realm || 'qi_refining',
       b.sprite_config ? JSON.stringify(b.sprite_config) : null]
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
     sprite_url=$18,required_realm=$19,sprite_config=$20,updated_at=NOW()
     WHERE id=$21 RETURNING *`,
    [b.name, b.emoji, b.level_min, b.level_max, b.rarity, b.biome_id, b.is_boss, b.is_elite ?? false,
     b.base_hp, b.base_atk, b.base_def, b.speed, b.qi_reward,
     b.gold_reward_min, b.gold_reward_max, JSON.stringify(b.drop_table || []),
     b.active !== false, b.sprite_url ?? null,
     b.required_realm || 'qi_refining',
     b.sprite_config ? JSON.stringify(b.sprite_config) : null,
     req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Monstro não encontrado.' })
  res.json(rows[0])
})

router.delete('/monsters/:id', async (req, res) => {
  await pool.query('DELETE FROM game_monsters WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

router.delete('/monsters', async (_req, res) => {
  const { rowCount } = await pool.query('DELETE FROM game_monsters')
  res.json({ ok: true, deleted: rowCount ?? 0 })
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

router.delete('/recipes', async (_req, res) => {
  const { rowCount } = await pool.query('DELETE FROM game_recipes')
  res.json({ ok: true, deleted: rowCount ?? 0 })
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
    'frame_divine_url', 'frame_supreme_url',
    'character_sprite_male_url', 'character_sprite_female_url',
    'character_sprite_male_meditation_url', 'character_sprite_female_meditation_url',
    'character_sprite_male_config', 'character_sprite_female_config',
    'sell_recipes_enabled',
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

router.put('/biomes/:id/modifiers', async (req, res) => {
  const mods = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_biomes SET stat_modifiers=$1, updated_at=NOW() WHERE id=$2 RETURNING stat_modifiers`,
    [JSON.stringify(mods), req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Bioma não encontrado.' })
  res.json(rows[0].stat_modifiers)
})

router.put('/biomes/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_biomes SET
     name=$1,description=$2,required_realm=$3,required_stage=$4,difficulty=$5,
     biome_type=$6,active_days=$7,active_start_time=$8,active_end_time=$9,active_until=$10,
     enemy_pool=$11,boss_id=$12,elite_id=$13,min_kills_boss=$14,min_kills_elite=$15,boss_spawn_chance=$16,
     rarity_weights=$17,boss_rarity=$18,gradient=$19,accent_color=$20,
     sort_order=$21,active=$22,background_url=$23,background_position=$24,
     location_id=$25,map_x=$26,map_y=$27,target_power=$28,updated_at=NOW()
     WHERE id=$29 RETURNING *`,
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
      b.location_id ?? null, b.map_x ?? 0, b.map_y ?? 0, b.target_power ?? 0,
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

router.delete('/biomes', async (_req, res) => {
  const { rowCount } = await pool.query('DELETE FROM game_biomes')
  res.json({ ok: true, deleted: rowCount ?? 0 })
})

router.post('/biomes/seed', async (req, res) => {
  const biomes = req.body as Record<string, unknown>[]
  let count = 0
  for (const b of biomes) {
    await pool.query(
      `INSERT INTO game_biomes
       (id,name,description,required_realm,required_stage,difficulty,biome_type,
        enemy_pool,boss_id,elite_id,min_kills_boss,min_kills_elite,boss_spawn_chance,rarity_weights,
        boss_rarity,gradient,accent_color,sort_order,location_id,map_x,map_y,target_power)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, description=$3, required_realm=$4, required_stage=$5,
         difficulty=$6, biome_type=$7, enemy_pool=$8, boss_id=$9,
         elite_id=$10, min_kills_boss=$11, min_kills_elite=$12, boss_spawn_chance=$13,
         rarity_weights=$14, boss_rarity=$15, gradient=$16, accent_color=$17, sort_order=$18,
         location_id=$19, map_x=$20, map_y=$21, target_power=$22, updated_at=NOW()`,
      [
        b.id, b.name, b.description ?? '', b.required_realm ?? 'body_tempering',
        b.required_stage ?? 'strength', b.difficulty ?? 1, b.biome_type ?? 'fixed',
        JSON.stringify(b.enemy_pool ?? []), b.boss_id ?? null, b.elite_id ?? null,
        b.min_kills_boss ?? 25, b.min_kills_elite ?? 15, b.boss_spawn_chance ?? 0.20,
        JSON.stringify(b.rarity_weights ?? {}), b.boss_rarity ?? 'rare',
        b.gradient ?? 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
        b.accent_color ?? '#4a9e7f', b.sort_order ?? 0,
        b.location_id ?? null, b.map_x ?? 0, b.map_y ?? 0, b.target_power ?? 0,
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
      `INSERT INTO game_breakthroughs (id,realm,stage,next_realm,next_stage,new_max_qi,required_items,required_kills)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         realm=$2, stage=$3, next_realm=$4, next_stage=$5,
         new_max_qi=$6, required_items=$7, required_kills=$8, updated_at=NOW()`,
      [e.id, e.realm, e.stage, e.next_realm, e.next_stage, e.new_max_qi,
       JSON.stringify(e.required_items ?? []),
       JSON.stringify(e.required_kills ?? [])]
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

const DEFAULT_COMBAT_SCALE_CONFIG = { scaleMin: 0.4, scaleMax: 1.5 }

router.get('/combat-scale-config', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='combat_scale_config'")
    if (!rows.length) return res.json(DEFAULT_COMBAT_SCALE_CONFIG)
    return res.json({ ...DEFAULT_COMBAT_SCALE_CONFIG, ...JSON.parse(rows[0].value) })
  } catch { return res.json(DEFAULT_COMBAT_SCALE_CONFIG) }
})

router.post('/combat-scale-config', async (req, res) => {
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('combat_scale_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify(req.body)]
  )
  res.json({ ok: true })
})

// ── Rates Config ───────────────────────────────────────────────────────────────
const DEFAULT_RATES_CONFIG = {
  drop_rate_multiplier: 1.0,
  qi_multiplier:        1.0,
  material_multiplier:  1.0,
}

router.get('/rates-config', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='rates_config'")
  if (!rows.length) return res.json(DEFAULT_RATES_CONFIG)
  try { return res.json({ ...DEFAULT_RATES_CONFIG, ...JSON.parse(rows[0].value) }) }
  catch { return res.json(DEFAULT_RATES_CONFIG) }
})

router.post('/rates-config', async (req, res) => {
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('rates_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify(req.body)]
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
        'SELECT id, username, email, is_admin, created_at, banned_at, ban_reason, pending_gold, extra_char_slots FROM users WHERE id = $1',
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

    // Registra adição pendente para o cliente mesclar no próximo sync
    const pendingEntry = { definitionId, quantity, obtainedAt: Date.now() }
    await pool.query(
      `UPDATE characters
         SET inventory = $1,
             pending_items = pending_items || $2::jsonb
       WHERE id = $3`,
      [JSON.stringify(inv), JSON.stringify([pendingEntry]), req.params.charId]
    )
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

// Remove itens sem definição em game_items do inventário do personagem
router.delete('/inventory/:charId/unknown-items', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [char] } = await client.query<{ inventory: Record<string,unknown> | null }>(
      'SELECT inventory FROM characters WHERE id=$1 FOR UPDATE', [req.params.charId]
    )
    if (!char) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Personagem não encontrado.' }) }

    const items: { definitionId: string }[] = (char.inventory as any)?.items ?? []
    if (!items.length) { await client.query('ROLLBACK'); return res.json({ ok: true, removed: 0 }) }

    // Busca IDs válidos
    const ids = [...new Set(items.map(i => i.definitionId))]
    const { rows: validRows } = await client.query<{ id: string }>(
      'SELECT id FROM game_items WHERE id = ANY($1)', [ids]
    )
    const validIds = new Set(validRows.map(r => r.id))

    const before = items.length
    const newItems = items.filter(i => validIds.has(i.definitionId))
    const removed = before - newItems.length

    const inv = { ...(char.inventory as any), items: newItems }
    await client.query('UPDATE characters SET inventory=$1 WHERE id=$2', [JSON.stringify(inv), req.params.charId])
    await client.query('COMMIT')
    return res.json({ ok: true, removed })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao limpar itens.' })
  } finally { client.release() }
})

router.patch('/inventory/:charId/dao-crystals', async (req, res) => {
  const { amount } = req.body as { amount: number }
  if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ error: 'Valor inválido.' })
  await pool.query('UPDATE characters SET dao_crystals=$1 WHERE id=$2', [amount, req.params.charId])
  res.json({ ok: true })
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

router.patch('/inventory/:charId/qi', async (req, res) => {
  try {
    const { amount } = req.body as { amount: number }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'Valor inválido.' })
    }
    const { rows: [char] } = await pool.query<{ qi_max: number }>(
      'SELECT qi_max FROM characters WHERE id = $1', [req.params.charId]
    )
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })
    const safeQi = Math.min(Math.floor(amount), char.qi_max)
    await pool.query('UPDATE characters SET qi_current = $1 WHERE id = $2', [safeQi, req.params.charId])
    res.json({ ok: true, qi_current: safeQi })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao atualizar Qi.' })
  }
})

router.patch('/inventory/:charId/stats', async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>
    const fields: Record<string, number> = {}
    for (const key of ['strength', 'agility', 'vitality', 'defense', 'perception', 'luck', 'hp_max', 'hp_current', 'qi_max', 'qi_current']) {
      if (b[key] !== undefined && b[key] !== '') {
        const v = Number(b[key])
        if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: `Valor inválido para ${key}.` })
        fields[key] = Math.floor(v)
      }
    }
    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Nenhum campo enviado.' })
    const setClauses = Object.keys(fields).map((k, i) => `${k} = $${i + 1}`).join(', ')
    const values     = [...Object.values(fields), req.params.charId]
    await pool.query(`UPDATE characters SET ${setClauses} WHERE id = $${values.length}`, values)
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao atualizar atributos.' })
  }
})

router.patch('/inventory/:charId/skills', async (req, res) => {
  try {
    const updates = req.body as Record<string, number> // { forging: 5, alchemy: 3, ... }
    if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Body inválido.' })

    const { rows: [char] } = await pool.query<{ skills: unknown }>(
      'SELECT skills FROM characters WHERE id = $1', [req.params.charId]
    )
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })

    const cfgRow = await pool.query<{ value: string }>(
      "SELECT value FROM game_settings WHERE key = 'skill_xp_config'"
    )
    const cfg = cfgRow.rows[0] ? JSON.parse(cfgRow.rows[0].value) as { baseXp: number; multiplier: number } : { baseXp: 50, multiplier: 1.3 }
    const xpToNext = (level: number) => Math.floor(cfg.baseXp * Math.pow(cfg.multiplier, level - 1))

    type SkillEnt = { id: string; level: number; xp: number; xpToNext: number }
    const raw  = char.skills as { data?: SkillEnt[] } | SkillEnt[] | null
    const blob = Array.isArray(raw) ? { data: raw } : (raw ?? { data: [] })
    const arr: SkillEnt[] = blob.data ?? []

    for (const [skillId, level] of Object.entries(updates)) {
      const lvl = Math.max(1, Math.min(99, Math.floor(Number(level))))
      const idx = arr.findIndex(s => s.id === skillId)
      const entry: SkillEnt = { id: skillId, level: lvl, xp: 0, xpToNext: xpToNext(lvl) }
      if (idx >= 0) arr[idx] = entry
      else arr.push(entry)
    }

    await pool.query(
      'UPDATE characters SET skills = $1 WHERE id = $2',
      [JSON.stringify({ ...blob, data: arr }), req.params.charId]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro ao atualizar habilidades.' })
  }
})

// ── Slots extras de personagem ────────────────────────────────────────────────

router.patch('/users/:userId/extra-slots', async (req, res) => {
  const { slots } = req.body as { slots?: unknown }
  const value = parseInt(String(slots ?? 0))
  if (isNaN(value) || value < 0 || value > 99) {
    return res.status(400).json({ error: 'Valor inválido (0–99).' })
  }
  const { rowCount } = await pool.query(
    'UPDATE users SET extra_char_slots=$1 WHERE id=$2',
    [value, req.params.userId]
  )
  if (!rowCount) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json({ ok: true, extra_char_slots: value })
})

// ── Definir Cultivo (admin) ───────────────────────────────────────────────────

const ADM_REALM_ORDER = [
  'body_tempering','houtian','xiantian','revolving_core','life_destruction',
  'divine_sea','divine_transformation','divine_lord','holy_lord',
  'world_king','empyrean','true_divinity','beyond_divinity',
]
function admGetStages(realm: string): string[] {
  if (realm === 'body_tempering')   return ['strength','muscle','bone','marrow','meridian','eight_gates','nine_stars']
  if (realm === 'life_destruction') return ['destruction_1','destruction_2','destruction_3','destruction_4','destruction_5','destruction_6','destruction_7','destruction_8','destruction_9']
  return ['initial','middle','advanced','peak']
}
function admRealmLevel(realm: string, stage: string): number {
  const ri = ADM_REALM_ORDER.indexOf(realm)
  if (ri === -1) return 0
  const stages = admGetStages(realm)
  const si = stages.indexOf(stage)
  return ri * 10 + (si >= 0 ? si : 0) + 1
}
const ADM_DEFAULT_CLASS_DELTAS: Record<string, Record<string, number>> = {
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
const ADM_FALLBACK_DELTAS = { strength: 3, agility: 3, vitality: 3, defense: 3, perception: 4 }

router.post('/characters/:charId/set-realm', async (req, res) => {
  const { target_realm, target_stage } = req.body as { target_realm?: string; target_stage?: string }
  const { charId } = req.params

  if (!target_realm || !target_stage)
    return res.status(400).json({ error: 'target_realm e target_stage são obrigatórios.' })
  if (!ADM_REALM_ORDER.includes(target_realm) || !admGetStages(target_realm).includes(target_stage))
    return res.status(400).json({ error: 'Reino ou estágio alvo inválido.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    type CharRow = {
      realm: string; realm_stage: string
      strength: number; agility: number; vitality: number; defense: number; perception: number
      hp_max: number; luck: number; attribute_points: number; talent_points: number
      class_id: string | null
    }
    const { rows } = await client.query<CharRow>(
      'SELECT realm, realm_stage, strength, agility, vitality, defense, perception, hp_max, luck, attribute_points, talent_points, class_id FROM characters WHERE id = $1 FOR UPDATE',
      [charId]
    )
    if (!rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Personagem não encontrado.' })
    }
    const char = rows[0]
    const curLevel = admRealmLevel(char.realm, char.realm_stage)
    const tgtLevel = admRealmLevel(target_realm, target_stage)

    if (curLevel === tgtLevel) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Personagem já está neste nível.' })
    }

    // Carrega todos os breakthroughs
    const { rows: allBts } = await client.query<{
      realm: string; stage: string; next_realm: string; next_stage: string; new_max_qi: string
    }>('SELECT realm, stage, next_realm, next_stage, new_max_qi FROM game_breakthroughs')

    const btMap = new Map<string, typeof allBts[0]>()
    for (const bt of allBts) btMap.set(`${bt.realm}_${bt.stage}`, bt)

    if (tgtLevel > curLevel) {
      // ── Avançar: percorre a cadeia e aplica deltas ─────────────────
      const chain: typeof allBts[0][] = []
      let key = `${char.realm}_${char.realm_stage}`
      const targetKey = `${target_realm}_${target_stage}`
      for (let i = 0; i < 300; i++) {
        const bt = btMap.get(key)
        if (!bt) break
        chain.push(bt)
        key = `${bt.next_realm}_${bt.next_stage}`
        if (key === targetKey) break
      }
      if (key !== targetKey) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Caminho de rompimento não encontrado até o nível alvo.' })
      }

      // Configs
      let hpPerVit = 20, attrPtsPerBT = 3, luckMin = 1, luckMax = 3, talentPtsPerBT = 1
      try {
        const cfgRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
        if (cfgRow.rows.length) {
          const cfg = JSON.parse(cfgRow.rows[0].value)
          hpPerVit       = cfg.hpPerVit                  ?? hpPerVit
          attrPtsPerBT   = cfg.attrPointsPerBreakthrough ?? attrPtsPerBT
          luckMin        = cfg.luckGainMin               ?? luckMin
          luckMax        = cfg.luckGainMax               ?? luckMax
          talentPtsPerBT = cfg.talentPointsPerBreakthrough ?? talentPtsPerBT
        }
      } catch {}
      let classDeltas: Record<string, Record<string, number>> = { ...ADM_DEFAULT_CLASS_DELTAS }
      try {
        const cdRow = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='class_breakthrough_config'")
        if (cdRow.rows.length) classDeltas = { ...ADM_DEFAULT_CLASS_DELTAS, ...JSON.parse(cdRow.rows[0].value) }
      } catch {}
      const d = classDeltas[char.class_id ?? ''] ?? ADM_FALLBACK_DELTAS

      const n        = chain.length
      const avgLuck  = Math.round((luckMin + luckMax) / 2)
      const newHpMax = char.hp_max + d.vitality * hpPerVit * n
      const newLevel = admRealmLevel(target_realm, target_stage)
      const finalQiMax = Number(chain[n - 1].new_max_qi)

      // Pontos livres de agilidade em excesso (mesmo cálculo do breakthrough normal)
      let agiCapBonusTotal = 0
      try {
        const scCfg = await client.query<{ value: string }>("SELECT value FROM game_settings WHERE key='stat_config'")
        const sc = scCfg.rows.length ? JSON.parse(scCfg.rows[0].value) : {}
        const baseSpeed   = sc.baseSpeed      ?? 2.0
        const speedPerAgi = sc.speedPerAgi    ?? 0.03
        const minAtk      = sc.minAttackSpeed ?? 0.25
        const agiCap      = Math.ceil((baseSpeed - minAtk) / speedPerAgi)
        let curAgi = char.agility ?? 0
        for (let i = 0; i < n; i++) {
          const effective = Math.max(0, Math.min(d.agility, agiCap - curAgi))
          agiCapBonusTotal += d.agility - effective
          curAgi += effective
        }
      } catch {}

      await client.query(
        `UPDATE characters SET
           realm=$1, realm_stage=$2, realm_level=$3,
           qi_current=0, qi_max=$4,
           strength=strength+$5, agility=agility+$6, vitality=vitality+$7,
           defense=defense+$8, perception=perception+$9,
           hp_max=$10, hp_current=$11,
           attribute_points=attribute_points+$12,
           luck=luck+$13,
           talent_points=talent_points+$14,
           last_played_at=NOW()
         WHERE id=$15`,
        [
          target_realm, target_stage, newLevel,
          finalQiMax,
          d.strength * n, (d.agility * n) - agiCapBonusTotal, d.vitality * n, d.defense * n, d.perception * n,
          newHpMax, newHpMax,
          attrPtsPerBT * n + agiCapBonusTotal,
          avgLuck * n,
          talentPtsPerBT * n,
          charId,
        ]
      )
      await client.query('COMMIT')
      return res.json({ ok: true, breakthroughs_applied: n, target_realm, target_stage, qi_max: finalQiMax })

    } else {
      // ── Regredir: só ajusta reino/estágio e qi_max, sem mudar stats ──
      const arrivalBt = allBts.find(b => b.next_realm === target_realm && b.next_stage === target_stage)
      if (!arrivalBt) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Breakthrough de chegada não encontrado para o nível alvo.' })
      }
      const newLevel = admRealmLevel(target_realm, target_stage)
      await client.query(
        `UPDATE characters SET realm=$1, realm_stage=$2, realm_level=$3, qi_current=0, qi_max=$4, last_played_at=NOW() WHERE id=$5`,
        [target_realm, target_stage, newLevel, Number(arrivalBt.new_max_qi), charId]
      )
      await client.query('COMMIT')
      return res.json({ ok: true, breakthroughs_applied: 0, target_realm, target_stage, qi_max: Number(arrivalBt.new_max_qi) })
    }

  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Erro ao definir cultivo.' })
  } finally {
    client.release()
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

// ── Manutenção ────────────────────────────────────────────────────
router.get('/maintenance', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ key: string; value: string }>(
      "SELECT key, value FROM game_settings WHERE key IN ('maintenance_mode','maintenance_message')"
    )
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    res.json({
      enabled: map['maintenance_mode'] === 'true',
      message: map['maintenance_message'] ?? 'O servidor está em manutenção. Voltamos em breve!',
    })
  } catch {
    res.status(500).json({ error: 'Erro ao buscar status de manutenção.' })
  }
})

router.post('/maintenance', async (req, res) => {
  try {
    const { enabled, message } = req.body as { enabled: boolean; message: string }
    await pool.query(
      "INSERT INTO game_settings (key,value) VALUES ('maintenance_mode',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [enabled ? 'true' : 'false']
    )
    await pool.query(
      "INSERT INTO game_settings (key,value) VALUES ('maintenance_message',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [message ?? '']
    )
    invalidateMaintenanceCache()
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erro ao salvar configuração de manutenção.' })
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

// ── Honeypot logs ─────────────────────────────────────────────────────────────

router.get('/honeypot', async (req, res) => {
  const limit  = Math.min(Number(req.query.limit  ?? 100), 500)
  const offset = Number(req.query.offset ?? 0)
  try {
    const { rows } = await pool.query(
      'SELECT * FROM honeypot_logs ORDER BY hit_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*)::int AS count FROM honeypot_logs')
    res.json({ total: count, rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao buscar logs.' })
  }
})

router.delete('/honeypot', async (_req, res) => {
  try {
    await pool.query('TRUNCATE honeypot_logs RESTART IDENTITY')
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao limpar logs.' })
  }
})

// ── POST /users/:userId/legends/:legendId/restore ─────────────────────────────

router.post('/users/:userId/legends/:legendId/restore', async (req, res) => {
  const userId   = parseInt(req.params.userId)
  const legendId = parseInt(req.params.legendId)
  if (isNaN(userId) || isNaN(legendId)) {
    return res.status(400).json({ error: 'IDs inválidos.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Garante que o usuário não tem personagem ativo
    const { rows: chars } = await client.query(
      'SELECT id FROM characters WHERE user_id = $1',
      [userId]
    )
    if (chars.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Usuário já possui um personagem ativo.' })
    }

    // Busca a lenda
    const { rows: legs } = await client.query(
      'SELECT * FROM legends WHERE id = $1 AND user_id = $2',
      [legendId, userId]
    )
    if (!legs.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Lenda não encontrada.' })
    }
    const leg = legs[0] as {
      id: number; user_id: number; name: string; realm: string; realm_stage: string
      realm_level: number; cultivation_power: string; total_kills: number; born_at: string
      character_snapshot: Record<string, unknown> | null
    }

    const snap = leg.character_snapshot
    const RING_INV = JSON.stringify({
      items: [{ instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 }],
      equipped: { weapon: null, armor: null, accessory: null,
        ring: { instanceId: 'ring-initial', definitionId: 'ring_leather', quantity: 1, obtainedAt: 0 } },
      maxSlots: 30,
    })

    const { rows: [newChar] } = snap
      // Restauração completa via snapshot
      ? await client.query(
          `INSERT INTO characters
             (user_id, name, realm, realm_stage, realm_level, cultivation_power,
              hp_current, hp_max, qi_current, qi_max,
              strength, agility, vitality, defense, perception, luck,
              attribute_points, talent_points, unlocked_talents, unlocked_recipes, laws,
              affinity, gender, class_id, inventory, skills, bestiary,
              spirit_gold, total_kills, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
           RETURNING id, name, realm, realm_stage`,
          [
            userId, leg.name, leg.realm, leg.realm_stage, leg.realm_level,
            snap.cultivation_power ?? leg.cultivation_power,
            snap.hp_current ?? 100, snap.hp_max ?? 100,
            snap.qi_current ?? 0,   snap.qi_max ?? 400,
            snap.strength ?? 5, snap.agility ?? 5, snap.vitality ?? 5,
            snap.defense  ?? 3, snap.perception ?? 3,
            snap.luck ?? 0,
            snap.attribute_points ?? 0,
            snap.talent_points ?? 0,
            JSON.stringify(snap.unlocked_talents ?? {}),
            JSON.stringify(snap.unlocked_recipes ?? []),
            JSON.stringify(snap.laws ?? {}),
            snap.affinity ?? 'Fogo', snap.gender ?? 'masculino',
            snap.class_id ?? null,
            snap.inventory ? JSON.stringify(snap.inventory) : RING_INV,
            snap.skills    ? JSON.stringify(snap.skills)    : null,
            snap.bestiary  ? JSON.stringify(snap.bestiary)  : null,
            snap.spirit_gold ?? 0, leg.total_kills ?? 0, leg.born_at,
          ]
        )
      // Fallback para lendas antigas sem snapshot: reconstrói stats pelo nível de cultivo
      : await (async () => {
          const cs = computeBaseStatsFromCultivation(leg.realm, leg.realm_stage)
          return client.query(
            `INSERT INTO characters
               (user_id, name, realm, realm_stage, realm_level, cultivation_power,
                hp_current, hp_max, qi_current, qi_max,
                strength, agility, vitality, defense, perception, luck,
                affinity, gender, inventory, total_kills, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$8,$9,$10,$11,$12,$13,$14,'Fogo','masculino',$15,$16,$17)
             RETURNING id, name, realm, realm_stage`,
            [
              userId, leg.name, leg.realm, leg.realm_stage, leg.realm_level, leg.cultivation_power,
              cs.hp_max, cs.qi_max,
              cs.strength, cs.agility, cs.vitality, cs.defense, cs.perception, cs.luck,
              RING_INV, leg.total_kills ?? 0, leg.born_at,
            ]
          )
        })()

    // Remove a lenda restaurada
    await client.query('DELETE FROM legends WHERE id = $1', [legendId])

    await client.query('COMMIT')
    return res.json({ character: newChar })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[restore-legend]', err)
    return res.status(500).json({ error: 'Erro ao restaurar personagem.' })
  } finally {
    client.release()
  }
})

// ═══════════════════════════════════════════════════════════════
//  QI RATE CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_QI_RATE_CONFIG: Record<string, Record<string, number>> = {
  qi_refining:           { initial: 3,     middle: 4,     advanced: 5,     peak: 7     },
  foundation:            { initial: 10,    middle: 15,    advanced: 20,    peak: 28    },
  golden_core:           { initial: 40,    middle: 55,    advanced: 75,    peak: 100   },
  nascent_soul:          { initial: 140,   middle: 190,   advanced: 260,   peak: 350   },
  spirit_transformation: { initial: 480,   middle: 650,   advanced: 880,   peak: 1200  },
  unification:           { initial: 1600,  middle: 2200,  advanced: 3000,  peak: 4000  },
  ascension:             { initial: 5500,  middle: 7500,  advanced: 10000, peak: 14000 },
  immortal:              { initial: 20000, middle: 28000, advanced: 38000, peak: 50000 },
}

router.get('/qi-rate', async (_req, res) => {
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM game_settings WHERE key='qi_rate_config'"
  )
  if (!rows.length) return res.json(DEFAULT_QI_RATE_CONFIG)
  try { return res.json({ ...DEFAULT_QI_RATE_CONFIG, ...JSON.parse(rows[0].value) }) }
  catch { return res.json(DEFAULT_QI_RATE_CONFIG) }
})

router.post('/qi-rate', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('qi_rate_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

// ── Player Power Calibration ────────────────────────────────────────────────────

router.get('/players/list', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, u.username FROM characters c JOIN users u ON c.user_id=u.id ORDER BY c.name`
  )
  res.json(rows)
})

router.get('/player-power/:charId', async (req, res) => {
  const charId = parseInt(req.params.charId)
  const { rows: [char] } = await pool.query(
    `SELECT strength, agility, vitality, defense, perception, luck,
            realm, realm_stage, inventory, name
     FROM characters WHERE id=$1`, [charId]
  )
  if (!char) return res.status(404).json({ error: 'Personagem não encontrado.' })

  const REALM_ORDER_P = [
    'body_tempering','houtian','xiantian','revolving_core','life_destruction',
    'divine_sea','divine_transformation','divine_lord','holy_lord',
    'world_king','empyrean','true_divinity','beyond_divinity',
  ]
  const STAGE_ORDER_P: Record<string, number> = {
    strength:1,muscle:2,bone:3,marrow:4,meridian:5,eight_gates:6,nine_stars:7,
    initial:1,middle:2,advanced:3,peak:4,
    destruction_1:1,destruction_2:2,destruction_3:3,destruction_4:4,
    destruction_5:5,destruction_6:6,destruction_7:7,destruction_8:8,destruction_9:9,
  }
  const realmLvl = REALM_ORDER_P.indexOf(char.realm) * 10 + ((STAGE_ORDER_P[char.realm_stage] ?? 1) - 1)
  const realmMult = Math.max(1, Math.pow(1.5, realmLvl / 4))

  const baseAtk = char.strength * 4
  const baseHp  = char.vitality * 20
  const baseDef = char.defense  * 3
  const baseSpd = Math.max(0.5, 2.0 - char.agility * 0.03)

  let eqAtk = 0, eqDef = 0, eqHp = 0
  try {
    const eq = char.inventory?.equipped as Record<string, { definitionId: string; upgradeLevel?: number; ascensionTier?: number } | null> | undefined
    if (eq) {
      const ids = (['weapon','armor','accessory'] as const).map(s => eq[s]?.definitionId).filter(Boolean) as string[]
      if (ids.length > 0) {
        const { rows: items } = await pool.query(`SELECT id, stats FROM game_items WHERE id=ANY($1)`, [ids])
        for (const slot of ['weapon','armor','accessory'] as const) {
          const e = eq[slot]; if (!e) continue
          const it = items.find(i => i.id === e.definitionId); if (!it) continue
          const m = 1 + (e.upgradeLevel ?? 0) * 0.05 * (1 + (e.ascensionTier ?? 0) * 0.5)
          const s = it.stats ?? {}
          eqAtk += (s.atk ?? 0) * m
          eqDef += (s.def ?? 0) * m
          eqHp  += (s.hp  ?? 0) * m
        }
      }
    }
  } catch {}

  const totalAtk = baseAtk + eqAtk
  const totalHp  = baseHp  + eqHp
  const totalDef = baseDef + eqDef
  const critChance = (char.luck ?? 0) * 0.5
  const critDmg    = char.perception * 5
  const critMult   = 1 + (critChance / 100) * (critDmg / 100)
  const dps  = (totalAtk / baseSpd) * critMult
  const surv = totalHp * (1 + totalDef / 300)
  const power = Math.round(Math.sqrt(dps * surv) * realmMult)

  res.json({
    player_name:  char.name,
    player_power: power,
    realm:        char.realm,
    realm_stage:  char.realm_stage,
    breakdown:    { base_atk: baseAtk, base_hp: baseHp, base_def: baseDef, eq_atk: Math.round(eqAtk), eq_hp: Math.round(eqHp), eq_def: Math.round(eqDef), dps, surv, realm_mult: realmMult },
  })
})

router.post('/heal-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('heal_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

router.post('/class-initial-stats', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('class_initial_stats',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

router.post('/upgrade-milestones', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('upgrade_milestones',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

router.post('/world-map-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('world_map_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

const DEFAULT_GAME_BG = { url: null, opacity: 0.15, size: 'cover', position: 'center', panelOpacity: 1, screenOpacity: 1 }

router.get('/game-bg-config', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='game_bg_config'")
    res.json(rows.length ? { ...DEFAULT_GAME_BG, ...JSON.parse(rows[0].value) } : DEFAULT_GAME_BG)
  } catch {
    res.json(DEFAULT_GAME_BG)
  }
})

router.post('/game-bg-config', async (req, res) => {
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('game_bg_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify(req.body)]
  )
  return res.json({ ok: true })
})

router.post('/class-breakthrough-config', async (req, res) => {
  const value = JSON.stringify(req.body)
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('class_breakthrough_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [value]
  )
  return res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  CLASSES
// ═══════════════════════════════════════════════════════════════

router.get('/classes', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_classes ORDER BY sort_order, id')
  res.json(rows)
})

router.post('/classes/seed', async (req, res) => {
  const classes = req.body as Record<string, unknown>[]
  let count = 0
  for (const c of classes) {
    await pool.query(
      `INSERT INTO game_classes
         (id, name, emoji, description, allowed_weapon_type, allowed_armor_type, allowed_accessory_type, color, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, emoji=$3, description=$4,
         allowed_weapon_type=$5, allowed_armor_type=$6, allowed_accessory_type=$7,
         color=$8, sort_order=$9, updated_at=NOW()`,
      [c.id, c.name, c.emoji ?? '⚔️', c.description ?? '',
       c.allowed_weapon_type, c.allowed_armor_type, c.allowed_accessory_type,
       c.color ?? '#4a9e7f', c.sort_order ?? 0]
    )
    count++
  }
  res.json({ inserted: count })
})

router.post('/classes', async (req, res) => {
  const b = req.body as Record<string, unknown>
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_classes
         (id, name, emoji, description, allowed_weapon_type, allowed_armor_type, allowed_accessory_type, color, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.id, b.name, b.emoji ?? '⚔️', b.description ?? '',
       b.allowed_weapon_type, b.allowed_armor_type, b.allowed_accessory_type,
       b.color ?? '#4a9e7f', b.sort_order ?? 0]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar classe.' })
  }
})

router.put('/classes/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_classes SET
       name=$1, emoji=$2, description=$3,
       allowed_weapon_type=$4, allowed_armor_type=$5, allowed_accessory_type=$6,
       color=$7, sort_order=$8, active=$9, sprite_url=$10, sprite_config=$11, updated_at=NOW()
     WHERE id=$12 RETURNING *`,
    [b.name, b.emoji, b.description,
     b.allowed_weapon_type, b.allowed_armor_type, b.allowed_accessory_type,
     b.color, b.sort_order, b.active ?? true, b.sprite_url ?? null,
     b.sprite_config ? JSON.stringify(b.sprite_config) : null,
     req.params.id]
  )
  res.json(rows[0])
})

router.delete('/classes/:id', async (req, res) => {
  await pool.query('DELETE FROM game_classes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  TALENT NODES
// ═══════════════════════════════════════════════════════════════

router.get('/talent-nodes', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM game_talent_nodes ORDER BY class_id, required_realm, required_stage, position_row, position_col'
  )
  res.json(rows)
})

router.post('/talent-nodes/seed', async (req, res) => {
  const nodes = req.body as Record<string, unknown>[]
  let count = 0
  for (const n of nodes) {
    await pool.query(
      `INSERT INTO game_talent_nodes
         (id, class_id, name, description, effect_type, effect_value,
          required_realm, required_stage, point_cost, max_level, position_row, position_col, required_node_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         class_id=$2, name=$3, description=$4, effect_type=$5, effect_value=$6,
         required_realm=$7, required_stage=$8, point_cost=$9, max_level=$10,
         position_row=$11, position_col=$12, required_node_id=$13, updated_at=NOW()`,
      [n.id, n.class_id, n.name, n.description ?? '',
       n.effect_type, n.effect_value ?? 0,
       n.required_realm ?? 'body_tempering', n.required_stage ?? 'strength',
       n.point_cost ?? 1, n.max_level ?? 1, n.position_row ?? 0, n.position_col ?? 0,
       n.required_node_id ?? null]
    )
    count++
  }
  res.json({ inserted: count })
})

router.post('/talent-nodes', async (req, res) => {
  const b = req.body as Record<string, unknown>
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_talent_nodes
         (id, class_id, name, description, effect_type, effect_value,
          required_realm, required_stage, point_cost, max_level, position_row, position_col, required_node_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [b.id, b.class_id, b.name, b.description ?? '',
       b.effect_type, b.effect_value ?? 0,
       b.required_realm ?? 'body_tempering', b.required_stage ?? 'strength',
       b.point_cost ?? 1, b.max_level ?? 1, b.position_row ?? 0, b.position_col ?? 0,
       b.required_node_id ?? null]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar nó.' })
  }
})

router.put('/talent-nodes/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_talent_nodes SET
       class_id=$1, name=$2, description=$3, effect_type=$4, effect_value=$5,
       required_realm=$6, required_stage=$7, point_cost=$8, max_level=$9,
       position_row=$10, position_col=$11, required_node_id=$12, active=$13, updated_at=NOW()
     WHERE id=$14 RETURNING *`,
    [b.class_id, b.name, b.description, b.effect_type, b.effect_value,
     b.required_realm, b.required_stage, b.point_cost, b.max_level ?? 1,
     b.position_row, b.position_col, b.required_node_id ?? null,
     b.active ?? true, req.params.id]
  )
  res.json(rows[0])
})

router.delete('/talent-nodes/:id', async (req, res) => {
  await pool.query('DELETE FROM game_talent_nodes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  LEIS
// ═══════════════════════════════════════════════════════════════

router.get('/laws', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_laws ORDER BY sort_order, id')
  res.json(rows)
})

router.post('/laws/seed', async (req, res) => {
  const laws = req.body as Record<string, unknown>[]
  let count = 0
  for (const l of laws) {
    await pool.query(
      `INSERT INTO game_laws
         (id, name, description, emoji, affinity,
          bonus_fragment, bonus_initial, bonus_middle, bonus_advanced, bonus_complete,
          min_realm_initial, min_realm_middle, min_realm_advanced, min_realm_complete,
          fragments_to_initial, fragments_to_middle, fragments_to_advanced, fragments_to_complete,
          fragment_item_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, description=$3, emoji=$4, affinity=$5,
         bonus_fragment=$6, bonus_initial=$7, bonus_middle=$8, bonus_advanced=$9, bonus_complete=$10,
         min_realm_initial=$11, min_realm_middle=$12, min_realm_advanced=$13, min_realm_complete=$14,
         fragments_to_initial=$15, fragments_to_middle=$16, fragments_to_advanced=$17, fragments_to_complete=$18,
         fragment_item_id=$19, sort_order=$20, updated_at=NOW()`,
      [l.id, l.name, l.description ?? '', l.emoji ?? '✨', l.affinity ?? null,
       JSON.stringify(l.bonus_fragment ?? {}), JSON.stringify(l.bonus_initial ?? {}),
       JSON.stringify(l.bonus_middle ?? {}), JSON.stringify(l.bonus_advanced ?? {}),
       JSON.stringify(l.bonus_complete ?? {}),
       l.min_realm_initial ?? 'houtian', l.min_realm_middle ?? 'xiantian',
       l.min_realm_advanced ?? 'revolving_core', l.min_realm_complete ?? 'divine_sea',
       l.fragments_to_initial ?? 5, l.fragments_to_middle ?? 20,
       l.fragments_to_advanced ?? 50, l.fragments_to_complete ?? 100,
       l.fragment_item_id ?? null, l.sort_order ?? 0]
    )
    count++
  }
  res.json({ inserted: count })
})

router.put('/laws/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_laws SET
       name=$1, description=$2, emoji=$3, affinity=$4,
       bonus_fragment=$5, bonus_initial=$6, bonus_middle=$7, bonus_advanced=$8, bonus_complete=$9,
       min_realm_initial=$10, min_realm_middle=$11, min_realm_advanced=$12, min_realm_complete=$13,
       fragments_to_initial=$14, fragments_to_middle=$15, fragments_to_advanced=$16, fragments_to_complete=$17,
       fragment_item_id=$18, sort_order=$19, active=$20, updated_at=NOW()
     WHERE id=$21 RETURNING *`,
    [b.name, b.description, b.emoji, b.affinity ?? null,
     JSON.stringify(b.bonus_fragment ?? {}), JSON.stringify(b.bonus_initial ?? {}),
     JSON.stringify(b.bonus_middle ?? {}), JSON.stringify(b.bonus_advanced ?? {}),
     JSON.stringify(b.bonus_complete ?? {}),
     b.min_realm_initial, b.min_realm_middle, b.min_realm_advanced, b.min_realm_complete,
     b.fragments_to_initial, b.fragments_to_middle, b.fragments_to_advanced, b.fragments_to_complete,
     b.fragment_item_id ?? null, b.sort_order ?? 0, b.active ?? true, req.params.id]
  )
  res.json(rows[0])
})

router.delete('/laws/:id', async (req, res) => {
  await pool.query('DELETE FROM game_laws WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  LOCATIONS
// ═══════════════════════════════════════════════════════════════

router.get('/locations', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM game_locations ORDER BY sort_order, id')
  res.json(rows)
})

router.post('/locations/seed', async (req, res) => {
  const locs = req.body as Record<string, unknown>[]
  let count = 0
  for (const l of locs) {
    await pool.query(
      `INSERT INTO game_locations
         (id, name, description, emoji, type, required_realm, required_stage, required_boss_id,
          map_x, map_y, connected_to, services, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, description=$3, emoji=$4, type=$5, required_realm=$6, required_stage=$7,
         required_boss_id=$8, map_x=$9, map_y=$10, connected_to=$11, services=$12,
         sort_order=$13, updated_at=NOW()`,
      [l.id, l.name, l.description ?? '', l.emoji ?? '🗺️', l.type ?? 'village',
       l.required_realm ?? 'body_tempering', l.required_stage ?? 'strength',
       l.required_boss_id ?? null,
       l.map_x ?? 0, l.map_y ?? 0,
       JSON.stringify(l.connected_to ?? []), JSON.stringify(l.services ?? []),
       l.sort_order ?? 0]
    )
    count++
  }
  res.json({ inserted: count })
})

router.post('/locations', async (req, res) => {
  const b = req.body as Record<string, unknown>
  try {
    const { rows } = await pool.query(
      `INSERT INTO game_locations
         (id, name, description, emoji, type, required_realm, required_stage, required_boss_id,
          map_x, map_y, connected_to, services, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [b.id, b.name, b.description ?? '', b.emoji ?? '🗺️', b.type ?? 'village',
       b.required_realm ?? 'body_tempering', b.required_stage ?? 'strength',
       b.required_boss_id ?? null,
       b.map_x ?? 0, b.map_y ?? 0,
       JSON.stringify(b.connected_to ?? []), JSON.stringify(b.services ?? []),
       b.sort_order ?? 0]
    )
    res.status(201).json(rows[0])
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar localização.' })
  }
})

router.put('/locations/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows } = await pool.query(
    `UPDATE game_locations SET
       name=$1, description=$2, emoji=$3, type=$4, required_realm=$5, required_stage=$6,
       required_boss_id=$7, map_x=$8, map_y=$9, connected_to=$10, services=$11,
       sort_order=$12, active=$13, background_url=$14, background_position=$15, updated_at=NOW()
     WHERE id=$16 RETURNING *`,
    [b.name, b.description, b.emoji, b.type, b.required_realm, b.required_stage,
     b.required_boss_id ?? null, b.map_x ?? 0, b.map_y ?? 0,
     JSON.stringify(b.connected_to ?? []), JSON.stringify(b.services ?? []),
     b.sort_order ?? 0, b.active ?? true,
     b.background_url ?? null, b.background_position ?? 'center',
     req.params.id]
  )
  res.json(rows[0])
})

router.delete('/locations/:id', async (req, res) => {
  await pool.query('DELETE FROM game_locations WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  SISTEMA DE SEITAS — Config + Gestão Admin
// ═══════════════════════════════════════════════════════════════

import { DEFAULT_SECT_CONFIG } from './sect'

router.get('/sect-config', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='sect_config'")
    if (!rows.length) return res.json(DEFAULT_SECT_CONFIG)
    return res.json({ ...DEFAULT_SECT_CONFIG, ...JSON.parse(rows[0].value) })
  } catch { return res.json(DEFAULT_SECT_CONFIG) }
})

router.post('/sect-config', async (req, res) => {
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('sect_config',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify(req.body)]
  )
  return res.json({ ok: true })
})

router.get('/sects', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, COUNT(sm.user_id)::int AS member_count,
           u.username AS founder_name
    FROM sects s
    LEFT JOIN sect_members sm ON sm.sect_id = s.id
    LEFT JOIN users u ON u.id = s.founder_user_id
    GROUP BY s.id, u.username
    ORDER BY s.collective_qi DESC
  `)
  res.json(rows)
})

router.delete('/sects/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: members } = await client.query<{ user_id: number }>(
      'SELECT user_id FROM sect_members WHERE sect_id=$1', [req.params.id]
    )
    for (const m of members) {
      await client.query('UPDATE characters SET sect_qi_bonus_pct=0 WHERE user_id=$1', [m.user_id])
    }
    await client.query('DELETE FROM sects WHERE id=$1', [req.params.id])
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Erro ao deletar seita.' })
  } finally { client.release() }
})

// ═══════════════════════════════════════════════════════════════
//  MERCADORES — CRUD Admin
// ═══════════════════════════════════════════════════════════════

// Preços de venda de receitas
router.get('/recipe-sell-prices', async (_req, res) => {
  const { DEFAULT_RECIPE_SELL_PRICES } = await import('./merchants')
  try {
    const { rows } = await pool.query<{ value: string }>("SELECT value FROM game_settings WHERE key='recipe_sell_prices'")
    if (!rows.length) return res.json(DEFAULT_RECIPE_SELL_PRICES)
    return res.json({ ...DEFAULT_RECIPE_SELL_PRICES, ...JSON.parse(rows[0].value) })
  } catch { return res.json(DEFAULT_RECIPE_SELL_PRICES) }
})

router.post('/recipe-sell-prices', async (req, res) => {
  await pool.query(
    "INSERT INTO game_settings (key,value) VALUES ('recipe_sell_prices',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [JSON.stringify(req.body)]
  )
  res.json({ ok: true })
})

// Seed completo: cria mercadores com estoque em uma operação
router.post('/merchants/seed', async (req, res) => {
  const merchants = req.body as { location_id: string; name: string; emoji: string; description: string; specialty: string; sort_order: number; active: boolean; stock: { item_def_id: string; price_gold: number; daily_limit: number; sort_order: number }[] }[]
  const client = await pool.connect()
  let created = 0
  try {
    await client.query('BEGIN')
    for (const m of merchants) {
      const { rows: [merchant] } = await client.query(
        `INSERT INTO game_merchants (location_id, name, emoji, description, specialty, sort_order, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING RETURNING id`,
        [m.location_id, m.name, m.emoji ?? '🧑‍💼', m.description ?? '', m.specialty ?? '', m.sort_order ?? 0, m.active !== false]
      )
      if (!merchant) continue
      for (const s of (m.stock ?? [])) {
        await client.query(
          `INSERT INTO merchant_stock (merchant_id, item_def_id, price_gold, daily_limit, sort_order)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [merchant.id, s.item_def_id, s.price_gold ?? 100, s.daily_limit ?? 0, s.sort_order ?? 0]
        )
      }
      created++
    }
    await client.query('COMMIT')
    res.json({ ok: true, created })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Erro ao importar mercadores.' })
  } finally { client.release() }
})

router.get('/merchants', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT gm.*, gl.name AS location_name,
      COUNT(ms.id)::int AS stock_count
    FROM game_merchants gm
    LEFT JOIN game_locations gl ON gl.id = gm.location_id
    LEFT JOIN merchant_stock ms ON ms.merchant_id = gm.id
    GROUP BY gm.id, gl.name
    ORDER BY gm.location_id, gm.sort_order, gm.id
  `)
  res.json(rows)
})

router.post('/merchants', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows: [m] } = await pool.query(
    `INSERT INTO game_merchants (location_id, name, emoji, description, specialty, sort_order, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [b.location_id, b.name, b.emoji ?? '🧑‍💼', b.description ?? '', b.specialty ?? '', b.sort_order ?? 0, b.active !== false]
  )
  res.status(201).json(m)
})

router.put('/merchants/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows: [m] } = await pool.query(
    `UPDATE game_merchants SET location_id=$1, name=$2, emoji=$3, description=$4, specialty=$5, sort_order=$6, active=$7
     WHERE id=$8 RETURNING *`,
    [b.location_id, b.name, b.emoji, b.description, b.specialty, b.sort_order ?? 0, b.active !== false, req.params.id]
  )
  if (!m) return res.status(404).json({ error: 'Mercador não encontrado.' })
  res.json(m)
})

router.delete('/merchants/:id', async (_req, res) => {
  await pool.query('DELETE FROM game_merchants WHERE id=$1', [_req.params.id])
  res.json({ ok: true })
})

// Estoque do mercador
router.get('/merchants/:id/stock', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM merchant_stock WHERE merchant_id=$1 ORDER BY sort_order, id',
    [req.params.id]
  )
  res.json(rows)
})

router.post('/merchants/:id/stock', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const { rows: [s] } = await pool.query(
    `INSERT INTO merchant_stock (merchant_id, item_def_id, price_gold, daily_limit, sort_order,
       materials_cost, dao_crystal_cost, min_reputation, rep_points_reward)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (merchant_id, item_def_id) DO UPDATE
       SET price_gold=$3, daily_limit=$4, sort_order=$5,
           materials_cost=$6, dao_crystal_cost=$7, min_reputation=$8, rep_points_reward=$9
     RETURNING *`,
    [req.params.id, b.item_def_id, b.price_gold ?? 100, b.daily_limit ?? 0, b.sort_order ?? 0,
     JSON.stringify(b.materials_cost ?? []), b.dao_crystal_cost ?? 0, b.min_reputation ?? 0, b.rep_points_reward ?? 1]
  )
  res.json(s)
})

router.delete('/merchants/:merchantId/stock/:itemDefId', async (req, res) => {
  await pool.query(
    'DELETE FROM merchant_stock WHERE merchant_id=$1 AND item_def_id=$2',
    [req.params.merchantId, req.params.itemDefId]
  )
  res.json({ ok: true })
})

export default router
