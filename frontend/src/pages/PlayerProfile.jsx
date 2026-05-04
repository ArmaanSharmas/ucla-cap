import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { playersApi, capSheetApi, API_URL } from '../api/client'
import { useToast } from '../context/ToastContext'
import {
  getRetentionRec, parseSalary, fmtCurrency,
  FLIGHT_RISK_COLORS, FLIGHT_RISK_LABELS, RETENTION_STYLES,
} from '../utils/player'

const POSITION_GROUPS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S']
function getPositionGroup(pos) {
  if (['OT', 'OG', 'C'].includes(pos)) return 'OL'
  if (pos === 'DT') return 'DL'
  return pos
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'EDGE', 'DT', 'LB', 'CB', 'S']
const YEARS = ['Fr', 'So', 'Jr', 'Sr', 'Grad']
const PLAYER_TYPES = ['Roster', 'Portal', 'Recruit', 'Watchlist']
const PERF_OPTIONS = ['Outperforming', 'On par', 'Underperforming']
const ASK_OPTIONS = ['Bargain', 'Fair ask', 'Asking too much']
const RATINGS = [1, 2, 3, 4, 5]

const PERF_COLORS = {
  Outperforming: 'text-green-700 bg-green-50 border-green-200',
  'On par':       'text-blue-700 bg-blue-50 border-blue-200',
  Underperforming: 'text-red-700 bg-red-50 border-red-200',
}

const ASK_COLORS = {
  Bargain:          'text-green-700 bg-green-50 border-green-200',
  'Fair ask':       'text-amber-700 bg-amber-50 border-amber-200',
  'Asking too much':'text-red-700 bg-red-50 border-red-200',
}

const TYPE_COLORS = {
  Roster:    'text-blue-700 bg-blue-50 border-blue-200',
  Portal:    'text-amber-700 bg-amber-50 border-amber-200',
  Recruit:   'text-green-700 bg-green-50 border-green-200',
  Watchlist: 'text-purple-700 bg-purple-50 border-purple-200',
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  )
}

function Stars({ rating, onChange }) {
  return (
    <div className="flex gap-1">
      {RATINGS.map(r => (
        <button
          key={r}
          type="button"
          onClick={onChange ? () => onChange(r) : undefined}
          className={`text-xl leading-none transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
            r <= (rating || 0) ? 'text-ucla-gold' : 'text-gray-200'
          }`}
        >★</button>
      ))}
    </div>
  )
}

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [onCapSheet, setOnCapSheet] = useState(false)
  const [addToCapOpen, setAddToCapOpen] = useState(false)
  const [capPos, setCapPos] = useState('')
  const [capNum, setCapNum] = useState(1)
  const [addingToCap, setAddingToCap] = useState(false)

  async function fetchPlayer() {
    try {
      setLoading(true)
      setError(null)
      const res = await playersApi.get(id)
      setPlayer(res.data)
    } catch {
      setError('Player not found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayer() }, [id])

  useEffect(() => {
    capSheetApi.getAll().then(res => {
      setOnCapSheet(res.data.some(e => e.player?.id === parseInt(id)))
    }).catch(() => {})
  }, [id])

  function enterEdit() {
    setForm({
      name: player.name || '',
      school: player.school || '',
      position: player.position || '',
      year: player.year || '',
      height: player.height || '',
      weight: player.weight != null ? String(player.weight) : '',
      player_type: player.player_type || '',
      actual_salary: player.actual_salary != null ? String(player.actual_salary) : '',
      projected_salary: player.projected_salary != null ? String(player.projected_salary) : '',
      coach_rating: player.coach_rating != null ? player.coach_rating : null,
      notes: player.notes || '',
      flight_risk: player.flight_risk != null ? player.flight_risk : null,
      performance_vs_contract: player.performance_vs_contract || '',
      projected_ask_vs_expected_value: player.projected_ask_vs_expected_value || '',
      recruiting_status: player.recruiting_status ?? null,
      last_contact_date: player.last_contact_date ?? null,
      photo_path: player.photo_path ?? null,
    })
    setSaveError(null)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setSaveError(null)
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.school?.trim() || !form.position || !form.year || !form.player_type) {
      setSaveError('Name, School, Position, Year, and Player Type are required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await playersApi.update(id, {
        name: form.name.trim(),
        school: form.school.trim(),
        position: form.position,
        year: form.year,
        height: form.height?.trim() || null,
        weight: form.weight ? parseInt(form.weight) : null,
        player_type: form.player_type,
        actual_salary: parseSalary(form.actual_salary),
        projected_salary: parseSalary(form.projected_salary),
        coach_rating: form.coach_rating || null,
        notes: form.notes?.trim() || null,
        flight_risk: form.flight_risk || null,
        performance_vs_contract: form.performance_vs_contract || null,
        projected_ask_vs_expected_value: form.projected_ask_vs_expected_value || null,
        recruiting_status: form.recruiting_status || null,
        last_contact_date: form.last_contact_date || null,
        photo_path: form.photo_path || null,
      })
      await fetchPlayer()
      setEditMode(false)
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function setF(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">{error || 'Player not found.'}</p>
        <Link to="/" className="btn-primary">Back to Player Pool</Link>
      </div>
    )
  }

  const rec = getRetentionRec(player)
  const recStyle = rec ? RETENTION_STYLES[rec] : null
  const hasContract = player.actual_salary != null || player.projected_salary != null

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await playersApi.uploadPhoto(id, fd)
      setPlayer(res.data)
      setForm(f => ({ ...f, photo_path: res.data.photo_path }))
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await playersApi.delete(id)
      toast.success(`${player.name} removed from player pool`)
      navigate('/')
    } catch {
      toast.error('Failed to delete player')
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  async function handleAddToCap() {
    if (!capPos) return
    setAddingToCap(true)
    try {
      await capSheetApi.add({ player_id: parseInt(id), depth_chart_position: capPos, string_number: capNum })
      setOnCapSheet(true)
      setAddToCapOpen(false)
      toast.success(`${player.name} added to cap sheet`)
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to add to cap sheet')
    } finally {
      setAddingToCap(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Player Pool
      </Link>

      {/* ── Identity card ── */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editMode ? (
              <input
                className="input text-2xl font-bold mb-1 py-1 text-gray-900"
                value={form.name}
                onChange={e => setF('name', e.target.value)}
                placeholder="Player name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{player.name}</h1>
            )}

            {editMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Position *</label>
                  <select className="input" value={form.position} onChange={e => setF('position', e.target.value)}>
                    <option value="">Select</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year *</label>
                  <select className="input" value={form.year} onChange={e => setF('year', e.target.value)}>
                    <option value="">Select</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">School *</label>
                  <input className="input" value={form.school} onChange={e => setF('school', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Height</label>
                  <input className="input" value={form.height} onChange={e => setF('height', e.target.value)} placeholder="6'2&quot;" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Weight (lbs)</label>
                  <input className="input" type="number" value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="215" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold font-mono">{player.position}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 dark:text-gray-300 text-sm">{player.year}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 dark:text-gray-300 text-sm">{player.school}</span>
                {player.height && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400 text-sm">{player.height}</span></>}
                {player.weight && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400 text-sm">{player.weight} lbs</span></>}
              </div>
            )}
          </div>

          {/* Photo + edit buttons */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            {/* Photo avatar */}
            <div className="relative group/photo">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {player.photo_path ? (
                  <img
                    src={`${API_URL}${player.photo_path}`}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
              >
                {uploading ? '…' : 'Change'}
              </button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Edit / Save / Cancel / Delete / Add to Cap */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {editMode ? (
                <>
                  <button onClick={cancelEdit} className="btn-ghost" disabled={saving}>Cancel</button>
                  <button onClick={handleSave} className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={enterEdit} className="btn-ghost">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {onCapSheet ? (
                    <span className="text-xs text-gray-400 px-2">On Cap Sheet</span>
                  ) : (
                    <button onClick={() => { setCapPos(getPositionGroup(player.position)); setCapNum(1); setAddToCapOpen(true) }} className="btn-primary text-xs px-3 py-1.5">
                      + Cap Sheet
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirmOpen(true)} className="btn-danger text-xs px-3 py-1.5">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}
      </div>

      {/* ── Contract Info ── */}
      <div className="card mb-4">
        <div className="px-6 pt-4 pb-1">
          <span className="section-label">Contract Info</span>
        </div>
        <div className="px-6 pb-4">
          <InfoRow label="Actual Salary">
            {editMode ? (
              <input className="input" type="number" value={form.actual_salary}
                onChange={e => setF('actual_salary', e.target.value)} placeholder="Leave blank if TBD" min={0} step={1000} />
            ) : (
              player.actual_salary != null
                ? <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(player.actual_salary)}</span>
                : <span className="text-gray-400 italic">Not set</span>
            )}
          </InfoRow>
          <InfoRow label="Projected Salary">
            {editMode ? (
              <input className="input" type="number" value={form.projected_salary}
                onChange={e => setF('projected_salary', e.target.value)} placeholder="Leave blank if TBD" min={0} step={1000} />
            ) : (
              player.projected_salary != null
                ? <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(player.projected_salary)}</span>
                : <span className="text-gray-400 italic">Not set</span>
            )}
          </InfoRow>
          {!hasContract && !editMode && (
            <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              Contract TBD — no salary info entered
            </div>
          )}
          <InfoRow label="Player Type">
            {editMode ? (
              <select className="input" value={form.player_type} onChange={e => setF('player_type', e.target.value)}>
                <option value="">Select</option>
                {PLAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <span className={`badge border ${TYPE_COLORS[player.player_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {player.player_type}
              </span>
            )}
          </InfoRow>
        </div>
      </div>

      {/* ── Evaluation ── */}
      <div className="card mb-4">
        <div className="px-6 pt-4 pb-1">
          <span className="section-label">Evaluation</span>
        </div>
        <div className="px-6 pb-4">
          <InfoRow label="Coach Rating">
            {editMode ? (
              <Stars rating={form.coach_rating} onChange={r => setF('coach_rating', form.coach_rating === r ? null : r)} />
            ) : (
              player.coach_rating
                ? <Stars rating={player.coach_rating} />
                : <span className="text-gray-400">—</span>
            )}
          </InfoRow>
          <InfoRow label="Flight Risk">
            {editMode ? (
              <div className="flex gap-2">
                {RATINGS.map(r => {
                  const dotColors = ['', 'bg-gray-400', 'bg-ucla-blue', 'bg-ucla-gold', 'bg-orange-500', 'bg-red-500']
                  const active = form.flight_risk === r
                  return (
                    <button
                      key={r}
                      type="button"
                      title={FLIGHT_RISK_LABELS[r]}
                      onClick={() => setF('flight_risk', active ? null : r)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                        active ? `${dotColors[r]} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
                {form.flight_risk && (
                  <button type="button" onClick={() => setF('flight_risk', null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2">clear</button>
                )}
              </div>
            ) : player.flight_risk ? (
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${FLIGHT_RISK_COLORS[player.flight_risk]}`} />
                <span className="font-medium">{player.flight_risk}</span>
                <span className="text-gray-500">— {FLIGHT_RISK_LABELS[player.flight_risk]}</span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </InfoRow>
          <InfoRow label="Performance vs Contract">
            {editMode ? (
              <select className="input" value={form.performance_vs_contract} onChange={e => setF('performance_vs_contract', e.target.value)}>
                <option value="">Not set</option>
                {PERF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : player.performance_vs_contract ? (
              <span className={`badge border ${PERF_COLORS[player.performance_vs_contract] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {player.performance_vs_contract}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </InfoRow>
          <InfoRow label="Projected Ask vs Expected Value">
            {editMode ? (
              <select className="input" value={form.projected_ask_vs_expected_value} onChange={e => setF('projected_ask_vs_expected_value', e.target.value)}>
                <option value="">Not set</option>
                {ASK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : player.projected_ask_vs_expected_value ? (
              <span className={`badge border ${ASK_COLORS[player.projected_ask_vs_expected_value] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {player.projected_ask_vs_expected_value}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </InfoRow>
          <InfoRow label="Notes">
            {editMode ? (
              <textarea className="input resize-none" rows={3} value={form.notes}
                onChange={e => setF('notes', e.target.value)} placeholder="Scouting notes, context..." />
            ) : (
              player.notes
                ? <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{player.notes}</p>
                : <span className="text-gray-400">—</span>
            )}
          </InfoRow>
        </div>
      </div>

      {/* ── Retention Recommendation ── */}
      <div className="card p-6">
        <span className="section-label block mb-3">Retention Recommendation</span>
        {rec ? (
          <div className="flex items-center gap-3">
            <span className={`text-base font-bold px-4 py-2 rounded-lg border ${recStyle.badge}`}>
              {rec}
            </span>
            <span className="text-sm text-gray-500">
              {rec === 'Priority Retain' && 'Bargain contract + high flight risk — act now.'}
              {rec === 'Secure' && 'Bargain contract + stable — retain comfortably.'}
              {rec === 'Negotiate' && 'Fair ask but significant flight risk — negotiate soon.'}
              {rec === 'Let Walk' && 'Asking too much relative to expected value.'}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Set Flight Risk and Projected Ask to generate a recommendation.
          </p>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative card p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete {player.name}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This permanently removes the player from the pool. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmOpen(false)} className="btn-ghost" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add to Cap Sheet modal ── */}
      {addToCapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddToCapOpen(false)} />
          <div className="relative card p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add to Cap Sheet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{player.name} · {player.position} · {player.year}</p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Position Group</label>
                <select className="input" value={capPos} onChange={e => setCapPos(e.target.value)}>
                  <option value="">Select</option>
                  {POSITION_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Depth Chart #</label>
                <input
                  className="input"
                  type="number"
                  min={1} max={20}
                  value={capNum}
                  onChange={e => setCapNum(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAddToCapOpen(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleAddToCap} disabled={addingToCap || !capPos} className="btn-primary">
                {addingToCap ? 'Adding…' : 'Add to Cap Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
