import api from '@/services/api'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  username: string
  email: string
  password: string
  password_confirmation: string
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function logoutRequest() {
  const { data } = await api.post('/auth/logout')
  return data
}

export async function meRequest() {
  const { data } = await api.get('/auth/me')
  return data
}
