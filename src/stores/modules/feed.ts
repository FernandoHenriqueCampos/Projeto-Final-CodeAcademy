import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  addCommentRequest,
  createPostRequest,
  fetchFeedRequest,
  likePostRequest,
  unlikePostRequest,
} from '@/services/modules/feed'

export const useFeedStore = defineStore('feed', () => {
  const postsById = ref<Record<string, any>>({})
  const orderedIds = ref<Array<string>>([])
  const nextCursor = ref<string | null>(null)
  const loading = ref(false)

  const posts = computed(() => orderedIds.value.map((id) => postsById.value[id]).filter(Boolean))

  function upsertPosts(items: any[]) {
    for (const item of items) {
      const id = String(item.id)
      postsById.value[id] = item

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
      upsertPosts(data?.items ?? [])
      nextCursor.value = data?.next_cursor ?? null
      return data
    } finally {
      loading.value = false
    }
  }

  async function loadMoreFeed(cursor?: string | null) {
    const data = await fetchFeedRequest(cursor ?? nextCursor.value)
    upsertPosts(data?.items ?? [])
    nextCursor.value = data?.next_cursor ?? null
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
      } else {
        await likePostRequest(id)
      }
    } catch (error) {
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
    const created = data?.post ?? data

    if (created?.id) {
      const id = String(created.id)
      postsById.value[id] = created
      orderedIds.value.unshift(id)
    }

    return data
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
    resetFeed,
  }
})
