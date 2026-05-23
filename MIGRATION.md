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

### ✅ Fase 2 — Breakthrough / Progressão de Reino
**Status:** concluída (v0.22.0 — 2026-05-23)  
**Depende de:** Fase 1 (Qi calculado server-side)

**O que mudou:**
- Novo endpoint `POST /api/characters/:id/breakthrough` — valida Qi, itens e caminho server-side, avança realm atomicamente.
- Novo endpoint `POST /api/characters/:id/spend-attribute` — valida e aplica gasto de ponto server-side.
- Novo campo `attribute_points` no banco; adicionado via migration em runtime.
- `sync.ts` removeu realm, stats base e luck do payload — só HP, gold, kills e blobs JSONB restam.
- `stat_config.attrPointsPerBreakthrough` e `breakthroughPaths` do admin são lidos pelo servidor durante rompimento.

---

### ✅ Fase 3 — Crafting / Forja / Ascensão
**Status:** concluída (v0.23.0 — 2026-05-23)  
**Depende de:** nada (independente)

**Novos endpoints (server/src/routes/crafting.ts):**
- `POST /api/characters/:id/craft` → `{ recipeId, quantity }`
- `POST /api/characters/:id/forge/upgrade` → `{ instanceId }`
- `POST /api/characters/:id/forge/ascend` → `{ mainId, sacrificeIds[] }`
- `POST /api/characters/:id/dismantle` → `{ instanceIds[] }`
- `POST /api/characters/:id/repair` → `{ instanceId }`

**O que mudou:**
- Todas as operações de item são transações atômicas no servidor (FOR UPDATE).
- Lógica de craft (chance de falha, bônus de qualidade, XP de habilidade) calculada server-side.
- Dismantle calcula recuperação de materiais incluindo upgrades e ascensões do item.
- Cliente envia intenção → servidor valida e executa → devolve inventário + estado atualizado.
- `syncToServer()` não é mais chamado após operações de forja/craft/desmonte.

---

### ✅ Fase 4 — Combate e Drops
**Status:** concluída (v0.24.0 — 2026-05-23)  
**Depende de:** nada (independente)

**Abordagem — "Combat Batch":**
- Cliente exibe o combate normalmente (display local para UX fluida).
- A cada 10 kills ou ao sair do bioma, envia:
  `POST /api/characters/:id/combat/resolve` → `{ biomeId, kills, elapsedMs }`
- Servidor valida plausibilidade dos kills dado stats e tempo, gera drops server-side,
  atualiza inventário e retorna.

**O que mudou:**
- Novo endpoint `POST /api/characters/:id/combat/resolve` (server/src/routes/combat.ts).
- Servidor valida bioma, filtra kills fora do pool do bioma, capa por tempo (4 kills/s).
- Drops rolados server-side com a mesma lógica de luck do cliente.
- `addItem()` removido do kill handler — drops não são mais adicionados localmente.
- `syncToServer()` omite `inventory`, `spirit_gold`, `total_kills`, `bestiary` durante combate ativo.
- Flush automático a cada 10 kills ou ao fugir/morrer.

---

### ✅ Fase 5 — Remoção do syncToServer() genérico
**Status:** concluída (v0.25.0 — 2026-05-23)  
**Depende de:** todas as fases anteriores

**O que mudou:**
- `syncToServer()` agora envia apenas `hp_current`, `hp_max`, `skills` (activeBuffs + meditationEndsAt) e `last_played_at`.
- `spirit_gold`, `total_kills`, `inventory`, `bestiary` removidos permanentemente do sync — todos gerenciados por endpoints dedicados.
- `inCombat` check removido (não é mais necessário).
- Imports de `useInventoryStore`, `useBestiaryStore`, `useCombatStore` removidos de sync.ts.
- Stores do cliente passam a ser cache de leitura para campos críticos; servidor é fonte de verdade.

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
