import type { RecipeDefinition } from '../types'

export const RECIPE_DEFS: Record<string, RecipeDefinition> = {

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 1 (Nível 1)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t1: {
    id: 'forge_faixas_t1', name: 'Forjar Faixas de Linho Bruto',
    category: 'forja', outputItemId: 'faixas_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 5 }, { itemId: 'reptile_skin', quantity: 1 }, { itemId: 'raw_qi_core', quantity: 1 }],
  },
  forge_espada_t1: {
    id: 'forge_espada_t1', name: 'Forjar Espada de Ferro Forjado',
    category: 'forja', outputItemId: 'espada_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 3 }, { itemId: 'reptile_skin', quantity: 2 }, { itemId: 'raw_iron', quantity: 1 }],
  },
  forge_sabre_t1: {
    id: 'forge_sabre_t1', name: 'Forjar Sabre de Ferro Bruto',
    category: 'forja', outputItemId: 'sabre_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 1 }, { itemId: 'reptile_skin', quantity: 4 }, { itemId: 'raw_iron', quantity: 1 }],
  },
  forge_lanca_t1: {
    id: 'forge_lanca_t1', name: 'Forjar Lança com Ponta de Bronze',
    category: 'forja', outputItemId: 'lanca_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 3 }, { itemId: 'reptile_skin', quantity: 2 }, { itemId: 'raw_qi_core', quantity: 1 }],
  },
  forge_leque_t1: {
    id: 'forge_leque_t1', name: 'Forjar Leque de Bambu Comum',
    category: 'forja', outputItemId: 'leque_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 5 }, { itemId: 'raw_qi_core', quantity: 2 }],
  },
  forge_manto_t1: {
    id: 'forge_manto_t1', name: 'Costurar Manto de Linho Grosseiro',
    category: 'forja', outputItemId: 'manto_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 4 }, { itemId: 'raw_qi_core', quantity: 2 }],
  },
  forge_coura_t1: {
    id: 'forge_coura_t1', name: 'Forjar Couraça de Couro Bruto',
    category: 'forja', outputItemId: 'coura_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 3 }, { itemId: 'reptile_skin', quantity: 3 }],
  },
  forge_armadura_t1: {
    id: 'forge_armadura_t1', name: 'Forjar Armadura de Bronze Bruto',
    category: 'forja', outputItemId: 'armadura_t1', outputQuantity: 1, requiredTier: 1,
    ingredients: [{ itemId: 'bone_fragment', quantity: 1 }, { itemId: 'reptile_skin', quantity: 4 }, { itemId: 'raw_iron', quantity: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 2 (Nível 3)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t2: {
    id: 'forge_faixas_t2', name: 'Forjar Faixas de Cânhamo Refinado',
    category: 'forja', outputItemId: 'faixas_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 6 }, { itemId: 'distilled_venom', quantity: 2 }, { itemId: 'qi_crystal', quantity: 1 }, { itemId: 'refinement_dust', quantity: 1 }],
  },
  forge_espada_t2: {
    id: 'forge_espada_t2', name: 'Forjar Espada de Aço Temperado',
    category: 'forja', outputItemId: 'espada_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 4 }, { itemId: 'distilled_venom', quantity: 3 }, { itemId: 'refinement_dust', quantity: 2 }],
  },
  forge_sabre_t2: {
    id: 'forge_sabre_t2', name: 'Forjar Sabre de Aço Negro',
    category: 'forja', outputItemId: 'sabre_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 2 }, { itemId: 'distilled_venom', quantity: 5 }, { itemId: 'refinement_dust', quantity: 2 }],
  },
  forge_lanca_t2: {
    id: 'forge_lanca_t2', name: 'Forjar Lança de Ferro Temperado',
    category: 'forja', outputItemId: 'lanca_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 4 }, { itemId: 'distilled_venom', quantity: 3 }, { itemId: 'qi_crystal', quantity: 1 }, { itemId: 'refinement_dust', quantity: 1 }],
  },
  forge_leque_t2: {
    id: 'forge_leque_t2', name: 'Forjar Leque de Seda Tecida',
    category: 'forja', outputItemId: 'leque_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 6 }, { itemId: 'distilled_venom', quantity: 1 }, { itemId: 'qi_crystal', quantity: 2 }],
  },
  forge_manto_t2: {
    id: 'forge_manto_t2', name: 'Costurar Manto de Seda Tecida',
    category: 'forja', outputItemId: 'manto_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 5 }, { itemId: 'distilled_venom', quantity: 1 }, { itemId: 'qi_crystal', quantity: 2 }],
  },
  forge_coura_t2: {
    id: 'forge_coura_t2', name: 'Forjar Couraça de Couro Reforçado',
    category: 'forja', outputItemId: 'coura_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 4 }, { itemId: 'distilled_venom', quantity: 4 }, { itemId: 'refinement_dust', quantity: 1 }],
  },
  forge_armadura_t2: {
    id: 'forge_armadura_t2', name: 'Forjar Armadura de Ferro Forjado',
    category: 'forja', outputItemId: 'armadura_t2', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'beast_scale', quantity: 2 }, { itemId: 'distilled_venom', quantity: 5 }, { itemId: 'refinement_dust', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 3 (Nível 5)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t3: {
    id: 'forge_faixas_t3', name: 'Forjar Faixas do Fluxo de Qi',
    category: 'forja', outputItemId: 'faixas_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 7 }, { itemId: 'beast_claw', quantity: 3 }, { itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'pure_qi_silk', quantity: 1 }],
  },
  forge_espada_t3: {
    id: 'forge_espada_t3', name: 'Forjar Espada da Brisa Espiritual',
    category: 'forja', outputItemId: 'espada_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 5 }, { itemId: 'beast_claw', quantity: 4 }, { itemId: 'spiritual_essence', quantity: 1 }, { itemId: 'pure_qi_silk', quantity: 2 }],
  },
  forge_sabre_t3: {
    id: 'forge_sabre_t3', name: 'Forjar Sabre do Impacto de Qi',
    category: 'forja', outputItemId: 'sabre_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 3 }, { itemId: 'beast_claw', quantity: 6 }, { itemId: 'spiritual_essence', quantity: 1 }, { itemId: 'pure_qi_silk', quantity: 2 }],
  },
  forge_lanca_t3: {
    id: 'forge_lanca_t3', name: 'Forjar Lança Espiritual do Vento',
    category: 'forja', outputItemId: 'lanca_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 5 }, { itemId: 'beast_claw', quantity: 4 }, { itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'pure_qi_silk', quantity: 1 }],
  },
  forge_leque_t3: {
    id: 'forge_leque_t3', name: 'Forjar Leque Espiritual das Cinco Folhas',
    category: 'forja', outputItemId: 'leque_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 7 }, { itemId: 'beast_claw', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  forge_manto_t3: {
    id: 'forge_manto_t3', name: 'Costurar Manto Espiritual de Qi',
    category: 'forja', outputItemId: 'manto_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 6 }, { itemId: 'beast_claw', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 3 }],
  },
  forge_coura_t3: {
    id: 'forge_coura_t3', name: 'Forjar Couraça Espiritual do Caçador',
    category: 'forja', outputItemId: 'coura_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 5 }, { itemId: 'beast_claw', quantity: 5 }, { itemId: 'spiritual_essence', quantity: 1 }, { itemId: 'pure_qi_silk', quantity: 1 }],
  },
  forge_armadura_t3: {
    id: 'forge_armadura_t3', name: 'Forjar Armadura Espiritual de Aço',
    category: 'forja', outputItemId: 'armadura_t3', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_feather', quantity: 3 }, { itemId: 'beast_claw', quantity: 6 }, { itemId: 'spiritual_essence', quantity: 1 }, { itemId: 'pure_qi_silk', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 4 (Nível 8)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t4: {
    id: 'forge_faixas_t4', name: 'Forjar Faixas da Casca de Ferro',
    category: 'forja', outputItemId: 'faixas_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 8 }, { itemId: 'demon_bone', quantity: 3 }, { itemId: 'mystic_crystal', quantity: 2 }, { itemId: 'mystic_qi_elixir', quantity: 2 }],
  },
  forge_espada_t4: {
    id: 'forge_espada_t4', name: 'Forjar Espada da Geada Mística',
    category: 'forja', outputItemId: 'espada_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 6 }, { itemId: 'demon_bone', quantity: 4 }, { itemId: 'mystic_crystal', quantity: 1 }, { itemId: 'mystic_qi_elixir', quantity: 3 }],
  },
  forge_sabre_t4: {
    id: 'forge_sabre_t4', name: 'Forjar Sabre da Rocha Mística',
    category: 'forja', outputItemId: 'sabre_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 4 }, { itemId: 'demon_bone', quantity: 6 }, { itemId: 'mystic_crystal', quantity: 1 }, { itemId: 'mystic_qi_elixir', quantity: 3 }],
  },
  forge_lanca_t4: {
    id: 'forge_lanca_t4', name: 'Forjar Lança Mística do Relâmpago',
    category: 'forja', outputItemId: 'lanca_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 6 }, { itemId: 'demon_bone', quantity: 4 }, { itemId: 'mystic_crystal', quantity: 2 }, { itemId: 'mystic_qi_elixir', quantity: 2 }],
  },
  forge_leque_t4: {
    id: 'forge_leque_t4', name: 'Forjar Leque Místico da Ilusão',
    category: 'forja', outputItemId: 'leque_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 8 }, { itemId: 'demon_bone', quantity: 2 }, { itemId: 'mystic_crystal', quantity: 3 }, { itemId: 'mystic_qi_elixir', quantity: 1 }],
  },
  forge_manto_t4: {
    id: 'forge_manto_t4', name: 'Costurar Manto Místico do Vazio',
    category: 'forja', outputItemId: 'manto_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 7 }, { itemId: 'demon_bone', quantity: 2 }, { itemId: 'mystic_crystal', quantity: 3 }, { itemId: 'mystic_qi_elixir', quantity: 1 }],
  },
  forge_coura_t4: {
    id: 'forge_coura_t4', name: 'Forjar Couraça Mística das Feras',
    category: 'forja', outputItemId: 'coura_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 6 }, { itemId: 'demon_bone', quantity: 5 }, { itemId: 'mystic_crystal', quantity: 1 }, { itemId: 'mystic_qi_elixir', quantity: 2 }],
  },
  forge_armadura_t4: {
    id: 'forge_armadura_t4', name: 'Forjar Armadura Mística de Pedra-Ferro',
    category: 'forja', outputItemId: 'armadura_t4', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_scale', quantity: 4 }, { itemId: 'demon_bone', quantity: 6 }, { itemId: 'mystic_crystal', quantity: 1 }, { itemId: 'mystic_qi_elixir', quantity: 3 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 5 (Nível 10)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t5: {
    id: 'forge_faixas_t5', name: 'Forjar Faixas de Seda Dourada',
    category: 'forja', outputItemId: 'faixas_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 9 }, { itemId: 'phoenix_feather', quantity: 4 }, { itemId: 'core_essence', quantity: 3 }, { itemId: 'transmutation_dust', quantity: 2 }],
  },
  forge_espada_t5: {
    id: 'forge_espada_t5', name: 'Forjar Espada do Brilho Áureo',
    category: 'forja', outputItemId: 'espada_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 7 }, { itemId: 'phoenix_feather', quantity: 5 }, { itemId: 'core_essence', quantity: 2 }, { itemId: 'transmutation_dust', quantity: 3 }],
  },
  forge_sabre_t5: {
    id: 'forge_sabre_t5', name: 'Forjar Sabre do Núcleo Flamejante',
    category: 'forja', outputItemId: 'sabre_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 5 }, { itemId: 'phoenix_feather', quantity: 7 }, { itemId: 'core_essence', quantity: 2 }, { itemId: 'transmutation_dust', quantity: 3 }],
  },
  forge_lanca_t5: {
    id: 'forge_lanca_t5', name: 'Forjar Lança do Núcleo Perfurante',
    category: 'forja', outputItemId: 'lanca_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 7 }, { itemId: 'phoenix_feather', quantity: 5 }, { itemId: 'core_essence', quantity: 3 }, { itemId: 'transmutation_dust', quantity: 2 }],
  },
  forge_leque_t5: {
    id: 'forge_leque_t5', name: 'Forjar Leque do Núcleo Dourado',
    category: 'forja', outputItemId: 'leque_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 9 }, { itemId: 'phoenix_feather', quantity: 3 }, { itemId: 'core_essence', quantity: 4 }, { itemId: 'transmutation_dust', quantity: 1 }],
  },
  forge_manto_t5: {
    id: 'forge_manto_t5', name: 'Costurar Manto do Núcleo Dourado',
    category: 'forja', outputItemId: 'manto_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 8 }, { itemId: 'phoenix_feather', quantity: 3 }, { itemId: 'core_essence', quantity: 4 }, { itemId: 'transmutation_dust', quantity: 1 }],
  },
  forge_coura_t5: {
    id: 'forge_coura_t5', name: 'Forjar Couraça do Núcleo Veloz',
    category: 'forja', outputItemId: 'coura_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 7 }, { itemId: 'phoenix_feather', quantity: 6 }, { itemId: 'core_essence', quantity: 2 }, { itemId: 'transmutation_dust', quantity: 2 }],
  },
  forge_armadura_t5: {
    id: 'forge_armadura_t5', name: 'Forjar Armadura do Núcleo de Ferro',
    category: 'forja', outputItemId: 'armadura_t5', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'core_fragment', quantity: 5 }, { itemId: 'phoenix_feather', quantity: 7 }, { itemId: 'core_essence', quantity: 2 }, { itemId: 'transmutation_dust', quantity: 3 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 6 (Nível 15)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t6: {
    id: 'forge_faixas_t6', name: 'Forjar Faixas do Espírito Marcial',
    category: 'forja', outputItemId: 'faixas_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 10 }, { itemId: 'soul_crystal', quantity: 5 }, { itemId: 'soul_essence', quantity: 3 }, { itemId: 'sacred_qi_ink', quantity: 2 }],
  },
  forge_espada_t6: {
    id: 'forge_espada_t6', name: 'Forjar Espada da Alma Flutuante',
    category: 'forja', outputItemId: 'espada_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 8 }, { itemId: 'soul_crystal', quantity: 6 }, { itemId: 'soul_essence', quantity: 2 }, { itemId: 'sacred_qi_ink', quantity: 3 }],
  },
  forge_sabre_t6: {
    id: 'forge_sabre_t6', name: 'Forjar Sabre Devorador de Almas',
    category: 'forja', outputItemId: 'sabre_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 6 }, { itemId: 'soul_crystal', quantity: 8 }, { itemId: 'soul_essence', quantity: 2 }, { itemId: 'sacred_qi_ink', quantity: 3 }],
  },
  forge_lanca_t6: {
    id: 'forge_lanca_t6', name: 'Forjar Lança do Espírito Errante',
    category: 'forja', outputItemId: 'lanca_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 8 }, { itemId: 'soul_crystal', quantity: 6 }, { itemId: 'soul_essence', quantity: 3 }, { itemId: 'sacred_qi_ink', quantity: 2 }],
  },
  forge_leque_t6: {
    id: 'forge_leque_t6', name: 'Forjar Leque da Alma Serena',
    category: 'forja', outputItemId: 'leque_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 10 }, { itemId: 'soul_crystal', quantity: 4 }, { itemId: 'soul_essence', quantity: 4 }, { itemId: 'sacred_qi_ink', quantity: 1 }],
  },
  forge_manto_t6: {
    id: 'forge_manto_t6', name: 'Costurar Manto do Espírito Etéreo',
    category: 'forja', outputItemId: 'manto_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 9 }, { itemId: 'soul_crystal', quantity: 4 }, { itemId: 'soul_essence', quantity: 4 }, { itemId: 'sacred_qi_ink', quantity: 1 }],
  },
  forge_coura_t6: {
    id: 'forge_coura_t6', name: 'Forjar Couraça do Espírito Selvagem',
    category: 'forja', outputItemId: 'coura_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 8 }, { itemId: 'soul_crystal', quantity: 7 }, { itemId: 'soul_essence', quantity: 2 }, { itemId: 'sacred_qi_ink', quantity: 2 }],
  },
  forge_armadura_t6: {
    id: 'forge_armadura_t6', name: 'Forjar Armadura do Espírito de Pedra',
    category: 'forja', outputItemId: 'armadura_t6', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'soul_fragment', quantity: 6 }, { itemId: 'soul_crystal', quantity: 8 }, { itemId: 'soul_essence', quantity: 2 }, { itemId: 'sacred_qi_ink', quantity: 3 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 7 (Nível 20)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t7: {
    id: 'forge_faixas_t7', name: 'Forjar Faixas do Rei Asura',
    category: 'forja', outputItemId: 'faixas_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 12 }, { itemId: 'king_blood', quantity: 6 }, { itemId: 'king_core', quantity: 4 }, { itemId: 'royal_elixir', quantity: 3 }],
  },
  forge_espada_t7: {
    id: 'forge_espada_t7', name: 'Forjar Espada do Rei Celestial',
    category: 'forja', outputItemId: 'espada_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 10 }, { itemId: 'king_blood', quantity: 7 }, { itemId: 'king_core', quantity: 3 }, { itemId: 'royal_elixir', quantity: 4 }],
  },
  forge_sabre_t7: {
    id: 'forge_sabre_t7', name: 'Forjar Sabre Tirânico do Rei',
    category: 'forja', outputItemId: 'sabre_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 8 }, { itemId: 'king_blood', quantity: 9 }, { itemId: 'king_core', quantity: 3 }, { itemId: 'royal_elixir', quantity: 4 }],
  },
  forge_lanca_t7: {
    id: 'forge_lanca_t7', name: 'Forjar Lança do Dragão do Rei',
    category: 'forja', outputItemId: 'lanca_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 10 }, { itemId: 'king_blood', quantity: 7 }, { itemId: 'king_core', quantity: 4 }, { itemId: 'royal_elixir', quantity: 3 }],
  },
  forge_leque_t7: {
    id: 'forge_leque_t7', name: 'Forjar Leque do Rei dos Ventos',
    category: 'forja', outputItemId: 'leque_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 12 }, { itemId: 'king_blood', quantity: 5 }, { itemId: 'king_core', quantity: 5 }, { itemId: 'royal_elixir', quantity: 2 }],
  },
  forge_manto_t7: {
    id: 'forge_manto_t7', name: 'Costurar Manto do Rei das Névoas',
    category: 'forja', outputItemId: 'manto_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 11 }, { itemId: 'king_blood', quantity: 5 }, { itemId: 'king_core', quantity: 5 }, { itemId: 'royal_elixir', quantity: 2 }],
  },
  forge_coura_t7: {
    id: 'forge_coura_t7', name: 'Forjar Couraça do Rei das Feras',
    category: 'forja', outputItemId: 'coura_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 10 }, { itemId: 'king_blood', quantity: 8 }, { itemId: 'king_core', quantity: 3 }, { itemId: 'royal_elixir', quantity: 3 }],
  },
  forge_armadura_t7: {
    id: 'forge_armadura_t7', name: 'Forjar Armadura do Rei de Aço',
    category: 'forja', outputItemId: 'armadura_t7', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'king_scale', quantity: 8 }, { itemId: 'king_blood', quantity: 9 }, { itemId: 'king_core', quantity: 3 }, { itemId: 'royal_elixir', quantity: 4 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 8 (Nível 25)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t8: {
    id: 'forge_faixas_t8', name: 'Forjar Faixas da Destruição Imperial',
    category: 'forja', outputItemId: 'faixas_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 14 }, { itemId: 'imperial_crystal', quantity: 7 }, { itemId: 'imperial_essence', quantity: 4 }, { itemId: 'transcendence_dust', quantity: 3 }],
  },
  forge_espada_t8: {
    id: 'forge_espada_t8', name: 'Forjar Espada do Imperador de Jade',
    category: 'forja', outputItemId: 'espada_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 12 }, { itemId: 'imperial_crystal', quantity: 8 }, { itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 4 }],
  },
  forge_sabre_t8: {
    id: 'forge_sabre_t8', name: 'Forjar Sabre Imperial do Caos',
    category: 'forja', outputItemId: 'sabre_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 10 }, { itemId: 'imperial_crystal', quantity: 10 }, { itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 4 }],
  },
  forge_lanca_t8: {
    id: 'forge_lanca_t8', name: 'Forjar Lança Imperial da Estrela Cadente',
    category: 'forja', outputItemId: 'lanca_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 12 }, { itemId: 'imperial_crystal', quantity: 8 }, { itemId: 'imperial_essence', quantity: 4 }, { itemId: 'transcendence_dust', quantity: 3 }],
  },
  forge_leque_t8: {
    id: 'forge_leque_t8', name: 'Forjar Leque Imperial do Sol e da Lua',
    category: 'forja', outputItemId: 'leque_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 14 }, { itemId: 'imperial_crystal', quantity: 6 }, { itemId: 'imperial_essence', quantity: 5 }, { itemId: 'transcendence_dust', quantity: 2 }],
  },
  forge_manto_t8: {
    id: 'forge_manto_t8', name: 'Costurar Manto Imperial das Ilusões',
    category: 'forja', outputItemId: 'manto_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 13 }, { itemId: 'imperial_crystal', quantity: 6 }, { itemId: 'imperial_essence', quantity: 5 }, { itemId: 'transcendence_dust', quantity: 2 }],
  },
  forge_coura_t8: {
    id: 'forge_coura_t8', name: 'Forjar Couraça Imperial do Leopardo',
    category: 'forja', outputItemId: 'coura_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 12 }, { itemId: 'imperial_crystal', quantity: 9 }, { itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 3 }],
  },
  forge_armadura_t8: {
    id: 'forge_armadura_t8', name: 'Forjar Armadura Imperial de Jade',
    category: 'forja', outputItemId: 'armadura_t8', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_fragment', quantity: 10 }, { itemId: 'imperial_crystal', quantity: 10 }, { itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 4 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 9 (Nível 35)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t9: {
    id: 'forge_faixas_t9', name: 'Forjar Faixas do Santo Vajra',
    category: 'forja', outputItemId: 'faixas_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 17 }, { itemId: 'divine_beast_bone', quantity: 9 }, { itemId: 'sacred_essence', quantity: 5 }, { itemId: 'holy_elixir', quantity: 4 }],
  },
  forge_espada_t9: {
    id: 'forge_espada_t9', name: 'Forjar Espada da Luz Sagrada',
    category: 'forja', outputItemId: 'espada_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 15 }, { itemId: 'divine_beast_bone', quantity: 10 }, { itemId: 'sacred_essence', quantity: 4 }, { itemId: 'holy_elixir', quantity: 5 }],
  },
  forge_sabre_t9: {
    id: 'forge_sabre_t9', name: 'Forjar Sabre do Santo da Guerra',
    category: 'forja', outputItemId: 'sabre_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 13 }, { itemId: 'divine_beast_bone', quantity: 12 }, { itemId: 'sacred_essence', quantity: 4 }, { itemId: 'holy_elixir', quantity: 5 }],
  },
  forge_lanca_t9: {
    id: 'forge_lanca_t9', name: 'Forjar Lança Sagrada dos Nove Céus',
    category: 'forja', outputItemId: 'lanca_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 15 }, { itemId: 'divine_beast_bone', quantity: 10 }, { itemId: 'sacred_essence', quantity: 5 }, { itemId: 'holy_elixir', quantity: 4 }],
  },
  forge_leque_t9: {
    id: 'forge_leque_t9', name: 'Forjar Leque Sagrado da Fênix',
    category: 'forja', outputItemId: 'leque_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 17 }, { itemId: 'divine_beast_bone', quantity: 8 }, { itemId: 'sacred_essence', quantity: 6 }, { itemId: 'holy_elixir', quantity: 3 }],
  },
  forge_manto_t9: {
    id: 'forge_manto_t9', name: 'Costurar Manto Sagrado da Ascensão',
    category: 'forja', outputItemId: 'manto_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 16 }, { itemId: 'divine_beast_bone', quantity: 8 }, { itemId: 'sacred_essence', quantity: 6 }, { itemId: 'holy_elixir', quantity: 3 }],
  },
  forge_coura_t9: {
    id: 'forge_coura_t9', name: 'Forjar Couraça Sagrada do Vento',
    category: 'forja', outputItemId: 'coura_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 15 }, { itemId: 'divine_beast_bone', quantity: 11 }, { itemId: 'sacred_essence', quantity: 4 }, { itemId: 'holy_elixir', quantity: 4 }],
  },
  forge_armadura_t9: {
    id: 'forge_armadura_t9', name: 'Forjar Armadura Sagrada do Trovão',
    category: 'forja', outputItemId: 'armadura_t9', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'sacred_feather', quantity: 13 }, { itemId: 'divine_beast_bone', quantity: 12 }, { itemId: 'sacred_essence', quantity: 4 }, { itemId: 'holy_elixir', quantity: 5 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FORJA — Tier 10 (Nível 50)
  // ═══════════════════════════════════════════════════════════════
  forge_faixas_t10: {
    id: 'forge_faixas_t10', name: 'Forjar Ataduras do Caos Primordial',
    category: 'forja', outputItemId: 'faixas_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 20 }, { itemId: 'creation_crystal', quantity: 11 }, { itemId: 'dao_essence', quantity: 6 }, { itemId: 'primordial_chaos_dust', quantity: 5 }],
  },
  forge_espada_t10: {
    id: 'forge_espada_t10', name: 'Forjar Espada Divina Corta-Céus',
    category: 'forja', outputItemId: 'espada_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 18 }, { itemId: 'creation_crystal', quantity: 12 }, { itemId: 'dao_essence', quantity: 5 }, { itemId: 'primordial_chaos_dust', quantity: 6 }],
  },
  forge_sabre_t10: {
    id: 'forge_sabre_t10', name: 'Forjar Sabre Divino do Cataclismo',
    category: 'forja', outputItemId: 'sabre_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 16 }, { itemId: 'creation_crystal', quantity: 14 }, { itemId: 'dao_essence', quantity: 5 }, { itemId: 'primordial_chaos_dust', quantity: 6 }],
  },
  forge_lanca_t10: {
    id: 'forge_lanca_t10', name: 'Forjar Lança Divina do Karma Celestial',
    category: 'forja', outputItemId: 'lanca_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 18 }, { itemId: 'creation_crystal', quantity: 12 }, { itemId: 'dao_essence', quantity: 6 }, { itemId: 'primordial_chaos_dust', quantity: 5 }],
  },
  forge_leque_t10: {
    id: 'forge_leque_t10', name: 'Forjar Leque Divino da Criação',
    category: 'forja', outputItemId: 'leque_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 20 }, { itemId: 'creation_crystal', quantity: 10 }, { itemId: 'dao_essence', quantity: 7 }, { itemId: 'primordial_chaos_dust', quantity: 4 }],
  },
  forge_manto_t10: {
    id: 'forge_manto_t10', name: 'Costurar Manto Divino da Criação',
    category: 'forja', outputItemId: 'manto_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 19 }, { itemId: 'creation_crystal', quantity: 10 }, { itemId: 'dao_essence', quantity: 7 }, { itemId: 'primordial_chaos_dust', quantity: 4 }],
  },
  forge_coura_t10: {
    id: 'forge_coura_t10', name: 'Forjar Couraça Divina do Dragão',
    category: 'forja', outputItemId: 'coura_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 18 }, { itemId: 'creation_crystal', quantity: 13 }, { itemId: 'dao_essence', quantity: 5 }, { itemId: 'primordial_chaos_dust', quantity: 5 }],
  },
  forge_armadura_t10: {
    id: 'forge_armadura_t10', name: 'Forjar Armadura Divina do Cataclismo',
    category: 'forja', outputItemId: 'armadura_t10', outputQuantity: 1, requiredTier: 10,
    ingredients: [{ itemId: 'dao_fragment', quantity: 16 }, { itemId: 'creation_crystal', quantity: 14 }, { itemId: 'dao_essence', quantity: 5 }, { itemId: 'primordial_chaos_dust', quantity: 6 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Pílulas de Progressão (Tier 1–9)
  // ═══════════════════════════════════════════════════════════════

  // ── Refinamento de Qi ────────────────────────────────────────
  alchemy_qi_condensation: {
    id: 'alchemy_qi_condensation', name: 'Refinar Pílula de Condensação de Qi',
    category: 'alquimia', outputItemId: 'pill_qi_condensation', outputQuantity: 3, requiredTier: 1,
    ingredients: [{ itemId: 'raw_qi_core', quantity: 2 }, { itemId: 'bone_fragment', quantity: 3 }, { itemId: 'reptile_skin', quantity: 2 }],
  },
  alchemy_qi_flow: {
    id: 'alchemy_qi_flow', name: 'Refinar Pílula do Fluxo Espiritual',
    category: 'alquimia', outputItemId: 'pill_qi_flow', outputQuantity: 2, requiredTier: 1,
    ingredients: [{ itemId: 'raw_qi_core', quantity: 3 }, { itemId: 'bone_fragment', quantity: 4 }, { itemId: 'reptile_skin', quantity: 3 }],
  },
  alchemy_qi_purification: {
    id: 'alchemy_qi_purification', name: 'Refinar Pílula da Purificação do Qi',
    category: 'alquimia', outputItemId: 'pill_qi_purification', outputQuantity: 2, requiredTier: 1,
    ingredients: [{ itemId: 'raw_qi_core', quantity: 4 }, { itemId: 'bone_fragment', quantity: 5 }, { itemId: 'reptile_skin', quantity: 4 }, { itemId: 'raw_iron', quantity: 1 }],
  },
  alchemy_solid_foundation: {
    id: 'alchemy_solid_foundation', name: 'Refinar Pílula de Estabelecimento da Fundação',
    category: 'alquimia', outputItemId: 'pill_solid_foundation', outputQuantity: 1, requiredTier: 2,
    ingredients: [{ itemId: 'raw_qi_core', quantity: 5 }, { itemId: 'qi_crystal', quantity: 2 }, { itemId: 'raw_iron', quantity: 2 }, { itemId: 'refinement_dust', quantity: 1 }],
  },

  // ── Fundação Espiritual ───────────────────────────────────────
  alchemy_foundation_establish: {
    id: 'alchemy_foundation_establish', name: 'Refinar Pílula de Consolidação da Base',
    category: 'alquimia', outputItemId: 'pill_foundation_establish', outputQuantity: 2, requiredTier: 2,
    ingredients: [{ itemId: 'qi_crystal', quantity: 2 }, { itemId: 'beast_scale', quantity: 3 }, { itemId: 'distilled_venom', quantity: 2 }],
  },
  alchemy_base_consolidation: {
    id: 'alchemy_base_consolidation', name: 'Refinar Pílula de Expansão do Mar de Qi',
    category: 'alquimia', outputItemId: 'pill_base_consolidation', outputQuantity: 2, requiredTier: 2,
    ingredients: [{ itemId: 'qi_crystal', quantity: 3 }, { itemId: 'beast_scale', quantity: 4 }, { itemId: 'distilled_venom', quantity: 3 }],
  },
  alchemy_nine_pillars: {
    id: 'alchemy_nine_pillars', name: 'Refinar Pílula dos Nove Pilares Espirituais',
    category: 'alquimia', outputItemId: 'pill_nine_pillars', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'qi_crystal', quantity: 4 }, { itemId: 'refinement_dust', quantity: 2 }, { itemId: 'spiritual_feather', quantity: 3 }, { itemId: 'beast_claw', quantity: 2 }],
  },
  alchemy_core_creation: {
    id: 'alchemy_core_creation', name: 'Refinar Pílula da Criação do Núcleo',
    category: 'alquimia', outputItemId: 'pill_core_creation', outputQuantity: 1, requiredTier: 3,
    ingredients: [{ itemId: 'qi_crystal', quantity: 5 }, { itemId: 'refinement_dust', quantity: 2 }, { itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'pure_qi_silk', quantity: 1 }],
  },

  // ── Núcleo Dourado ────────────────────────────────────────────
  alchemy_golden_glow: {
    id: 'alchemy_golden_glow', name: 'Refinar Pílula do Brilho Áureo',
    category: 'alquimia', outputItemId: 'pill_golden_glow', outputQuantity: 2, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 2 }, { itemId: 'spiritual_feather', quantity: 4 }, { itemId: 'beast_claw', quantity: 3 }],
  },
  alchemy_tempered_core: {
    id: 'alchemy_tempered_core', name: 'Refinar Pílula do Núcleo Temperado',
    category: 'alquimia', outputItemId: 'pill_tempered_core', outputQuantity: 2, requiredTier: 3,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 3 }, { itemId: 'spiritual_feather', quantity: 5 }, { itemId: 'beast_claw', quantity: 4 }, { itemId: 'pure_qi_silk', quantity: 1 }],
  },
  alchemy_dragon_phoenix: {
    id: 'alchemy_dragon_phoenix', name: 'Refinar Pílula da Essência do Dragão e Fênix',
    category: 'alquimia', outputItemId: 'pill_dragon_phoenix', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 4 }, { itemId: 'pure_qi_silk', quantity: 2 }, { itemId: 'mystic_scale', quantity: 3 }, { itemId: 'demon_bone', quantity: 2 }],
  },
  alchemy_soul_awakening: {
    id: 'alchemy_soul_awakening', name: 'Refinar Pílula do Despertar da Alma',
    category: 'alquimia', outputItemId: 'pill_soul_awakening', outputQuantity: 1, requiredTier: 4,
    ingredients: [{ itemId: 'spiritual_essence', quantity: 5 }, { itemId: 'pure_qi_silk', quantity: 3 }, { itemId: 'mystic_crystal', quantity: 2 }, { itemId: 'mystic_qi_elixir', quantity: 1 }],
  },

  // ── Alma Nascente ─────────────────────────────────────────────
  alchemy_soul_nourishment: {
    id: 'alchemy_soul_nourishment', name: 'Refinar Pílula de Nutrição da Alma',
    category: 'alquimia', outputItemId: 'pill_soul_nourishment', outputQuantity: 2, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_crystal', quantity: 2 }, { itemId: 'mystic_scale', quantity: 4 }, { itemId: 'demon_bone', quantity: 3 }],
  },
  alchemy_spiritual_strengthen: {
    id: 'alchemy_spiritual_strengthen', name: 'Refinar Pílula do Fortalecimento Espiritual',
    category: 'alquimia', outputItemId: 'pill_spiritual_strengthen', outputQuantity: 2, requiredTier: 4,
    ingredients: [{ itemId: 'mystic_crystal', quantity: 3 }, { itemId: 'mystic_scale', quantity: 5 }, { itemId: 'demon_bone', quantity: 4 }, { itemId: 'mystic_qi_elixir', quantity: 1 }],
  },
  alchemy_astral_projection: {
    id: 'alchemy_astral_projection', name: 'Refinar Pílula da Projeção Astral',
    category: 'alquimia', outputItemId: 'pill_astral_projection', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'mystic_crystal', quantity: 4 }, { itemId: 'mystic_qi_elixir', quantity: 2 }, { itemId: 'core_fragment', quantity: 3 }, { itemId: 'phoenix_feather', quantity: 2 }],
  },
  alchemy_divine_metamorphosis: {
    id: 'alchemy_divine_metamorphosis', name: 'Refinar Pílula da Metamorfose Divina',
    category: 'alquimia', outputItemId: 'pill_divine_metamorphosis', outputQuantity: 1, requiredTier: 5,
    ingredients: [{ itemId: 'mystic_crystal', quantity: 5 }, { itemId: 'mystic_qi_elixir', quantity: 3 }, { itemId: 'core_essence', quantity: 2 }, { itemId: 'transmutation_dust', quantity: 1 }],
  },

  // ── Transformação Espiritual ──────────────────────────────────
  alchemy_elemental_enlighten: {
    id: 'alchemy_elemental_enlighten', name: 'Refinar Pílula da Iluminação Elemental',
    category: 'alquimia', outputItemId: 'pill_elemental_enlighten', outputQuantity: 2, requiredTier: 5,
    ingredients: [{ itemId: 'core_essence', quantity: 2 }, { itemId: 'core_fragment', quantity: 4 }, { itemId: 'phoenix_feather', quantity: 3 }],
  },
  alchemy_spirit_transmutation: {
    id: 'alchemy_spirit_transmutation', name: 'Refinar Pílula de Transmutação do Espírito',
    category: 'alquimia', outputItemId: 'pill_spirit_transmutation', outputQuantity: 2, requiredTier: 5,
    ingredients: [{ itemId: 'core_essence', quantity: 3 }, { itemId: 'core_fragment', quantity: 5 }, { itemId: 'phoenix_feather', quantity: 4 }, { itemId: 'transmutation_dust', quantity: 1 }],
  },
  alchemy_spiritual_void: {
    id: 'alchemy_spiritual_void', name: 'Refinar Pílula do Vazio Espiritual',
    category: 'alquimia', outputItemId: 'pill_spiritual_void', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'core_essence', quantity: 4 }, { itemId: 'transmutation_dust', quantity: 2 }, { itemId: 'soul_fragment', quantity: 3 }, { itemId: 'soul_crystal', quantity: 2 }],
  },
  alchemy_celestial_unity: {
    id: 'alchemy_celestial_unity', name: 'Refinar Pílula da Unidade Celestial',
    category: 'alquimia', outputItemId: 'pill_celestial_unity', outputQuantity: 1, requiredTier: 6,
    ingredients: [{ itemId: 'core_essence', quantity: 5 }, { itemId: 'transmutation_dust', quantity: 3 }, { itemId: 'soul_essence', quantity: 2 }, { itemId: 'sacred_qi_ink', quantity: 1 }],
  },

  // ── Unificação ────────────────────────────────────────────────
  alchemy_dao_fusion: {
    id: 'alchemy_dao_fusion', name: 'Refinar Pílula da Fusão do Dao',
    category: 'alquimia', outputItemId: 'pill_dao_fusion', outputQuantity: 2, requiredTier: 6,
    ingredients: [{ itemId: 'soul_essence', quantity: 2 }, { itemId: 'soul_fragment', quantity: 4 }, { itemId: 'soul_crystal', quantity: 3 }],
  },
  alchemy_universal_harmony: {
    id: 'alchemy_universal_harmony', name: 'Refinar Pílula da Harmonia Universal',
    category: 'alquimia', outputItemId: 'pill_universal_harmony', outputQuantity: 2, requiredTier: 6,
    ingredients: [{ itemId: 'soul_essence', quantity: 3 }, { itemId: 'soul_fragment', quantity: 5 }, { itemId: 'soul_crystal', quantity: 4 }, { itemId: 'sacred_qi_ink', quantity: 1 }],
  },
  alchemy_absolute_dominion: {
    id: 'alchemy_absolute_dominion', name: 'Refinar Pílula do Domínio Absoluto',
    category: 'alquimia', outputItemId: 'pill_absolute_dominion', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'soul_essence', quantity: 4 }, { itemId: 'sacred_qi_ink', quantity: 2 }, { itemId: 'king_scale', quantity: 3 }, { itemId: 'king_blood', quantity: 2 }],
  },
  alchemy_celestial_tribulation: {
    id: 'alchemy_celestial_tribulation', name: 'Refinar Pílula da Tribulação Celestial',
    category: 'alquimia', outputItemId: 'pill_celestial_tribulation', outputQuantity: 1, requiredTier: 7,
    ingredients: [{ itemId: 'soul_essence', quantity: 5 }, { itemId: 'sacred_qi_ink', quantity: 3 }, { itemId: 'king_core', quantity: 2 }, { itemId: 'royal_elixir', quantity: 1 }],
  },

  // ── Ascensão ──────────────────────────────────────────────────
  alchemy_law_comprehension: {
    id: 'alchemy_law_comprehension', name: 'Refinar Pílula da Compreensão das Leis',
    category: 'alquimia', outputItemId: 'pill_law_comprehension', outputQuantity: 2, requiredTier: 7,
    ingredients: [{ itemId: 'king_core', quantity: 2 }, { itemId: 'king_scale', quantity: 4 }, { itemId: 'king_blood', quantity: 3 }],
  },
  alchemy_divine_touch: {
    id: 'alchemy_divine_touch', name: 'Refinar Pílula do Toque Divino',
    category: 'alquimia', outputItemId: 'pill_divine_touch', outputQuantity: 2, requiredTier: 7,
    ingredients: [{ itemId: 'king_core', quantity: 3 }, { itemId: 'king_scale', quantity: 5 }, { itemId: 'king_blood', quantity: 4 }, { itemId: 'royal_elixir', quantity: 1 }],
  },
  alchemy_pseudo_immortal: {
    id: 'alchemy_pseudo_immortal', name: 'Refinar Pílula da Essência Pseudo-Imortal',
    category: 'alquimia', outputItemId: 'pill_pseudo_immortal', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'king_core', quantity: 4 }, { itemId: 'royal_elixir', quantity: 2 }, { itemId: 'imperial_fragment', quantity: 3 }, { itemId: 'imperial_crystal', quantity: 2 }],
  },
  alchemy_ascension_elixir: {
    id: 'alchemy_ascension_elixir', name: 'Refinar Elixir da Ascensão Verdadeira',
    category: 'alquimia', outputItemId: 'pill_ascension_elixir', outputQuantity: 1, requiredTier: 8,
    ingredients: [{ itemId: 'king_core', quantity: 5 }, { itemId: 'royal_elixir', quantity: 3 }, { itemId: 'imperial_essence', quantity: 2 }, { itemId: 'transcendence_dust', quantity: 1 }],
  },

  // ── Imortal ───────────────────────────────────────────────────
  alchemy_primordial_dao: {
    id: 'alchemy_primordial_dao', name: 'Refinar Pílula do Dao Primordial',
    category: 'alquimia', outputItemId: 'pill_primordial_dao', outputQuantity: 2, requiredTier: 8,
    ingredients: [{ itemId: 'imperial_essence', quantity: 2 }, { itemId: 'imperial_fragment', quantity: 4 }, { itemId: 'imperial_crystal', quantity: 3 }],
  },
  alchemy_cosmic_eternity: {
    id: 'alchemy_cosmic_eternity', name: 'Refinar Pílula da Eternidade Cósmica',
    category: 'alquimia', outputItemId: 'pill_cosmic_eternity', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 2 }, { itemId: 'sacred_feather', quantity: 3 }, { itemId: 'divine_beast_bone', quantity: 2 }],
  },
  alchemy_celestial_sovereign: {
    id: 'alchemy_celestial_sovereign', name: 'Refinar Pílula do Soberano Celestial',
    category: 'alquimia', outputItemId: 'pill_celestial_sovereign', outputQuantity: 1, requiredTier: 9,
    ingredients: [{ itemId: 'imperial_essence', quantity: 4 }, { itemId: 'transcendence_dust', quantity: 3 }, { itemId: 'sacred_essence', quantity: 2 }, { itemId: 'holy_elixir', quantity: 2 }],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ALQUIMIA — Pílulas de Buff (Tier 1–10)
  // ═══════════════════════════════════════════════════════════════

  // ── Força (ATK) ──────────────────────────────────────────────
  alchemy_pill_buff_atk_t1:  { id: 'alchemy_pill_buff_atk_t1',  name: 'Refinar Pílula de Força I',    category: 'alquimia', outputItemId: 'pill_buff_atk_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'bone_fragment', quantity: 3 }, { itemId: 'raw_qi_core',       quantity: 2 }, { itemId: 'reptile_skin',     quantity: 1 }] },
  alchemy_pill_buff_atk_t2:  { id: 'alchemy_pill_buff_atk_t2',  name: 'Refinar Pílula de Força II',   category: 'alquimia', outputItemId: 'pill_buff_atk_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'qi_crystal',    quantity: 2 }, { itemId: 'beast_scale',       quantity: 2 }, { itemId: 'distilled_venom',  quantity: 1 }] },
  alchemy_pill_buff_atk_t3:  { id: 'alchemy_pill_buff_atk_t3',  name: 'Refinar Pílula de Força III',  category: 'alquimia', outputItemId: 'pill_buff_atk_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'beast_claw',    quantity: 3 }, { itemId: 'spiritual_feather', quantity: 2 }, { itemId: 'pure_qi_silk',     quantity: 1 }] },
  alchemy_pill_buff_atk_t4:  { id: 'alchemy_pill_buff_atk_t4',  name: 'Refinar Pílula de Força IV',   category: 'alquimia', outputItemId: 'pill_buff_atk_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'demon_bone',    quantity: 2 }, { itemId: 'mystic_crystal',    quantity: 2 }, { itemId: 'mystic_scale',     quantity: 1 }] },
  alchemy_pill_buff_atk_t5:  { id: 'alchemy_pill_buff_atk_t5',  name: 'Refinar Pílula de Força V',    category: 'alquimia', outputItemId: 'pill_buff_atk_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'core_fragment', quantity: 3 }, { itemId: 'core_essence',      quantity: 2 }, { itemId: 'transmutation_dust', quantity: 1 }] },
  alchemy_pill_buff_atk_t6:  { id: 'alchemy_pill_buff_atk_t6',  name: 'Refinar Pílula de Força VI',   category: 'alquimia', outputItemId: 'pill_buff_atk_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'soul_fragment', quantity: 3 }, { itemId: 'soul_essence',      quantity: 2 }, { itemId: 'sacred_qi_ink',    quantity: 1 }] },
  alchemy_pill_buff_atk_t7:  { id: 'alchemy_pill_buff_atk_t7',  name: 'Refinar Pílula de Força VII',  category: 'alquimia', outputItemId: 'pill_buff_atk_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'king_scale',    quantity: 3 }, { itemId: 'king_core',         quantity: 2 }, { itemId: 'royal_elixir',     quantity: 1 }] },
  alchemy_pill_buff_atk_t8:  { id: 'alchemy_pill_buff_atk_t8',  name: 'Refinar Pílula de Força VIII', category: 'alquimia', outputItemId: 'pill_buff_atk_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'imperial_fragment', quantity: 3 }, { itemId: 'imperial_essence', quantity: 2 }, { itemId: 'transcendence_dust', quantity: 1 }] },
  alchemy_pill_buff_atk_t9:  { id: 'alchemy_pill_buff_atk_t9',  name: 'Refinar Pílula de Força IX',   category: 'alquimia', outputItemId: 'pill_buff_atk_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'sacred_feather', quantity: 3 }, { itemId: 'sacred_essence',   quantity: 2 }, { itemId: 'holy_elixir',      quantity: 1 }] },
  alchemy_pill_buff_atk_t10: { id: 'alchemy_pill_buff_atk_t10', name: 'Refinar Pílula de Força X',    category: 'alquimia', outputItemId: 'pill_buff_atk_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'dao_fragment',   quantity: 3 }, { itemId: 'dao_essence',       quantity: 2 }, { itemId: 'primordial_chaos_dust', quantity: 1 }] },

  // ── Defesa (DEF) ──────────────────────────────────────────────
  alchemy_pill_buff_def_t1:  { id: 'alchemy_pill_buff_def_t1',  name: 'Refinar Pílula de Defesa I',    category: 'alquimia', outputItemId: 'pill_buff_def_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'reptile_skin',  quantity: 3 }, { itemId: 'bone_fragment',     quantity: 2 }, { itemId: 'raw_qi_core',      quantity: 1 }] },
  alchemy_pill_buff_def_t2:  { id: 'alchemy_pill_buff_def_t2',  name: 'Refinar Pílula de Defesa II',   category: 'alquimia', outputItemId: 'pill_buff_def_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'beast_scale',   quantity: 3 }, { itemId: 'qi_crystal',        quantity: 2 }, { itemId: 'refinement_dust',  quantity: 1 }] },
  alchemy_pill_buff_def_t3:  { id: 'alchemy_pill_buff_def_t3',  name: 'Refinar Pílula de Defesa III',  category: 'alquimia', outputItemId: 'pill_buff_def_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'pure_qi_silk',  quantity: 3 }, { itemId: 'beast_claw',        quantity: 2 }, { itemId: 'spiritual_feather', quantity: 1 }] },
  alchemy_pill_buff_def_t4:  { id: 'alchemy_pill_buff_def_t4',  name: 'Refinar Pílula de Defesa IV',   category: 'alquimia', outputItemId: 'pill_buff_def_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'mystic_scale',  quantity: 3 }, { itemId: 'demon_bone',        quantity: 2 }, { itemId: 'mystic_crystal',   quantity: 1 }] },
  alchemy_pill_buff_def_t5:  { id: 'alchemy_pill_buff_def_t5',  name: 'Refinar Pílula de Defesa V',    category: 'alquimia', outputItemId: 'pill_buff_def_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'transmutation_dust', quantity: 3 }, { itemId: 'core_fragment',   quantity: 2 }, { itemId: 'core_essence',     quantity: 1 }] },
  alchemy_pill_buff_def_t6:  { id: 'alchemy_pill_buff_def_t6',  name: 'Refinar Pílula de Defesa VI',   category: 'alquimia', outputItemId: 'pill_buff_def_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'soul_crystal',  quantity: 3 }, { itemId: 'soul_essence',      quantity: 2 }, { itemId: 'soul_fragment',    quantity: 1 }] },
  alchemy_pill_buff_def_t7:  { id: 'alchemy_pill_buff_def_t7',  name: 'Refinar Pílula de Defesa VII',  category: 'alquimia', outputItemId: 'pill_buff_def_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'king_blood',    quantity: 3 }, { itemId: 'king_scale',        quantity: 2 }, { itemId: 'king_core',        quantity: 1 }] },
  alchemy_pill_buff_def_t8:  { id: 'alchemy_pill_buff_def_t8',  name: 'Refinar Pílula de Defesa VIII', category: 'alquimia', outputItemId: 'pill_buff_def_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'imperial_crystal', quantity: 3 }, { itemId: 'imperial_fragment', quantity: 2 }, { itemId: 'imperial_essence', quantity: 1 }] },
  alchemy_pill_buff_def_t9:  { id: 'alchemy_pill_buff_def_t9',  name: 'Refinar Pílula de Defesa IX',   category: 'alquimia', outputItemId: 'pill_buff_def_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'divine_beast_bone', quantity: 3 }, { itemId: 'sacred_feather',  quantity: 2 }, { itemId: 'sacred_essence',   quantity: 1 }] },
  alchemy_pill_buff_def_t10: { id: 'alchemy_pill_buff_def_t10', name: 'Refinar Pílula de Defesa X',    category: 'alquimia', outputItemId: 'pill_buff_def_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'creation_crystal', quantity: 3 }, { itemId: 'dao_fragment',    quantity: 2 }, { itemId: 'dao_essence',      quantity: 1 }] },

  // ── Vitalidade (HP) ────────────────────────────────────────────
  alchemy_pill_buff_hp_t1:  { id: 'alchemy_pill_buff_hp_t1',  name: 'Refinar Pílula de Vitalidade I',    category: 'alquimia', outputItemId: 'pill_buff_hp_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'raw_qi_core',   quantity: 3 }, { itemId: 'bone_fragment',     quantity: 2 }, { itemId: 'reptile_skin',     quantity: 2 }] },
  alchemy_pill_buff_hp_t2:  { id: 'alchemy_pill_buff_hp_t2',  name: 'Refinar Pílula de Vitalidade II',   category: 'alquimia', outputItemId: 'pill_buff_hp_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'qi_crystal',    quantity: 3 }, { itemId: 'refinement_dust',   quantity: 2 }, { itemId: 'beast_scale',      quantity: 1 }] },
  alchemy_pill_buff_hp_t3:  { id: 'alchemy_pill_buff_hp_t3',  name: 'Refinar Pílula de Vitalidade III',  category: 'alquimia', outputItemId: 'pill_buff_hp_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'spiritual_feather', quantity: 3 }, { itemId: 'pure_qi_silk',     quantity: 2 }, { itemId: 'beast_claw',       quantity: 1 }] },
  alchemy_pill_buff_hp_t4:  { id: 'alchemy_pill_buff_hp_t4',  name: 'Refinar Pílula de Vitalidade IV',   category: 'alquimia', outputItemId: 'pill_buff_hp_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'mystic_crystal', quantity: 3 }, { itemId: 'mystic_scale',      quantity: 2 }, { itemId: 'demon_bone',       quantity: 1 }] },
  alchemy_pill_buff_hp_t5:  { id: 'alchemy_pill_buff_hp_t5',  name: 'Refinar Pílula de Vitalidade V',    category: 'alquimia', outputItemId: 'pill_buff_hp_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'core_essence',  quantity: 3 }, { itemId: 'phoenix_feather',   quantity: 2 }, { itemId: 'transmutation_dust', quantity: 1 }] },
  alchemy_pill_buff_hp_t6:  { id: 'alchemy_pill_buff_hp_t6',  name: 'Refinar Pílula de Vitalidade VI',   category: 'alquimia', outputItemId: 'pill_buff_hp_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'soul_essence',  quantity: 3 }, { itemId: 'soul_crystal',      quantity: 2 }, { itemId: 'soul_fragment',    quantity: 1 }] },
  alchemy_pill_buff_hp_t7:  { id: 'alchemy_pill_buff_hp_t7',  name: 'Refinar Pílula de Vitalidade VII',  category: 'alquimia', outputItemId: 'pill_buff_hp_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'king_core',     quantity: 3 }, { itemId: 'royal_elixir',      quantity: 2 }, { itemId: 'king_blood',       quantity: 1 }] },
  alchemy_pill_buff_hp_t8:  { id: 'alchemy_pill_buff_hp_t8',  name: 'Refinar Pílula de Vitalidade VIII', category: 'alquimia', outputItemId: 'pill_buff_hp_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'imperial_essence', quantity: 3 }, { itemId: 'transcendence_dust', quantity: 2 }, { itemId: 'imperial_crystal', quantity: 1 }] },
  alchemy_pill_buff_hp_t9:  { id: 'alchemy_pill_buff_hp_t9',  name: 'Refinar Pílula de Vitalidade IX',   category: 'alquimia', outputItemId: 'pill_buff_hp_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'sacred_essence', quantity: 3 }, { itemId: 'holy_elixir',       quantity: 2 }, { itemId: 'divine_beast_bone', quantity: 1 }] },
  alchemy_pill_buff_hp_t10: { id: 'alchemy_pill_buff_hp_t10', name: 'Refinar Pílula de Vitalidade X',    category: 'alquimia', outputItemId: 'pill_buff_hp_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'dao_essence',   quantity: 3 }, { itemId: 'primordial_chaos_dust', quantity: 2 }, { itemId: 'creation_crystal', quantity: 1 }] },

  // ── Foco (Crit) ────────────────────────────────────────────────
  alchemy_pill_buff_crit_t1:  { id: 'alchemy_pill_buff_crit_t1',  name: 'Refinar Pílula de Foco I',    category: 'alquimia', outputItemId: 'pill_buff_crit_t1',  outputQuantity: 1, requiredTier: 1,  ingredients: [{ itemId: 'raw_qi_core',   quantity: 2 }, { itemId: 'reptile_skin',      quantity: 2 }, { itemId: 'bone_fragment',    quantity: 1 }] },
  alchemy_pill_buff_crit_t2:  { id: 'alchemy_pill_buff_crit_t2',  name: 'Refinar Pílula de Foco II',   category: 'alquimia', outputItemId: 'pill_buff_crit_t2',  outputQuantity: 1, requiredTier: 2,  ingredients: [{ itemId: 'qi_crystal',    quantity: 3 }, { itemId: 'distilled_venom',   quantity: 2 }, { itemId: 'refinement_dust',  quantity: 1 }] },
  alchemy_pill_buff_crit_t3:  { id: 'alchemy_pill_buff_crit_t3',  name: 'Refinar Pílula de Foco III',  category: 'alquimia', outputItemId: 'pill_buff_crit_t3',  outputQuantity: 1, requiredTier: 3,  ingredients: [{ itemId: 'spiritual_feather', quantity: 3 }, { itemId: 'beast_claw',       quantity: 2 }, { itemId: 'pure_qi_silk',     quantity: 1 }] },
  alchemy_pill_buff_crit_t4:  { id: 'alchemy_pill_buff_crit_t4',  name: 'Refinar Pílula de Foco IV',   category: 'alquimia', outputItemId: 'pill_buff_crit_t4',  outputQuantity: 1, requiredTier: 4,  ingredients: [{ itemId: 'mystic_crystal', quantity: 3 }, { itemId: 'mystic_qi_elixir',  quantity: 2 }, { itemId: 'demon_bone',       quantity: 1 }] },
  alchemy_pill_buff_crit_t5:  { id: 'alchemy_pill_buff_crit_t5',  name: 'Refinar Pílula de Foco V',    category: 'alquimia', outputItemId: 'pill_buff_crit_t5',  outputQuantity: 1, requiredTier: 5,  ingredients: [{ itemId: 'core_fragment', quantity: 3 }, { itemId: 'transmutation_dust', quantity: 2 }, { itemId: 'phoenix_feather',  quantity: 1 }] },
  alchemy_pill_buff_crit_t6:  { id: 'alchemy_pill_buff_crit_t6',  name: 'Refinar Pílula de Foco VI',   category: 'alquimia', outputItemId: 'pill_buff_crit_t6',  outputQuantity: 1, requiredTier: 6,  ingredients: [{ itemId: 'soul_crystal',  quantity: 3 }, { itemId: 'soul_fragment',     quantity: 2 }, { itemId: 'sacred_qi_ink',    quantity: 1 }] },
  alchemy_pill_buff_crit_t7:  { id: 'alchemy_pill_buff_crit_t7',  name: 'Refinar Pílula de Foco VII',  category: 'alquimia', outputItemId: 'pill_buff_crit_t7',  outputQuantity: 1, requiredTier: 7,  ingredients: [{ itemId: 'king_scale',    quantity: 3 }, { itemId: 'king_blood',        quantity: 2 }, { itemId: 'royal_elixir',     quantity: 1 }] },
  alchemy_pill_buff_crit_t8:  { id: 'alchemy_pill_buff_crit_t8',  name: 'Refinar Pílula de Foco VIII', category: 'alquimia', outputItemId: 'pill_buff_crit_t8',  outputQuantity: 1, requiredTier: 8,  ingredients: [{ itemId: 'imperial_crystal', quantity: 3 }, { itemId: 'imperial_essence',  quantity: 2 }, { itemId: 'transcendence_dust', quantity: 1 }] },
  alchemy_pill_buff_crit_t9:  { id: 'alchemy_pill_buff_crit_t9',  name: 'Refinar Pílula de Foco IX',   category: 'alquimia', outputItemId: 'pill_buff_crit_t9',  outputQuantity: 1, requiredTier: 9,  ingredients: [{ itemId: 'sacred_feather', quantity: 3 }, { itemId: 'divine_beast_bone',  quantity: 2 }, { itemId: 'holy_elixir',      quantity: 1 }] },
  alchemy_pill_buff_crit_t10: { id: 'alchemy_pill_buff_crit_t10', name: 'Refinar Pílula de Foco X',    category: 'alquimia', outputItemId: 'pill_buff_crit_t10', outputQuantity: 1, requiredTier: 10, ingredients: [{ itemId: 'dao_fragment',   quantity: 3 }, { itemId: 'creation_crystal',  quantity: 2 }, { itemId: 'primordial_chaos_dust', quantity: 1 }] },
}
