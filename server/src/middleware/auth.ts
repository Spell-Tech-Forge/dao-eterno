import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

const KNOWN_WEAK = new Set([
  'fallback_dev_secret',
  'uma_chave_secreta_longa_e_aleatoria_mude_isso',
  'secret',
  'jwt_secret',
  'changeme',
])

if (!JWT_SECRET) {
  console.error('\n[FATAL] JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar o servidor.\n')
  process.exit(1)
}
if (JWT_SECRET.length < 32 || KNOWN_WEAK.has(JWT_SECRET)) {
  console.error('\n[FATAL] JWT_SECRET inválido (muito curto ou valor de exemplo). Use uma chave aleatória com ≥32 caracteres.\n')
  process.exit(1)
}

interface JwtPayload {
  userId: number
  username: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido.' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' })
  }
}

export function signToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET!, { expiresIn: '7d' })
}
