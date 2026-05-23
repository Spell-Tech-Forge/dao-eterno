# Plano de Migração — Client → Server Authoritative

**Objetivo:** Mover toda lógica de jogo para o servidor, eliminando a possibilidade de
edição de estado via DevTools, intercepção de requests ou manipulação de stores.

**Data de início:** 2026-05-23  
**Versão base:** v0.20.3

---

## Arquitetura Atual (client-authoritative)

```
Cliente (browser)
├── Zustand stores  ← fonte de verdade do jogo
├── Web Worker      ← tick de 1s, roda o loop do jogo
└── syncToServer()  ← a cada 30s envia TUDO pro servidor

Servidor
└── Salva o que o cliente mandou (com clamping básico)
```

## Arquitetura Final (server-authoritative)

```
Cliente (browser)
├── UI / display        ← só renderiza estado
├── Interpolação local  ← animações fluidas sem latência
└── Ações              ← envia "o que o jogador fez"

Servidor
├── Processa ações      ← fonte de verdade
├── Calcula resultados  ← drops, crafts, Qi, progressão
└── Retorna novo estado ← cliente substitui pelo que o servidor diz
```

---

## Fases

### ✅ Fase 1 — Meditação / Cultivação
**Status:** concluída (v0.21.0 — 2026-05-23)  
**Versão alvo:** v0.21.0  
**Esforço estimado:** 2–3 dias

**O que muda:**
- Servidor calcula `qi_current` e `cultivation_power` com base em `meditationEndsAt`
  salvo no banco e no tempo decorrido — cliente nunca mais manda esses campos.
- Novo endpoint `POST /api/characters/:id/meditate` → `{ minutes }`.
- Frontend mantém animação local (interpolação), mas substitui pelo valor do servidor
  a cada resposta.

**Lógica no servidor:**
```
elapsed = now - last_played_at (ou created_at se null)
meditation_ms = clamp(meditationEndsAt - last_played_at, 0, elapsed)
qi_gain = min(qi_max - qi_current, floor(meditation_ms / 1000 × 3))
qi_current += qi_gain
cultivation_power += qi_gain
```

**Arquivos afetados:**
- `server/src/routes/characters.ts` — GET e PUT calculam Qi; novo POST /meditate
- `src/components/meditation/MeditationScreen.tsx` — chama novo endpoint
- `src/hooks/useGameLoop.ts` — gainQi vira apenas interpolação visual
- `src/lib/sync.ts` — remove qi_current e cultivation_power do payload

---

### ⬜ Fase 2 — Breakthrough / Progressão de Reino
**Status:** pendente  
**Depende de:** Fase 1 (Qi calculado server-side)

**O que muda:**
- Novo endpoint `POST /api/characters/:id/breakthrough`.
- Servidor valida: `qi_current >= qi_max`, itens necessários no inventário.
- Servidor avança realm, zera Qi, consome itens, retorna estado completo.

---

### ⬜ Fase 3 — Crafting / Forja / Ascensão
**Status:** pendente  
**Depende de:** nada (independente)

**Novos endpoints:**
- `POST /api/characters/:id/craft` → `{ recipeId, quantity }`
- `POST /api/characters/:id/forge/upgrade` → `{ instanceId }`
- `POST /api/characters/:id/forge/ascend` → `{ mainId, sacrificeIds[] }`
- `POST /api/characters/:id/dismantle` → `{ instanceIds[] }`

**O que muda:**
- Todas as operações de item viram transações atômicas no servidor.
- Cliente envia intenção → servidor valida materiais/gold → executa → devolve inventário.

---

### ⬜ Fase 4 — Combate e Drops
**Status:** pendente  
**Depende de:** nada (independente)

**Abordagem — "Combat Batch":**
- Cliente exibe o combate normalmente (display local para UX fluida).
- A cada N kills ou ao sair do bioma, envia:
  `POST /api/characters/:id/combat/resolve` → `{ biomeId, kills, elapsedMs }`
- Servidor valida plausibilidade dos kills dado stats e tempo, gera drops server-side,
  atualiza inventário e retorna.

---

### ⬜ Fase 5 — Remoção do syncToServer() genérico
**Status:** pendente  
**Depende de:** todas as fases anteriores

**O que muda:**
- `syncToServer()` vira apenas um heartbeat — só atualiza `last_played_at`.
- Todos os campos críticos já são gerenciados por endpoints específicos.
- Stores do cliente passam a ser cache de leitura, não fonte de escrita.

---

## Dependências entre fases

```
Fase 1 (Meditação)
    └── Fase 2 (Breakthrough)

Fase 3 (Crafting/Forja)  ← independente

Fase 4 (Combate/Drops)   ← independente

Fase 5 (Cleanup) ← depende de todas
```

## Ordem de execução recomendada

| # | Fase | Esforço | Proteção |
|---|------|---------|----------|
| 1 | Meditação | baixo | `cultivation_power` inviolável |
| 2 | Crafting / Forja | médio | economia toda protegida |
| 3 | Breakthrough | baixo | progressão de reino protegida |
| 4 | Combate + Drops | alto | drops e kills protegidos |
| 5 | Remoção sync genérico | trivial | cleanup final |
