import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import characterRoutes from './routes/characters'
import legendRoutes from './routes/legends'
import rankingRoutes from './routes/ranking'
import adminRoutes from './routes/admin'
import uploadRoutes from './routes/upload'
import marketRoutes from './routes/market'
import gameRoutes from './routes/game'
import { pool } from './db'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false)
    : ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}))
app.use(express.json({ limit: '512kb' }))

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Auth: 20 tentativas por 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// API geral: 300 req/min por IP (bloqueia scripts de automação)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
})

// Admin: 60 req/min (mais restrito)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Limite de requisições admin atingido.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Save de personagem: 30 req/min por IP (auto-save a cada 30s + manual)
const saveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Salvamentos excessivos. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', apiLimiter)
app.use('/api/auth',       authLimiter,  authRoutes)
app.use('/api/characters', saveLimiter,  characterRoutes)
app.use('/api/legends',    legendRoutes)
app.use('/api/ranking',    rankingRoutes)
app.use('/api/admin',      adminLimiter, adminRoutes)
app.use('/api/upload',     uploadRoutes)
app.use('/api/market',     marketRoutes)
app.use('/api/game',       gameRoutes)

// Serve sprite uploads
const uploadsPath = path.join(__dirname, '../../uploads')
app.use('/uploads', express.static(uploadsPath))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// Endpoint público — configurações do jogo (tamanho de sprites, etc.)
app.get('/api/settings', async (_req, res) => {
  try {
    const result = await pool.query<{ key: string; value: string }>('SELECT key, value FROM game_settings')
    const settings: Record<string, string> = {}
    result.rows.forEach(r => { settings[r.key] = r.value })
    return res.json(settings)
  } catch {
    return res.json({})
  }
})

// Endpoint público — sprites de itens e monstros para todos os jogadores
app.get('/api/sprites', async (_req, res) => {
  try {
    const [items, monsters] = await Promise.all([
      pool.query<{ id: string; sprite_url: string }>(
        'SELECT id, sprite_url FROM game_items WHERE sprite_url IS NOT NULL'
      ),
      pool.query<{ id: string; sprite_url: string }>(
        'SELECT id, sprite_url FROM game_monsters WHERE sprite_url IS NOT NULL'
      ),
    ])
    const itemMap: Record<string, string> = {}
    const monsterMap: Record<string, string> = {}
    items.rows.forEach(r => { itemMap[r.id] = r.sprite_url })
    monsters.rows.forEach(r => { monsterMap[r.id] = r.sprite_url })
    return res.json({ items: itemMap, monsters: monsterMap })
  } catch {
    return res.json({ items: {}, monsters: {} })
  }
})

// Serve frontend build in production
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function runMigrations() {
  try {
    await pool.query(`ALTER TABLE game_items ADD COLUMN IF NOT EXISTS tier integer NOT NULL DEFAULT 1`)
    console.log('✓ Migration: game_items.tier OK')
  } catch (e) {
    console.warn('Migration warning (game_items.tier):', e instanceof Error ? e.message : e)
  }
  try {
    await pool.query(`ALTER TABLE game_monsters ADD COLUMN IF NOT EXISTS required_realm varchar(50) DEFAULT 'qi_refining'`)
    console.log('✓ Migration: game_monsters.required_realm OK')
  } catch (e) {
    console.warn('Migration warning (game_monsters.required_realm):', e instanceof Error ? e.message : e)
  }
}

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🐉 Dao Eterno Server → http://localhost:${PORT}`)
  })
})
