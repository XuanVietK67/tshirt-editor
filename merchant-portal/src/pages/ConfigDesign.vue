<script setup lang="ts">
import { ref } from 'vue'
import AppTopBar from '@components/AppTopBar.vue'
import LeftSidebar from '@components/LeftSidebar.vue'
import MainCanvas from '@components/MainCanvas.vue'
import RightPanel from '@components/RightPanel.vue'
import MobileNav from '@components/MobileNav.vue'

type Panel = 'sidebar' | 'canvas' | 'config'

const activePanel = ref<Panel>('canvas')
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="shell" :class="[`mobile-panel-${activePanel}`, { 'sidebar-open': sidebarOpen }]">
    <AppTopBar @toggle-sidebar="toggleSidebar" />

    <!-- Tablet sidebar backdrop -->
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar"></div>

    <LeftSidebar @navigate-to-canvas="activePanel = 'canvas'" />
    <MainCanvas />
    <RightPanel @navigate-to-canvas="activePanel = 'canvas'" />
    <MobileNav :active="activePanel" @change="activePanel = $event" />
  </div>
</template>
