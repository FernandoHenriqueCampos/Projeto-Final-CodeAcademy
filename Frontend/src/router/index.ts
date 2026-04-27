import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/modules/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/feed',
    },
    {
      path: '/',
      component: AuthLayout,
      meta: { requiresGuest: true },
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/LoginView.vue'),
        },
        {
          path: 'cadastro',
          name: 'register',
          component: () => import('@/views/auth/RegisterView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'feed',
          name: 'feed',
          component: () => import('@/views/feed/FeedView.vue'),
        },
        {
          path: 'descobrir',
          name: 'discover',
          component: () => import('@/views/discover/DiscoverView.vue'),
        },
        {
          path: 'criar',
          name: 'create-post',
          component: () => import('@/views/post/CreatePostView.vue'),
        },
        {
          path: 'perfil',
          name: 'profile',
          component: () => import('@/views/profile/ProfileView.vue'),
        },
        {
          path: 'perfil/editar',
          name: 'profile-edit',
          component: () => import('@/views/profile/EditProfileView.vue'),
        },
        {
          path: 'perfil/lista/:type',
          name: 'profile-connections',
          component: () => import('@/views/profile/ConnectionsListView.vue'),
        },
        {
          path: 'posts/:postId',
          name: 'post-details',
          component: () => import('@/views/post/PostDetailsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/not-found/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  authStore.hydrateFromStorage()

  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const requiresGuest = to.matched.some((route) => route.meta.requiresGuest)

  if (authStore.token && !authStore.user && requiresAuth) {
    try {
      await authStore.fetchMe()
    } catch {
      await authStore.logout()
    }
  }

  if (requiresAuth && !authStore.token) {
    return { path: '/login' }
  }

  if (requiresGuest && authStore.token) {
    return { path: '/feed' }
  }

  return true
})

export default router
