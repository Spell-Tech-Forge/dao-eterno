function getToken(): string | null {
  return localStorage.getItem('dao_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data: unknown = await res.json()

  if (!res.ok) {
    const body = data as Record<string, unknown>
    if (res.status === 503 && body.maintenance) {
      window.dispatchEvent(new CustomEvent('dao:maintenance', { detail: { message: body.error } }))
    }
    const msg = (body.error as string | undefined) ?? `Erro HTTP ${res.status}`
    throw new Error(msg)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) =>
    request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
