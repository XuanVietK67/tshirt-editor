<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import FeatureCard from './FeatureCard.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import ProhibitPicker from './ProhibitPicker.vue'
import StickerCategoryPicker from './StickerCategoryPicker.vue'
import { FONT_FAMILIES, TEXT_STYLES } from '@/constants/fontFamilies'
import { useEditorState, ZONE_COLORS, ALL_FEATURES, FEATURE_LABELS, STAGE_W, STAGE_H, computeZoneBounds, computeWMax, computeHMax } from '@/composables/useEditorState'

const {
  zones,
  selectedZone,
  selectedZoneId,
  enabledFeatures,
  toggleFeature,
  deleteZone,
  productImage,
  tool,
  mode,
} = useEditorState()

const rightScrollRef = ref<HTMLElement | null>(null)
const zoneDetailRef = ref<HTMLElement | null>(null)

const featureSettings = ref({
  textMaxChars: '100',
  textMaxLines: '1',
  imageFormats: 'JPG, PNG, WEBP',
  imageMaxSize: '5 MB',
  imageMaxImages: '1',
  stickerMax: '3',
  iconLibrary: 'Built-in (240+)',
  iconMax: '2',
})

function scrollToElement(container: HTMLElement, target: HTMLElement, duration = 750) {
  const start = container.scrollTop
  const end = Math.max(
    0,
    Math.min(
      target.getBoundingClientRect().top - container.getBoundingClientRect().top + start - 32,
      container.scrollHeight - container.clientHeight,
    ),
  )
  if (Math.abs(end - start) < 2) return
  const startTime = performance.now()
  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    container.scrollTop = start + (end - start) * (1 - Math.pow(1 - t, 4))
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

watch(selectedZoneId, async (newId) => {
  if (!newId) return
  await nextTick()
  if (rightScrollRef.value && zoneDetailRef.value) {
    scrollToElement(rightScrollRef.value, zoneDetailRef.value)
  }
})

const prohibitedFonts = ref<string[]>([])
const prohibitedStyles = ref<string[]>([])
const allowedStickerCategories = ref<string[]>([])

const activeChips = ref<Record<string, boolean>>({
  // image / icon: true = allowed
  'image-Crop': true, 'image-Resize': true, 'image-Flip': true,
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

const limits = computed(() => {
  const z = selectedZone.value
  if (!z) return { xMin: 0, xMax: STAGE_W - 1, yMin: 0, yMax: STAGE_H - 1, wMax: 480, hMax: 396 }
  const θ = (z.rotation * Math.PI) / 180
  const c = Math.cos(θ), s = Math.sin(θ)
  const { w, h } = z
  const dxs = [0, w * c, w * c - h * s, -h * s]
  const dys = [0, w * s, w * s + h * c,  h * c]
  const minDx = Math.min(...dxs), maxDx = Math.max(...dxs)
  const minDy = Math.min(...dys), maxDy = Math.max(...dys)
  return {
    xMin: Math.round(-minDx),
    xMax: Math.round(STAGE_W - maxDx),
    yMin: Math.round(-minDy),
    yMax: Math.round(STAGE_H - maxDy),
    wMax: computeWMax(z),
    hMax: computeHMax(z),
  }
})

function applyField(field: string, raw: string, el: HTMLInputElement) {
  const n = parseFloat(raw)
  if (isNaN(n)) return
  const z = selectedZone.value
  if (!z) return
  const L = limits.value
  let clamped: number
  if (field === 'x')        clamped = Math.round(Math.max(L.xMin, Math.min(n, L.xMax)))
  else if (field === 'y')   clamped = Math.round(Math.max(L.yMin, Math.min(n, L.yMax)))
  else if (field === 'w')   clamped = Math.round(Math.max(40, Math.min(n, L.wMax)))
  else if (field === 'h')   clamped = Math.round(Math.max(24, Math.min(n, L.hMax)))
  else if (field === 'rotation') {
    clamped = Math.round(((n % 360) + 360) % 360)
    z.rotation = clamped
    if (clamped !== Math.round(n)) el.value = String(clamped)
    const bounds = computeZoneBounds(z)
    let nx = z.x, ny = z.y
    if (bounds.minX < 0)      nx -= bounds.minX
    if (bounds.maxX > STAGE_W) nx -= (bounds.maxX - STAGE_W)
    if (bounds.minY < 0)      ny -= bounds.minY
    if (bounds.maxY > STAGE_H) ny -= (bounds.maxY - STAGE_H)
    z.x = Math.round(nx)
    z.y = Math.round(ny)
    return
  } else return

  if (field === 'x')      z.x = clamped
  else if (field === 'y') z.y = clamped
  else if (field === 'w') z.w = clamped
  else if (field === 'h') z.h = clamped

  if (clamped !== Math.round(n)) el.value = String(clamped)
}

function preventTyping(e: KeyboardEvent) {
  const allowed = new Set(['ArrowUp', 'ArrowDown', 'Tab', 'Escape'])
  if (!allowed.has(e.key)) e.preventDefault()
}

function saveConfig() {
  const config = {
    canvas: {
      width: STAGE_W,
      height: STAGE_H,
      hasProductImage: !!productImage.value,
      productImage: productImage.value,
      zoneCount: zones.value.length,
      activeTool: tool.value,
      mode: mode.value,
    },
    enabledFeatures: [...enabledFeatures.value],
    features: {
      text: {
        maxChars: featureSettings.value.textMaxChars,
        maxLines: featureSettings.value.textMaxLines,
        prohibitedFonts: [...prohibitedFonts.value],
        prohibitedStyles: [...prohibitedStyles.value],
      },
      image: {
        acceptedFormats: featureSettings.value.imageFormats,
        maxSize: featureSettings.value.imageMaxSize,
        maxImages: featureSettings.value.imageMaxImages,
        editTools: ['Crop', 'Resize', 'Rotate', 'Flip', 'Filters'].filter(
          (t) => activeChips.value['image-' + t],
        ),
      },
      sticker: {
        maxPerZone: featureSettings.value.stickerMax,
        allowedCategories: allowedStickerCategories.value.length
          ? allowedStickerCategories.value
          : 'all',
      },
      icon: {
        library: featureSettings.value.iconLibrary,
        maxPerZone: featureSettings.value.iconMax,
        buyerCanChange: ['Color', 'Size', 'Rotation', 'Style'].filter(
          (p) => activeChips.value['icon-' + p],
        ),
      },
    },
    zones: zones.value.map((z) => {
      const θ = (z.rotation * Math.PI) / 180
      const cos = Math.cos(θ), sin = Math.sin(θ)
      function pt(lx: number, ly: number) {
        return { x: Math.round(z.x + lx * cos - ly * sin), y: Math.round(z.y + lx * sin + ly * cos) }
      }
      return {
        id: z.id,
        name: z.name,
        color: ZONE_COLORS[z.colorIdx].hex,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        rotation: z.rotation,
        coordinates: {
          tl: pt(0, 0),
          tr: pt(z.w, 0),
          br: pt(z.w, z.h),
          bl: pt(0, z.h),
        },
        features: [...z.features],
        required: z.required,
        maxItems: z.maxItems,
        showBorder: z.showBorder,
      }
    }),
  }
  console.log('Design config:', config)
}

const vertices = computed(() => {
  const z = selectedZone.value
  if (!z) return null
  const { x, y, w, h, rotation } = z
  const θ = (rotation * Math.PI) / 180
  const cos = Math.cos(θ)
  const sin = Math.sin(θ)
  function pt(lx: number, ly: number) {
    return {
      x: Math.round(x + lx * cos - ly * sin),
      y: Math.round(y + lx * sin + ly * cos),
    }
  }
  return {
    tl: pt(0, 0),
    tr: pt(w, 0),
    br: pt(w, h),
    bl: pt(0, h),
  }
})
</script>

<template>
  <div class="right-col">
    <div class="right-scroll" ref="rightScrollRef">

      <!-- Design features -->
      <div class="rp-section">
        <div class="rp-head">Design features</div>

        <!-- Text -->
        <FeatureCard
          name="Text"
          description="Custom text &amp; typography"
          color="#0070d2"
          :enabled="enabledFeatures.has('text')"
          @toggle="toggleFeature('text', $event)"
        >
          <template #icon>T</template>
          <div class="sub-option">
            <span class="sub-label">Max characters</span>
            <select class="form-select" v-model="featureSettings.textMaxChars">
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="Unlimited">Unlimited</option>
            </select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max lines</span>
            <select class="form-select" v-model="featureSettings.textMaxLines">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label-row" style="margin-bottom: 5px">
              <span class="sub-label">Prohibited fonts</span>
              <span class="sub-hint">Block specific font families</span>
            </div>
            <ProhibitPicker :fonts="FONT_FAMILIES" v-model="prohibitedFonts" />
          </div>
          <div style="margin-top: 10px">
            <div class="sub-label-row" style="margin-bottom: 5px">
              <span class="sub-label">Prohibited styles</span>
              <span class="sub-hint">Block specific text styles</span>
            </div>
            <ProhibitPicker :items="TEXT_STYLES" v-model="prohibitedStyles" placeholder="Search styles…" />
          </div>
        </FeatureCard>

        <!-- Image upload -->
        <FeatureCard
          name="Image upload"
          description="Buyer uploads their photo"
          color="#007e6b"
          :enabled="enabledFeatures.has('image')"
          @toggle="toggleFeature('image', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="2.5" width="13" height="10" rx="2" stroke="var(--text2)" stroke-width="1.2"/>
              <circle cx="5" cy="6.5" r="1.2" fill="var(--text2)"/>
              <path d="M1.5 11l3.5-3.5 2.5 2.5 2-2 4 4" stroke="var(--text2)" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Accepted formats</span>
            <select class="form-select" v-model="featureSettings.imageFormats">
              <option value="JPG, PNG, WEBP">JPG, PNG, WEBP</option>
              <option value="JPG, PNG">JPG, PNG</option>
              <option value="All image types">All image types</option>
            </select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max file size</span>
            <select class="form-select" v-model="featureSettings.imageMaxSize">
              <option value="2 MB">2 MB</option>
              <option value="5 MB">5 MB</option>
              <option value="10 MB">10 MB</option>
            </select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max images</span>
            <select class="form-select" v-model="featureSettings.imageMaxImages">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
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
          color="#c05717"
          :enabled="enabledFeatures.has('sticker')"
          @toggle="toggleFeature('sticker', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="var(--text2)" stroke-width="1.2"/>
              <path d="M5 8.5c.6 1 2.4 1 3 0" stroke="var(--text2)" stroke-width="1.1" stroke-linecap="round"/>
              <circle cx="5.5" cy="6" r=".8" fill="var(--text2)"/>
              <circle cx="9.5" cy="6" r=".8" fill="var(--text2)"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Max stickers per zone</span>
            <select class="form-select" v-model="featureSettings.stickerMax">
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </div>
          <div style="margin-top: 8px">
            <div class="sub-label-row" style="margin-bottom: 5px">
              <span class="sub-label">Allowed categories</span>
              <span class="sub-hint">Empty = all allowed</span>
            </div>
            <StickerCategoryPicker v-model="allowedStickerCategories" />
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
          color="#5243c2"
          :enabled="enabledFeatures.has('icon')"
          @toggle="toggleFeature('icon', $event)"
        >
          <template #icon>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <polygon points="7.5,1.5 9.5,5.5 14,6 10.5,9.5 11.5,14 7.5,11.5 3.5,14 4.5,9.5 1,6 5.5,5.5" stroke="var(--text2)" stroke-width="1.1" stroke-linejoin="round"/>
            </svg>
          </template>
          <div class="sub-option">
            <span class="sub-label">Icon library</span>
            <select class="form-select" v-model="featureSettings.iconLibrary">
              <option value="Built-in (240+)">Built-in (240+)</option>
              <option value="Custom upload">Custom upload</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div class="sub-option">
            <span class="sub-label">Max icons per zone</span>
            <select class="form-select" v-model="featureSettings.iconMax">
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
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
        <div class="zd-panel" ref="zoneDetailRef">
          <div class="zd-title">Selected zone</div>
          <div class="zd-row">
            <span class="zd-key">Name</span>
            <input
              class="zd-input"
              type="text"
              v-model="selectedZone.name"
              placeholder="Zone name"
              autocomplete="off"
            />
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
        </div>

        <!-- Transform: position, size, rotation -->
        <div class="zd-panel">
          <div class="zd-title">Transform</div>

          <div class="zd-kb-hint">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="1" y="3" width="9" height="6" rx="1.2" stroke="currentColor" stroke-width="1.1"/>
              <path d="M3.5 6.5V7M5.5 5v2M7.5 6.5V7" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
              <path d="M4.5 2.5V1.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            </svg>
            Use <kbd>↑</kbd> / <kbd>↓</kbd> arrow keys to adjust values · <kbd>Tab</kbd> to move between fields
          </div>

          <div class="zd-grid">
            <!-- X -->
            <div class="zd-field">
              <span class="zd-field-label">X</span>
              <div class="zd-num-wrap">
                <input
                  type="number"
                  class="zd-num-input"
                  :value="selectedZone.x"
                  :min="limits.xMin"
                  :max="limits.xMax"
                  step="1"
                  @keydown="preventTyping"
                  @paste.prevent
                  @input="applyField('x', ($event.target as HTMLInputElement).value, $event.target as HTMLInputElement)"
                />
                <span class="zd-num-unit">px</span>
              </div>
              <span class="zd-range-hint">{{ limits.xMin }}–{{ limits.xMax }}</span>
            </div>
            <!-- Y -->
            <div class="zd-field">
              <span class="zd-field-label">Y</span>
              <div class="zd-num-wrap">
                <input
                  type="number"
                  class="zd-num-input"
                  :value="selectedZone.y"
                  :min="limits.yMin"
                  :max="limits.yMax"
                  step="1"
                  @keydown="preventTyping"
                  @paste.prevent
                  @input="applyField('y', ($event.target as HTMLInputElement).value, $event.target as HTMLInputElement)"
                />
                <span class="zd-num-unit">px</span>
              </div>
              <span class="zd-range-hint">{{ limits.yMin }}–{{ limits.yMax }}</span>
            </div>
            <!-- W -->
            <div class="zd-field">
              <span class="zd-field-label">W</span>
              <div class="zd-num-wrap">
                <input
                  type="number"
                  class="zd-num-input"
                  :value="selectedZone.w"
                  min="40"
                  :max="limits.wMax"
                  step="1"
                  @keydown="preventTyping"
                  @paste.prevent
                  @input="applyField('w', ($event.target as HTMLInputElement).value, $event.target as HTMLInputElement)"
                />
                <span class="zd-num-unit">px</span>
              </div>
              <span class="zd-range-hint">40–{{ limits.wMax }}</span>
            </div>
            <!-- H -->
            <div class="zd-field">
              <span class="zd-field-label">H</span>
              <div class="zd-num-wrap">
                <input
                  type="number"
                  class="zd-num-input"
                  :value="selectedZone.h"
                  min="24"
                  :max="limits.hMax"
                  step="1"
                  @keydown="preventTyping"
                  @paste.prevent
                  @input="applyField('h', ($event.target as HTMLInputElement).value, $event.target as HTMLInputElement)"
                />
                <span class="zd-num-unit">px</span>
              </div>
              <span class="zd-range-hint">24–{{ limits.hMax }}</span>
            </div>
            <!-- Rotation -->
            <div class="zd-field zd-rotation-row">
              <span class="zd-field-label">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M9.5 5.5a4 4 0 1 1-1.17-2.83" stroke="var(--text2)" stroke-width="1.2" stroke-linecap="round"/>
                  <path d="M8.33 2.67V5h2.34" stroke="var(--text2)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Rotation
              </span>
              <div class="zd-num-wrap">
                <input
                  type="number"
                  class="zd-num-input"
                  :value="selectedZone.rotation"
                  step="1"
                  @keydown="preventTyping"
                  @paste.prevent
                  @input="applyField('rotation', ($event.target as HTMLInputElement).value, $event.target as HTMLInputElement)"
                />
                <span class="zd-num-unit">°</span>
              </div>
              <span class="zd-range-hint">0–359</span>
            </div>
          </div>
        </div>

        <!-- Vertices panel -->
        <div class="zd-panel" v-if="vertices">
          <div class="zd-title">
            Vertices
            <span v-if="selectedZone.rotation !== 0" class="zd-vertices-rotated-badge">rotated</span>
          </div>

          <div class="zd-vertices-grid">
            <div class="zd-vertex zd-vertex--tl">
              <span class="zd-vertex-label">
                <span class="zd-vertex-dot" :style="{ background: ZONE_COLORS[selectedZone.colorIdx].hex }"></span>
                TL
              </span>
              <span class="zd-vertex-coord">{{ vertices.tl.x }}, {{ vertices.tl.y }}</span>
            </div>
            <div class="zd-vertex zd-vertex--tr">
              <span class="zd-vertex-label">
                TR
                <span class="zd-vertex-dot" :style="{ background: ZONE_COLORS[selectedZone.colorIdx].hex }"></span>
              </span>
              <span class="zd-vertex-coord">{{ vertices.tr.x }}, {{ vertices.tr.y }}</span>
            </div>
            <div class="zd-vertex zd-vertex--bl">
              <span class="zd-vertex-label">
                <span class="zd-vertex-dot" :style="{ background: ZONE_COLORS[selectedZone.colorIdx].hex }"></span>
                BL
              </span>
              <span class="zd-vertex-coord">{{ vertices.bl.x }}, {{ vertices.bl.y }}</span>
            </div>
            <div class="zd-vertex zd-vertex--br">
              <span class="zd-vertex-label">
                BR
                <span class="zd-vertex-dot" :style="{ background: ZONE_COLORS[selectedZone.colorIdx].hex }"></span>
              </span>
              <span class="zd-vertex-coord">{{ vertices.br.x }}, {{ vertices.br.y }}</span>
            </div>
          </div>

          <p v-if="selectedZone.rotation !== 0" class="zd-vertices-note">
            Coordinates are canvas pixels after rotation is applied. X / Y (above) mark the unrotated origin.
          </p>
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
            <select class="form-select" v-model="selectedZone.maxItems">
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="Unlimited">Unlimited</option>
            </select>
          </div>
          <div class="zd-row">
            <span class="zd-key">Show border to buyer</span>
            <ToggleSwitch v-model="selectedZone.showBorder" />
          </div>
          <div style="margin-top: 8px; text-align: right">
            <button class="btn-danger-plain" @click="deleteZone(selectedZone.id)">Delete zone</button>
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
      <button class="btn btn-accent" @click="saveConfig">Save config</button>
    </div>
  </div>
</template>
