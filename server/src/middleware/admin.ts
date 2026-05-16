import type { Request, Response, NextFunction } from 'express'
import { pool } from '../db'

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }
  const result = await pool.query<{ is_admin: boolean }>(
    'SELECT is_admin FROM users WHERE id = $1',
    [req.userId]
  )
  if (!result.rows[0]?.is_admin) {
    res.status(403).json({ error: 'Acesso negado. Área restrita ao administrador.' })
    return
  }
  next()
}
