<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import AppNav from '@/components/common/AppNav.vue'
import { useAuthStore } from '@/stores/modules/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const selectedFilter = ref(typeof route.query.filter === 'string' ? route.query.filter : 'tudo')
const userMenuOpen = ref(false)

const avatarUrl = computed(() => authStore.user?.avatar_url || 'https://placehold.co/48x48?text=%20')
const showFeedFilter = computed(() => route.name === 'feed')

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
  background-color: #0c1320;
  border-color: #30405e;
  color: #e8efff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid #31415f;
  background: #101827;
  cursor: pointer;
}

.header-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #425a82;
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
  color: #dce7ff;
  font-size: 0.82rem;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 0.5rem 0.6rem;
}

.dropdown-item-app:hover {
  border-color: #3a4d70;
  background: #121b2b;
}

.dropdown-item-app.danger {
  color: #ffadad;
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
