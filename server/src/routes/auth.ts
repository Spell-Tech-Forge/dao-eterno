import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { signToken } from '../middleware/auth'
import type { DbUser } from '../types'

const router = Router()
const SALT_ROUNDS = 12

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body as Record<string, string>

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Nome deve ter entre 3 e 20 caracteres.' })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Nome inválido. Use apenas letras, números, - e _.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres.' })
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'E-mail ou nome de cultivador já em uso.' })
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await pool.query<DbUser>(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email.toLowerCase(), password_hash]
    )

    const user = result.rows[0]
    const token = signToken(user.id, user.username)

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as Record<string, string>

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
    }

    const result = await pool.query<DbUser>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const token = signToken(user.id, user.username)

    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

export default router
