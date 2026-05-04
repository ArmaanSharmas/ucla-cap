import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [capBudget, setCapBudgetState] = useState(() =>
    Number(localStorage.getItem('uclaCapBudget')) || 20_500_000
  )
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('uclaCapTheme') || 'light'
  )
  const [siteLogo, setSiteLogoState] = useState(() =>
    localStorage.getItem('uclaCapLogo') || null
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('uclaCapTheme', theme)
  }, [theme])

  function setCapBudget(val) {
    const n = Number(val)
    if (!isNaN(n) && n > 0) {
      setCapBudgetState(n)
      localStorage.setItem('uclaCapBudget', String(n))
    }
  }

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  function setSiteLogo(dataUrl) {
    setSiteLogoState(dataUrl)
    if (dataUrl) {
      localStorage.setItem('uclaCapLogo', dataUrl)
    } else {
      localStorage.removeItem('uclaCapLogo')
    }
  }

  return (
    <SettingsContext.Provider value={{ capBudget, setCapBudget, theme, toggleTheme, siteLogo, setSiteLogo }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
