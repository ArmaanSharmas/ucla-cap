import { useState, useEffect } from 'react'
import { parseSalary } from '../utils/player'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'EDGE', 'DT', 'LB', 'CB', 'S']
const YEARS = ['Fr', 'So', 'Jr', 'Sr', 'Grad']
const PLAYER_TYPES = ['Roster', 'Portal', 'Recruit', 'Watchlist']
const RATINGS = [1, 2, 3, 4, 5]
const PERF_OPTIONS = ['Outperforming', 'On par', 'Underperforming']
const ASK_OPTIONS = ['Bargain', 'Fair ask', 'Asking too much']

const empty = {
  name: '', school: '', position: '', year: '', height: '', weight: '',
  player_type: '', actual_salary: '', projected_salary: '', coach_rating: '',
  notes: '', flight_risk: '', performance_vs_contract: '', projected_ask_vs_expected_value: '',
  recruiting_status: null, last_contact_date: null, photo_path: null,
}

export default function PlayerModal({ isOpen, onClose, onSave, player }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (player) {
        setForm({
          name: player.name || '',
          school: player.school || '',
          position: player.position || '',
          year: player.year || '',
          height: player.height || '',
          weight: player.weight || '',
          player_type: player.player_type || '',
          actual_salary: player.actual_salary != null ? String(player.actual_salary) : '',
          projected_salary: player.projected_salary != null ? String(player.projected_salary) : '',
          coach_rating: player.coach_rating != null ? String(player.coach_rating) : '',
          notes: player.notes || '',
          flight_risk: player.flight_risk != null ? String(player.flight_risk) : '',
          performance_vs_contract: player.performance_vs_contract || '',
          projected_ask_vs_expected_value: player.projected_ask_vs_expected_value || '',
          recruiting_status: player.recruiting_status ?? null,
          last_contact_date: player.last_contact_date ?? null,
          photo_path: player.photo_path ?? null,
        })
      } else {
        setForm(empty)
      }
      setErrors({})
    }
  }, [isOpen, player])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.school.trim()) e.school = 'School is required'
    if (!form.position) e.position = 'Position is required'
    if (!form.year) e.year = 'Year is required'
    if (!form.player_type) e.player_type = 'Player type is required'
    if (form.coach_rating && (Number(form.coach_rating) < 1 || Number(form.coach_rating) > 5)) {
      e.coach_rating = 'Rating must be 1–5'
    }
    if (form.flight_risk && (Number(form.flight_risk) < 1 || Number(form.flight_risk) > 5)) {
      e.flight_risk = 'Flight risk must be 1–5'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        school: form.school.trim(),
        position: form.position,
        year: form.year,
        height: form.height.trim() || null,
        weight: form.weight ? parseInt(form.weight) : null,
        player_type: form.player_type,
        actual_salary: parseSalary(form.actual_salary),
        projected_salary: parseSalary(form.projected_salary),
        coach_rating: form.coach_rating ? parseInt(form.coach_rating) : null,
        notes: form.notes.trim() || null,
        flight_risk: form.flight_risk ? parseInt(form.flight_risk) : null,
        performance_vs_contract: form.performance_vs_contract || null,
        projected_ask_vs_expected_value: form.projected_ask_vs_expected_value || null,
        recruiting_status: form.recruiting_status || null,
        last_contact_date: form.last_contact_date || null,
        photo_path: form.photo_path || null,
      })
    } finally {
      setSaving(false)
    }
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => { const next = { ...e }; delete next[key]; return next })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2D4A70]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {player ? 'Edit Player' : 'Add Player'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Name + School */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">School *</label>
              <input className="input" value={form.school} onChange={e => set('school', e.target.value)} placeholder="e.g. UCLA" />
              {errors.school && <p className="mt-1 text-xs text-red-500">{errors.school}</p>}
            </div>
          </div>

          {/* Row 2: Position + Year + Player Type */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Position *</label>
              <select className="input" value={form.position} onChange={e => set('position', e.target.value)}>
                <option value="">Select</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Year *</label>
              <select className="input" value={form.year} onChange={e => set('year', e.target.value)}>
                <option value="">Select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Player Type *</label>
              <select className="input" value={form.player_type} onChange={e => set('player_type', e.target.value)}>
                <option value="">Select</option>
                {PLAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.player_type && <p className="mt-1 text-xs text-red-500">{errors.player_type}</p>}
            </div>
          </div>

          {/* Row 3: Height + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Height</label>
              <input className="input" value={form.height} onChange={e => set('height', e.target.value)} placeholder={`6'2"`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Weight (lbs)</label>
              <input className="input" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="215" min={100} max={400} />
            </div>
          </div>

          {/* Row 4: Salaries (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Actual Salary ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input className="input" type="number" value={form.actual_salary} onChange={e => set('actual_salary', e.target.value)}
                placeholder="Leave blank if TBD" min={0} step={1000} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Projected Salary ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input className="input" type="number" value={form.projected_salary} onChange={e => set('projected_salary', e.target.value)}
                placeholder="Leave blank if TBD" min={0} step={1000} />
            </div>
          </div>

          {/* Row 5: Coach Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Coach Rating</label>
            <div className="flex gap-2">
              {RATINGS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('coach_rating', form.coach_rating === String(r) ? '' : String(r))}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    form.coach_rating === String(r)
                      ? 'bg-ucla-gold text-gray-900'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
              {form.coach_rating && (
                <button type="button" onClick={() => set('coach_rating', '')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2">clear</button>
              )}
            </div>
          </div>

          {/* Row 6: Flight Risk */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Flight Risk</label>
            <div className="flex gap-2">
              {RATINGS.map(r => {
                const colors = { 1: 'bg-gray-400', 2: 'bg-ucla-blue', 3: 'bg-ucla-gold', 4: 'bg-orange-500', 5: 'bg-red-500' }
                const labels = { 1: 'No risk', 2: 'Stable', 3: 'Some uncertainty', 4: 'High risk', 5: 'Likely gone' }
                const active = form.flight_risk === String(r)
                return (
                  <button
                    key={r}
                    type="button"
                    title={labels[r]}
                    onClick={() => set('flight_risk', active ? '' : String(r))}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                      active ? `${colors[r]} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                )
              })}
              {form.flight_risk && (
                <button type="button" onClick={() => set('flight_risk', '')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2">clear</button>
              )}
            </div>
            {errors.flight_risk && <p className="mt-1 text-xs text-red-500">{errors.flight_risk}</p>}
          </div>

          {/* Row 7: Performance vs Contract + Projected Ask */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Performance vs Contract</label>
              <select className="input" value={form.performance_vs_contract} onChange={e => set('performance_vs_contract', e.target.value)}>
                <option value="">Select</option>
                {PERF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Projected Ask vs Expected Value</label>
              <select className="input" value={form.projected_ask_vs_expected_value} onChange={e => set('projected_ask_vs_expected_value', e.target.value)}>
                <option value="">Select</option>
                {ASK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Row 8: Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Scouting notes, context..." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : player ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
