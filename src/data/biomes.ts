import type { BiomeDefinition } from '../types'

export const BIOME_DEFS: Record<string, BiomeDefinition> = {
  forest: {
    id: 'forest',
    name: 'Floresta Espiritual',
    description: 'Uma floresta densa impregnada de Qi natural. Perfeita para iniciantes.',
    requiredRealm: 'qi_refining',
    requiredStage: 'initial',
    enemyPool: ['spider_spiritual', 'boar_spiritual', 'lizard_jade', 'fox_spirit', 'vine_golem', 'poison_frog', 'shadow_cat'],
    bossId: 'snake_king',
    minKillsBeforeBoss: 10,
    bossSpawnChance: 0.20,
    normalRarityWeights: { common: 60, uncommon: 40 },
    bossRarity: 'spiritual',
    theme: {
      gradient: 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
      accentColor: '#4a9e7f',
    },
  },
  thunder_peak: {
    id: 'thunder_peak',
    name: 'Pico do Trovão',
    description: 'Montanhas varridas por tempestades eternas. Criaturas eletrificadas habitam os picos.',
    requiredRealm: 'foundation',
    requiredStage: 'initial',
    enemyPool: ['eagle_thunder', 'wolf_lightning', 'tiger_spiritual', 'storm_bat', 'rock_crab', 'thunder_serpent', 'wind_hawk'],
    bossId: 'phoenix_thunder',
    minKillsBeforeBoss: 10,
    bossSpawnChance: 0.20,
    normalRarityWeights: { common: 35, uncommon: 35, spiritual: 30 },
    bossRarity: 'rare',
    theme: {
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)',
      accentColor: '#a855f7',
    },
  },
  frozen_abyss: {
    id: 'frozen_abyss',
    name: 'Abismo Gelado',
    description: 'Cavernas de gelo eterno habitadas por espíritos do frio.',
    requiredRealm: 'golden_core',
    requiredStage: 'initial',
    enemyPool: [],
    bossId: '',
    minKillsBeforeBoss: 10,
    bossSpawnChance: 0.20,
    normalRarityWeights: { common: 20, uncommon: 25, spiritual: 30, rare: 25 },
    bossRarity: 'ancient',
    theme: {
      gradient: 'linear-gradient(135deg, #0f1d2e 0%, #1a2f45 100%)',
      accentColor: '#60a5fa',
    },
  },
  demon_plains: {
    id: 'demon_plains',
    name: 'Planície dos Demônios',
    description: 'Terras corruptas onde demônios ancestrais vagam sem descanso.',
    requiredRealm: 'nascent_soul',
    requiredStage: 'initial',
    enemyPool: [],
    bossId: '',
    minKillsBeforeBoss: 12,
    bossSpawnChance: 0.18,
    normalRarityWeights: { common: 10, uncommon: 15, spiritual: 25, rare: 30, ancient: 20 },
    bossRarity: 'legendary',
    theme: {
      gradient: 'linear-gradient(135deg, #2e1010 0%, #4e1b1b 100%)',
      accentColor: '#ef4444',
    },
  },
}

export const BIOME_ORDER = ['forest', 'thunder_peak', 'frozen_abyss', 'demon_plains']
