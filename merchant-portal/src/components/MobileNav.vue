<script setup lang="ts">
defineProps<{ active: string }>()
const emit = defineEmits<{ change: [panel: 'sidebar' | 'canvas' | 'config'] }>()
</script>

<template>
  <nav class="mobile-nav">
    <button class="mobile-nav-btn" :class="{ active: active === 'sidebar' }" @click="emit('change', 'sidebar')">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="14" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
        <line x1="11" y1="5" x2="16" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="11" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="11" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <span>Zones</span>
    </button>

    <button class="mobile-nav-btn" :class="{ active: active === 'canvas' }" @click="emit('change', 'canvas')">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/>
        <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.5 1.5"/>
      </svg>
      <span>Canvas</span>
    </button>

    <button class="mobile-nav-btn" :class="{ active: active === 'config' }" @click="emit('change', 'config')">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.4"/>
        <path d="M9 2v2M9 14v2M2 9h2M14 9h2M3.93 3.93l1.41 1.41M12.66 12.66l1.41 1.41M3.93 14.07l1.41-1.41M12.66 5.34l1.41-1.41" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <span>Config</span>
    </button>
  </nav>
</template>
