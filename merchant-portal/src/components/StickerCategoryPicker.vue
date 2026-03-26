<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StickerPreviewModal from './StickerPreviewModal.vue'
import stickerData from '@/data/sticker_urls.json'

interface StickerCategory { category: string; sticker: string[] }
const ALL_CATEGORIES = stickerData as StickerCategory[]

const model = defineModel<string[]>({ default: () => [] })

const search = ref('')
const open = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)

// Preview state
const previewCategory = ref<StickerCategory | null>(null)
const previewAnchorRect = ref<DOMRect | null>(null)
let hidePreviewTimer: ReturnType<typeof setTimeout> | null = null

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return q
    ? ALL_CATEGORIES.filter((c) => c.category.toLowerCase().includes(q))
    : ALL_CATEGORIES
})

function isSelected(name: string) {
  return model.value.includes(name)
}

function toggle(name: string) {
  if (isSelected(name)) {
    model.value = model.value.filter((c) => c !== name)
  } else {
    model.value = [...model.value, name]
  }
}

function remove(name: string) {
  model.value = model.value.filter((c) => c !== name)
}

function onRowMouseenter(cat: StickerCategory, e: MouseEvent) {
  if (hidePreviewTimer) { clearTimeout(hidePreviewTimer); hidePreviewTimer = null }
  previewCategory.value = cat
  previewAnchorRect.value = (e.currentTarget as HTMLElement).getBoundingClientRect()
}

function onRowMouseleave() {
  hidePreviewTimer = setTimeout(() => {
    previewCategory.value = null
    previewAnchorRect.value = null
  }, 120)
}

function onPanelMouseenter() {
  if (hidePreviewTimer) { clearTimeout(hidePreviewTimer); hidePreviewTimer = null }
}

function onPanelMouseleave() {
  hidePreviewTimer = setTimeout(() => {
    previewCategory.value = null
    previewAnchorRect.value = null
  }, 120)
}

function formatLabel(name: string) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function onDocClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClick)
  if (hidePreviewTimer) clearTimeout(hidePreviewTimer)
})
</script>

<template>
  <div class="scp-wrap" ref="containerRef">
    <!-- Search input -->
    <div class="pp-search-row" @click="open = true">
      <svg class="pp-search-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M8 8l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <input
        class="pp-search-input"
        type="text"
        v-model="search"
        placeholder="Search categories…"
        @focus="open = true"
        autocomplete="off"
      />
      <span v-if="model.length" class="pp-badge">{{ model.length }} selected</span>
    </div>

    <!-- Dropdown -->
    <div v-if="open && filtered.length" class="pp-dropdown scp-dropdown">
      <div
        v-for="cat in filtered"
        :key="cat.category"
        class="scp-item"
        :class="{ selected: isSelected(cat.category) }"
        @mousedown.prevent="toggle(cat.category)"
        @mouseenter="onRowMouseenter(cat, $event)"
        @mouseleave="onRowMouseleave"
      >
        <!-- Thumbnail strip: first 4 stickers -->
        <div class="scp-thumbs">
          <img
            v-for="(url, i) in cat.sticker.slice(0, 4)"
            :key="i"
            :src="url"
            class="scp-thumb"
            loading="lazy"
          />
        </div>
        <span class="scp-label">{{ formatLabel(cat.category) }}</span>
        <span class="scp-count">{{ cat.sticker.length }}</span>
        <svg v-if="isSelected(cat.category)" class="scp-check" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.5" fill="var(--card-color, var(--accent))"/>
          <path d="M3.5 6.5l2 2 4-4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="scp-check scp-check--empty" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--border2)" stroke-width="1.2"/>
        </svg>
      </div>
    </div>

    <div v-else-if="open && !filtered.length" class="pp-dropdown pp-empty">
      No categories match "{{ search }}"
    </div>

    <!-- Selected tags -->
    <div v-if="model.length" class="pp-tags">
      <span
        v-for="name in model"
        :key="name"
        class="pp-tag scp-tag"
        @click="remove(name)"
        :title="'Remove ' + formatLabel(name)"
      >
        {{ formatLabel(name) }}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </span>
    </div>

    <!-- Sticker preview modal (hover) -->
    <StickerPreviewModal
      v-if="previewCategory"
      :category="previewCategory.category"
      :stickers="previewCategory.sticker"
      :anchor-rect="previewAnchorRect"
      @mouseenter="onPanelMouseenter"
      @mouseleave="onPanelMouseleave"
    />
  </div>
</template>
