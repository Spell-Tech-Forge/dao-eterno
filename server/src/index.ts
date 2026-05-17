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
import { pool } from './db'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true)
    : ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/legends', legendRoutes)
app.use('/api/ranking', rankingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/market', marketRoutes)

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

app.listen(PORT, () => {
  console.log(`🐉 Dao Eterno Server → http://localhost:${PORT}`)
})
