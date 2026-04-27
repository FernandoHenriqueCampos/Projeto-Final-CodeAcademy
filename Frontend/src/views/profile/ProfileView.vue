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
import { deletePostRequest, likePostRequest, unlikePostRequest, updatePostRequest } from '@/services/modules/feed'
import { useAuthStore } from '@/stores/modules/auth'
import {
  getLikedPostIds,
  markPostLikedLocally,
  markPostUnlikedLocally,
} from '@/utils/liked-posts'
import { normalizePost } from '@/utils/post'

const route = useRoute()
const authStore = useAuthStore()

const profile = ref<any>(null)
const posts = ref<any[]>([])
const followersCount = ref(0)
const followingCount = ref(0)
const isFollowing = ref(false)
const loading = ref(false)
const error = ref('')
const togglingPostId = ref<string | null>(null)
const failedImageIds = ref<Set<string>>(new Set())
const activePublicationView = ref<'media' | 'forum'>('media')
const editingPostId = ref<string | null>(null)
const editCaption = ref('')
const actionLoadingId = ref<string | null>(null)
const deleteModalPostId = ref<string | null>(null)
const FORUM_MARKER = '[[FORUM_POST]]'

const targetUsername = computed(() => {
  const queryUser = route.query.user
  return typeof queryUser === 'string' && queryUser.trim() ? queryUser : authStore.user?.username
})

const isOwnProfile = computed(() => profile.value?.id === authStore.user?.id)

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

function extractTotal(payload: any, fallback = 0): number {
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

  const itemsLength = extractItems(payload).length
  if (itemsLength > 0) return itemsLength

  const fallbackNumber = Number(fallback)
  return Number.isFinite(fallbackNumber) && fallbackNumber >= 0 ? fallbackNumber : 0
}

function getPostImageUrl(postItem: any): string {
  const value = postItem?.image_url ?? postItem?.imageUrl ?? postItem?.image?.url
  return typeof value === 'string' && value.trim() ? value : ''
}

function isForumGridPost(postItem: any): boolean {
  const id = String(postItem?.id ?? '')
  return Boolean(postItem?.is_forum_post) || !getPostImageUrl(postItem) || failedImageIds.value.has(id)
}

function markImageFailed(postId: string | number) {
  failedImageIds.value.add(String(postId))
}

function isOwnPost(postItem: any): boolean {
  const ownerId = postItem?.user_id ?? postItem?.user?.id ?? postItem?.author?.id
  return String(ownerId ?? '') === String(authStore.user?.id ?? '')
}

function startEdit(postItem: any) {
  const id = String(postItem?.id ?? '')
  if (!id) return
  editingPostId.value = id
  editCaption.value = String(postItem?.caption ?? '')
  error.value = ''
}

function cancelEdit() {
  editingPostId.value = null
  editCaption.value = ''
}

async function saveEdit(postItem: any) {
  const id = String(postItem?.id ?? '')
  if (!id) return

  const trimmed = editCaption.value.trim()
  if (!trimmed) {
    error.value = 'A legenda nao pode ficar vazia.'
    return
  }

  actionLoadingId.value = id
  error.value = ''
  try {
    const caption = isForumGridPost(postItem) ? `${FORUM_MARKER}\n${trimmed}` : trimmed
    const data = await updatePostRequest(id, { caption })
    const updated = normalizePost(data?.post ?? data, {
      viewerId: authStore.user?.id ?? null,
      likedPostIds: getLikedPostIds(),
    })

    posts.value = posts.value.map((item) => (String(item?.id ?? '') === id ? updated : item))
    editingPostId.value = null
    editCaption.value = ''
  } catch {
    error.value = 'Nao foi possivel editar o post.'
  } finally {
    actionLoadingId.value = null
  }
}

function openDeleteModal(postItem: any) {
  deleteModalPostId.value = String(postItem?.id ?? '')
  error.value = ''
}

function closeDeleteModal() {
  if (actionLoadingId.value) return
  deleteModalPostId.value = null
}

async function confirmDeletePost() {
  const id = deleteModalPostId.value
  if (!id) return

  actionLoadingId.value = id
  error.value = ''
  try {
    await deletePostRequest(id)
    posts.value = posts.value.filter((item) => String(item?.id ?? '') !== id)
    failedImageIds.value.delete(id)
    if (editingPostId.value === id) {
      editingPostId.value = null
      editCaption.value = ''
    }
    deleteModalPostId.value = null
  } catch {
    error.value = 'Nao foi possivel excluir o post.'
  } finally {
    actionLoadingId.value = null
  }
}

const mediaPosts = computed(() => posts.value.filter((item) => !isForumGridPost(item)))
const forumPosts = computed(() =>
  posts.value
    .filter((item) => isForumGridPost(item))
    .slice()
    .sort((a, b) => {
      const commentsDiff = Number(b?.comments_count ?? 0) - Number(a?.comments_count ?? 0)
      if (commentsDiff !== 0) return commentsDiff

      const likesDiff = Number(b?.likes_count ?? 0) - Number(a?.likes_count ?? 0)
      if (likesDiff !== 0) return likesDiff

      const dateA = new Date(a?.created_at ?? 0).getTime()
      const dateB = new Date(b?.created_at ?? 0).getTime()
      return dateB - dateA
    }),
)

const mediaPostsCount = computed(() => mediaPosts.value.length)
const forumPostsCount = computed(() => forumPosts.value.length)

function getForumTitle(postItem: any): string {
  const caption = String(postItem?.caption ?? '').trim()
  if (!caption) return 'Discussao sem titulo'
  const firstLine = caption.split('\n').find((line) => line.trim()) ?? caption
  return firstLine.length > 68 ? `${firstLine.slice(0, 68)}...` : firstLine
}

function getForumPreview(postItem: any): string {
  const caption = String(postItem?.caption ?? '').trim()
  if (!caption) return 'Abra para ver os detalhes desta discussao.'
  return caption.length > 190 ? `${caption.slice(0, 190)}...` : caption
}

function normalizeGithubUrl(rawValue: string): { url: string; label: string } | null {
  const value = rawValue.trim().replace(/[),.;]+$/, '')
  if (!value) return null

  if (value.startsWith('@')) {
    const username = value.slice(1)
    if (!username) return null
    return {
      url: `https://github.com/${username}`,
      label: `@${username}`,
    }
  }

  if (!value.includes('.') && !value.includes('/')) {
    return {
      url: `https://github.com/${value}`,
      label: `@${value}`,
    }
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const parsed = new URL(withProtocol)
    if (!parsed.hostname.toLowerCase().includes('github.com')) {
      return null
    }

    return {
      url: parsed.toString(),
      label: parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : 'github.com',
    }
  } catch {
    return null
  }
}

const profilePresentation = computed(() => {
  const rawBio = typeof profile.value?.bio === 'string' ? profile.value.bio : ''
  const githubRegex = /(^|\s)github\s*:\s*([^\s]+)/gi
  const githubMatch = githubRegex.exec(rawBio)
  const github = githubMatch?.[2] ? normalizeGithubUrl(githubMatch[2]) : null

  const bioText = rawBio
    .replace(/(^|\s)github\s*:\s*[^\s]+/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    bioText,
    github,
  }
})

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

    const rawPosts = extractItems(postsData)
    posts.value = rawPosts.map((item: any) =>
      normalizePost(item, {
        viewerId: authStore.user?.id ?? null,
        likedPostIds: getLikedPostIds(),
      }),
    )
    failedImageIds.value = new Set()
    followersCount.value = extractTotal(
      followersData,
      resolvedProfile.followers_count ?? resolvedProfile.followersCount ?? 0,
    )
    followingCount.value = extractTotal(
      followingData,
      resolvedProfile.following_count ?? resolvedProfile.followingCount ?? 0,
    )

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

async function toggleLike(postItem: any) {
  const id = String(postItem?.id ?? '')
  if (!id) return

  togglingPostId.value = id

  const wasLiked = Boolean(postItem.viewer_has_liked)
  postItem.viewer_has_liked = !wasLiked
  postItem.likes_count = Math.max(0, Number(postItem.likes_count ?? 0) + (wasLiked ? -1 : 1))

  try {
    if (wasLiked) {
      await unlikePostRequest(id)
      markPostUnlikedLocally(id)
    } else {
      await likePostRequest(id)
      markPostLikedLocally(id)
    }
  } catch (error: any) {
    const status = Number(error?.response?.status ?? 0)

    if (!wasLiked && (status === 409 || status === 422)) {
      postItem.viewer_has_liked = true
      postItem.likes_count = Math.max(0, Number(postItem.likes_count ?? 0) - 1)
      markPostLikedLocally(id)
      return
    }

    postItem.viewer_has_liked = wasLiked
    postItem.likes_count = Math.max(0, Number(postItem.likes_count ?? 0) + (wasLiked ? 1 : -1))
  } finally {
    togglingPostId.value = null
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
            <p class="section-kicker mb-1"><span class="dot-accent"></span> Dev Profile</p>
            <h1 class="h4 mb-1">{{ profile.name }}</h1>
            <p class="text-muted-app mb-2">@{{ profile.username }}</p>
            <p v-if="profilePresentation.bioText" class="mb-0">{{ profilePresentation.bioText }}</p>
            <a
              v-if="profilePresentation.github"
              class="social-pill mt-2"
              :href="profilePresentation.github.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" class="social-icon">
                <path
                  d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.6c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.56 7.56 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                  fill="currentColor"
                />
              </svg>
              <span>GitHub: {{ profilePresentation.github.label }}</span>
            </a>
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
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h2 class="h6 mb-1">Publicacoes</h2>
          <p class="text-muted-app small mb-0">Alterne entre feed visual e topicos de discussao</p>
        </div>

        <div class="publication-switcher" role="tablist" aria-label="Filtro de publicacoes">
          <button
            class="publication-tab"
            :class="{ active: activePublicationView === 'media' }"
            type="button"
            @click="activePublicationView = 'media'"
          >
            Posts ({{ mediaPostsCount }})
          </button>
          <button
            class="publication-tab"
            :class="{ active: activePublicationView === 'forum' }"
            type="button"
            @click="activePublicationView = 'forum'"
          >
            Debates ({{ forumPostsCount }})
          </button>
        </div>
      </div>

      <div v-if="activePublicationView === 'media'" class="post-grid">
        <article v-for="post in mediaPosts" :key="post.id" class="post-tile">
          <RouterLink :to="`/posts/${post.id}`">
            <img
              v-if="!isForumGridPost(post)"
              :src="getPostImageUrl(post)"
              alt="Post"
              class="grid-image"
              @error="markImageFailed(post.id)"
            />
            <div v-else class="forum-grid-tile">
              <p class="forum-grid-kicker mb-1">Discussao</p>
              <p class="mb-0 forum-grid-caption">{{ post.caption }}</p>
            </div>
          </RouterLink>

          <div class="tile-actions">
            <button
              class="like-btn"
              type="button"
              :aria-label="post.viewer_has_liked ? 'Descurtir post' : 'Curtir post'"
              :disabled="togglingPostId === String(post.id)"
              @click="toggleLike(post)"
            >
              <span v-if="post.viewer_has_liked" class="heart-icon liked">&#9829;</span>
              <span v-else class="heart-icon">&#9825;</span>
            </button>
            <small class="text-muted-app">{{ post.likes_count ?? 0 }} curtidas</small>
            <small class="text-muted-app">{{ post.comments_count ?? 0 }} comentarios</small>
            <button
              v-if="isOwnPost(post)"
              class="btn btn-sm btn-outline-secondary"
              type="button"
              :disabled="actionLoadingId === String(post.id)"
              @click="startEdit(post)"
            >
              Editar
            </button>
            <button
              v-if="isOwnPost(post)"
              class="btn btn-sm btn-outline-danger"
              type="button"
              :disabled="actionLoadingId === String(post.id)"
              @click="openDeleteModal(post)"
            >
              Excluir
            </button>
          </div>

          <form
            v-if="editingPostId === String(post.id)"
            class="d-flex flex-column gap-2"
            @submit.prevent="saveEdit(post)"
          >
            <textarea v-model="editCaption" class="form-control" rows="3" :disabled="actionLoadingId === String(post.id)" />
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="actionLoadingId === String(post.id)" @click="cancelEdit">
                Cancelar
              </button>
              <button class="btn btn-sm btn-primary-app" type="submit" :disabled="actionLoadingId === String(post.id)">
                {{ actionLoadingId === String(post.id) ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </article>
      </div>

      <div v-else class="forum-list">
        <article v-for="post in forumPosts" :key="post.id" class="forum-row">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <RouterLink :to="`/posts/${post.id}`" class="forum-title">
              {{ getForumTitle(post) }}
            </RouterLink>
            <span class="forum-badge">Forum</span>
          </div>

          <p class="forum-preview mb-0">{{ getForumPreview(post) }}</p>

          <div class="forum-meta">
            <button
              class="like-btn"
              type="button"
              :aria-label="post.viewer_has_liked ? 'Descurtir post' : 'Curtir post'"
              :disabled="togglingPostId === String(post.id)"
              @click="toggleLike(post)"
            >
              <span v-if="post.viewer_has_liked" class="heart-icon liked">&#9829;</span>
              <span v-else class="heart-icon">&#9825;</span>
            </button>
            <small class="text-muted-app">{{ post.likes_count ?? 0 }} curtidas</small>
            <small class="text-muted-app">{{ post.comments_count ?? 0 }} comentarios</small>
            <button
              v-if="isOwnPost(post)"
              class="btn btn-sm btn-outline-secondary"
              type="button"
              :disabled="actionLoadingId === String(post.id)"
              @click="startEdit(post)"
            >
              Editar
            </button>
            <button
              v-if="isOwnPost(post)"
              class="btn btn-sm btn-outline-danger"
              type="button"
              :disabled="actionLoadingId === String(post.id)"
              @click="openDeleteModal(post)"
            >
              Excluir
            </button>
            <RouterLink :to="`/posts/${post.id}`" class="forum-open-link">Abrir topico</RouterLink>
          </div>

          <form
            v-if="editingPostId === String(post.id)"
            class="d-flex flex-column gap-2"
            @submit.prevent="saveEdit(post)"
          >
            <textarea v-model="editCaption" class="form-control" rows="3" :disabled="actionLoadingId === String(post.id)" />
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="actionLoadingId === String(post.id)" @click="cancelEdit">
                Cancelar
              </button>
              <button class="btn btn-sm btn-primary-app" type="submit" :disabled="actionLoadingId === String(post.id)">
                {{ actionLoadingId === String(post.id) ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </article>
      </div>

      <p v-if="activePublicationView === 'media' && !mediaPosts.length" class="text-muted-app mb-0 mt-2">
        Nenhum post com imagem encontrado.
      </p>
      <p v-if="activePublicationView === 'forum' && !forumPosts.length" class="text-muted-app mb-0 mt-2">
        Nenhum topico de forum encontrado.
      </p>
    </article>

    <div
      v-if="deleteModalPostId"
      class="confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-post-title"
    >
      <article class="confirm-modal card-shell p-3">
        <h2 id="delete-post-title" class="h6 mb-2">Excluir publicacao?</h2>
        <p class="text-muted-app mb-3">Essa acao nao pode ser desfeita.</p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" type="button" :disabled="Boolean(actionLoadingId)" @click="closeDeleteModal">
            Cancelar
          </button>
          <button class="btn btn-outline-danger" type="button" :disabled="Boolean(actionLoadingId)" @click="confirmDeletePost">
            {{ actionLoadingId ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </article>
    </div>
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

.forum-grid-tile {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  border: 1px solid #334567;
  background:
    linear-gradient(180deg, rgb(143 178 255 / 10%), rgb(143 178 255 / 3%)),
    #0e1623;
  padding: 0.8rem;
  overflow: hidden;
}

.forum-grid-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8fb2ff;
  font-family: 'IBM Plex Mono', monospace;
}

.forum-grid-caption {
  font-size: 0.82rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-tile {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tile-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.like-btn {
  width: 2rem;
  height: 2rem;
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
  font-size: 1.1rem;
  color: #c8d6f8;
  transition: transform 120ms ease, color 120ms ease;
}

.heart-icon.liked {
  color: #ff4d6d;
}

.like-btn:hover .heart-icon {
  transform: scale(1.08);
}

.social-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid #394866;
  border-radius: 999px;
  background: #121a29;
  color: #e6edff;
  font-size: 0.82rem;
  font-family: 'IBM Plex Mono', 'Consolas', monospace;
  transition: border-color 140ms ease, background-color 140ms ease;
}

.social-pill:hover {
  border-color: #8fb2ff;
  background: #172239;
}

.social-icon {
  width: 0.92rem;
  height: 0.92rem;
}

.publication-switcher {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.publication-tab {
  border: 1px solid #344667;
  background: #101726;
  color: #cad9fb;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', 'Consolas', monospace;
  padding: 0.35rem 0.7rem;
  transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease;
}

.publication-tab:hover {
  border-color: #8fb2ff;
  color: #eef3ff;
}

.publication-tab.active {
  border-color: #8fb2ff;
  background: #1a2840;
  color: #f2f6ff;
}

.forum-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.forum-row {
  border: 1px solid #314564;
  border-radius: 0.75rem;
  padding: 0.8rem 0.9rem;
  background:
    linear-gradient(180deg, rgb(143 178 255 / 8%), rgb(143 178 255 / 1%)),
    #0e1622;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.forum-title {
  font-weight: 700;
  color: #edf2ff;
  line-height: 1.3;
}

.forum-title:hover {
  text-decoration: underline;
}

.forum-preview {
  color: #ced9f5;
  font-size: 0.9rem;
  line-height: 1.35;
}

.forum-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.forum-badge {
  border: 1px solid #425983;
  border-radius: 999px;
  padding: 0.18rem 0.45rem;
  font-size: 0.64rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #b8cdfd;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
}

.forum-open-link {
  margin-left: auto;
  font-size: 0.82rem;
  color: #d7e4ff;
  text-decoration: underline;
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(3 6 11 / 70%);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 1050;
}

.confirm-modal {
  width: min(420px, 100%);
}

@media (min-width: 768px) {
  .post-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
