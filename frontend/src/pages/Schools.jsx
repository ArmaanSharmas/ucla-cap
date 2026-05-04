import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { schoolsApi, API_URL } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function Schools() {
  const toast = useToast()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const fileInputs = useRef({})

  async function fetchSchools() {
    try {
      const res = await schoolsApi.getAll()
      setSchools(res.data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSchools() }, [])

  async function handleLogoUpload(schoolName, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(schoolName)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await schoolsApi.uploadLogo(schoolName, fd)
      fetchSchools()
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(null)
      if (fileInputs.current[schoolName]) fileInputs.current[schoolName].value = ''
    }
  }

  async function handleDeleteLogo(schoolName) {
    try {
      await schoolsApi.deleteLogo(schoolName)
      fetchSchools()
    } catch {
      toast.error('Failed to remove logo')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Logos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center mt-16">
          <div className="w-8 h-8 border-2 border-ucla-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {schools.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No schools found.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#2D4A70]">
              {schools.map(school => (
                <div key={school.name} className="flex items-center gap-4 px-5 py-4">
                  {/* Logo display */}
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {school.logo_path ? (
                      <img
                        src={`${API_URL}${school.logo_path}`}
                        alt={school.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                        {school.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {school.name}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => fileInputs.current[school.name]?.click()}
                      disabled={uploading === school.name}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      {uploading === school.name ? 'Uploading…' : school.logo_path ? 'Replace' : 'Upload Logo'}
                    </button>
                    {school.logo_path && (
                      <button
                        onClick={() => handleDeleteLogo(school.name)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove logo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <input
                      ref={el => { fileInputs.current[school.name] = el }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoUpload(school.name, e)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
