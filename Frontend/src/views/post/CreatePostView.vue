<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFeedStore } from '@/stores/modules/feed'
import { mapBackendErrors } from '@/utils/errors'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_MB = 5
const MAX_CAPTION = 2200
const FORUM_MARKER = '[[FORUM_POST]]'

const router = useRouter()
const feedStore = useFeedStore()

const file = ref<File | null>(null)
const previewUrl = ref('')
const caption = ref('')
const loading = ref(false)
const publicationType = ref<'post' | 'forum'>('post')
const errors = ref<Record<string, string>>({})
const cropCanvas = ref<HTMLCanvasElement | null>(null)
const sourceImage = ref<HTMLImageElement | null>(null)
const cropZoom = ref(1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const draggingCrop = ref(false)
const dragPointerId = ref<number | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartOffsetX = ref(0)
const dragStartOffsetY = ref(0)

const charsLeft = computed(() => MAX_CAPTION - caption.value.length)
const canSubmit = computed(() => {
  if (!caption.value.trim()) return false
  if (publicationType.value === 'post') return Boolean(file.value)
  return true
})

function createForumPlaceholderFile() {
  // 1x1 transparent PNG
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5lp7sAAAAASUVORK5CYII='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], 'forum-placeholder.png', { type: 'image/png' })
}

function resetCrop() {
  cropZoom.value = 1
  cropOffsetX.value = 0
  cropOffsetY.value = 0
}

function getCropMetrics(image: HTMLImageElement) {
  const width = image.naturalWidth
  const height = image.naturalHeight
  const minSide = Math.min(width, height)
  const safeZoom = Math.max(1, Number(cropZoom.value) || 1)
  const cropSize = minSide / safeZoom
  const maxOffsetX = Math.max(0, (width - cropSize) / 2)
  const maxOffsetY = Math.max(0, (height - cropSize) / 2)

  return { width, height, cropSize, maxOffsetX, maxOffsetY }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateCropRect(image: HTMLImageElement) {
  const { width, height, cropSize, maxOffsetX, maxOffsetY } = getCropMetrics(image)

  const centerX = width / 2 + (cropOffsetX.value / 100) * maxOffsetX
  const centerY = height / 2 + (cropOffsetY.value / 100) * maxOffsetY
  const sx = clamp(centerX - cropSize / 2, 0, width - cropSize)
  const sy = clamp(centerY - cropSize / 2, 0, height - cropSize)

  return { sx, sy, cropSize }
}

function drawCropPreview() {
  const canvas = cropCanvas.value
  const image = sourceImage.value
  if (!canvas || !image) return

  const size = Math.max(220, Math.floor(canvas.clientWidth || 360))
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { sx, sy, cropSize } = calculateCropRect(image)
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, size, size)
}

function onCropPointerDown(event: PointerEvent) {
  if (!sourceImage.value) return
  draggingCrop.value = true
  dragPointerId.value = event.pointerId
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartOffsetX.value = cropOffsetX.value
  dragStartOffsetY.value = cropOffsetY.value
  ;(event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId)
}

function onCropPointerMove(event: PointerEvent) {
  if (!draggingCrop.value || dragPointerId.value !== event.pointerId || !sourceImage.value) return

  const image = sourceImage.value
  const canvas = cropCanvas.value
  const previewSize = Math.max(220, Math.floor(canvas?.clientWidth || 360))
  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value
  const { cropSize, maxOffsetX, maxOffsetY } = getCropMetrics(image)
  const sourceDeltaX = (deltaX * cropSize) / previewSize
  const sourceDeltaY = (deltaY * cropSize) / previewSize

  if (maxOffsetX > 0) {
    const deltaPercentX = (sourceDeltaX / maxOffsetX) * 100
    cropOffsetX.value = clamp(dragStartOffsetX.value - deltaPercentX, -100, 100)
  } else {
    cropOffsetX.value = 0
  }

  if (maxOffsetY > 0) {
    const deltaPercentY = (sourceDeltaY / maxOffsetY) * 100
    cropOffsetY.value = clamp(dragStartOffsetY.value - deltaPercentY, -100, 100)
  } else {
    cropOffsetY.value = 0
  }
}

function onCropPointerUp(event: PointerEvent) {
  if (dragPointerId.value !== event.pointerId) return
  draggingCrop.value = false
  dragPointerId.value = null
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image-load-error'))
    image.src = url
  })
}

async function createCroppedImageFile(originalFile: File) {
  const image = sourceImage.value
  if (!image) return originalFile

  const canvas = document.createElement('canvas')
  const outputSize = 1080
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return originalFile

  const { sx, sy, cropSize } = calculateCropRect(image)
  ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) return originalFile

  const baseName = originalFile.name.replace(/\.[^.]+$/, '') || 'post-image'
  return new File([blob], `${baseName}-crop.jpg`, { type: 'image/jpeg' })
}

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  previewUrl.value = ''
  sourceImage.value = null
}

async function onSelectFile(event: Event) {
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

  try {
    sourceImage.value = await loadImage(previewUrl.value)
    resetCrop()
    requestAnimationFrame(() => drawCropPreview())
  } catch {
    errors.value.image = 'Nao foi possivel processar essa imagem.'
    file.value = null
    target.value = ''
    clearPreview()
  }
}

function setPublicationType(type: 'post' | 'forum') {
  publicationType.value = type
  errors.value = {}

  if (type === 'forum') {
    file.value = null
    clearPreview()
    resetCrop()
  }
}

async function publishPost() {
  loading.value = true

  try {
    const trimmedCaption = caption.value.trim()
    const isForumPost = !file.value
    const finalCaption = isForumPost ? `${FORUM_MARKER}\n${trimmedCaption}` : trimmedCaption

    const formData = new FormData()
    const imageFile =
      publicationType.value === 'forum' || !file.value
        ? createForumPlaceholderFile()
        : await createCroppedImageFile(file.value)
    formData.append('image', imageFile)
    formData.append('caption', finalCaption)

    await feedStore.createPost(formData)
    await router.push('/feed')
  } catch (error) {
    errors.value = mapBackendErrors(error)
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  errors.value = {}

  if (!caption.value.trim()) {
    errors.value.form = 'A legenda e obrigatoria.'
    return
  }

  if (publicationType.value === 'post' && !file.value) {
    errors.value.form = 'Selecione uma imagem para criar um post.'
    return
  }

  const trimmedCaption = caption.value.trim()
  const isForumPost = publicationType.value === 'forum'
  const finalCaption = isForumPost ? `${FORUM_MARKER}\n${trimmedCaption}` : trimmedCaption

  if (finalCaption.length > MAX_CAPTION) {
    errors.value.form = 'Legenda muito longa para publicar esse tipo de post.'
    return
  }

  await publishPost()
}

onBeforeUnmount(() => {
  clearPreview()
})

watch([cropZoom, cropOffsetX, cropOffsetY], () => {
  drawCropPreview()
})
</script>

<template>
  <section class="card-shell p-3 p-md-4">
    <h1 class="h5 mb-3">Criar post</h1>

    <form class="d-flex flex-column gap-3" @submit.prevent="onSubmit">
      <div>
        <label class="form-label d-block">Tipo de publicacao</label>
        <div class="type-switcher" role="tablist" aria-label="Tipo de publicacao">
          <button
            class="type-tab"
            :class="{ active: publicationType === 'post' }"
            type="button"
            @click="setPublicationType('post')"
          >
            Post
          </button>
          <button
            class="type-tab"
            :class="{ active: publicationType === 'forum' }"
            type="button"
            @click="setPublicationType('forum')"
          >
            Forum
          </button>
        </div>
      </div>

      <div v-if="publicationType === 'post'">
        <label class="form-label" for="image">Imagem</label>
        <input
          id="image"
          type="file"
          class="form-control"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          @change="onSelectFile"
        />
        <small class="text-muted-app d-block mt-1">Obrigatoria para publicacao do tipo post.</small>
        <p v-if="errors.image" class="inline-error mb-0">{{ errors.image }}</p>
      </div>

      <article v-else class="forum-helper card-shell p-3">
        <p class="forum-helper-kicker mb-1">Modo Forum</p>
        <p class="text-muted-app mb-0">Essa publicacao sera criada como topico de discussao, sem imagem.</p>
      </article>

      <div v-if="previewUrl && publicationType === 'post'" class="crop-editor">
        <div>
          <p class="crop-label mb-1">Enquadramento</p>
          <div
            class="crop-stage"
            :class="{ dragging: draggingCrop }"
            @pointerdown="onCropPointerDown"
            @pointermove="onCropPointerMove"
            @pointerup="onCropPointerUp"
            @pointercancel="onCropPointerUp"
          >
            <canvas ref="cropCanvas" class="preview"></canvas>
            <div class="crop-grid" aria-hidden="true"></div>
          </div>
          <small class="text-muted-app d-block mt-2">Arraste a imagem para mover dentro da moldura.</small>
        </div>

        <div class="d-flex flex-column gap-2">
          <label class="form-label mb-0" for="crop-zoom">Zoom</label>
          <input id="crop-zoom" v-model.number="cropZoom" type="range" min="1" max="3" step="0.01" class="form-range" />

          <button class="btn btn-sm btn-outline-secondary align-self-start" type="button" @click="resetCrop">
            Resetar enquadramento
          </button>
        </div>
      </div>

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
        {{ loading ? 'Publicando...' : publicationType === 'forum' ? 'Publicar no forum' : 'Publicar post' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.type-switcher {
  display: inline-flex;
  gap: 0.45rem;
}

.type-tab {
  border: 1px solid var(--color-segment-border);
  background: var(--color-segment-bg);
  color: var(--color-segment-text);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', 'Consolas', monospace;
  padding: 0.38rem 0.8rem;
}

.type-tab.active {
  border-color: var(--color-segment-active-border);
  background: var(--color-segment-active-bg);
  color: var(--color-segment-active-text);
}

.preview {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1 / 1;
  border-radius: 0.85rem;
  border: 1px solid var(--color-border);
  background: var(--color-crop-preview-bg);
}

.crop-stage {
  position: relative;
  display: inline-block;
  width: min(100%, 420px);
  border-radius: 0.85rem;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}

.crop-stage.dragging {
  cursor: grabbing;
}

.crop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid var(--color-crop-grid-line);
  background:
    linear-gradient(to right, transparent 33.33%, var(--color-crop-grid-line) 33.33%, var(--color-crop-grid-line) 34%, transparent 34%, transparent 66.66%, var(--color-crop-grid-line) 66.66%, var(--color-crop-grid-line) 67%, transparent 67%),
    linear-gradient(to bottom, transparent 33.33%, var(--color-crop-grid-line) 33.33%, var(--color-crop-grid-line) 34%, transparent 34%, transparent 66.66%, var(--color-crop-grid-line) 66.66%, var(--color-crop-grid-line) 67%, transparent 67%);
}

.crop-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.crop-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-crop-label);
  font-family: 'IBM Plex Mono', monospace;
}

.forum-helper {
  border-color: var(--color-forum-panel-border);
  background:
    linear-gradient(180deg, var(--color-forum-panel-grad-top), var(--color-forum-panel-grad-bottom)),
    var(--color-forum-panel-bg);
}

.forum-helper-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-forum-kicker);
  font-family: 'IBM Plex Mono', monospace;
}

@media (min-width: 900px) {
  .crop-editor {
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
