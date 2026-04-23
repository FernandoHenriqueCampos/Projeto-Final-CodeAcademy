<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useFeedStore } from '@/stores/modules/feed'
import { timeAgo } from '@/utils/time'

const props = defineProps<{ post: Record<string, any> }>()

const feedStore = useFeedStore()

const comment = ref('')
const commentError = ref('')
const commentLoading = ref(false)

const authorUsername = computed(() => props.post?.user?.username || props.post?.author?.username || 'usuario')
const authorName = computed(() => props.post?.user?.name || props.post?.author?.name || authorUsername.value)
const authorAvatar = computed(() => props.post?.user?.avatar_url || props.post?.author?.avatar_url || '')

async function toggleLike() {
  try {
    await feedStore.toggleLike(props.post.id)
  } catch {
    commentError.value = 'Nao foi possivel atualizar a curtida.'
  }
}

async function submitComment() {
  commentError.value = ''

  if (!comment.value.trim()) {
    commentError.value = 'Digite um comentario.'
    return
  }

  commentLoading.value = true
  try {
    await feedStore.addComment(props.post.id, comment.value.trim())
    comment.value = ''
  } catch {
    commentError.value = 'Nao foi possivel enviar o comentario.'
  } finally {
    commentLoading.value = false
  }
}
</script>

<template>
  <article class="card-shell p-3 p-md-4 d-flex flex-column gap-3">
    <header class="d-flex align-items-center justify-content-between gap-2">
      <RouterLink :to="`/perfil?user=${authorUsername}`" class="d-flex align-items-center gap-2">
        <img
          :src="authorAvatar || 'https://placehold.co/40x40?text=%20'"
          alt="Avatar"
          class="avatar"
        />
        <div>
          <p class="mb-0 fw-semibold">{{ authorName }}</p>
          <small class="text-muted-app">@{{ authorUsername }}</small>
        </div>
      </RouterLink>
      <small class="text-muted-app">{{ timeAgo(post.created_at) }}</small>
    </header>

    <img :src="post.image_url" alt="Post" class="post-image" />

    <div>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="toggleLike">
        {{ post.viewer_has_liked ? 'Descurtir' : 'Curtir' }}
      </button>
      <p class="mb-1 mt-2 fw-semibold">{{ post.likes_count ?? 0 }} curtidas</p>
      <p class="mb-0">{{ post.caption }}</p>
      <RouterLink :to="`/posts/${post.id}`" class="text-muted-app small">
        {{ post.comments_count ?? 0 }} comentarios
      </RouterLink>
    </div>

    <form class="d-flex gap-2" @submit.prevent="submitComment">
      <input
        v-model="comment"
        class="form-control"
        placeholder="Adicione um comentario"
        :disabled="commentLoading"
      />
      <button class="btn btn-primary-app" type="submit" :disabled="commentLoading">Enviar</button>
    </form>

    <p v-if="commentError" class="inline-error mb-0">{{ commentError }}</p>
  </article>
</template>

<style scoped>
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
}

.post-image {
  width: 100%;
  max-height: 520px;
  border-radius: 0.85rem;
  object-fit: cover;
  border: 1px solid var(--color-border);
}
</style>
