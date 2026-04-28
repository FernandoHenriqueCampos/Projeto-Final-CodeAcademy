import { ref } from 'vue'

export type AppTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'codenet-theme'
const activeTheme = ref<AppTheme>('dark')
let hasHydrated = false

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function getSystemTheme(): AppTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): AppTheme | null {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return null
}

function persistTheme(theme: AppTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function setTheme(theme: AppTheme) {
  activeTheme.value = theme
  applyTheme(theme)
  persistTheme(theme)
}

function toggleTheme() {
  setTheme(activeTheme.value === 'dark' ? 'light' : 'dark')
}

function hydrateTheme() {
  if (hasHydrated) {
    return
  }

  const storedTheme = readStoredTheme()
  const theme = storedTheme ?? getSystemTheme()

  activeTheme.value = theme
  applyTheme(theme)
  hasHydrated = true
}

export function useTheme() {
  return {
    activeTheme,
    hydrateTheme,
    setTheme,
    toggleTheme,
  }
}
