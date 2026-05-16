import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'

const router = Router()
router.use(requireAuth)
router.use(requireAdmin)

const UPLOADS_ROOT = path.join(__dirname, '../../../uploads')

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = (req.query.type as string) === 'monster' ? 'monsters' : 'items'
    const dir = path.join(UPLOADS_ROOT, type)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const id  = (req.query.id as string | undefined) ?? Date.now().toString()
    const ext = path.extname(file.originalname).toLowerCase() || '.png'
    cb(null, `${id}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (_req, file, cb) => {
    if (/image\/(png|webp|gif)/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas PNG, WebP ou GIF são aceitos.'))
  },
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado.' })
    return
  }
  const type    = (req.query.type as string) === 'monster' ? 'monsters' : 'items'
  const url     = `/uploads/${type}/${req.file.filename}`
  res.json({ url })
})

export default router
