<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorState, ZONE_COLORS, type Zone } from '@/composables/useEditorState'

const {
  zones,
  selectedZoneId,
  tool,
  mode,
  addZone,
  selectZone,
  deselectZone,
  setTool,
  setMode,
} = useEditorState()

const imgCanvasRef = ref<HTMLElement | null>(null)
const bodyCanvasRef = ref<HTMLElement | null>(null)

// Drawing state
let isDrawing = false
let drawCanvasEl: HTMLElement | null = null
let drawCanvasName: 'img' | 'body' = 'img'
let startX = 0
let startY = 0

const drawPreview = ref({ visible: false, x: 0, y: 0, w: 0, h: 0, canvas: '' })

// Drag state
let dragZone: Zone | null = null
let dragOffX = 0
let dragOffY = 0

// Resize state
let resizeZone: Zone | null = null

const canvasHint = computed(() => {
  if (mode.value === 'buyer') return 'Buyer view — zones are locked'
  if (tool.value === 'draw') return 'Draw rectangles on the product to define buyer zones'
  return 'Click a zone to select · drag to move · drag corner to resize'
})

function getCanvasEl(canvas: 'img' | 'body') {
  return canvas === 'img' ? imgCanvasRef.value : bodyCanvasRef.value
}

function onCanvasMousedown(e: MouseEvent, canvasEl: HTMLElement, canvasName: 'img' | 'body') {
  if (mode.value !== 'merchant' || tool.value !== 'draw') return
  if ((e.target as HTMLElement).closest('.z-rect')) return
  isDrawing = true
  drawCanvasEl = canvasEl
  drawCanvasName = canvasName
  const r = canvasEl.getBoundingClientRect()
  startX = e.clientX - r.left
  startY = e.clientY - r.top
  drawPreview.value = { visible: true, x: startX, y: startY, w: 0, h: 0, canvas: canvasName }
}

function onZoneMousedown(e: MouseEvent, zone: Zone) {
  if (mode.value !== 'merchant') return
  e.stopPropagation()
  selectZone(zone.id)
  if (tool.value === 'select') {
    const c = getCanvasEl(zone.canvas)!
    const cr = c.getBoundingClientRect()
    dragZone = zone
    dragOffX = e.clientX - cr.left - zone.x
    dragOffY = e.clientY - cr.top - zone.y
  }
}

function onResizeMousedown(e: MouseEvent, zone: Zone) {
  e.stopPropagation()
  e.preventDefault()
  resizeZone = zone
}

function onMousemove(e: MouseEvent) {
  if (isDrawing && drawCanvasEl) {
    const r = drawCanvasEl.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    drawPreview.value = {
      visible: true,
      x: Math.min(startX, cx),
      y: Math.min(startY, cy),
      w: Math.abs(cx - startX),
      h: Math.abs(cy - startY),
      canvas: drawCanvasName,
    }
    return
  }
  if (dragZone) {
    const c = getCanvasEl(dragZone.canvas)!
    const cr = c.getBoundingClientRect()
    dragZone.x = Math.max(0, Math.min(Math.round(e.clientX - cr.left - dragOffX), cr.width - dragZone.w))
    dragZone.y = Math.max(0, Math.min(Math.round(e.clientY - cr.top - dragOffY), cr.height - dragZone.h))
    return
  }
  if (resizeZone) {
    const c = getCanvasEl(resizeZone.canvas)!
    const cr = c.getBoundingClientRect()
    resizeZone.w = Math.max(40, Math.round(e.clientX - cr.left - resizeZone.x))
    resizeZone.h = Math.max(24, Math.round(e.clientY - cr.top - resizeZone.y))
  }
}

function onMouseup() {
  if (isDrawing) {
    const { x, y, w, h } = drawPreview.value
    if (w > 24 && h > 18) {
      addZone(drawCanvasName, x, y, w, h)
    }
    isDrawing = false
    drawPreview.value = { ...drawPreview.value, visible: false }
    drawCanvasEl = null
  }
  dragZone = null
  resizeZone = null
}

onMounted(() => {
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
})
</script>

<template>
  <div class="main-col">
    <!-- Canvas toolbar -->
    <div class="canvas-topbar">
      <div class="seg-ctrl">
        <button class="seg-btn" :class="{ active: mode === 'merchant' }" @click="setMode('merchant')">Merchant</button>
        <button class="seg-btn" :class="{ active: mode === 'buyer' }" @click="setMode('buyer')">Buyer preview</button>
      </div>

      <div style="display: flex; align-items: center; gap: 6px; margin-left: 14px">
        <button class="tool-btn" :class="{ active: tool === 'draw' }" title="Draw zone" @click="setTool('draw')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 2"/>
          </svg>
        </button>
        <button class="tool-btn" :class="{ active: tool === 'select' }" title="Select / move" @click="setTool('select')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2l3.5 9 2-3.5 3.5-2L2 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="canvas-tools">
        <button class="tool-btn" title="Fit view">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 4.5V2h2.5M9 2h2.5v2.5M11.5 8.5V11H9M4 11H1.5V8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <span style="margin-left: 12px; font-size: 11px; color: var(--text3)">{{ canvasHint }}</span>
    </div>

    <!-- Canvas body -->
    <div class="canvas-body" @click.self="deselectZone">
      <div class="product-stage">

        <!-- Buyer overlay -->
        <div v-if="mode === 'buyer'" class="buyer-overlay">
          <div class="buyer-badge">Buyer Preview</div>
        </div>

        <!-- Image canvas -->
        <div
          ref="imgCanvasRef"
          class="product-img-area"
          @mousedown="onCanvasMousedown($event, imgCanvasRef!, 'img')"
        >
          <div class="product-img-bg">
            <div class="img-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="4" width="18" height="14" rx="2.5" stroke="#55555f" stroke-width="1.3"/>
                <circle cx="8" cy="9.5" r="1.8" fill="#55555f"/>
                <path d="M2 15l5-4.5 3.5 3.5 3-2.5 6.5 5.5" stroke="#55555f" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="img-hint">Product photo</span>
          </div>

          <!-- Drawing preview on img canvas -->
          <div
            v-if="drawPreview.visible && drawPreview.canvas === 'img'"
            class="z-drawing"
            :style="{ left: drawPreview.x + 'px', top: drawPreview.y + 'px', width: drawPreview.w + 'px', height: drawPreview.h + 'px' }"
          ></div>

          <!-- Zone rects on img canvas -->
          <div
            v-for="zone in zones.filter(z => z.canvas === 'img')"
            :key="zone.id"
            class="z-rect"
            :class="{ 'z-selected': selectedZoneId === zone.id }"
            :style="{
              left: zone.x + 'px',
              top: zone.y + 'px',
              width: zone.w + 'px',
              height: zone.h + 'px',
              borderColor: ZONE_COLORS[zone.colorIdx].hex,
              background: ZONE_COLORS[zone.colorIdx].bg,
              cursor: mode === 'merchant' ? (tool === 'select' ? 'move' : 'default') : 'default',
              pointerEvents: mode === 'buyer' ? 'none' : 'auto',
            }"
            @mousedown="onZoneMousedown($event, zone)"
          >
            <div
              class="z-label"
              :style="{ background: ZONE_COLORS[zone.colorIdx].lbl, color: '#fff' }"
            >{{ zone.name }}</div>
            <div
              v-if="mode === 'merchant'"
              class="z-resize"
              :style="{ color: ZONE_COLORS[zone.colorIdx].hex }"
              @mousedown="onResizeMousedown($event, zone)"
            ></div>
          </div>
        </div>

        <!-- Product details + body canvas -->
        <div class="product-details">
          <div class="product-name">Custom Leather Wallet</div>
          <div class="product-price">$49.00</div>

          <div
            ref="bodyCanvasRef"
            class="product-body-area"
            @mousedown="onCanvasMousedown($event, bodyCanvasRef!, 'body')"
          >
            <div style="height: 56px; border: 1px dashed var(--border2); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px">
              <span style="font-size: 11px; color: var(--text3)">Personalization area</span>
            </div>
            <div style="height: 38px; border: 1px dashed var(--border2); border-radius: 6px; display: flex; align-items: center; justify-content: center">
              <span style="font-size: 11px; color: var(--text3)">Options</span>
            </div>

            <!-- Drawing preview on body canvas -->
            <div
              v-if="drawPreview.visible && drawPreview.canvas === 'body'"
              class="z-drawing"
              :style="{ left: drawPreview.x + 'px', top: drawPreview.y + 'px', width: drawPreview.w + 'px', height: drawPreview.h + 'px' }"
            ></div>

            <!-- Zone rects on body canvas -->
            <div
              v-for="zone in zones.filter(z => z.canvas === 'body')"
              :key="zone.id"
              class="z-rect"
              :class="{ 'z-selected': selectedZoneId === zone.id }"
              :style="{
                left: zone.x + 'px',
                top: zone.y + 'px',
                width: zone.w + 'px',
                height: zone.h + 'px',
                borderColor: ZONE_COLORS[zone.colorIdx].hex,
                background: ZONE_COLORS[zone.colorIdx].bg,
                cursor: mode === 'merchant' ? (tool === 'select' ? 'move' : 'default') : 'default',
                pointerEvents: mode === 'buyer' ? 'none' : 'auto',
              }"
              @mousedown="onZoneMousedown($event, zone)"
            >
              <div
                class="z-label"
                :style="{ background: ZONE_COLORS[zone.colorIdx].lbl, color: '#fff' }"
              >{{ zone.name }}</div>
              <div
                v-if="mode === 'merchant'"
                class="z-resize"
                :style="{ color: ZONE_COLORS[zone.colorIdx].hex }"
                @mousedown="onResizeMousedown($event, zone)"
              ></div>
            </div>
          </div>

          <button class="add-to-cart">Add to cart</button>
        </div>

      </div>
    </div>
  </div>
</template>
