export interface DismantleConfig {
  baseRate:           number  // 0–1, fração base de ingredientes da receita recuperados
  maxRate:            number  // 0–1, teto da fração (bônus de nível de forja não ultrapassa)
  levelBonus:         number  // acréscimo por nível de forja (ex: 0.006)
  fallbackItemId:     string  // item retornado quando o item não tem receita
  fallbackQtyPerTier: number  // qtd base × tier do item quando não há receita
  upgradeRecovery:    number  // 0–1, fração dos materiais de aprimoramento recuperados
  ascensionRecovery:  number  // 0–1, fração dos materiais de ascensão recuperados
}

export const DEFAULT_DISMANTLE_CONFIG: DismantleConfig = {
  baseRate:           0.80,
  maxRate:            0.95,
  levelBonus:         0.006,
  fallbackItemId:     'spiritual_essence',
  fallbackQtyPerTier: 2,
  upgradeRecovery:    0.80,
  ascensionRecovery:  0.80,
}

export function calcDismantleRate(forgeLevel: number, cfg: DismantleConfig): number {
  return Math.min(cfg.maxRate, cfg.baseRate + forgeLevel * cfg.levelBonus)
}
