import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback_dev_secret'

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
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' })
  }
}

export function signToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
}
