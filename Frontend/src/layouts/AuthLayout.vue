<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { Moon, Sun } from 'lucide-vue-next'

import { useTheme } from '@/composables/useTheme'

const { activeTheme, toggleTheme } = useTheme()
const themeButtonAriaLabel = computed(() =>
  activeTheme.value === 'dark' ? 'Modo claro' : 'Modo escuro',
)
</script>

<template>
  <main class="auth-layout container py-5">
    <div class="auth-card card-shell mx-auto p-4 p-md-5">
      <button class="theme-toggle-btn auth-theme-btn icon-only" type="button" :aria-label="themeButtonAriaLabel" @click="toggleTheme">
        <Sun v-if="activeTheme === 'dark'" :size="16" aria-hidden="true" />
        <Moon v-else :size="16" aria-hidden="true" />
      </button>
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

.auth-theme-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 3;
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
