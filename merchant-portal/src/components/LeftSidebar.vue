<script setup lang="ts">
import { ref } from 'vue'
import { useEditorState, ZONE_COLORS } from '@/composables/useEditorState'

const { zones, selectedZoneId, enabledFeaturesCount, selectZone, deleteZone, addDefaultZone, setMode } = useEditorState()

const activePage = ref<string>('features')

function setPage(page: string) {
  activePage.value = page
  if (page === 'buyer') setMode('buyer')
  else setMode('merchant')
}
</script>

<template>
  <div class="left-col">
    <div class="left-scroll">

      <div class="nav-section" style="margin-top: 6px">
        <div class="nav-label">Setup</div>

        <div class="nav-item" :class="{ active: activePage === 'features' }" @click="setPage('features')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity=".7"/>
            <rect x="8" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity=".4"/>
            <rect x="1" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity=".4"/>
            <rect x="8" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity=".7"/>
          </svg>
          Features &amp; zones
          <span class="nav-badge">{{ enabledFeaturesCount }}</span>
        </div>

        <div class="nav-item" :class="{ active: activePage === 'limits' }" @click="setPage('limits')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M7 4v3.5l2 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Limits &amp; rules
        </div>

        <div class="nav-item" :class="{ active: activePage === 'pricing' }" @click="setPage('pricing')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7h11M7 1.5v11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Pricing upcharge
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Preview</div>
        <div class="nav-item" :class="{ active: activePage === 'buyer' }" @click="setPage('buyer')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.2"/>
            <path d="M1.5 7c1.5-3 9-3 11 0-2 3-9.5 3-11 0z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Buyer view
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Zones</div>

        <div
          v-for="zone in zones"
          :key="zone.id"
          class="nav-item"
          :class="{ active: selectedZoneId === zone.id }"
          style="padding: 6px 10px; margin-bottom: 2px"
          @click="selectZone(zone.id)"
        >
          <div class="zone-swatch" :style="{ background: ZONE_COLORS[zone.colorIdx].hex }"></div>
          <span style="flex: 1; font-size: 12px">{{ zone.name }}</span>
          <button
            class="zone-del-btn"
            @click.stop="deleteZone(zone.id)"
          >×</button>
        </div>

        <button class="add-zone-btn" @click="addDefaultZone">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Draw new zone
        </button>
      </div>

    </div>
  </div>
</template>
