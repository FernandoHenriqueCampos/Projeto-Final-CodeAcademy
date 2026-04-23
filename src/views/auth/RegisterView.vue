<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/modules/auth'
import { mapBackendErrors } from '@/utils/errors'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

async function onSubmit() {
  errors.value = {}
  loading.value = true

  try {
    await authStore.register(form)
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
    <h1 class="h3 fw-bold mb-1">Cadastro</h1>
    <p class="text-muted-app mb-4">Crie sua conta para entrar no feed.</p>

    <form class="d-flex flex-column gap-3" @submit.prevent="onSubmit">
      <div>
        <label class="form-label" for="name">Nome</label>
        <input id="name" v-model="form.name" class="form-control" required />
        <p v-if="errors.name" class="inline-error mb-0">{{ errors.name }}</p>
      </div>

      <div>
        <label class="form-label" for="username">Username</label>
        <input id="username" v-model="form.username" class="form-control" required />
        <p v-if="errors.username" class="inline-error mb-0">{{ errors.username }}</p>
      </div>

      <div>
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="form.email" type="email" class="form-control" required />
        <p v-if="errors.email" class="inline-error mb-0">{{ errors.email }}</p>
      </div>

      <div>
        <label class="form-label" for="password">Senha</label>
        <input id="password" v-model="form.password" type="password" class="form-control" required />
        <p v-if="errors.password" class="inline-error mb-0">{{ errors.password }}</p>
      </div>

      <div>
        <label class="form-label" for="password_confirmation">Confirmacao de senha</label>
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          type="password"
          class="form-control"
          required
        />
        <p v-if="errors.password_confirmation" class="inline-error mb-0">
          {{ errors.password_confirmation }}
        </p>
      </div>

      <p v-if="errors.form" class="inline-error mb-0">{{ errors.form }}</p>

      <button class="btn btn-primary-app w-100" type="submit" :disabled="loading">
        {{ loading ? 'Criando...' : 'Criar conta' }}
      </button>
    </form>

    <p class="mb-0 mt-3 text-center text-muted-app">
      Ja tem conta?
      <RouterLink to="/login" class="fw-semibold">Entrar</RouterLink>
    </p>
  </div>
</template>
