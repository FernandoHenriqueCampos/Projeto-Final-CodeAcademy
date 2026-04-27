export function timeAgo(input: string | number | Date): string {
  const date = new Date(input)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'agora'
  if (diffInSeconds < 3600) return `ha ${Math.floor(diffInSeconds / 60)}min`
  if (diffInSeconds < 86400) return `ha ${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `ha ${Math.floor(diffInSeconds / 86400)}d`

  return date.toLocaleDateString('pt-BR')
}
