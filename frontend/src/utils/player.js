export const FLIGHT_RISK_COLORS = {
  1: 'bg-gray-400',
  2: 'bg-ucla-blue',
  3: 'bg-ucla-gold',
  4: 'bg-orange-500',
  5: 'bg-red-500',
}

export const FLIGHT_RISK_LABELS = {
  1: 'No risk',
  2: 'Stable',
  3: 'Some uncertainty',
  4: 'High risk',
  5: 'Likely gone',
}

export const RETENTION_STYLES = {
  'Priority Retain': { badge: 'bg-red-100 text-red-700 border border-red-300', dot: 'bg-red-500' },
  'Secure':          { badge: 'bg-blue-100 text-blue-700 border border-blue-300', dot: 'bg-ucla-blue' },
  'Negotiate':       { badge: 'bg-amber-100 text-amber-700 border border-amber-300', dot: 'bg-amber-500' },
  'Let Walk':        { badge: 'bg-gray-100 text-gray-600 border border-gray-300', dot: 'bg-gray-400' },
}

export function getRetentionRec(player) {
  const ask = player.projected_ask_vs_expected_value
  const risk = player.flight_risk
  if (!ask) return null
  if (ask === 'Bargain' && risk != null && risk >= 3) return 'Priority Retain'
  if (ask === 'Bargain' && risk != null && risk <= 2) return 'Secure'
  if (ask === 'Fair ask' && risk != null && risk >= 3) return 'Negotiate'
  if (ask === 'Asking too much') return 'Let Walk'
  return null
}

export function parseSalary(val) {
  if (val === '' || val === null || val === undefined) return null
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

export function fmtCurrency(v) {
  if (v == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

export function fmtShort(v) {
  if (v == null) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}
