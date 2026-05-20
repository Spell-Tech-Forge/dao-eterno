import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function versionPlugin(): Plugin {
  const buildTime = Date.now()
  return {
    name: 'generate-version',
    buildStart() {
      const publicDir = resolve(__dirname, 'public')
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
      fs.writeFileSync(resolve(publicDir, 'version.json'), JSON.stringify({ buildTime }))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin()],
  worker: { format: 'es' },
  preview: { allowedHosts: true },
  server: {
    proxy: {
      '/api':     'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
