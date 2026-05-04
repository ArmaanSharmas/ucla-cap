import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let _id = 0

const STYLES = {
  success: { bar: 'bg-green-500', icon: '✓', iconCls: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
  error:   { bar: 'bg-red-500',   icon: '✕', iconCls: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
  warning: { bar: 'bg-amber-500', icon: '!', iconCls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
  info:    { bar: 'bg-blue-500',  icon: 'i', iconCls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
}

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info
  return (
    <div className="pointer-events-auto flex items-start w-80 rounded-xl shadow-lg border border-gray-200 dark:border-[#2D4A70] overflow-hidden bg-white dark:bg-[#1A2840]">
      <div className={`w-1 self-stretch flex-shrink-0 ${s.bar}`} />
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-3 ml-3 ${s.iconCls}`}>
        {s.icon}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 py-3 px-3 leading-snug">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-gray-300 hover:text-gray-500 p-2 mt-1.5 flex-shrink-0 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_id
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  function dismiss(id) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error', 5000),
    warning: (msg) => add(msg, 'warning', 4500),
    info:    (msg) => add(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
