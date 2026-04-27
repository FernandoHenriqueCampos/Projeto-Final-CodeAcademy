<script setup lang="ts">
defineProps<{
  user: Record<string, any>
  isFollowing: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <article class="card-shell p-3 d-flex align-items-center justify-content-between gap-3 follow-card">
    <RouterLink
      class="d-flex align-items-center gap-2"
      :to="`/perfil${user?.is_self ? '' : `?user=${user?.username}`}`"
    >
      <img :src="user?.avatar_url || 'https://placehold.co/44x44?text=%20'" alt="Avatar" class="avatar" />
      <div>
        <p class="mb-0 fw-semibold">{{ user?.name || user?.username }}</p>
        <small class="text-muted-app">@{{ user?.username }}</small>
      </div>
    </RouterLink>

    <button class="btn btn-sm fw-bold" :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary-app'" type="button" :disabled="loading" @click="emit('toggle')">
      {{ isFollowing ? 'Seguindo' : 'Seguir' }}
    </button>
  </article>
</template>

<style scoped>
.follow-card {
  border-color: #d2dbee;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--color-border);
}
</style>
