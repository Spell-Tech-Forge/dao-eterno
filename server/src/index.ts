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

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

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

// Serve frontend build in production
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🐉 Dao Eterno Server → http://localhost:${PORT}`)
})
