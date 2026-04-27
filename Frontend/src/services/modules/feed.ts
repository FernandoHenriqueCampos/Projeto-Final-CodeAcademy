import api from '@/services/api'

async function requestWithFallback(
  attempts: Array<{ method: 'post' | 'delete' | 'put' | 'patch'; url: string; data?: any }>,
) {
  let lastError: unknown

  for (const attempt of attempts) {
    try {
      const { data } = await api.request({
        method: attempt.method,
        url: attempt.url,
        data: attempt.data,
      })
      return data
    } catch (error: any) {
      const status = Number(error?.response?.status ?? 0)
      const shouldTryNext = status === 404 || status === 405

      if (!shouldTryNext) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError
}

export async function fetchFeedRequest(cursor?: string | null, perPage?: number) {
  const params: Record<string, string | number> = {}

  if (cursor) {
    params.cursor = cursor
  }

  if (typeof perPage === 'number' && Number.isFinite(perPage) && perPage > 0) {
    params.per_page = Math.floor(perPage)
  }

  const { data } = await api.get('/feed', {
    params: Object.keys(params).length ? params : undefined,
  })

  return data
}

export async function likePostRequest(postId: number | string) {
  return requestWithFallback([
    { method: 'post', url: `/posts/${postId}/like` },
    { method: 'post', url: `/posts/${postId}/likes` },
  ])
}

export async function unlikePostRequest(postId: number | string) {
  return requestWithFallback([
    { method: 'delete', url: `/posts/${postId}/unlike` },
    { method: 'delete', url: `/posts/${postId}/like` },
    { method: 'delete', url: `/posts/${postId}/likes` },
  ])
}

export async function addCommentRequest(postId: number | string, body: string) {
  const { data } = await api.post(`/posts/${postId}/comments`, { body })
  return data
}

export async function createPostRequest(formData: FormData) {
  const { data } = await api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getPostRequest(postId: number | string) {
  const { data } = await api.get(`/posts/${postId}`)
  return data
}

export async function getPostCommentsRequest(postId: number | string, page = 1) {
  const { data } = await api.get(`/posts/${postId}/comments`, { params: { page } })
  return data
}

export async function deleteCommentRequest(commentId: number | string) {
  const { data } = await api.delete(`/comments/${commentId}`)
  return data
}

export async function updateCommentRequest(commentId: number | string, body: string) {
  return requestWithFallback([
    { method: 'patch', url: `/comments/${commentId}`, data: { body } },
    { method: 'put', url: `/comments/${commentId}`, data: { body } },
    { method: 'post', url: `/comments/${commentId}/update`, data: { body } },
  ])
}

export async function deletePostRequest(postId: number | string) {
  const { data } = await api.delete(`/posts/${postId}`)
  return data
}

export async function updatePostRequest(postId: number | string, payload: { caption: string }) {
  return requestWithFallback([
    { method: 'put', url: `/posts/${postId}`, data: payload },
    { method: 'patch', url: `/posts/${postId}`, data: payload },
    { method: 'post', url: `/posts/${postId}/update`, data: payload },
  ])
}
