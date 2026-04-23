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

const type = computed(() => (route.params.type === 'seguidores' ? 'seguidores' : 'seguindo'))
const username = computed(() => {
  const queryUser = route.query.user
  return typeof queryUser === 'string' && queryUser.trim() ? queryUser : authStore.user?.username
})

const title = computed(() => (type.value === 'seguidores' ? 'Seguidores' : 'Seguindo'))

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

    items.value = listData?.items ?? listData?.data ?? listData ?? []
    total.value = Number(listData?.total ?? listData?.count ?? items.value.length)

    for (const user of items.value) {
      if (user.is_following || user.viewer_is_following) {
        followingIds.value.add(String(user.id))
      }
    }
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

  if (isFollowing(id)) {
    await unfollowUserRequest(id)
    followingIds.value.delete(id)
  } else {
    await followUserRequest(id)
    followingIds.value.add(id)
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
      @toggle="toggleFollow(item)"
    />
  </section>
</template>
