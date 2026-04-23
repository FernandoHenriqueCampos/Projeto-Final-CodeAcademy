<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useFeedStore } from '@/stores/modules/feed'
import { mapBackendErrors } from '@/utils/errors'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_MB = 5
const MAX_CAPTION = 2200

const router = useRouter()
const feedStore = useFeedStore()

const file = ref<File | null>(null)
const previewUrl = ref('')
const caption = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const charsLeft = computed(() => MAX_CAPTION - caption.value.length)
const canSubmit = computed(() => Boolean(file.value && caption.value.trim()))

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  previewUrl.value = ''
}

function onSelectFile(event: Event) {
  errors.value = {}
  const target = event.target as HTMLInputElement
  const selected = target.files?.[0] ?? null

  if (!selected) {
    file.value = null
    clearPreview()
    return
  }

  if (!ACCEPTED_TYPES.includes(selected.type)) {
    errors.value.image = 'Formato invalido. Use JPG, JPEG, PNG ou WEBP.'
    target.value = ''
    return
  }

  if (selected.size > MAX_FILE_MB * 1024 * 1024) {
    errors.value.image = 'A imagem deve ter no maximo 5 MB.'
    target.value = ''
    return
  }

  file.value = selected
  clearPreview()
  previewUrl.value = URL.createObjectURL(selected)
}

async function onSubmit() {
  errors.value = {}

  if (!canSubmit.value || !file.value) {
    errors.value.form = 'Imagem e legenda sao obrigatorias.'
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('image', file.value)
    formData.append('caption', caption.value.trim())

    await feedStore.createPost(formData)
    await router.push('/feed')
  } catch (error) {
    errors.value = mapBackendErrors(error)
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  clearPreview()
})
</script>

<template>
  <section class="card-shell p-3 p-md-4">
    <h1 class="h5 mb-3">Criar post</h1>

    <form class="d-flex flex-column gap-3" @submit.prevent="onSubmit">
      <div>
        <label class="form-label" for="image">Imagem</label>
        <input
          id="image"
          type="file"
          class="form-control"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          @change="onSelectFile"
        />
        <p v-if="errors.image" class="inline-error mb-0">{{ errors.image }}</p>
      </div>

      <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="preview" />

      <div>
        <label class="form-label" for="caption">Legenda</label>
        <textarea
          id="caption"
          v-model="caption"
          class="form-control"
          rows="5"
          :maxlength="MAX_CAPTION"
        />
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted-app">{{ charsLeft }} caracteres restantes</small>
          <p v-if="errors.caption" class="inline-error mb-0">{{ errors.caption }}</p>
        </div>
      </div>

      <p v-if="errors.form" class="inline-error mb-0">{{ errors.form }}</p>

      <button class="btn btn-primary-app" type="submit" :disabled="!canSubmit || loading">
        {{ loading ? 'Publicando...' : 'Publicar' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.preview {
  width: 100%;
  max-height: 520px;
  object-fit: cover;
  border-radius: 0.85rem;
  border: 1px solid var(--color-border);
}
</style>
