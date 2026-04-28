<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Moon, Sun } from 'lucide-vue-next'

import AppNav from '@/components/common/AppNav.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/modules/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { activeTheme, toggleTheme } = useTheme()
const selectedFilter = ref(typeof route.query.filter === 'string' ? route.query.filter : 'tudo')
const userMenuOpen = ref(false)

const avatarUrl = computed(() => authStore.user?.avatar_url || 'https://placehold.co/48x48?text=%20')
const showFeedFilter = computed(() => route.name === 'feed')
const themeButtonAriaLabel = computed(() =>
  activeTheme.value === 'dark' ? 'Modo claro' : 'Modo escuro',
)

function applyFilter() {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      filter: selectedFilter.value === 'tudo' ? undefined : selectedFilter.value,
    },
  })
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

async function goToProfile() {
  userMenuOpen.value = false
  await router.push('/perfil')
}

watch(
  () => route.query.filter,
  (value) => {
    selectedFilter.value = typeof value === 'string' ? value : 'tudo'
  },
)

watch(
  () => route.fullPath,
  () => {
    userMenuOpen.value = false
  },
)

async function handleLogout() {
  userMenuOpen.value = false
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="app-shell py-3 py-md-4">
    <div class="layout-grid gap-3 gap-md-4">
      <AppNav />

      <section class="content-area flex-grow-1">
        <header
          class="card-shell top-header px-3 py-3 px-md-4 py-md-3 mb-3 mb-md-4 d-flex flex-row flex-wrap justify-content-between align-items-center gap-3"
        >
          <div class="header-main-row">
            <div class="header-left">
              <p class="section-kicker mb-1"><span class="dot-accent"></span> Painel</p>
              <h2 class="h5 mb-0 font-title">Central de Conteudo</h2>
            </div>
          </div>

          <div v-if="showFeedFilter" class="header-controls">
            <div class="filter-wrap">
              <label class="form-label mb-1 small text-muted-app" for="global-filter">Filtro</label>
              <select id="global-filter" v-model="selectedFilter" class="form-select form-select-sm" @change="applyFilter">
                <option value="tudo">Tudo</option>
                <option value="posts">Posts</option>
                <option value="debates">Debates</option>
              </select>
            </div>
          </div>

          <div class="header-controls">
            <button class="theme-toggle-btn icon-only" type="button" :aria-label="themeButtonAriaLabel" @click="toggleTheme">
              <Sun v-if="activeTheme === 'dark'" :size="16" aria-hidden="true" />
              <Moon v-else :size="16" aria-hidden="true" />
            </button>
          </div>

          <div class="user-menu">
            <button class="user-chip" type="button" @click="toggleUserMenu">
              <img :src="avatarUrl" alt="Avatar do usuario" class="header-avatar" />
            </button>

            <div v-if="userMenuOpen" class="user-dropdown card-shell">
              <button class="dropdown-item-app" type="button" @click="goToProfile">Ir para perfil</button>
              <button class="dropdown-item-app danger" type="button" @click="handleLogout">Sair</button>
            </div>
          </div>
        </header>

        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </section>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  width: min(1680px, 98vw);
  margin: 0 auto;
}

.layout-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
}

.content-area {
  width: 100%;
  min-height: 100vh;
  padding-bottom: 5rem;
}

.top-header {
  position: relative;
  z-index: 40;
  isolation: isolate;
}

.header-main-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  min-width: 0;
  flex: 1 1 auto;
}

.header-left {
  min-width: 0;
}

.header-controls {
  display: flex;
  align-items: end;
  gap: 0.65rem;
  flex-wrap: wrap;
  width: auto;
  flex: 0 0 auto;
}

.filter-wrap {
  min-width: 150px;
}

.filter-wrap :deep(.form-select) {
  background-color: var(--color-input-bg);
  border-color: var(--color-input-border);
  color: var(--color-input-text);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid var(--color-chip-border);
  background: var(--color-chip-bg);
  cursor: pointer;
}

.header-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--color-avatar-border);
}

.user-menu {
  position: relative;
  flex-shrink: 0;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.45rem);
  min-width: 185px;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  z-index: 999;
}

.dropdown-item-app {
  text-align: left;
  border: 1px solid transparent;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--color-dropdown-text);
  font-size: 0.82rem;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 0.5rem 0.6rem;
}

.dropdown-item-app:hover {
  border-color: var(--color-dropdown-hover-border);
  background: var(--color-dropdown-hover-bg);
}

.dropdown-item-app.danger {
  color: var(--color-dropdown-danger);
}

@media (min-width: 768px) {
  .content-area {
    padding-bottom: 1rem;
  }

  .header-main-row {
    align-items: center;
  }

  .header-controls {
    justify-content: flex-end;
  }
}

@media (max-width: 767.98px) {
  .app-shell {
    width: min(100%, 96vw);
  }

  .layout-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .top-header {
    gap: 0.9rem;
  }

  .header-main-row {
    width: auto;
    flex: 1 1 auto;
  }

  .header-left {
    padding-right: 0.25rem;
  }

  .header-left .h5 {
    font-size: 1rem;
    line-height: 1.15;
  }

  .header-controls {
    width: auto;
    align-items: center;
    justify-content: flex-end;
  }

  .filter-wrap {
    min-width: 0;
    width: min(100%, 220px);
  }

  .user-chip {
    margin-left: auto;
  }
}
</style>
