<script setup lang="ts">
import { ref } from 'vue'
import { useEditorState, ZONE_COLORS, ZONE_SHAPES } from '@/composables/useEditorState'

const { zones, selectedZoneId, enabledFeaturesCount, activeShape, selectZone, deleteZone, addDefaultZone, setMode, setActiveShape } = useEditorState()

const emit = defineEmits<{ 'navigate-to-canvas': [] }>()

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
          class="nav-item zone-item"
          :class="{ active: selectedZoneId === zone.id }"
          @click="selectZone(zone.id); emit('navigate-to-canvas')"
        >
          <div class="zone-swatch" :style="{ background: ZONE_COLORS[zone.colorIdx].hex }"></div>
          <div class="zone-item-body">
            <span class="zone-item-name">{{ zone.name }}</span>
            <span class="zone-item-shape">{{ ZONE_SHAPES.find(s => s.id === zone.shape)?.label ?? 'Rectangle' }}</span>
          </div>
          <button class="zone-del-btn" @click.stop="deleteZone(zone.id)">×</button>
        </div>

        <!-- Shape palette -->
        <div class="shape-palette">
          <div class="shape-palette-header">
            <span class="shape-palette-label">Next zone shape</span>
            <span class="shape-active-name">{{ ZONE_SHAPES.find(s => s.id === activeShape)?.label }}</span>
          </div>
          <div class="shape-grid">
            <button
              v-for="s in ZONE_SHAPES"
              :key="s.id"
              class="shape-cell"
              :class="{ active: activeShape === s.id }"
              :title="s.label"
              @click="setActiveShape(s.id); emit('navigate-to-canvas')"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                <rect v-if="s.id === 'rect'" x="2" y="3.5" width="16" height="13" rx="1"/>
                <rect v-else-if="s.id === 'rounded-rect'" x="2" y="3.5" width="16" height="13" rx="5"/>
                <ellipse v-else-if="s.id === 'ellipse'" cx="10" cy="10" rx="8" ry="6.5"/>
                <polygon v-else-if="s.id === 'triangle'" points="10,3 18,17 2,17"/>
                <polygon v-else-if="s.id === 'diamond'" points="10,2 18,10 10,18 2,10"/>
                <polygon v-else-if="s.id === 'star'" points="10,2 12.1,7.2 17.6,7.5 13.3,11.1 14.7,16.5 10,13.5 5.3,16.5 6.7,11.1 2.4,7.5 7.9,7.2"/>
                <polygon v-else-if="s.id === 'pentagon'" points="10,2 18.9,8.6 15.6,18 4.4,18 1.1,8.6"/>
                <polygon v-else-if="s.id === 'hexagon'" points="10,2 18,6.5 18,13.5 10,18 2,13.5 2,6.5"/>
                <path v-else-if="s.id === 'heart'" d="M10,17 C10,17 1,12 1,6 C1,2.5 4,1 6.5,3.5 C7.5,4.5 9,6.5 10,8 C11,6.5 12.5,4.5 13.5,3.5 C16,1 19,2.5 19,6 C19,12 10,17 10,17Z"/>
                <path v-else-if="s.id === 'arrow'" d="M1,7.5 L12,7.5 L12,4 L19,10 L12,16 L12,12.5 L1,12.5Z"/>
              </svg>
            </button>
          </div>
        </div>

        <button class="add-zone-btn" @click="addDefaultZone">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Draw new zone
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.zone-item {
  padding: 5px 10px;
  margin-bottom: 2px;
}
.zone-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.zone-item-name {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zone-item-shape {
  font-size: 10px;
  color: var(--text3);
}

.shape-palette {
  padding: 8px 10px 4px;
}
.shape-palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.shape-palette-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.shape-active-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
}
.shape-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
}
.shape-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--text2);
  padding: 0;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.shape-cell:hover {
  background: var(--surface2);
  color: var(--text);
}
.shape-cell.active {
  background: var(--accent-bg);
  border-color: var(--accent-border);
  color: var(--accent);
}
</style>
