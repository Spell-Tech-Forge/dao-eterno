import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { requireNoMaintenance } from '../middleware/maintenance'

const router = Router()
router.use(requireAuth)
router.use(requireNoMaintenance)

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
      maxStack:    r.max_stack ?? null,
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
    const { rows } = await pool.query(`
      SELECT m.*, b.stat_modifiers
      FROM game_monsters m
      LEFT JOIN game_biomes b ON b.id = m.biome_id
      WHERE m.active = true
      ORDER BY m.biome_id, m.level_min
    `)
    res.json(rows.map(r => {
      const mods = r.stat_modifiers as Record<string, { hp: number; atk: number; def: number }> | null
      const type = r.is_boss ? 'boss' : r.is_elite ? 'elite' : 'common'
      const m = mods?.[type] ?? { hp: 100, atk: 100, def: 100 }
      const base = mapMonster(r)
      return {
        ...base,
        baseHp:  Math.round(Number(r.base_hp)  * m.hp  / 100),
        baseAtk: Math.round(Number(r.base_atk) * m.atk / 100),
        baseDef: Math.round(Number(r.base_def) * m.def / 100),
      }
    }))
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
    isElite:   r.is_elite,
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
    enemyPool:           r.enemy_pool ?? [],
    bossId:              r.boss_id ?? '',
    eliteId:             r.elite_id ?? null,
    minKillsBeforeBoss:  r.min_kills_boss,
    minKillsBeforeElite: r.min_kills_elite ?? 15,
    bossSpawnChance:     parseFloat(String(r.boss_spawn_chance)),
    normalRarityWeights: r.rarity_weights ?? {},
    bossRarity:         r.boss_rarity,
    theme: {
      gradient:    r.gradient,
      accentColor: r.accent_color,
    },
    sortOrder:          r.sort_order,
    backgroundUrl:      r.background_url      ?? null,
    backgroundPosition: r.background_position ?? 'center',
    statModifiers:      r.stat_modifiers ?? {
      common: { hp: 100, atk: 100, def: 100 },
      elite:  { hp: 100, atk: 100, def: 100 },
      boss:   { hp: 100, atk: 100, def: 100 },
    },
  }
}

// ── Craft XP Config (leitura para gameplay) ────────────────────────
const DEFAULT_CRAFT_XP_CONFIG = {
  forja:      [10, 25, 50, 90, 140, 200, 280, 380, 520, 700],
  alquimia:   [12, 30, 60, 110, 160, 230, 320, 430, 580, 750],
  inscricao:  [8,  20, 40, 70,  110, 160, 230, 310, 420, 580],
  tierLevels: [1,  11, 21, 31,  41,  51,  61,  71,  81,  91],
}

router.get('/craft-xp-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='craft_xp_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_CRAFT_XP_CONFIG)
    try { return res.json({ ...DEFAULT_CRAFT_XP_CONFIG, ...JSON.parse(rows[0].value as string) }) }
    catch { return res.json(DEFAULT_CRAFT_XP_CONFIG) }
  } catch {
    res.json(DEFAULT_CRAFT_XP_CONFIG)
  }
})

// ── Forge Config (leitura para gameplay) ───────────────────────────
router.get('/forge-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='forge_config'"
    )
    if (!rows.length || !rows[0].value) return res.json({ upgrade: {}, ascension: [] })
    try {
      return res.json(JSON.parse(rows[0].value as string))
    } catch {
      return res.json({ upgrade: {}, ascension: [] })
    }
  } catch {
    res.json({ upgrade: {}, ascension: [] })
  }
})

// ── Stat Config (leitura para gameplay) ───────────────────────────
const DEFAULT_STAT_CONFIG = {
  atkPerStr: 4, baseSpeed: 2.0, speedPerAgi: 0.03, minAgiSpeed: 0.5,
  hpPerVit: 20, defPerDef: 3,
  critPerPer: 5, baseCritDmgPct: 100, critChancePerLuck: 0.5,
  weaponSpeedDiv: 200, minAttackSpeed: 0.25,
  initialStrength: 5, initialAgility: 5, initialVitality: 5,
  initialDefense: 3, initialPerception: 3,
  attrPointsPerBreakthrough: 3,
  luckGainMin: 1, luckGainMax: 3,
}

router.get('/stat-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='stat_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_STAT_CONFIG)
    try { return res.json(JSON.parse(rows[0].value as string)) }
    catch { return res.json(DEFAULT_STAT_CONFIG) }
  } catch {
    res.json(DEFAULT_STAT_CONFIG)
  }
})

const DEFAULT_DISMANTLE_CONFIG = {
  baseRate: 0.40, maxRate: 0.70, levelBonus: 0.006,
  fallbackItemId: 'spiritual_essence', fallbackQtyPerTier: 2,
}

router.get('/dismantle-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='dismantle_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_DISMANTLE_CONFIG)
    try { return res.json({ ...DEFAULT_DISMANTLE_CONFIG, ...JSON.parse(rows[0].value as string) }) }
    catch { return res.json(DEFAULT_DISMANTLE_CONFIG) }
  } catch {
    res.json(DEFAULT_DISMANTLE_CONFIG)
  }
})

// ── Stack Config (leitura para gameplay) ───────────────────────────
export const DEFAULT_STACK_CONFIG = {
  material: 9999,
  pill:     99,
  talisman: 99,
}

router.get('/stack-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='stack_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_STACK_CONFIG)
    try { return res.json({ ...DEFAULT_STACK_CONFIG, ...JSON.parse(rows[0].value as string) }) }
    catch { return res.json(DEFAULT_STACK_CONFIG) }
  } catch {
    res.json(DEFAULT_STACK_CONFIG)
  }
})

// ── Skill XP Config (leitura para gameplay) ───────────────────────
const DEFAULT_SKILL_XP_CONFIG = { baseXp: 50, multiplier: 1.3 }

router.get('/skill-xp-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='skill_xp_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_SKILL_XP_CONFIG)
    try { return res.json({ ...DEFAULT_SKILL_XP_CONFIG, ...JSON.parse(rows[0].value as string) }) }
    catch { return res.json(DEFAULT_SKILL_XP_CONFIG) }
  } catch {
    res.json(DEFAULT_SKILL_XP_CONFIG)
  }
})

// ── Qi Rate Config (leitura para gameplay) ───────────────────────
export const DEFAULT_QI_RATE_CONFIG: Record<string, Record<string, number>> = {
  qi_refining:           { initial: 3,     middle: 4,     advanced: 5,     peak: 7     },
  foundation:            { initial: 10,    middle: 15,    advanced: 20,    peak: 28    },
  golden_core:           { initial: 40,    middle: 55,    advanced: 75,    peak: 100   },
  nascent_soul:          { initial: 140,   middle: 190,   advanced: 260,   peak: 350   },
  spirit_transformation: { initial: 480,   middle: 650,   advanced: 880,   peak: 1200  },
  unification:           { initial: 1600,  middle: 2200,  advanced: 3000,  peak: 4000  },
  ascension:             { initial: 5500,  middle: 7500,  advanced: 10000, peak: 14000 },
  immortal:              { initial: 20000, middle: 28000, advanced: 38000, peak: 50000 },
}

router.get('/qi-rate-config', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM game_settings WHERE key='qi_rate_config'"
    )
    if (!rows.length || !rows[0].value) return res.json(DEFAULT_QI_RATE_CONFIG)
    try { return res.json({ ...DEFAULT_QI_RATE_CONFIG, ...JSON.parse(rows[0].value as string) }) }
    catch { return res.json(DEFAULT_QI_RATE_CONFIG) }
  } catch {
    res.json(DEFAULT_QI_RATE_CONFIG)
  }
})

export default router
