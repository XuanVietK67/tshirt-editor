<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  category: string
  stickers: string[]
  anchorRect: DOMRect | null
}>()

const emit = defineEmits<{ close: []; mouseenter: []; mouseleave: [] }>()

const panelStyle = computed(() => {
  if (!props.anchorRect) return {}
  return {
    top:   props.anchorRect.top + 'px',
    right: (window.innerWidth - props.anchorRect.left + 8) + 'px',
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="anchorRect"
      class="spm-panel"
      :style="panelStyle"
      @mouseenter="emit('mouseenter')"
      @mouseleave="emit('mouseleave')"
    >
      <div class="spm-header">
        <span class="spm-title">{{ category.replace(/-/g, ' ') }}</span>
        <span class="spm-count">{{ stickers.length }} stickers</span>
      </div>
      <div class="spm-grid">
        <img
          v-for="(url, i) in stickers"
          :key="i"
          :src="url"
          class="spm-img"
          loading="lazy"
          :alt="category + ' sticker ' + (i + 1)"
        />
      </div>
    </div>
  </Teleport>
</template>
