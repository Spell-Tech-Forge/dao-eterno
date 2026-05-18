import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// ── Items ──────────────────────────────────────────────────────────

router.get('/items', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_items WHERE active = true ORDER BY type, name'
    )
    res.json(rows.map(r => ({
      id:          r.id,
      name:        r.name,
      emoji:       r.emoji,
      type:        r.type,
      rarity:      r.rarity,
      description: r.description ?? '',
      stats:       r.stats ?? {},
      stackable:   r.stackable ?? false,
      tier:        r.tier ?? 1,
    })))
  } catch {
    res.json([])
  }
})

// ── Recipes ────────────────────────────────────────────────────────

router.get('/recipes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_recipes WHERE active = true ORDER BY category, required_tier, name'
    )
    res.json(rows.map(r => ({
      id:             r.id,
      name:           r.name,
      category:       r.category,
      outputItemId:   r.output_item_id,
      outputQuantity: r.output_quantity,
      requiredTier:   r.required_tier,
      ingredients:    r.ingredients ?? [],
    })))
  } catch {
    res.json([])
  }
})

// ── Monsters ───────────────────────────────────────────────────────

router.get('/monsters', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_monsters WHERE active = true ORDER BY biome_id, level_min'
    )
    res.json(rows.map(mapMonster))
  } catch {
    res.json([])
  }
})

// ── Biomes ─────────────────────────────────────────────────────────

router.get('/biomes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_biomes WHERE active = true ORDER BY sort_order, id'
    )
    res.json(rows.map(mapBiome))
  } catch {
    res.json([])
  }
})

// ── Breakthroughs ──────────────────────────────────────────────────

router.get('/breakthroughs', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM game_breakthroughs WHERE active = true ORDER BY realm, stage'
    )
    res.json(rows.map(r => ({
      id:        r.id,
      realm:     r.realm,
      stage:     r.stage,
      nextRealm: r.next_realm,
      nextStage: r.next_stage,
      newMaxQi:  Number(r.new_max_qi),
      items:     r.required_items ?? [],
    })))
  } catch {
    res.json([])
  }
})

// ── Mappers ────────────────────────────────────────────────────────

function mapMonster(r: Record<string, unknown>) {
  return {
    id:        r.id,
    name:      r.name,
    emoji:     r.emoji,
    levelMin:  r.level_min,
    levelMax:  r.level_max,
    rarity:    r.rarity,
    biomeId:   r.biome_id,
    isBoss:    r.is_boss,
    baseHp:    r.base_hp,
    baseAtk:   r.base_atk,
    baseDef:   r.base_def,
    speed:     parseFloat(String(r.speed)),
    qiReward:  r.qi_reward,
    goldReward: { min: r.gold_reward_min, max: r.gold_reward_max },
    dropTable: r.drop_table ?? [],
    requiredRealm: r.required_realm ?? 'qi_refining',
  }
}

function mapBiome(r: Record<string, unknown>) {
  return {
    id:                 r.id,
    name:               r.name,
    description:        r.description,
    requiredRealm:      r.required_realm,
    requiredStage:      r.required_stage,
    difficulty:         r.difficulty,
    biomeType:          r.biome_type,
    activeDays:         r.active_days,
    activeStartTime:    r.active_start_time,
    activeEndTime:      r.active_end_time,
    activeUntil:        r.active_until,
    enemyPool:          r.enemy_pool ?? [],
    bossId:             r.boss_id ?? '',
    minKillsBeforeBoss: r.min_kills_boss,
    bossSpawnChance:    parseFloat(String(r.boss_spawn_chance)),
    normalRarityWeights: r.rarity_weights ?? {},
    bossRarity:         r.boss_rarity,
    theme: {
      gradient:    r.gradient,
      accentColor: r.accent_color,
    },
    sortOrder:          r.sort_order,
    backgroundUrl:      r.background_url      ?? null,
    backgroundPosition: r.background_position ?? 'center',
  }
}

// ── Forge Config (leitura para gameplay) ───────────────────────────
router.get('/forge-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='forge_config'"
    )
    res.json(rows[0]?.value ?? { upgrade: {}, ascension: [] })
  } catch {
    res.json({ upgrade: {}, ascension: [] })
  }
})

export default router
