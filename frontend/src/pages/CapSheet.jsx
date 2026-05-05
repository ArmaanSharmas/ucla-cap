import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { capSheetApi, playersApi, savedRostersApi } from '../api/client'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import AddToCapModal from '../components/AddToCapModal'
import StickyCapBar from '../components/capsheet/StickyCapBar'
import PositionCard, {
  MiniCard,
  CardDragGhost,
  PlayerDragGhost,
  POSITION_ORDER,
  COLORS,
  TIER_META,
  getEffectiveSalary,
} from '../components/capsheet/PositionCard'
import CapPieChart from '../components/capsheet/CapPieChart'
import CompareMode from '../components/capsheet/CompareMode'
import { fmtShort } from '../utils/player'

const CARD_ORDER_KEY = 'uclaCapCardOrder'

function fmt(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function loadCardOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_ORDER_KEY) || 'null')
    if (Array.isArray(saved) && saved.length === POSITION_ORDER.length) return saved
  } catch { /* ignore */ }
  return POSITION_ORDER
}

function saveCardOrder(order) {
  localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(order))
}

function isCardId(id) {
  return POSITION_ORDER.includes(String(id))
}

function groupEntries(list) {
  const groups = {}
  for (const pos of POSITION_ORDER) groups[pos] = []
  for (const e of list) {
    const p = e.depth_chart_position
    if (!groups[p]) groups[p] = []
    groups[p].push(e)
  }
  for (const pos of POSITION_ORDER) {
    groups[pos].sort((a, b) => a.string_number - b.string_number)
  }
  return groups
}

function avgStat(entries, field) {
  const vals = entries.map(e => e.player[field]).filter(v => v != null)
  if (!vals.length) return null
  return (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1)
}


// ── Save Roster modal ─────────────────────────────────────────────────────────
function SaveRosterModal({ isOpen, onClose, onSave }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setName('')
  }, [isOpen])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim())
      toast.success('Roster saved')
      onClose()
    } catch {
      toast.error('Failed to save roster')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Current Roster</h3>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Roster Name</label>
        <input
          className="input mb-5"
          placeholder="e.g. Pre-signing day roster"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary">
            {saving ? 'Saving…' : 'Save Roster'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Roster confirmation modal ──────────────────────────────────────────────
function NewRosterModal({ isOpen, onClose, onConfirm, clearing }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Clear Cap Sheet?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will remove all players from the cap sheet. This cannot be undone. Save a snapshot first if you want to keep this roster.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={onConfirm} disabled={clearing} className="btn-danger">
            {clearing ? 'Clearing…' : 'Clear Everything'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function CapSheet() {
  const { capBudget } = useSettings()
  const toast = useToast()
  const [serverEntries, setServerEntries] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [localEntries, setLocalEntries] = useState([])
  const [cardOrder, setCardOrder] = useState(loadCardOrder)
  const [collapsed, setCollapsed] = useState({})
  const [focusedPos, setFocusedPos] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [saveRosterOpen, setSaveRosterOpen] = useState(false)
  const [newRosterOpen, setNewRosterOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [dragOriginPos, setDragOriginPos] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function fetchAll() {
    try {
      setLoading(true)
      setError(null)
      const [capRes, playersRes] = await Promise.all([
        capSheetApi.getAll(),
        playersApi.getAll(),
      ])
      if (Array.isArray(capRes?.data)) {
        setServerEntries(capRes.data)
        setLocalEntries(capRes.data)
      }
      if (Array.isArray(playersRes?.data)) setAllPlayers(playersRes.data)
    } catch {
      setError('Failed to load cap sheet. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const grouped = useMemo(() => groupEntries(localEntries), [localEntries])

  const totalCapUsed = useMemo(
    () => localEntries.reduce((s, e) => s + getEffectiveSalary(e.player), 0),
    [localEntries]
  )
  const isOver = totalCapUsed > capBudget

  const avgRating = useMemo(() => avgStat(localEntries, 'coach_rating'), [localEntries])
  const avgRisk = useMemo(() => avgStat(localEntries, 'flight_risk'), [localEntries])

  const capSheetPlayerIds = useMemo(
    () => new Set(localEntries.map(e => e.player.id)),
    [localEntries]
  )
  const availablePlayers = useMemo(
    () => allPlayers.filter(p => !capSheetPlayerIds.has(p.id)),
    [allPlayers, capSheetPlayerIds]
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
    if (!isCardId(active.id)) {
      const entryId = parseInt(String(active.id).replace('entry-', ''))
      const entry = localEntries.find(e => e.id === entryId)
      setDragOriginPos(entry?.depth_chart_position ?? null)
    }
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    if (isCardId(active.id)) return
    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    if (activeType !== 'player') return

    const activeEntryId = parseInt(String(active.id).replace('entry-', ''))
    const activeEntry = localEntries.find(e => e.id === activeEntryId)
    if (!activeEntry) return

    let targetPos
    if (overType === 'card') {
      targetPos = String(over.id)
    } else if (overType === 'player') {
      const overEntryId = parseInt(String(over.id).replace('entry-', ''))
      const overEntry = localEntries.find(e => e.id === overEntryId)
      targetPos = overEntry?.depth_chart_position
    }

    if (!targetPos || targetPos === activeEntry.depth_chart_position) return

    setCollapsed(c => c[targetPos] ? { ...c, [targetPos]: false } : c)
    setLocalEntries(prev =>
      prev.map(e => e.id === activeEntryId ? { ...e, depth_chart_position: targetPos } : e)
    )
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    setDragOriginPos(null)

    if (!over) {
      setLocalEntries(serverEntries)
      return
    }

    const activeId = active.id
    const overId = over.id

    if (isCardId(activeId)) {
      if (!isCardId(overId)) return
      const oldIdx = cardOrder.indexOf(String(activeId))
      const newIdx = cardOrder.indexOf(String(overId))
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        const newOrder = arrayMove(cardOrder, oldIdx, newIdx)
        setCardOrder(newOrder)
        saveCardOrder(newOrder)
      }
      return
    }

    const activeEntryId = parseInt(String(activeId).replace('entry-', ''))
    const activeEntry = localEntries.find(e => e.id === activeEntryId)
    if (!activeEntry) return

    const targetPos = activeEntry.depth_chart_position
    const origPos = dragOriginPos

    let grpEntries = localEntries.filter(e => e.depth_chart_position === targetPos)

    const overType = over.data.current?.type
    if (overType === 'player') {
      const overEntryId = parseInt(String(overId).replace('entry-', ''))
      const overEntry = localEntries.find(e => e.id === overEntryId)
      if (overEntry && overEntry.depth_chart_position === targetPos) {
        const oldIdx = grpEntries.findIndex(e => e.id === activeEntryId)
        const newIdx = grpEntries.findIndex(e => e.id === overEntryId)
        if (oldIdx !== newIdx && oldIdx >= 0 && newIdx >= 0) {
          grpEntries = arrayMove(grpEntries, oldIdx, newIdx)
        }
      }
    }

    const updatedTarget = grpEntries.map((e, i) => ({ ...e, string_number: i + 1 }))
    const movedGroups = origPos && origPos !== targetPos
    const updatedOrigin = movedGroups
      ? localEntries
          .filter(e => e.depth_chart_position === origPos)
          .sort((a, b) => a.string_number - b.string_number)
          .map((e, i) => ({ ...e, string_number: i + 1 }))
      : []

    const newLocalEntries = [
      ...localEntries.filter(e =>
        e.depth_chart_position !== targetPos &&
        !(movedGroups && e.depth_chart_position === origPos)
      ),
      ...updatedTarget,
      ...updatedOrigin,
    ]

    setLocalEntries(newLocalEntries)
    persistDragChanges(newLocalEntries, serverEntries)
  }

  async function persistDragChanges(newEntries, oldEntries) {
    const changed = newEntries.filter(ne => {
      const orig = oldEntries.find(oe => oe.id === ne.id)
      return !orig ||
        orig.depth_chart_position !== ne.depth_chart_position ||
        orig.string_number !== ne.string_number
    })
    if (!changed.length) return

    try {
      await Promise.all(
        changed.map(e =>
          capSheetApi.update(e.id, {
            depth_chart_position: e.depth_chart_position,
            string_number: e.string_number,
          })
        )
      )
      setServerEntries(newEntries)
    } catch {
      setLocalEntries(serverEntries)
    }
  }

  async function handleRemove(entryId) {
    try {
      await capSheetApi.remove(entryId)
      fetchAll()
    } catch {
      toast.error('Failed to remove player')
    }
  }

  async function handleAdd(data) {
    await capSheetApi.add(data)
    setAddModalOpen(false)
    fetchAll()
  }

  async function handleSaveRoster(name) {
    await savedRostersApi.create({ name })
  }

  function exportCSV() {
    const rows = [
      ['Position Group', 'Depth #', 'Name', 'School', 'Position', 'Year', 'Actual Salary', 'Projected Salary', 'Cap Hit', 'Coach Rating', 'Flight Risk'],
      ...localEntries
        .slice()
        .sort((a, b) => {
          const pi = POSITION_ORDER.indexOf(a.depth_chart_position)
          const qi = POSITION_ORDER.indexOf(b.depth_chart_position)
          if (pi !== qi) return pi - qi
          return a.string_number - b.string_number
        })
        .map(e => {
          const p = e.player
          return [
            e.depth_chart_position,
            e.string_number,
            p.name,
            p.school,
            p.position,
            p.year,
            p.actual_salary ?? '',
            p.projected_salary ?? '',
            getEffectiveSalary(p),
            p.coach_rating ?? '',
            p.flight_risk ?? '',
          ]
        }),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cap-sheet-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClearRoster() {
    setClearing(true)
    try {
      await capSheetApi.clearAll()
      setNewRosterOpen(false)
      fetchAll()
    } catch {
      toast.error('Failed to clear cap sheet')
    } finally {
      setClearing(false)
    }
  }

  const toggleCollapse = useCallback((pos) => {
    setCollapsed(c => ({ ...c, [pos]: !c[pos] }))
  }, [])

  const activeEntry = useMemo(() => {
    if (!activeId || isCardId(activeId)) return null
    const id = parseInt(String(activeId).replace('entry-', ''))
    return localEntries.find(e => e.id === id) ?? null
  }, [activeId, localEntries])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">{error}</div>
    )
  }

  // ── Compare mode ─────────────────────────────────────────────────────────
  if (compareMode) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StickyCapBar totalCapUsed={totalCapUsed} avgRating={avgRating} avgRisk={avgRisk} showMetrics={showMetrics} onToggleMetrics={() => setShowMetrics(s => !s)} />
        <CompareMode
          currentEntries={serverEntries}
          onExit={() => setCompareMode(false)}
        />
      </div>
    )
  }

  // ── Focus mode ────────────────────────────────────────────────────────────
  if (focusedPos) {
    const otherPositions = cardOrder.filter(p => p !== focusedPos)
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StickyCapBar totalCapUsed={totalCapUsed} avgRating={avgRating} avgRisk={avgRisk} showMetrics={showMetrics} onToggleMetrics={() => setShowMetrics(s => !s)} />
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 dark:border-[#2D4A70] bg-white dark:bg-[#1A2840] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Focus: <span className={COLORS[focusedPos]?.text}>{focusedPos}</span>
            </span>
            <span className="text-xs text-gray-400">{grouped[focusedPos].length} players</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => setAddModalOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Player
            </button>
            <button onClick={() => setFocusedPos(null)} className="btn-ghost">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit Focus
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden gap-4 px-6 py-5">
          <div className="flex-[7] overflow-y-auto min-w-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <PositionCard
                position={focusedPos}
                entries={grouped[focusedPos]}
                totalBudget={capBudget}
                collapsed={false}
                onToggle={() => {}}
                focused={true}
                onFocus={setFocusedPos}
                onRemove={handleRemove}
                activeId={activeId}
              />
              <DragOverlay>
                {activeEntry ? <PlayerDragGhost entry={activeEntry} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
          <div className="flex-[3] overflow-y-auto flex flex-col gap-2 min-w-[160px]">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1 px-1">
              Other Groups
            </div>
            {otherPositions.map(pos => (
              <MiniCard
                key={pos}
                position={pos}
                entries={grouped[pos]}
                totalBudget={capBudget}
                onClick={() => setFocusedPos(pos)}
              />
            ))}
          </div>
        </div>
        <AddToCapModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAdd={handleAdd}
          availablePlayers={availablePlayers}
        />
      </div>
    )
  }

  // ── Normal view ────────────────────────────────────────────────────────────
  const capRemaining = capBudget - totalCapUsed

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <StickyCapBar
        totalCapUsed={totalCapUsed}
        avgRating={avgRating}
        avgRisk={avgRisk}
        showMetrics={showMetrics}
        onToggleMetrics={() => setShowMetrics(s => !s)}
      />

      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-5 pb-4 bg-white dark:bg-[#1A2840] border-b border-gray-200 dark:border-[#2D4A70] flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cap Sheet</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {localEntries.length} players · Budget {fmt(capBudget)} ·{' '}
            <span className={isOver ? 'text-red-600' : 'text-green-600'}>
              {isOver ? 'OVER' : fmtShort(capRemaining) + ' remaining'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewRosterOpen(true)}
            className="btn-danger"
            title="Clear cap sheet and start fresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            New Roster
          </button>
          <button
            onClick={() => setSaveRosterOpen(true)}
            className="btn-ghost"
            title="Snapshot current cap sheet as a saved roster"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Roster
          </button>
          <button
            onClick={exportCSV}
            disabled={localEntries.length === 0}
            className="btn-ghost"
            title="Download current cap sheet as CSV"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className="btn-ghost"
            title="Compare two saved rosters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare
          </button>
          <button className="btn-primary" onClick={() => setAddModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Player
          </button>
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex items-center gap-5 px-8 py-2 bg-white dark:bg-[#1A2840] border-b border-gray-100 dark:border-[#1F3351] flex-shrink-0">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Tiers</span>
        {[
          { tier: 'star',     dotColor: 'bg-purple-400', desc: '1st string · rated 4–5★' },
          { tier: 'starter',  dotColor: 'bg-green-400',  desc: '1st string'               },
          { tier: 'rotation', dotColor: 'bg-yellow-400', desc: '2nd string'               },
          { tier: 'bench',    dotColor: 'bg-red-400',    desc: '3rd string+'              },
        ].map(({ tier, dotColor, desc }) => (
          <div key={tier} className="flex items-center gap-1.5" title={desc}>
            <div className={`w-[3px] h-3.5 rounded-full ${dotColor} flex-shrink-0`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{TIER_META[tier].label}</span>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-[#0F1923]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 px-8 py-4 xl:grid-cols-3">
              {cardOrder.map(pos => (
                <PositionCard
                  key={pos}
                  position={pos}
                  entries={grouped[pos]}
                  totalBudget={capBudget}
                  collapsed={!!collapsed[pos]}
                  onToggle={() => toggleCollapse(pos)}
                  focused={false}
                  onFocus={setFocusedPos}
                  onRemove={handleRemove}
                  activeId={activeId}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeId ? (
              isCardId(activeId) ? (
                <CardDragGhost
                  position={String(activeId)}
                  entries={grouped[String(activeId)] ?? []}
                  totalBudget={capBudget}
                />
              ) : (
                <PlayerDragGhost entry={activeEntry} />
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Combined cap overview: donut + bar breakdown */}
        <CapPieChart
          entriesByPosition={grouped}
          totalBudget={capBudget}
          totalCapUsed={totalCapUsed}
          isOver={isOver}
          onClickPosition={setFocusedPos}
        />
      </div>

      <AddToCapModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
        availablePlayers={availablePlayers}
      />

      <SaveRosterModal
        isOpen={saveRosterOpen}
        onClose={() => setSaveRosterOpen(false)}
        onSave={handleSaveRoster}
      />

      <NewRosterModal
        isOpen={newRosterOpen}
        onClose={() => setNewRosterOpen(false)}
        onConfirm={handleClearRoster}
        clearing={clearing}
      />
    </div>
  )
}
