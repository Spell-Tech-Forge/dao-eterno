import type { ItemDefinition } from '../types'

export const ITEM_DEFS: Record<string, ItemDefinition> = {

  // ── Anéis Espaciais ────────────────────────────────────────────
  ring_leather: {
    id: 'ring_leather', name: 'Anel de Cobre', emoji: '💍',
    type: 'ring', rarity: 'common',
    description: 'Um anel mortal de cobre com pequena dobra espacial.',
    stats: { slots: 30 },
  },
  ring_bronze: {
    id: 'ring_bronze', name: 'Anel de Bronze Espiritual', emoji: '💍',
    type: 'ring', rarity: 'common',
    description: 'Forjado com bronze infundido de Qi. Dobra do espaço ampliada.',
    stats: { slots: 50 },
  },
  ring_jade: {
    id: 'ring_jade', name: 'Anel de Jade', emoji: '💍',
    type: 'ring', rarity: 'rare',
    description: 'Jade espiritual lapidado por um artesão experiente.',
    stats: { slots: 80 },
  },
  ring_gold: {
    id: 'ring_gold', name: 'Anel de Ouro Espiritual', emoji: '💍',
    type: 'ring', rarity: 'ancient',
    description: 'Ouro fundido com essência primordial. Espaço interno vastíssimo.',
    stats: { slots: 120 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 1 (Nível 1)
  // ══════════════════════════════════════════════════════════════
  faixas_t1: {
    id: 'faixas_t1', name: 'Faixas de Linho Bruto', emoji: '🥊',
    type: 'weapon', rarity: 'common', tier: 1,
    description: 'Tiras de linho enroladas nos punhos. Arma de treino básica.',
    stats: { atk: 4, crit: 4, speed: 8 },
  },
  espada_t1: {
    id: 'espada_t1', name: 'Espada de Ferro Forjado', emoji: '⚔️',
    type: 'weapon', rarity: 'common', tier: 1,
    description: 'Ferro forjado por ferreiros mortais. Sem refinamento espiritual.',
    stats: { atk: 7, crit: 2, speed: 4 },
  },
  sabre_t1: {
    id: 'sabre_t1', name: 'Sabre de Ferro Bruto', emoji: '🗡️',
    type: 'weapon', rarity: 'common', tier: 1,
    description: 'Lâmina pesada de ferro bruto. Lenta, mas devastadora.',
    stats: { atk: 12, def: 3, speed: 1 },
  },
  lanca_t1: {
    id: 'lanca_t1', name: 'Lança com Ponta de Bronze', emoji: '🔱',
    type: 'weapon', rarity: 'common', tier: 1,
    description: 'Cabo de madeira com ponta de bronze. Equilibrada e versátil.',
    stats: { atk: 9, def: 1, crit: 1, speed: 3 },
  },
  leque_t1: {
    id: 'leque_t1', name: 'Leque de Bambu Comum', emoji: '🪭',
    type: 'weapon', rarity: 'common', tier: 1,
    description: 'Leque de bambu usado por cultivadores de suporte iniciantes.',
    stats: { atk: 3, hp: 15, crit: 6, speed: 6 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 2 (Nível 3)
  // ══════════════════════════════════════════════════════════════
  faixas_t2: {
    id: 'faixas_t2', name: 'Faixas de Cânhamo Refinado', emoji: '🥊',
    type: 'weapon', rarity: 'common', tier: 2,
    description: 'Cânhamo refinado com técnicas de curtume tradicionais.',
    stats: { atk: 10, crit: 8, speed: 15 },
  },
  espada_t2: {
    id: 'espada_t2', name: 'Espada de Aço Temperado', emoji: '⚔️',
    type: 'weapon', rarity: 'common', tier: 2,
    description: 'Aço temperado em forja artesanal. Corte superior ao ferro comum.',
    stats: { atk: 18, crit: 4, speed: 8 },
  },
  sabre_t2: {
    id: 'sabre_t2', name: 'Sabre de Aço Negro', emoji: '🗡️',
    type: 'weapon', rarity: 'common', tier: 2,
    description: 'Aço negro forjado para maximizar dano bruto.',
    stats: { atk: 28, def: 8, speed: 2 },
  },
  lanca_t2: {
    id: 'lanca_t2', name: 'Lança de Ferro Temperado', emoji: '🔱',
    type: 'weapon', rarity: 'common', tier: 2,
    description: 'Ferro temperado montado em haste longa. Alcance e equilíbrio.',
    stats: { atk: 22, def: 4, crit: 3, speed: 6 },
  },
  leque_t2: {
    id: 'leque_t2', name: 'Leque de Seda Tecida', emoji: '🪭',
    type: 'weapon', rarity: 'common', tier: 2,
    description: 'Seda especial que canaliza Qi em rajadas de vento.',
    stats: { atk: 8, hp: 40, crit: 12, speed: 12 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 3 (Nível 5)
  // ══════════════════════════════════════════════════════════════
  faixas_t3: {
    id: 'faixas_t3', name: 'Faixas do Fluxo de Qi', emoji: '🥊',
    type: 'weapon', rarity: 'uncommon', tier: 3,
    description: 'Faixas imbuídas de Qi espiritual. Cada golpe conduz energia pura.',
    stats: { atk: 24, crit: 16, speed: 32 },
  },
  espada_t3: {
    id: 'espada_t3', name: 'Espada da Brisa Espiritual', emoji: '⚔️',
    type: 'weapon', rarity: 'uncommon', tier: 3,
    description: 'Lâmina afiada com vento espiritual condensado. Ataques rápidos e cortantes.',
    stats: { atk: 42, crit: 8, speed: 18 },
  },
  sabre_t3: {
    id: 'sabre_t3', name: 'Sabre do Impacto de Qi', emoji: '🗡️',
    type: 'weapon', rarity: 'uncommon', tier: 3,
    description: 'Sabre forjado para concentrar Qi em impactos devastadores.',
    stats: { atk: 65, def: 18, speed: 4 },
  },
  lanca_t3: {
    id: 'lanca_t3', name: 'Lança Espiritual do Vento', emoji: '🔱',
    type: 'weapon', rarity: 'uncommon', tier: 3,
    description: 'Lança que corta o ar com velocidade espiritual.',
    stats: { atk: 52, def: 10, crit: 6, speed: 14 },
  },
  leque_t3: {
    id: 'leque_t3', name: 'Leque Espiritual das Cinco Folhas', emoji: '🪭',
    type: 'weapon', rarity: 'uncommon', tier: 3,
    description: 'Cinco folhas espirituais controladas por Qi. Vitalidade e precisão.',
    stats: { atk: 20, hp: 100, crit: 24, speed: 25 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 4 (Nível 8)
  // ══════════════════════════════════════════════════════════════
  faixas_t4: {
    id: 'faixas_t4', name: 'Faixas da Casca de Ferro', emoji: '🥊',
    type: 'weapon', rarity: 'spiritual', tier: 4,
    description: 'Casca de ferro místico tecida em faixas de combate. Velocidade e resistência.',
    stats: { atk: 45, def: 12, crit: 24, speed: 50 },
  },
  espada_t4: {
    id: 'espada_t4', name: 'Espada da Geada Mística', emoji: '⚔️',
    type: 'weapon', rarity: 'spiritual', tier: 4,
    description: 'Lâmina que emana frio místico. Corta corpo e espírito.',
    stats: { atk: 80, crit: 15, speed: 30 },
  },
  sabre_t4: {
    id: 'sabre_t4', name: 'Sabre da Rocha Mística', emoji: '🗡️',
    type: 'weapon', rarity: 'spiritual', tier: 4,
    description: 'Forjado com rocha mística. Dano colossal e defesa sólida.',
    stats: { atk: 120, def: 40, speed: 6 },
  },
  lanca_t4: {
    id: 'lanca_t4', name: 'Lança Mística do Relâmpago', emoji: '🔱',
    type: 'weapon', rarity: 'spiritual', tier: 4,
    description: 'Carrega descarga mística em cada investida.',
    stats: { atk: 105, def: 15, crit: 18, speed: 35 },
  },
  leque_t4: {
    id: 'leque_t4', name: 'Leque Místico da Ilusão', emoji: '🪭',
    type: 'weapon', rarity: 'spiritual', tier: 4,
    description: 'Cria ilusões místicas que drenam a vitalidade do inimigo.',
    stats: { atk: 38, hp: 220, crit: 45, speed: 45 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 5 (Nível 10)
  // ══════════════════════════════════════════════════════════════
  faixas_t5: {
    id: 'faixas_t5', name: 'Faixas de Seda Dourada', emoji: '🥊',
    type: 'weapon', rarity: 'rare', tier: 5,
    description: 'Seda dourada do Núcleo. Velocidade e poder combinados.',
    stats: { atk: 75, def: 15, crit: 40, speed: 85 },
  },
  espada_t5: {
    id: 'espada_t5', name: 'Espada do Brilho Áureo', emoji: '⚔️',
    type: 'weapon', rarity: 'rare', tier: 5,
    description: 'Emana luz dourada do Núcleo. Corte que rasga o plano espiritual.',
    stats: { atk: 135, crit: 22, speed: 48 },
  },
  sabre_t5: {
    id: 'sabre_t5', name: 'Sabre do Núcleo Flamejante', emoji: '🗡️',
    type: 'weapon', rarity: 'rare', tier: 5,
    description: 'Chamas do Núcleo Dourado impregnadas na lâmina. Poder destrutivo máximo.',
    stats: { atk: 210, def: 70, speed: 10 },
  },
  lanca_t5: {
    id: 'lanca_t5', name: 'Lança do Núcleo Perfurante', emoji: '🔱',
    type: 'weapon', rarity: 'rare', tier: 5,
    description: 'Perfura defesas com energia do Núcleo condensada na ponta.',
    stats: { atk: 175, def: 22, crit: 25, speed: 55 },
  },
  leque_t5: {
    id: 'leque_t5', name: 'Leque do Núcleo Dourado', emoji: '🪭',
    type: 'weapon', rarity: 'rare', tier: 5,
    description: 'Leque imbuído com essência pura do Núcleo Dourado.',
    stats: { atk: 65, hp: 450, crit: 70, speed: 75 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 6 (Nível 15)
  // ══════════════════════════════════════════════════════════════
  faixas_t6: {
    id: 'faixas_t6', name: 'Faixas do Espírito Marcial', emoji: '🥊',
    type: 'weapon', rarity: 'rare', tier: 6,
    description: 'Tecidas com fragmentos de alma de guerreiros ancestrais.',
    stats: { atk: 140, def: 26, crit: 69, speed: 159 },
  },
  espada_t6: {
    id: 'espada_t6', name: 'Espada da Alma Flutuante', emoji: '⚔️',
    type: 'weapon', rarity: 'rare', tier: 6,
    description: 'A alma do forjador persiste na lâmina, guiando cada golpe.',
    stats: { atk: 252, crit: 38, speed: 90 },
  },
  sabre_t6: {
    id: 'sabre_t6', name: 'Sabre Devorador de Almas', emoji: '🗡️',
    type: 'weapon', rarity: 'rare', tier: 6,
    description: 'Cada corte absorve fragmentos de alma do inimigo.',
    stats: { atk: 395, def: 126, speed: 19 },
  },
  lanca_t6: {
    id: 'lanca_t6', name: 'Lança do Espírito Errante', emoji: '🔱',
    type: 'weapon', rarity: 'rare', tier: 6,
    description: 'Espíritos errantes habitam a haste, amplificando cada golpe.',
    stats: { atk: 327, def: 38, crit: 43, speed: 103 },
  },
  leque_t6: {
    id: 'leque_t6', name: 'Leque da Alma Serena', emoji: '🪭',
    type: 'weapon', rarity: 'rare', tier: 6,
    description: 'Almas serenas ampliam a vitalidade e foco do portador.',
    stats: { atk: 122, hp: 842, crit: 121, speed: 140 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 7 (Nível 20)
  // ══════════════════════════════════════════════════════════════
  faixas_t7: {
    id: 'faixas_t7', name: 'Faixas do Rei Asura', emoji: '🥊',
    type: 'weapon', rarity: 'ancient', tier: 7,
    description: 'Dignas do domínio de um Rei Asura. Poder que subjuga seres reais.',
    stats: { atk: 266, def: 46, crit: 122, speed: 302 },
  },
  espada_t7: {
    id: 'espada_t7', name: 'Espada do Rei Celestial', emoji: '⚔️',
    type: 'weapon', rarity: 'ancient', tier: 7,
    description: 'Arma de um Rei Celestial. Seu brilho apaga a escuridão.',
    stats: { atk: 479, crit: 67, speed: 171 },
  },
  sabre_t7: {
    id: 'sabre_t7', name: 'Sabre Tirânico do Rei', emoji: '🗡️',
    type: 'weapon', rarity: 'ancient', tier: 7,
    description: 'A tirania do Rei condensada em aço. Nada resiste ao seu corte.',
    stats: { atk: 751, def: 239, speed: 36 },
  },
  lanca_t7: {
    id: 'lanca_t7', name: 'Lança do Dragão do Rei', emoji: '🔱',
    type: 'weapon', rarity: 'ancient', tier: 7,
    description: 'Forjada com escamas de Dragão Rei. Presença que intimida.',
    stats: { atk: 621, def: 68, crit: 77, speed: 196 },
  },
  leque_t7: {
    id: 'leque_t7', name: 'Leque do Rei dos Ventos', emoji: '🪭',
    type: 'weapon', rarity: 'ancient', tier: 7,
    description: 'Cada leque gera vendavais de poder real.',
    stats: { atk: 232, hp: 1600, crit: 212, speed: 266 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 8 (Nível 25)
  // ══════════════════════════════════════════════════════════════
  faixas_t8: {
    id: 'faixas_t8', name: 'Faixas da Destruição Imperial', emoji: '🥊',
    type: 'weapon', rarity: 'ancient', tier: 8,
    description: 'Tecem destruição imperial a cada movimento. Velocidade letal.',
    stats: { atk: 519, def: 85, crit: 226, speed: 589 },
  },
  espada_t8: {
    id: 'espada_t8', name: 'Espada do Imperador de Jade', emoji: '⚔️',
    type: 'weapon', rarity: 'ancient', tier: 8,
    description: 'Jade imperial fundido em aço celestial. Símbolo do domínio eterno.',
    stats: { atk: 934, crit: 124, speed: 333 },
  },
  sabre_t8: {
    id: 'sabre_t8', name: 'Sabre Imperial do Caos', emoji: '🗡️',
    type: 'weapon', rarity: 'ancient', tier: 8,
    description: 'Caos imperial cristalizado em lâmina. Destruição sem limites.',
    stats: { atk: 1464, def: 466, speed: 70 },
  },
  lanca_t8: {
    id: 'lanca_t8', name: 'Lança Imperial da Estrela Cadente', emoji: '🔱',
    type: 'weapon', rarity: 'ancient', tier: 8,
    description: 'Velocidade de estrela cadente. Atravessa qualquer defesa.',
    stats: { atk: 1211, def: 126, crit: 142, speed: 382 },
  },
  leque_t8: {
    id: 'leque_t8', name: 'Leque Imperial do Sol e da Lua', emoji: '🪭',
    type: 'weapon', rarity: 'ancient', tier: 8,
    description: 'Dualidade solar e lunar em harmonia. Vitalidade e poder.',
    stats: { atk: 452, hp: 3120, crit: 392, speed: 519 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 9 (Nível 35)
  // ══════════════════════════════════════════════════════════════
  faixas_t9: {
    id: 'faixas_t9', name: 'Faixas do Santo Vajra', emoji: '🥊',
    type: 'weapon', rarity: 'legendary', tier: 9,
    description: 'Vajra sagrado tecido em faixas. Cada golpe ressoa pelo plano celestial.',
    stats: { atk: 1246, def: 187, crit: 497, speed: 1414 },
  },
  espada_t9: {
    id: 'espada_t9', name: 'Espada da Luz Sagrada', emoji: '⚔️',
    type: 'weapon', rarity: 'legendary', tier: 9,
    description: 'Luz sagrada condensada em lâmina. Aniquila trevas e demônios.',
    stats: { atk: 2242, crit: 273, speed: 799 },
  },
  sabre_t9: {
    id: 'sabre_t9', name: 'Sabre do Santo da Guerra', emoji: '🗡️',
    type: 'weapon', rarity: 'legendary', tier: 9,
    description: 'O sabre do maior guerreiro sagrado. Poder que transcende reinos.',
    stats: { atk: 3514, def: 1118, speed: 168 },
  },
  lanca_t9: {
    id: 'lanca_t9', name: 'Lança Sagrada dos Nove Céus', emoji: '🔱',
    type: 'weapon', rarity: 'legendary', tier: 9,
    description: 'Traversa os Nove Céus. Arma dos guardiões do paraíso.',
    stats: { atk: 2906, def: 277, crit: 312, speed: 917 },
  },
  leque_t9: {
    id: 'leque_t9', name: 'Leque Sagrado da Fênix', emoji: '🪭',
    type: 'weapon', rarity: 'legendary', tier: 9,
    description: 'Penas da Fênix Sagrada. Ressurreição e poder inextinguível.',
    stats: { atk: 1085, hp: 7488, crit: 862, speed: 1246 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMAS — Tier 10 (Nível 50)
  // ══════════════════════════════════════════════════════════════
  faixas_t10: {
    id: 'faixas_t10', name: 'Ataduras do Caos Primordial', emoji: '🥊',
    type: 'weapon', rarity: 'legendary', tier: 10,
    description: 'Tecidas do caos anterior à criação. O Dao flui por cada fibra.',
    stats: { atk: 3987, def: 524, crit: 1392, speed: 4525 },
  },
  espada_t10: {
    id: 'espada_t10', name: 'Espada Divina Corta-Céus', emoji: '⚔️',
    type: 'weapon', rarity: 'legendary', tier: 10,
    description: 'Divide os céus com um único golpe. A lâmina suprema do Dao.',
    stats: { atk: 7174, crit: 764, speed: 2557 },
  },
  sabre_t10: {
    id: 'sabre_t10', name: 'Sabre Divino do Cataclismo', emoji: '🗡️',
    type: 'weapon', rarity: 'legendary', tier: 10,
    description: 'Cada golpe é um cataclismo. Destruição divina incarnada.',
    stats: { atk: 11245, def: 3578, speed: 538 },
  },
  lanca_t10: {
    id: 'lanca_t10', name: 'Lança Divina do Karma Celestial', emoji: '🔱',
    type: 'weapon', rarity: 'legendary', tier: 10,
    description: 'Executa o karma celestial. Nenhum ser pode escapar de seu alcance.',
    stats: { atk: 9299, def: 776, crit: 874, speed: 2934 },
  },
  leque_t10: {
    id: 'leque_t10', name: 'Leque Divino da Criação', emoji: '🪭',
    type: 'weapon', rarity: 'legendary', tier: 10,
    description: 'O leque que participou da criação do universo. Poder absoluto.',
    stats: { atk: 3472, hp: 23962, crit: 2414, speed: 3987 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMADURAS — Manto (Pano) Tier 1–10
  // ══════════════════════════════════════════════════════════════
  manto_t1: {
    id: 'manto_t1', name: 'Manto de Linho Grosseiro', emoji: '👘',
    type: 'armor', rarity: 'common', tier: 1,
    description: 'Linho grosseiro tecido por artesãos mortais. Proteção mínima.',
    stats: { def: 3, hp: 22, crit: 3 },
  },
  manto_t2: {
    id: 'manto_t2', name: 'Manto de Seda Tecida', emoji: '👘',
    type: 'armor', rarity: 'common', tier: 2,
    description: 'Seda refinada tecida com técnicas de artesãos habilidosos.',
    stats: { def: 6, hp: 53, crit: 6 },
  },
  manto_t3: {
    id: 'manto_t3', name: 'Manto Espiritual de Qi', emoji: '👘',
    type: 'armor', rarity: 'uncommon', tier: 3,
    description: 'Tecido imbuído de Qi espiritual. Protege corpo e mente.',
    stats: { def: 12, hp: 125, crit: 12 },
  },
  manto_t4: {
    id: 'manto_t4', name: 'Manto Místico do Vazio', emoji: '👘',
    type: 'armor', rarity: 'spiritual', tier: 4,
    description: 'Tecido com energia do vazio místico. Precisão aprimorada.',
    stats: { def: 21, hp: 238, crit: 21 },
  },
  manto_t5: {
    id: 'manto_t5', name: 'Manto do Núcleo Dourado', emoji: '👘',
    type: 'armor', rarity: 'rare', tier: 5,
    description: 'Luz do Núcleo Dourado tecida em seda celestial.',
    stats: { def: 34, hp: 405, crit: 34 },
  },
  manto_t6: {
    id: 'manto_t6', name: 'Manto do Espírito Etéreo', emoji: '👘',
    type: 'armor', rarity: 'rare', tier: 6,
    description: 'Feito de almas etéreas condensadas. Aumenta percepção espiritual.',
    stats: { def: 59, hp: 757, crit: 59 },
  },
  manto_t7: {
    id: 'manto_t7', name: 'Manto do Rei das Névoas', emoji: '👘',
    type: 'armor', rarity: 'ancient', tier: 7,
    description: 'Névoa real cristalizada em tecido. Protege como as névoas do reino.',
    stats: { def: 104, hp: 1438, crit: 104 },
  },
  manto_t8: {
    id: 'manto_t8', name: 'Manto Imperial das Ilusões', emoji: '👘',
    type: 'armor', rarity: 'ancient', tier: 8,
    description: 'Ilusões imperiais tecidas em cada fio. Confunde e protege.',
    stats: { def: 192, hp: 2804, crit: 192 },
  },
  manto_t9: {
    id: 'manto_t9', name: 'Manto Sagrado da Ascensão', emoji: '👘',
    type: 'armor', rarity: 'legendary', tier: 9,
    description: 'Abençoado pelos caminhos sagrados da Ascensão.',
    stats: { def: 422, hp: 6730, crit: 422 },
  },
  manto_t10: {
    id: 'manto_t10', name: 'Manto Divino da Criação', emoji: '👘',
    type: 'armor', rarity: 'legendary', tier: 10,
    description: 'Tecido no momento da criação do universo. Proteção absoluta.',
    stats: { def: 1182, hp: 21536, crit: 1182 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMADURAS — Couraça (Couro) Tier 1–10
  // ══════════════════════════════════════════════════════════════
  coura_t1: {
    id: 'coura_t1', name: 'Couraça de Couro Bruto', emoji: '🥋',
    type: 'armor', rarity: 'common', tier: 1,
    description: 'Couro bruto curtido. Mobilidade básica com proteção modesta.',
    stats: { def: 6, hp: 10, speed: 4 },
  },
  coura_t2: {
    id: 'coura_t2', name: 'Couraça de Couro Reforçado', emoji: '🥋',
    type: 'armor', rarity: 'common', tier: 2,
    description: 'Couro reforçado com técnicas tradicionais. Mais resistente.',
    stats: { def: 14, hp: 20, speed: 8 },
  },
  coura_t3: {
    id: 'coura_t3', name: 'Couraça Espiritual do Caçador', emoji: '🥋',
    type: 'armor', rarity: 'uncommon', tier: 3,
    description: 'Couro de besta espiritual tratado com Qi de caçador.',
    stats: { def: 33, hp: 40, speed: 16 },
  },
  coura_t4: {
    id: 'coura_t4', name: 'Couraça Mística das Feras', emoji: '🥋',
    type: 'armor', rarity: 'spiritual', tier: 4,
    description: 'Feita de peles de feras místicas. Agilidade e defesa equilibradas.',
    stats: { def: 63, hp: 70, speed: 28 },
  },
  coura_t5: {
    id: 'coura_t5', name: 'Couraça do Núcleo Veloz', emoji: '🥋',
    type: 'armor', rarity: 'rare', tier: 5,
    description: 'Energia do Núcleo impregnada no couro. Velocidade excepcional.',
    stats: { def: 107, hp: 112, speed: 45 },
  },
  coura_t6: {
    id: 'coura_t6', name: 'Couraça do Espírito Selvagem', emoji: '🥋',
    type: 'armor', rarity: 'rare', tier: 6,
    description: 'Espíritos selvagens habitam o couro, conferindo agilidade sobrenatural.',
    stats: { def: 200, hp: 194, speed: 78 },
  },
  coura_t7: {
    id: 'coura_t7', name: 'Couraça do Rei das Feras', emoji: '🥋',
    type: 'armor', rarity: 'ancient', tier: 7,
    description: 'Feita do couro do Rei das Feras. Velocidade digna de realeza.',
    stats: { def: 380, hp: 343, speed: 138 },
  },
  coura_t8: {
    id: 'coura_t8', name: 'Couraça Imperial do Leopardo', emoji: '🥋',
    type: 'armor', rarity: 'ancient', tier: 8,
    description: 'Pele do Leopardo Imperial. Velocidade e ferocidade imperiais.',
    stats: { def: 741, hp: 635, speed: 255 },
  },
  coura_t9: {
    id: 'coura_t9', name: 'Couraça Sagrada do Vento', emoji: '🥋',
    type: 'armor', rarity: 'legendary', tier: 9,
    description: 'Vento sagrado cristalizado em couro. Move-se como o próprio vento.',
    stats: { def: 1778, hp: 1397, speed: 561 },
  },
  coura_t10: {
    id: 'coura_t10', name: 'Couraça Divina do Dragão', emoji: '🥋',
    type: 'armor', rarity: 'legendary', tier: 10,
    description: 'Escamas do Dragão Divino transformadas em couraça. Velocidade absoluta.',
    stats: { def: 5690, hp: 3912, speed: 1571 },
  },

  // ══════════════════════════════════════════════════════════════
  //  ARMADURAS — Armadura (Placa) Tier 1–10
  // ══════════════════════════════════════════════════════════════
  armadura_t1: {
    id: 'armadura_t1', name: 'Armadura de Bronze Bruto', emoji: '🛡️',
    type: 'armor', rarity: 'common', tier: 1,
    description: 'Bronze fundido em placas brutas. Pesada mas protetora.',
    stats: { def: 10, hp: 12 },
  },
  armadura_t2: {
    id: 'armadura_t2', name: 'Armadura de Ferro Forjado', emoji: '🛡️',
    type: 'armor', rarity: 'common', tier: 2,
    description: 'Ferro forjado em placas completas. Defesa superior ao bronze.',
    stats: { def: 24, hp: 24 },
  },
  armadura_t3: {
    id: 'armadura_t3', name: 'Armadura Espiritual de Aço', emoji: '🛡️',
    type: 'armor', rarity: 'uncommon', tier: 3,
    description: 'Aço temperado com Qi espiritual. Resistência além do comum.',
    stats: { def: 56, hp: 48 },
  },
  armadura_t4: {
    id: 'armadura_t4', name: 'Armadura Mística de Pedra-Ferro', emoji: '🛡️',
    type: 'armor', rarity: 'spiritual', tier: 4,
    description: 'Liga de pedra mística e ferro. Quase impenetrável.',
    stats: { def: 106, hp: 84 },
  },
  armadura_t5: {
    id: 'armadura_t5', name: 'Armadura do Núcleo de Ferro', emoji: '🛡️',
    type: 'armor', rarity: 'rare', tier: 5,
    description: 'Ferro temperado com energia do Núcleo Dourado. Defesa máxima.',
    stats: { def: 180, hp: 134 },
  },
  armadura_t6: {
    id: 'armadura_t6', name: 'Armadura do Espírito de Pedra', emoji: '🛡️',
    type: 'armor', rarity: 'rare', tier: 6,
    description: 'Pedra espiritual forjada em armadura completa. Muralha viva.',
    stats: { def: 337, hp: 232 },
  },
  armadura_t7: {
    id: 'armadura_t7', name: 'Armadura do Rei de Aço', emoji: '🛡️',
    type: 'armor', rarity: 'ancient', tier: 7,
    description: 'Forjada para o Rei de Aço. Defesa que subjuga exércitos.',
    stats: { def: 640, hp: 411 },
  },
  armadura_t8: {
    id: 'armadura_t8', name: 'Armadura Imperial de Jade', emoji: '🛡️',
    type: 'armor', rarity: 'ancient', tier: 8,
    description: 'Jade imperial fundido em placas. Símbolo do poder imperial.',
    stats: { def: 1248, hp: 760 },
  },
  armadura_t9: {
    id: 'armadura_t9', name: 'Armadura Sagrada do Trovão', emoji: '🛡️',
    type: 'armor', rarity: 'legendary', tier: 9,
    description: 'Trovão sagrado cristalizado em metal. Defesa dos guardiões celestiais.',
    stats: { def: 2995, hp: 1672 },
  },
  armadura_t10: {
    id: 'armadura_t10', name: 'Armadura Divina do Cataclismo', emoji: '🛡️',
    type: 'armor', rarity: 'legendary', tier: 10,
    description: 'Forjada no calor do cataclismo divino. Proteção sem igual no universo.',
    stats: { def: 9584, hp: 4682 },
  },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 1 (Nível 1) — Floresta Espiritual
  // ══════════════════════════════════════════════════════════════
  bone_fragment:    { id: 'bone_fragment',    name: 'Fragmento de Osso',      emoji: '🦴', type: 'material', rarity: 'common',   tier: 1, stackable: true, description: 'Osso de animais mortais. Material básico de forja.' },
  reptile_skin:     { id: 'reptile_skin',     name: 'Pele de Réptil',         emoji: '🦎', type: 'material', rarity: 'common',   tier: 1, stackable: true, description: 'Pele ou escama de répteis. Flexível e resistente.' },
  raw_qi_core:      { id: 'raw_qi_core',      name: 'Núcleo de Qi Bruto',     emoji: '✨', type: 'material', rarity: 'uncommon', tier: 1, stackable: true, description: 'Concentrado de Qi bruto. Ingrediente alquímico versátil.' },
  raw_iron:         { id: 'raw_iron',         name: 'Ferro Bruto',            emoji: '⚙️', type: 'material', rarity: 'rare',     tier: 1, stackable: true, description: 'Metal básico forjado. Raro em bestas mortais.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 2 (Nível 3) — Pântano das Brumas Venenosas
  // ══════════════════════════════════════════════════════════════
  beast_scale:      { id: 'beast_scale',      name: 'Escama de Besta',        emoji: '🐟', type: 'material', rarity: 'common',   tier: 2, stackable: true, description: 'Escamas de bestas aquáticas. Base de armaduras flexíveis.' },
  distilled_venom:  { id: 'distilled_venom',  name: 'Veneno Destilado',       emoji: '💀', type: 'material', rarity: 'common',   tier: 2, stackable: true, description: 'Veneno purificado de criaturas do pântano. Potente ingrediente.' },
  qi_crystal:       { id: 'qi_crystal',       name: 'Cristal de Qi',          emoji: '💎', type: 'material', rarity: 'uncommon', tier: 2, stackable: true, description: 'Cristal de Qi condensado. Amplifica formações espirituais.' },
  refinement_dust:  { id: 'refinement_dust',  name: 'Pó de Refinamento',      emoji: '🌫️', type: 'material', rarity: 'rare',     tier: 2, stackable: true, description: 'Pó de refinamento espiritual. Catalisador de tier dois.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 3 (Nível 5) — Planícies dos Ventos Ancestrais
  // ══════════════════════════════════════════════════════════════
  spiritual_feather: { id: 'spiritual_feather', name: 'Pluma Espiritual',     emoji: '🪶', type: 'material', rarity: 'common',   tier: 3, stackable: true, description: 'Pena de aves espirituais. Leve e carregada de Qi puro.' },
  beast_claw:        { id: 'beast_claw',        name: 'Garras de Besta',      emoji: '🐾', type: 'material', rarity: 'common',   tier: 3, stackable: true, description: 'Garras afiadas de feras espirituais. Corte sobrenatural.' },
  spiritual_essence: { id: 'spiritual_essence', name: 'Essência Espiritual',  emoji: '🔮', type: 'material', rarity: 'uncommon', tier: 3, stackable: true, description: 'Essência concentrada do espírito. Ingrediente universal de tier três.' },
  pure_qi_silk:      { id: 'pure_qi_silk',      name: 'Seda de Qi Pura',      emoji: '🧵', type: 'material', rarity: 'rare',     tier: 3, stackable: true, description: 'Fio de seda saturado de Qi puro. Catalisador de tier três.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 4 (Nível 8) — Ruínas do Templo Místico
  // ══════════════════════════════════════════════════════════════
  mystic_scale:     { id: 'mystic_scale',     name: 'Escama Mística',         emoji: '🟪', type: 'material', rarity: 'common',   tier: 4, stackable: true, description: 'Escamas de seres místicos. Resistência além do espiritual.' },
  demon_bone:       { id: 'demon_bone',       name: 'Osso de Demônio',        emoji: '🦷', type: 'material', rarity: 'common',   tier: 4, stackable: true, description: 'Osso de demônios do plano sombrio. Dureza excepcional.' },
  mystic_crystal:   { id: 'mystic_crystal',   name: 'Cristal Místico',        emoji: '🔮', type: 'material', rarity: 'uncommon', tier: 4, stackable: true, description: 'Cristal de energia mística pura. Núcleo de formações avançadas.' },
  mystic_qi_elixir: { id: 'mystic_qi_elixir', name: 'Elixir Místico de Qi',  emoji: '🧪', type: 'material', rarity: 'rare',     tier: 4, stackable: true, description: 'Elixir concentrador de Qi místico. Catalisador de tier quatro.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 5 (Nível 10) — Montanhas do Núcleo Dourado
  // ══════════════════════════════════════════════════════════════
  core_fragment:      { id: 'core_fragment',      name: 'Fragmento do Núcleo',   emoji: '🔶', type: 'material', rarity: 'common',   tier: 5, stackable: true, description: 'Fragmento do Núcleo Dourado. Base da forja de tier cinco.' },
  phoenix_feather:    { id: 'phoenix_feather',    name: 'Pena de Fênix',         emoji: '🔥', type: 'material', rarity: 'common',   tier: 5, stackable: true, description: 'Pena de Fênix jovem. Carregada de chamas imortais.' },
  core_essence:       { id: 'core_essence',       name: 'Essência do Núcleo',    emoji: '⭐', type: 'material', rarity: 'uncommon', tier: 5, stackable: true, description: 'Essência pura do Núcleo Dourado. Amplifica formações de tier cinco.' },
  transmutation_dust: { id: 'transmutation_dust', name: 'Pó de Transmutação',    emoji: '✨', type: 'material', rarity: 'rare',     tier: 5, stackable: true, description: 'Pó catalisador de transmutação. Converte matéria em energia.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 6 (Nível 15) — Abismo das Almas Eternas
  // ══════════════════════════════════════════════════════════════
  soul_fragment:  { id: 'soul_fragment',  name: 'Fragmento de Alma',    emoji: '👻', type: 'material', rarity: 'common',   tier: 6, stackable: true, description: 'Fragmento de alma espiritual. Essência de seres do abismo.' },
  soul_crystal:   { id: 'soul_crystal',   name: 'Cristal de Alma',      emoji: '💙', type: 'material', rarity: 'common',   tier: 6, stackable: true, description: 'Cristal de alma pura condensada. Brilho eterno.' },
  soul_essence:   { id: 'soul_essence',   name: 'Essência de Alma',     emoji: '🌑', type: 'material', rarity: 'uncommon', tier: 6, stackable: true, description: 'Essência de alma concentrada. Poder dos espíritos eternos.' },
  sacred_qi_ink:  { id: 'sacred_qi_ink',  name: 'Tinta de Qi Sagrado',  emoji: '📜', type: 'material', rarity: 'rare',     tier: 6, stackable: true, description: 'Tinta de Qi Sagrado para inscrição. Catalisador de tier seis.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 7 (Nível 20) — Vale da Transformação Mística
  // ══════════════════════════════════════════════════════════════
  king_scale:  { id: 'king_scale',  name: 'Escama do Rei',  emoji: '👑', type: 'material', rarity: 'common',   tier: 7, stackable: true, description: 'Escama de besta real. Material nobre da transformação mística.' },
  king_blood:  { id: 'king_blood',  name: 'Sangue do Rei',  emoji: '🩸', type: 'material', rarity: 'common',   tier: 7, stackable: true, description: 'Sangue real de feras supremas. Poder ancestral concentrado.' },
  king_core:   { id: 'king_core',   name: 'Núcleo do Rei',  emoji: '💫', type: 'material', rarity: 'uncommon', tier: 7, stackable: true, description: 'Núcleo de besta real. Essência da soberania espiritual.' },
  royal_elixir: { id: 'royal_elixir', name: 'Elixir Real',  emoji: '🍶', type: 'material', rarity: 'rare',     tier: 7, stackable: true, description: 'Elixir destilado do rei. Catalisador de tier sete.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 8 (Nível 25) — Domínio Celestial Unificado
  // ══════════════════════════════════════════════════════════════
  imperial_fragment:   { id: 'imperial_fragment',   name: 'Fragmento Imperial',   emoji: '🔱', type: 'material', rarity: 'common',   tier: 8, stackable: true, description: 'Fragmento de ser imperial. Base da forja celestial.' },
  imperial_crystal:    { id: 'imperial_crystal',    name: 'Cristal Imperial',     emoji: '💠', type: 'material', rarity: 'common',   tier: 8, stackable: true, description: 'Cristal de essência imperial pura. Brilho do domínio celestial.' },
  imperial_essence:    { id: 'imperial_essence',    name: 'Essência Imperial',    emoji: '🌟', type: 'material', rarity: 'uncommon', tier: 8, stackable: true, description: 'Essência de ser imperial puro. Poder do domínio unificado.' },
  transcendence_dust:  { id: 'transcendence_dust',  name: 'Pó de Transcendência', emoji: '☁️', type: 'material', rarity: 'rare',     tier: 8, stackable: true, description: 'Pó de transcendência imperial. Catalisador de tier oito.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 9 (Nível 35) — Portal da Grande Ascensão
  // ══════════════════════════════════════════════════════════════
  sacred_feather:    { id: 'sacred_feather',    name: 'Pluma Sagrada',      emoji: '🪶', type: 'material', rarity: 'common',   tier: 9, stackable: true, description: 'Pluma de ave sagrada do paraíso. Leveza e poder divino.' },
  divine_beast_bone: { id: 'divine_beast_bone', name: 'Osso de Deus-Besta', emoji: '🦷', type: 'material', rarity: 'common',   tier: 9, stackable: true, description: 'Osso de deus-besta do paraíso. Dureza celestial inigualável.' },
  sacred_essence:    { id: 'sacred_essence',    name: 'Essência Sagrada',   emoji: '🌸', type: 'material', rarity: 'uncommon', tier: 9, stackable: true, description: 'Essência pura do sagrado. Flui pelos portais da ascensão.' },
  holy_elixir:       { id: 'holy_elixir',       name: 'Elixir do Santo',    emoji: '🏮', type: 'material', rarity: 'rare',     tier: 9, stackable: true, description: 'Elixir do cultivo sagrado. Catalisador de tier nove.' },

  // ══════════════════════════════════════════════════════════════
  //  MATERIAIS — Tier 10 (Nível 50) — Domínio do Dao Eterno
  // ══════════════════════════════════════════════════════════════
  dao_fragment:          { id: 'dao_fragment',          name: 'Fragmento do Dao',       emoji: '☯️', type: 'material', rarity: 'common',   tier: 10, stackable: true, description: 'Fragmento do Dao eterno. A matéria mais primordial da criação.' },
  creation_crystal:      { id: 'creation_crystal',      name: 'Cristal da Criação',     emoji: '🌌', type: 'material', rarity: 'common',   tier: 10, stackable: true, description: 'Cristal da criação primordial. Contém a essência do universo.' },
  dao_essence:           { id: 'dao_essence',           name: 'Essência do Dao',        emoji: '∞',  type: 'material', rarity: 'uncommon', tier: 10, stackable: true, description: 'Essência do Dao puro. O poder por trás de todas as leis.' },
  primordial_chaos_dust: { id: 'primordial_chaos_dust', name: 'Pó do Caos Primordial',  emoji: '🌪️', type: 'material', rarity: 'rare',     tier: 10, stackable: true, description: 'Pó do caos antes da criação. Catalisador supremo de tier dez.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Refinamento de Qi
  // ══════════════════════════════════════════════════════════════
  pill_qi_condensation:      { id: 'pill_qi_condensation',      name: 'Pílula de Condensação de Qi',          emoji: '💜', type: 'pill', rarity: 'common',    stackable: true, description: 'Condensa o Qi disperso. Usado no estágio intermediário.', stats: { qi: 25 } },
  pill_qi_flow:              { id: 'pill_qi_flow',              name: 'Pílula do Fluxo Espiritual',            emoji: '🔵', type: 'pill', rarity: 'common',    stackable: true, description: 'Harmoniza o fluxo de Qi pelo corpo espiritual.', stats: { hp: 20 } },
  pill_qi_purification:      { id: 'pill_qi_purification',      name: 'Pílula da Purificação do Qi',           emoji: '⚪', type: 'pill', rarity: 'uncommon',  stackable: true, description: 'Purifica impurezas no Qi. Necessária no pico do Refinamento.', stats: { hp: 60 } },
  pill_solid_foundation:     { id: 'pill_solid_foundation',     name: 'Pílula de Estabelecimento da Fundação', emoji: '🟡', type: 'pill', rarity: 'uncommon',  stackable: true, description: 'Estabelece a base para romper ao próximo reino.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Fundação Espiritual
  // ══════════════════════════════════════════════════════════════
  pill_foundation_establish: { id: 'pill_foundation_establish', name: 'Pílula de Consolidação da Base',        emoji: '🔶', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Consolida a base espiritual no estágio inicial da Fundação.', stats: { hp: 50 } },
  pill_base_consolidation:   { id: 'pill_base_consolidation',   name: 'Pílula de Expansão do Mar de Qi',       emoji: '🌊', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Expande o Mar de Qi interno. Estágio avançado da Fundação.', stats: { qi: 60 } },
  pill_nine_pillars:         { id: 'pill_nine_pillars',         name: 'Pílula dos Nove Pilares Espirituais',   emoji: '🏛️', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Fortalece os nove pilares do corpo espiritual.', stats: { hp: 80 } },
  pill_core_creation:        { id: 'pill_core_creation',        name: 'Pílula da Criação do Núcleo',           emoji: '🟠', type: 'pill', rarity: 'rare',      stackable: true, description: 'Catalisador para romper ao Núcleo Dourado.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Núcleo Dourado
  // ══════════════════════════════════════════════════════════════
  pill_golden_glow:          { id: 'pill_golden_glow',          name: 'Pílula do Brilho Áureo',                emoji: '✨', type: 'pill', rarity: 'rare',      stackable: true, description: 'Irradia energia dourada. Estágio inicial do Núcleo.', stats: { hp: 70 } },
  pill_tempered_core:        { id: 'pill_tempered_core',        name: 'Pílula do Núcleo Temperado',            emoji: '🔥', type: 'pill', rarity: 'rare',      stackable: true, description: 'Tempera o Núcleo Dourado com calor primordial.', stats: { qi: 80 } },
  pill_dragon_phoenix:       { id: 'pill_dragon_phoenix',       name: 'Pílula da Essência do Dragão e Fênix',  emoji: '🐉', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Combina essências do Dragão e da Fênix.', stats: { hp: 90 } },
  pill_soul_awakening:       { id: 'pill_soul_awakening',       name: 'Pílula do Despertar da Alma',           emoji: '👁️', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Desperta a alma para romper à Alma Nascente.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Alma Nascente
  // ══════════════════════════════════════════════════════════════
  pill_soul_nourishment:     { id: 'pill_soul_nourishment',     name: 'Pílula de Nutrição da Alma',            emoji: '💙', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Nutre a alma nascente. Estágio inicial.', stats: { hp: 85 } },
  pill_spiritual_strengthen: { id: 'pill_spiritual_strengthen', name: 'Pílula do Fortalecimento Espiritual',   emoji: '⚡', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Fortalece o espírito para batalhas supremas.', stats: { qi: 90 } },
  pill_astral_projection:    { id: 'pill_astral_projection',    name: 'Pílula da Projeção Astral',             emoji: '🌙', type: 'pill', rarity: 'legendary', stackable: true, description: 'Projeta a consciência além do corpo físico.', stats: { hp: 100 } },
  pill_divine_metamorphosis: { id: 'pill_divine_metamorphosis', name: 'Pílula da Metamorfose Divina',          emoji: '🦋', type: 'pill', rarity: 'legendary', stackable: true, description: 'Transforma o cultivador para a Transformação Espiritual.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Transformação Espiritual
  // ══════════════════════════════════════════════════════════════
  pill_elemental_enlighten:  { id: 'pill_elemental_enlighten',  name: 'Pílula da Iluminação Elemental',        emoji: '🌟', type: 'pill', rarity: 'legendary', stackable: true, description: 'Ilumina os elementos dentro do cultivador.', stats: { hp: 95 } },
  pill_spirit_transmutation: { id: 'pill_spirit_transmutation', name: 'Pílula de Transmutação do Espírito',    emoji: '🔮', type: 'pill', rarity: 'legendary', stackable: true, description: 'Transmuta a essência espiritual para nível superior.', stats: { qi: 100 } },
  pill_spiritual_void:       { id: 'pill_spiritual_void',       name: 'Pílula do Vazio Espiritual',            emoji: '🌑', type: 'pill', rarity: 'legendary', stackable: true, description: 'Conecta o cultivador ao vazio primordial.', stats: { hp: 100 } },
  pill_celestial_unity:      { id: 'pill_celestial_unity',      name: 'Pílula da Unidade Celestial',           emoji: '☀️', type: 'pill', rarity: 'legendary', stackable: true, description: 'Une o espírito com os caminhos celestiais para Unificação.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Unificação
  // ══════════════════════════════════════════════════════════════
  pill_dao_fusion:           { id: 'pill_dao_fusion',           name: 'Pílula da Fusão do Dao',                emoji: '☯️', type: 'pill', rarity: 'legendary', stackable: true, description: 'Funde o ser com as leis do Dao.', stats: { hp: 100 } },
  pill_universal_harmony:    { id: 'pill_universal_harmony',    name: 'Pílula da Harmonia Universal',          emoji: '🌌', type: 'pill', rarity: 'legendary', stackable: true, description: 'Harmoniza todas as energias do universo.', stats: { qi: 100 } },
  pill_absolute_dominion:    { id: 'pill_absolute_dominion',    name: 'Pílula do Domínio Absoluto',            emoji: '👑', type: 'pill', rarity: 'legendary', stackable: true, description: 'Confere domínio absoluto sobre o Qi.', stats: { hp: 100 } },
  pill_celestial_tribulation:{ id: 'pill_celestial_tribulation',name: 'Pílula da Tribulação Celestial',        emoji: '⚡', type: 'pill', rarity: 'legendary', stackable: true, description: 'Prepara o corpo para os raios da tribulação.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Ascensão
  // ══════════════════════════════════════════════════════════════
  pill_law_comprehension:    { id: 'pill_law_comprehension',    name: 'Pílula da Compreensão das Leis',        emoji: '📖', type: 'pill', rarity: 'legendary', stackable: true, description: 'Revela as leis fundamentais do Dao ao cultivador.', stats: { hp: 100 } },
  pill_divine_touch:         { id: 'pill_divine_touch',         name: 'Pílula do Toque Divino',                emoji: '🌠', type: 'pill', rarity: 'legendary', stackable: true, description: 'Toque divino que purifica o espírito para a Ascensão.', stats: { qi: 100 } },
  pill_pseudo_immortal:      { id: 'pill_pseudo_immortal',      name: 'Pílula da Essência Pseudo-Imortal',     emoji: '⚜️', type: 'pill', rarity: 'legendary', stackable: true, description: 'Manifesta a essência imortal no corpo mortal.' },
  pill_ascension_elixir:     { id: 'pill_ascension_elixir',     name: 'Elixir da Ascensão Verdadeira',         emoji: '🏆', type: 'pill', rarity: 'legendary', stackable: true, description: 'O elixir definitivo. Abre as portas para o reino Imortal.' },

  // ══════════════════════════════════════════════════════════════
  //  PÍLULAS — Imortal
  // ══════════════════════════════════════════════════════════════
  pill_primordial_dao:       { id: 'pill_primordial_dao',       name: 'Pílula do Dao Primordial',              emoji: '∞',  type: 'pill', rarity: 'legendary', stackable: true, description: 'Contém a essência do Dao antes da criação.', stats: { hp: 100 } },
  pill_cosmic_eternity:      { id: 'pill_cosmic_eternity',      name: 'Pílula da Eternidade Cósmica',          emoji: '🌠', type: 'pill', rarity: 'legendary', stackable: true, description: 'Transcende o tempo e o espaço.', stats: { qi: 100 } },
  pill_celestial_sovereign:  { id: 'pill_celestial_sovereign',  name: 'Pílula do Soberano Celestial',          emoji: '⚜️', type: 'pill', rarity: 'legendary', stackable: true, description: 'A pílula suprema dos imortais.', stats: { hp: 100 } },

  // ── Pílulas legadas (NPC / sistema antigo) ───────────────────
  pill_red_spring:     { id: 'pill_red_spring',     name: 'Pílula da Fonte Vermelha',    emoji: '💊', type: 'pill', rarity: 'common',   stackable: true, description: 'Recupera 30% do HP máximo.', stats: { hp: 30 } },
  pill_qi_restore:     { id: 'pill_qi_restore',     name: 'Pílula de Clareza',           emoji: '💜', type: 'pill', rarity: 'common',   stackable: true, description: 'Acalma a mente. Restauração básica de Qi.', stats: { qi: 15 } },

  // ── Pílulas de Buff — Força (ATK temporário) ─────────────────
  pill_buff_atk_t1:  { id: 'pill_buff_atk_t1',  name: 'Pílula de Força I',    emoji: '⚡', type: 'pill', rarity: 'common',    tier: 1,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 15,   buffDuration: 15 } },
  pill_buff_atk_t2:  { id: 'pill_buff_atk_t2',  name: 'Pílula de Força II',   emoji: '⚡', type: 'pill', rarity: 'uncommon',  tier: 2,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 35,   buffDuration: 20 } },
  pill_buff_atk_t3:  { id: 'pill_buff_atk_t3',  name: 'Pílula de Força III',  emoji: '⚡', type: 'pill', rarity: 'spiritual', tier: 3,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 70,   buffDuration: 25 } },
  pill_buff_atk_t4:  { id: 'pill_buff_atk_t4',  name: 'Pílula de Força IV',   emoji: '⚡', type: 'pill', rarity: 'rare',      tier: 4,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 140,  buffDuration: 35 } },
  pill_buff_atk_t5:  { id: 'pill_buff_atk_t5',  name: 'Pílula de Força V',    emoji: '⚡', type: 'pill', rarity: 'ancient',   tier: 5,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 280,  buffDuration: 45 } },
  pill_buff_atk_t6:  { id: 'pill_buff_atk_t6',  name: 'Pílula de Força VI',   emoji: '⚡', type: 'pill', rarity: 'ancient',   tier: 6,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 500,  buffDuration: 60 } },
  pill_buff_atk_t7:  { id: 'pill_buff_atk_t7',  name: 'Pílula de Força VII',  emoji: '⚡', type: 'pill', rarity: 'ancient',   tier: 7,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 850,  buffDuration: 60 } },
  pill_buff_atk_t8:  { id: 'pill_buff_atk_t8',  name: 'Pílula de Força VIII', emoji: '⚡', type: 'pill', rarity: 'legendary', tier: 8,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 1400, buffDuration: 60 } },
  pill_buff_atk_t9:  { id: 'pill_buff_atk_t9',  name: 'Pílula de Força IX',   emoji: '⚡', type: 'pill', rarity: 'legendary', tier: 9,  stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 2200, buffDuration: 60 } },
  pill_buff_atk_t10: { id: 'pill_buff_atk_t10', name: 'Pílula de Força X',    emoji: '⚡', type: 'pill', rarity: 'legendary', tier: 10, stackable: true, description: 'Amplifica temporariamente o poder de ataque.',   stats: { atk: 3500, buffDuration: 60 } },

  // ── Pílulas de Buff — Defesa (DEF temporário) ────────────────
  pill_buff_def_t1:  { id: 'pill_buff_def_t1',  name: 'Pílula de Defesa I',    emoji: '🛡', type: 'pill', rarity: 'common',    tier: 1,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 6,    buffDuration: 15 } },
  pill_buff_def_t2:  { id: 'pill_buff_def_t2',  name: 'Pílula de Defesa II',   emoji: '🛡', type: 'pill', rarity: 'uncommon',  tier: 2,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 15,   buffDuration: 20 } },
  pill_buff_def_t3:  { id: 'pill_buff_def_t3',  name: 'Pílula de Defesa III',  emoji: '🛡', type: 'pill', rarity: 'spiritual', tier: 3,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 32,   buffDuration: 25 } },
  pill_buff_def_t4:  { id: 'pill_buff_def_t4',  name: 'Pílula de Defesa IV',   emoji: '🛡', type: 'pill', rarity: 'rare',      tier: 4,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 65,   buffDuration: 35 } },
  pill_buff_def_t5:  { id: 'pill_buff_def_t5',  name: 'Pílula de Defesa V',    emoji: '🛡', type: 'pill', rarity: 'ancient',   tier: 5,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 130,  buffDuration: 45 } },
  pill_buff_def_t6:  { id: 'pill_buff_def_t6',  name: 'Pílula de Defesa VI',   emoji: '🛡', type: 'pill', rarity: 'ancient',   tier: 6,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 230,  buffDuration: 60 } },
  pill_buff_def_t7:  { id: 'pill_buff_def_t7',  name: 'Pílula de Defesa VII',  emoji: '🛡', type: 'pill', rarity: 'ancient',   tier: 7,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 380,  buffDuration: 60 } },
  pill_buff_def_t8:  { id: 'pill_buff_def_t8',  name: 'Pílula de Defesa VIII', emoji: '🛡', type: 'pill', rarity: 'legendary', tier: 8,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 620,  buffDuration: 60 } },
  pill_buff_def_t9:  { id: 'pill_buff_def_t9',  name: 'Pílula de Defesa IX',   emoji: '🛡', type: 'pill', rarity: 'legendary', tier: 9,  stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 980,  buffDuration: 60 } },
  pill_buff_def_t10: { id: 'pill_buff_def_t10', name: 'Pílula de Defesa X',    emoji: '🛡', type: 'pill', rarity: 'legendary', tier: 10, stackable: true, description: 'Reforça temporariamente a resistência corporal.',  stats: { def: 1550, buffDuration: 60 } },

  // ── Pílulas de Buff — Vitalidade (HP máx temporário) ─────────
  pill_buff_hp_t1:  { id: 'pill_buff_hp_t1',  name: 'Pílula de Vitalidade I',    emoji: '❤', type: 'pill', rarity: 'common',    tier: 1,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 50,    buffDuration: 15 } },
  pill_buff_hp_t2:  { id: 'pill_buff_hp_t2',  name: 'Pílula de Vitalidade II',   emoji: '❤', type: 'pill', rarity: 'uncommon',  tier: 2,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 130,   buffDuration: 20 } },
  pill_buff_hp_t3:  { id: 'pill_buff_hp_t3',  name: 'Pílula de Vitalidade III',  emoji: '❤', type: 'pill', rarity: 'spiritual', tier: 3,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 280,   buffDuration: 25 } },
  pill_buff_hp_t4:  { id: 'pill_buff_hp_t4',  name: 'Pílula de Vitalidade IV',   emoji: '❤', type: 'pill', rarity: 'rare',      tier: 4,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 580,   buffDuration: 35 } },
  pill_buff_hp_t5:  { id: 'pill_buff_hp_t5',  name: 'Pílula de Vitalidade V',    emoji: '❤', type: 'pill', rarity: 'ancient',   tier: 5,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 1100,  buffDuration: 45 } },
  pill_buff_hp_t6:  { id: 'pill_buff_hp_t6',  name: 'Pílula de Vitalidade VI',   emoji: '❤', type: 'pill', rarity: 'ancient',   tier: 6,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 2000,  buffDuration: 60 } },
  pill_buff_hp_t7:  { id: 'pill_buff_hp_t7',  name: 'Pílula de Vitalidade VII',  emoji: '❤', type: 'pill', rarity: 'ancient',   tier: 7,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 3500,  buffDuration: 60 } },
  pill_buff_hp_t8:  { id: 'pill_buff_hp_t8',  name: 'Pílula de Vitalidade VIII', emoji: '❤', type: 'pill', rarity: 'legendary', tier: 8,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 6000,  buffDuration: 60 } },
  pill_buff_hp_t9:  { id: 'pill_buff_hp_t9',  name: 'Pílula de Vitalidade IX',   emoji: '❤', type: 'pill', rarity: 'legendary', tier: 9,  stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 10000, buffDuration: 60 } },
  pill_buff_hp_t10: { id: 'pill_buff_hp_t10', name: 'Pílula de Vitalidade X',    emoji: '❤', type: 'pill', rarity: 'legendary', tier: 10, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 16000, buffDuration: 60 } },

  // ── Pílulas de Buff — Foco (Crit % temporário) ───────────────
  pill_buff_crit_t1:  { id: 'pill_buff_crit_t1',  name: 'Pílula de Foco I',    emoji: '💥', type: 'pill', rarity: 'common',    tier: 1,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 2,  buffDuration: 15 } },
  pill_buff_crit_t2:  { id: 'pill_buff_crit_t2',  name: 'Pílula de Foco II',   emoji: '💥', type: 'pill', rarity: 'uncommon',  tier: 2,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 5,  buffDuration: 20 } },
  pill_buff_crit_t3:  { id: 'pill_buff_crit_t3',  name: 'Pílula de Foco III',  emoji: '💥', type: 'pill', rarity: 'spiritual', tier: 3,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 9,  buffDuration: 25 } },
  pill_buff_crit_t4:  { id: 'pill_buff_crit_t4',  name: 'Pílula de Foco IV',   emoji: '💥', type: 'pill', rarity: 'rare',      tier: 4,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 14, buffDuration: 35 } },
  pill_buff_crit_t5:  { id: 'pill_buff_crit_t5',  name: 'Pílula de Foco V',    emoji: '💥', type: 'pill', rarity: 'ancient',   tier: 5,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 22, buffDuration: 45 } },
  pill_buff_crit_t6:  { id: 'pill_buff_crit_t6',  name: 'Pílula de Foco VI',   emoji: '💥', type: 'pill', rarity: 'ancient',   tier: 6,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 30, buffDuration: 60 } },
  pill_buff_crit_t7:  { id: 'pill_buff_crit_t7',  name: 'Pílula de Foco VII',  emoji: '💥', type: 'pill', rarity: 'ancient',   tier: 7,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 40, buffDuration: 60 } },
  pill_buff_crit_t8:  { id: 'pill_buff_crit_t8',  name: 'Pílula de Foco VIII', emoji: '💥', type: 'pill', rarity: 'legendary', tier: 8,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 50, buffDuration: 60 } },
  pill_buff_crit_t9:  { id: 'pill_buff_crit_t9',  name: 'Pílula de Foco IX',   emoji: '💥', type: 'pill', rarity: 'legendary', tier: 9,  stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 62, buffDuration: 60 } },
  pill_buff_crit_t10: { id: 'pill_buff_crit_t10', name: 'Pílula de Foco X',    emoji: '💥', type: 'pill', rarity: 'legendary', tier: 10, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 75, buffDuration: 60 } },
}
