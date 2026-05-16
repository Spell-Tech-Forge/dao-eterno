import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Limpa saves incompatíveis com versões anteriores (game state only — auth tokens are kept)
const SAVE_VERSION = '5'
if (localStorage.getItem('dao-eterno-version') !== SAVE_VERSION) {
  ;['dao-eterno-player', 'dao-eterno-inventory', 'dao-eterno-skills', 'dao-eterno-bestiary'].forEach(k =>
    localStorage.removeItem(k)
  )
  localStorage.setItem('dao-eterno-version', SAVE_VERSION)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
