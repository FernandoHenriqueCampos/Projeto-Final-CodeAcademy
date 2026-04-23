<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/modules/auth'
import { mapBackendErrors } from '@/utils/errors'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

async function onSubmit() {
  errors.value = {}
  loading.value = true

  try {
    await authStore.login(form)
    await router.push('/feed')
  } catch (error) {
    errors.value = mapBackendErrors(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="h3 fw-bold mb-1">Entrar</h1>
    <p class="text-muted-app mb-4">Acesse sua conta para continuar.</p>

    <form class="d-flex flex-column gap-3" @submit.prevent="onSubmit">
      <div>
        <label for="email" class="form-label">Email</label>
        <input id="email" v-model="form.email" type="email" class="form-control" required />
        <p v-if="errors.email" class="inline-error mb-0">{{ errors.email }}</p>
      </div>

      <div>
        <label for="password" class="form-label">Senha</label>
        <input id="password" v-model="form.password" type="password" class="form-control" required />
        <p v-if="errors.password" class="inline-error mb-0">{{ errors.password }}</p>
      </div>

      <p v-if="errors.form" class="inline-error mb-0">{{ errors.form }}</p>

      <button class="btn btn-primary-app w-100" type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <p class="mb-0 mt-3 text-center text-muted-app">
      Nao tem conta?
      <RouterLink to="/cadastro" class="fw-semibold">Criar conta</RouterLink>
    </p>
  </div>
</template>
