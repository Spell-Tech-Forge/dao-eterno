import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function RegisterForm() {
  const register = useAuthStore(s => s.register)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (username.length < 3) return 'Nome deve ter ao menos 3 caracteres.'
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Nome: apenas letras, números, - e _.'
    if (password.length < 8) return 'Senha deve ter ao menos 8 caracteres.'
    if (password !== confirm) return 'As senhas não coincidem.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome de Cultivador"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="SenhorDoCultivo"
        maxLength={20}
        required
      />
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
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        required
      />
      <Input
        label="Confirmar Senha"
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />

      {error && (
        <p className="text-sm text-red-400 text-center py-2 border border-red-900/60 bg-red-950/30">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        size="lg"
        variant="jade"
        className="mt-1 w-full justify-center"
      >
        Iniciar o Caminho
      </Button>
    </form>
  )
}
