<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  addCommentRequest,
  deleteCommentRequest,
  deletePostRequest,
  getPostCommentsRequest,
  getPostRequest,
  likePostRequest,
  unlikePostRequest,
  updateCommentRequest,
  updatePostRequest,
} from '@/services/modules/feed'
import { useAuthStore } from '@/stores/modules/auth'
import {
  getLikedPostIds,
  markPostLikedLocally,
  markPostUnlikedLocally,
} from '@/utils/liked-posts'
import { normalizePost } from '@/utils/post'
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
const likeLoading = ref(false)
const commentBody = ref('')
const errors = ref<Record<string, string>>({})
const imageFailed = ref(false)
const editingPost = ref(false)
const postCaptionDraft = ref('')
const savingPost = ref(false)
const editingCommentId = ref<string | null>(null)
const commentDraft = ref('')
const savingCommentId = ref<string | null>(null)

const postId = computed(() => route.params.postId as string)
const canDeletePost = computed(() => post.value?.user_id === authStore.user?.id || post.value?.user?.id === authStore.user?.id)
const canEditPost = computed(() => canDeletePost.value)
const postImageUrl = computed(() => {
  const value = post.value?.image_url ?? post.value?.imageUrl ?? post.value?.image?.url
  return typeof value === 'string' && value.trim() ? value : ''
})
const isForumPost = computed(() => Boolean(post.value?.is_forum_post) || !postImageUrl.value || imageFailed.value)
const FORUM_MARKER = '[[FORUM_POST]]'

function onImageError() {
  imageFailed.value = true
}

async function loadPost() {
  loading.value = true
  errors.value = {}

  try {
    const postData = await getPostRequest(postId.value)
    post.value = normalizePost(postData?.post ?? postData, {
      viewerId: authStore.user?.id ?? null,
      likedPostIds: getLikedPostIds(),
    })
    imageFailed.value = false

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

function startEditComment(comment: any) {
  editingCommentId.value = String(comment?.id ?? '')
  commentDraft.value = String(comment?.body ?? '')
  errors.value.form = ''
}

function cancelEditComment() {
  editingCommentId.value = null
  commentDraft.value = ''
}

async function saveCommentEdit(comment: any) {
  const id = String(comment?.id ?? '')
  if (!id) return

  const body = commentDraft.value.trim()
  if (!body) {
    errors.value.form = 'O comentario nao pode ficar vazio.'
    return
  }

  savingCommentId.value = id
  try {
    const data = await updateCommentRequest(id, body)
    const updated = data?.comment ?? data
    comments.value = comments.value.map((item) =>
      String(item?.id ?? '') === id ? { ...item, ...updated, body: updated?.body ?? body } : item,
    )
    cancelEditComment()
  } catch (error) {
    errors.value = mapBackendErrors(error)
    errors.value.form = errors.value.form ?? 'Nao foi possivel editar o comentario.'
  } finally {
    savingCommentId.value = null
  }
}

async function removePost() {
  await deletePostRequest(postId.value)
  await router.push('/feed')
}

function startEditPost() {
  postCaptionDraft.value = String(post.value?.caption ?? '')
  editingPost.value = true
}

function cancelEditPost() {
  editingPost.value = false
  postCaptionDraft.value = ''
}

async function savePostEdit() {
  const trimmed = postCaptionDraft.value.trim()
  if (!trimmed) {
    errors.value.form = 'A legenda nao pode ficar vazia.'
    return
  }

  savingPost.value = true
  try {
    const caption = isForumPost.value ? `${FORUM_MARKER}\n${trimmed}` : trimmed
    const data = await updatePostRequest(postId.value, { caption })
    post.value = normalizePost(data?.post ?? data, {
      viewerId: authStore.user?.id ?? null,
      likedPostIds: getLikedPostIds(),
    })
    editingPost.value = false
  } catch (error) {
    errors.value = mapBackendErrors(error)
    errors.value.form = errors.value.form ?? 'Nao foi possivel editar o post.'
  } finally {
    savingPost.value = false
  }
}

async function toggleLike() {
  if (!post.value || likeLoading.value) return

  likeLoading.value = true
  const wasLiked = Boolean(post.value.viewer_has_liked)
  post.value.viewer_has_liked = !wasLiked
  post.value.likes_count = Math.max(0, Number(post.value.likes_count ?? 0) + (wasLiked ? -1 : 1))

  try {
    if (wasLiked) {
      await unlikePostRequest(postId.value)
      markPostUnlikedLocally(postId.value)
    } else {
      await likePostRequest(postId.value)
      markPostLikedLocally(postId.value)
    }
  } catch (error: any) {
    const status = Number(error?.response?.status ?? 0)

    if (!wasLiked && (status === 409 || status === 422)) {
      post.value.viewer_has_liked = true
      post.value.likes_count = Math.max(0, Number(post.value.likes_count ?? 0) - 1)
      markPostLikedLocally(postId.value)
      return
    }

    post.value.viewer_has_liked = wasLiked
    post.value.likes_count = Math.max(0, Number(post.value.likes_count ?? 0) + (wasLiked ? 1 : -1))
  } finally {
    likeLoading.value = false
  }
}

onMounted(() => {
  void loadPost()
})
</script>

<template>
  <section class="d-flex flex-column gap-3">
    <article v-if="loading" class="card-shell p-3">Carregando post...</article>

    <article v-if="post" class="card-shell p-3 p-md-4 d-flex flex-column gap-3">
      <img v-if="!isForumPost" :src="postImageUrl" alt="Post" class="post-image" @error="onImageError" />
      <section v-else class="forum-body">
        <p class="forum-kicker mb-1">Discussao</p>
        <p v-if="!editingPost" class="mb-0 forum-caption">{{ post.caption }}</p>
      </section>
      <p v-if="!isForumPost && !editingPost" class="mb-0">{{ post.caption }}</p>
      <form v-if="editingPost" class="d-flex flex-column gap-2" @submit.prevent="savePostEdit">
        <textarea v-model="postCaptionDraft" class="form-control" rows="4" :disabled="savingPost" />
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-outline-secondary btn-sm" type="button" :disabled="savingPost" @click="cancelEditPost">
            Cancelar
          </button>
          <button class="btn btn-primary-app btn-sm" type="submit" :disabled="savingPost">
            {{ savingPost ? 'Salvando...' : 'Salvar alteracoes' }}
          </button>
        </div>
      </form>

      <div class="engagement-row">
        <div class="d-flex align-items-center gap-2">
          <button
            class="like-btn"
            type="button"
            :aria-label="post.viewer_has_liked ? 'Descurtir post' : 'Curtir post'"
            :disabled="likeLoading"
            @click="toggleLike"
          >
            <span v-if="post.viewer_has_liked" class="heart-icon liked">&#9829;</span>
            <span v-else class="heart-icon">&#9825;</span>
          </button>
          <span class="meta-chip">{{ post.likes_count ?? 0 }} curtidas</span>
        </div>

        <span class="meta-chip">{{ post.comments_count ?? comments.length }} comentarios</span>
      </div>

      <div v-if="canDeletePost || canEditPost" class="d-flex align-self-start gap-2">
        <button
          v-if="canEditPost && !editingPost"
          class="btn btn-sm btn-outline-secondary"
          type="button"
          @click="startEditPost"
        >
          Editar post
        </button>
        <button v-if="canDeletePost" class="btn btn-sm btn-outline-danger" type="button" @click="removePost">
          Excluir post
        </button>
      </div>
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
        <p v-if="editingCommentId !== String(comment.id)" class="mb-1">{{ comment.body }}</p>

        <form
          v-else
          class="d-flex flex-column gap-2 mb-2"
          @submit.prevent="saveCommentEdit(comment)"
        >
          <textarea
            v-model="commentDraft"
            class="form-control"
            rows="3"
            :disabled="savingCommentId === String(comment.id)"
          />
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              :disabled="savingCommentId === String(comment.id)"
              @click="cancelEditComment"
            >
              Cancelar
            </button>
            <button
              class="btn btn-sm btn-primary-app"
              type="submit"
              :disabled="savingCommentId === String(comment.id)"
            >
              {{ savingCommentId === String(comment.id) ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>

        <div
          v-if="comment?.user_id === authStore.user?.id || comment?.user?.id === authStore.user?.id"
          class="d-flex gap-2"
        >
          <button
            v-if="editingCommentId !== String(comment.id)"
            class="btn btn-sm btn-outline-secondary"
            type="button"
            :disabled="Boolean(savingCommentId)"
            @click="startEditComment(comment)"
          >
            Editar comentario
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            type="button"
            :disabled="savingCommentId === String(comment.id)"
            @click="removeComment(comment.id)"
          >
            Excluir comentario
          </button>
        </div>
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

.forum-body {
  border: 1px solid #2d3b53;
  border-radius: 0.95rem;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgb(143 178 255 / 10%), rgb(143 178 255 / 2%)),
    #0d1522;
}

.forum-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8fb2ff;
  font-family: 'IBM Plex Mono', monospace;
}

.forum-caption {
  white-space: pre-wrap;
}

.engagement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.meta-chip {
  background: #101826;
  color: #c8d6f8;
  border: 1px solid #2b3a54;
  border-radius: 0.55rem;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.23rem 0.58rem;
  font-family: 'IBM Plex Mono', monospace;
}

.like-btn {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid #2b3a54;
  border-radius: 999px;
  background: #0f1725;
  line-height: 1;
  display: inline-grid;
  place-items: center;
}

.heart-icon {
  display: inline-block;
  font-size: 1.2rem;
  color: #c8d6f8;
  transition: transform 120ms ease, color 120ms ease;
}

.heart-icon.liked {
  color: #ff4d6d;
}

.like-btn:hover .heart-icon {
  transform: scale(1.08);
}
</style>
