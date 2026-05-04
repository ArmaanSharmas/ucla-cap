import { useState, useEffect } from 'react'
import { savedRostersApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fmtShort } from '../utils/player'
import { COLORS } from '../components/capsheet/PositionCard'

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtSalary(v) {
  if (v == null) return null
  return fmtShort(v)
}

// ── Roster preview modal ────────────────────────────────────────────────────
function PreviewModal({ roster, onClose }) {
  if (!roster) return null

  // Group entries by position
  const byPos = {}
  for (const e of roster.entries || []) {
    const pos = e.depth_chart_position
    if (!byPos[pos]) byPos[pos] = []
    byPos[pos].push(e)
  }
  for (const pos of Object.keys(byPos)) {
    byPos[pos].sort((a, b) => a.string_number - b.string_number)
  }
  const positions = Object.keys(byPos)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2D4A70] flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{roster.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{roster.entries?.length ?? 0} players · Saved {fmt(roster.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {positions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No players in this roster.</p>
          ) : positions.map(pos => {
            const c = COLORS[pos] || COLORS.QB
            return (
              <div key={pos}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.text}`}>{pos}</div>
                <div className="space-y-1">
                  {byPos[pos].map(e => {
                    const p = e.player
                    const salary = p?.actual_salary ?? p?.projected_salary
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-xs text-gray-300 dark:text-gray-600 w-4 tabular-nums">{e.string_number}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{p?.name ?? '—'}</span>
                        <span className="text-xs text-gray-400">{p?.school}</span>
                        <span className="text-xs text-gray-400">{p?.year}</span>
                        {salary != null && (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 tabular-nums">{fmtSalary(salary)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2D4A70] flex-shrink-0">
          <button onClick={onClose} className="btn-ghost w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SavedRosters() {
  const toast = useToast()
  const [rosters, setRosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [previewRoster, setPreviewRoster] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  async function fetchRosters() {
    try {
      setLoading(true)
      setError(null)
      const res = await savedRostersApi.getAll()
      setRosters(res.data)
    } catch {
      setError('Failed to load saved rosters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRosters() }, [])

  async function handlePreview(id) {
    setPreviewLoading(true)
    try {
      const res = await savedRostersApi.get(id)
      setPreviewRoster(res.data)
    } catch {
      toast.error('Failed to load roster preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  function startRename(roster) {
    setRenamingId(roster.id)
    setRenameValue(roster.name)
  }

  async function handleRename(id) {
    if (!renameValue.trim()) return
    try {
      await savedRostersApi.rename(id, { name: renameValue.trim() })
      setRenamingId(null)
      fetchRosters()
      toast.success('Roster renamed')
    } catch {
      toast.error('Failed to rename roster')
    }
  }

  async function handleDelete(id) {
    try {
      await savedRostersApi.delete(id)
      setDeleteId(null)
      fetchRosters()
      toast.success('Roster deleted')
    } catch {
      toast.error('Failed to delete roster')
    }
  }

  async function handleLoad(id) {
    setLoadingId(id)
    try {
      const res = await savedRostersApi.load(id)
      const skipped = res.data?.skipped_count ?? 0
      if (skipped > 0) {
        toast.warning(`Roster loaded — ${skipped} player${skipped !== 1 ? 's' : ''} were deleted and could not be restored`)
      } else {
        toast.success('Roster loaded as active cap sheet')
      }
    } catch {
      toast.error('Failed to load roster')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved Rosters</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${rosters.length} saved roster${rosters.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : loading ? (
          <div className="flex justify-center mt-16">
            <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rosters.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No saved rosters yet</h2>
            <p className="text-sm text-gray-400">Go to the Cap Sheet and click "Save Roster" to snapshot your current roster.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {rosters.map(roster => (
              <div key={roster.id} className="card p-4 flex items-center gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-ucla-blue/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ucla-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  {renamingId === roster.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="input py-1 text-sm flex-1 max-w-xs"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(roster.id); if (e.key === 'Escape') setRenamingId(null) }}
                        autoFocus
                      />
                      <button onClick={() => handleRename(roster.id)} className="btn-primary text-xs px-3 py-1.5">Save</button>
                      <button onClick={() => setRenamingId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{roster.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {roster.entry_count} players · Saved {fmt(roster.created_at)}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {renamingId !== roster.id && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(roster.id)}
                      disabled={previewLoading}
                      className="btn-ghost text-xs px-3 py-1.5"
                      title="Preview roster contents"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleLoad(roster.id)}
                      disabled={loadingId === roster.id}
                      className="btn-primary text-xs px-3 py-1.5"
                      title="Replace current cap sheet with this roster"
                    >
                      {loadingId === roster.id ? 'Loading…' : 'Load'}
                    </button>
                    <button onClick={() => startRename(roster)} className="btn-ghost text-xs px-3 py-1.5">Rename</button>
                    <button onClick={() => setDeleteId(roster.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewRoster && <PreviewModal roster={previewRoster} onClose={() => setPreviewRoster(null)} />}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative card p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Roster?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This will permanently remove the saved roster. The active cap sheet is not affected.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
