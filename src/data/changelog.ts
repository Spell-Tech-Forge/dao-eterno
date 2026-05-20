export type ChangeType = 'feature' | 'fix' | 'balance' | 'content' | 'system'

export interface PatchNote {
  version: string
  date: string
  type: ChangeType
  title: string
  changes: string[]
}

export const CHANGELOG: PatchNote[] = [
  {
    version: '0.16.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Pílulas de Buff Temporário',
    changes: [
      '20 novas pílulas de buff: Força I-V (+ATK), Defesa I-V (+DEF), Vitalidade I-V (+HP), Foco I-V (+Crit%).',
      'Pílulas de buff têm duração de 15 a 45 minutos; efeito se aplica em combate em tempo real.',
      'Mesma pílula pode ser ativada novamente antes de expirar — o tempo restante é somado ao novo.',
      'Badges de buff exibidas no hub (abaixo de Combat Stats) com nome da pílula e contagem regressiva.',
      'Botão "✨ Ativar" roxo no card de inventário distingue pílulas de buff das pílulas comuns.',
      'Buffs ativos persistem ao salvar — ao reentrar no jogo buffs não expirados são restaurados.',
      '20 receitas de alquimia novas (T1–T5) utilizando materiais já existentes no jogo.',
    ],
  },
  {
    version: '0.15.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Botão de Salvar na Navbar & Diagnóstico de Sync',
    changes: [
      'Botão "💾 Salvar" adicionado à navbar — salva o progresso manualmente a qualquer momento.',
      'Feedback visual: botão muda para "⏳ Salvando..." durante o processo, "✓ Salvo" em sucesso, ou "✗ Erro" com mensagem detalhada em falha.',
      'Antes, erros de sincronização eram engolidos silenciosamente. Agora erros aparecem no botão e no console (auto-save e ações pontuais).',
      'Auto-save continua rodando a cada 30 segundos em paralelo.',
    ],
  },
  {
    version: '0.14.0',
    date: '2026-05-19',
    type: 'fix',
    title: 'Tier de Skill Ignorava Config do Admin no Crafting',
    changes: [
      'Corrigido: RecipeCard calculava o tier do jogador com a fórmula hardcoded (nível÷10) em vez dos níveis configurados no admin (XP de Crafting). Com T2=nível 3 e T3=nível 5 configurados, um jogador nível 7 era tratado como Tier 1, exibindo 28% de falha em itens de Tier 2.',
      'Após o fix: RecipeCard lê tierLevels do admin e calcula playerTier corretamente. Como o CraftingScreen só exibe receitas onde requiredTier ≤ playerTier, nenhum card exibe mais chance de falha de tier.',
      'O comportamento fica: receitas só aparecem quando o jogador tem o nível de skill E o reino de cultivo necessários.',
    ],
  },
  {
    version: '0.13.0',
    date: '2026-05-19',
    type: 'fix',
    title: 'Durabilidade Excedente Após Ascensão',
    changes: [
      'Corrigido: item que era +5 (durabilidade 150) ao ascender voltava para +0 mas mantinha 150 de durabilidade — exibindo 150/100 (150%).',
      'Agora a ascensão reseta a durabilidade para 100 junto com o nível de aprimoramento.',
    ],
  },
  {
    version: '0.12.0',
    date: '2026-05-19',
    type: 'fix',
    title: 'Display de Aprimoramento Usa Config do Admin',
    changes: [
      'Corrigido: ForgeScreen mostrava "X → X" (sem ganho aparente) porque a projeção de stats usava o bônus padrão de 5% em vez do valor configurado no admin.',
      'Projeção de stats agora sempre reflete o bônus configurado (upgrade e ascensão).',
      'Quando o arredondamento esconde o ganho (ex: 6 → 6), o display passa a mostrar 1 casa decimal (ex: 8.1 → 8.4).',
      'Tabela de Forja no Codex também atualiza multiplicadores com os valores do admin.',
      'Tabela de Ascensão no Codex exibe chance de falha quando configurada.',
    ],
  },
  {
    version: '0.11.0',
    date: '2026-05-19',
    type: 'balance',
    title: 'Ganho de Stats Configurável (Aprimoramento & Ascensão)',
    changes: [
      'Admin > Forja Config > Aprimoramento: novo card "Ganho de Stats por Nível" com campos para bônus por nível de upgrade (padrão 5%) e bônus por tier de ascensão (padrão 15%).',
      'Preview ao vivo mostrando o multiplicador máximo possível (ex: +15 e 5 ascensões) com os valores configurados.',
      'Todos os cálculos de stats (efetivo em combate, HP máximo, exibição) respeitam os valores salvos no admin.',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Chances Configuráveis de Falha (Aprimoramento & Ascensão)',
    changes: [
      'Admin > Forja Config > Aprimoramento: preset rápido "Aplicar a todos" define a curva de chance de falha em todos os 10 tiers de uma vez (garantia, falha inicial, incremento, máximo).',
      'Admin > Forja Config > Ascensão: cada nível de ascensão (I–V) agora tem campo de Chance de Falha configurável (0–100%).',
      'Quando a ascensão tem chance de falha > 0, o botão muda para vermelho com aviso, e uma barra de progresso mostra o risco.',
      'Materiais e sacrifícios são consumidos mesmo em caso de falha na ascensão (igual ao aprimoramento).',
      'forge.ts: ascensionCost() agora retorna failChance junto com materials e sacrificeCount.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-05-19',
    type: 'balance',
    title: 'Teto de Ascensão & Notas de Atualização',
    changes: [
      'Ascensão agora tem teto por tier do item: T1 vai até Espiritual, T2–3 até Terrestre, T4–5 até Celestial, T6–7 até Sagrado, T8–10 até Imortal.',
      'Codex — aba Forja: nova tabela mostrando o teto de raridade por tier de item.',
      'Codex — aba Itens: badge de raridade máxima atingível exibido no painel de detalhes de cada item.',
      'Dica desatualizada "item comum pode chegar a Imortal" foi corrigida no Codex.',
      'Tela de Notas de Atualização adicionada à navbar.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Desmonte em Massa & Durabilidade Real',
    changes: [
      'Inventário: botão "Desmontar em Massa" — selecione vários equipamentos de uma vez e veja os materiais recuperados em um modal.',
      'Desmonte agora devolve os ingredientes reais da receita (proporcionalmente), e não sempre a mesma Essência Espiritual.',
      'Admin: nova aba "Desmonte" para configurar taxa base, taxa máxima, bônus por nível de forja e material fallback.',
      'Durabilidade agora degrada os stats linearmente: 50% de durabilidade = 50% dos bônus de ATK/DEF/HP/Crit/Velocidade. Antes, o item só parava de contribuir ao chegar em 0.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-05-19',
    type: 'fix',
    title: 'Correções de Combate & Sincronização',
    changes: [
      'HP não salvava ao usar o serviço de descanso no hub — corrigido (syncToServer() faltava após a cura).',
      'Inimigo seguinte podia spawnar com 0 HP depois de uma vitória — corrigido (race condition no setInterval).',
      'Boss aparecia sempre no kill 10 sem nenhuma aleatoriedade — corrigido: agora aparece com a chance configurada (ex: 20%) a partir do kill mínimo.',
      'Dados do bioma dentro do loop de combate podiam ficar desatualizados (stale closure) — corrigido lendo direto do store.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Acessórios & Badge de Caminho',
    changes: [
      'Novos acessórios: colares (defensivos), pulseiras (equilibradas) e anéis ofensivos — tiers 1 a 10.',
      'Badge de Caminho (Ofensivo / Defensivo / Equilibrado) exibido nos cards de item, receita e Codex.',
      'Anéis ofensivos agora vão corretamente para o slot de Acessório e não substituem o Anel Espacial.',
      'Bônus de HP do Anel Espacial agora é somado ao HP máximo do jogador.',
      'Filtros de crafting: acessórios e anéis espaciais em filtros separados.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Meditação com Pílulas & Importação em Massa',
    changes: [
      'Meditação reformulada: ao invés de passiva sempre ativa, agora requer pílulas de meditação para ativar por tempo determinado (acumulável).',
      'Bosses dropam Essência de Boss, usada para criar pílulas de meditação de tiers mais altos.',
      'Admin: editor de Caminhos de Rompimento — configure pontos de atributo por caminho (Ofensivo, Defensivo, Equilibrado).',
      'Admin: botão de importação em massa via JSON nos painéis de Itens, Monstros, Receitas e Biomas.',
      '110 monstros, 80 armas, 30 armaduras, 29 acessórios, 50 materiais, 31 pílulas e 10 biomas importados do Excel de referência.',
      'Endpoints de seed trocados para upsert real (ON CONFLICT DO UPDATE) — reimportar atualiza em vez de ignorar.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-05-19',
    type: 'feature',
    title: 'Codex Expandido & Melhorias de Crafting',
    changes: [
      'Codex — aba Itens: sidebar accordion com categorias e sub-listas; painel de detalhes com sprite grande, descrição, stats e ingredientes da receita.',
      'Codex — aba Bestas: bestiário reorganizado por bioma com accordion; botão para abrir todos em sequência.',
      'Cards de receita: flip 3D mostrando ingredientes no verso; stats em 2 colunas na frente.',
      'Desbloqueio de mapas: agora também requer ter matado o boss do bioma anterior.',
      'Custo em ouro adicionado ao Crafting, Aprimoramento e Ascensão.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-05-18',
    type: 'feature',
    title: 'Melhorias Visuais & Arena de Combate',
    changes: [
      'Sprites de monstro e personagem na batalha agora configuráveis (tamanho independente).',
      'Altura da arena de combate configurável pelo admin.',
      'Desfoque de fundo da arena configurável.',
      'Todos os componentes passaram a usar SpriteImg — suporte a imagens PNG, ICO e JPG (não mais apenas emojis).',
      'EmojiPicker no painel admin para definir ícone de itens e monstros.',
      'Sprites atualizam imediatamente após salvar no admin, sem precisar recarregar a página.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-05-16',
    type: 'system',
    title: 'Admin, Mercado & Migração para PostgreSQL',
    changes: [
      'Painel admin completo: gerenciamento de itens, monstros, receitas, biomas, breakthroughs, configurações, XP de crafting e forja.',
      'Sistema de sprites: upload de imagens para itens e monstros via admin.',
      'Mercado player-to-player: compra e venda de itens entre jogadores.',
      'Todo o estado do jogo migrado de localStorage para PostgreSQL.',
      'Seletor de gênero do personagem.',
      'Scripts de deploy para VPS com Nginx + PM2 + DuckDNS + Let\'s Encrypt.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-16',
    type: 'system',
    title: 'Lançamento Inicial',
    changes: [
      'Sistema de autenticação com múltiplos usuários.',
      'Permadeath: apenas 1 personagem por conta; morte é permanente.',
      'Ranking global sincronizado com o servidor.',
      'Sistema de combate em tempo real com inimigos, drops e Qi.',
      'Sistema de crafting (Forja & Alquimia) com receitas por tier.',
      'Sistema de Aprimoramento e Ascensão de equipamentos.',
      'Exploração de biomas com pool de inimigos e bosses.',
      'Sistema de habilidades (Forja, Alquimia, Meditação) com XP.',
      'Suporte a Docker para deploy.',
    ],
  },
]
