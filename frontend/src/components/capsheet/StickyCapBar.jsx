import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'

function useAnimatedNumber(target, duration = 500) {
  const [value, setValue] = useState(target)
  const raf = useRef(null)
  const state = useRef({ from: target, startTime: null })

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    state.current = { from: value, startTime: null }

    const step = (ts) => {
      if (!state.current.startTime) state.current.startTime = ts
      const elapsed = ts - state.current.startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(state.current.from + (target - state.current.from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }

    raf.current = requestAnimationFrame(step)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target])

  return value
}

function fmtShort(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

export default function StickyCapBar({ totalCapUsed, avgRating, avgRisk, showMetrics, onToggleMetrics }) {
  const { capBudget } = useSettings()
  const animated = useAnimatedNumber(Math.round(totalCapUsed))
  const remaining = capBudget - animated
  const pct = (animated / capBudget) * 100
  const isOver = totalCapUsed > capBudget
  const budgetLabel = `$${(capBudget / 1_000_000).toFixed(1)}M`

  return (
    <div className="sticky top-0 z-40 border-b border-ucla-navy/20 bg-ucla-navy/95 backdrop-blur-sm px-8 py-2 flex items-center gap-5 min-w-0">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-blue-200/60">Used</span>
        <span className="text-sm font-bold font-mono text-white tabular-nums">
          {fmtShort(animated)}
        </span>
      </div>

      <div className="flex-1 min-w-0 bg-white/20 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-[width] duration-300 ${
            isOver ? 'bg-red-400' : pct > 90 ? 'bg-ucla-gold' : 'bg-ucla-blue-light'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex items-center gap-5 flex-shrink-0">
        <span className="text-xs text-blue-200/60">
          <span className={`font-bold font-mono tabular-nums ${isOver ? 'text-red-300' : 'text-white'}`}>
            {pct.toFixed(1)}%
          </span>
          {' '}of {budgetLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-blue-200/60">Remaining</span>
          <span className={`text-sm font-bold font-mono tabular-nums ${isOver ? 'text-red-300' : 'text-green-300'}`}>
            {isOver ? '−' : ''}{fmtShort(Math.abs(remaining))}
          </span>
        </div>

        {/* Team metrics (when shown) */}
        {showMetrics && (
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            {avgRating != null && (
              <span className="text-xs text-blue-200/60">
                Avg <span className="text-amber-300 font-semibold">{avgRating}★</span>
              </span>
            )}
            {avgRisk != null && (
              <span className="text-xs text-blue-200/60">
                Risk <span className="text-white font-semibold">{avgRisk}</span>
              </span>
            )}
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={onToggleMetrics}
          className="text-xs text-blue-200/40 hover:text-blue-200/80 transition-colors"
          title={showMetrics ? 'Hide team metrics' : 'Show team metrics'}
        >
          {showMetrics ? 'Less' : 'Team Stats'}
        </button>
      </div>
    </div>
  )
}
