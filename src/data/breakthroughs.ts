import type { Realm, RealmStage } from '../types'

export interface BreakthroughReq {
  nextRealm: Realm
  nextStage: RealmStage
  newMaxQi: number
  items: { itemId: string; quantity: number }[]
}

type BreakthroughKey = `${Realm}_${RealmStage}`

export const BREAKTHROUGH_REQS: Partial<Record<BreakthroughKey, BreakthroughReq>> = {
  // ── Refinamento de Qi ──────────────────────────────────────────────
  qi_refining_initial:  { nextRealm: 'qi_refining', nextStage: 'middle',   newMaxQi: 400,   items: [] },
  qi_refining_middle:   { nextRealm: 'qi_refining', nextStage: 'advanced', newMaxQi: 800,   items: [{ itemId: 'pill_qi_condensation', quantity: 1 }] },
  qi_refining_advanced: { nextRealm: 'qi_refining', nextStage: 'peak',     newMaxQi: 1500,  items: [{ itemId: 'pill_qi_purification', quantity: 1 }] },
  qi_refining_peak:     { nextRealm: 'foundation',  nextStage: 'initial',  newMaxQi: 3000,  items: [{ itemId: 'pill_solid_foundation', quantity: 1 }] },

  // ── Fundação Edificada ─────────────────────────────────────────────
  foundation_initial:   { nextRealm: 'foundation',  nextStage: 'middle',   newMaxQi: 6000,   items: [{ itemId: 'pill_foundation_establish', quantity: 1 }] },
  foundation_middle:    { nextRealm: 'foundation',  nextStage: 'advanced', newMaxQi: 12000,  items: [{ itemId: 'pill_base_consolidation',  quantity: 1 }] },
  foundation_advanced:  { nextRealm: 'foundation',  nextStage: 'peak',     newMaxQi: 25000,  items: [{ itemId: 'pill_nine_pillars',         quantity: 1 }] },
  foundation_peak:      { nextRealm: 'golden_core', nextStage: 'initial',  newMaxQi: 50000,  items: [{ itemId: 'pill_core_creation',        quantity: 1 }] },

  // ── Núcleo Dourado ─────────────────────────────────────────────────
  golden_core_initial:  { nextRealm: 'golden_core', nextStage: 'middle',   newMaxQi: 100000,  items: [{ itemId: 'pill_golden_glow',    quantity: 1 }] },
  golden_core_middle:   { nextRealm: 'golden_core', nextStage: 'advanced', newMaxQi: 200000,  items: [{ itemId: 'pill_tempered_core',  quantity: 1 }] },
  golden_core_advanced: { nextRealm: 'golden_core', nextStage: 'peak',     newMaxQi: 400000,  items: [{ itemId: 'pill_dragon_phoenix', quantity: 1 }] },
  golden_core_peak:     { nextRealm: 'nascent_soul', nextStage: 'initial', newMaxQi: 800000,  items: [{ itemId: 'pill_soul_awakening', quantity: 1 }] },

  // ── Alma Nascente ──────────────────────────────────────────────────
  nascent_soul_initial:  { nextRealm: 'nascent_soul', nextStage: 'middle',   newMaxQi: 1500000,  items: [{ itemId: 'pill_soul_nourishment',   quantity: 1 }] },
  nascent_soul_middle:   { nextRealm: 'nascent_soul', nextStage: 'advanced', newMaxQi: 3000000,  items: [{ itemId: 'pill_spiritual_strengthen', quantity: 1 }] },
  nascent_soul_advanced: { nextRealm: 'nascent_soul', nextStage: 'peak',     newMaxQi: 6000000,  items: [{ itemId: 'pill_astral_projection',  quantity: 1 }] },
  nascent_soul_peak:     { nextRealm: 'spirit_transformation', nextStage: 'initial', newMaxQi: 12000000, items: [{ itemId: 'pill_divine_metamorphosis', quantity: 1 }] },

  // ── Transformação Espiritual ───────────────────────────────────────
  spirit_transformation_initial:  { nextRealm: 'spirit_transformation', nextStage: 'middle',   newMaxQi: 25000000,  items: [{ itemId: 'pill_elemental_enlighten',  quantity: 1 }] },
  spirit_transformation_middle:   { nextRealm: 'spirit_transformation', nextStage: 'advanced', newMaxQi: 50000000,  items: [{ itemId: 'pill_spirit_transmutation', quantity: 1 }] },
  spirit_transformation_advanced: { nextRealm: 'spirit_transformation', nextStage: 'peak',     newMaxQi: 100000000, items: [{ itemId: 'pill_spiritual_void',       quantity: 1 }] },
  spirit_transformation_peak:     { nextRealm: 'unification',           nextStage: 'initial',  newMaxQi: 200000000, items: [{ itemId: 'pill_celestial_unity',      quantity: 1 }] },

  // ── Unificação ─────────────────────────────────────────────────────
  unification_initial:  { nextRealm: 'unification', nextStage: 'middle',   newMaxQi: 500000000,   items: [{ itemId: 'pill_dao_fusion',          quantity: 1 }] },
  unification_middle:   { nextRealm: 'unification', nextStage: 'advanced', newMaxQi: 1000000000,  items: [{ itemId: 'pill_universal_harmony',   quantity: 1 }] },
  unification_advanced: { nextRealm: 'unification', nextStage: 'peak',     newMaxQi: 2000000000,  items: [{ itemId: 'pill_absolute_dominion',   quantity: 1 }] },
  unification_peak:     { nextRealm: 'ascension',   nextStage: 'initial',  newMaxQi: 5000000000,  items: [{ itemId: 'pill_celestial_tribulation', quantity: 1 }] },

  // ── Ascensão ───────────────────────────────────────────────────────
  ascension_initial:  { nextRealm: 'ascension', nextStage: 'middle',   newMaxQi: 10000000000,  items: [{ itemId: 'pill_celestial_tribulation', quantity: 1 }] },
  ascension_middle:   { nextRealm: 'ascension', nextStage: 'advanced', newMaxQi: 25000000000,  items: [{ itemId: 'pill_ascension_elixir',      quantity: 1 }] },
  ascension_advanced: { nextRealm: 'ascension', nextStage: 'peak',     newMaxQi: 50000000000,  items: [{ itemId: 'pill_primordial_dao',        quantity: 1 }] },
  ascension_peak:     { nextRealm: 'immortal',  nextStage: 'initial',  newMaxQi: 100000000000, items: [{ itemId: 'pill_cosmic_eternity', quantity: 1 }, { itemId: 'pill_celestial_sovereign', quantity: 1 }] },
}

export const INITIAL_MAX_QI = 150

export function realmStageToLevel(realm: Realm, stage: RealmStage): number {
  const REALMS: Realm[] = ['qi_refining','foundation','golden_core','nascent_soul','spirit_transformation','unification','ascension','immortal']
  const STAGES: RealmStage[] = ['initial','middle','advanced','peak']
  return REALMS.indexOf(realm) * 4 + STAGES.indexOf(stage) + 1
}
