<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="auth-layout container py-5">
    <div class="auth-card card-shell mx-auto p-4 p-md-5">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </div>
  </main>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 520px;
}
</style>
