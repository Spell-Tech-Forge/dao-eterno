import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// ── Captura e loga o acesso ───────────────────────────────────────────────────
async function logHit(
  ip: string,
  method: string,
  path: string,
  body: unknown,
  userAgent: string | undefined,
  authToken: string | undefined,
) {
  const preview = authToken ? authToken.slice(0, 32) + '...' : null
  console.warn(`[HONEYPOT] ${method} ${path} — IP: ${ip} UA: ${userAgent ?? '-'} AUTH: ${preview ?? 'none'}`)
  try {
    await pool.query(
      `INSERT INTO honeypot_logs (ip, method, path, body, user_agent, auth_token)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ip,
        method,
        path,
        body && typeof body === 'object' && Object.keys(body as object).length ? JSON.stringify(body) : null,
        userAgent ?? null,
        preview,
      ]
    )
  } catch { /* não interrompe a resposta */ }
}

function hit(path: string) {
  return async (req: import('express').Request, res: import('express').Response) => {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? 'unknown'
    const auth = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '')
    await logHit(ip, req.method, path, req.body, req.headers['user-agent'], auth)
    // Resposta deliberadamente lenta (500ms) e vaga — não revela que é honeypot
    await new Promise(r => setTimeout(r, 500))
    res.status(403).json({ error: 'Acesso negado.' })
  }
}

// ── Endpoints falsos ──────────────────────────────────────────────────────────
// Nomes que atacantes/scanners costumam tentar

router.all('/internal/config',   hit('/internal/config'))
router.all('/internal/execute',  hit('/internal/execute'))
router.all('/internal/db',       hit('/internal/db'))
router.all('/debug/users',       hit('/debug/users'))
router.all('/debug/dump',        hit('/debug/dump'))
router.all('/admin/reset',       hit('/admin/reset'))
router.all('/admin/shell',       hit('/admin/shell'))
router.all('/backup/latest',     hit('/backup/latest'))

export default router
