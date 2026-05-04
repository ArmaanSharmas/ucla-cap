import { Link } from 'react-router-dom'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getRetentionRec, FLIGHT_RISK_COLORS, RETENTION_STYLES, fmtShort } from '../../utils/player'
import { API_URL } from '../../api/client'

export const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S']

export const COLORS = {
  QB:   { bg: 'bg-[#EFF6FF] dark:bg-blue-950/30',   border: 'border-[#BFDBFE] dark:border-blue-800/40',   text: 'text-[#003B5C] dark:text-blue-300',   bar: 'bg-[#003B5C] dark:bg-blue-600',   hdr: 'bg-[#EFF6FF] dark:bg-blue-950/20',  hex: '#003B5C' },
  RB:   { bg: 'bg-[#EFF6FF] dark:bg-blue-900/20',   border: 'border-[#93C5FD] dark:border-blue-700/40',   text: 'text-[#2D68C4] dark:text-blue-400',   bar: 'bg-[#2D68C4] dark:bg-blue-500',   hdr: 'bg-[#EFF6FF] dark:bg-blue-900/10',  hex: '#2D68C4' },
  WR:   { bg: 'bg-[#E0F2FE] dark:bg-sky-950/30',    border: 'border-[#7DD3FC] dark:border-sky-800/40',    text: 'text-[#0284C7] dark:text-sky-300',    bar: 'bg-[#0284C7] dark:bg-sky-600',    hdr: 'bg-[#E0F2FE] dark:bg-sky-950/20',   hex: '#0284C7' },
  TE:   { bg: 'bg-[#FFF7ED] dark:bg-amber-950/30',  border: 'border-[#FED7AA] dark:border-amber-800/40',  text: 'text-[#D97706] dark:text-amber-400',  bar: 'bg-[#D97706] dark:bg-amber-600',  hdr: 'bg-[#FFF7ED] dark:bg-amber-950/20', hex: '#D97706' },
  OL:   { bg: 'bg-[#FEFCE8] dark:bg-yellow-950/30', border: 'border-[#FDE68A] dark:border-yellow-800/40', text: 'text-[#B45309] dark:text-yellow-400', bar: 'bg-[#F59E0B] dark:bg-yellow-600', hdr: 'bg-[#FEFCE8] dark:bg-yellow-950/20', hex: '#F59E0B' },
  DL:   { bg: 'bg-[#F8FAFC] dark:bg-slate-800/40',  border: 'border-[#CBD5E1] dark:border-slate-600/40',  text: 'text-[#475569] dark:text-slate-300',  bar: 'bg-[#475569] dark:bg-slate-500',  hdr: 'bg-[#F8FAFC] dark:bg-slate-800/20', hex: '#475569' },
  EDGE: { bg: 'bg-[#F1F5F9] dark:bg-slate-800/50',  border: 'border-[#B2BEC9] dark:border-slate-600/50',  text: 'text-[#1E293B] dark:text-slate-200',  bar: 'bg-[#1E293B] dark:bg-slate-400',  hdr: 'bg-[#F1F5F9] dark:bg-slate-800/30', hex: '#1E293B' },
  LB:   { bg: 'bg-[#F9FAFB] dark:bg-gray-800/40',   border: 'border-[#D1D5DB] dark:border-gray-600/40',   text: 'text-[#4B5563] dark:text-gray-300',   bar: 'bg-[#4B5563] dark:bg-gray-500',   hdr: 'bg-[#F9FAFB] dark:bg-gray-800/20',  hex: '#4B5563' },
  CB:   { bg: 'bg-[#ECFEFF] dark:bg-cyan-950/30',   border: 'border-[#A5F3FC] dark:border-cyan-800/40',   text: 'text-[#0891B2] dark:text-cyan-300',   bar: 'bg-[#0EA5E9] dark:bg-cyan-500',   hdr: 'bg-[#ECFEFF] dark:bg-cyan-950/20',  hex: '#0EA5E9' },
  S:    { bg: 'bg-[#FFFBEB] dark:bg-amber-950/20',  border: 'border-[#FDE68A] dark:border-amber-700/30',  text: 'text-[#92680B] dark:text-amber-300',  bar: 'bg-[#F2A900] dark:bg-amber-500',  hdr: 'bg-[#FFFBEB] dark:bg-amber-950/10', hex: '#F2A900' },
}

export function getEffectiveSalary(player) {
  if (player.actual_salary != null) return Number(player.actual_salary)
  if (player.projected_salary != null) return Number(player.projected_salary)
  return 0
}

function hasContract(player) {
  return player.actual_salary != null || player.projected_salary != null
}

function GripIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="3.5" r="1.3" /><circle cx="5" cy="8" r="1.3" /><circle cx="5" cy="12.5" r="1.3" />
      <circle cx="11" cy="3.5" r="1.3" /><circle cx="11" cy="8" r="1.3" /><circle cx="11" cy="12.5" r="1.3" />
    </svg>
  )
}

// ── Player row (pure UI) ──────────────────────────────────────────────────────
function PlayerRowContent({ entry, onRemove, dragListeners }) {
  const { player } = entry
  const salary = getEffectiveSalary(player)
  const isActual = player.actual_salary != null
  const contractMissing = !hasContract(player)
  const rec = getRetentionRec(player)
  const recStyle = rec ? RETENTION_STYLES[rec] : null

  return (
    <div className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 group/row transition-colors select-none">
      <div className="flex items-center gap-2 min-w-0">
        <button
          {...dragListeners}
          className="flex-shrink-0 p-0.5 opacity-0 group-hover/row:opacity-30 hover:!opacity-70 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
          onPointerDown={e => e.stopPropagation()}
        >
          <GripIcon className="w-3 h-3 text-gray-400" />
        </button>
        <span className="text-xs text-gray-300 dark:text-gray-600 w-3.5 font-mono flex-shrink-0 tabular-nums leading-none">
          {entry.string_number}
        </span>

        {/* Player photo thumbnail */}
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
          {player.photo_path ? (
            <img
              src={`${API_URL}${player.photo_path}`}
              alt={player.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400 dark:text-gray-500">
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex items-start gap-1.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/player/${player.id}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-snug hover:text-ucla-blue dark:hover:text-blue-400 transition-colors"
                onPointerDown={e => e.stopPropagation()}
              >
                {player.name}
              </Link>
              {contractMissing && (
                <span className="text-xs text-gray-400 font-normal flex-shrink-0">TBD</span>
              )}
              {rec && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${recStyle.badge}`}>
                  {rec}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400 leading-snug">{player.position} · {player.year}</span>
              {player.coach_rating != null && (
                <span className="text-[10px] text-amber-500 font-semibold leading-snug flex-shrink-0">
                  {player.coach_rating}★
                </span>
              )}
              {player.flight_risk != null && (
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${FLIGHT_RISK_COLORS[player.flight_risk]}`}
                  title={`Flight Risk: ${player.flight_risk}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <div className="text-right">
          {contractMissing ? (
            <span className="text-xs text-gray-400 font-medium">Contract TBD</span>
          ) : (
            <>
              <div className="text-xs font-mono text-gray-700 dark:text-gray-300 tabular-nums leading-snug">{fmtShort(salary)}</div>
              <span className={`text-xs leading-snug ${isActual ? 'text-green-600' : 'text-amber-600'}`}>
                {isActual ? 'Actual' : 'Proj.'}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => onRemove(entry.id)}
          className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
          title="Remove from cap sheet"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Sortable player row ───────────────────────────────────────────────────────
function SortablePlayerRow({ entry, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `entry-${entry.id}`,
    data: { type: 'player', entry },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-25' : ''}
      {...attributes}
    >
      <PlayerRowContent entry={entry} onRemove={onRemove} dragListeners={listeners} />
    </div>
  )
}

// ── DragOverlay ghosts ────────────────────────────────────────────────────────
export function CardDragGhost({ position, entries, totalBudget }) {
  const c = COLORS[position] || COLORS.QB
  const total = entries.reduce((s, e) => s + getEffectiveSalary(e.player), 0)
  const pct = (total / totalBudget * 100).toFixed(1)
  return (
    <div className={`rounded-xl border ${c.border} shadow-2xl bg-white dark:bg-[#1A2840] overflow-hidden rotate-1 scale-[1.02]`}>
      <div className={`flex items-center gap-2.5 px-3 py-2.5 ${c.hdr}`}>
        <GripIcon className="w-3.5 h-3.5 text-gray-400" />
        <div className={`w-1.5 h-1.5 rounded-full ${c.bar}`} />
        <span className={`text-sm font-bold ${c.text}`}>{position}</span>
        <span className="text-xs text-gray-400">{entries.length}p</span>
        <span className="ml-auto text-xs font-mono text-gray-600 dark:text-gray-400">{fmtShort(total)}</span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
    </div>
  )
}

export function PlayerDragGhost({ entry }) {
  if (!entry) return null
  const salary = getEffectiveSalary(entry.player)
  const isActual = entry.player.actual_salary != null
  const noContract = !hasContract(entry.player)
  return (
    <div className="bg-white dark:bg-[#1A2840] border border-gray-200 dark:border-[#2D4A70] rounded-lg px-3 py-2.5 shadow-2xl flex items-center gap-3 rotate-1 scale-[1.02] min-w-[220px]">
      <GripIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.player.name}</div>
        <div className="text-xs text-gray-400">{entry.player.position} · {entry.player.year}</div>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        {noContract ? (
          <span className="text-xs text-gray-400">Contract TBD</span>
        ) : (
          <>
            <div className="text-sm font-mono text-gray-700 dark:text-gray-300">{fmtShort(salary)}</div>
            <span className={`text-xs ${isActual ? 'text-green-600' : 'text-amber-600'}`}>
              {isActual ? 'Actual' : 'Proj.'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function avg(arr) {
  const vals = arr.filter(v => v != null)
  if (!vals.length) return null
  return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
}

// ── Main PositionCard ─────────────────────────────────────────────────────────
export default function PositionCard({
  position, entries, totalBudget,
  collapsed, onToggle,
  focused, onFocus,
  onRemove,
  activeId,
}) {
  const c = COLORS[position] || COLORS.QB
  const total = entries.reduce((s, e) => s + getEffectiveSalary(e.player), 0)
  const pct = (total / totalBudget * 100).toFixed(1)
  const entryIds = entries.map(e => `entry-${e.id}`)
  const isPlayerBeingDragged = activeId && !POSITION_ORDER.includes(activeId)

  const avgRating = avg(entries.map(e => e.player.coach_rating))
  const avgRisk = avg(entries.map(e => e.player.flight_risk))

  const {
    attributes,
    listeners: cardListeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging,
    isOver,
  } = useSortable({
    id: position,
    data: { type: 'card', position },
  })

  const isPlayerDropTarget = isOver && isPlayerBeingDragged

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isCardDragging ? 'opacity-40' : ''}
      {...attributes}
    >
      <div
        className={`rounded-xl border overflow-hidden transition-shadow bg-white dark:bg-[#1A2840] ${c.border} ${
          isPlayerDropTarget ? 'shadow-[0_0_0_2px_#2D68C4]' : 'shadow-sm'
        }`}
      >
        {/* ── Header — entire bar is the drag handle ── */}
        <div
          {...cardListeners}
          className={`flex items-center gap-2 px-3 py-2.5 ${c.hdr} border-b ${c.border} group/hdr cursor-grab active:cursor-grabbing touch-none select-none`}
        >
          {/* Grip icon (visual only) */}
          <GripIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 opacity-30 group-hover/hdr:opacity-60 transition-opacity" />

          {/* Position label */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.bar}`} />
            <span className={`text-sm font-bold tracking-wide ${c.text}`}>{position}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{entries.length}p</span>
            {avgRating != null && (
              <span className="text-[10px] text-amber-500 font-semibold flex-shrink-0 ml-0.5">
                {avgRating}★
              </span>
            )}
            {avgRisk != null && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                risk {avgRisk}
              </span>
            )}
          </div>

          {/* Spend + mini bar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 tabular-nums">{fmtShort(total)}</span>
            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full transition-[width] duration-500 ${c.bar}`}
                style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-7 tabular-nums">{pct}%</span>
          </div>

          {/* Focus button */}
          <button
            onClick={() => onFocus(focused ? null : position)}
            onPointerDown={e => e.stopPropagation()}
            className={`flex-shrink-0 p-1 rounded transition-all ${
              focused
                ? 'text-ucla-blue bg-ucla-blue/10 opacity-100'
                : 'text-gray-400 hover:text-gray-600 opacity-0 group-hover/hdr:opacity-100'
            }`}
            title={focused ? 'Exit focus' : 'Focus this position group'}
          >
            {focused ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Collapse chevron */}
          <button
            onClick={onToggle}
            onPointerDown={e => e.stopPropagation()}
            className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* ── Body (collapsible) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: collapsed ? '0fr' : '1fr',
            transition: 'grid-template-rows 220ms ease',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
              <div className="py-1" style={{ minHeight: 1 }}>
                {entries.length === 0 ? (
                  <div className={`mx-2 my-2 rounded-lg border-2 border-dashed px-4 py-4 text-center text-xs text-gray-300 ${
                    isPlayerDropTarget ? 'border-ucla-blue/50 bg-ucla-blue/5 text-ucla-blue/60' : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    {isPlayerDropTarget ? 'Drop to add to ' + position : 'No players — drag here'}
                  </div>
                ) : (
                  entries.map(entry => (
                    <SortablePlayerRow key={entry.id} entry={entry} onRemove={onRemove} />
                  ))
                )}
              </div>
            </SortableContext>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mini card for focus mode sidebar ─────────────────────────────────────────
export function MiniCard({ position, entries, totalBudget, onClick }) {
  const c = COLORS[position] || COLORS.QB
  const total = entries.reduce((s, e) => s + getEffectiveSalary(e.player), 0)
  const pct = (total / totalBudget * 100).toFixed(1)

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border ${c.border} ${c.bg} hover:shadow-sm transition-all text-left`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.bar}`} />
      <span className={`text-xs font-bold ${c.text} flex-shrink-0 w-8`}>{position}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
        <div className={`h-1 rounded-full ${c.bar}`} style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">{pct}%</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{entries.length}p</span>
    </button>
  )
}
