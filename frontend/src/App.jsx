import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff', color: '#111', minHeight: '100vh' }}>
          <h2 style={{ color: '#c00' }}>Render error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import PlayerPool from './pages/PlayerPool'
import CapSheet from './pages/CapSheet'
import PlayerProfile from './pages/PlayerProfile'
import SavedRosters from './pages/SavedRosters'
import Settings from './pages/Settings'
import Recruiting from './pages/Recruiting'
import Schools from './pages/Schools'

export default function App() {
  return (
    <ErrorBoundary>
    <SettingsProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PlayerPool />} />
            <Route path="cap-sheet" element={<CapSheet />} />
            <Route path="player/:id" element={<PlayerProfile />} />
            <Route path="saved-rosters" element={<SavedRosters />} />
            <Route path="recruiting" element={<Recruiting />} />
            <Route path="settings" element={<Settings />} />
            <Route path="schools" element={<Schools />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
    </ErrorBoundary>
  )
}
