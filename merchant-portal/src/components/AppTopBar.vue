<script setup lang="ts">
defineProps<{
  productName?: string
}>()

defineEmits<{
  discard: []
  publish: []
  toggleSidebar: []
}>()
</script>

<template>
  <div class="topbar">
    <!-- Sidebar toggle: tablet only -->
    <button class="sidebar-toggle-btn" @click="$emit('toggleSidebar')" title="Toggle sidebar">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="topbar-logo">
      <div class="logo-dot"></div>
      Personalize
    </div>

    <div class="topbar-sep topbar-sep--desktop"></div>
    <div class="topbar-crumb topbar-crumb--desktop">
      Products / <span>{{ productName ?? 'Leather Wallet' }}</span> / Config
    </div>

    <div class="topbar-actions">
      <div class="status-dot"></div>
      <span class="status-label status-label--desktop">Unsaved changes</span>
      <button class="btn btn-ghost topbar-discard" @click="$emit('discard')">Discard</button>
      <button class="btn btn-accent" @click="$emit('publish')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="btn-label--desktop">Publish</span>
      </button>
    </div>
  </div>
</template>
