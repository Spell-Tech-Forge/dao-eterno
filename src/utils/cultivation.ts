import type { Realm, RealmStage } from '../types'
import { REALM_NAMES, STAGE_NAMES } from '../types'

export const REALM_ORDER: Realm[] = [
  'body_tempering',
  'houtian',
  'xiantian',
  'revolving_core',
  'life_destruction',
  'divine_sea',
  'divine_transformation',
  'divine_lord',
  'holy_lord',
  'world_king',
  'empyrean',
  'true_divinity',
  'beyond_divinity',
]

const BODY_TEMPERING_STAGES: RealmStage[] = [
  'strength', 'muscle', 'bone', 'marrow', 'meridian', 'eight_gates', 'nine_stars',
]
const LIFE_DESTRUCTION_STAGES: RealmStage[] = [
  'destruction_1', 'destruction_2', 'destruction_3',
  'destruction_4', 'destruction_5', 'destruction_6',
  'destruction_7', 'destruction_8', 'destruction_9',
]
const STANDARD_STAGES: RealmStage[] = ['initial', 'middle', 'advanced', 'peak']

export function getStagesForRealm(realm: Realm | string): RealmStage[] {
  if (realm === 'body_tempering')   return BODY_TEMPERING_STAGES
  if (realm === 'life_destruction') return LIFE_DESTRUCTION_STAGES
  return STANDARD_STAGES
}

// Retorna índice global de cultivo (para comparações)
export function cultivationIndex(realm: Realm | string, stage: RealmStage | string): number {
  const realmIdx = REALM_ORDER.indexOf(realm as Realm)
  if (realmIdx === -1) return -1
  const stages = getStagesForRealm(realm)
  const stageIdx = stages.indexOf(stage as RealmStage)
  return realmIdx * 10 + (stageIdx >= 0 ? stageIdx : 0)
}

export function isAtLeast(
  playerRealm: Realm | string,
  playerStage: RealmStage | string,
  requiredRealm: Realm | string,
  requiredStage: RealmStage | string,
): boolean {
  return cultivationIndex(playerRealm, playerStage) >= cultivationIndex(requiredRealm, requiredStage)
}

export function firstStageOf(realm: Realm): RealmStage {
  return getStagesForRealm(realm)[0]
}

export function lastStageOf(realm: Realm): RealmStage {
  const stages = getStagesForRealm(realm)
  return stages[stages.length - 1]
}

export function isLastStageOfRealm(realm: Realm | string, stage: RealmStage | string): boolean {
  const stages = getStagesForRealm(realm)
  return stages[stages.length - 1] === stage
}

// Mapeamento de compatibilidade: converte nomes antigos → novos
export const LEGACY_REALM_MAP: Record<string, Realm> = {
  qi_refining:           'body_tempering',
  foundation:            'houtian',
  golden_core:           'xiantian',
  nascent_soul:          'revolving_core',
  spirit_transformation: 'divine_sea',
  unification:           'divine_transformation',
  ascension:             'divine_lord',
  immortal:              'holy_lord',
}

export const LEGACY_STAGE_MAP: Record<string, RealmStage> = {
  // Português legado
  'Inicial':   'initial',
  'Médio':     'middle',
  'Avançado':  'advanced',
  'Pico':      'peak',
}

export function normalizeLegacyRealm(realm: string): Realm {
  return (LEGACY_REALM_MAP[realm] ?? realm) as Realm
}

export function normalizeLegacyStage(stage: string): RealmStage {
  return (LEGACY_STAGE_MAP[stage] ?? stage) as RealmStage
}

export function realmName(realm: string): string {
  return REALM_NAMES[realm as Realm] ?? realm
}

export function stageName(stage: string): string {
  return STAGE_NAMES[stage as RealmStage] ?? stage
}
