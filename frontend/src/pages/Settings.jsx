import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

function fmtBudget(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

export default function Settings() {
  const { capBudget, setCapBudget, theme, toggleTheme, siteLogo, setSiteLogo } = useSettings()
  const [budgetInput, setBudgetInput] = useState(String(Math.round(capBudget / 1_000_000)))
  const [saved, setSaved] = useState(false)
  const logoInputRef = useRef(null)
  const [logoWarning, setLogoWarning] = useState('')

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setLogoWarning('File must be an image.'); return }
    setLogoWarning('')
    if (file.size > 500_000) {
      setLogoWarning(`Image is ${(file.size / 1024).toFixed(0)} KB — large logos may slow the app. SVG files work best.`)
    }
    const reader = new FileReader()
    reader.onload = ev => setSiteLogo(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleBudgetSave() {
    const millions = parseFloat(budgetInput)
    if (!isNaN(millions) && millions > 0) {
      setCapBudget(millions * 1_000_000)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      {/* Cap Budget */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cap Budget</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Set the total NIL cap budget. Currently {fmtBudget(capBudget)}.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              className="input pl-7"
              type="number"
              min={1}
              step={0.1}
              value={budgetInput}
              onChange={e => { setBudgetInput(e.target.value); setSaved(false) }}
              placeholder="20.5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">M</span>
          </div>
          <button onClick={handleBudgetSave} className="btn-primary">
            {saved ? '✓ Saved' : 'Update'}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Appearance</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Toggle between light and dark mode. Persists across sessions.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-ucla-blue' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Website Logo */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Website Logo</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Upload a logo to display in the sidebar and browser tab. PNG, JPG, or SVG recommended.
        </p>
        <div className="flex items-center gap-4">
          {siteLogo ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img src={siteLogo} alt="Current logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => logoInputRef.current?.click()} className="btn-ghost text-xs">
                  Replace
                </button>
                <button onClick={() => setSiteLogo(null)} className="btn-ghost text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => logoInputRef.current?.click()} className="btn-primary">
              Upload Logo
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
        {logoWarning && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{logoWarning}</p>
        )}
      </div>

      {/* Schools */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">School Logos</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Upload logos for schools to display across the app.
        </p>
        <Link to="/schools" className="btn-ghost inline-flex">
          Manage School Logos
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
