<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  followUserRequest,
  getFollowersRequest,
  getFollowingRequest,
  getUserByUsernameRequest,
  getUserPostsRequest,
  isFollowingRequest,
  unfollowUserRequest,
} from '@/services/modules/users'
import { useAuthStore } from '@/stores/modules/auth'

const route = useRoute()
const authStore = useAuthStore()

const profile = ref<any>(null)
const posts = ref<any[]>([])
const followersCount = ref(0)
const followingCount = ref(0)
const isFollowing = ref(false)
const loading = ref(false)
const error = ref('')

const targetUsername = computed(() => {
  const queryUser = route.query.user
  return typeof queryUser === 'string' && queryUser.trim() ? queryUser : authStore.user?.username
})

const isOwnProfile = computed(() => profile.value?.id === authStore.user?.id)

async function loadProfile() {
  if (!targetUsername.value) return

  loading.value = true
  error.value = ''

  try {
    const userData = await getUserByUsernameRequest(targetUsername.value)
    const resolvedProfile = userData?.user ?? userData
    profile.value = resolvedProfile

    const [postsData, followersData, followingData] = await Promise.all([
      getUserPostsRequest(resolvedProfile.id),
      getFollowersRequest(resolvedProfile.id),
      getFollowingRequest(resolvedProfile.id),
    ])

    posts.value = postsData?.items ?? postsData?.data ?? postsData ?? []
    followersCount.value = Number(followersData?.total ?? followersData?.count ?? followersData?.length ?? 0)
    followingCount.value = Number(followingData?.total ?? followingData?.count ?? followingData?.length ?? 0)

    if (!isOwnProfile.value) {
      const followState = await isFollowingRequest(resolvedProfile.id)
      isFollowing.value = Boolean(followState?.is_following ?? followState?.following ?? false)
    }
  } catch {
    error.value = 'Nao foi possivel carregar este perfil.'
  } finally {
    loading.value = false
  }
}

async function toggleFollow() {
  if (!profile.value || isOwnProfile.value) return

  if (isFollowing.value) {
    await unfollowUserRequest(profile.value.id)
    isFollowing.value = false
    followersCount.value = Math.max(0, followersCount.value - 1)
  } else {
    await followUserRequest(profile.value.id)
    isFollowing.value = true
    followersCount.value += 1
  }
}

watch(
  () => route.query.user,
  () => {
    void loadProfile()
  },
)

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <article v-if="loading" class="card-shell p-3">Carregando perfil...</article>
    <p v-if="error" class="inline-error mb-0">{{ error }}</p>

    <article v-if="profile" class="card-shell p-3 p-md-4">
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3 justify-content-between">
        <div class="d-flex align-items-center gap-3">
          <img :src="profile.avatar_url || 'https://placehold.co/96x96?text=%20'" alt="Avatar" class="avatar" />
          <div>
            <h1 class="h4 mb-1">{{ profile.name }}</h1>
            <p class="text-muted-app mb-2">@{{ profile.username }}</p>
            <p class="mb-0">{{ profile.bio }}</p>
          </div>
        </div>

        <button
          v-if="!isOwnProfile"
          class="btn"
          :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary-app'"
          type="button"
          @click="toggleFollow"
        >
          {{ isFollowing ? 'Seguindo' : 'Seguir' }}
        </button>

        <RouterLink v-else to="/perfil/editar" class="btn btn-outline-secondary">Editar perfil</RouterLink>
      </div>

      <div class="d-flex gap-4 mt-4">
        <RouterLink
          :to="`/perfil/lista/seguidores${route.query.user ? `?user=${route.query.user}` : ''}`"
          class="text-decoration-underline"
        >
          {{ followersCount }} seguidores
        </RouterLink>
        <RouterLink
          :to="`/perfil/lista/seguindo${route.query.user ? `?user=${route.query.user}` : ''}`"
          class="text-decoration-underline"
        >
          {{ followingCount }} seguindo
        </RouterLink>
      </div>
    </article>

    <article class="card-shell p-3 p-md-4">
      <h2 class="h6 mb-3">Posts</h2>
      <div class="post-grid">
        <RouterLink v-for="post in posts" :key="post.id" :to="`/posts/${post.id}`">
          <img :src="post.image_url" alt="Post" class="grid-image" />
        </RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.grid-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

@media (min-width: 768px) {
  .post-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
