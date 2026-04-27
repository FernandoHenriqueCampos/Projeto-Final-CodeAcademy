<script setup lang="ts">
const items = [
  { label: 'Timeline', hint: 'Home', to: '/feed', short: '⌂' },
  { label: 'Discover', hint: 'Explore', to: '/descobrir', short: '⌕' },
  { label: 'Launch', hint: 'New Post', to: '/criar', short: '+' },
  { label: 'Profile', hint: 'Me', to: '/perfil', short: '◎' },
]
</script>

<template>
  <div>
    <aside class="d-none d-md-flex app-sidebar card-shell">
      <p class="section-kicker mb-2"><span class="dot-accent"></span> Navigation</p>
      <h1 class="h4 fw-bold mb-3 font-title">CODENET</h1>
      <p class="sidebar-subtitle text-muted-app mb-4">Painel principal</p>

      <nav class="d-flex flex-column gap-2 mb-4">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-item-app"
          active-class="active"
        >
          <span class="symbol">{{ item.short }}</span>
          <span class="label-wrap">
            <span class="label-text">{{ item.label }}</span>
            <span class="hint-text">{{ item.hint }}</span>
          </span>
        </RouterLink>
      </nav>

      <RouterLink to="/criar" class="quick-action">
        <span class="symbol">✦</span>
        Criar novo post
      </RouterLink>
    </aside>

    <nav class="d-md-none mobile-nav card-shell">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item-mobile"
        active-class="active"
        :title="item.label"
      >
        {{ item.short }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: sticky;
  top: 1rem;
  min-width: 280px;
  width: 280px;
  max-width: 280px;
  height: fit-content;
  padding: 1.2rem 1rem 1rem;
  overflow: hidden;
}

.sidebar-subtitle {
  font-size: 0.88rem;
  margin-left: 0.1rem;
}

.nav-item-app {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0.8rem;
  border-radius: 0.7rem;
  color: var(--color-muted);
  font-weight: 700;
  border: 1px solid #202b3f;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.86rem;
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease, transform 150ms ease;
}

.nav-item-app:hover {
  transform: translateX(2px);
  color: #e8efff;
  border-color: #3a4f70;
}

.label-wrap {
  display: flex;
  flex-direction: column;
  line-height: 1.18;
  min-width: 0;
}

.label-text {
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  color: #8c9ab6;
}

.symbol {
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 0.45rem;
  display: inline-grid;
  place-items: center;
  font-size: 0.86rem;
  border: 1px solid #32435f;
  color: #d7e3ff;
  background: #111a29;
}

.nav-item-app.active {
  background: #141d2d;
  color: #f1f5ff;
  border-color: #92b4ff;
}

.nav-item-app.active .symbol {
  border-color: #9ebcff;
  background: #1a2740;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #3a4e72;
  border-radius: 0.7rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  background: #111a29;
  color: #ecf2ff;
  white-space: nowrap;
}

.quick-action:hover {
  border-color: #95b6ff;
  background: #17243b;
}

.mobile-nav {
  position: fixed;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 0.42rem;
}

.nav-item-mobile {
  text-align: center;
  font-size: 1rem;
  color: var(--color-muted);
  border-radius: 0.6rem;
  padding: 0.55rem 0;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

.nav-item-mobile.active {
  color: #f3f6ff;
  background: #141d2d;
  font-weight: 700;
}
</style>
