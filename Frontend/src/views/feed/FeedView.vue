<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import PostCard from '@/components/feed/PostCard.vue'
import { useFeedStore } from '@/stores/modules/feed'

const route = useRoute()
const feedStore = useFeedStore()

const error = ref('')
const loadingMore = ref(false)

function hasPostImage(post: any) {
  const value = post?.image_url ?? post?.imageUrl ?? post?.image?.url
  return typeof value === 'string' && value.trim().length > 0
}

function isForumPost(post: any) {
  return Boolean(post?.is_forum_post) || !hasPostImage(post)
}

const activeFilter = computed(() => {
  const value = typeof route.query.filter === 'string' ? route.query.filter.toLowerCase() : 'tudo'
  if (value === 'posts' || value === 'debates') return value
  return 'tudo'
})

const visiblePosts = computed(() => {
  if (activeFilter.value === 'posts') {
    return feedStore.posts.filter((post) => !isForumPost(post))
  }

  if (activeFilter.value === 'debates') {
    return feedStore.posts.filter((post) => isForumPost(post))
  }

  return feedStore.posts
})

onMounted(async () => {
  error.value = ''

  try {
    await feedStore.fetchFeed()
  } catch {
    error.value = 'Nao foi possivel carregar o feed.'
  }
})

async function loadMore() {
  loadingMore.value = true
  try {
    await feedStore.loadMoreFeed(feedStore.nextCursor)
  } catch {
    error.value = 'Nao foi possivel carregar mais posts.'
  } finally {
    loadingMore.value = false
  }
}
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <header class="card-shell p-3 p-md-4 feed-header">
      <p class="section-kicker mb-1"><span class="dot-accent"></span> Live Stream</p>
      <h1 class="h5 mb-1 font-title">Timeline de build logs e releases</h1>
      <p class="text-muted-app mb-0">
        {{ visiblePosts.length }} resultados para filtro "{{ activeFilter }}"
      </p>
    </header>

    <p v-if="error" class="inline-error mb-0">{{ error }}</p>

    <article v-if="feedStore.loading" class="card-shell p-4">Carregando feed...</article>

    <PostCard v-for="post in visiblePosts" :key="post.id" :post="post" />

    <article v-if="!feedStore.loading && !visiblePosts.length" class="card-shell p-4">
      Nenhuma publicacao encontrada para esse filtro.
    </article>

    <button
      v-if="feedStore.nextCursor !== null"
      class="btn btn-outline-secondary load-more-btn"
      type="button"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Carregando...' : 'Carregar mais' }}
    </button>
  </section>
</template>

<style scoped>
.load-more-btn {
  align-self: center;
  width: min(260px, 100%);
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

.feed-header {
  position: relative;
  overflow: hidden;
}

.feed-header::after {
  content: '';
  position: absolute;
  inset: auto -12% -70% auto;
  width: 300px;
  height: 300px;
  border-radius: 999px;
  background: radial-gradient(circle, rgb(143 178 255 / 22%), transparent 62%);
  pointer-events: none;
}
</style>
