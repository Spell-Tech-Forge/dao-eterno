import type { MonsterDefinition } from '../types'

export const MONSTER_DEFS: Record<string, MonsterDefinition> = {

  // ══════════════════════════════════════════════════════════════
  //  TIER 1 — Floresta Espiritual (Nível 1–2)
  // ══════════════════════════════════════════════════════════════
  wolf_grey: {
    id: 'wolf_grey', name: 'Lobo Cinzento', emoji: '🐺',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 128, baseAtk: 12, baseDef: 0, speed: 1.0,
    qiReward: 46, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_black: {
    id: 'wolf_black', name: 'Lobo Negro', emoji: '🐺',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 128, baseAtk: 12, baseDef: 0, speed: 1.0,
    qiReward: 52, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  boar_mountain: {
    id: 'boar_mountain', name: 'Javali das Montanhas', emoji: '🐗',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 174, baseAtk: 10, baseDef: 1, speed: 1.5,
    qiReward: 64, goldReward: { min: 6, max: 23 },
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  bear_brown: {
    id: 'bear_brown', name: 'Urso Pardo', emoji: '🐻',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 203, baseAtk: 10, baseDef: 1, speed: 1.8,
    qiReward: 70, goldReward: { min: 12, max: 29 },
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  viper_green: {
    id: 'viper_green', name: 'Víbora Verde', emoji: '🐍',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 116, baseAtk: 12, baseDef: 0, speed: 0.9,
    qiReward: 46, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'reptile_skin', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  serpent_mountain: {
    id: 'serpent_mountain', name: 'Serpente da Montanha', emoji: '🐍',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 128, baseAtk: 12, baseDef: 0, speed: 0.9,
    qiReward: 52, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'reptile_skin', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lizard_stone: {
    id: 'lizard_stone', name: 'Lagarto de Pedra', emoji: '🦎',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 145, baseAtk: 10, baseDef: 1, speed: 1.3,
    qiReward: 58, goldReward: { min: 6, max: 23 },
    dropTable: [
      { itemId: 'reptile_skin', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  spider_venomous: {
    id: 'spider_venomous', name: 'Aranha Venenosa', emoji: '🕷️',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 104, baseAtk: 10, baseDef: 0, speed: 0.8,
    qiReward: 46, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'reptile_skin',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'bone_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  crow_black: {
    id: 'crow_black', name: 'Corvo Negro', emoji: '🐦‍⬛',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 104, baseAtk: 10, baseDef: 0, speed: 0.8,
    qiReward: 41, goldReward: { min: 6, max: 12 },
    dropTable: [
      { itemId: 'bone_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  scorpion_earth: {
    id: 'scorpion_earth', name: 'Escorpião da Terra', emoji: '🦂',
    levelMin: 1, levelMax: 2, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 133, baseAtk: 12, baseDef: 0, speed: 1.2,
    qiReward: 52, goldReward: { min: 6, max: 17 },
    dropTable: [
      { itemId: 'reptile_skin',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'bone_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'raw_qi_core',   chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_alpha: {
    id: 'wolf_alpha', name: 'Lobo Alfa', emoji: '🐺',
    levelMin: 1, levelMax: 2, rarity: 'rare', biomeId: 'forest', isBoss: true,
    baseHp: 599, baseAtk: 36, baseDef: 4, speed: 1.5,
    qiReward: 166, goldReward: { min: 50, max: 100 },
    dropTable: [
      { itemId: 'raw_qi_core', chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'raw_iron',    chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 2 — Pântano das Brumas Venenosas (Nível 3–4)
  // ══════════════════════════════════════════════════════════════
  croc_mud: {
    id: 'croc_mud', name: 'Crocodilo de Lama', emoji: '🐊',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 320, baseAtk: 20, baseDef: 2, speed: 1.6,
    qiReward: 90, goldReward: { min: 12, max: 37 },
    dropTable: [
      { itemId: 'beast_scale', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  turtle_ancient: {
    id: 'turtle_ancient', name: 'Tartaruga Anciã', emoji: '🐢',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 369, baseAtk: 14, baseDef: 3, speed: 2.0,
    qiReward: 98, goldReward: { min: 12, max: 41 },
    dropTable: [
      { itemId: 'beast_scale', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  fishsword_water: {
    id: 'fishsword_water', name: 'Peixe-Espada das Águas', emoji: '🐟',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 221, baseAtk: 19, baseDef: 1, speed: 1.2,
    qiReward: 82, goldReward: { min: 8, max: 33 },
    dropTable: [
      { itemId: 'beast_scale', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lizard_giant: {
    id: 'lizard_giant', name: 'Lagarto Gigante', emoji: '🦎',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 246, baseAtk: 19, baseDef: 2, speed: 1.3,
    qiReward: 90, goldReward: { min: 12, max: 33 },
    dropTable: [
      { itemId: 'beast_scale',     chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'distilled_venom', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  frog_venomous: {
    id: 'frog_venomous', name: 'Sapo Venenoso', emoji: '🐸',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 205, baseAtk: 20, baseDef: 1, speed: 1.1,
    qiReward: 82, goldReward: { min: 8, max: 29 },
    dropTable: [
      { itemId: 'distilled_venom', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  spider_goldweb: {
    id: 'spider_goldweb', name: 'Aranha da Teia de Ouro', emoji: '🕷️',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 184, baseAtk: 20, baseDef: 0, speed: 0.8,
    qiReward: 74, goldReward: { min: 8, max: 29 },
    dropTable: [
      { itemId: 'distilled_venom', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  scorpion_red: {
    id: 'scorpion_red', name: 'Escorpião Vermelho', emoji: '🦂',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 221, baseAtk: 22, baseDef: 1, speed: 1.2,
    qiReward: 90, goldReward: { min: 12, max: 33 },
    dropTable: [
      { itemId: 'distilled_venom', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  bee_warrior: {
    id: 'bee_warrior', name: 'Abelha Guerreira', emoji: '🐝',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 148, baseAtk: 20, baseDef: 0, speed: 0.7,
    qiReward: 66, goldReward: { min: 8, max: 25 },
    dropTable: [
      { itemId: 'distilled_venom', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  cobra_royal: {
    id: 'cobra_royal', name: 'Cobra Real', emoji: '🐍',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 197, baseAtk: 22, baseDef: 1, speed: 0.9,
    qiReward: 82, goldReward: { min: 8, max: 29 },
    dropTable: [
      { itemId: 'beast_scale',     chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'distilled_venom', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  jellyfish_water: {
    id: 'jellyfish_water', name: 'Medusa das Águas', emoji: '🪼',
    levelMin: 3, levelMax: 4, rarity: 'common', biomeId: 'swamp', isBoss: false,
    baseHp: 197, baseAtk: 20, baseDef: 1, speed: 1.0,
    qiReward: 82, goldReward: { min: 8, max: 29 },
    dropTable: [
      { itemId: 'distilled_venom', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_crystal',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  hydra_shadow: {
    id: 'hydra_shadow', name: 'Hidra das Sombras', emoji: '🐉',
    levelMin: 3, levelMax: 4, rarity: 'rare', biomeId: 'swamp', isBoss: true,
    baseHp: 1800, baseAtk: 75, baseDef: 8, speed: 2.0,
    qiReward: 491, goldReward: { min: 164, max: 327 },
    dropTable: [
      { itemId: 'qi_crystal',      chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'refinement_dust', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 3 — Planícies dos Ventos Ancestrais (Nível 5–7)
  // ══════════════════════════════════════════════════════════════
  eagle_spiritual: {
    id: 'eagle_spiritual', name: 'Águia Espiritual', emoji: '🦅',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 328, baseAtk: 51, baseDef: 2, speed: 0.9,
    qiReward: 198, goldReward: { min: 22, max: 72 },
    dropTable: [
      { itemId: 'spiritual_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_qi: {
    id: 'wolf_qi', name: 'Lobo de Qi', emoji: '🐺',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 396, baseAtk: 51, baseDef: 3, speed: 1.0,
    qiReward: 198, goldReward: { min: 25, max: 79 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_flames: {
    id: 'tiger_flames', name: 'Tigre das Chamas', emoji: '🐯',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 468, baseAtk: 56, baseDef: 3, speed: 1.0,
    qiReward: 234, goldReward: { min: 32, max: 97 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  leopard_spiritual: {
    id: 'leopard_spiritual', name: 'Leopardo Espiritual', emoji: '🐆',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 421, baseAtk: 56, baseDef: 3, speed: 0.9,
    qiReward: 216, goldReward: { min: 29, max: 86 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  panther_ice: {
    id: 'panther_ice', name: 'Pantera do Gelo', emoji: '🐈‍⬛',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 421, baseAtk: 56, baseDef: 3, speed: 0.9,
    qiReward: 216, goldReward: { min: 29, max: 86 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  griffon_young: {
    id: 'griffon_young', name: 'Grifo Jovem', emoji: '🦁',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 468, baseAtk: 51, baseDef: 4, speed: 1.1,
    qiReward: 234, goldReward: { min: 32, max: 97 },
    dropTable: [
      { itemId: 'spiritual_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  crow_spiritual: {
    id: 'crow_spiritual', name: 'Corvo Espiritual', emoji: '🐦‍⬛',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 328, baseAtk: 42, baseDef: 2, speed: 0.8,
    qiReward: 180, goldReward: { min: 22, max: 65 },
    dropTable: [
      { itemId: 'spiritual_feather', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'beast_claw',        chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  bat_cave: {
    id: 'bat_cave', name: 'Morcego das Cavernas', emoji: '🦇',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 328, baseAtk: 38, baseDef: 2, speed: 0.9,
    qiReward: 173, goldReward: { min: 18, max: 61 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  fox_ninetails: {
    id: 'fox_ninetails', name: 'Raposa de Nove Caudas', emoji: '🦊',
    levelMin: 5, levelMax: 7, rarity: 'common', biomeId: 'plains', isBoss: false,
    baseHp: 353, baseAtk: 47, baseDef: 2, speed: 0.8,
    qiReward: 198, goldReward: { min: 22, max: 72 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_mud: {
    id: 'dragon_mud', name: 'Dragão de Barro', emoji: '🐉',
    levelMin: 5, levelMax: 7, rarity: 'spiritual', biomeId: 'plains', isBoss: false,
    baseHp: 702, baseAtk: 56, baseDef: 6, speed: 1.5,
    qiReward: 288, goldReward: { min: 43, max: 126 },
    dropTable: [
      { itemId: 'beast_claw',        chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spiritual_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_king_flames: {
    id: 'tiger_king_flames', name: 'Tigre Rei das Chamas', emoji: '🐯',
    levelMin: 5, levelMax: 7, rarity: 'rare', biomeId: 'plains', isBoss: true,
    baseHp: 5000, baseAtk: 135, baseDef: 18, speed: 1.8,
    qiReward: 1500, goldReward: { min: 500, max: 1000 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'pure_qi_silk',      chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 4 — Ruínas do Templo Místico (Nível 8–9)
  // ══════════════════════════════════════════════════════════════
  dragon_lesser_water: {
    id: 'dragon_lesser_water', name: 'Dragão Menor das Águas', emoji: '🐉',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 1296, baseAtk: 110, baseDef: 13, speed: 1.5,
    qiReward: 544, goldReward: { min: 90, max: 256 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  serpent_lightning: {
    id: 'serpent_lightning', name: 'Serpente do Relâmpago', emoji: '🐍',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 691, baseAtk: 92, baseDef: 7, speed: 0.9,
    qiReward: 384, goldReward: { min: 51, max: 166 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  carp_golden: {
    id: 'carp_golden', name: 'Carpa Dourada Espiritual', emoji: '🐠',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 778, baseAtk: 76, baseDef: 8, speed: 1.2,
    qiReward: 384, goldReward: { min: 51, max: 166 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  turtle_dragon: {
    id: 'turtle_dragon', name: 'Tartaruga Dragão', emoji: '🐢',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 1296, baseAtk: 58, baseDef: 16, speed: 2.0,
    qiReward: 448, goldReward: { min: 64, max: 208 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'demon_bone',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  demon_shadow: {
    id: 'demon_shadow', name: 'Demônio das Sombras', emoji: '👿',
    levelMin: 8, levelMax: 9, rarity: 'spiritual', biomeId: 'ruins', isBoss: false,
    baseHp: 950, baseAtk: 100, baseDef: 11, speed: 1.1,
    qiReward: 512, goldReward: { min: 77, max: 240 },
    dropTable: [
      { itemId: 'demon_bone',     chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phantom_stone: {
    id: 'phantom_stone', name: 'Fantasma das Pedras', emoji: '👻',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 691, baseAtk: 92, baseDef: 6, speed: 0.9,
    qiReward: 416, goldReward: { min: 58, max: 192 },
    dropTable: [
      { itemId: 'demon_bone',     chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  golem_earth: {
    id: 'golem_earth', name: 'Golem de Terra', emoji: '🧱',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 1555, baseAtk: 58, baseDef: 16, speed: 2.2,
    qiReward: 448, goldReward: { min: 64, max: 208 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'demon_bone',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_whelp: {
    id: 'dragon_whelp', name: 'Filhote de Dragão', emoji: '🐲',
    levelMin: 8, levelMax: 9, rarity: 'spiritual', biomeId: 'ruins', isBoss: false,
    baseHp: 1296, baseAtk: 110, baseDef: 13, speed: 1.5,
    qiReward: 544, goldReward: { min: 80, max: 250 },
    dropTable: [
      { itemId: 'mystic_scale',   chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'demon_bone',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_mystic: {
    id: 'lion_mystic', name: 'Leão Místico', emoji: '🦁',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 1037, baseAtk: 100, baseDef: 10, speed: 1.1,
    qiReward: 512, goldReward: { min: 77, max: 240 },
    dropTable: [
      { itemId: 'demon_bone',     chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phoenix_young: {
    id: 'phoenix_young', name: 'Fênix Jovem', emoji: '🦜',
    levelMin: 8, levelMax: 9, rarity: 'common', biomeId: 'ruins', isBoss: false,
    baseHp: 950, baseAtk: 100, baseDef: 8, speed: 0.9,
    qiReward: 512, goldReward: { min: 77, max: 240 },
    dropTable: [
      { itemId: 'demon_bone',     chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'mystic_crystal', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_king_water: {
    id: 'dragon_king_water', name: 'Rei Dragão das Águas', emoji: '🐲',
    levelMin: 8, levelMax: 9, rarity: 'ancient', biomeId: 'ruins', isBoss: true,
    baseHp: 13000, baseAtk: 239, baseDef: 38, speed: 2.0,
    qiReward: 4550, goldReward: { min: 1625, max: 3250 },
    dropTable: [
      { itemId: 'mystic_crystal',   chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'mystic_qi_elixir', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 5 — Montanhas do Núcleo Dourado (Nível 10–12)
  // ══════════════════════════════════════════════════════════════
  dragon_bronze: {
    id: 'dragon_bronze', name: 'Dragão de Bronze', emoji: '🐉',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 2610, baseAtk: 369, baseDef: 29, speed: 1.5,
    qiReward: 1260, goldReward: { min: 195, max: 585 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phoenix_flames: {
    id: 'phoenix_flames', name: 'Fênix das Chamas', emoji: '🦅',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 1914, baseAtk: 341, baseDef: 19, speed: 0.9,
    qiReward: 1170, goldReward: { min: 174, max: 540 },
    dropTable: [
      { itemId: 'phoenix_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_celestial: {
    id: 'lion_celestial', name: 'Leão Celestial', emoji: '🦁',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 2088, baseAtk: 341, baseDef: 22, speed: 1.1,
    qiReward: 1170, goldReward: { min: 174, max: 540 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  qilin_young: {
    id: 'qilin_young', name: 'Qilin Jovem', emoji: '🦄',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 2262, baseAtk: 312, baseDef: 24, speed: 1.2,
    qiReward: 1140, goldReward: { min: 165, max: 525 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  garuda_lesser: {
    id: 'garuda_lesser', name: 'Garuda Menor', emoji: '🦅',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 1740, baseAtk: 341, baseDef: 19, speed: 0.9,
    qiReward: 1140, goldReward: { min: 165, max: 525 },
    dropTable: [
      { itemId: 'phoenix_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  serpent_core: {
    id: 'serpent_core', name: 'Serpente do Núcleo', emoji: '🐍',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 1392, baseAtk: 312, baseDef: 17, speed: 0.9,
    qiReward: 1020, goldReward: { min: 144, max: 465 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  bear_core: {
    id: 'bear_core', name: 'Urso do Núcleo', emoji: '🐻',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 2436, baseAtk: 255, baseDef: 26, speed: 1.8,
    qiReward: 1050, goldReward: { min: 150, max: 480 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_core: {
    id: 'wolf_core', name: 'Lobo do Núcleo', emoji: '🐺',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 1479, baseAtk: 341, baseDef: 19, speed: 1.0,
    qiReward: 1065, goldReward: { min: 150, max: 480 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_core_beast: {
    id: 'tiger_core_beast', name: 'Tigre do Núcleo', emoji: '🐯',
    levelMin: 10, levelMax: 12, rarity: 'common', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 1740, baseAtk: 369, baseDef: 19, speed: 1.0,
    qiReward: 1110, goldReward: { min: 165, max: 510 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  hydra_core: {
    id: 'hydra_core', name: 'Hidra do Núcleo', emoji: '🐉',
    levelMin: 10, levelMax: 12, rarity: 'spiritual', biomeId: 'golden_mountains', isBoss: false,
    baseHp: 2610, baseAtk: 312, baseDef: 29, speed: 1.5,
    qiReward: 1140, goldReward: { min: 165, max: 525 },
    dropTable: [
      { itemId: 'core_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'core_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_golden_core: {
    id: 'dragon_golden_core', name: 'Dragão do Núcleo Dourado', emoji: '🐲',
    levelMin: 10, levelMax: 12, rarity: 'ancient', biomeId: 'golden_mountains', isBoss: true,
    baseHp: 29988, baseAtk: 339, baseDef: 82, speed: 2.0,
    qiReward: 12852, goldReward: { min: 4641, max: 9282 },
    dropTable: [
      { itemId: 'core_essence',       chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'transmutation_dust', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 6 — Abismo das Almas Eternas (Nível 15–18)
  // ══════════════════════════════════════════════════════════════
  specter_soul: {
    id: 'specter_soul', name: 'Espectro da Alma', emoji: '👻',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 2976, baseAtk: 554, baseDef: 31, speed: 0.9,
    qiReward: 2418, goldReward: { min: 356, max: 1178 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phantom_ancient: {
    id: 'phantom_ancient', name: 'Fantasma Ancestral', emoji: '👻',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 2976, baseAtk: 554, baseDef: 31, speed: 0.9,
    qiReward: 2480, goldReward: { min: 372, max: 1209 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  demon_soul: {
    id: 'demon_soul', name: 'Demônio da Alma', emoji: '😈',
    levelMin: 15, levelMax: 18, rarity: 'spiritual', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 4092, baseAtk: 604, baseDef: 52, speed: 1.1,
    qiReward: 2790, goldReward: { min: 434, max: 1395 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  guardian_souls: {
    id: 'guardian_souls', name: 'Guardião das Almas', emoji: '⚔️',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 4092, baseAtk: 604, baseDef: 52, speed: 1.1,
    qiReward: 2852, goldReward: { min: 450, max: 1426 },
    dropTable: [
      { itemId: 'soul_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'soul_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_soul: {
    id: 'dragon_soul', name: 'Dragão da Alma', emoji: '🐉',
    levelMin: 15, levelMax: 18, rarity: 'spiritual', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 5580, baseAtk: 655, baseDef: 62, speed: 1.5,
    qiReward: 3100, goldReward: { min: 512, max: 1612 },
    dropTable: [
      { itemId: 'soul_crystal',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_phantom: {
    id: 'wolf_phantom', name: 'Lobo Fantasma', emoji: '🐺',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 3162, baseAtk: 554, baseDef: 31, speed: 1.0,
    qiReward: 2480, goldReward: { min: 372, max: 1209 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_darkness: {
    id: 'tiger_darkness', name: 'Tigre das Trevas', emoji: '🐯',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 3720, baseAtk: 655, baseDef: 42, speed: 1.0,
    qiReward: 2790, goldReward: { min: 434, max: 1395 },
    dropTable: [
      { itemId: 'soul_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'soul_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  void_being: {
    id: 'void_being', name: 'Ser do Vazio', emoji: '🌑',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 3720, baseAtk: 554, baseDef: 42, speed: 1.0,
    qiReward: 2666, goldReward: { min: 418, max: 1333 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wraith_mist: {
    id: 'wraith_mist', name: 'Wraith da Bruma', emoji: '👁️',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 2976, baseAtk: 554, baseDef: 31, speed: 0.9,
    qiReward: 2480, goldReward: { min: 372, max: 1209 },
    dropTable: [
      { itemId: 'soul_crystal',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  shadow_abyss: {
    id: 'shadow_abyss', name: 'Sombra do Abismo', emoji: '🌫️',
    levelMin: 15, levelMax: 18, rarity: 'common', biomeId: 'soul_abyss', isBoss: false,
    baseHp: 2976, baseAtk: 554, baseDef: 31, speed: 0.9,
    qiReward: 2480, goldReward: { min: 372, max: 1209 },
    dropTable: [
      { itemId: 'soul_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'soul_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lord_souls: {
    id: 'lord_souls', name: 'Senhor das Almas', emoji: '💀',
    levelMin: 15, levelMax: 18, rarity: 'ancient', biomeId: 'soul_abyss', isBoss: true,
    baseHp: 60016, baseAtk: 558, baseDef: 175, speed: 2.0,
    qiReward: 30690, goldReward: { min: 11594, max: 23188 },
    dropTable: [
      { itemId: 'soul_essence',  chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'sacred_qi_ink', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 7 — Vale da Transformação Mística (Nível 20–22)
  // ══════════════════════════════════════════════════════════════
  dragon_king_lesser: {
    id: 'dragon_king_lesser', name: 'Dragão Rei Menor', emoji: '🐲',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 10500, baseAtk: 1179, baseDef: 132, speed: 1.5,
    qiReward: 6440, goldReward: { min: 1232, max: 3780 },
    dropTable: [
      { itemId: 'king_scale', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_royal: {
    id: 'tiger_royal', name: 'Tigre Real', emoji: '🐯',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 7000, baseAtk: 1179, baseDef: 88, speed: 1.0,
    qiReward: 5880, goldReward: { min: 1092, max: 3388 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  bear_royal: {
    id: 'bear_royal', name: 'Urso Real', emoji: '🐻',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 9800, baseAtk: 816, baseDef: 121, speed: 1.8,
    qiReward: 5600, goldReward: { min: 1036, max: 3220 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_royal: {
    id: 'lion_royal', name: 'Leão Real', emoji: '🦁',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 8400, baseAtk: 1089, baseDef: 99, speed: 1.1,
    qiReward: 6160, goldReward: { min: 1148, max: 3584 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phoenix_royal: {
    id: 'phoenix_royal', name: 'Fênix Real', emoji: '🦅',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 7700, baseAtk: 1089, baseDef: 88, speed: 0.9,
    qiReward: 6160, goldReward: { min: 1148, max: 3584 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  serpent_royal: {
    id: 'serpent_royal', name: 'Serpente Real', emoji: '🐍',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 5600, baseAtk: 998, baseDef: 77, speed: 0.9,
    qiReward: 5320, goldReward: { min: 980, max: 3080 },
    dropTable: [
      { itemId: 'king_scale', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'king_blood', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  qilin_royal: {
    id: 'qilin_royal', name: 'Qilin Real', emoji: '🦄',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 9100, baseAtk: 998, baseDef: 110, speed: 1.2,
    qiReward: 5880, goldReward: { min: 1092, max: 3388 },
    dropTable: [
      { itemId: 'king_scale', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  garuda_royal: {
    id: 'garuda_royal', name: 'Garuda Real', emoji: '🦅',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 7000, baseAtk: 1089, baseDef: 88, speed: 0.9,
    qiReward: 5880, goldReward: { min: 1092, max: 3388 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  wolf_royal: {
    id: 'wolf_royal', name: 'Lobo Real', emoji: '🐺',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 5950, baseAtk: 1089, baseDef: 88, speed: 1.0,
    qiReward: 5600, goldReward: { min: 1036, max: 3220 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  panther_royal: {
    id: 'panther_royal', name: 'Pantera Real', emoji: '🐆',
    levelMin: 20, levelMax: 22, rarity: 'common', biomeId: 'mystic_valley', isBoss: false,
    baseHp: 6300, baseAtk: 1179, baseDef: 77, speed: 0.9,
    qiReward: 5880, goldReward: { min: 1092, max: 3388 },
    dropTable: [
      { itemId: 'king_blood', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'king_core',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_king: {
    id: 'dragon_king', name: 'Dragão Rei', emoji: '👑',
    levelMin: 20, levelMax: 22, rarity: 'ancient', biomeId: 'mystic_valley', isBoss: true,
    baseHp: 120060, baseAtk: 1020, baseDef: 375, speed: 2.0,
    qiReward: 73370, goldReward: { min: 30015, max: 60030 },
    dropTable: [
      { itemId: 'king_core',    chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'royal_elixir', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 8 — Domínio Celestial Unificado (Nível 25–28)
  // ══════════════════════════════════════════════════════════════
  guardian_imperial: {
    id: 'guardian_imperial', name: 'Guardião Imperial', emoji: '⚔️',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 16335, baseAtk: 1947, baseDef: 230, speed: 1.1,
    qiReward: 12690, goldReward: { min: 2565, max: 7830 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_imperial_lesser: {
    id: 'dragon_imperial_lesser', name: 'Dragão Imperial Menor', emoji: '🐉',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 22275, baseAtk: 2301, baseDef: 276, speed: 1.5,
    qiReward: 14040, goldReward: { min: 2970, max: 8910 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  specter_imperial: {
    id: 'specter_imperial', name: 'Espectro Imperial', emoji: '👻',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 11880, baseAtk: 1947, baseDef: 138, speed: 0.9,
    qiReward: 11610, goldReward: { min: 2295, max: 7020 },
    dropTable: [
      { itemId: 'imperial_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'imperial_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phoenix_imperial: {
    id: 'phoenix_imperial', name: 'Fênix Imperial', emoji: '🦅',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 16335, baseAtk: 2124, baseDef: 184, speed: 0.9,
    qiReward: 12960, goldReward: { min: 2646, max: 8100 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_imperial: {
    id: 'tiger_imperial', name: 'Tigre Imperial', emoji: '🐯',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 14850, baseAtk: 2301, baseDef: 184, speed: 1.0,
    qiReward: 12960, goldReward: { min: 2646, max: 8100 },
    dropTable: [
      { itemId: 'imperial_crystal',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_imperial: {
    id: 'lion_imperial', name: 'Leão Imperial', emoji: '🦁',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 17820, baseAtk: 2124, baseDef: 207, speed: 1.1,
    qiReward: 13500, goldReward: { min: 2754, max: 8370 },
    dropTable: [
      { itemId: 'imperial_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'imperial_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  serpent_imperial: {
    id: 'serpent_imperial', name: 'Serpente Imperial', emoji: '🐍',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 11880, baseAtk: 1947, baseDef: 161, speed: 0.9,
    qiReward: 11610, goldReward: { min: 2295, max: 7020 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  qilin_imperial: {
    id: 'qilin_imperial', name: 'Qilin Imperial', emoji: '🦄',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 19305, baseAtk: 1947, baseDef: 230, speed: 1.2,
    qiReward: 13230, goldReward: { min: 2700, max: 8235 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  celestial_lesser: {
    id: 'celestial_lesser', name: 'Ser Celestial Menor', emoji: '✨',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 14850, baseAtk: 1770, baseDef: 184, speed: 1.0,
    qiReward: 12150, goldReward: { min: 2430, max: 7560 },
    dropTable: [
      { itemId: 'imperial_crystal',  chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_fragment', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  guardian_jade: {
    id: 'guardian_jade', name: 'Guardião do Jade', emoji: '💎',
    levelMin: 25, levelMax: 28, rarity: 'common', biomeId: 'celestial_domain', isBoss: false,
    baseHp: 16335, baseAtk: 1947, baseDef: 230, speed: 1.1,
    qiReward: 12690, goldReward: { min: 2565, max: 7830 },
    dropTable: [
      { itemId: 'imperial_fragment', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_crystal',  chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'imperial_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  emperor_dragon: {
    id: 'emperor_dragon', name: 'Imperador Dragão', emoji: '👑',
    levelMin: 25, levelMax: 28, rarity: 'ancient', biomeId: 'celestial_domain', isBoss: true,
    baseHp: 280000, baseAtk: 1979, baseDef: 780, speed: 2.0,
    qiReward: 189000, goldReward: { min: 84000, max: 168000 },
    dropTable: [
      { itemId: 'imperial_essence',   chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'transcendence_dust', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 9 — Portal da Grande Ascensão (Nível 35–38)
  // ══════════════════════════════════════════════════════════════
  phoenix_sacred: {
    id: 'phoenix_sacred', name: 'Fênix Sagrada', emoji: '🦅',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 38500, baseAtk: 4860, baseDef: 464, speed: 0.9,
    qiReward: 32500, goldReward: { min: 7000, max: 20500 },
    dropTable: [
      { itemId: 'sacred_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  garuda_sacred: {
    id: 'garuda_sacred', name: 'Garuda Sagrado', emoji: '🦅',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 35000, baseAtk: 4860, baseDef: 464, speed: 0.9,
    qiReward: 31250, goldReward: { min: 6500, max: 19250 },
    dropTable: [
      { itemId: 'sacred_feather',    chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'divine_beast_bone', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  divbeast_ancient: {
    id: 'divbeast_ancient', name: 'Deus-Besta Ancião', emoji: '🦁',
    levelMin: 35, levelMax: 38, rarity: 'spiritual', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 45500, baseAtk: 4455, baseDef: 580, speed: 1.5,
    qiReward: 33750, goldReward: { min: 7250, max: 21250 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  guardian_paradise: {
    id: 'guardian_paradise', name: 'Guardião do Paraíso', emoji: '⚔️',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 38500, baseAtk: 4860, baseDef: 580, speed: 1.1,
    qiReward: 32500, goldReward: { min: 7000, max: 20500 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'sacred_feather',    chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_sacred: {
    id: 'dragon_sacred', name: 'Dragão Sagrado', emoji: '🐉',
    levelMin: 35, levelMax: 38, rarity: 'spiritual', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 52500, baseAtk: 5265, baseDef: 696, speed: 1.5,
    qiReward: 36250, goldReward: { min: 8000, max: 23000 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  tiger_sacred: {
    id: 'tiger_sacred', name: 'Tigre Sagrado', emoji: '🐯',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 35000, baseAtk: 5265, baseDef: 464, speed: 1.0,
    qiReward: 32500, goldReward: { min: 7000, max: 20500 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_sacred: {
    id: 'lion_sacred', name: 'Leão Sagrado', emoji: '🦁',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 42000, baseAtk: 4860, baseDef: 522, speed: 1.1,
    qiReward: 33750, goldReward: { min: 7250, max: 21250 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  qilin_sacred: {
    id: 'qilin_sacred', name: 'Qilin Sagrado', emoji: '🦄',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 45500, baseAtk: 4455, baseDef: 580, speed: 1.2,
    qiReward: 32500, goldReward: { min: 7000, max: 20500 },
    dropTable: [
      { itemId: 'divine_beast_bone', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence',    chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  paradise_being: {
    id: 'paradise_being', name: 'Ser do Paraíso', emoji: '✨',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 35000, baseAtk: 4050, baseDef: 464, speed: 1.0,
    qiReward: 30000, goldReward: { min: 6250, max: 18750 },
    dropTable: [
      { itemId: 'sacred_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  angel_war: {
    id: 'angel_war', name: 'Anjo da Guerra', emoji: '👼',
    levelMin: 35, levelMax: 38, rarity: 'common', biomeId: 'ascension_portal', isBoss: false,
    baseHp: 38500, baseAtk: 5265, baseDef: 522, speed: 1.0,
    qiReward: 33750, goldReward: { min: 7250, max: 21250 },
    dropTable: [
      { itemId: 'sacred_feather', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'sacred_essence', chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  holy_dragon_paradise: {
    id: 'holy_dragon_paradise', name: 'Santo Dragão do Paraíso', emoji: '🌟',
    levelMin: 35, levelMax: 38, rarity: 'ancient', biomeId: 'ascension_portal', isBoss: true,
    baseHp: 699720, baseAtk: 4898, baseDef: 1960, speed: 2.0,
    qiReward: 480200, goldReward: { min: 219520, max: 439040 },
    dropTable: [
      { itemId: 'sacred_essence', chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'holy_elixir',    chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 10 — Domínio do Dao Eterno (Nível 50–54)
  // ══════════════════════════════════════════════════════════════
  dragon_divine: {
    id: 'dragon_divine', name: 'Dragão Divino', emoji: '🐉',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 158625, baseAtk: 16796, baseDef: 2160, speed: 1.5,
    qiReward: 105750, goldReward: { min: 19975, max: 58750 },
    dropTable: [
      { itemId: 'dao_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'dao_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  primal_celestial_beast: {
    id: 'primal_celestial_beast', name: 'Besta Celestial Primordial', emoji: '🦁',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 137475, baseAtk: 14212, baseDef: 1800, speed: 1.5,
    qiReward: 98700, goldReward: { min: 18800, max: 55225 },
    dropTable: [
      { itemId: 'dao_fragment',     chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'creation_crystal', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  guardian_dao: {
    id: 'guardian_dao', name: 'Guardião do Dao', emoji: '☯️',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 116325, baseAtk: 15504, baseDef: 1800, speed: 1.1,
    qiReward: 94000, goldReward: { min: 17625, max: 51700 },
    dropTable: [
      { itemId: 'creation_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  god_beast: {
    id: 'god_beast', name: 'Deus das Bestas', emoji: '🦁',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 137475, baseAtk: 15504, baseDef: 1800, speed: 1.2,
    qiReward: 98700, goldReward: { min: 18800, max: 55225 },
    dropTable: [
      { itemId: 'creation_crystal', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_fragment',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  phoenix_divine: {
    id: 'phoenix_divine', name: 'Fênix Divina', emoji: '🦅',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 116325, baseAtk: 15504, baseDef: 1440, speed: 0.9,
    qiReward: 94000, goldReward: { min: 17625, max: 51700 },
    dropTable: [
      { itemId: 'dao_fragment', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'dao_essence',  chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  qilin_divine: {
    id: 'qilin_divine', name: 'Qilin Divino', emoji: '🦄',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 137475, baseAtk: 14212, baseDef: 1800, speed: 1.2,
    qiReward: 96350, goldReward: { min: 18330, max: 52875 },
    dropTable: [
      { itemId: 'dao_fragment',     chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'creation_crystal', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  garuda_divine: {
    id: 'garuda_divine', name: 'Garuda Divino', emoji: '🦅',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 105750, baseAtk: 15504, baseDef: 1440, speed: 0.9,
    qiReward: 94000, goldReward: { min: 17625, max: 51700 },
    dropTable: [
      { itemId: 'creation_crystal', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_fragment',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  lion_divine: {
    id: 'lion_divine', name: 'Leão Divino', emoji: '🦁',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 126900, baseAtk: 15504, baseDef: 1620, speed: 1.1,
    qiReward: 98700, goldReward: { min: 18800, max: 55225 },
    dropTable: [
      { itemId: 'creation_crystal', chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  dragon_chaos: {
    id: 'dragon_chaos', name: 'Dragão do Caos', emoji: '🌪️',
    levelMin: 50, levelMax: 54, rarity: 'spiritual', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 158625, baseAtk: 16796, baseDef: 2160, speed: 1.5,
    qiReward: 105750, goldReward: { min: 19975, max: 58750 },
    dropTable: [
      { itemId: 'dao_fragment',     chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'creation_crystal', chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  creation_being: {
    id: 'creation_being', name: 'Ser da Criação', emoji: '🌌',
    levelMin: 50, levelMax: 54, rarity: 'common', biomeId: 'eternal_dao', isBoss: false,
    baseHp: 105750, baseAtk: 12920, baseDef: 1440, speed: 1.0,
    qiReward: 89300, goldReward: { min: 16450, max: 49350 },
    dropTable: [
      { itemId: 'creation_crystal', chance: 0.60, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_fragment',     chance: 0.40, quantityMin: 1, quantityMax: 1 },
      { itemId: 'dao_essence',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  sovereign_dao: {
    id: 'sovereign_dao', name: 'Soberano do Dao', emoji: '☯️',
    levelMin: 50, levelMax: 54, rarity: 'ancient', biomeId: 'eternal_dao', isBoss: true,
    baseHp: 1798500, baseAtk: 14490, baseDef: 6100, speed: 2.0,
    qiReward: 1090000, goldReward: { min: 490500, max: 981000 },
    dropTable: [
      { itemId: 'dao_essence',           chance: 1.00, quantityMin: 1, quantityMax: 1 },
      { itemId: 'primordial_chaos_dust', chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },
}
