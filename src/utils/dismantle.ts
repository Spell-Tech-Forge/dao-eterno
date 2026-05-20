export interface DismantleConfig {
  baseRate:         number  // 0–1, fração base de ingredientes recuperados
  maxRate:          number  // 0–1, teto da fração
  levelBonus:       number  // acréscimo por nível de forja (ex: 0.006)
  fallbackItemId:   string  // item retornado quando o item não tem receita
  fallbackQtyPerTier: number // qtd base × tier do item quando não há receita
}

export const DEFAULT_DISMANTLE_CONFIG: DismantleConfig = {
  baseRate:           0.40,
  maxRate:            0.70,
  levelBonus:         0.006,
  fallbackItemId:     'spiritual_essence',
  fallbackQtyPerTier: 2,
}

export function calcDismantleRate(forgeLevel: number, cfg: DismantleConfig): number {
  return Math.min(cfg.maxRate, cfg.baseRate + forgeLevel * cfg.levelBonus)
}
