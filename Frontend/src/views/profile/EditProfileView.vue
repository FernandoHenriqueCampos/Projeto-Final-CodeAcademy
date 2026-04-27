<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { updateAvatarRequest, updateMeRequest } from '@/services/modules/users'
import { useAuthStore } from '@/stores/modules/auth'
import { mapBackendErrors } from '@/utils/errors'

const MAX_NAME = 255
const MAX_USERNAME = 30
const MAX_BIO = 500
const MAX_AVATAR_MB = 2
const USERNAME_REGEX = /^[A-Za-z0-9._]+$/
const GITHUB_MARKER_REGEX = /(^|\s)github\s*:\s*([^\s]+)/gi

const authStore = useAuthStore()
const router = useRouter()

function stripGithubMarkers(value: string) {
  return value
    .replace(GITHUB_MARKER_REGEX, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeGithubInput(rawValue: string): { marker: string } | null {
  const value = rawValue.trim().replace(/[),.;]+$/, '')
  if (!value) return null

  if (value.startsWith('@')) {
    const username = value.slice(1).trim()
    if (!username) return null
    return { marker: `https://github.com/${username}` }
  }

  if (!value.includes('.') && !value.includes('/')) {
    return { marker: `https://github.com/${value}` }
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const parsed = new URL(withProtocol)
    const host = parsed.hostname.toLowerCase()
    if (host !== 'github.com' && host !== 'www.github.com') {
      return null
    }

    if (!parsed.pathname || parsed.pathname === '/') {
      return null
    }

    return { marker: parsed.toString() }
  } catch {
    return null
  }
}

function extractGithubFromBio(rawBio: string) {
  const matches = [...rawBio.matchAll(GITHUB_MARKER_REGEX)]
  const firstRaw = matches[0]?.[2] ?? ''
  const normalized = firstRaw ? normalizeGithubInput(firstRaw) : null

  return {
    bioText: stripGithubMarkers(rawBio),
    githubValue: normalized?.marker ?? firstRaw ?? '',
  }
}

function composeBioWithGithub(bioText: string, githubInput: string) {
  const cleanBio = stripGithubMarkers(bioText)
  const githubValue = githubInput.trim()

  if (!githubValue) {
    return { bio: cleanBio, githubError: '' }
  }

  const normalizedGithub = normalizeGithubInput(githubValue)

  if (!normalizedGithub) {
    return {
      bio: cleanBio,
      githubError: 'Informe um GitHub valido (usuario, @usuario ou URL github.com).',
    }
  }

  const githubMarker = `github:${normalizedGithub.marker}`
  const bioWithMarker = cleanBio ? `${cleanBio}\n\n${githubMarker}` : githubMarker

  return { bio: bioWithMarker, githubError: '' }
}

const initialBio = extractGithubFromBio(authStore.user?.bio ?? '')

const form = reactive({
  name: authStore.user?.name ?? '',
  username: authStore.user?.username ?? '',
  bio: initialBio.bioText,
  github: initialBio.githubValue,
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

  const composedBio = composeBioWithGithub(form.bio, form.github)
  if (composedBio.githubError) nextErrors.github = composedBio.githubError
  if (composedBio.bio.length > MAX_BIO) {
    nextErrors.bio = 'Bio ultrapassa 500 caracteres com o link do GitHub.'
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function onSubmit() {
  success.value = ''
  if (!validate()) return

  loading.value = true

  try {
    const composedBio = composeBioWithGithub(form.bio, form.github)
    if (composedBio.githubError) {
      errors.value.github = composedBio.githubError
      return
    }

    const userData = await updateMeRequest({
      name: form.name,
      username: form.username,
      bio: composedBio.bio,
    })

    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('avatar', avatarFile.value)
      await updateAvatarRequest(formData)
    }

    await authStore.fetchMe()
    success.value = userData?.message ?? 'Perfil atualizado com sucesso.'
    await router.push('/perfil')
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
        <label class="form-label" for="github">GitHub</label>
        <input
          id="github"
          v-model="form.github"
          class="form-control"
          placeholder="usuario, @usuario ou github.com/usuario"
          inputmode="url"
        />
        <p class="text-muted-app small mb-0">Esse link aparece separado no perfil com estilo proprio.</p>
        <p v-if="errors.github" class="inline-error mb-0">{{ errors.github }}</p>
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
