import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useGameDataStore } from '../../store/gameDataStore'
import { SpriteImg } from '../ui/SpriteImg'
import { RARITY_COLORS, RARITY_LABELS } from '../../types'
import { effectiveRarity } from '../../utils/forge'

// ── Tipos ─────────────────────────────────────────────────────────

interface UserRow {
  id: number
  username: string
  char_id: number | null
  char_name: string | null
  realm: string | null
  spirit_gold: string | null
}

interface InventoryItem {
  instanceId: string
  definitionId: string
  quantity: number
  upgradeLevel?: number
  ascensionTier?: number
  durability?: number
}

interface CharInventory {
  id: number
  name: string
  spirit_gold: string | number
  inventory: {
    items: InventoryItem[]
    equipped: Record<string, InventoryItem | null>
    maxSlots: number
  } | null
}

// ── Componente principal ───────────────────────────────────────────

export function PlayerInventoryPanel() {
  const items = useGameDataStore(s => s.items)

  const [users, setUsers]           = useState<UserRow[]>([])
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null)
  const [charData, setCharData]     = useState<CharInventory | null>(null)
  const [loading, setLoading]       = useState(false)
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null)
  const [search, setSearch]         = useState('')

  // Add item form
  const [addItemId, setAddItemId]   = useState('')
  const [addQty, setAddQty]         = useState(1)
  const [addSearch, setAddSearch]   = useState('')

  // Gold
  const [goldInput, setGoldInput]   = useState('')

  useEffect(() => {
    api.get<UserRow[]>('/api/admin/users').then(data => setUsers(data)).catch(() => {})
  }, [])

  const loadInventory = useCallback(async (charId: number) => {
    setLoading(true)
    try {
      const data = await api.get<CharInventory>(`/api/admin/inventory/${charId}`)
      setCharData(data)
      setGoldInput(String(data.spirit_gold ?? 0))
    } catch {
      setMsg({ text: 'Erro ao carregar inventário.', ok: false })
    } finally {
      setLoading(false)
    }
  }, [])

  function selectChar(charId: number) {
    setSelectedCharId(charId)
    setCharData(null)
    setMsg(null)
    loadInventory(charId)
  }

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleAddItem() {
    if (!selectedCharId || !addItemId) return
    try {
      await api.post(`/api/admin/inventory/${selectedCharId}/add`, { definitionId: addItemId, quantity: addQty })
      flash('Item adicionado!', true)
      loadInventory(selectedCharId)
      setAddItemId('')
      setAddQty(1)
      setAddSearch('')
    } catch {
      flash('Erro ao adicionar item.', false)
    }
  }

  async function handleRemoveItem(instanceId: string) {
    if (!selectedCharId) return
    try {
      await api.delete(`/api/admin/inventory/${selectedCharId}/item/${instanceId}`)
      flash('Item removido.', true)
      loadInventory(selectedCharId)
    } catch {
      flash('Erro ao remover item.', false)
    }
  }

  async function handleSetGold() {
    if (!selectedCharId) return
    const amount = parseInt(goldInput)
    if (isNaN(amount) || amount < 0) return flash('Valor inválido.', false)
    try {
      await api.patch(`/api/admin/inventory/${selectedCharId}/gold`, { amount })
      flash('Ouro atualizado!', true)
      if (charData) setCharData({ ...charData, spirit_gold: amount })
    } catch {
      flash('Erro ao atualizar ouro.', false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.char_name && (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.char_name.toLowerCase().includes(search.toLowerCase())
    )
  )

  const allGameItems = Object.values(items)
  const filteredGameItems = addSearch
    ? allGameItems.filter(i => i.name.toLowerCase().includes(addSearch.toLowerCase()) || i.id.includes(addSearch.toLowerCase()))
    : allGameItems.slice(0, 40)

  const inventoryItems = charData?.inventory?.items ?? []
  const equippedSet = new Set(
    Object.values(charData?.inventory?.equipped ?? {}).filter(Boolean).map(e => e!.instanceId)
  )

  return (
    <div className="flex gap-4 h-[70vh]">

      {/* ── Coluna esquerda: lista de jogadores ── */}
      <div className="w-52 shrink-0 flex flex-col gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar jogador..."
          className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-600 placeholder:text-slate-600"
        />
        <div className="overflow-y-auto no-scrollbar flex-1 space-y-0.5">
          {filteredUsers.map(u => (
            <button
              key={u.char_id}
              onClick={() => selectChar(u.char_id!)}
              className={`w-full text-left px-2.5 py-2 text-xs border transition-colors ${
                selectedCharId === u.char_id
                  ? 'border-amber-600 bg-amber-950/20 text-amber-300'
                  : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <div className="font-bold truncate">{u.char_name}</div>
              <div className="text-slate-500 truncate">{u.username}</div>
              {u.realm && <div className="text-[10px] text-slate-600 truncate">{u.realm}</div>}
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-slate-600 px-2">Nenhum jogador encontrado.</p>
          )}
        </div>
      </div>

      {/* ── Coluna direita: inventário ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
        {!selectedCharId && (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
            Selecione um jogador.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            Carregando...
          </div>
        )}

        {msg && (
          <div className={`text-xs px-3 py-2 border ${msg.ok ? 'border-teal-700 text-teal-400 bg-teal-950/20' : 'border-red-700 text-red-400 bg-red-950/20'}`}>
            {msg.text}
          </div>
        )}

        {charData && !loading && (
          <>
            {/* Ouro */}
            <section className="border border-slate-700 p-3 space-y-2">
              <div className="text-[11px] font-cinzel text-amber-500 tracking-wider">✦ OURO</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">🪙 Atual:</span>
                <span className="text-amber-400 font-bold text-sm">{Number(charData.spirit_gold).toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={goldInput}
                  onChange={e => setGoldInput(e.target.value)}
                  className="w-36 bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={handleSetGold}
                  className="px-3 py-1 text-xs border border-amber-700 text-amber-400 hover:bg-amber-950/30 transition-colors"
                >
                  Definir
                </button>
              </div>
            </section>

            {/* Adicionar item */}
            <section className="border border-slate-700 p-3 space-y-2">
              <div className="text-[11px] font-cinzel text-teal-400 tracking-wider">✦ ADICIONAR ITEM</div>
              <input
                value={addSearch}
                onChange={e => { setAddSearch(e.target.value); setAddItemId('') }}
                placeholder="Buscar item do jogo..."
                className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-600 placeholder:text-slate-600"
              />
              <div className="max-h-32 overflow-y-auto no-scrollbar border border-slate-800 divide-y divide-slate-800">
                {filteredGameItems.map(gi => {
                  const rarity = gi.rarity as keyof typeof RARITY_COLORS
                  const color  = RARITY_COLORS[rarity] ?? '#94a3b8'
                  return (
                    <button
                      key={gi.id}
                      onClick={() => { setAddItemId(gi.id); setAddSearch(gi.name) }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left transition-colors ${
                        addItemId === gi.id ? 'bg-teal-950/30' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <SpriteImg id={gi.id} emoji={gi.emoji} kind="item" size={20} />
                      <span className="flex-1 truncate" style={{ color }}>{gi.name}</span>
                      <span className="text-slate-600 text-[10px]">{gi.type} T{gi.tier}</span>
                      {addItemId === gi.id && <span className="text-teal-400">✓</span>}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Qtd:</span>
                <input
                  type="number"
                  min={1}
                  value={addQty}
                  onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-600"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!addItemId}
                  className="px-4 py-1 text-xs border border-teal-700 text-teal-400 hover:bg-teal-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>
            </section>

            {/* Inventário atual */}
            <section className="border border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-cinzel text-slate-400 tracking-wider">✦ INVENTÁRIO ({inventoryItems.length}/{charData.inventory?.maxSlots ?? 30})</div>
              </div>
              {inventoryItems.length === 0 ? (
                <p className="text-xs text-slate-600">Inventário vazio.</p>
              ) : (
                <div className="space-y-0.5">
                  {inventoryItems.map(item => {
                    const def = items[item.definitionId]
                    if (!def) return null
                    const rarity  = def.rarity as keyof typeof RARITY_COLORS
                    const effRar  = effectiveRarity(rarity, item.ascensionTier ?? 0)
                    const color   = RARITY_COLORS[effRar] ?? '#94a3b8'
                    const isEquip = equippedSet.has(item.instanceId)
                    return (
                      <div
                        key={item.instanceId}
                        className="flex items-center gap-2 px-2 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900/40"
                      >
                        <SpriteImg id={def.id} emoji={def.emoji} kind="item" size={22} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs truncate" style={{ color }}>{def.name}</span>
                          {item.upgradeLevel ? <span className="text-slate-500 text-[10px] ml-1">+{item.upgradeLevel}</span> : null}
                          {(item.ascensionTier ?? 0) > 0 && <span className="text-[10px] ml-1" style={{ color }}>✦{item.ascensionTier}</span>}
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">×{item.quantity}</span>
                        <span className="text-[10px] text-slate-600 w-8 shrink-0">
                          {RARITY_LABELS[effRar]?.slice(0, 3)}
                        </span>
                        {isEquip && <span className="text-[10px] text-amber-500 shrink-0">EQ</span>}
                        <button
                          onClick={() => handleRemoveItem(item.instanceId)}
                          className="text-red-500/60 hover:text-red-400 text-xs shrink-0 px-1 transition-colors"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
