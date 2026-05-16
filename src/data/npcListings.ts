export interface NpcListing {
  id: string
  definitionId: string
  price: number
  category: 'equipment' | 'material'
}

export const NPC_LISTINGS: NpcListing[] = [
  // ── Materiais comuns ──────────────────────────────────────────────
  { id: 'npc_feather',           definitionId: 'feather',           price: 5,   category: 'material' },
  { id: 'npc_bone_fragment',     definitionId: 'bone_fragment',     price: 8,   category: 'material' },
  { id: 'npc_spider_silk',       definitionId: 'spider_silk',       price: 15,  category: 'material' },
  { id: 'npc_wolf_pelt',         definitionId: 'wolf_pelt',         price: 20,  category: 'material' },
  { id: 'npc_bronze_ore',        definitionId: 'bronze_ore',        price: 12,  category: 'material' },
  { id: 'npc_iron_ore',          definitionId: 'iron_ore',          price: 25,  category: 'material' },
  { id: 'npc_qi_thread',         definitionId: 'qi_thread',         price: 30,  category: 'material' },
  { id: 'npc_spiritual_essence', definitionId: 'spiritual_essence', price: 60,  category: 'material' },
  { id: 'npc_bronze_spiritual',  definitionId: 'bronze_spiritual',  price: 80,  category: 'material' },
  { id: 'npc_jade_raw',          definitionId: 'jade_raw',          price: 120, category: 'material' },
  { id: 'npc_thunder_feather',   definitionId: 'thunder_feather',   price: 90,  category: 'material' },
  { id: 'npc_tiger_tendon',      definitionId: 'tiger_tendon',      price: 150, category: 'material' },
  // ── Pílulas ───────────────────────────────────────────────────────
  { id: 'npc_pill_qi_restore',       definitionId: 'pill_qi_restore',       price: 10,  category: 'material' },
  { id: 'npc_pill_red_spring',       definitionId: 'pill_red_spring',       price: 18,  category: 'material' },
  { id: 'npc_pill_qi_condensation',  definitionId: 'pill_qi_condensation',  price: 35,  category: 'material' },
  { id: 'npc_pill_spiritual_flow',   definitionId: 'pill_spiritual_flow',   price: 40,  category: 'material' },
  { id: 'npc_pill_qi_purification',  definitionId: 'pill_qi_purification',  price: 80,  category: 'material' },
  { id: 'npc_pill_solid_foundation', definitionId: 'pill_solid_foundation', price: 200, category: 'material' },
  // ── Equipamentos ──────────────────────────────────────────────────
  { id: 'npc_sword_iron',        definitionId: 'sword_iron',        price: 80,  category: 'equipment' },
  { id: 'npc_sword_bone',        definitionId: 'sword_bone',        price: 60,  category: 'equipment' },
  { id: 'npc_spear_wolf',        definitionId: 'spear_wolf',        price: 120, category: 'equipment' },
  { id: 'npc_armor_leather',     definitionId: 'armor_leather',     price: 70,  category: 'equipment' },
  { id: 'npc_armor_bone',        definitionId: 'armor_bone',        price: 90,  category: 'equipment' },
  { id: 'npc_armor_jade',        definitionId: 'armor_jade',        price: 300, category: 'equipment' },
]
