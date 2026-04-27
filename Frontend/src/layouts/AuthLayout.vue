<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="auth-layout container py-5">
    <div class="auth-card card-shell mx-auto p-4 p-md-5">
      <p class="section-kicker mb-2"><span class="dot-accent"></span> Access Portal</p>
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
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  top: -130px;
  right: -130px;
  border-radius: 999px;
  background: radial-gradient(circle, rgb(143 178 255 / 22%), transparent 65%);
  pointer-events: none;
}
</style>
