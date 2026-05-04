import { useMemo } from 'react'
import { COLORS, POSITION_ORDER, getEffectiveSalary } from './PositionCard'
import { FLIGHT_RISK_COLORS, FLIGHT_RISK_LABELS } from '../../utils/player'

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutArc(cx, cy, outerR, innerR, startDeg, endDeg) {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99
  const p1 = polarToCartesian(cx, cy, outerR, startDeg)
  const p2 = polarToCartesian(cx, cy, outerR, endDeg)
  const i1 = polarToCartesian(cx, cy, innerR, endDeg)
  const i2 = polarToCartesian(cx, cy, innerR, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ')
}

function fmtShort(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function fmtM(v) {
  return `$${(v / 1_000_000).toFixed(1)}M`
}

export default function CapPieChart({ entriesByPosition, totalBudget, totalCapUsed, isOver, onClickPosition }) {
  const breakdown = useMemo(() =>
    POSITION_ORDER.map(pos => {
      const entries = entriesByPosition[pos] || []
      const total = entries.reduce((s, e) => s + getEffectiveSalary(e.player), 0)
      return { pos, total, count: entries.length }
    }).filter(d => d.total > 0),
    [entriesByPosition]
  )

  const grandTotal = breakdown.reduce((s, d) => s + d.total, 0)
  if (grandTotal === 0) return null

  const pctUsed = (totalCapUsed / totalBudget) * 100
  const remaining = totalBudget - totalCapUsed

  // Build donut arcs
  const cx = 90, cy = 90, outerR = 78, innerR = 52
  let angle = 0
  const arcs = breakdown.map(d => {
    const sweep = (d.total / grandTotal) * 360
    const start = angle
    angle += sweep
    return { ...d, start, end: angle }
  })

  // Sort breakdown by total desc for bar list
  const sorted = [...breakdown].sort((a, b) => b.total - a.total)

  return (
    <div className="mx-8 mb-8 rounded-xl border border-gray-200 dark:border-[#2D4A70] bg-white dark:bg-[#1A2840] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2D4A70]">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cap Allocation Overview</h2>
        <div className="flex items-center gap-5 text-xs">
          <span className="text-gray-400">
            Budget <span className="font-mono font-semibold text-gray-600 dark:text-gray-300">{fmtM(totalBudget)}</span>
          </span>
          <span className={`font-mono font-semibold ${isOver ? 'text-red-500' : 'text-green-600'}`}>
            {isOver ? `${fmtShort(Math.abs(remaining))} OVER` : `${fmtShort(remaining)} remaining`}
          </span>
        </div>
      </div>

      <div className="flex gap-0">
        {/* ── Donut chart ── */}
        <div className="flex flex-col items-center justify-center px-8 py-6 border-r border-gray-100 dark:border-[#2D4A70] flex-shrink-0">
          <svg viewBox="0 0 180 180" className="w-48 h-48">
            {arcs.map(({ pos, total, start, end }) => (
              <path
                key={pos}
                d={donutArc(cx, cy, outerR, innerR, start, end)}
                fill={COLORS[pos].hex}
                stroke="white"
                strokeWidth="2.5"
                className={onClickPosition ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                onClick={onClickPosition ? () => onClickPosition(pos) : undefined}
              >
                <title>{pos} — {fmtShort(total)} · Click to focus</title>
              </path>
            ))}
            {/* Center: total used */}
            <text x="90" y="82" textAnchor="middle" fill="#2D68C4" fontSize="15" fontWeight="800">
              {fmtM(grandTotal)}
            </text>
            <text x="90" y="98" textAnchor="middle" fill="#9CA3AF" fontSize="10">
              of {fmtM(totalBudget)}
            </text>
            <text
              x="90" y="116"
              textAnchor="middle"
              fill={pctUsed > 100 ? '#EF4444' : pctUsed > 90 ? '#F59E0B' : '#10B981'}
              fontSize="11"
              fontWeight="700"
            >
              {pctUsed.toFixed(1)}% used
            </text>
          </svg>

          {/* Donut legend — 2-col compact */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mt-2">
            {arcs.map(({ pos, total }) => {
              const pct = (total / grandTotal * 100).toFixed(0)
              const c = COLORS[pos]
              return (
                <div key={pos} className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: c.hex }} />
                  <span className={`text-xs font-bold ${c.text} w-7 flex-shrink-0`}>{pos}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bar breakdown ── */}
        <div className="flex-1 px-6 py-5 overflow-hidden">
          <div className="space-y-3">
            {sorted.map(({ pos, total, count }) => {
              const c = COLORS[pos]
              const pctOfBudget = (total / totalBudget) * 100
              const pctOfCap = (total / grandTotal) * 100
              return (
                <div
                  key={pos}
                  className={`flex items-center gap-3 min-w-0 ${onClickPosition ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-1 -mx-1 transition-colors' : ''}`}
                  onClick={onClickPosition ? () => onClickPosition(pos) : undefined}
                  title={onClickPosition ? `Focus ${pos}` : undefined}
                >
                  {/* Position badge */}
                  <div className={`flex items-center gap-1.5 w-14 flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.bar}`} />
                    <span className={`text-xs font-bold ${c.text}`}>{pos}</span>
                  </div>

                  {/* Bar — width = % of budget */}
                  <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-[width] duration-700 ${c.bar}`}
                        style={{ width: `${Math.min(pctOfBudget, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dollar */}
                  <span className="w-16 text-right text-xs font-mono font-medium text-gray-700 dark:text-gray-300 tabular-nums flex-shrink-0">
                    {fmtShort(total)}
                  </span>

                  {/* % of cap used */}
                  <span className="w-10 text-right text-xs text-gray-400 tabular-nums flex-shrink-0">
                    {pctOfCap.toFixed(1)}%
                  </span>

                  {/* Player count */}
                  <span className="w-8 text-right text-xs text-gray-300 dark:text-gray-600 tabular-nums flex-shrink-0">
                    {count}p
                  </span>
                </div>
              )
            })}

            {/* Total row */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 min-w-0">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">TOTAL</span>
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-[width] duration-500 ${isOver ? 'bg-red-500' : pctUsed > 90 ? 'bg-ucla-gold' : 'bg-ucla-blue'}`}
                    style={{ width: `${Math.min(pctUsed, 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-sm font-mono font-bold text-gray-800 dark:text-gray-200 tabular-nums flex-shrink-0">
                {fmtShort(totalCapUsed)}
              </span>
              <span className={`w-10 text-right text-sm font-bold tabular-nums flex-shrink-0 ${isOver ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {pctUsed.toFixed(1)}%
              </span>
              <span className="w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Flight risk legend — one central reference */}
      <div className="flex items-center gap-4 px-6 py-2.5 border-t border-gray-100 dark:border-[#2D4A70] flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium flex-shrink-0">Flight Risk</span>
        {[1,2,3,4,5].map(r => (
          <div key={r} className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${FLIGHT_RISK_COLORS[r]}`} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{r} — {FLIGHT_RISK_LABELS[r]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
