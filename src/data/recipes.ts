import type { RecipeDefinition } from '../types'

export const RECIPE_DEFS: Record<string, RecipeDefinition> = {

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 1 (Aprendiz de Forja)
  // ═══════════════════════════════════════════════════════════════
  forge_staff_bamboo: {
    id: 'forge_staff_bamboo', name: 'Forjar Bastão de Bambu',
    category: 'forja', outputItemId: 'staff_bamboo', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'qi_thread', quantity: 3 }, { itemId: 'boar_tusk', quantity: 1 }],
  },
  forge_dagger_bone: {
    id: 'forge_dagger_bone', name: 'Forjar Adaga de Osso',
    category: 'forja', outputItemId: 'dagger_bone', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'boar_tusk', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  forge_armor_cloth_robe: {
    id: 'forge_armor_cloth_robe', name: 'Costurar Túnica de Pano',
    category: 'forja', outputItemId: 'armor_cloth_robe', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'spider_leather', quantity: 3 }, { itemId: 'qi_thread', quantity: 1 }],
  },
  forge_twohanded_bone: {
    id: 'forge_twohanded_bone', name: 'Forjar Mandoble de Osso',
    category: 'forja', outputItemId: 'sword_twohanded_bone', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'boar_tusk', quantity: 4 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 2 (Ferreiro Praticante)
  // ═══════════════════════════════════════════════════════════════
  forge_armor_cloth_reinforced: {
    id: 'forge_armor_cloth_reinforced', name: 'Costurar Manto de Pano Reforçado',
    category: 'forja', outputItemId: 'armor_cloth_reinforced', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'spider_leather', quantity: 4 }, { itemId: 'spider_silk', quantity: 1 }, { itemId: 'qi_thread', quantity: 2 }],
  },
  forge_sword_short_iron: {
    id: 'forge_sword_short_iron', name: 'Forjar Espada Curta de Ferro',
    category: 'forja', outputItemId: 'sword_short_iron', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'boar_tusk', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'qi_thread', quantity: 1 }],
  },
  forge_armor_leather_basic: {
    id: 'forge_armor_leather_basic', name: 'Forjar Peitoral de Couro',
    category: 'forja', outputItemId: 'armor_leather_basic', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'spider_leather', quantity: 5 }, { itemId: 'boar_tusk', quantity: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 3 (Ferreiro Experiente)
  // ═══════════════════════════════════════════════════════════════
  forge_dagger_scale: {
    id: 'forge_dagger_scale', name: 'Forjar Adaga de Escama',
    category: 'forja', outputItemId: 'dagger_scale', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'lizard_scale', quantity: 2 }, { itemId: 'spider_leather', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  forge_axe_bone: {
    id: 'forge_axe_bone', name: 'Forjar Machado de Osso',
    category: 'forja', outputItemId: 'axe_bone', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'boar_tusk', quantity: 4 }, { itemId: 'spider_leather', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  forge_armor_leather_scale: {
    id: 'forge_armor_leather_scale', name: 'Forjar Armadura de Escamas de Jade',
    category: 'forja', outputItemId: 'armor_leather_scale', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spider_leather', quantity: 4 }, { itemId: 'lizard_scale', quantity: 3 }, { itemId: 'spider_silk', quantity: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 4 (Mestre Ferreiro)
  // ═══════════════════════════════════════════════════════════════
  forge_staff_qi: {
    id: 'forge_staff_qi', name: 'Forjar Bastão de Qi',
    category: 'forja', outputItemId: 'staff_qi', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'qi_thread', quantity: 5 }, { itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'lizard_scale', quantity: 1 }],
  },
  forge_dagger_iron: {
    id: 'forge_dagger_iron', name: 'Forjar Adaga de Ferro',
    category: 'forja', outputItemId: 'dagger_iron', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  forge_armor_leather_reinforced: {
    id: 'forge_armor_leather_reinforced', name: 'Forjar Couraça de Couro Espiritual',
    category: 'forja', outputItemId: 'armor_leather_reinforced', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'spider_leather', quantity: 8 }, { itemId: 'spider_silk', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  forge_sword_iron: {
    id: 'forge_sword_iron', name: 'Forjar Espada de Ferro',
    category: 'forja', outputItemId: 'sword_iron', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 2 }, { itemId: 'qi_thread', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  forge_axe_iron: {
    id: 'forge_axe_iron', name: 'Forjar Machado de Ferro',
    category: 'forja', outputItemId: 'axe_iron', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 3 }, { itemId: 'boar_tusk', quantity: 2 }],
  },
  forge_armor_cloth_spiritual: {
    id: 'forge_armor_cloth_spiritual', name: 'Costurar Manto Espiritual de Pano',
    category: 'forja', outputItemId: 'armor_cloth_spiritual', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'spider_silk', quantity: 4 }, { itemId: 'spiritual_essence', quantity: 3 }, { itemId: 'qi_thread', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 5 (Grão-Mestre Ferreiro)
  // ═══════════════════════════════════════════════════════════════
  forge_ring_bronze: {
    id: 'forge_ring_bronze', name: 'Forjar Anel de Bronze Espiritual',
    category: 'forja', outputItemId: 'ring_bronze', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'qi_thread', quantity: 5 }, { itemId: 'bronze_spiritual', quantity: 3 }],
  },
  forge_sword_long_bronze: {
    id: 'forge_sword_long_bronze', name: 'Forjar Espada Longa de Bronze',
    category: 'forja', outputItemId: 'sword_long_bronze', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 3 }, { itemId: 'qi_thread', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  forge_twohanded_iron: {
    id: 'forge_twohanded_iron', name: 'Forjar Espada Grande de Ferro',
    category: 'forja', outputItemId: 'sword_twohanded_iron', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 4 }, { itemId: 'qi_thread', quantity: 2 }, { itemId: 'boar_tusk', quantity: 2 }],
  },
  forge_axe_bronze: {
    id: 'forge_axe_bronze', name: 'Forjar Machado de Bronze Espiritual',
    category: 'forja', outputItemId: 'axe_bronze_spiritual', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 4 }, { itemId: 'boar_tusk', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  forge_armor_plate_iron: {
    id: 'forge_armor_plate_iron', name: 'Forjar Peitoral de Ferro',
    category: 'forja', outputItemId: 'armor_plate_iron', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 5 }, { itemId: 'lizard_scale', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 6 (Forjador de Armas Espirituais)
  // ═══════════════════════════════════════════════════════════════
  forge_sword_bronze_spiritual: {
    id: 'forge_sword_bronze_spiritual', name: 'Forjar Espada de Bronze Espiritual',
    category: 'forja', outputItemId: 'sword_bronze_spiritual', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 5 }, { itemId: 'qi_thread', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  forge_dagger_bronze_spiritual: {
    id: 'forge_dagger_bronze_spiritual', name: 'Forjar Adaga de Bronze Espiritual',
    category: 'forja', outputItemId: 'dagger_bronze_spiritual', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 3 }, { itemId: 'spider_silk', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  forge_staff_spiritual: {
    id: 'forge_staff_spiritual', name: 'Forjar Bastão Espiritual',
    category: 'forja', outputItemId: 'staff_spiritual', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 5 }, { itemId: 'qi_thread', quantity: 3 }, { itemId: 'lizard_scale', quantity: 2 }],
  },
  forge_twohanded_bronze: {
    id: 'forge_twohanded_bronze', name: 'Forjar Espada Grande de Bronze',
    category: 'forja', outputItemId: 'sword_twohanded_bronze', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 6 }, { itemId: 'qi_thread', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  forge_armor_plate_bronze: {
    id: 'forge_armor_plate_bronze', name: 'Forjar Peitoral de Bronze Espiritual',
    category: 'forja', outputItemId: 'armor_plate_bronze', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 6 }, { itemId: 'lizard_scale', quantity: 3 }, { itemId: 'spider_silk', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 7+ (Rei / Imperador / Sagrado)
  // ═══════════════════════════════════════════════════════════════
  forge_axe_thunder: {
    id: 'forge_axe_thunder', name: 'Forjar Machado do Trovão',
    category: 'forja', outputItemId: 'axe_thunder', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'bronze_spiritual', quantity: 4 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'wolf_fang', quantity: 2 }],
  },
  forge_ring_jade: {
    id: 'forge_ring_jade', name: 'Forjar Anel de Jade',
    category: 'forja', outputItemId: 'ring_jade', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'jade_raw', quantity: 5 }, { itemId: 'spider_silk', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 5 }],
  },
  forge_sword_jade: {
    id: 'forge_sword_jade', name: 'Forjar Espada de Jade',
    category: 'forja', outputItemId: 'sword_jade', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'jade_raw', quantity: 4 }, { itemId: 'lizard_scale', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  forge_ring_gold: {
    id: 'forge_ring_gold', name: 'Forjar Anel de Ouro Espiritual',
    category: 'forja', outputItemId: 'ring_gold', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'jade_raw', quantity: 8 }, { itemId: 'spiritual_essence', quantity: 10 }, { itemId: 'thunder_feather', quantity: 3 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 1 (Aprendiz de Alquimia)
  // ═══════════════════════════════════════════════════════════════
  alchemy_red_spring: {
    id: 'alchemy_red_spring', name: 'Refinar Pílula da Fonte Vermelha',
    category: 'alquimia', outputItemId: 'pill_red_spring', outputQuantity: 3, requiredTier: 1,
    ingredients: [{ itemId: 'spider_leather', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  alchemy_qi_condensation: {
    id: 'alchemy_qi_condensation', name: 'Refinar Pílula de Condensação de Qi',
    category: 'alquimia', outputItemId: 'pill_qi_condensation', outputQuantity: 3, requiredTier: 1,
    ingredients: [{ itemId: 'qi_thread', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },
  alchemy_spiritual_flow: {
    id: 'alchemy_spiritual_flow', name: 'Refinar Pílula do Fluxo Espiritual',
    category: 'alquimia', outputItemId: 'pill_spiritual_flow', outputQuantity: 2, requiredTier: 1,
    ingredients: [{ itemId: 'spider_leather', quantity: 1 }, { itemId: 'qi_thread', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 2 (Praticante Alquimista)
  // ═══════════════════════════════════════════════════════════════
  alchemy_qi_purification: {
    id: 'alchemy_qi_purification', name: 'Refinar Pílula da Purificação do Qi',
    category: 'alquimia', outputItemId: 'pill_qi_purification', outputQuantity: 2, requiredTier: 2,
    ingredients: [{ itemId: 'lizard_scale', quantity: 1 }, { itemId: 'spider_silk', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 2 }],
  },
  alchemy_foundation_establish: {
    id: 'alchemy_foundation_establish', name: 'Refinar Pílula de Estabelecimento da Fundação',
    category: 'alquimia', outputItemId: 'pill_foundation_establish', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 5 }, { itemId: 'spider_silk', quantity: 2 }, { itemId: 'qi_thread', quantity: 3 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 3 (Alquimista Veterano)
  // ═══════════════════════════════════════════════════════════════
  alchemy_base_consolidation: {
    id: 'alchemy_base_consolidation', name: 'Refinar Pílula de Consolidação da Base',
    category: 'alquimia', outputItemId: 'pill_base_consolidation', outputQuantity: 2, requiredTier: 3,
    ingredients: [{ itemId: 'lizard_scale', quantity: 2 }, { itemId: 'bronze_spiritual', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  alchemy_qi_sea_expansion: {
    id: 'alchemy_qi_sea_expansion', name: 'Refinar Pílula de Expansão do Mar de Qi',
    category: 'alquimia', outputItemId: 'pill_qi_sea_expansion', outputQuantity: 2, requiredTier: 3,
    ingredients: [{ itemId: 'spider_venom', quantity: 1 }, { itemId: 'jade_raw', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 4 }],
  },
  alchemy_nine_pillars: {
    id: 'alchemy_nine_pillars', name: 'Refinar Pílula dos Nove Pilares Espirituais',
    category: 'alquimia', outputItemId: 'pill_nine_pillars', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spider_silk', quantity: 3 }, { itemId: 'lizard_scale', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 5 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 4 (Mestre Alquimista)
  // ═══════════════════════════════════════════════════════════════
  alchemy_core_creation: {
    id: 'alchemy_core_creation', name: 'Refinar Pílula da Criação do Núcleo',
    category: 'alquimia', outputItemId: 'pill_core_creation', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'jade_raw', quantity: 3 }, { itemId: 'spider_venom', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 8 }],
  },
  alchemy_golden_glow: {
    id: 'alchemy_golden_glow', name: 'Refinar Pílula do Brilho Áureo',
    category: 'alquimia', outputItemId: 'pill_golden_glow', outputQuantity: 2, requiredTier: 4,
    ingredients: [{ itemId: 'jade_raw', quantity: 2 }, { itemId: 'bronze_spiritual', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 5 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 5 (Grão-Mestre Alquimista)
  // ═══════════════════════════════════════════════════════════════
  alchemy_tempered_core: {
    id: 'alchemy_tempered_core', name: 'Refinar Pílula do Núcleo Temperado',
    category: 'alquimia', outputItemId: 'pill_tempered_core', outputQuantity: 2, requiredTier: 5,
    ingredients: [{ itemId: 'jade_raw', quantity: 3 }, { itemId: 'tiger_core', quantity: 1 }, { itemId: 'spiritual_essence', quantity: 6 }],
  },
  alchemy_dragon_phoenix: {
    id: 'alchemy_dragon_phoenix', name: 'Refinar Pílula da Essência do Dragão e Fênix',
    category: 'alquimia', outputItemId: 'pill_dragon_phoenix', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'tiger_core', quantity: 2 }, { itemId: 'thunder_feather', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 10 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Tier 6+ (Espiritual ao Lendário)
  // ═══════════════════════════════════════════════════════════════
  alchemy_soul_awakening: {
    id: 'alchemy_soul_awakening', name: 'Refinar Pílula do Despertar da Alma',
    category: 'alquimia', outputItemId: 'pill_soul_awakening', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'tiger_core', quantity: 3 }, { itemId: 'wolf_fang', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 12 }],
  },
  alchemy_soul_nourishment: {
    id: 'alchemy_soul_nourishment', name: 'Refinar Pílula de Nutrição da Alma',
    category: 'alquimia', outputItemId: 'pill_soul_nourishment', outputQuantity: 2, requiredTier: 6,
    ingredients: [{ itemId: 'jade_raw', quantity: 5 }, { itemId: 'tiger_core', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 10 }],
  },
  alchemy_spiritual_strengthen: {
    id: 'alchemy_spiritual_strengthen', name: 'Refinar Pílula do Fortalecimento Espiritual',
    category: 'alquimia', outputItemId: 'pill_spiritual_strengthen', outputQuantity: 2, requiredTier: 7,
    ingredients: [{ itemId: 'wolf_fang', quantity: 4 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 15 }],
  },
  alchemy_astral_projection: {
    id: 'alchemy_astral_projection', name: 'Refinar Pílula da Projeção Astral',
    category: 'alquimia', outputItemId: 'pill_astral_projection', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'tiger_core', quantity: 4 }, { itemId: 'jade_raw', quantity: 6 }, { itemId: 'spiritual_essence', quantity: 20 }],
  },
  alchemy_divine_metamorphosis: {
    id: 'alchemy_divine_metamorphosis', name: 'Refinar Pílula da Metamorfose Divina',
    category: 'alquimia', outputItemId: 'pill_divine_metamorphosis', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'tiger_core', quantity: 5 }, { itemId: 'thunder_feather', quantity: 5 }, { itemId: 'spiritual_essence', quantity: 25 }],
  },
  alchemy_celestial_unity: {
    id: 'alchemy_celestial_unity', name: 'Refinar Pílula da Unidade Celestial',
    category: 'alquimia', outputItemId: 'pill_celestial_unity', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'jade_raw', quantity: 10 }, { itemId: 'tiger_core', quantity: 5 }, { itemId: 'spiritual_essence', quantity: 30 }],
  },
  alchemy_ascension_elixir: {
    id: 'alchemy_ascension_elixir', name: 'Refinar Elixir da Ascensão Verdadeira',
    category: 'alquimia', outputItemId: 'pill_ascension_elixir', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'jade_raw', quantity: 15 }, { itemId: 'tiger_core', quantity: 8 }, { itemId: 'spiritual_essence', quantity: 50 }],
  },
  alchemy_celestial_sovereign: {
    id: 'alchemy_celestial_sovereign', name: 'Refinar Pílula do Soberano Celestial',
    category: 'alquimia', outputItemId: 'pill_celestial_sovereign', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'jade_raw', quantity: 20 }, { itemId: 'tiger_core', quantity: 10 }, { itemId: 'spiritual_essence', quantity: 80 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Anéis Espaciais (T2–T10)
  // ═══════════════════════════════════════════════════════════════
  forge_ring_spatial_t2:  { id: 'forge_ring_spatial_t2',  name: 'Forjar Anel Espacial de Jade Bruto',      category: 'forja', outputItemId: 'ring_spatial_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'jade_raw', quantity: 3 }, { itemId: 'qi_thread', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 1 }] },
  forge_ring_spatial_t3:  { id: 'forge_ring_spatial_t3',  name: 'Forjar Anel Espacial Espiritual',         category: 'forja', outputItemId: 'ring_spatial_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'jade_raw', quantity: 4 }, { itemId: 'wolf_fang', quantity: 2 }, { itemId: 'tiger_core', quantity: 1 }] },
  forge_ring_spatial_t4:  { id: 'forge_ring_spatial_t4',  name: 'Forjar Anel Espacial do Vazio Místico',   category: 'forja', outputItemId: 'ring_spatial_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'jade_raw', quantity: 3 }, { itemId: 'tiger_core', quantity: 2 }, { itemId: 'thunder_feather', quantity: 1 }] },
  forge_ring_spatial_t5:  { id: 'forge_ring_spatial_t5',  name: 'Forjar Anel Espacial do Núcleo Dourado',  category: 'forja', outputItemId: 'ring_spatial_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'tiger_core', quantity: 3 }, { itemId: 'thunder_feather', quantity: 2 }, { itemId: 'jade_raw', quantity: 2 }] },
  forge_ring_spatial_t6:  { id: 'forge_ring_spatial_t6',  name: 'Forjar Anel Espacial da Alma Etérea',     category: 'forja', outputItemId: 'ring_spatial_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'tiger_core', quantity: 4 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'spider_venom', quantity: 2 }] },
  forge_ring_spatial_t7:  { id: 'forge_ring_spatial_t7',  name: 'Forjar Anel Espacial do Rei das Nuvens',  category: 'forja', outputItemId: 'ring_spatial_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'tiger_core', quantity: 5 }, { itemId: 'thunder_feather', quantity: 4 }, { itemId: 'spider_venom', quantity: 3 }] },
  forge_ring_spatial_t8:  { id: 'forge_ring_spatial_t8',  name: 'Forjar Anel Espacial Imperial do Abismo', category: 'forja', outputItemId: 'ring_spatial_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'tiger_core', quantity: 6 }, { itemId: 'thunder_feather', quantity: 5 }, { itemId: 'spider_venom', quantity: 4 }] },
  forge_ring_spatial_t9:  { id: 'forge_ring_spatial_t9',  name: 'Forjar Anel Espacial Sagrado do Paraíso', category: 'forja', outputItemId: 'ring_spatial_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'tiger_core', quantity: 8 }, { itemId: 'thunder_feather', quantity: 7 }, { itemId: 'spider_venom', quantity: 5 }] },
  forge_ring_spatial_t10: { id: 'forge_ring_spatial_t10', name: 'Forjar Anel Espacial do Dao Primordial',  category: 'forja', outputItemId: 'ring_spatial_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'tiger_core', quantity: 10 }, { itemId: 'thunder_feather', quantity: 9 }, { itemId: 'spider_venom', quantity: 6 }] },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Anéis Ofensivos (T1–T10)
  // ═══════════════════════════════════════════════════════════════
  forge_ring_offense_t1:  { id: 'forge_ring_offense_t1',  name: 'Forjar Anel do Punho de Ferro',           category: 'forja', outputItemId: 'ring_offense_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'boar_tusk', quantity: 3 }, { itemId: 'qi_thread', quantity: 1 }] },
  forge_ring_offense_t2:  { id: 'forge_ring_offense_t2',  name: 'Forjar Anel do Guerreiro de Bronze',      category: 'forja', outputItemId: 'ring_offense_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'boar_tusk', quantity: 3 }, { itemId: 'bronze_spiritual', quantity: 2 }, { itemId: 'jade_raw', quantity: 1 }] },
  forge_ring_offense_t3:  { id: 'forge_ring_offense_t3',  name: 'Forjar Anel Espiritual do Matador',       category: 'forja', outputItemId: 'ring_offense_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'wolf_fang', quantity: 3 }, { itemId: 'jade_raw', quantity: 2 }, { itemId: 'tiger_core', quantity: 1 }] },
  forge_ring_offense_t4:  { id: 'forge_ring_offense_t4',  name: 'Forjar Anel Místico da Lâmina',           category: 'forja', outputItemId: 'ring_offense_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'tiger_core', quantity: 2 }, { itemId: 'wolf_fang', quantity: 4 }, { itemId: 'spider_venom', quantity: 1 }] },
  forge_ring_offense_t5:  { id: 'forge_ring_offense_t5',  name: 'Forjar Anel do Núcleo Cortante',          category: 'forja', outputItemId: 'ring_offense_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'tiger_core', quantity: 3 }, { itemId: 'thunder_feather', quantity: 2 }, { itemId: 'wolf_fang', quantity: 3 }] },
  forge_ring_offense_t6:  { id: 'forge_ring_offense_t6',  name: 'Forjar Anel da Alma do Assassino',        category: 'forja', outputItemId: 'ring_offense_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'tiger_core', quantity: 4 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'spider_venom', quantity: 2 }] },
  forge_ring_offense_t7:  { id: 'forge_ring_offense_t7',  name: 'Forjar Anel do Rei dos Combatentes',      category: 'forja', outputItemId: 'ring_offense_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'tiger_core', quantity: 5 }, { itemId: 'thunder_feather', quantity: 4 }, { itemId: 'spider_venom', quantity: 3 }] },
  forge_ring_offense_t8:  { id: 'forge_ring_offense_t8',  name: 'Forjar Anel Imperial do Ceifador',        category: 'forja', outputItemId: 'ring_offense_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'tiger_core', quantity: 6 }, { itemId: 'thunder_feather', quantity: 5 }, { itemId: 'spider_venom', quantity: 4 }] },
  forge_ring_offense_t9:  { id: 'forge_ring_offense_t9',  name: 'Forjar Anel Sagrado da Destruição',       category: 'forja', outputItemId: 'ring_offense_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'tiger_core', quantity: 8 }, { itemId: 'thunder_feather', quantity: 6 }, { itemId: 'spider_venom', quantity: 5 }] },
  forge_ring_offense_t10: { id: 'forge_ring_offense_t10', name: 'Forjar Anel Divino do Caos Primordial',   category: 'forja', outputItemId: 'ring_offense_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'tiger_core', quantity: 10 }, { itemId: 'thunder_feather', quantity: 8 }, { itemId: 'spider_venom', quantity: 6 }] },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Colares Defensivos (T1–T10)
  // ═══════════════════════════════════════════════════════════════
  forge_necklace_t1:  { id: 'forge_necklace_t1',  name: 'Forjar Colar de Dente de Besta',        category: 'forja', outputItemId: 'accessory_necklace_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'lizard_scale', quantity: 3 }, { itemId: 'qi_thread', quantity: 2 }] },
  forge_necklace_t2:  { id: 'forge_necklace_t2',  name: 'Forjar Colar de Jade do Protetor',      category: 'forja', outputItemId: 'accessory_necklace_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'lizard_scale', quantity: 4 }, { itemId: 'jade_raw', quantity: 1 }, { itemId: 'bronze_spiritual', quantity: 1 }] },
  forge_necklace_t3:  { id: 'forge_necklace_t3',  name: 'Forjar Colar Espiritual da Muralha',    category: 'forja', outputItemId: 'accessory_necklace_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'lizard_scale', quantity: 4 }, { itemId: 'jade_raw', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }] },
  forge_necklace_t4:  { id: 'forge_necklace_t4',  name: 'Forjar Colar Místico do Escudo Eterno', category: 'forja', outputItemId: 'accessory_necklace_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'tiger_core', quantity: 1 }, { itemId: 'jade_raw', quantity: 3 }, { itemId: 'lizard_scale', quantity: 4 }] },
  forge_necklace_t5:  { id: 'forge_necklace_t5',  name: 'Forjar Colar do Núcleo Inabalável',     category: 'forja', outputItemId: 'accessory_necklace_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'tiger_core', quantity: 2 }, { itemId: 'thunder_feather', quantity: 2 }, { itemId: 'jade_raw', quantity: 3 }] },
  forge_necklace_t6:  { id: 'forge_necklace_t6',  name: 'Forjar Colar da Alma Fortaleza',        category: 'forja', outputItemId: 'accessory_necklace_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'tiger_core', quantity: 3 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'spider_venom', quantity: 2 }] },
  forge_necklace_t7:  { id: 'forge_necklace_t7',  name: 'Forjar Colar do Rei de Pedra',          category: 'forja', outputItemId: 'accessory_necklace_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'tiger_core', quantity: 4 }, { itemId: 'thunder_feather', quantity: 4 }, { itemId: 'spider_venom', quantity: 3 }] },
  forge_necklace_t8:  { id: 'forge_necklace_t8',  name: 'Forjar Colar Imperial da Cidadela',     category: 'forja', outputItemId: 'accessory_necklace_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'tiger_core', quantity: 5 }, { itemId: 'thunder_feather', quantity: 5 }, { itemId: 'spider_venom', quantity: 4 }] },
  forge_necklace_t9:  { id: 'forge_necklace_t9',  name: 'Forjar Colar Sagrado da Montanha',      category: 'forja', outputItemId: 'accessory_necklace_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'tiger_core', quantity: 7 }, { itemId: 'thunder_feather', quantity: 6 }, { itemId: 'spider_venom', quantity: 5 }] },
  forge_necklace_t10: { id: 'forge_necklace_t10', name: 'Forjar Colar Divino da Criação',        category: 'forja', outputItemId: 'accessory_necklace_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'tiger_core', quantity: 9 }, { itemId: 'thunder_feather', quantity: 8 }, { itemId: 'spider_venom', quantity: 6 }] },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Pulseiras Equilibradas (T1–T10)
  // ═══════════════════════════════════════════════════════════════
  forge_bracelet_t1:  { id: 'forge_bracelet_t1',  name: 'Forjar Pulseira de Corda Trançada',       category: 'forja', outputItemId: 'accessory_bracelet_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'spider_leather', quantity: 2 }, { itemId: 'lizard_scale', quantity: 2 }] },
  forge_bracelet_t2:  { id: 'forge_bracelet_t2',  name: 'Forjar Pulseira de Jade do Equilibrista', category: 'forja', outputItemId: 'accessory_bracelet_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'spider_leather', quantity: 3 }, { itemId: 'jade_raw', quantity: 1 }, { itemId: 'bronze_spiritual', quantity: 1 }] },
  forge_bracelet_t3:  { id: 'forge_bracelet_t3',  name: 'Forjar Pulseira Espiritual da Harmonia',  category: 'forja', outputItemId: 'accessory_bracelet_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'spider_silk', quantity: 3 }, { itemId: 'jade_raw', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }] },
  forge_bracelet_t4:  { id: 'forge_bracelet_t4',  name: 'Forjar Pulseira Mística do Fluxo Dual',   category: 'forja', outputItemId: 'accessory_bracelet_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'jade_raw', quantity: 3 }, { itemId: 'wolf_fang', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 2 }] },
  forge_bracelet_t5:  { id: 'forge_bracelet_t5',  name: 'Forjar Pulseira do Núcleo do Equilíbrio', category: 'forja', outputItemId: 'accessory_bracelet_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'tiger_core', quantity: 2 }, { itemId: 'wolf_fang', quantity: 3 }, { itemId: 'jade_raw', quantity: 2 }] },
  forge_bracelet_t6:  { id: 'forge_bracelet_t6',  name: 'Forjar Pulseira da Alma do Meio Caminho', category: 'forja', outputItemId: 'accessory_bracelet_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'tiger_core', quantity: 3 }, { itemId: 'thunder_feather', quantity: 2 }, { itemId: 'wolf_fang', quantity: 3 }] },
  forge_bracelet_t7:  { id: 'forge_bracelet_t7',  name: 'Forjar Pulseira do Rei do Dao Duplo',     category: 'forja', outputItemId: 'accessory_bracelet_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'tiger_core', quantity: 4 }, { itemId: 'thunder_feather', quantity: 3 }, { itemId: 'wolf_fang', quantity: 4 }] },
  forge_bracelet_t8:  { id: 'forge_bracelet_t8',  name: 'Forjar Pulseira Imperial da Dualidade',   category: 'forja', outputItemId: 'accessory_bracelet_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'tiger_core', quantity: 5 }, { itemId: 'thunder_feather', quantity: 4 }, { itemId: 'wolf_fang', quantity: 5 }] },
  forge_bracelet_t9:  { id: 'forge_bracelet_t9',  name: 'Forjar Pulseira Sagrada da Convergência', category: 'forja', outputItemId: 'accessory_bracelet_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'tiger_core', quantity: 7 }, { itemId: 'thunder_feather', quantity: 5 }, { itemId: 'wolf_fang', quantity: 6 }] },
  forge_bracelet_t10: { id: 'forge_bracelet_t10', name: 'Forjar Pulseira Divina do Dao',           category: 'forja', outputItemId: 'accessory_bracelet_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'tiger_core', quantity: 9 }, { itemId: 'thunder_feather', quantity: 7 }, { itemId: 'wolf_fang', quantity: 8 }] },
}
