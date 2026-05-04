import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { savedRostersApi } from '../../api/client'
import { POSITION_ORDER, COLORS, getEffectiveSalary } from './PositionCard'
import { fmtShort } from '../../utils/player'
import { useSettings } from '../../context/SettingsContext'
const CURRENT_KEY = '__current__'

function groupEntries(entries) {
  const g = {}
  for (const pos of POSITION_ORDER) g[pos] = []
  entries.forEach(e => { if (g[e.depth_chart_position]) g[e.depth_chart_position].push(e) })
  for (const pos of POSITION_ORDER) g[pos].sort((a, b) => a.string_number - b.string_number)
  return g
}

// ── Read-only roster column ───────────────────────────────────────────────────
function RosterColumn({ label, entries, diffPlayerIds, side }) {
  const { capBudget } = useSettings()
  const grouped = useMemo(() => groupEntries(entries), [entries])
  const total = entries.reduce((s, e) => s + getEffectiveSalary(e.player), 0)
  const pct = (total / capBudget * 100).toFixed(1)
  const isOver = total > capBudget

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${side === 'left' ? 'bg-gray-400' : 'bg-ucla-blue'}`} />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
          <span className="text-xs text-gray-400">{entries.length} players</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-mono font-semibold ${isOver ? 'text-red-600' : 'text-gray-700'}`}>
            {fmtShort(total)}
          </span>
          <span className="text-xs text-gray-400 ml-1">{pct}%</span>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {POSITION_ORDER.map(pos => {
          const posEntries = grouped[pos]
          if (posEntries.length === 0) return null
          const c = COLORS[pos] || COLORS.QB
          return (
            <div key={pos} className={`rounded-lg border overflow-hidden mb-2 ${c.border}`}>
              <div className={`flex items-center gap-2 px-3 py-1.5 ${c.bg} border-b ${c.border}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${c.bar}`} />
                <span className={`text-xs font-bold ${c.text}`}>{pos}</span>
                <span className="text-xs text-gray-400 ml-auto">{posEntries.length}p</span>
              </div>
              {posEntries.map(e => {
                const salary = getEffectiveSalary(e.player)
                const isActual = e.player.actual_salary != null
                const noContract = e.player.actual_salary == null && e.player.projected_salary == null
                const isDiff = diffPlayerIds?.has(e.player.id)
                return (
                  <div
                    key={e.id ?? `${e.player_id}-${pos}`}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs border-b border-gray-100 last:border-0 transition-colors ${
                      isDiff
                        ? side === 'left' ? 'bg-red-50 line-through opacity-60' : 'bg-green-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link
                        to={`/player/${e.player.id}`}
                        className="text-gray-700 truncate hover:text-ucla-blue transition-colors"
                      >
                        {e.player.name}
                      </Link>
                      {isDiff && side === 'right' && <span className="text-green-600 font-semibold flex-shrink-0">+new</span>}
                      {isDiff && side === 'left' && <span className="text-red-500 font-semibold flex-shrink-0">removed</span>}
                    </div>
                    <div className="flex-shrink-0 ml-2 text-right">
                      {noContract ? (
                        <span className="text-gray-400">TBD</span>
                      ) : (
                        <span className={isActual ? 'text-green-600' : 'text-amber-600'}>
                          {fmtShort(salary)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main CompareMode ───────────────────────────────────────────────────────────
export default function CompareMode({ currentEntries, onExit }) {
  const [savedRosters, setSavedRosters] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [selA, setSelA] = useState(CURRENT_KEY)
  const [selB, setSelB] = useState('')
  const [rosterA, setRosterA] = useState(null)
  const [rosterB, setRosterB] = useState(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  useEffect(() => {
    savedRostersApi.getAll()
      .then(res => {
        setSavedRosters(res.data)
        if (res.data.length > 0) setSelB(String(res.data[0].id))
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false))
  }, [])

  // Load roster A
  useEffect(() => {
    if (selA === CURRENT_KEY) {
      setRosterA({ entries: currentEntries, name: 'Current Active Roster' })
      return
    }
    if (!selA) { setRosterA(null); return }
    setLoadingA(true)
    savedRostersApi.get(selA)
      .then(res => setRosterA({ entries: res.data.entries, name: res.data.name }))
      .catch(() => setRosterA(null))
      .finally(() => setLoadingA(false))
  }, [selA, currentEntries])

  // Load roster B
  useEffect(() => {
    if (selB === CURRENT_KEY) {
      setRosterB({ entries: currentEntries, name: 'Current Active Roster' })
      return
    }
    if (!selB) { setRosterB(null); return }
    setLoadingB(true)
    savedRostersApi.get(selB)
      .then(res => setRosterB({ entries: res.data.entries, name: res.data.name }))
      .catch(() => setRosterB(null))
      .finally(() => setLoadingB(false))
  }, [selB, currentEntries])

  // Compute delta
  const entriesA = rosterA?.entries ?? []
  const entriesB = rosterB?.entries ?? []
  const idsA = useMemo(() => new Set(entriesA.map(e => e.player.id)), [entriesA])
  const idsB = useMemo(() => new Set(entriesB.map(e => e.player.id)), [entriesB])
  const onlyInA = useMemo(() => { const s = new Set(); entriesA.forEach(e => { if (!idsB.has(e.player.id)) s.add(e.player.id) }); return s }, [entriesA, idsB])
  const onlyInB = useMemo(() => { const s = new Set(); entriesB.forEach(e => { if (!idsA.has(e.player.id)) s.add(e.player.id) }); return s }, [entriesB, idsA])

  const totalA = useMemo(() => entriesA.reduce((s, e) => s + getEffectiveSalary(e.player), 0), [entriesA])
  const totalB = useMemo(() => entriesB.reduce((s, e) => s + getEffectiveSalary(e.player), 0), [entriesB])
  const capDelta = totalB - totalA

  const affectedPositions = useMemo(() => {
    const pos = new Set()
    const diff = [...onlyInA, ...onlyInB]
    diff.forEach(pid => {
      const e = [...entriesA, ...entriesB].find(e => e.player.id === pid)
      if (e) pos.add(e.depth_chart_position)
    })
    return [...pos]
  }, [onlyInA, onlyInB, entriesA, entriesB])

  const rosterOptions = [
    { value: CURRENT_KEY, label: 'Current Active Roster' },
    ...savedRosters.map(r => ({ value: String(r.id), label: r.name })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Control bar ── */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0 flex-wrap gap-y-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compare Rosters</span>

        {/* Roster A picker */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
          <select
            className="input py-1.5 text-xs w-48"
            value={selA}
            onChange={e => setSelA(e.target.value)}
          >
            <option value="">— Select Roster A —</option>
            {rosterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <span className="text-gray-300 font-bold">vs</span>

        {/* Roster B picker */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ucla-blue flex-shrink-0" />
          <select
            className="input py-1.5 text-xs w-48"
            value={selB}
            onChange={e => setSelB(e.target.value)}
            disabled={loadingSaved}
          >
            <option value="">— Select Roster B —</option>
            {rosterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Delta summary */}
        {rosterA && rosterB && (
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Cap Δ</span>
              <span className={`text-sm font-bold font-mono tabular-nums ${
                capDelta > 0 ? 'text-red-600' : capDelta < 0 ? 'text-green-600' : 'text-gray-500'
              }`}>
                {capDelta > 0 ? '+' : ''}{fmtShort(capDelta)}
              </span>
            </div>
            {onlyInB.size > 0 && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                +{onlyInB.size} added
              </span>
            )}
            {onlyInA.size > 0 && (
              <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                −{onlyInA.size} removed
              </span>
            )}
            {affectedPositions.length > 0 && (
              <span className="text-xs text-gray-400">
                {affectedPositions.join(', ')} affected
              </span>
            )}
          </div>
        )}

        <button onClick={onExit} className="btn-ghost text-xs px-3 py-1.5 ml-auto">
          Exit Compare
        </button>
      </div>

      {/* ── Split view ── */}
      {loadingSaved ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : savedRosters.length === 0 && selA === CURRENT_KEY && !selB ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
          <div className="text-3xl">📋</div>
          <p className="text-gray-600 font-medium">No saved rosters yet</p>
          <p className="text-sm text-gray-400">Save your current cap sheet first using the "Save Roster" button.</p>
          <button onClick={onExit} className="btn-ghost mt-2">Exit Compare</button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden divide-x divide-gray-200">
          {/* Left: Roster A */}
          <div className="w-1/2 overflow-hidden flex flex-col">
            {loadingA ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rosterA ? (
              <RosterColumn
                label={rosterA.name}
                entries={rosterA.entries}
                diffPlayerIds={onlyInA}
                side="left"
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-gray-400">Select Roster A</div>
            )}
          </div>

          {/* Right: Roster B */}
          <div className="w-1/2 overflow-hidden flex flex-col">
            {loadingB ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-6 h-6 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rosterB ? (
              <RosterColumn
                label={rosterB.name}
                entries={rosterB.entries}
                diffPlayerIds={onlyInB}
                side="right"
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-gray-400">Select Roster B</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
