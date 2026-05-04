import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { playersApi } from '../api/client'
import { fmtCurrency } from '../utils/player'
import { useToast } from '../context/ToastContext'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'EDGE', 'DT', 'LB', 'CB', 'S']
const PLAYER_TYPES = ['Recruit', 'Portal']
const STATUS_OPTIONS = ['Watch', 'Priority', 'Contacted', 'Offered', 'Committed', 'Lost']
const STATUS_ORDER = { Priority: 0, Contacted: 1, Offered: 2, Watch: 3, Committed: 4, Lost: 5 }

const STATUS_STYLES = {
  Watch:     'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  Priority:  'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  Contacted: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  Offered:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  Committed: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  Lost:      'bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
}

const TYPE_STYLES = {
  Recruit: 'bg-green-50 text-green-700 border border-green-200',
  Portal:  'bg-amber-50 text-amber-700 border border-amber-200',
}

function SortIcon({ active, dir }) {
  if (!active) return (
    <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
  return dir === 'asc'
    ? <svg className="w-3.5 h-3.5 text-ucla-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    : <svg className="w-3.5 h-3.5 text-ucla-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
}

function InlineSelect({ value, options, onChange, styleMap }) {
  const [editing, setEditing] = useState(false)
  if (editing) {
    return (
      <select
        autoFocus
        className="input py-0.5 px-2 h-7 text-xs"
        value={value || ''}
        onBlur={() => setEditing(false)}
        onChange={e => { onChange(e.target.value); setEditing(false) }}
      >
        <option value="">Not set</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold hover:opacity-80 transition-opacity ${
        value ? (styleMap?.[value] || 'bg-gray-100 text-gray-600 border border-gray-200') : 'bg-gray-100 text-gray-400 border border-dashed border-gray-300'
      }`}
    >
      {value || 'Set status'}
    </button>
  )
}

function fmtDate(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InlineDateInput({ value, onChange }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input
        autoFocus
        type="date"
        className="input py-0.5 px-2 h-7 text-xs w-36"
        value={value || ''}
        onChange={e => { onChange(e.target.value || null); setEditing(false) }}
        onBlur={() => setEditing(false)}
      />
    )
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
    >
      {value ? fmtDate(value) : <span className="text-gray-300 dark:text-gray-600">—</span>}
    </button>
  )
}

function getVal(player, key) {
  if (key === 'recruiting_status') {
    return STATUS_ORDER[player.recruiting_status] ?? 99
  }
  const v = player[key]
  if (v == null) return -Infinity
  if (typeof v === 'string') return v.toLowerCase()
  return Number(v)
}

export default function Recruiting() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ position: '', player_type: '', status: '', search: '' })
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  async function fetchPlayers() {
    try {
      setLoading(true)
      const params = {}
      if (filters.player_type) params.player_type = filters.player_type
      if (filters.position) params.position = filters.position
      if (filters.search) params.search = filters.search
      let results
      if (filters.player_type) {
        const res = await playersApi.getAll(params)
        results = Array.isArray(res?.data) ? res.data : []
      } else {
        const [recruitRes, portalRes] = await Promise.all([
          playersApi.getAll({ ...params, player_type: 'Recruit' }),
          playersApi.getAll({ ...params, player_type: 'Portal' }),
        ])
        results = [...(Array.isArray(recruitRes?.data) ? recruitRes.data : []), ...(Array.isArray(portalRes?.data) ? portalRes.data : [])]
      }
      setPlayers(results)
    } catch {
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [filters.position, filters.player_type, filters.search])

  const sorted = useMemo(() => {
    let list = filters.status
      ? players.filter(p => p.recruiting_status === filters.status)
      : players
    return [...list].sort((a, b) => {
      const av = getVal(a, sort.key)
      const bv = getVal(b, sort.key)
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [players, filters.status, sort])

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  function toggleSort(key) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
  }

  async function updatePlayer(player, changes) {
    try {
      await playersApi.update(player.id, {
        name: player.name,
        school: player.school,
        position: player.position,
        year: player.year,
        height: player.height ?? null,
        weight: player.weight ?? null,
        player_type: player.player_type,
        actual_salary: player.actual_salary ?? null,
        projected_salary: player.projected_salary ?? null,
        coach_rating: player.coach_rating ?? null,
        notes: player.notes ?? null,
        flight_risk: player.flight_risk ?? null,
        performance_vs_contract: player.performance_vs_contract ?? null,
        projected_ask_vs_expected_value: player.projected_ask_vs_expected_value ?? null,
        photo_path: player.photo_path ?? null,
        ...changes,
      })
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, ...changes } : p))
    } catch {
      toast.error('Failed to save')
    }
  }

  const COLS = [
    { key: 'name',              label: 'Name',         sortable: true },
    { key: 'position',          label: 'Pos',          sortable: true },
    { key: 'school',            label: 'School',       sortable: true },
    { key: 'year',              label: 'Year',         sortable: true },
    { key: 'player_type',       label: 'Type',         sortable: true },
    { key: 'recruiting_status', label: 'Status',       sortable: true },
    { key: 'coach_rating',      label: 'Rating',       sortable: true },
    { key: 'projected_salary',  label: 'Projected $',  sortable: true },
    { key: 'last_contact_date', label: 'Last Contact', sortable: true },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recruiting Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${sorted.length} target${sorted.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-8 py-3.5 border-b border-gray-200 dark:border-[#2D4A70] bg-white dark:bg-[#1A2840] flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9 w-48"
            placeholder="Search by name…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
        <select className="input w-36" value={filters.position} onChange={e => setFilter('position', e.target.value)}>
          <option value="">All Positions</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-32" value={filters.player_type} onChange={e => setFilter('player_type', e.target.value)}>
          <option value="">All Types</option>
          {PLAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input w-36" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filters.position || filters.player_type || filters.status || filters.search) && (
          <button
            onClick={() => setFilters({ position: '', player_type: '', status: '', search: '' })}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="mt-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-16 text-center text-gray-400">No recruits or portal targets found.</div>
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
                          <SortIcon active={sort.key === col.key} dir={sort.dir} />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2D4A70]">
                {sorted.map(player => (
                  <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/player/${player.id}`}
                        className="font-medium text-ucla-blue hover:underline dark:text-blue-400"
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold font-mono">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{player.school}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{player.year}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${TYPE_STYLES[player.player_type] || ''}`}>
                        {player.player_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <InlineSelect
                        value={player.recruiting_status}
                        options={STATUS_OPTIONS}
                        styleMap={STATUS_STYLES}
                        onChange={val => updatePlayer(player, { recruiting_status: val || null })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {player.coach_rating ? (
                        <span className="text-amber-500 font-semibold">{player.coach_rating}★</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {player.projected_salary != null
                        ? fmtCurrency(player.projected_salary)
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <InlineDateInput
                        value={player.last_contact_date}
                        onChange={val => updatePlayer(player, { last_contact_date: val || null })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
