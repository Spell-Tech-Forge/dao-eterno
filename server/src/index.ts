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

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
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
