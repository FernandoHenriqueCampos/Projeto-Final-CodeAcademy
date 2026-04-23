<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  addCommentRequest,
  deleteCommentRequest,
  deletePostRequest,
  getPostCommentsRequest,
  getPostRequest,
} from '@/services/modules/feed'
import { useAuthStore } from '@/stores/modules/auth'
import { mapBackendErrors } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const post = ref<any>(null)
const comments = ref<any[]>([])
const commentsPage = ref(1)
const hasMoreComments = ref(true)
const loading = ref(false)
const loadingComments = ref(false)
const commentBody = ref('')
const errors = ref<Record<string, string>>({})

const postId = computed(() => route.params.postId as string)
const canDeletePost = computed(() => post.value?.user_id === authStore.user?.id || post.value?.user?.id === authStore.user?.id)

async function loadPost() {
  loading.value = true
  errors.value = {}

  try {
    const postData = await getPostRequest(postId.value)
    post.value = postData?.post ?? postData

    commentsPage.value = 1
    comments.value = []
    hasMoreComments.value = true
    await loadMoreComments()
  } catch {
    errors.value.form = 'Nao foi possivel carregar o post.'
  } finally {
    loading.value = false
  }
}

async function loadMoreComments() {
  if (!hasMoreComments.value || loadingComments.value) return

  loadingComments.value = true
  try {
    const data = await getPostCommentsRequest(postId.value, commentsPage.value)
    const pageItems = data?.items ?? data?.data ?? []
    comments.value.push(...pageItems)

    const nextPage = data?.next_page ?? data?.nextPage
    if (nextPage) {
      commentsPage.value = Number(nextPage)
    } else {
      hasMoreComments.value = false
    }
  } finally {
    loadingComments.value = false
  }
}

async function addComment() {
  if (!commentBody.value.trim()) return

  try {
    const data = await addCommentRequest(postId.value, commentBody.value.trim())
    comments.value.unshift(data?.comment ?? data)
    commentBody.value = ''
  } catch (error) {
    errors.value = mapBackendErrors(error)
  }
}

async function removeComment(commentId: number | string) {
  await deleteCommentRequest(commentId)
  comments.value = comments.value.filter((item) => item.id !== commentId)
}

async function removePost() {
  await deletePostRequest(postId.value)
  await router.push('/feed')
}

onMounted(() => {
  void loadPost()
})
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <article v-if="loading" class="card-shell p-3">Carregando post...</article>

    <article v-if="post" class="card-shell p-3 p-md-4 d-flex flex-column gap-3">
      <img :src="post.image_url" alt="Post" class="post-image" />
      <p class="mb-0">{{ post.caption }}</p>
      <p class="text-muted-app mb-0">
        {{ post.likes_count ?? 0 }} curtidas · {{ post.comments_count ?? comments.length }} comentarios
      </p>

      <button v-if="canDeletePost" class="btn btn-sm btn-outline-danger align-self-start" type="button" @click="removePost">
        Excluir post
      </button>
    </article>

    <article class="card-shell p-3 p-md-4 d-flex flex-column gap-3">
      <h2 class="h6 mb-0">Comentarios</h2>

      <form class="d-flex gap-2" @submit.prevent="addComment">
        <input v-model="commentBody" class="form-control" placeholder="Escreva um comentario" />
        <button class="btn btn-primary-app" type="submit">Comentar</button>
      </form>

      <p v-if="errors.form" class="inline-error mb-0">{{ errors.form }}</p>

      <article v-for="comment in comments" :key="comment.id" class="border rounded p-2">
        <p class="mb-1 fw-semibold">@{{ comment?.user?.username || 'usuario' }}</p>
        <p class="mb-1">{{ comment.body }}</p>
        <button
          v-if="comment?.user_id === authStore.user?.id || comment?.user?.id === authStore.user?.id"
          class="btn btn-sm btn-outline-danger"
          type="button"
          @click="removeComment(comment.id)"
        >
          Excluir comentario
        </button>
      </article>

      <button
        v-if="hasMoreComments"
        class="btn btn-outline-secondary"
        type="button"
        :disabled="loadingComments"
        @click="loadMoreComments"
      >
        {{ loadingComments ? 'Carregando...' : 'Carregar mais comentarios' }}
      </button>
    </article>
  </section>
</template>

<style scoped>
.post-image {
  width: 100%;
  max-height: 520px;
  object-fit: cover;
  border-radius: 0.85rem;
  border: 1px solid var(--color-border);
}
</style>
