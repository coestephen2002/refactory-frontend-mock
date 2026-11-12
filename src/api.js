import axios from 'axios'
import { useMockApi } from './apiMode'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
})

if (useMockApi) {
  const adapter = import('./mocks/adapter.js').then(({ createMockAdapter }) => createMockAdapter())
  api.defaults.adapter = async config => (await adapter)(config)
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem(useMockApi ? 'mock-token' : 'token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

export default api
