# Design System — Dao Eterno

Você é o guardião do design system do jogo **Dao Eterno** — um idle RPG xianxia de cultivo, interface web escura e atmosférica. Use este documento como referência canônica ao criar ou revisar qualquer componente de UI.

---

## 1. Fundação Visual

**Estética geral:** Dark fantasy oriental. Fundo quase preto com tons roxos/azulados profundos, acentos em âmbar/ouro para ações principais e jade/teal para ações secundárias positivas. Borda e gradientes sutis criam profundidade.

**Fonte decorativa:** `Cinzel` (Google Fonts) — usar apenas em títulos, botões e labels de destaque. Classe Tailwind: `font-cinzel`. Corpo: `system-ui`.

---

## 2. Paleta de Cores (tokens CSS via `@theme` em `index.css`)

| Token              | Hex         | Uso                                      |
|--------------------|-------------|------------------------------------------|
| `--color-bg`       | `#0f0f17`   | Fundo da página                          |
| `--color-surface`  | `#1a1a2e`   | Cards, painéis, modais                   |
| `--color-surface-2`| `#252542`   | Superfícies elevadas dentro de cards     |
| `--color-border`   | `#2a2a4e`   | Bordas padrão                            |
| `--color-text`     | `#e2e8f0`   | Texto principal                          |
| `--color-muted`    | `#94a3b8`   | Texto secundário, labels, placeholders   |
| `--color-gold`     | `#f59e0b`   | Ação principal, destaques, ouro          |
| `--color-jade`     | `#4a9e7f`   | Ação positiva secundária (jade/teal)     |
| `--color-danger`   | `#ef4444`   | Ação destrutiva, dano                    |
| `--color-qi`       | `#a855f7`   | Barra de Qi, mana espiritual             |
| `--color-xp`       | `#60a5fa`   | Experiência, progresso                   |
| `--color-hp`       | `#22c55e`   | Vida, cura                               |

### Raridades (definidas em `src/types/index.ts` como `RARITY_COLORS`)

| Raridade    | Hex         | Tailwind equiv.   |
|-------------|-------------|-------------------|
| common      | `#94a3b8`   | slate-400         |
| spiritual   | `#60a5fa`   | blue-400          |
| rare        | `#f59e0b`   | amber-400         |
| ancient     | `#f97316`   | orange-400        |
| legendary   | `#ef4444`   | red-400           |
| heirloom    | `#4a9e7f`   | jade              |

Alfa sufixes convencionais: `color + '22'` = fundo selecionado; `color + '0d'` = fundo normal; `color + '55'` = estado inativo; `color + '88'`/`'99'` = borda semi-opaca.

---

## 3. Componentes UI Base (`src/components/ui/`)

### `<Button>`
```tsx
<Button variant="gold" | "jade" | "ghost" | "danger" size="sm" | "md" | "lg" loading={bool}>
```
- Borda quadrada (sem `rounded` por padrão) — borda fina de 1px.
- `active:scale-95` em todos os variantes.
- `font-cinzel tracking-wider`.
- Spinner inline quando `loading`.

### `<Input>`
```tsx
<Input label="Label" error="msg" placeholder="..." />
```
- `bg-slate-900 border-slate-700` normal; `focus:border-amber-700 focus:ring-amber-950` no foco.
- Label: `text-xs text-slate-500 tracking-widest uppercase`.
- Sem `rounded` — cantos retos, coerente com o tema.

### `<TabBar>`
- Aba ativa: `text-amber-400 border-amber-600 bg-amber-950/10 border-b-2`.
- Aba inativa: `text-slate-500 border-transparent`.
- Suporta `icon` (emoji/texto curto) antes do label.

### `<Modal>`
- Overlay: `bg-black/70 backdrop-blur-sm`.
- Container: `bg-slate-900 border border-slate-700 shadow-2xl` — sem `rounded`.
- Header: título em `text-amber-400 text-sm tracking-widest uppercase`; botão `×` à direita.
- Tamanhos: `sm` (max-w-sm) / `md` (max-w-md) / `lg` (max-w-lg).

### `<LoadingSpinner>`
- Spinner centralizado com texto opcional (ex: `"Consultando registros..."`).

---

## 4. Tela de Auth (`AuthPage` + `LoginForm` + `RegisterForm`)

**Layout:** `min-h-screen bg-slate-950 flex items-center justify-center`.

**Logo:**
```
道 永恆          ← text-5xl font-bold tracking-[0.3em] text-amber-500/80 font-serif
                   textShadow: '0 0 40px rgba(217,119,6,0.3)'
Dao Eterno       ← text-xs text-slate-600 tracking-[0.5em] uppercase
─── ✦ ───        ← divisor com gradiente amber-900/60
```

**Card:** `bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60` — sem border-radius.

**Textos flavor:** `"O Dao aguarda os dignos."`, `"Entrar no Caminho"`, `"Iniciar o Caminho"`, `"Cultivador"`.

**Regras de validação de cadastro:** nome ≥ 3 chars, apenas `[a-zA-Z0-9_-]`; senha ≥ 8 chars.

---

## 5. Tela de Seleção de Personagem (`CharacterSelectPage`)

**Header fixo (sticky):** `border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm`.
- Logo 道 永恆 pequeno à esquerda + username; botão Sair à direita.

**Título central:** `"Portal do Cultivador"` com divisor `─── ✦ ───`.

**CharacterCard:**
- `bg-slate-800/60 border border-slate-700` sem rounded.
- Cor do realm no nome do estágio (mapa `REALM_COLORS`).
- Grid de stats 2×2: HP (vermelho), Qi (azul), Afinidade, Ouro Esp. (âmbar).
- Botão primário: `variant="gold"` → "Cultivar"; botão danger `✕` para deletar.

**Slot vazio:** `border-2 border-dashed border-slate-700` + `+` grande.

**Estado vazio:** ícone `⚔` em `opacity-20` + CTA "Despertar Cultivador".

**Aba Lendas:** personagens mortos — ícone `☽` em `opacity-10`.

---

## 6. Modal de Criação de Personagem (`CreateCharacterModal`)

- **Aparência (gênero):** grid 2 cols, sprite pixelated 96×96px, borda colorida (azul = masculino, rosa = feminino), `scale-[1.02]` quando selecionado.
- **Nome:** Input padrão, max 24 chars.
- **Afinidade Espiritual:** grid 5 cols de botões com emoji + nome; borda/bg no tom da afinidade quando selecionado.
- **Botões finais:** "Cancelar" (ghost) + "Despertar" (gold).

---

## 7. Realm Colors (mapa de cores por estágio de cultivo)

```ts
const REALM_COLORS = {
  'Refinamento de Qi':        '#c8b89a',
  'Fundação Espiritual':      '#4db6ac',
  'Núcleo Dourado':           '#7986cb',
  'Alma Nascente':            '#d4a84b',
  'Transformação Espiritual': '#f0c060',
  'Unificação':               '#ef5350',
  'Ascensão':                 '#70c8c0',
  'Imortal':                  '#fff176',
}
```

---

## 8. Padrões de Layout Recorrentes

| Padrão                        | Implementação                                                         |
|-------------------------------|-----------------------------------------------------------------------|
| Divisor ornamental            | `flex-1 h-px bg-gradient-to-r from-transparent to-X` + `✦` central  |
| Glow atmosférico de fundo     | `absolute rounded-full blur-3xl pointer-events-none bg-amber-950/20` |
| Label de seção                | `text-xs text-muted uppercase tracking-widest`                        |
| Card de conteúdo              | `rounded-xl border border-border bg-surface p-4 space-y-3`           |
| Erro inline                   | `text-sm text-red-400 border border-red-900/60 bg-red-950/30 py-2`   |
| Scroll customizado            | 6px, track `#1a1a2e`, thumb `#2a2a4e` border-radius 3px              |
| Borda decorativa com imagem   | `border-image: url(X) slice% / widthpx / 0 stretch` via `useFrameStyle` |

---

## 9. Regras de Estilo

1. **Sem border-radius nos containers principais** — cantos retos reforçam o tom austero oriental. Usar `rounded` apenas em pills/badges e barras de progresso.
2. **Âmbar = ação principal**, jade = ação positiva secundária, ghost = neutro/cancelar, danger = destrutivo.
3. **Textos flavor** devem usar terminologia xianxia: "Cultivador", "Caminho", "Dao", "Qi", "Realm", "Despertar", "Jornada".
4. **`position: relative`** deve ser explícito em inline style quando `overflow: hidden` também estiver presente — não depender só do Tailwind.
5. **Badges de raridade** usam fundo `rgba(0,0,0,0.72)` + borda semi-opaca na cor da raridade + `border-radius: 9999`.
6. **Cards de item** (material/pílula) usam CSS Grid 3 linhas: linha superior (badge qty) / meio flex (sprite + nome) / linha inferior (badge raridade). Ver `ItemCard.tsx`.
7. **Cards de equipamento** têm flip 3D (`perspective + preserve-3d + rotateY(180deg)`). Frente mostra sprite+stats resumidos+botões; verso mostra stats completos com `overflow-y: auto`.
8. **Frames de raridade** são imagens configuráveis via admin (`useFrameStyle` hook). Quando presentes: `border-image`, `border-radius: 0`. Quando ausentes: borda CSS fina + `border-radius: 8`.
