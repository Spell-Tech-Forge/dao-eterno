// Tick de 1s para skills passivas (Meditação → gera Qi, etc.)
// Comunicação via postMessage para o thread principal

interface TickMessage {
  type: 'tick'
  delta: number
}

let lastTick = Date.now()

setInterval(() => {
  const now = Date.now()
  const delta = now - lastTick
  lastTick = now
  self.postMessage({ type: 'tick', delta } satisfies TickMessage)
}, 1000)
