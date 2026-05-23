export interface NpcListing {
  id: string
  definitionId: string
  price: number
  category: 'equipment' | 'material'
}

export const NPC_LISTINGS: NpcListing[] = [
  // ── Materiais T1 ─────────────────────────────────────────────────
  { id: 'npc_bone_fragment',    definitionId: 'bone_fragment',    price: 8,   category: 'material' },
  { id: 'npc_reptile_skin',     definitionId: 'reptile_skin',     price: 8,   category: 'material' },
  { id: 'npc_raw_qi_core',      definitionId: 'raw_qi_core',      price: 25,  category: 'material' },
  { id: 'npc_raw_iron',         definitionId: 'raw_iron',         price: 60,  category: 'material' },
  // ── Materiais T2 ─────────────────────────────────────────────────
  { id: 'npc_beast_scale',      definitionId: 'beast_scale',      price: 20,  category: 'material' },
  { id: 'npc_distilled_venom',  definitionId: 'distilled_venom',  price: 20,  category: 'material' },
  { id: 'npc_qi_crystal',       definitionId: 'qi_crystal',       price: 60,  category: 'material' },
  { id: 'npc_refinement_dust',  definitionId: 'refinement_dust',  price: 120, category: 'material' },
  // ── Pílulas ───────────────────────────────────────────────────────
  { id: 'npc_pill_qi_restore',        definitionId: 'pill_qi_restore',        price: 10,  category: 'material' },
  { id: 'npc_pill_red_spring',        definitionId: 'pill_red_spring',        price: 18,  category: 'material' },
  { id: 'npc_pill_qi_condensation',   definitionId: 'pill_qi_condensation',   price: 35,  category: 'material' },
  { id: 'npc_pill_qi_flow',           definitionId: 'pill_qi_flow',           price: 50,  category: 'material' },
  { id: 'npc_pill_qi_purification',   definitionId: 'pill_qi_purification',   price: 80,  category: 'material' },
  { id: 'npc_pill_solid_foundation',  definitionId: 'pill_solid_foundation',  price: 200, category: 'material' },
  // ── Equipamentos T1 ──────────────────────────────────────────────
  { id: 'npc_espada_t1',   definitionId: 'espada_t1',   price: 80,  category: 'equipment' },
  { id: 'npc_lanca_t1',    definitionId: 'lanca_t1',    price: 90,  category: 'equipment' },
  { id: 'npc_manto_t1',    definitionId: 'manto_t1',    price: 60,  category: 'equipment' },
  { id: 'npc_coura_t1',    definitionId: 'coura_t1',    price: 70,  category: 'equipment' },
  { id: 'npc_armadura_t1', definitionId: 'armadura_t1', price: 100, category: 'equipment' },
]
