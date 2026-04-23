<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'

import AppNav from '@/components/common/AppNav.vue'
import { useAuthStore } from '@/stores/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="container py-3 py-md-4">
    <div class="d-flex align-items-start gap-3 gap-md-4">
      <AppNav />

      <section class="content-area flex-grow-1">
        <header class="card-shell px-3 py-2 px-md-4 py-md-3 mb-3 mb-md-4 d-flex justify-content-between align-items-center">
          <h2 class="h5 mb-0">InstaClone</h2>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="handleLogout">
            Sair
          </button>
        </header>

        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </section>
    </div>
  </div>
</template>

<style scoped>
.content-area {
  width: 100%;
  min-height: 100vh;
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .content-area {
    padding-bottom: 1rem;
  }
}
</style>
