<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import UserFollowCard from '@/components/user/UserFollowCard.vue'
import { useAuthStore } from '@/stores/modules/auth'
import {
  followUserRequest,
  getFollowingByViewerRequest,
  getSuggestionsRequest,
  unfollowUserRequest,
} from '@/services/modules/users'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const PAGE_SIZE = 9

const users = ref<any[]>([])
const followingIds = ref<Set<string>>(new Set())
const page = ref(Number(route.query.page ?? 1))
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const loading = ref(false)
const togglingUserId = ref<string | null>(null)
const error = ref('')
const total = ref<number | null>(null)
const hasNextPage = ref(false)

const hasResults = computed(() => users.value.length > 0)
const totalPages = computed(() => {
  if (total.value !== null) {
    return Math.max(1, Math.ceil(total.value / PAGE_SIZE))
  }

  return hasNextPage.value ? page.value + 1 : page.value
})

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

function extractTotal(payload: any): number | null {
  const candidates = [
    payload?.total,
    payload?.count,
    payload?.meta?.total,
    payload?.pagination?.total,
    payload?.data?.total,
    payload?.data?.count,
    payload?.data?.meta?.total,
    payload?.data?.pagination?.total,
  ]

  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }

  return null
}

async function load() {
  loading.value = true
  error.value = ''

  const trimmedSearch = search.value.trim()

  if (trimmedSearch && trimmedSearch.length < 2) {
    users.value = []
    total.value = 0
    hasNextPage.value = false
    error.value = 'Digite pelo menos 2 caracteres para buscar.'
    loading.value = false
    return
  }

  try {
    const [suggestionsData, followingData] = await Promise.all([
      getSuggestionsRequest(page.value, trimmedSearch, PAGE_SIZE),
      getFollowingByViewerRequest(authStore.user?.id, page.value),
    ])

    const rawUsers = extractItems(suggestionsData)
    const totalFromPayload = extractTotal(suggestionsData)

    users.value = rawUsers.slice(0, PAGE_SIZE).map((user: any) => ({
      ...user,
      is_self: user?.id === authStore.user?.id,
    }))

    total.value = totalFromPayload
    if (totalFromPayload !== null) {
      hasNextPage.value = page.value * PAGE_SIZE < totalFromPayload
    } else {
      hasNextPage.value = rawUsers.length > PAGE_SIZE || rawUsers.length === PAGE_SIZE
    }

    const followingItems = extractItems(followingData)
    followingIds.value = new Set(followingItems.map((user: any) => String(user.id)))
  } catch {
    error.value = 'Nao foi possivel carregar sugestoes.'
    hasNextPage.value = false
  } finally {
    loading.value = false
  }
}

function isFollowing(userId: number | string) {
  return followingIds.value.has(String(userId))
}

async function toggleFollow(user: any) {
  const id = String(user.id)
  togglingUserId.value = id

  try {
    if (isFollowing(id)) {
      await unfollowUserRequest(id)
      followingIds.value.delete(id)
    } else {
      await followUserRequest(id)
      followingIds.value.add(id)
    }
  } finally {
    togglingUserId.value = null
  }
}

function goToPage(target: number) {
  if (target < 1) return
  if (target > page.value && !hasNextPage.value) return

  router.push({
    path: '/descobrir',
    query: {
      page: String(target),
      q: search.value.trim() || undefined,
    },
  })
}

function applySearch() {
  router.push({
    path: '/descobrir',
    query: {
      page: '1',
      q: search.value.trim() || undefined,
    },
  })
}

watch(
  () => [route.query.page, route.query.q],
  ([pageQuery, queryValue]) => {
    page.value = Math.max(1, Number(pageQuery ?? 1))
    search.value = typeof queryValue === 'string' ? queryValue : ''
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <header class="card-shell p-3 p-md-4">
      <p class="section-kicker mb-1"><span class="dot-accent"></span> Network</p>
      <h1 class="h5 mb-1 font-title">Descobrir perfis</h1>
      <p class="text-muted-app mb-0">Encontre pessoas para seguir.</p>
    </header>

    <form class="card-shell p-3 d-flex flex-column flex-md-row gap-2 align-items-md-center" @submit.prevent="applySearch">
      <input
        v-model="search"
        class="form-control"
        type="search"
        placeholder="Buscar por nome ou username"
        aria-label="Buscar perfis"
      />
      <button class="btn btn-primary-app" type="submit" :disabled="loading">Buscar</button>
    </form>

    <article v-if="loading" class="card-shell p-3">Carregando...</article>
    <p v-if="error" class="inline-error mb-0">{{ error }}</p>

    <UserFollowCard
      v-for="user in users"
      :key="user.id"
      :user="user"
      :is-following="isFollowing(user.id)"
      :loading="togglingUserId === String(user.id)"
      @toggle="toggleFollow(user)"
    />

    <article v-if="!loading && !error && !hasResults" class="card-shell p-3">
      <p class="text-muted-app mb-0">Nenhum perfil encontrado para essa busca.</p>
    </article>

    <div class="pagination-bar card-shell p-3">
      <p class="pagination-status mb-0">
        Pagina <strong>{{ page }}</strong> de <strong>{{ totalPages }}</strong>
      </p>

      <div class="d-flex gap-2 justify-content-end">
        <button class="btn btn-outline-secondary" type="button" :disabled="page <= 1" @click="goToPage(page - 1)">
          Anterior
        </button>
        <button class="btn btn-outline-secondary" type="button" :disabled="!hasNextPage || loading" @click="goToPage(page + 1)">
          Proxima
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pagination-status {
  color: var(--color-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.82rem;
}

.pagination-status strong {
  color: var(--color-text);
}

@media (max-width: 767.98px) {
  .pagination-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-status {
    text-align: center;
  }
}
</style>
