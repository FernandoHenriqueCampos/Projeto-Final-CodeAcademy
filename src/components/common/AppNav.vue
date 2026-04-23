<script setup lang="ts">
const items = [
  { label: 'Home', to: '/feed' },
  { label: 'Buscar', to: '/descobrir' },
  { label: 'Criar', to: '/criar' },
  { label: 'Perfil', to: '/perfil' },
]
</script>

<template>
  <div>
    <aside class="d-none d-md-flex app-sidebar card-shell">
      <h1 class="h4 fw-bold mb-4">InstaClone</h1>
      <nav class="d-flex flex-column gap-2">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-item-app"
          active-class="active"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <nav class="d-md-none mobile-nav card-shell">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item-mobile"
        active-class="active"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 1rem;
  min-width: 220px;
  height: fit-content;
  padding: 1.25rem;
}

.nav-item-app {
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  color: var(--color-muted);
  font-weight: 600;
}

.nav-item-app.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.mobile-nav {
  position: fixed;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 0.45rem;
}

.nav-item-mobile {
  text-align: center;
  font-size: 0.86rem;
  color: var(--color-muted);
  border-radius: 0.65rem;
  padding: 0.5rem 0;
}

.nav-item-mobile.active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-weight: 700;
}
</style>
