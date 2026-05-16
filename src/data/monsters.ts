import type { MonsterDefinition } from '../types'

export const MONSTER_DEFS: Record<string, MonsterDefinition> = {

  // ══════════════════════════════════════════════════════════════
  //  FLORESTA ESPIRITUAL
  // ══════════════════════════════════════════════════════════════
  spider_spiritual: {
    id: 'spider_spiritual', name: 'Aranha Espiritual', emoji: '🕷️',
    levelMin: 1, levelMax: 4, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 22, baseAtk: 5, baseDef: 1, speed: 1.5,
    qiReward: 8, goldReward: { min: 1, max: 3 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 1 },
      { itemId: 'spider_leather',    chance: 0.80, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spider_silk',       chance: 0.35, quantityMin: 1, quantityMax: 1 },
      { itemId: 'spider_venom',      chance: 0.08, quantityMin: 1, quantityMax: 1 },
    ],
  },
  boar_spiritual: {
    id: 'boar_spiritual', name: 'Javali Espiritual', emoji: '🐗',
    levelMin: 2, levelMax: 5, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 36, baseAtk: 7, baseDef: 2, speed: 1.8,
    qiReward: 12, goldReward: { min: 1, max: 4 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 2 },
      { itemId: 'boar_tusk',         chance: 0.65, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_thread',         chance: 0.30, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spider_leather',    chance: 0.80, quantityMin: 1, quantityMax: 2 },
    ],
  },
  lizard_jade: {
    id: 'lizard_jade', name: 'Lagarto de Jade', emoji: '🦎',
    levelMin: 3, levelMax: 6, rarity: 'spiritual', biomeId: 'forest', isBoss: false,
    baseHp: 50, baseAtk: 10, baseDef: 4, speed: 1.3,
    qiReward: 18, goldReward: { min: 3, max: 8 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 2 },
      { itemId: 'lizard_scale',      chance: 0.70, quantityMin: 1, quantityMax: 2 },
      { itemId: 'jade_raw',          chance: 0.18, quantityMin: 1, quantityMax: 1 },
    ],
  },
  fox_spirit: {
    id: 'fox_spirit', name: 'Raposa Espiritual', emoji: '🦊',
    levelMin: 2, levelMax: 5, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 28, baseAtk: 9, baseDef: 1, speed: 1.0,
    qiReward: 14, goldReward: { min: 2, max: 5 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_thread',         chance: 0.55, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spider_silk',       chance: 0.20, quantityMin: 1, quantityMax: 1 },
    ],
  },
  vine_golem: {
    id: 'vine_golem', name: 'Golem de Trepadeiras', emoji: '🌿',
    levelMin: 3, levelMax: 6, rarity: 'common', biomeId: 'forest', isBoss: false,
    baseHp: 65, baseAtk: 6, baseDef: 5, speed: 2.2,
    qiReward: 16, goldReward: { min: 2, max: 6 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_thread',         chance: 0.50, quantityMin: 2, quantityMax: 3 },
      { itemId: 'jade_raw',          chance: 0.12, quantityMin: 1, quantityMax: 1 },
    ],
  },
  poison_frog: {
    id: 'poison_frog', name: 'Sapo Venenoso', emoji: '🐸',
    levelMin: 3, levelMax: 6, rarity: 'spiritual', biomeId: 'forest', isBoss: false,
    baseHp: 38, baseAtk: 12, baseDef: 2, speed: 1.4,
    qiReward: 20, goldReward: { min: 3, max: 7 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 2 },
      { itemId: 'spider_venom',      chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'lizard_scale',      chance: 0.25, quantityMin: 1, quantityMax: 1 },
    ],
  },
  shadow_cat: {
    id: 'shadow_cat', name: 'Gato das Sombras', emoji: '🐱',
    levelMin: 4, levelMax: 7, rarity: 'rare', biomeId: 'forest', isBoss: false,
    baseHp: 42, baseAtk: 14, baseDef: 2, speed: 0.9,
    qiReward: 28, goldReward: { min: 5, max: 12 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 3 },
      { itemId: 'spider_silk',       chance: 0.55, quantityMin: 1, quantityMax: 2 },
      { itemId: 'jade_raw',          chance: 0.30, quantityMin: 1, quantityMax: 1 },
      { itemId: 'spider_venom',      chance: 0.15, quantityMin: 1, quantityMax: 1 },
    ],
  },
  // Boss: Floresta
  snake_king: {
    id: 'snake_king', name: 'Serpente Rei', emoji: '🐍',
    levelMin: 6, levelMax: 8, rarity: 'rare', biomeId: 'forest', isBoss: true,
    baseHp: 200, baseAtk: 18, baseDef: 6, speed: 1.0,
    qiReward: 80, goldReward: { min: 15, max: 30 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 3, quantityMax: 5 },
      { itemId: 'spider_venom',      chance: 0.75, quantityMin: 2, quantityMax: 3 },
      { itemId: 'jade_raw',          chance: 0.55, quantityMin: 1, quantityMax: 2 },
      { itemId: 'lizard_scale',      chance: 0.50, quantityMin: 2, quantityMax: 4 },
      { itemId: 'sword_iron',        chance: 0.12, quantityMin: 1, quantityMax: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  PICO DO TROVÃO
  // ══════════════════════════════════════════════════════════════
  eagle_thunder: {
    id: 'eagle_thunder', name: 'Águia do Trovão', emoji: '🦅',
    levelMin: 10, levelMax: 14, rarity: 'common', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 80, baseAtk: 18, baseDef: 5, speed: 1.1,
    qiReward: 35, goldReward: { min: 5, max: 12 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 3 },
      { itemId: 'thunder_feather',   chance: 0.60, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_thread',         chance: 0.35, quantityMin: 1, quantityMax: 3 },
    ],
  },
  wolf_lightning: {
    id: 'wolf_lightning', name: 'Lobo de Raios', emoji: '🐺',
    levelMin: 11, levelMax: 15, rarity: 'spiritual', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 110, baseAtk: 22, baseDef: 7, speed: 1.0,
    qiReward: 50, goldReward: { min: 8, max: 18 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 2, quantityMax: 3 },
      { itemId: 'wolf_fang',         chance: 0.65, quantityMin: 1, quantityMax: 2 },
      { itemId: 'bronze_spiritual',  chance: 0.30, quantityMin: 1, quantityMax: 2 },
    ],
  },
  tiger_spiritual: {
    id: 'tiger_spiritual', name: 'Tigre Espiritual', emoji: '🐯',
    levelMin: 12, levelMax: 16, rarity: 'rare', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 150, baseAtk: 30, baseDef: 10, speed: 0.9,
    qiReward: 72, goldReward: { min: 12, max: 25 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 2, quantityMax: 4 },
      { itemId: 'tiger_core',        chance: 0.45, quantityMin: 1, quantityMax: 1 },
      { itemId: 'bronze_spiritual',  chance: 0.40, quantityMin: 1, quantityMax: 3 },
    ],
  },
  storm_bat: {
    id: 'storm_bat', name: 'Morcego da Tempestade', emoji: '🦇',
    levelMin: 10, levelMax: 13, rarity: 'common', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 60, baseAtk: 20, baseDef: 3, speed: 0.8,
    qiReward: 38, goldReward: { min: 6, max: 14 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 1, quantityMax: 3 },
      { itemId: 'thunder_feather',   chance: 0.45, quantityMin: 1, quantityMax: 2 },
      { itemId: 'qi_thread',         chance: 0.30, quantityMin: 1, quantityMax: 2 },
    ],
  },
  rock_crab: {
    id: 'rock_crab', name: 'Caranguejo de Pedra', emoji: '🦀',
    levelMin: 11, levelMax: 14, rarity: 'common', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 130, baseAtk: 14, baseDef: 16, speed: 2.0,
    qiReward: 42, goldReward: { min: 7, max: 15 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 2, quantityMax: 3 },
      { itemId: 'bronze_spiritual',  chance: 0.50, quantityMin: 1, quantityMax: 2 },
      { itemId: 'lizard_scale',      chance: 0.30, quantityMin: 1, quantityMax: 2 },
    ],
  },
  thunder_serpent: {
    id: 'thunder_serpent', name: 'Serpente do Trovão', emoji: '🐍',
    levelMin: 12, levelMax: 15, rarity: 'spiritual', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 95, baseAtk: 26, baseDef: 8, speed: 1.2,
    qiReward: 55, goldReward: { min: 10, max: 20 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 2, quantityMax: 4 },
      { itemId: 'thunder_feather',   chance: 0.50, quantityMin: 1, quantityMax: 2 },
      { itemId: 'wolf_fang',         chance: 0.35, quantityMin: 1, quantityMax: 2 },
    ],
  },
  wind_hawk: {
    id: 'wind_hawk', name: 'Gavião do Vento', emoji: '🦉',
    levelMin: 13, levelMax: 16, rarity: 'rare', biomeId: 'thunder_peak', isBoss: false,
    baseHp: 85, baseAtk: 32, baseDef: 6, speed: 0.7,
    qiReward: 78, goldReward: { min: 14, max: 28 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 2, quantityMax: 4 },
      { itemId: 'thunder_feather',   chance: 0.70, quantityMin: 2, quantityMax: 4 },
      { itemId: 'tiger_core',        chance: 0.20, quantityMin: 1, quantityMax: 1 },
    ],
  },
  // Boss: Pico do Trovão
  phoenix_thunder: {
    id: 'phoenix_thunder', name: 'Fênix do Trovão', emoji: '🦜',
    levelMin: 16, levelMax: 18, rarity: 'ancient', biomeId: 'thunder_peak', isBoss: true,
    baseHp: 600, baseAtk: 45, baseDef: 18, speed: 0.8,
    qiReward: 300, goldReward: { min: 50, max: 100 },
    dropTable: [
      { itemId: 'spiritual_essence', chance: 1.0, quantityMin: 5, quantityMax: 8 },
      { itemId: 'thunder_feather',   chance: 0.85, quantityMin: 3, quantityMax: 5 },
      { itemId: 'tiger_core',        chance: 0.65, quantityMin: 1, quantityMax: 2 },
      { itemId: 'ring_bronze',       chance: 0.12, quantityMin: 1, quantityMax: 1 },
      { itemId: 'wolf_fang',         chance: 0.50, quantityMin: 2, quantityMax: 4 },
    ],
  },
}
