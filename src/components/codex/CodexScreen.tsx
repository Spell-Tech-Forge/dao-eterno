import { useState } from 'react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { usePlayerStore } from '../../store/playerStore'
import { useGameDataStore } from '../../store/gameDataStore'
import { REALM_NAMES, STAGE_NAMES, RARITY_COLORS, RARITY_LABELS, RARITY_PROGRESSION } from '../../types'
import type { Realm, RealmStage } from '../../types'
import {
  enhancementCost, ascensionCost, upgradeFailChance,
  itemStatMultiplier, MAX_UPGRADE_LEVEL, MIN_UPGRADE_FOR_ASCENSION,
} from '../../utils/forge'
import { SpriteImg } from '../ui/SpriteImg'

type CodexTab = 'beasts' | 'equipment' | 'realms' | 'forge'

const REALMS: Realm[] = ['qi_refining','foundation','golden_core','nascent_soul','spirit_transformation','unification','ascension','immortal']
const STAGES: RealmStage[] = ['initial','middle','advanced','peak']

const REALM_DESCRIPTIONS: Record<Realm, string> = {
  qi_refining:           'O cultivador começa a sentir o Qi do mundo e o absorve pelo corpo. Primeiro passo no caminho da imortalidade.',
  foundation:            'O Qi se solidifica dentro do meridiano central, formando uma fundação espiritual duradoura.',
  golden_core:           'Um núcleo de energia pura se forma no dantian. O cultivador transcende a mortalidade.',
  nascent_soul:          'A alma do cultivador torna-se independente do corpo físico, capaz de viajar pelo éter.',
  spirit_transformation: 'Corpo e espírito fundem-se com o Qi universal. O cultivador torna-se parte do Dao.',
  unification:           'O cultivador unifica as leis do céu e da terra, comandando os elementos com um pensamento.',
  ascension:             'A tribulação do Trovão testa se o cultivador é digno de ascender ao plano imortal.',
  immortal:              'Além da vida e da morte. O cultivador existe enquanto o Dao existir.',
}

// ── Aba Bestas ────────────────────────────────────────────────────
function BeastsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { entries } = useBestiaryStore()
  const monsters = useGameDataStore(s => s.monsters)
  const biomes   = useGameDataStore(s => s.biomes)
  const itemDefs = useGameDataStore(s => s.items)

  const all         = Object.values(monsters)
  const discovered  = all.filter(m => entries[m.id])
  const undiscovered = all.filter(m => !entries[m.id])
  const selected    = selectedId ? monsters[selectedId] : null
  const entry       = selectedId ? entries[selectedId] : undefined

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted">{discovered.length} / {all.length} descobertos</div>
      <div className="grid grid-cols-5 gap-2">
        {discovered.map(def => {
          const color = RARITY_COLORS[def.rarity]
          const isSel = selectedId === def.id
          return (
            <button key={def.id} onClick={() => setSelectedId(isSel ? null : def.id)}
              className="rounded-xl border flex flex-col items-center gap-1 p-2 transition-all text-center"
              style={{ borderColor: isSel ? color : color + '44', backgroundColor: isSel ? color + '22' : color + '0d' }}>
              <SpriteImg id={def.id} emoji={def.emoji} kind="monster" />
              <span className="text-xs font-semibold text-text leading-tight line-clamp-2">{def.name}</span>
              <span className="text-xs text-gold font-bold">{entries[def.id]?.kills ?? 0} kills</span>
            </button>
          )
        })}
        {undiscovered.map(def => (
          <div key={def.id} className="rounded-xl border border-border bg-surface-2 flex flex-col items-center gap-1 p-2 text-center opacity-35">
            <span className="text-2xl">❓</span>
            <span className="text-xs text-muted">???</span>
            <span className="text-xs text-muted">{REALM_NAMES[biomes[def.biomeId]?.requiredRealm ?? 'qi_refining']}</span>
          </div>
        ))}
      </div>

      {selected && entry && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: RARITY_COLORS[selected.rarity] + '66' }}>
          <div className="flex items-center gap-3">
            <SpriteImg id={selected.id} emoji={selected.emoji} kind="monster" size={48} />
            <div className="flex-1">
              <div className="font-bold text-text">{selected.name}</div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs" style={{ color: RARITY_COLORS[selected.rarity] }}>{RARITY_LABELS[selected.rarity]}</span>
                {(() => { const b = biomes[selected.biomeId]; return b ? <span className="text-xs text-muted">{REALM_NAMES[b.requiredRealm]}</span> : null })()}
                {selected.isBoss && <span className="text-xs text-gold border border-gold/40 rounded px-1.5">BOSS</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold">{entry.kills}</div>
              <div className="text-xs text-muted">kills</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase tracking-widest mb-2">Drops</div>
            <div className="grid grid-cols-2 gap-1.5">
              {selected.dropTable.map(drop => {
                const def  = itemDefs[drop.itemId]
                const rev  = entry.kills >= 10 || entry.discoveredDrops.includes(drop.itemId)
                const pct  = entry.kills >= 10
                return (
                  <div key={drop.itemId} className="flex items-center gap-1.5 text-xs bg-surface-2 rounded-lg px-2 py-1.5">
                    <span>{rev ? def?.emoji : '❓'}</span>
                    <span className={rev ? 'text-text flex-1 truncate' : 'text-muted italic flex-1'}>
                      {rev ? (def?.name ?? drop.itemId) : '???'}
                    </span>
                    <span className={pct ? 'text-gold' : 'text-muted'}>{pct ? `${Math.round(drop.chance * 100)}%` : '?%'}</span>
                  </div>
                )
              })}
            </div>
            {entry.kills < 10 && <div className="text-xs text-muted mt-2">Drops revelados com 10 kills ({entry.kills}/10)</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Aba Equipamentos ──────────────────────────────────────────────
function EquipmentTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { discoveredItems } = useBestiaryStore()
  const itemDefs = useGameDataStore(s => s.items)

  const equipment = discoveredItems
    .map(id => itemDefs[id])
    .filter(def => def && ['weapon','armor','accessory','ring'].includes(def.type))
    .filter((def, i, arr) => arr.findIndex(d => d?.id === def?.id) === i)

  const selectedDef = selectedId ? itemDefs[selectedId] : null

  if (equipment.length === 0) {
    return <div className="text-center text-muted text-sm py-12">Nenhum equipamento descoberto ainda. Mate monstros para descobrir drops!</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted">{equipment.length} equipamentos descobertos</div>
      <div className="grid grid-cols-5 gap-2">
        {equipment.map(def => {
          if (!def) return null
          const color = RARITY_COLORS[def.rarity]
          const isSel = selectedId === def.id
          return (
            <button key={def.id} onClick={() => setSelectedId(isSel ? null : def.id)}
              className="rounded-xl border flex flex-col items-center gap-1 p-2 transition-all text-center"
              style={{ borderColor: isSel ? color : color + '44', backgroundColor: isSel ? color + '22' : color + '0d' }}>
              <SpriteImg id={def.id} emoji={def.emoji} kind="material" />
              <span className="text-xs leading-tight line-clamp-2" style={{ color }}>{def.name}</span>
              <span className="text-xs text-muted capitalize">{def.type}</span>
            </button>
          )
        })}
      </div>

      {selectedDef && (
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: RARITY_COLORS[selectedDef.rarity] + '66' }}>
          <div className="flex items-center gap-3">
            <SpriteImg id={selectedDef.id} emoji={selectedDef.emoji} kind="item" size={40} />
            <div>
              <div className="font-bold text-text">{selectedDef.name}</div>
              <div className="text-xs mt-0.5" style={{ color: RARITY_COLORS[selectedDef.rarity] }}>{RARITY_LABELS[selectedDef.rarity]}</div>
            </div>
          </div>
          <p className="text-sm text-muted">{selectedDef.description}</p>
          {selectedDef.stats && (
            <div className="flex flex-wrap gap-3 text-xs">
              {selectedDef.stats.atk   && <span className="text-text">⚔️ ATK: {selectedDef.stats.atk}</span>}
              {selectedDef.stats.speed && <span className="text-text">⏱ Vel: {selectedDef.stats.speed}s</span>}
              {selectedDef.stats.crit  && <span className="text-gold">💥 Crit: {selectedDef.stats.crit}%</span>}
              {selectedDef.stats.def   && <span className="text-text">🛡️ DEF: {selectedDef.stats.def}</span>}
              {selectedDef.stats.hp    && <span className="text-hp">❤️ HP: +{selectedDef.stats.hp}</span>}
              {selectedDef.stats.slots && <span className="text-jade">📦 Slots: {selectedDef.stats.slots}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Aba Reinos ────────────────────────────────────────────────────
function RealmsTab() {
  const { realm: playerRealm, realmStage: playerStage, qi, maxQi } = usePlayerStore()
  const [expandedRealm, setExpandedRealm] = useState<Realm>(playerRealm)
  const breakthroughs = useGameDataStore(s => s.breakthroughs)
  const itemDefs      = useGameDataStore(s => s.items)

  return (
    <div className="space-y-2">
      {REALMS.map(realm => {
        const isExpanded = expandedRealm === realm
        const isCurrent  = realm === playerRealm
        return (
          <div key={realm} className={`rounded-xl border transition-all ${isCurrent ? 'border-jade/60 bg-jade/5' : 'border-border bg-surface'}`}>
            <button
              className="w-full flex items-center gap-3 p-3 text-left"
              onClick={() => setExpandedRealm(isExpanded && !isCurrent ? playerRealm : realm)}
            >
              <div className="flex-1">
                <div className={`font-bold text-sm ${isCurrent ? 'text-jade' : 'text-text'}`}>
                  {REALM_NAMES[realm]} {isCurrent && '← Atual'}
                </div>
                {!isExpanded && (
                  <div className="text-xs text-muted mt-0.5 line-clamp-1">{REALM_DESCRIPTIONS[realm]}</div>
                )}
              </div>
              <span className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                <p className="text-xs text-muted">{REALM_DESCRIPTIONS[realm]}</p>
                <div className="space-y-2">
                  {STAGES.map(stage => {
                    const key = `${realm}_${stage}`
                    const req = breakthroughs[key]
                    const isCurStage = isCurrent && stage === playerStage
                    return (
                      <div key={stage} className={`rounded-lg p-2.5 ${isCurStage ? 'bg-jade/10 border border-jade/30' : 'bg-surface-2'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold ${isCurStage ? 'text-jade' : 'text-text'}`}>
                            {STAGE_NAMES[stage]} {isCurStage && '← Aqui'}
                          </span>
                          {req && (
                            <span className="text-xs text-qi">{req.newMaxQi.toLocaleString()} Qi máx</span>
                          )}
                          {!req && <span className="text-xs text-gold">Imortal</span>}
                        </div>
                        {isCurStage && (
                          <div className="h-1.5 rounded-full bg-surface mb-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-qi" style={{ width: `${Math.min(100, (qi / maxQi) * 100)}%` }} />
                          </div>
                        )}
                        {req && req.items.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted mr-1">Romper:</span>
                            {req.items.map(item => (
                              <span key={item.itemId} className="text-xs px-1.5 py-0.5 rounded bg-surface border border-border text-text">
                                {itemDefs[item.itemId]?.emoji} {itemDefs[item.itemId]?.name} ×{item.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                        {req && req.items.length === 0 && (
                          <span className="text-xs text-muted">Romper: só Qi cheio</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Aba Guia de Forja ─────────────────────────────────────────────
function ForgeGuideTab() {
  const [section, setSection] = useState<'enhancement' | 'ascension'>('enhancement')
  const itemDefs = useGameDataStore(s => s.items)

  const enhancementRows = Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => {
    const target = i + 1
    const costs  = enhancementCost(target)
    const fail   = upgradeFailChance(target)
    const mult   = itemStatMultiplier(target, 0)
    return { target, costs, fail, mult }
  })

  const ascensionRows = RARITY_PROGRESSION.slice(0, -1).map((rarity, i) => {
    const next = RARITY_PROGRESSION[i + 1]
    const { materials, sacrificeCount } = ascensionCost(i)
    const mult = itemStatMultiplier(0, i + 1)
    return { rarity, next, materials, sacrificeCount, mult, tier: i }
  })

  return (
    <div className="space-y-4">
      {/* Seletor de seção */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
        <button onClick={() => setSection('enhancement')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            section === 'enhancement' ? 'bg-surface text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          ⚒️ Aprimoramento
        </button>
        <button onClick={() => setSection('ascension')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            section === 'ascension' ? 'bg-surface text-gold border border-border' : 'text-muted hover:text-text'
          }`}>
          ✨ Ascensão
        </button>
      </div>

      {/* ── Aprimoramento ── */}
      {section === 'enhancement' && (
        <div className="space-y-4">
          {/* Visão geral */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="text-sm font-bold text-text">⚒️ Como funciona</div>
            <p className="text-xs text-muted">
              O Aprimoramento fortalece um item já forjado, aumentando todos os seus atributos de combate.
              Cada nível adiciona <span className="text-text font-semibold">+5% nos stats base</span> do item.
              Itens podem ser aprimorados até <span className="text-text font-semibold">+{MAX_UPGRADE_LEVEL}</span>,
              mas a partir do <span className="text-danger font-semibold">+6</span> existe chance de falha —
              que consome os materiais mas <span className="text-jade font-semibold">não destrói o item</span>.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
              <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
                <div className="text-muted mb-0.5">Bônus por nível</div>
                <div className="font-bold text-jade">+5% stats</div>
              </div>
              <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
                <div className="text-muted mb-0.5">Nível máximo</div>
                <div className="font-bold text-gold">+{MAX_UPGRADE_LEVEL}</div>
              </div>
              <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
                <div className="text-muted mb-0.5">Falha a partir de</div>
                <div className="font-bold text-danger">+{MIN_UPGRADE_FOR_ASCENSION + 1}</div>
              </div>
            </div>
          </div>

          {/* Tabela de custos */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="text-sm font-bold text-text mb-3">Tabela de Custos</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left pb-2 pr-3">Nível</th>
                    <th className="text-left pb-2 pr-3">Materiais</th>
                    <th className="text-left pb-2 pr-3">Falha</th>
                    <th className="text-left pb-2">Mult. total</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancementRows.map(({ target, costs, fail, mult }) => {
                    const failColor = fail === 0 ? '#22c55e' : fail <= 15 ? '#f59e0b' : fail <= 30 ? '#f97316' : '#ef4444'
                    return (
                      <tr key={target} className="border-b border-border/30">
                        <td className="py-1.5 pr-3 font-bold" style={{ color: fail > 0 ? failColor : '#e2e8f0' }}>
                          +{target}
                        </td>
                        <td className="py-1.5 pr-3 text-muted">
                          {costs.map(c => {
                            const def = itemDefs[c.itemId]
                            return `${def?.emoji ?? ''} ${def?.name?.split(' ')[0] ?? c.itemId} ×${c.quantity}`
                          }).join('  ')}
                        </td>
                        <td className="py-1.5 pr-3 font-bold" style={{ color: failColor }}>
                          {fail === 0 ? '—' : `${fail}%`}
                        </td>
                        <td className="py-1.5 text-jade font-bold">×{mult.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dicas */}
          <div className="rounded-xl border border-jade/30 bg-jade/5 p-4 space-y-1.5 text-xs text-muted">
            <div className="text-jade font-bold text-sm mb-2">💡 Dicas</div>
            <div>• Aprimoramento +1 a +{MIN_UPGRADE_FOR_ASCENSION}: 100% de sucesso, custo apenas em Essência Espiritual.</div>
            <div>• A partir do +{MIN_UPGRADE_FOR_ASCENSION + 1}: cada nível adiciona mais 5% de chance de falha.</div>
            <div>• Falha consome os materiais mas o item permanece no nível anterior.</div>
            <div>• O multiplicador acumula com o da Ascensão: +{MAX_UPGRADE_LEVEL} + 5 ascensões = ×{itemStatMultiplier(MAX_UPGRADE_LEVEL, 5).toFixed(2)} nos stats.</div>
          </div>
        </div>
      )}

      {/* ── Ascensão ── */}
      {section === 'ascension' && (
        <div className="space-y-4">
          {/* Visão geral */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="text-sm font-bold text-text">✨ Como funciona</div>
            <p className="text-xs text-muted">
              A Ascensão eleva a raridade de um item, concedendo um bônus permanente de
              <span className="text-text font-semibold"> +15% nos stats base</span> por tier.
              Para ascender, o item precisa estar com pelo menos
              <span className="text-gold font-semibold"> +{MIN_UPGRADE_FOR_ASCENSION}</span> de aprimoramento,
              além de materiais e <span className="text-text font-semibold">cópias do mesmo item</span> na raridade atual.
              Ao ascender, o aprimoramento é <span className="text-danger font-semibold">resetado para +0</span>.
            </p>

            {/* Progressão de raridade */}
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {RARITY_PROGRESSION.map((rar, i) => (
                <div key={rar} className="flex items-center gap-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded border"
                    style={{ color: RARITY_COLORS[rar], borderColor: RARITY_COLORS[rar] + '66', backgroundColor: RARITY_COLORS[rar] + '18' }}>
                    {RARITY_LABELS[rar]}
                  </span>
                  {i < RARITY_PROGRESSION.length - 1 && <span className="text-muted text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de ascensão */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="text-sm font-bold text-text mb-3">Tabela de Ascensão</div>
            <div className="space-y-3">
              {ascensionRows.map(({ rarity, next, materials, sacrificeCount, mult, tier }) => {
                const fromColor = RARITY_COLORS[rarity]
                const toColor   = RARITY_COLORS[next]
                return (
                  <div key={rarity} className="rounded-lg border p-3 space-y-2"
                    style={{ borderColor: fromColor + '44', backgroundColor: fromColor + '08' }}>
                    {/* Tier header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded border"
                        style={{ color: fromColor, borderColor: fromColor + '66' }}>{RARITY_LABELS[rarity]}</span>
                      <span className="text-muted text-xs">→</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded border"
                        style={{ color: toColor, borderColor: toColor + '66' }}>{RARITY_LABELS[next]}</span>
                      <span className="ml-auto text-xs font-bold text-jade">×{mult.toFixed(2)} stats</span>
                    </div>

                    {/* Custo */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted mb-1">Materiais</div>
                        {materials.map(c => {
                          const def = itemDefs[c.itemId]
                          return (
                            <div key={c.itemId} className="text-text">
                              {def?.emoji} {def?.name} ×{c.quantity}
                            </div>
                          )
                        })}
                      </div>
                      <div>
                        <div className="text-muted mb-1">Sacrifícios</div>
                        <div className="text-text">
                          {sacrificeCount}× cópia do item
                          <div className="text-[10px] text-muted mt-0.5">(mesma raridade: {RARITY_LABELS[rarity]})</div>
                        </div>
                      </div>
                    </div>

                    {/* Requisito */}
                    <div className="text-[10px] text-muted border-t border-border/30 pt-1.5">
                      Requer item com aprimoramento mínimo <span className="text-gold font-bold">+{MIN_UPGRADE_FOR_ASCENSION}</span>
                      {tier > 0 && ` e raridade ${RARITY_LABELS[rarity]}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dicas */}
          <div className="rounded-xl border border-jade/30 bg-jade/5 p-4 space-y-1.5 text-xs text-muted">
            <div className="text-jade font-bold text-sm mb-2">💡 Dicas</div>
            <div>• Ao ascender, o aprimoramento volta ao +0. Planeje subir para +{MIN_UPGRADE_FOR_ASCENSION} novamente antes da próxima ascensão.</div>
            <div>• O multiplicador total é: <span className="text-text">(1 + nível×0,05) × (1 + tier×0,15)</span></div>
            <div>• Guardar cópias do mesmo item antes de ascender poupa tempo de farm.</div>
            <div>• Um item comum pode chegar a lendário com 5 ascensões: ×{itemStatMultiplier(0, 5).toFixed(2)} stats base.</div>
            <div>• Com +{MAX_UPGRADE_LEVEL} e 5 ascensões: ×{itemStatMultiplier(MAX_UPGRADE_LEVEL, 5).toFixed(2)} — o teto do sistema.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Codex principal ───────────────────────────────────────────────
interface Props { onBack: () => void }

export function CodexScreen({ onBack }: Props) {
  const [tab, setTab] = useState<CodexTab>('beasts')

  const TABS = [
    { id: 'beasts'    as CodexTab, label: 'Bestas',       emoji: '🐾' },
    { id: 'equipment' as CodexTab, label: 'Equipamentos', emoji: '⚔️' },
    { id: 'realms'    as CodexTab, label: 'Reinos',       emoji: '🌀' },
    { id: 'forge'     as CodexTab, label: 'Forja',        emoji: '✨' },
  ]

  return (
    <div className="max-w-[65vw] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-text text-sm">← Voltar</button>
        <h1 className="text-lg font-bold text-text">Codex</h1>
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        {TABS.map(({ id, label, emoji }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? 'bg-surface-2 text-gold border border-border' : 'text-muted hover:text-text'
            }`}>
            <span>{emoji}</span><span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'beasts'    && <BeastsTab />}
      {tab === 'equipment' && <EquipmentTab />}
      {tab === 'realms'    && <RealmsTab />}
      {tab === 'forge'     && <ForgeGuideTab />}
    </div>
  )
}
