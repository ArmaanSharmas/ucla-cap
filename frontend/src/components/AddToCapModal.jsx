import { useState, useEffect, useMemo } from 'react'

const POSITION_GROUPS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S']

function getPositionGroup(position) {
  if (['OT', 'OG', 'C'].includes(position)) return 'OL'
  if (position === 'DT') return 'DL'
  return position
}

function formatCurrency(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

export default function AddToCapModal({ isOpen, onClose, onAdd, availablePlayers }) {
  const [search, setSearch] = useState('')
  const [filterPos, setFilterPos] = useState('')
  const [selected, setSelected] = useState(null)
  const [positionGroup, setPositionGroup] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setFilterPos('')
      setSelected(null)
      setPositionGroup('')
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (selected) {
      setPositionGroup(getPositionGroup(selected.position))
    }
  }, [selected])

  function handleFilterPos(pos) {
    const next = filterPos === pos ? '' : pos
    setFilterPos(next)
    if (next) setPositionGroup(next)
    setSelected(null)
  }

  const filtered = useMemo(() => {
    let list = availablePlayers
    if (filterPos) list = list.filter(p => getPositionGroup(p.position) === filterPos)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.school.toLowerCase().includes(q) ||
             p.position.toLowerCase().includes(q) ||
             getPositionGroup(p.position).toLowerCase().includes(q)
      )
    }
    return list
  }, [search, filterPos, availablePlayers])

  async function handleAdd() {
    if (!selected) { setError('Select a player first'); return }
    if (!positionGroup) { setError('Position group is required'); return }
    setSaving(true)
    setError('')
    try {
      await onAdd({
        player_id: selected.id,
        depth_chart_position: positionGroup,
      })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to add player')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2D4A70]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Player to Cap Sheet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Search Player Pool</label>
            <input
              className="input"
              placeholder="Search by name, school, or position…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              autoFocus
            />
          </div>

          {/* Position filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {POSITION_GROUPS.map(pos => (
              <button
                key={pos}
                onClick={() => handleFilterPos(pos)}
                className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                  filterPos === pos
                    ? 'bg-ucla-blue text-white border-ucla-blue'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-ucla-blue hover:text-ucla-blue'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Player list */}
          {!selected && (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-[#2D4A70] divide-y divide-gray-100 dark:divide-[#2D4A70]">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">No players found</div>
              ) : filtered.map(p => {
                const salary = p.actual_salary ?? p.projected_salary
                const isActual = p.actual_salary != null
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{p.school} · {p.position} · {p.year}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-400">{salary != null ? formatCurrency(salary) : 'TBD'}</div>
                      {salary != null && (
                        <div className={`text-xs ${isActual ? 'text-green-600' : 'text-amber-600'}`}>
                          {isActual ? 'Actual' : 'Projected'}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Selected player card */}
          {selected && (
            <div className="bg-gray-50 dark:bg-[#243554] border border-gray-200 dark:border-[#2D4A70] rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{selected.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selected.school} · {selected.position} · {selected.year}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-700 underline">
                Change
              </button>
            </div>
          )}

          {/* Position group */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Position Group</label>
            <select className="input" value={positionGroup} onChange={e => setPositionGroup(e.target.value)}>
              <option value="">Select</option>
              {POSITION_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !selected} className="btn-primary">
              {saving ? 'Adding…' : 'Add to Cap Sheet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
