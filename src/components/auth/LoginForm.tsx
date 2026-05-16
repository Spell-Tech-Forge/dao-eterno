import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginForm() {
  const login = useAuthStore(s => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="cultivador@dao.com"
        autoComplete="email"
        required
      />
      <Input
        label="Senha"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <p className="text-sm text-red-400 text-center py-2 border border-red-900/60 bg-red-950/30">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="mt-1 w-full justify-center">
        Entrar no Caminho
      </Button>
    </form>
  )
}
