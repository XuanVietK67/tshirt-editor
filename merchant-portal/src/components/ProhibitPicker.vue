<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { FontFamily } from '@/constants/fontFamilies'
import { CATEGORY_LABELS } from '@/constants/fontFamilies'

const props = defineProps<{
  /** Grouped font list (renders each item in its own typeface) */
  fonts?: FontFamily[]
  /** Flat item list (no grouping, plain text) */
  items?: string[]
  placeholder?: string
}>()

const model = defineModel<string[]>({ default: () => [] })

const search = ref('')
const open = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)

// ── Font mode (grouped) ────────────────────────────────────────
const groupedFonts = computed(() => {
  if (!props.fonts) return new Map<string, FontFamily[]>()
  const q = search.value.toLowerCase().trim()
  const filtered = q
    ? props.fonts.filter((f) => f.name.toLowerCase().includes(q))
    : props.fonts
  const groups = new Map<string, FontFamily[]>()
  for (const font of filtered) {
    const label = CATEGORY_LABELS[font.category]
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(font)
  }
  return groups
})

// ── Flat mode ─────────────────────────────────────────────────
const filteredItems = computed(() => {
  if (!props.items) return []
  const q = search.value.toLowerCase().trim()
  return q ? props.items.filter((i) => i.toLowerCase().includes(q)) : props.items
})

const totalFiltered = computed(() => {
  if (props.fonts) {
    let n = 0
    groupedFonts.value.forEach((v) => (n += v.length))
    return n
  }
  return filteredItems.value.length
})

const emptyMessage = computed(() =>
  search.value ? `No results for "${search.value}"` : 'No items',
)

function isProhibited(name: string) {
  return model.value.includes(name)
}

function toggle(name: string) {
  if (isProhibited(name)) {
    model.value = model.value.filter((f) => f !== name)
  } else {
    model.value = [...model.value, name]
  }
}

function remove(name: string) {
  model.value = model.value.filter((f) => f !== name)
}

function openDropdown() {
  open.value = true
}

function onDocClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div class="pp-wrap" ref="containerRef">
    <!-- Search input -->
    <div class="pp-search-row" @click="openDropdown">
      <svg class="pp-search-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M8 8l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <input
        class="pp-search-input"
        type="text"
        v-model="search"
        :placeholder="placeholder ?? 'Search…'"
        @focus="openDropdown"
        autocomplete="off"
      />
      <span v-if="model.length" class="pp-badge">{{ model.length }} blocked</span>
    </div>

    <!-- Dropdown: font mode (grouped) -->
    <div v-if="open && props.fonts && totalFiltered > 0" class="pp-dropdown">
      <template v-for="[category, fontList] in groupedFonts" :key="category">
        <div class="pp-group-label">{{ category }}</div>
        <div
          v-for="font in fontList"
          :key="font.name"
          class="pp-item"
          :class="{ prohibited: isProhibited(font.name) }"
          @mousedown.prevent="toggle(font.name)"
        >
          <span class="pp-item-name" :style="{ fontFamily: font.name }">{{ font.name }}</span>
          <svg v-if="isProhibited(font.name)" class="pp-item-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <svg v-else class="pp-item-check pp-item-check--empty" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </div>
      </template>
    </div>

    <!-- Dropdown: flat mode -->
    <div v-else-if="open && props.items && totalFiltered > 0" class="pp-dropdown">
      <div
        v-for="item in filteredItems"
        :key="item"
        class="pp-item"
        :class="{ prohibited: isProhibited(item) }"
        @mousedown.prevent="toggle(item)"
      >
        <span class="pp-item-name">{{ item }}</span>
        <svg v-if="isProhibited(item)" class="pp-item-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <svg v-else class="pp-item-check pp-item-check--empty" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="open && totalFiltered === 0" class="pp-dropdown pp-empty">
      {{ emptyMessage }}
    </div>

    <!-- Prohibited tags -->
    <div v-if="model.length" class="pp-tags">
      <span
        v-for="name in model"
        :key="name"
        class="pp-tag"
        @click="remove(name)"
        :title="'Unblock ' + name"
      >
        {{ name }}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </span>
    </div>
  </div>
</template>
