<script setup lang="ts">
const items = [
  {
    label: 'Timeline',
    hint: 'Home',
    to: '/feed',
    iconPath:
      'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-10.5Z',
  },
  {
    label: 'Discover',
    hint: 'Explore',
    to: '/descobrir',
    iconPath:
      'M12 3.5a8.5 8.5 0 1 0 8.5 8.5A8.5 8.5 0 0 0 12 3.5Zm0 3.5a5 5 0 1 1-5 5 5 5 0 0 1 5-5Zm0 3.6-2.1 4.7 4.7-2.1 2.1-4.7Z',
  },
  {
    label: 'Launch',
    hint: 'New Post',
    to: '/criar',
    iconPath:
      'M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z',
  },
  {
    label: 'Profile',
    hint: 'Me',
    to: '/perfil',
    iconPath:
      'M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 2c-4.3 0-7.5 2.2-7.5 5.2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1C19.5 16.2 16.3 14 12 14Z',
  },
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
          <span class="symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="nav-icon">
              <path :d="item.iconPath" />
            </svg>
          </span>
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
        :aria-label="item.label"
        :title="item.label"
      >
        <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true">
          <path :d="item.iconPath" />
        </svg>
        <span class="visually-hidden">{{ item.label }}</span>
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
  border: 1px solid var(--color-nav-border);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.86rem;
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease, transform 150ms ease;
}

.nav-item-app:hover {
  transform: translateX(2px);
  color: var(--color-nav-hover-text);
  border-color: var(--color-nav-hover-border);
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
  color: var(--color-nav-hint);
}

.symbol {
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 0.45rem;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--color-nav-symbol-border);
  color: var(--color-nav-symbol-text);
  background: var(--color-nav-symbol-bg);
}

.nav-icon {
  width: 1rem;
  height: 1rem;
  fill: currentcolor;
}

.nav-item-app.active {
  background: var(--color-nav-active-bg);
  color: var(--color-nav-active-text);
  border-color: var(--color-nav-active-border);
}

.nav-item-app.active .symbol {
  border-color: var(--color-nav-active-symbol-border);
  background: var(--color-nav-active-symbol-bg);
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--color-nav-quick-action-border);
  border-radius: 0.7rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  background: var(--color-nav-quick-action-bg);
  color: var(--color-nav-quick-action-text);
  white-space: nowrap;
}

.quick-action:hover {
  border-color: var(--color-nav-quick-action-hover-border);
  background: var(--color-nav-quick-action-hover-bg);
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
  display: grid;
  place-items: center;
  text-align: center;
  min-height: 2.7rem;
  color: var(--color-muted);
  border-radius: 0.6rem;
  padding: 0.4rem 0;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

.nav-item-mobile .nav-icon {
  width: 1.45rem;
  height: 1.45rem;
}

.nav-item-mobile.active {
  color: var(--color-nav-active-text);
  background: var(--color-nav-active-bg);
  font-weight: 700;
}
</style>
