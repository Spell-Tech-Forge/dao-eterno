import { create } from 'zustand'
import { api } from '../lib/api'
import type { AuthUser } from '../types/server'

interface ActiveCharacter {
  id: number
  name: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  activeCharacter: ActiveCharacter | null
  loading: boolean
  loadFromStorage: () => void
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  signOut: () => void
  setActiveCharacter: (char: ActiveCharacter | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  activeCharacter: null,
  loading: true,

  loadFromStorage: () => {
    const token = localStorage.getItem('dao_token')
    const userStr = localStorage.getItem('dao_user')
    const charStr = localStorage.getItem('dao_active_char')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser
        const activeCharacter = charStr ? (JSON.parse(charStr) as ActiveCharacter) : null
        set({ user, token, activeCharacter, loading: false })
        return
      } catch {
        // storage corrupted, clear it
        localStorage.removeItem('dao_token')
        localStorage.removeItem('dao_user')
        localStorage.removeItem('dao_active_char')
      }
    }
    set({ loading: false })
  },

  login: async (email, password) => {
    const data = await api.post<{ token: string; user: AuthUser }>(
      '/api/auth/login', { email, password }
    )
    localStorage.setItem('dao_token', data.token)
    localStorage.setItem('dao_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token })
  },

  register: async (username, email, password) => {
    const data = await api.post<{ token: string; user: AuthUser }>(
      '/api/auth/register', { username, email, password }
    )
    localStorage.setItem('dao_token', data.token)
    localStorage.setItem('dao_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token })
  },

  signOut: () => {
    localStorage.removeItem('dao_token')
    localStorage.removeItem('dao_user')
    localStorage.removeItem('dao_active_char')
    set({ user: null, token: null, activeCharacter: null })
  },

  setActiveCharacter: (char) => {
    if (char) {
      localStorage.setItem('dao_active_char', JSON.stringify(char))
    } else {
      localStorage.removeItem('dao_active_char')
    }
    set({ activeCharacter: char })
  },
}))
