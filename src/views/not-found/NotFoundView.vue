<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/modules/auth'

const authStore = useAuthStore()

const fallbackLink = computed(() => (authStore.token ? '/feed' : '/login'))
const fallbackLabel = computed(() => (authStore.token ? 'Voltar ao feed' : 'Ir para login'))
</script>

<template>
  <main class="container py-5">
    <section class="card-shell p-4 p-md-5 text-center mx-auto" style="max-width: 620px">
      <p class="text-muted-app mb-2">Erro 404</p>
      <h1 class="h3 mb-3">Pagina nao encontrada</h1>
      <p class="text-muted-app mb-4">A rota informada nao existe ou foi removida.</p>
      <RouterLink :to="fallbackLink" class="btn btn-primary-app">{{ fallbackLabel }}</RouterLink>
    </section>
  </main>
</template>
