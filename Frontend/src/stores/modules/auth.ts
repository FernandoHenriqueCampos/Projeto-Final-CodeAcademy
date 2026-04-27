import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { TOKEN_STORAGE_KEY } from '@/constants/auth'
import { loginRequest, logoutRequest, meRequest, registerRequest, type LoginPayload, type RegisterPayload } from '@/services/modules/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))
  const isAuthenticated = computed(() => Boolean(token.value))

  function setSession(newToken: string | null, newUser: Record<string, any> | null) {
    token.value = newToken
    user.value = newUser

    if (newToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  async function login(payload: LoginPayload) {
    const data = await loginRequest(payload)
    setSession(data?.access_token ?? null, data?.user ?? null)
    return data
  }

  async function register(payload: RegisterPayload) {
    const data = await registerRequest(payload)
    setSession(data?.access_token ?? null, data?.user ?? null)
    return data
  }

  async function fetchMe() {
    if (!token.value) return null

    const data = await meRequest()
    user.value = data?.user ?? data
    return user.value
  }

  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // Sempre limpar sessao local, mesmo com token invalido.
    } finally {
      setSession(null, null)
    }
  }

  function hydrateFromStorage() {
    token.value = localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    hydrateFromStorage,
  }
})
