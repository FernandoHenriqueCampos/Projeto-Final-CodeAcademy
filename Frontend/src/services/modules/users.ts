import api from '@/services/api'

async function requestWithFallback(
  attempts: Array<{ method: 'post' | 'delete'; url: string }>,
) {
  let lastError: unknown

  for (const attempt of attempts) {
    try {
      const { data } = await api.request({
        method: attempt.method,
        url: attempt.url,
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

export async function getSuggestionsRequest(page = 1, query = '', perPage = 9) {
  if (query.trim()) {
    const { data } = await api.get('/users/search', {
      params: {
        q: query.trim(),
        page,
        per_page: perPage,
      },
    })
    return data
  }

  const { data } = await api.get('/users/suggestions', {
    params: {
      page,
      per_page: perPage,
    },
  })
  return data
}

export async function getFollowingByViewerRequest(viewerId: number | string, page = 1, perPage = 20) {
  const { data } = await api.get(`/users/${viewerId}/following`, {
    params: {
      page,
      per_page: perPage,
    },
  })
  return data
}

export async function followUserRequest(userId: number | string) {
  return requestWithFallback([
    { method: 'post', url: `/users/${userId}/follow` },
    { method: 'post', url: `/users/${userId}/followers` },
  ])
}

export async function unfollowUserRequest(userId: number | string) {
  return requestWithFallback([
    { method: 'delete', url: `/users/${userId}/follow` },
    { method: 'delete', url: `/users/${userId}/unfollow` },
    { method: 'delete', url: `/users/${userId}/followers` },
  ])
}

export async function getUserByUsernameRequest(username: string) {
  const { data } = await api.get(`/users/${username}`)
  return data
}

export async function getUserPostsRequest(userId: number | string, page = 1) {
  const { data } = await api.get(`/users/${userId}/posts`, { params: { page } })
  return data
}

export async function getFollowersRequest(userId: number | string, page = 1) {
  const { data } = await api.get(`/users/${userId}/followers`, { params: { page } })
  return data
}

export async function getFollowingRequest(userId: number | string, page = 1) {
  const { data } = await api.get(`/users/${userId}/following`, { params: { page } })
  return data
}

export async function isFollowingRequest(userId: number | string) {
  const { data } = await api.get(`/users/${userId}/is-following`)
  return data
}

export async function updateMeRequest(payload: { name: string; username: string; bio: string }) {
  const { data } = await api.put('/users/me', payload)
  return data
}

export async function updateAvatarRequest(formData: FormData) {
  const { data } = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
