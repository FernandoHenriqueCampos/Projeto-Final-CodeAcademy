<script setup lang="ts">
import { reactive, ref } from 'vue'

import { updateAvatarRequest, updateMeRequest } from '@/services/modules/users'
import { useAuthStore } from '@/stores/modules/auth'
import { mapBackendErrors } from '@/utils/errors'

const MAX_NAME = 255
const MAX_USERNAME = 30
const MAX_BIO = 500
const MAX_AVATAR_MB = 2
const USERNAME_REGEX = /^[A-Za-z0-9._]+$/

const authStore = useAuthStore()

const form = reactive({
  name: authStore.user?.name ?? '',
  username: authStore.user?.username ?? '',
  bio: authStore.user?.bio ?? '',
})

const avatarFile = ref<File | null>(null)
const errors = ref<Record<string, string>>({})
const success = ref('')
const loading = ref(false)

function onAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  avatarFile.value = null

  if (!file) return

  if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
    errors.value.avatar = 'Avatar deve ter no maximo 2 MB.'
    target.value = ''
    return
  }

  avatarFile.value = file
}

function validate() {
  const nextErrors: Record<string, string> = {}

  if (form.name.length > MAX_NAME) nextErrors.name = 'Nome ultrapassa 255 caracteres.'
  if (form.username.length > MAX_USERNAME) nextErrors.username = 'Username ultrapassa 30 caracteres.'
  if (!USERNAME_REGEX.test(form.username)) nextErrors.username = 'Username deve conter apenas letras, numeros, ponto e underscore.'
  if (form.bio.length > MAX_BIO) nextErrors.bio = 'Bio ultrapassa 500 caracteres.'

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function onSubmit() {
  success.value = ''
  if (!validate()) return

  loading.value = true

  try {
    const userData = await updateMeRequest({
      name: form.name,
      username: form.username,
      bio: form.bio,
    })

    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('avatar', avatarFile.value)
      await updateAvatarRequest(formData)
    }

    await authStore.fetchMe()
    success.value = userData?.message ?? 'Perfil atualizado com sucesso.'
  } catch (error) {
    errors.value = mapBackendErrors(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="card-shell p-3 p-md-4">
    <h1 class="h5 mb-3">Editar perfil</h1>

    <form class="d-flex flex-column gap-3" @submit.prevent="onSubmit">
      <div>
        <label class="form-label" for="name">Nome</label>
        <input id="name" v-model="form.name" class="form-control" :maxlength="MAX_NAME" required />
        <p v-if="errors.name" class="inline-error mb-0">{{ errors.name }}</p>
      </div>

      <div>
        <label class="form-label" for="username">Username</label>
        <input
          id="username"
          v-model="form.username"
          class="form-control"
          :maxlength="MAX_USERNAME"
          required
        />
        <p v-if="errors.username" class="inline-error mb-0">{{ errors.username }}</p>
      </div>

      <div>
        <label class="form-label" for="bio">Bio</label>
        <textarea id="bio" v-model="form.bio" class="form-control" rows="4" :maxlength="MAX_BIO" />
        <p v-if="errors.bio" class="inline-error mb-0">{{ errors.bio }}</p>
      </div>

      <div>
        <label class="form-label" for="avatar">Avatar</label>
        <input id="avatar" type="file" class="form-control" accept="image/*" @change="onAvatarChange" />
        <p class="text-muted-app small mb-0">Maximo: 2 MB</p>
        <p v-if="errors.avatar" class="inline-error mb-0">{{ errors.avatar }}</p>
      </div>

      <p v-if="errors.form" class="inline-error mb-0">{{ errors.form }}</p>
      <p v-if="success" class="text-success mb-0">{{ success }}</p>

      <button class="btn btn-primary-app" type="submit" :disabled="loading">
        {{ loading ? 'Salvando...' : 'Salvar alteracoes' }}
      </button>
    </form>
  </section>
</template>
