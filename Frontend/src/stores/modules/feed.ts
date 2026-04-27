import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  addCommentRequest,
  createPostRequest,
  deletePostRequest,
  fetchFeedRequest,
  likePostRequest,
  unlikePostRequest,
  updatePostRequest,
} from '@/services/modules/feed'
import { useAuthStore } from '@/stores/modules/auth'
import {
  getLikedPostIds,
  markPostLikedLocally,
  markPostUnlikedLocally,
} from '@/utils/liked-posts'
import { normalizePost } from '@/utils/post'

export const useFeedStore = defineStore('feed', () => {
  const authStore = useAuthStore()
  const postsById = ref<Record<string, any>>({})
  const orderedIds = ref<Array<string>>([])
  const nextCursor = ref<string | null>(null)
  const loading = ref(false)

  const posts = computed(() => orderedIds.value.map((id) => postsById.value[id]).filter(Boolean))

  function extractFeedItems(payload: any): any[] {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    return []
  }

  function extractNextCursor(payload: any): string | null {
    const cursorValue =
      payload?.next_cursor ??
      payload?.nextCursor ??
      payload?.cursor ??
      payload?.data?.next_cursor ??
      payload?.data?.nextCursor ??
      payload?.data?.cursor

    if (cursorValue === undefined || cursorValue === null || cursorValue === '') {
      return null
    }

    return String(cursorValue)
  }

  function upsertPosts(items: any[]) {
    const viewerId = authStore.user?.id ?? null
    const likedPostIds = getLikedPostIds()

    for (const item of items) {
      const normalized = normalizePost(item, { viewerId, likedPostIds })
      const id = String(normalized.id)
      postsById.value[id] = normalized

      if (!orderedIds.value.includes(id)) {
        orderedIds.value.push(id)
      }
    }
  }

  function resetFeed() {
    postsById.value = {}
    orderedIds.value = []
    nextCursor.value = null
  }

  async function fetchFeed() {
    loading.value = true
    try {
      const data = await fetchFeedRequest()
      resetFeed()
      upsertPosts(extractFeedItems(data))
      nextCursor.value = extractNextCursor(data)
      return data
    } finally {
      loading.value = false
    }
  }

  async function loadMoreFeed(cursor?: string | null) {
    const data = await fetchFeedRequest(cursor ?? nextCursor.value)
    upsertPosts(extractFeedItems(data))
    nextCursor.value = extractNextCursor(data)
    return data
  }

  async function toggleLike(postId: string | number) {
    const id = String(postId)
    const post = postsById.value[id]

    if (!post) return

    const wasLiked = Boolean(post.viewer_has_liked)
    post.viewer_has_liked = !wasLiked
    post.likes_count = Math.max(0, Number(post.likes_count ?? 0) + (wasLiked ? -1 : 1))

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

      // Backend can reject duplicate likes; keep UI as liked in this case.
      if (!wasLiked && (status === 409 || status === 422)) {
        post.viewer_has_liked = true
        post.likes_count = Math.max(0, Number(post.likes_count ?? 0) - 1)
        markPostLikedLocally(id)
        return
      }

      post.viewer_has_liked = wasLiked
      post.likes_count = Math.max(0, Number(post.likes_count ?? 0) + (wasLiked ? 1 : -1))
      throw error
    }
  }

  async function addComment(postId: string | number, body: string) {
    const id = String(postId)
    const data = await addCommentRequest(id, body)
    const post = postsById.value[id]

    if (post) {
      post.comments_count = Number(post.comments_count ?? 0) + 1
    }

    return data
  }

  async function createPost(formData: FormData) {
    const data = await createPostRequest(formData)
    const created = normalizePost(data?.post ?? data, {
      viewerId: authStore.user?.id ?? null,
      likedPostIds: getLikedPostIds(),
    })

    if (created?.id) {
      const id = String(created.id)
      postsById.value[id] = created
      orderedIds.value.unshift(id)
    }

    return data
  }

  async function updatePost(postId: string | number, caption: string) {
    const id = String(postId)
    const data = await updatePostRequest(id, { caption })
    const updated = normalizePost(data?.post ?? data, {
      viewerId: authStore.user?.id ?? null,
      likedPostIds: getLikedPostIds(),
    })

    if (updated?.id) {
      postsById.value[String(updated.id)] = updated
    } else if (postsById.value[id]) {
      postsById.value[id] = {
        ...postsById.value[id],
        caption,
      }
    }

    return data
  }

  async function deletePost(postId: string | number) {
    const id = String(postId)
    await deletePostRequest(id)
    delete postsById.value[id]
    orderedIds.value = orderedIds.value.filter((itemId) => itemId !== id)
  }

  return {
    postsById,
    orderedIds,
    nextCursor,
    loading,
    posts,
    fetchFeed,
    loadMoreFeed,
    toggleLike,
    addComment,
    createPost,
    updatePost,
    deletePost,
    resetFeed,
  }
})
