import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { playersApi, schoolsApi, API_URL } from '../api/client'
import PlayerModal from '../components/PlayerModal'
import { useToast } from '../context/ToastContext'
import { FLIGHT_RISK_COLORS, FLIGHT_RISK_LABELS, fmtCurrency } from '../utils/player'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'EDGE', 'DT', 'LB', 'CB', 'S']
const PLAYER_TYPES = ['Roster', 'Portal', 'Recruit', 'Watchlist']

const TYPE_STYLES = {
  Roster:    'bg-blue-50 text-blue-700 border border-blue-200',
  Portal:    'bg-amber-50 text-amber-700 border border-amber-200',
  Recruit:   'bg-green-50 text-green-700 border border-green-200',
  Watchlist: 'bg-purple-50 text-purple-700 border border-purple-200',
}

function Stars({ rating }) {
  if (!rating) return <span className="text-gray-300">—</span>
  return (
    <span className="text-base leading-none">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-ucla-gold' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

function FlightDot({ risk }) {
  if (!risk) return <span className="text-gray-300 text-xs">—</span>
  return (
    <div className="flex items-center gap-1.5" title={`${risk} – ${FLIGHT_RISK_LABELS[risk]}`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${FLIGHT_RISK_COLORS[risk]}`} />
      <span className="text-xs text-gray-500">{risk}</span>
    </div>
  )
}

function SortIcon({ active, direction }) {
  if (!active) return (
    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
  return direction === 'asc'
    ? <svg className="w-3.5 h-3.5 text-ucla-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    : <svg className="w-3.5 h-3.5 text-ucla-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
}

function StarToggle({ isWatchlist, onClick }) {
  return (
    <button
      onClick={onClick}
      title={isWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className={`p-1 rounded transition-colors ${
        isWatchlist
          ? 'text-purple-500 hover:text-purple-700'
          : 'text-gray-200 hover:text-purple-400'
      }`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
  )
}

const COLS = [
  { key: 'watchlist',        label: '',             sortable: false },
  { key: 'name',             label: 'Name',         sortable: true },
  { key: 'school',           label: 'School',       sortable: true },
  { key: 'position',         label: 'Pos',          sortable: true },
  { key: 'year',             label: 'Year',         sortable: true },
  { key: 'height',           label: 'Ht',           sortable: false },
  { key: 'weight',           label: 'Wt',           sortable: true },
  { key: 'player_type',      label: 'Type',         sortable: true },
  { key: 'actual_salary',    label: 'Actual $',     sortable: true },
  { key: 'projected_salary', label: 'Projected $',  sortable: true },
  { key: 'flight_risk',      label: 'Flight Risk',  sortable: true },
  { key: 'coach_rating',     label: 'Rating',       sortable: true },
  { key: 'actions',          label: '',             sortable: false },
]

function getVal(player, key) {
  const v = player[key]
  if (v == null) return -Infinity
  if (typeof v === 'string') return v.toLowerCase()
  return Number(v)
}

export default function PlayerPool() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ position: '', player_type: '', school: '', search: '' })
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [pendingCreate, setPendingCreate] = useState(null)

  async function fetchPlayers() {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filters.position) params.position = filters.position
      if (filters.player_type) params.player_type = filters.player_type
      if (filters.school) params.school = filters.school
      if (filters.search) params.search = filters.search
      const res = await playersApi.getAll(params)
      if (Array.isArray(res?.data)) setPlayers(res.data)
    } catch {
      setError('Failed to load players. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [filters])

  useEffect(() => {
    schoolsApi.getAll().then(r => {
      if (Array.isArray(r?.data)) setSchools(r.data)
    }).catch(() => {})
  }, [])

  const sorted = useMemo(() => {
    if (!sort.key) return players
    return [...players].sort((a, b) => {
      const av = getVal(a, sort.key)
      const bv = getVal(b, sort.key)
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [players, sort])

  function toggleSort(key) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  async function doCreate(data) {
    await playersApi.create(data)
    setModalOpen(false)
    setEditingPlayer(null)
    setPendingCreate(null)
    fetchPlayers()
    toast.success(`${data.name} added to player pool`)
  }

  async function handleSave(data) {
    if (editingPlayer) {
      await playersApi.update(editingPlayer.id, data)
      setModalOpen(false)
      setEditingPlayer(null)
      fetchPlayers()
      toast.success('Player updated')
      return
    }
    // Duplicate check: same name + school (case-insensitive)
    const duplicate = players.find(
      p => p.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
           p.school.trim().toLowerCase() === data.school.trim().toLowerCase()
    )
    if (duplicate) {
      setPendingCreate(data)
      return
    }
    await doCreate(data)
  }

  async function handleDelete(id) {
    try {
      await playersApi.delete(id)
      setDeleteId(null)
      fetchPlayers()
      toast.success('Player deleted')
    } catch {
      toast.error('Failed to delete player')
    }
  }

  async function handleWatchlistToggle(player) {
    const newType = player.player_type === 'Watchlist' ? 'Roster' : 'Watchlist'
    try {
      await playersApi.update(player.id, {
        name: player.name,
        school: player.school,
        position: player.position,
        year: player.year,
        height: player.height ?? null,
        weight: player.weight ?? null,
        player_type: newType,
        actual_salary: player.actual_salary ?? null,
        projected_salary: player.projected_salary ?? null,
        coach_rating: player.coach_rating ?? null,
        notes: player.notes ?? null,
        flight_risk: player.flight_risk ?? null,
        performance_vs_contract: player.performance_vs_contract ?? null,
        projected_ask_vs_expected_value: player.projected_ask_vs_expected_value ?? null,
        recruiting_status: player.recruiting_status ?? null,
        last_contact_date: player.last_contact_date ?? null,
        photo_path: player.photo_path ?? null,
      })
      fetchPlayers()
    } catch {
      toast.error('Failed to update watchlist')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Player Pool</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${players.length} player${players.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditingPlayer(null); setModalOpen(true) }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Player
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-8 py-3.5 border-b border-gray-200 dark:border-[#2D4A70] bg-white dark:bg-[#1A2840] flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9 w-52"
            placeholder="Search by name…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
        <select className="input w-36" value={filters.position} onChange={e => setFilter('position', e.target.value)}>
          <option value="">All Positions</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-36" value={filters.player_type} onChange={e => setFilter('player_type', e.target.value)}>
          <option value="">All Types</option>
          {PLAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input w-44" value={filters.school} onChange={e => setFilter('school', e.target.value)}>
          <option value="">All Schools</option>
          {schools.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        {(filters.position || filters.player_type || filters.school || filters.search) && (
          <button
            onClick={() => setFilters({ position: '', player_type: '', school: '', search: '' })}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {error ? (
          <div className="mt-8 text-center">
            <div className="text-red-600 font-medium">{error}</div>
          </div>
        ) : loading ? (
          <div className="mt-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-16 text-center text-gray-400">No players match your filters.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2D4A70] bg-gray-50 dark:bg-[#243554]">
                  {COLS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                      {col.sortable ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          {col.label}
                          <SortIcon active={sort.key === col.key} direction={sort.dir} />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2D4A70]">
                {sorted.map(player => {
                  const hasContract = player.actual_salary != null || player.projected_salary != null
                  const isWatchlist = player.player_type === 'Watchlist'
                  return (
                    <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-3 py-3">
                        <StarToggle isWatchlist={isWatchlist} onClick={() => handleWatchlistToggle(player)} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {player.photo_path && (
                            <img
                              src={`${API_URL}${player.photo_path}`}
                              alt={player.name}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <Link
                            to={`/player/${player.id}`}
                            className="font-medium text-ucla-blue hover:text-ucla-blue-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
                          >
                            {player.name}
                          </Link>
                          {!hasContract && (
                            <span className="text-gray-300 text-xs font-normal" title="Contract TBD">TBD</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {player.photo_path == null && schools.find(s => s.name === player.school)?.logo_path ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`${API_URL}${schools.find(s => s.name === player.school).logo_path}`}
                              alt={player.school}
                              className="w-4 h-4 object-contain"
                            />
                            {player.school}
                          </div>
                        ) : player.school}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold font-mono">
                          {player.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{player.year}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{player.height || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{player.weight || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${TYPE_STYLES[player.player_type] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {player.player_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {player.actual_salary != null
                          ? fmtCurrency(player.actual_salary)
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {player.projected_salary != null
                          ? fmtCurrency(player.projected_salary)
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <FlightDot risk={player.flight_risk} />
                      </td>
                      <td className="px-4 py-3">
                        <Stars rating={player.coach_rating} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingPlayer(player); setModalOpen(true) }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteId(player.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlayerModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPlayer(null) }}
        onSave={handleSave}
        player={editingPlayer}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative card p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Player?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This will permanently remove the player and any cap sheet entry. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate player confirmation */}
      {pendingCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingCreate(null)} />
          <div className="relative card p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Possible Duplicate</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              A player named <span className="font-semibold text-gray-700 dark:text-gray-200">{pendingCreate.name}</span> from <span className="font-semibold text-gray-700 dark:text-gray-200">{pendingCreate.school}</span> already exists. Add anyway?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingCreate(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => doCreate(pendingCreate)} className="btn-primary">Add Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
