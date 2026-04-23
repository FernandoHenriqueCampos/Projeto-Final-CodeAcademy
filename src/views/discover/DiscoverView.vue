<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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

const users = ref<any[]>([])
const followingIds = ref<Set<string>>(new Set())
const page = ref(Number(route.query.page ?? 1))
const loading = ref(false)
const togglingUserId = ref<string | null>(null)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [suggestionsData, followingData] = await Promise.all([
      getSuggestionsRequest(page.value),
      getFollowingByViewerRequest(authStore.user?.id, page.value),
    ])

    const rawUsers = suggestionsData?.items ?? suggestionsData?.data ?? suggestionsData ?? []
    users.value = rawUsers.map((user: any) => ({
      ...user,
      is_self: user?.id === authStore.user?.id,
    }))

    const followingItems = followingData?.items ?? followingData?.data ?? followingData ?? []
    followingIds.value = new Set(followingItems.map((user: any) => String(user.id)))
  } catch {
    error.value = 'Nao foi possivel carregar sugestoes.'
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
  router.push({ path: '/descobrir', query: { page: String(target) } })
}

watch(
  () => route.query.page,
  (value) => {
    page.value = Math.max(1, Number(value ?? 1))
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
      <h1 class="h5 mb-1">Descobrir perfis</h1>
      <p class="text-muted-app mb-0">Encontre pessoas para seguir.</p>
    </header>

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

    <div class="d-flex gap-2 justify-content-end">
      <button class="btn btn-outline-secondary" type="button" :disabled="page <= 1" @click="goToPage(page - 1)">
        Anterior
      </button>
      <button class="btn btn-outline-secondary" type="button" @click="goToPage(page + 1)">
        Proxima
      </button>
    </div>
  </section>
</template>
