import api from '@/services/api'

export async function fetchFeedRequest(cursor?: string | null) {
  const { data } = await api.get('/feed', {
    params: cursor ? { cursor } : undefined,
  })

  return data
}

export async function likePostRequest(postId: number | string) {
  const { data } = await api.post(`/posts/${postId}/like`)
  return data
}

export async function unlikePostRequest(postId: number | string) {
  const { data } = await api.delete(`/posts/${postId}/unlike`)
  return data
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

export async function deletePostRequest(postId: number | string) {
  const { data } = await api.delete(`/posts/${postId}`)
  return data
}
