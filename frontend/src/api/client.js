import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const playersApi = {
  getAll: (params) => api.get('/players/', { params }),
  get: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players/', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  uploadPhoto: (id, formData) =>
    api.post(`/players/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const capSheetApi = {
  getAll: () => api.get('/cap-sheet/'),
  add: (data) => api.post('/cap-sheet/', data),
  update: (id, data) => api.put(`/cap-sheet/${id}`, data),
  remove: (id) => api.delete(`/cap-sheet/${id}`),
  clearAll: () => api.delete('/cap-sheet/'),
}

export const savedRostersApi = {
  getAll: () => api.get('/saved-rosters/'),
  get: (id) => api.get(`/saved-rosters/${id}`),
  create: (data) => api.post('/saved-rosters/', data),
  rename: (id, data) => api.put(`/saved-rosters/${id}`, data),
  delete: (id) => api.delete(`/saved-rosters/${id}`),
  load: (id) => api.post(`/saved-rosters/${id}/load`),
}

export const schoolsApi = {
  getAll: () => api.get('/schools/'),
  uploadLogo: (name, formData) =>
    api.post(`/schools/${encodeURIComponent(name)}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteLogo: (name) => api.delete(`/schools/${encodeURIComponent(name)}/logo`),
}
