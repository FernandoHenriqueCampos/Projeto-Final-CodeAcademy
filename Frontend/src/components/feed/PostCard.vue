<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { useAuthStore } from '@/stores/modules/auth'
import { useFeedStore } from '@/stores/modules/feed'
import { timeAgo } from '@/utils/time'

const props = defineProps<{ post: Record<string, any> }>()

const FORUM_MARKER = '[[FORUM_POST]]'
const feedStore = useFeedStore()
const authStore = useAuthStore()

const comment = ref('')
const commentError = ref('')
const commentLoading = ref(false)
const imageFailed = ref(false)
const actionLoading = ref(false)
const editing = ref(false)
const editCaption = ref('')

const authorUsername = computed(() => props.post?.user?.username || props.post?.author?.username || 'usuario')
const authorName = computed(() => props.post?.user?.name || props.post?.author?.name || authorUsername.value)
const authorAvatar = computed(() => props.post?.user?.avatar_url || props.post?.author?.avatar_url || '')
const imageUrl = computed(() => {
  const value = props.post?.image_url ?? props.post?.imageUrl ?? props.post?.image?.url
  return typeof value === 'string' && value.trim() ? value : ''
})
const isForumPost = computed(() => Boolean(props.post?.is_forum_post) || !imageUrl.value || imageFailed.value)
const isOwnPost = computed(() => {
  const ownerId = props.post?.user_id ?? props.post?.user?.id ?? props.post?.author?.id
  return String(ownerId ?? '') === String(authStore.user?.id ?? '')
})

watch(
  () => imageUrl.value,
  () => {
    imageFailed.value = false
  },
)

function onImageError() {
  imageFailed.value = true
}

function startEdit() {
  editCaption.value = String(props.post?.caption ?? '')
  commentError.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editCaption.value = ''
}

async function submitEdit() {
  const trimmed = editCaption.value.trim()
  if (!trimmed) {
    commentError.value = 'A legenda nao pode ficar vazia.'
    return
  }

  actionLoading.value = true
  commentError.value = ''
  try {
    const caption = isForumPost.value ? `${FORUM_MARKER}\n${trimmed}` : trimmed
    await feedStore.updatePost(props.post.id, caption)
    editing.value = false
  } catch {
    commentError.value = 'Nao foi possivel editar o post.'
  } finally {
    actionLoading.value = false
  }
}

async function removePost() {
  actionLoading.value = true
  commentError.value = ''
  try {
    await feedStore.deletePost(props.post.id)
  } catch {
    commentError.value = 'Nao foi possivel excluir o post.'
  } finally {
    actionLoading.value = false
  }
}

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
  <article class="card-shell post-card p-3 p-md-4 d-flex flex-column gap-3">
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
      <div class="d-flex align-items-center gap-2">
        <small class="text-muted-app meta-time">{{ timeAgo(post.created_at) }}</small>
        <button
          v-if="isOwnPost && !editing"
          class="btn btn-sm btn-outline-secondary"
          type="button"
          :disabled="actionLoading"
          @click="startEdit"
        >
          Editar
        </button>
        <button
          v-if="isOwnPost"
          class="btn btn-sm btn-outline-danger"
          type="button"
          :disabled="actionLoading"
          @click="removePost"
        >
          Excluir
        </button>
      </div>
    </header>

    <img v-if="!isForumPost" :src="imageUrl" alt="Post" class="post-image" @error="onImageError" />

    <section v-else class="forum-body">
      <p class="forum-kicker mb-1">Discussao</p>
      <p class="mb-0 forum-caption">{{ post.caption }}</p>
    </section>

    <div class="d-flex flex-column gap-2">
      <div class="engagement-row">
        <div class="d-flex align-items-center gap-2">
          <button
            class="like-btn"
            type="button"
            :aria-label="post.viewer_has_liked ? 'Descurtir post' : 'Curtir post'"
            @click="toggleLike"
          >
            <span v-if="post.viewer_has_liked" class="heart-icon liked">&#9829;</span>
            <span v-else class="heart-icon">&#9825;</span>
          </button>
          <span class="meta-chip">{{ post.likes_count ?? 0 }} curtidas</span>
        </div>

        <span class="meta-chip">{{ post.comments_count ?? 0 }} comentarios</span>
      </div>

      <p v-if="!isForumPost && !editing" class="mb-0">{{ post.caption }}</p>
      <form v-if="editing" class="d-flex flex-column gap-2" @submit.prevent="submitEdit">
        <textarea v-model="editCaption" class="form-control" rows="3" :disabled="actionLoading" />
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-outline-secondary btn-sm" type="button" :disabled="actionLoading" @click="cancelEdit">
            Cancelar
          </button>
          <button class="btn btn-primary-app btn-sm" type="submit" :disabled="actionLoading">
            {{ actionLoading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
      <RouterLink :to="`/posts/${post.id}`" class="text-muted-app small">
        Ver comentarios
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
.post-card {
  border-color: #29354b;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
}

.post-image {
  width: 100%;
  max-height: 560px;
  border-radius: 0.95rem;
  object-fit: cover;
  border: 1px solid #28344a;
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

.meta-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.76rem;
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

.engagement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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
