<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import PostCard from '@/components/feed/PostCard.vue'
import { useFeedStore } from '@/stores/modules/feed'

const route = useRoute()
const feedStore = useFeedStore()

const error = ref('')
const loadingMore = ref(false)
const supportsInfiniteScroll = ref(false)
const infiniteSentinel = ref<HTMLElement | null>(null)
const userHasScrolled = ref(false)
let observer: IntersectionObserver | null = null

function onWindowScroll() {
  if (window.scrollY > 0) {
    userHasScrolled.value = true
  }
}

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

const canLoadMore = computed(() => feedStore.nextCursor !== null)

onMounted(async () => {
  supportsInfiniteScroll.value = typeof window !== 'undefined' && 'IntersectionObserver' in window

  if (supportsInfiniteScroll.value) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!userHasScrolled.value) continue
            void loadMore()
          }
        }
      },
      {
        root: null,
        rootMargin: '220px 0px',
        threshold: 0,
      },
    )
  }

  window.addEventListener('scroll', onWindowScroll, { passive: true })

  error.value = ''

  try {
    await feedStore.fetchFeed()
  } catch {
    error.value = 'Nao foi possivel carregar o feed.'
  }
})

async function loadMore() {
  if (!canLoadMore.value || loadingMore.value || feedStore.loading) return

  loadingMore.value = true
  try {
    await feedStore.loadMoreFeed(feedStore.nextCursor)
  } catch {
    error.value = 'Nao foi possivel carregar mais posts.'
  } finally {
    loadingMore.value = false
  }
}

watch(
  [canLoadMore, infiniteSentinel, supportsInfiniteScroll],
  async ([hasMore, sentinel, supports]) => {
    if (!observer) return

    observer.disconnect()

    if (!supports || !hasMore || !sentinel) return

    await nextTick()
    observer.observe(sentinel)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll)
  observer?.disconnect()
  observer = null
})
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

    <div
      v-if="supportsInfiniteScroll && canLoadMore"
      ref="infiniteSentinel"
      class="infinite-sentinel"
      aria-hidden="true"
    />

    <article v-if="loadingMore" class="card-shell p-3 loading-more-card" aria-live="polite">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Carregando mais posts...</span>
    </article>

    <button
      v-else-if="!supportsInfiniteScroll && canLoadMore"
      class="btn btn-outline-secondary load-more-btn"
      type="button"
      @click="loadMore"
    >
      Carregar mais
    </button>
  </section>
</template>

<style scoped>
.infinite-sentinel {
  width: 100%;
  height: 2px;
}

.loading-more-card {
  align-self: center;
  width: min(340px, 100%);
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
}

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
