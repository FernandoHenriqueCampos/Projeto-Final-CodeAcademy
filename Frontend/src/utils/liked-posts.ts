const LIKED_POSTS_STORAGE_KEY = 'instaclone.liked_posts'

function readRaw(): string[] {
  try {
    const value = localStorage.getItem(LIKED_POSTS_STORAGE_KEY)
    if (!value) return []

    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => String(item))
  } catch {
    return []
  }
}

function writeRaw(ids: string[]) {
  localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export function getLikedPostIds(): Set<string> {
  return new Set(readRaw())
}

export function isPostLikedLocally(postId: string | number): boolean {
  const id = String(postId)
  return getLikedPostIds().has(id)
}

export function markPostLikedLocally(postId: string | number) {
  const id = String(postId)
  const current = readRaw()

  if (!current.includes(id)) {
    current.push(id)
    writeRaw(current)
  }
}

export function markPostUnlikedLocally(postId: string | number) {
  const id = String(postId)
  const filtered = readRaw().filter((item) => item !== id)
  writeRaw(filtered)
}
