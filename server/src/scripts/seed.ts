/**
 * Seed script — popula itens, monstros e receitas, e cria/atualiza o usuário admin de teste.
 * Uso: cd server && npx tsx src/scripts/seed.ts
 */
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Importa os dados do frontend (tsx resolve o TypeScript sem compilar)
import { ITEM_DEFS }    from '../../../src/data/items'
import { MONSTER_DEFS } from '../../../src/data/monsters'
import { RECIPE_DEFS }  from '../../../src/data/recipes'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ── Admin de teste ────────────────────────────────────────────────────────────

const ADMIN = {
  username: 'Admin',
  email:    'admin@dao.com',
  password: 'Admin@1234',
}

async function seedAdmin() {
  const hash = await bcrypt.hash(ADMIN.password, 12)
  await pool.query(`
    INSERT INTO users (username, email, password_hash, is_admin)
    VALUES ($1, $2, $3, true)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          is_admin = true
  `, [ADMIN.username, ADMIN.email, hash])
  console.log(`  ✓ Admin criado: ${ADMIN.email} / ${ADMIN.password}`)
}

// ── Itens ─────────────────────────────────────────────────────────────────────

async function seedItems() {
  const items = Object.values(ITEM_DEFS)
  let inserted = 0
  for (const item of items) {
    const { rowCount } = await pool.query(`
      INSERT INTO game_items (id, name, emoji, type, rarity, description, stats, stackable)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO NOTHING
    `, [
      item.id, item.name, item.emoji, item.type, item.rarity,
      item.description ?? '', item.stats ?? {}, item.stackable ?? false,
    ])
    if (rowCount) inserted++
  }
  console.log(`  ✓ Itens: ${inserted} inseridos de ${items.length} (duplicatas ignoradas)`)
}

// ── Monstros ──────────────────────────────────────────────────────────────────

async function seedMonsters() {
  const monsters = Object.values(MONSTER_DEFS)
  let inserted = 0
  for (const m of monsters) {
    const drops = m.dropTable.map(d => ({
      itemId: d.itemId, chance: d.chance,
      quantityMin: d.quantityMin, quantityMax: d.quantityMax,
    }))
    const { rowCount } = await pool.query(`
      INSERT INTO game_monsters
        (id, name, emoji, level_min, level_max, rarity, biome_id, is_boss,
         base_hp, base_atk, base_def, speed, qi_reward,
         gold_reward_min, gold_reward_max, drop_table)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO NOTHING
    `, [
      m.id, m.name, m.emoji, m.levelMin, m.levelMax, m.rarity,
      m.biomeId, m.isBoss, m.baseHp, m.baseAtk, m.baseDef, m.speed,
      m.qiReward, m.goldReward.min, m.goldReward.max, JSON.stringify(drops),
    ])
    if (rowCount) inserted++
  }
  console.log(`  ✓ Monstros: ${inserted} inseridos de ${monsters.length} (duplicatas ignoradas)`)
}

// ── Receitas ──────────────────────────────────────────────────────────────────

async function seedRecipes() {
  const recipes = Object.values(RECIPE_DEFS)
  let inserted = 0
  for (const r of recipes) {
    const { rowCount } = await pool.query(`
      INSERT INTO game_recipes
        (id, name, category, output_item_id, output_quantity, required_tier, ingredients)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO NOTHING
    `, [
      r.id, r.name, r.category, r.outputItemId, r.outputQuantity,
      r.requiredTier, JSON.stringify(r.ingredients),
    ])
    if (rowCount) inserted++
  }
  console.log(`  ✓ Receitas: ${inserted} inseridas de ${recipes.length} (duplicatas ignoradas)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Dao Eterno — Seed\n')
  try {
    await seedAdmin()
    await seedItems()
    await seedMonsters()
    await seedRecipes()
    console.log('\n✅ Seed concluído!\n')
  } catch (err) {
    console.error('\n❌ Erro no seed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
