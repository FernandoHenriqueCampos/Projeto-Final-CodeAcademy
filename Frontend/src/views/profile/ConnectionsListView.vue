<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import UserFollowCard from '@/components/user/UserFollowCard.vue'
import {
  followUserRequest,
  getFollowersRequest,
  getFollowingRequest,
  getUserByUsernameRequest,
  unfollowUserRequest,
} from '@/services/modules/users'
import { useAuthStore } from '@/stores/modules/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const items = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const error = ref('')
const followingIds = ref<Set<string>>(new Set())
const togglingUserId = ref<string | null>(null)

const type = computed(() => (route.params.type === 'seguidores' ? 'seguidores' : 'seguindo'))
const username = computed(() => {
  const queryUser = route.query.user
  return typeof queryUser === 'string' && queryUser.trim() ? queryUser : authStore.user?.username
})

const title = computed(() => (type.value === 'seguidores' ? 'Seguidores' : 'Seguindo'))

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

function extractTotal(payload: any): number {
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

  return extractItems(payload).length
}

async function load() {
  if (!username.value) return

  loading.value = true
  error.value = ''

  try {
    const userData = await getUserByUsernameRequest(username.value)
    const targetUser = userData?.user ?? userData

    const listData =
      type.value === 'seguidores'
        ? await getFollowersRequest(targetUser.id, page.value)
        : await getFollowingRequest(targetUser.id, page.value)

    items.value = extractItems(listData)
    total.value = extractTotal(listData)

    const nextFollowingIds = new Set<string>()

    if (type.value === 'seguindo') {
      for (const user of items.value) {
        nextFollowingIds.add(String(user.id))
      }
    } else {
      for (const user of items.value) {
        if (user.is_following || user.viewer_is_following) {
          nextFollowingIds.add(String(user.id))
        }
      }
    }

    followingIds.value = nextFollowingIds
  } catch {
    error.value = 'Nao foi possivel carregar a lista.'
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

function goBack() {
  router.push(`/perfil${route.query.user ? `?user=${route.query.user}` : ''}`)
}

watch(
  () => [route.params.type, route.query.user],
  () => {
    page.value = 1
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <article class="card-shell p-3 p-md-4 d-flex justify-content-between align-items-center">
      <div>
        <h1 class="h5 mb-1">{{ title }}</h1>
        <p class="text-muted-app mb-0">{{ total }} resultados</p>
      </div>
      <button class="btn btn-outline-secondary" type="button" @click="goBack">Voltar ao perfil</button>
    </article>

    <article v-if="loading" class="card-shell p-3">Carregando...</article>
    <p v-if="error" class="inline-error mb-0">{{ error }}</p>

    <UserFollowCard
      v-for="item in items"
      :key="item.id"
      :user="item"
      :is-following="isFollowing(item.id)"
      :loading="togglingUserId === String(item.id)"
      @toggle="toggleFollow(item)"
    />
  </section>
</template>
