<script setup lang="ts">
import { onMounted, ref } from 'vue'

import PostCard from '@/components/feed/PostCard.vue'
import { useFeedStore } from '@/stores/modules/feed'

const feedStore = useFeedStore()

const error = ref('')
const loadingMore = ref(false)

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
    <p v-if="error" class="inline-error mb-0">{{ error }}</p>

    <article v-if="feedStore.loading" class="card-shell p-4">Carregando feed...</article>

    <PostCard v-for="post in feedStore.posts" :key="post.id" :post="post" />

    <button
      v-if="feedStore.nextCursor !== null"
      class="btn btn-outline-secondary"
      type="button"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Carregando...' : 'Carregar mais' }}
    </button>
  </section>
</template>
