<script setup lang="ts">
import { ref } from 'vue'
import FeatureCard from './FeatureCard.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import { useEditorState, ZONE_COLORS, ALL_FEATURES, FEATURE_LABELS } from '@/composables/useEditorState'

const {
  selectedZone,
  enabledFeatures,
  toggleFeature,
  deleteZone,
} = useEditorState()

// Chip active state for sub-options (keyed by feature + chip label)
const activeChips = ref<Record<string, boolean>>({
  'text-Serif': true, 'text-Sans-serif': true, 'text-Mono': true,
  'text-Bold': true, 'text-Italic': true, 'text-Color': true,
  'image-Crop': true, 'image-Resize': true, 'image-Flip': true,
  'sticker-Nature': true, 'sticker-Shapes': true, 'sticker-Animals': true, 'sticker-Symbols': true,
  'icon-Color': true, 'icon-Size': true, 'icon-Rotation': true,
})

function toggleChip(key: string) {
  activeChips.value[key] = !activeChips.value[key]
}

function toggleZoneFeature(feature: string) {
  if (!selectedZone.value) return
  const idx = selectedZone.value.features.indexOf(feature)
  if (idx === -1) selectedZone.value.features.push(feature)
  else selectedZone.value.features.splice(idx, 1)
}
</script>

<template>
  <div class="right-col">
    <div class="right-scroll">

      <!-- Design features -->
      <div class="rp-section">
        <div class="rp-head">Design features</div>

        <!-- Text -->
        <FeatureCard
          name="Text"
          description="Custom text &amp; typography"
          :enabled="enabledFeatures.has('text')"
          @toggle="toggleFeature('text', $event)"
        >
          <template #icon>T</template>
          <div class="sub-option">
            <span class="sub-label">Max characters</span>
            <select class="sub-select"><option>50</option><option selected>100</option><option>200</option><option>Unlimited</option></select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max lines</span>
            <select class="sub-select"><option selected>1</option><option>2</option><option>3</option></select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label" style="margin-bottom: 5px">Allowed fonts</div>
            <div class="sub-chips">
              <span v-for="chip in ['Serif','Sans-serif','Script','Display','Mono']" :key="chip"
                class="chip" :class="{ on: activeChips['text-' + chip] }"
                @click="toggleChip('text-' + chip)">{{ chip }}</span>
            </div>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label" style="margin-bottom: 5px">Allowed styles</div>
            <div class="sub-chips">
              <span v-for="chip in ['Bold','Italic','Outline','Shadow','Color']" :key="chip"
                class="chip" :class="{ on: activeChips['text-' + chip] }"
                @click="toggleChip('text-' + chip)">{{ chip }}</span>
            </div>
          </div>
        </FeatureCard>

        <!-- Image upload -->
        <FeatureCard
          name="Image upload"
          description="Buyer uploads their photo"
          :enabled="enabledFeatures.has('image')"
          @toggle="toggleFeature('image', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="2.5" width="13" height="10" rx="2" stroke="#8a8a94" stroke-width="1.2"/>
              <circle cx="5" cy="6.5" r="1.2" fill="#8a8a94"/>
              <path d="M1.5 11l3.5-3.5 2.5 2.5 2-2 4 4" stroke="#8a8a94" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Accepted formats</span>
            <select class="sub-select"><option selected>JPG, PNG, WEBP</option><option>JPG, PNG</option><option>All image types</option></select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max file size</span>
            <select class="sub-select"><option>2 MB</option><option selected>5 MB</option><option>10 MB</option></select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max images</span>
            <select class="sub-select"><option selected>1</option><option>2</option><option>3</option></select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label" style="margin-bottom: 5px">Edit tools</div>
            <div class="sub-chips">
              <span v-for="chip in ['Crop','Resize','Rotate','Flip','Filters']" :key="chip"
                class="chip" :class="{ on: activeChips['image-' + chip] }"
                @click="toggleChip('image-' + chip)">{{ chip }}</span>
            </div>
          </div>
        </FeatureCard>

        <!-- Stickers -->
        <FeatureCard
          name="Stickers"
          description="Pre-made decorative stickers"
          :enabled="enabledFeatures.has('sticker')"
          @toggle="toggleFeature('sticker', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="#8a8a94" stroke-width="1.2"/>
              <path d="M5 8.5c.6 1 2.4 1 3 0" stroke="#8a8a94" stroke-width="1.1" stroke-linecap="round"/>
              <circle cx="5.5" cy="6" r=".8" fill="#8a8a94"/>
              <circle cx="9.5" cy="6" r=".8" fill="#8a8a94"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Max stickers per zone</span>
            <select class="sub-select"><option>1</option><option selected>3</option><option>5</option><option>10</option></select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label" style="margin-bottom: 5px">Allowed categories</div>
            <div class="sub-chips">
              <span v-for="chip in ['Nature','Shapes','Animals','Food','Symbols','Seasonal']" :key="chip"
                class="chip" :class="{ on: activeChips['sticker-' + chip] }"
                @click="toggleChip('sticker-' + chip)">{{ chip }}</span>
            </div>
          </div>
          <div class="sub-option" style="margin-top: 6px">
            <span class="sub-label">Allow resize</span>
            <ToggleSwitch :model-value="true" />
          </div>
          <div class="sub-option">
            <span class="sub-label">Allow rotate</span>
            <ToggleSwitch :model-value="true" />
          </div>
        </FeatureCard>

        <!-- Icons -->
        <FeatureCard
          name="Icons"
          description="Vector icon library"
          :enabled="enabledFeatures.has('icon')"
          @toggle="toggleFeature('icon', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <polygon points="7.5,1.5 9.5,5.5 14,6 10.5,9.5 11.5,14 7.5,11.5 3.5,14 4.5,9.5 1,6 5.5,5.5" stroke="#8a8a94" stroke-width="1.1" stroke-linejoin="round"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Icon library</span>
            <select class="sub-select"><option selected>Built-in (240+)</option><option>Custom upload</option><option>Both</option></select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max icons per zone</span>
            <select class="sub-select"><option selected>2</option><option>3</option><option>5</option></select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label" style="margin-bottom: 5px">Allow buyer to change</div>
            <div class="sub-chips">
              <span v-for="chip in ['Color','Size','Rotation','Style']" :key="chip"
                class="chip" :class="{ on: activeChips['icon-' + chip] }"
                @click="toggleChip('icon-' + chip)">{{ chip }}</span>
            </div>
          </div>
        </FeatureCard>
      </div>

      <!-- Zone detail panel -->
      <template v-if="selectedZone">
        <div class="zd-panel">
          <div class="zd-title">Selected zone</div>
          <div class="zd-row">
            <span class="zd-key">Name</span>
            <input class="zd-input" v-model="selectedZone.name" placeholder="Zone name">
          </div>
          <div class="zd-row">
            <span class="zd-key">Color</span>
            <div class="color-row">
              <div
                v-for="(color, i) in ZONE_COLORS"
                :key="i"
                class="cswatch"
                :class="{ active: selectedZone.colorIdx === i }"
                :style="{ background: color.hex }"
                @click="selectedZone.colorIdx = i"
              ></div>
            </div>
          </div>
          <div class="zd-row"><span class="zd-key">X</span><span class="zd-val">{{ selectedZone.x }}px</span></div>
          <div class="zd-row"><span class="zd-key">Y</span><span class="zd-val">{{ selectedZone.y }}px</span></div>
          <div class="zd-row"><span class="zd-key">W</span><span class="zd-val">{{ selectedZone.w }}px</span></div>
          <div class="zd-row"><span class="zd-key">H</span><span class="zd-val">{{ selectedZone.h }}px</span></div>
        </div>

        <div class="zd-panel">
          <div class="zd-title">Allowed features in zone</div>
          <div class="allowed-tools">
            <span
              v-for="feature in ALL_FEATURES.filter(f => enabledFeatures.has(f))"
              :key="feature"
              class="allowed-chip"
              :class="{ on: selectedZone.features.includes(feature) }"
              @click="toggleZoneFeature(feature)"
            >
              <span class="allowed-chip-dot"></span>
              {{ FEATURE_LABELS[feature] }}
            </span>
          </div>
        </div>

        <div class="zd-panel">
          <div class="zd-title">Zone rules</div>
          <div class="zd-row">
            <span class="zd-key">Required</span>
            <ToggleSwitch v-model="selectedZone.required" />
          </div>
          <div class="zd-row">
            <span class="zd-key">Max items</span>
            <select class="sub-select" v-model="selectedZone.maxItems">
              <option>1</option><option>3</option><option>5</option><option>Unlimited</option>
            </select>
          </div>
          <div class="zd-row">
            <span class="zd-key">Show border to buyer</span>
            <ToggleSwitch v-model="selectedZone.showBorder" />
          </div>
          <div style="margin-top: 8px; text-align: right">
            <button
              class="btn btn-ghost"
              style="font-size: 11px; padding: 5px 10px; color: var(--red); border-color: rgba(239,68,68,0.3)"
              @click="deleteZone(selectedZone.id)"
            >Delete zone</button>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-panel">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
          <line x1="20" y1="12" x2="20" y2="28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="12" y1="20" x2="28" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>Draw a rectangle on the product canvas to define a zone.<br><br>Zones restrict where buyers can place text, images, stickers &amp; icons.</p>
      </div>

    </div>

    <div class="save-footer">
      <button class="btn btn-ghost">Reset</button>
      <button class="btn btn-accent">Save config</button>
    </div>
  </div>
</template>
