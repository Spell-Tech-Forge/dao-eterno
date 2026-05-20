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
    description: 'Ouro fundido com Essência de Trovão. Espaço interno vastíssimo.',
    stats: { slots: 120 },
  },

  // ── Adagas ────────────────────────────────────────────────────
  dagger_bone: {
    id: 'dagger_bone', name: 'Adaga de Osso', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Presa de javali talhada em adaga. Rápida e afiada.',
    stats: { atk: 7, speed: 0.9, crit: 2 },
  },
  dagger_scale: {
    id: 'dagger_scale', name: 'Adaga de Escama', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Escamas de lagarto jade forjadas em lâmina dupla.',
    stats: { atk: 14, speed: 0.8, crit: 3.5 },
  },
  dagger_iron: {
    id: 'dagger_iron', name: 'Adaga de Ferro', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Ferro simples, mas afiado o suficiente para ferir espíritos.',
    stats: { atk: 12, speed: 0.85, crit: 2.5 },
  },
  dagger_bronze_spiritual: {
    id: 'dagger_bronze_spiritual', name: 'Adaga de Bronze Espiritual', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Bronze infundido de Qi. Corta além do plano físico.',
    stats: { atk: 18, speed: 0.75, crit: 4 },
  },

  // ── Espadas de uma mão ────────────────────────────────────────
  sword_bamboo: {
    id: 'sword_bamboo', name: 'Espada de Bambu', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Arma de treino sem refinamento espiritual.',
    stats: { atk: 5, speed: 1.5, crit: 1 },
  },
  sword_short_iron: {
    id: 'sword_short_iron', name: 'Espada Curta de Ferro', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Espada curta e balanceada para iniciantes.',
    stats: { atk: 11, speed: 1.3, crit: 1.5 },
  },
  sword_iron: {
    id: 'sword_iron', name: 'Espada de Ferro', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Ferro comum forjado por um ferreiro mortal.',
    stats: { atk: 15, speed: 1.4, crit: 1.5 },
  },
  sword_long_bronze: {
    id: 'sword_long_bronze', name: 'Espada Longa de Bronze', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Espada de bronze com alcance superior.',
    stats: { atk: 24, speed: 1.5, crit: 2 },
  },
  sword_bronze_spiritual: {
    id: 'sword_bronze_spiritual', name: 'Espada de Bronze Espiritual', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Bronze infundido de Qi. Corta mais do que ferro comum.',
    stats: { atk: 28, speed: 1.2, crit: 2.5 },
  },
  sword_jade: {
    id: 'sword_jade', name: 'Espada de Jade', emoji: '⚔️',
    type: 'weapon', rarity: 'common',
    description: 'Jade espiritual afiado com formação de corte.',
    stats: { atk: 45, speed: 1.0, crit: 3.5 },
  },

  // ── Espadas de duas mãos ──────────────────────────────────────
  sword_twohanded_bone: {
    id: 'sword_twohanded_bone', name: 'Mandoble de Osso', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Grande lâmina de osso de javali. Lenta mas poderosa.',
    stats: { atk: 18, speed: 2.0, crit: 0.5 },
  },
  sword_twohanded_iron: {
    id: 'sword_twohanded_iron', name: 'Espada Grande de Ferro', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Requer as duas mãos. Dano massivo, velocidade lenta.',
    stats: { atk: 30, speed: 2.0, crit: 1 },
  },
  sword_twohanded_bronze: {
    id: 'sword_twohanded_bronze', name: 'Espada Grande de Bronze', emoji: '🗡️',
    type: 'weapon', rarity: 'common',
    description: 'Bronze espiritual forjado em lâmina colossal.',
    stats: { atk: 46, speed: 1.9, crit: 1.5 },
  },

  // ── Machados ──────────────────────────────────────────────────
  axe_bone: {
    id: 'axe_bone', name: 'Machado de Osso', emoji: '🪓',
    type: 'weapon', rarity: 'common',
    description: 'Presas de javali montadas em cabo de bambu.',
    stats: { atk: 16, speed: 1.9, crit: 0.5 },
  },
  axe_iron: {
    id: 'axe_iron', name: 'Machado de Ferro', emoji: '🪓',
    type: 'weapon', rarity: 'common',
    description: 'Ferro bruto em formato de machado. Lento e devastador.',
    stats: { atk: 22, speed: 2.0, crit: 0.5 },
  },
  axe_bronze_spiritual: {
    id: 'axe_bronze_spiritual', name: 'Machado de Bronze Espiritual', emoji: '🪓',
    type: 'weapon', rarity: 'common',
    description: 'Bronze infundido de Qi. Cada golpe ressoa com energia espiritual.',
    stats: { atk: 36, speed: 1.8, crit: 1 },
  },
  axe_thunder: {
    id: 'axe_thunder', name: 'Machado do Trovão', emoji: '🪓',
    type: 'weapon', rarity: 'common',
    description: 'Forjado com pena de trovão. Cada golpe carrega eletricidade.',
    stats: { atk: 55, speed: 1.7, crit: 2 },
  },

  // ── Bastões ───────────────────────────────────────────────────
  staff_bamboo: {
    id: 'staff_bamboo', name: 'Bastão de Bambu', emoji: '🪄',
    type: 'weapon', rarity: 'common',
    description: 'Bambu reforçado. Fraco mas barato de fabricar.',
    stats: { atk: 6, speed: 1.3, crit: 1, qi: 10 },
  },
  staff_qi: {
    id: 'staff_qi', name: 'Bastão de Qi', emoji: '🪄',
    type: 'weapon', rarity: 'common',
    description: 'Tecido com fios de Qi condensado. Amplifica energia espiritual.',
    stats: { atk: 14, speed: 1.0, crit: 2, qi: 25 },
  },
  staff_spiritual: {
    id: 'staff_spiritual', name: 'Bastão Espiritual', emoji: '🪄',
    type: 'weapon', rarity: 'common',
    description: 'Essência espiritual cristalizada em forma de bastão.',
    stats: { atk: 22, speed: 0.9, crit: 3, qi: 50 },
  },
  staff_jade: {
    id: 'staff_jade', name: 'Bastão de Jade Imperial', emoji: '🪄',
    type: 'weapon', rarity: 'common',
    description: 'Jade de alta pureza. Conecta o cultivador ao fluxo do Dao.',
    stats: { atk: 35, speed: 0.8, crit: 4, qi: 80 },
  },

  // ── Armaduras de Pano ─────────────────────────────────────────
  armor_cloth_robe: {
    id: 'armor_cloth_robe', name: 'Túnica de Pano', emoji: '👘',
    type: 'armor', rarity: 'common',
    description: 'Tecido simples. Pouca proteção, mas leve.',
    stats: { def: 3, hp: 20 },
  },
  armor_cloth_reinforced: {
    id: 'armor_cloth_reinforced', name: 'Manto de Pano Reforçado', emoji: '👘',
    type: 'armor', rarity: 'common',
    description: 'Camadas duplas de pano com seda de aranha nas costuras.',
    stats: { def: 6, hp: 35 },
  },
  armor_cloth_spiritual: {
    id: 'armor_cloth_spiritual', name: 'Manto Espiritual de Pano', emoji: '👘',
    type: 'armor', rarity: 'common',
    description: 'Tecido imbuído de Qi de proteção leve.',
    stats: { def: 10, hp: 55, qi: 15 },
  },

  // ── Armaduras de Couro ────────────────────────────────────────
  armor_leather_basic: {
    id: 'armor_leather_basic', name: 'Peitoral de Couro', emoji: '🥋',
    type: 'armor', rarity: 'common',
    description: 'Couro de aranha curtido. Proteção básica.',
    stats: { def: 7, hp: 40 },
  },
  robe_leather: {
    id: 'robe_leather', name: 'Armadura de Couro Reforçado', emoji: '🥋',
    type: 'armor', rarity: 'common',
    description: 'Couro curtido com resina espiritual básica.',
    stats: { def: 12, hp: 60 },
  },
  armor_leather_scale: {
    id: 'armor_leather_scale', name: 'Armadura de Escamas de Jade', emoji: '🥋',
    type: 'armor', rarity: 'common',
    description: 'Couro reforçado com escamas de lagarto. Equilibrada e resistente.',
    stats: { def: 18, hp: 75 },
  },
  armor_leather_reinforced: {
    id: 'armor_leather_reinforced', name: 'Couraça de Couro Espiritual', emoji: '🥋',
    type: 'armor', rarity: 'common',
    description: 'Couro curtido em Qi de defesa. Mais leve que metal.',
    stats: { def: 22, hp: 90 },
  },

  // ── Armaduras de Placa ────────────────────────────────────────
  armor_plate_iron: {
    id: 'armor_plate_iron', name: 'Peitoral de Ferro', emoji: '🛡️',
    type: 'armor', rarity: 'common',
    description: 'Placa de ferro forjada. Pesada mas protetora.',
    stats: { def: 20, hp: 50 },
  },
  armor_plate_bronze: {
    id: 'armor_plate_bronze', name: 'Peitoral de Bronze Espiritual', emoji: '🛡️',
    type: 'armor', rarity: 'common',
    description: 'Bronze espiritual fundido em placa. Absorve dano com Qi.',
    stats: { def: 30, hp: 80 },
  },
  robe_spiritual: {
    id: 'robe_spiritual', name: 'Manto Espiritual', emoji: '🥷',
    type: 'armor', rarity: 'common',
    description: 'Tecido imbuído de Qi de proteção.',
    stats: { def: 18, hp: 100 },
  },

  // ── Materiais ─────────────────────────────────────────────────
  spider_leather:    { id: 'spider_leather',    name: 'Couro de Aranha',             emoji: '🟫', type: 'material', rarity: 'common',    stackable: true, description: 'Exoesqueleto maleável de aranha espiritual.' },
  spider_silk:       { id: 'spider_silk',       name: 'Teia de Seda Espiritual',      emoji: '🕸️', type: 'material', rarity: 'common', stackable: true, description: 'Fios extremamente resistentes produzidos por aranhas avançadas.' },
  spider_venom:      { id: 'spider_venom',      name: 'Veneno de Aranha Concentrado', emoji: '⚗️', type: 'material', rarity: 'rare',      stackable: true, description: 'Veneno destilado de alta pureza. Ingrediente alquímico valioso.' },
  lizard_scale:      { id: 'lizard_scale',      name: 'Escama de Lagarto de Jade',    emoji: '🟩', type: 'material', rarity: 'common', stackable: true, description: 'Escama com propriedades de jade natural.' },
  boar_tusk:         { id: 'boar_tusk',         name: 'Presa de Javali Espiritual',   emoji: '🦷', type: 'material', rarity: 'common',    stackable: true, description: 'Presa endurecida de javali espiritual.' },
  thunder_feather:   { id: 'thunder_feather',   name: 'Pena do Trovão',               emoji: '⚡', type: 'material', rarity: 'rare',      stackable: true, description: 'Pena carregada de eletricidade de uma Águia do Trovão.' },
  bronze_spiritual:  { id: 'bronze_spiritual',  name: 'Bronze Espiritual',            emoji: '🔶', type: 'material', rarity: 'common', stackable: true, description: 'Bronze fundido com cristais de Qi. Base da forja espiritual.' },
  qi_thread:         { id: 'qi_thread',         name: 'Fio de Qi',                    emoji: '🧵', type: 'material', rarity: 'common',    stackable: true, description: 'Fio tecido com energia espiritual condensada.' },
  jade_raw:          { id: 'jade_raw',          name: 'Jade Bruto',                   emoji: '💚', type: 'material', rarity: 'common', stackable: true, description: 'Jade não lapidado com alto teor espiritual.' },
  spiritual_essence: { id: 'spiritual_essence', name: 'Essência Espiritual',          emoji: '✨', type: 'material', rarity: 'common',    stackable: true, description: 'Qi condensado em forma sólida. Ingrediente universal.' },
  wolf_fang:         { id: 'wolf_fang',         name: 'Presa de Lobo de Raios',       emoji: '⚡', type: 'material', rarity: 'common', stackable: true, description: 'Presa eletrificada de lobo espiritual.' },
  tiger_core:        { id: 'tiger_core',        name: 'Núcleo de Tigre Espiritual',   emoji: '🔮', type: 'material', rarity: 'rare',      stackable: true, description: 'Núcleo de energia concentrada. Muito valorizado.' },

  // ── Pílulas — Refinamento de Qi (Tier 1–2) ───────────────────
  pill_red_spring:            { id: 'pill_red_spring',            name: 'Pílula da Fonte Vermelha',        emoji: '💊', type: 'pill', rarity: 'common',    stackable: true, description: 'Recupera 30% do HP máximo.', stats: { hp: 30 } },
  pill_qi_condensation:       { id: 'pill_qi_condensation',       name: 'Pílula de Condensação de Qi',     emoji: '💜', type: 'pill', rarity: 'common',    stackable: true, description: 'Restaura Qi condensando energia do ambiente.', stats: { qi: 25 } },
  pill_spiritual_flow:        { id: 'pill_spiritual_flow',        name: 'Pílula do Fluxo Espiritual',      emoji: '🔵', type: 'pill', rarity: 'common',    stackable: true, description: 'Harmoniza o fluxo de HP e Qi simultaneamente.', stats: { hp: 20 } },
  pill_qi_purification:       { id: 'pill_qi_purification',       name: 'Pílula da Purificação do Qi',     emoji: '⚪', type: 'pill', rarity: 'uncommon',  stackable: true, description: 'Purifica impurezas e restaura grande parte do HP.', stats: { hp: 60 } },
  pill_foundation_establish:  { id: 'pill_foundation_establish',  name: 'Pílula de Estabelecimento da Fundação', emoji: '🟡', type: 'pill', rarity: 'uncommon', stackable: true, description: 'Solidifica a Fundação Espiritual. Necessária para romper ao próximo reino.' },

  // ── Pílulas — Fundação Espiritual (Tier 3–4) ─────────────────
  pill_base_consolidation:    { id: 'pill_base_consolidation',    name: 'Pílula de Consolidação da Base',  emoji: '🔶', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Consolida a base espiritual, restaurando HP profundamente.', stats: { hp: 50 } },
  pill_qi_sea_expansion:      { id: 'pill_qi_sea_expansion',      name: 'Pílula de Expansão do Mar de Qi', emoji: '🌊', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Expande o Mar de Qi interno, restaurando grande quantidade de Qi.', stats: { qi: 60 } },
  pill_nine_pillars:          { id: 'pill_nine_pillars',          name: 'Pílula dos Nove Pilares Espirituais', emoji: '🏛️', type: 'pill', rarity: 'spiritual', stackable: true, description: 'Fortalece os nove pilares do corpo espiritual.', stats: { hp: 80 } },
  pill_core_creation:         { id: 'pill_core_creation',         name: 'Pílula da Criação do Núcleo',     emoji: '🟠', type: 'pill', rarity: 'rare',      stackable: true, description: 'Catalisador para a formação do Núcleo Dourado.' },

  // ── Pílulas — Núcleo Dourado (Tier 4–5) ──────────────────────
  pill_golden_glow:           { id: 'pill_golden_glow',           name: 'Pílula do Brilho Áureo',          emoji: '✨', type: 'pill', rarity: 'rare',      stackable: true, description: 'Irradia energia dourada pelo corpo, restaurando HP em proporção elevada.', stats: { hp: 70 } },
  pill_tempered_core:         { id: 'pill_tempered_core',         name: 'Pílula do Núcleo Temperado',      emoji: '🔥', type: 'pill', rarity: 'rare',      stackable: true, description: 'Tempera o núcleo dourado com calor primordial.', stats: { qi: 80 } },
  pill_dragon_phoenix:        { id: 'pill_dragon_phoenix',        name: 'Pílula da Essência do Dragão e Fênix', emoji: '🐉', type: 'pill', rarity: 'ancient', stackable: true, description: 'Combina essências do Dragão e da Fênix. Restaura HP e Qi ao mesmo tempo.', stats: { hp: 90 } },
  pill_soul_awakening:        { id: 'pill_soul_awakening',        name: 'Pílula do Despertar da Alma',     emoji: '👁️', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Desperta a alma adormecida para o próximo estágio.' },

  // ── Pílulas — Alma Nascente (Tier 5–6) ───────────────────────
  pill_soul_nourishment:      { id: 'pill_soul_nourishment',      name: 'Pílula de Nutrição da Alma',      emoji: '💙', type: 'pill', rarity: 'ancient',   stackable: true, description: 'Nutre a alma nascente, restaurando HP profundamente.', stats: { hp: 85 } },
  pill_spiritual_strengthen:  { id: 'pill_spiritual_strengthen',  name: 'Pílula do Fortalecimento Espiritual', emoji: '⚡', type: 'pill', rarity: 'ancient', stackable: true, description: 'Fortalece o espírito para grandes batalhas.', stats: { qi: 90 } },
  pill_astral_projection:     { id: 'pill_astral_projection',     name: 'Pílula da Projeção Astral',       emoji: '🌙', type: 'pill', rarity: 'legendary',  stackable: true, description: 'Projeta a consciência além do corpo físico.', stats: { hp: 100 } },
  pill_divine_metamorphosis:  { id: 'pill_divine_metamorphosis',  name: 'Pílula da Metamorfose Divina',    emoji: '🦋', type: 'pill', rarity: 'legendary',  stackable: true, description: 'Transforma o cultivador para a Transformação Espiritual.' },

  // ── Pílulas — Transformação Espiritual (Tier 6–7) ────────────
  pill_elemental_enlighten:   { id: 'pill_elemental_enlighten',   name: 'Pílula da Iluminação Elemental',  emoji: '🌟', type: 'pill', rarity: 'legendary',  stackable: true, description: 'Ilumina os elementos dentro do cultivador.', stats: { hp: 95 } },
  pill_spirit_transmutation:  { id: 'pill_spirit_transmutation',  name: 'Pílula de Transmutação do Espírito', emoji: '🔮', type: 'pill', rarity: 'legendary', stackable: true, description: 'Transmuta a essência espiritual para nível superior.', stats: { qi: 100 } },
  pill_spiritual_void:        { id: 'pill_spiritual_void',        name: 'Pílula do Vazio Espiritual',      emoji: '🌑', type: 'pill', rarity: 'legendary',  stackable: true, description: 'Conecta o cultivador ao vazio primordial.', stats: { hp: 100 } },
  pill_celestial_unity:       { id: 'pill_celestial_unity',       name: 'Pílula da Unidade Celestial',     emoji: '☀️', type: 'pill', rarity: 'legendary',  stackable: true, description: 'Une o espírito com os caminhos celestiais para Unificação.' },

  // ── Pílulas — Unificação e acima (Tier 7–10) ─────────────────
  pill_dao_fusion:            { id: 'pill_dao_fusion',            name: 'Pílula da Fusão do Dao',          emoji: '☯️', type: 'pill', rarity: 'legendary',   stackable: true, description: 'Funde o ser com as leis do Dao.', stats: { hp: 100 } },
  pill_universal_harmony:     { id: 'pill_universal_harmony',     name: 'Pílula da Harmonia Universal',    emoji: '🌌', type: 'pill', rarity: 'legendary',   stackable: true, description: 'Harmoniza todas as energias do universo.', stats: { qi: 100 } },
  pill_absolute_dominion:     { id: 'pill_absolute_dominion',     name: 'Pílula do Domínio Absoluto',      emoji: '👑', type: 'pill', rarity: 'legendary',   stackable: true, description: 'Confere domínio absoluto sobre o Qi.', stats: { hp: 100 } },
  pill_celestial_tribulation: { id: 'pill_celestial_tribulation', name: 'Pílula da Tribulação Celestial',  emoji: '⚡', type: 'pill', rarity: 'legendary',   stackable: true, description: 'Prepara o corpo para os raios da tribulação da Ascensão.' },
  pill_ascension_elixir:      { id: 'pill_ascension_elixir',      name: 'Elixir da Ascensão Verdadeira',   emoji: '🏆', type: 'pill', rarity: 'legendary',   stackable: true, description: 'O elixir definitivo. Abre as portas para o reino Imortal.' },

  // ── Pílulas — Reino Imortal (Tier 9–10) ──────────────────────
  pill_primordial_dao:        { id: 'pill_primordial_dao',        name: 'Pílula do Dao Primordial',        emoji: '∞',  type: 'pill', rarity: 'legendary',   stackable: true, description: 'Contém a essência do Dao antes da criação.', stats: { hp: 100 } },
  pill_cosmic_eternity:       { id: 'pill_cosmic_eternity',       name: 'Pílula da Eternidade Cósmica',    emoji: '🌠', type: 'pill', rarity: 'legendary',   stackable: true, description: 'Transcende o tempo e o espaço.', stats: { qi: 100 } },
  pill_celestial_sovereign:   { id: 'pill_celestial_sovereign',   name: 'Pílula do Soberano Celestial',    emoji: '⚜️', type: 'pill', rarity: 'legendary',   stackable: true, description: 'A pílula suprema dos imortais.', stats: { hp: 100 } },

  // ── Pílulas legadas ───────────────────────────────────────────
  pill_qi_restore:            { id: 'pill_qi_restore',      name: 'Pílula de Clareza',          emoji: '💜', type: 'pill', rarity: 'common',    stackable: true, description: 'Acalma a mente. Versão básica de restauração.', stats: { qi: 15 } },
  pill_solid_foundation:      { id: 'pill_solid_foundation', name: 'Pílula da Fundação Sólida',  emoji: '🟡', type: 'pill', rarity: 'uncommon',  stackable: true, description: 'Necessária para o breakthrough ao reino Fundação Espiritual.' },

  // ── Pílulas de Buff — Força (ATK temporário) ─────────────────
  pill_buff_atk_t1: { id: 'pill_buff_atk_t1', name: 'Pílula de Força I',   emoji: '⚡', type: 'pill', rarity: 'common',    tier: 1, stackable: true, description: 'Amplifica temporariamente o poder de ataque.', stats: { atk: 15,  buffDuration: 15 } },
  pill_buff_atk_t2: { id: 'pill_buff_atk_t2', name: 'Pílula de Força II',  emoji: '⚡', type: 'pill', rarity: 'uncommon',  tier: 2, stackable: true, description: 'Amplifica temporariamente o poder de ataque.', stats: { atk: 30,  buffDuration: 20 } },
  pill_buff_atk_t3: { id: 'pill_buff_atk_t3', name: 'Pílula de Força III', emoji: '⚡', type: 'pill', rarity: 'spiritual', tier: 3, stackable: true, description: 'Amplifica temporariamente o poder de ataque.', stats: { atk: 60,  buffDuration: 25 } },
  pill_buff_atk_t4: { id: 'pill_buff_atk_t4', name: 'Pílula de Força IV',  emoji: '⚡', type: 'pill', rarity: 'rare',      tier: 4, stackable: true, description: 'Amplifica temporariamente o poder de ataque.', stats: { atk: 120, buffDuration: 35 } },
  pill_buff_atk_t5: { id: 'pill_buff_atk_t5', name: 'Pílula de Força V',   emoji: '⚡', type: 'pill', rarity: 'ancient',   tier: 5, stackable: true, description: 'Amplifica temporariamente o poder de ataque.', stats: { atk: 250, buffDuration: 45 } },

  // ── Pílulas de Buff — Defesa (DEF temporário) ────────────────
  pill_buff_def_t1: { id: 'pill_buff_def_t1', name: 'Pílula de Defesa I',   emoji: '🛡', type: 'pill', rarity: 'common',    tier: 1, stackable: true, description: 'Reforça temporariamente a resistência corporal.', stats: { def: 6,   buffDuration: 15 } },
  pill_buff_def_t2: { id: 'pill_buff_def_t2', name: 'Pílula de Defesa II',  emoji: '🛡', type: 'pill', rarity: 'uncommon',  tier: 2, stackable: true, description: 'Reforça temporariamente a resistência corporal.', stats: { def: 15,  buffDuration: 20 } },
  pill_buff_def_t3: { id: 'pill_buff_def_t3', name: 'Pílula de Defesa III', emoji: '🛡', type: 'pill', rarity: 'spiritual', tier: 3, stackable: true, description: 'Reforça temporariamente a resistência corporal.', stats: { def: 30,  buffDuration: 25 } },
  pill_buff_def_t4: { id: 'pill_buff_def_t4', name: 'Pílula de Defesa IV',  emoji: '🛡', type: 'pill', rarity: 'rare',      tier: 4, stackable: true, description: 'Reforça temporariamente a resistência corporal.', stats: { def: 60,  buffDuration: 35 } },
  pill_buff_def_t5: { id: 'pill_buff_def_t5', name: 'Pílula de Defesa V',   emoji: '🛡', type: 'pill', rarity: 'ancient',   tier: 5, stackable: true, description: 'Reforça temporariamente a resistência corporal.', stats: { def: 120, buffDuration: 45 } },

  // ── Pílulas de Buff — Vitalidade (HP máx temporário) ─────────
  pill_buff_hp_t1: { id: 'pill_buff_hp_t1', name: 'Pílula de Vitalidade I',   emoji: '❤', type: 'pill', rarity: 'common',    tier: 1, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 50,   buffDuration: 15 } },
  pill_buff_hp_t2: { id: 'pill_buff_hp_t2', name: 'Pílula de Vitalidade II',  emoji: '❤', type: 'pill', rarity: 'uncommon',  tier: 2, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 120,  buffDuration: 20 } },
  pill_buff_hp_t3: { id: 'pill_buff_hp_t3', name: 'Pílula de Vitalidade III', emoji: '❤', type: 'pill', rarity: 'spiritual', tier: 3, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 250,  buffDuration: 25 } },
  pill_buff_hp_t4: { id: 'pill_buff_hp_t4', name: 'Pílula de Vitalidade IV',  emoji: '❤', type: 'pill', rarity: 'rare',      tier: 4, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 500,  buffDuration: 35 } },
  pill_buff_hp_t5: { id: 'pill_buff_hp_t5', name: 'Pílula de Vitalidade V',   emoji: '❤', type: 'pill', rarity: 'ancient',   tier: 5, stackable: true, description: 'Aumenta temporariamente o HP máximo.', stats: { hp: 1000, buffDuration: 45 } },

  // ── Pílulas de Buff — Foco (Crit % temporário) ───────────────
  pill_buff_crit_t1: { id: 'pill_buff_crit_t1', name: 'Pílula de Foco I',   emoji: '💥', type: 'pill', rarity: 'common',    tier: 1, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 2,  buffDuration: 15 } },
  pill_buff_crit_t2: { id: 'pill_buff_crit_t2', name: 'Pílula de Foco II',  emoji: '💥', type: 'pill', rarity: 'uncommon',  tier: 2, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 5,  buffDuration: 20 } },
  pill_buff_crit_t3: { id: 'pill_buff_crit_t3', name: 'Pílula de Foco III', emoji: '💥', type: 'pill', rarity: 'spiritual', tier: 3, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 8,  buffDuration: 25 } },
  pill_buff_crit_t4: { id: 'pill_buff_crit_t4', name: 'Pílula de Foco IV',  emoji: '💥', type: 'pill', rarity: 'rare',      tier: 4, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 12, buffDuration: 35 } },
  pill_buff_crit_t5: { id: 'pill_buff_crit_t5', name: 'Pílula de Foco V',   emoji: '💥', type: 'pill', rarity: 'ancient',   tier: 5, stackable: true, description: 'Afina temporariamente a percepção de batalha.', stats: { crit: 20, buffDuration: 45 } },
}
