import api from '@/services/api'

export async function getSuggestionsRequest(page = 1) {
  const { data } = await api.get('/users/suggestions', { params: { page } })
  return data
}

export async function getFollowingByViewerRequest(viewerId: number | string, page = 1) {
  const { data } = await api.get(`/users/${viewerId}/following`, { params: { page } })
  return data
}

export async function followUserRequest(userId: number | string) {
  const { data } = await api.post(`/users/${userId}/follow`)
  return data
}

export async function unfollowUserRequest(userId: number | string) {
  const { data } = await api.delete(`/users/${userId}/unfollow`)
  return data
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
