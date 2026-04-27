function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'sim'].includes(normalized)) return true
    if (['0', 'false', 'no', 'nao', 'não'].includes(normalized)) return false
  }

  return null
}

const FORUM_MARKER = '[[FORUM_POST]]'

function firstDefined(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key]
    }
  }

  return undefined
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  return []
}

function inferLikedFromCollections(post: Record<string, any>, viewerId?: string | number | null): boolean | null {
  if (!viewerId) return null

  const viewerIdString = String(viewerId)
  const candidateLists = [
    post.likes,
    post.likers,
    post.liked_by,
    post.likedBy,
    post.likes_users,
    post.likesUsers,
    post.users_who_liked,
    post.usersWhoLiked,
    post.user_likes,
    post.userLikes,
    post.liked_user_ids,
    post.likedUserIds,
    post.likes_user_ids,
    post.likesUserIds,
  ]

  for (const listValue of candidateLists) {
    const list = asArray(listValue)

    if (!list.length) continue

    const hasViewer = list.some((entry) => {
      if (entry === null || entry === undefined) return false

      if (typeof entry === 'number' || typeof entry === 'string') {
        return String(entry) === viewerIdString
      }

      if (typeof entry === 'object') {
        const idValue = entry.id ?? entry.user_id ?? entry.userId
        if (idValue !== undefined && idValue !== null) {
          return String(idValue) === viewerIdString
        }
      }

      return false
    })

    if (hasViewer) return true
  }

  return null
}

export function normalizePost(
  post: Record<string, any>,
  options?: { viewerId?: string | number | null; likedPostIds?: Set<string> },
) {
  const normalized = { ...post }
  const rawCaption = String(normalized.caption ?? '')
  const imageUrlRaw = firstDefined(normalized, ['image_url', 'imageUrl', 'image'])
  const hasImageUrl =
    (typeof imageUrlRaw === 'string' && imageUrlRaw.trim().length > 0) ||
    (typeof imageUrlRaw === 'object' &&
      imageUrlRaw !== null &&
      typeof imageUrlRaw.url === 'string' &&
      imageUrlRaw.url.trim().length > 0)

  const likedRaw = firstDefined(normalized, [
    'viewer_has_liked',
    'viewerHasLiked',
    'is_liked',
    'isLiked',
    'liked',
    'has_liked',
    'hasLiked',
    'liked_by_viewer',
    'likedByViewer',
    'user_has_liked',
    'userHasLiked',
    'me_liked',
  ])

  const likesRaw = firstDefined(normalized, [
    'likes_count',
    'likesCount',
    'likes_total',
    'likesTotal',
  ])

  const commentsRaw = firstDefined(normalized, [
    'comments_count',
    'commentsCount',
    'comments_total',
    'commentsTotal',
  ])

  const likedAsBool = toBoolean(likedRaw)
  const likedFromCollections = inferLikedFromCollections(normalized, options?.viewerId)
  const localLiked = options?.likedPostIds?.has(String(normalized.id)) ?? false

  if (localLiked) {
    normalized.viewer_has_liked = true
  } else {
    normalized.viewer_has_liked = likedAsBool ?? likedFromCollections ?? false
  }

  if (Array.isArray(normalized.likes)) {
    normalized.likes_count = normalized.likes.length
  } else {
    normalized.likes_count = Number(likesRaw ?? normalized.likes_count ?? 0)
  }

  if (Array.isArray(normalized.comments)) {
    normalized.comments_count = normalized.comments.length
  } else {
    normalized.comments_count = Number(commentsRaw ?? normalized.comments_count ?? 0)
  }

  const hasForumMarker = rawCaption.includes(FORUM_MARKER)
  if (hasForumMarker) {
    normalized.caption = rawCaption.replace(FORUM_MARKER, '').trim()
  }

  normalized.is_forum_post = hasForumMarker || !hasImageUrl

  return normalized
}
