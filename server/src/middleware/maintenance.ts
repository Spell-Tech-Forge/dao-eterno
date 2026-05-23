import type { Request, Response, NextFunction } from 'express'
import { pool } from '../db'

interface MaintenanceCache {
  enabled: boolean
  message: string
  expiresAt: number
}

let cache: MaintenanceCache = { enabled: false, message: '', expiresAt: 0 }

async function getMaintenanceStatus(): Promise<{ enabled: boolean; message: string }> {
  const now = Date.now()
  if (now < cache.expiresAt) return cache

  const { rows } = await pool.query<{ key: string; value: string }>(
    "SELECT key, value FROM game_settings WHERE key IN ('maintenance_mode','maintenance_message')"
  )
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })

  cache = {
    enabled: map['maintenance_mode'] === 'true',
    message: map['maintenance_message'] ?? 'O servidor está em manutenção. Voltamos em breve!',
    expiresAt: now + 10_000,
  }
  return cache
}

export function invalidateMaintenanceCache(): void {
  cache.expiresAt = 0
}

export async function requireNoMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await getMaintenanceStatus()
    if (!status.enabled) { next(); return }

    if (req.userId) {
      const { rows } = await pool.query<{ is_admin: boolean }>(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.userId]
      )
      if (rows[0]?.is_admin) { next(); return }
    }

    res.status(503).json({ error: status.message, maintenance: true })
  } catch {
    next()
  }
}
