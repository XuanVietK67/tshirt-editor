<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  useEditorState,
  ZONE_COLORS,
  type Zone,
} from "@/composables/useEditorState";

const {
  zones,
  selectedZoneId,
  tool,
  mode,
  productImage,
  addZone,
  selectZone,
  deselectZone,
  setTool,
  setMode,
  setProductImage,
} = useEditorState();

const photoInputRef = ref<HTMLInputElement | null>(null);

function triggerPhotoUpload() {
  photoInputRef.value?.click();
}

function onPhotoSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setProductImage(url);
  // Reset input so the same file can be re-selected
  (e.target as HTMLInputElement).value = "";
}

function removePhoto() {
  setProductImage(null);
}

const imgCanvasRef = ref<HTMLElement | null>(null);
const bodyCanvasRef = ref<HTMLElement | null>(null);

// Track newly created zone for entrance animation
const newZoneId = ref<string | null>(null);
let newZoneTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => zones.value.length,
  async (newLen, oldLen) => {
    if (newLen <= oldLen) return;
    const newest = zones.value[newLen - 1];
    newZoneId.value = newest.id;
    if (newZoneTimer) clearTimeout(newZoneTimer);
    newZoneTimer = setTimeout(() => { newZoneId.value = null; }, 700);
    await nextTick();
    const el = document.querySelector(`[data-zone-id="${newest.id}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  },
);

// Drawing state
let isDrawing = false;
let drawCanvasEl: HTMLElement | null = null;
let drawCanvasName: "img" | "body" = "img";
let startX = 0;
let startY = 0;

const drawPreview = ref({ visible: false, x: 0, y: 0, w: 0, h: 0, canvas: "" });

// Drag / resize state
let dragZone: Zone | null = null;
let dragOffX = 0;
let dragOffY = 0;
let resizeZone: Zone | null = null;

// Reactive dragging flag for cursor feedback
const isDragging = ref(false);

const canvasHint = computed(() => {
  if (mode.value === "buyer") return "Buyer view — zones are locked";
  if (tool.value === "draw")
    return "Click a zone to select · drag to move · draw on canvas to add a zone";
  return "Click a zone to select · drag to move · drag corner to resize";
});

function getCanvasEl(canvas: "img" | "body") {
  return canvas === "img" ? imgCanvasRef.value : bodyCanvasRef.value;
}

// Unified coordinate extractor for mouse and touch events
function getEventCoords(e: MouseEvent | TouchEvent) {
  if ("touches" in e) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return { clientX: t.clientX, clientY: t.clientY };
  }
  return { clientX: e.clientX, clientY: e.clientY };
}

// Zone pointer down — always select + drag regardless of active tool
function onZonePointerdown(e: MouseEvent | TouchEvent, zone: Zone) {
  if (mode.value !== "merchant") return;
  e.stopPropagation();
  selectZone(zone.id);
  const { clientX, clientY } = getEventCoords(e);
  const c = getCanvasEl(zone.canvas)!;
  const cr = c.getBoundingClientRect();
  dragZone = zone;
  dragOffX = clientX - cr.left - zone.x;
  dragOffY = clientY - cr.top - zone.y;
  isDragging.value = true;
}

// Canvas pointer down — only start drawing in draw mode
function onCanvasPointerdown(
  e: MouseEvent | TouchEvent,
  canvasEl: HTMLElement,
  canvasName: "img" | "body",
) {
  if (mode.value !== "merchant" || tool.value !== "draw") return;
  if ((e.target as HTMLElement).closest(".z-rect")) return;
  const { clientX, clientY } = getEventCoords(e);
  isDrawing = true;
  drawCanvasEl = canvasEl;
  drawCanvasName = canvasName;
  const r = canvasEl.getBoundingClientRect();
  startX = clientX - r.left;
  startY = clientY - r.top;
  drawPreview.value = { visible: true, x: startX, y: startY, w: 0, h: 0, canvas: canvasName };
}

// Resize handle pointer down
function onResizePointerdown(e: MouseEvent | TouchEvent, zone: Zone) {
  e.stopPropagation();
  e.preventDefault();
  resizeZone = zone;
}

// Shared move logic used by both mouse and touch
function handleMove(clientX: number, clientY: number) {
  if (isDrawing && drawCanvasEl) {
    const r = drawCanvasEl.getBoundingClientRect();
    const cx = clientX - r.left;
    const cy = clientY - r.top;
    drawPreview.value = {
      visible: true,
      x: Math.min(startX, cx),
      y: Math.min(startY, cy),
      w: Math.abs(cx - startX),
      h: Math.abs(cy - startY),
      canvas: drawCanvasName,
    };
    return;
  }
  if (dragZone) {
    const c = getCanvasEl(dragZone.canvas)!;
    const cr = c.getBoundingClientRect();
    dragZone.x = Math.max(
      0,
      Math.min(Math.round(clientX - cr.left - dragOffX), cr.width - dragZone.w),
    );
    dragZone.y = Math.max(
      0,
      Math.min(Math.round(clientY - cr.top - dragOffY), cr.height - dragZone.h),
    );
    return;
  }
  if (resizeZone) {
    const c = getCanvasEl(resizeZone.canvas)!;
    const cr = c.getBoundingClientRect();
    resizeZone.w = Math.max(40, Math.round(clientX - cr.left - resizeZone.x));
    resizeZone.h = Math.max(24, Math.round(clientY - cr.top - resizeZone.y));
  }
}

function onMousemove(e: MouseEvent) {
  handleMove(e.clientX, e.clientY);
}

function onTouchMove(e: TouchEvent) {
  // Prevent page scroll while dragging/drawing
  if (isDrawing || dragZone || resizeZone) e.preventDefault();
  const t = e.touches[0];
  if (t) handleMove(t.clientX, t.clientY);
}

function onPointerUp() {
  if (isDrawing) {
    const { x, y, w, h } = drawPreview.value;
    if (w > 24 && h > 18) {
      addZone(drawCanvasName, x, y, w, h);
    } else if (!productImage.value && drawCanvasName === 'img') {
      triggerPhotoUpload();
    }
    isDrawing = false;
    drawPreview.value = { ...drawPreview.value, visible: false };
    drawCanvasEl = null;
  }
  dragZone = null;
  resizeZone = null;
  isDragging.value = false;
}

onMounted(() => {
  document.addEventListener("mousemove", onMousemove);
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onPointerUp);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onMousemove);
  document.removeEventListener("mouseup", onPointerUp);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onPointerUp);
});
</script>

<template>
  <div class="main-col">
    <!-- Canvas toolbar -->
    <div class="canvas-topbar">
      <div class="seg-ctrl">
        <button
          class="seg-btn"
          :class="{ active: mode === 'merchant' }"
          @click="setMode('merchant')"
        >
          Merchant
        </button>
        <button
          class="seg-btn"
          :class="{ active: mode === 'buyer' }"
          @click="setMode('buyer')"
        >
          Buyer preview
        </button>
      </div>

      <div
        style="display: flex; align-items: center; gap: 6px; margin-left: 14px"
      >
        <button
          class="tool-btn"
          :class="{ active: tool === 'draw' }"
          title="Draw zone"
          @click="setTool('draw')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1"
              y="1"
              width="11"
              height="11"
              rx="2"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-dasharray="3 2"
            />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'select' }"
          title="Select / move"
          @click="setTool('select')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M2 2l3.5 9 2-3.5 3.5-2L2 2z"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="canvas-tools">
        <button class="tool-btn" title="Fit view">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M1.5 4.5V2h2.5M9 2h2.5v2.5M11.5 8.5V11H9M4 11H1.5V8.5"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <span style="margin-left: 12px; font-size: 11px; color: var(--text3)">{{
        canvasHint
      }}</span>
    </div>

    <!-- Canvas body -->
    <div class="canvas-body">
      <div class="canvas-inner" @click.self="deselectZone">
        <div class="product-stage">
          <!-- Buyer overlay -->
          <div v-if="mode === 'buyer'" class="buyer-overlay">
            <div class="buyer-badge">Buyer Preview</div>
          </div>

          <!-- Hidden file input -->
          <input
            ref="photoInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="onPhotoSelected"
          />

          <!-- Image canvas -->
          <div
            ref="imgCanvasRef"
            class="product-img-area"
            :style="{ cursor: mode === 'merchant' && tool === 'draw' ? 'crosshair' : 'default' }"
            @mousedown="onCanvasPointerdown($event, imgCanvasRef!, 'img')"
            @touchstart.prevent="onCanvasPointerdown($event, imgCanvasRef!, 'img')"
          >
            <!-- Uploaded product photo background -->
            <img
              v-if="productImage"
              :src="productImage"
              class="product-img-photo"
              draggable="false"
            />

            <!-- Placeholder when no image uploaded -->
            <div v-if="!productImage" class="product-img-bg">
              <div class="img-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect
                    x="2"
                    y="4"
                    width="18"
                    height="14"
                    rx="2.5"
                    stroke="var(--text3)"
                    stroke-width="1.3"
                  />
                  <circle cx="8" cy="9.5" r="1.8" fill="var(--text3)" />
                  <path
                    d="M2 15l5-4.5 3.5 3.5 3-2.5 6.5 5.5"
                    stroke="var(--text3)"
                    stroke-width="1.3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <span class="img-hint" v-if="mode === 'merchant'">Click to upload · drag to add zone</span>
              <span class="img-hint" v-else>Product photo</span>
            </div>

            <!-- Controls overlay when image is set (merchant mode only) -->
            <div v-if="productImage && mode === 'merchant'" class="product-img-controls">
              <button class="img-ctrl-btn" title="Change photo" @click.stop="triggerPhotoUpload()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 6a4.5 4.5 0 1 0 4.5-4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  <path d="M1.5 2.5v3.5h3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Change
              </button>
              <button class="img-ctrl-btn img-ctrl-remove" title="Remove photo" @click.stop="removePhoto()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                Remove
              </button>
            </div>

            <!-- Drawing preview on img canvas -->
            <div
              v-if="drawPreview.visible && drawPreview.canvas === 'img'"
              class="z-drawing"
              :style="{
                left: drawPreview.x + 'px',
                top: drawPreview.y + 'px',
                width: drawPreview.w + 'px',
                height: drawPreview.h + 'px',
              }"
            ></div>

            <!-- Zone rects on img canvas -->
            <div
              v-for="zone in zones.filter((z) => z.canvas === 'img')"
              :key="zone.id"
              class="z-rect"
              :class="{
                'z-selected': selectedZoneId === zone.id,
                'z-new': newZoneId === zone.id,
                'z-dragging': isDragging && selectedZoneId === zone.id,
              }"
              :data-zone-id="zone.id"
              :style="{
                left: zone.x + 'px',
                top: zone.y + 'px',
                width: zone.w + 'px',
                height: zone.h + 'px',
                borderColor: ZONE_COLORS[zone.colorIdx].hex,
                background: ZONE_COLORS[zone.colorIdx].bg,
                cursor:
                  mode === 'buyer'
                    ? 'default'
                    : isDragging && selectedZoneId === zone.id
                      ? 'grabbing'
                      : 'grab',
                pointerEvents: mode === 'buyer' ? 'none' : 'auto',
              }"
              @mousedown="onZonePointerdown($event, zone)"
              @touchstart.prevent="onZonePointerdown($event, zone)"
            >
              <div
                class="z-label"
                :style="{
                  background: ZONE_COLORS[zone.colorIdx].lbl,
                  color: '#fff',
                }"
              >
                {{ zone.name }}
              </div>
              <div
                v-if="mode === 'merchant'"
                class="z-resize"
                :style="{ color: ZONE_COLORS[zone.colorIdx].hex }"
                @mousedown.stop="onResizePointerdown($event, zone)"
                @touchstart.prevent.stop="onResizePointerdown($event, zone)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
