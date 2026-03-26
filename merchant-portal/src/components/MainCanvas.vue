<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import Konva from "konva";
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

// ── Photo upload ──────────────────────────────────────────────
const photoInputRef = ref<HTMLInputElement | null>(null);
function triggerPhotoUpload() { photoInputRef.value?.click(); }
function onPhotoSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  setProductImage(URL.createObjectURL(file));
  (e.target as HTMLInputElement).value = "";
}
function removePhoto() { setProductImage(null); }

// ── Stage dimensions (responsive) ────────────────────────────
const stageContainerRef = ref<HTMLDivElement | null>(null);
const stageW = ref(400);
const STAGE_H = 280;

let ro: ResizeObserver | null = null;
onMounted(() => {
  if (stageContainerRef.value) {
    ro = new ResizeObserver((entries) => {
      stageW.value = entries[0].contentRect.width || 400;
    });
    ro.observe(stageContainerRef.value);
    stageW.value = stageContainerRef.value.clientWidth || 400;
  }
});
onUnmounted(() => ro?.disconnect());

const stageConfig = computed(() => ({ width: stageW.value, height: STAGE_H }));

// ── Product image ─────────────────────────────────────────────
const konvaImage = ref<HTMLImageElement | null>(null);
const bgImageConfig = computed(() => ({
  image: konvaImage.value,
  x: 0,
  y: 0,
  width: stageW.value,
  height: STAGE_H,
  listening: false,
}));

watch(productImage, (url) => {
  if (!url) { konvaImage.value = null; return; }
  const img = new Image();
  img.onload = () => { konvaImage.value = img; };
  img.src = url;
}, { immediate: true });

// ── Zones ─────────────────────────────────────────────────────
const imgZones = computed(() => zones.value.filter((z) => z.canvas === "img"));

function zoneGroupConfig(zone: Zone) {
  return {
    x: zone.x,
    y: zone.y,
    draggable: mode.value === "merchant",
    id: zone.id,
  };
}

function zoneRectConfig(zone: Zone) {
  const color = ZONE_COLORS[zone.colorIdx];
  const isSelected = zone.id === selectedZoneId.value;
  return {
    x: 0,
    y: 0,
    width: zone.w,
    height: zone.h,
    fill: color.bg,
    stroke: isSelected ? "#2c6ecb" : color.hex,
    strokeWidth: isSelected ? 2.5 : 2,
    cornerRadius: 5,
    shadowColor: isSelected ? "rgba(0,0,0,0.15)" : "transparent",
    shadowBlur: isSelected ? 8 : 0,
    shadowOffsetY: isSelected ? 2 : 0,
    listening: true,
  };
}

function zoneLabelTagConfig(zone: Zone) {
  return {
    fill: ZONE_COLORS[zone.colorIdx].lbl,
    cornerRadius: [4, 4, 0, 0] as [number, number, number, number],
    lineJoin: "round" as const,
  };
}

function zoneLabelTextConfig(zone: Zone) {
  return {
    text: zone.name,
    fill: "#fff",
    fontSize: 10,
    fontFamily: "DM Mono, monospace",
    fontStyle: "600",
    padding: 4,
  };
}

function resizeHandleConfig(zone: Zone) {
  return {
    x: zone.w - 14,
    y: zone.h - 14,
    width: 14,
    height: 14,
    fill: "transparent",
    name: "resize-handle",
  };
}

// ── Zone drag ─────────────────────────────────────────────────
const isDragging = ref(false);

function onZoneMousedown(zone: Zone) {
  if (mode.value !== "merchant") return;
  selectZone(zone.id);
}

function onZoneDragstart(zone: Zone) {
  isDragging.value = true;
  selectZone(zone.id);
}

function onZoneDragmove(e: { target: Konva.Group }, zone: Zone) {
  const node = e.target;
  const newX = Math.max(0, Math.min(node.x(), stageW.value - zone.w));
  const newY = Math.max(0, Math.min(node.y(), STAGE_H - zone.h));
  node.x(newX);
  node.y(newY);
}

function onZoneDragend(e: { target: Konva.Group }, zone: Zone) {
  zone.x = Math.round(e.target.x());
  zone.y = Math.round(e.target.y());
  isDragging.value = false;
}

// ── Zone resize ───────────────────────────────────────────────
let resizingZone: Zone | null = null;
let resizePointerStartX = 0;
let resizePointerStartY = 0;
let resizeInitW = 0;
let resizeInitH = 0;

function onResizePointerdown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, zone: Zone) {
  e.cancelBubble = true;
  resizingZone = zone;
  const pos = e.target.getStage()!.getPointerPosition()!;
  resizePointerStartX = pos.x;
  resizePointerStartY = pos.y;
  resizeInitW = zone.w;
  resizeInitH = zone.h;
}

function onStageMousedelta(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  if (!resizingZone) return;
  const stage = e.target.getStage();
  if (!stage) return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  const dx = pos.x - resizePointerStartX;
  const dy = pos.y - resizePointerStartY;
  resizingZone.w = Math.max(40, Math.round(resizeInitW + dx));
  resizingZone.h = Math.max(24, Math.round(resizeInitH + dy));
}

function onStageMouseup() {
  resizingZone = null;
  if (isDrawing.value) finishDraw();
}

// ── Drawing new zones ─────────────────────────────────────────
const isDrawing = ref(false);
const drawPreview = ref({ x: 0, y: 0, w: 0, h: 0, visible: false });
let drawStartX = 0;
let drawStartY = 0;

const drawPreviewConfig = computed(() => ({
  x: drawPreview.value.x,
  y: drawPreview.value.y,
  width: drawPreview.value.w,
  height: drawPreview.value.h,
  stroke: "#2c6ecb",
  strokeWidth: 2,
  dash: [6, 3],
  fill: "rgba(108,99,255,0.08)",
  cornerRadius: 5,
  listening: false,
}));

function onStageMousedown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  if (mode.value !== "merchant") return;
  // Only draw when clicking the stage background (not a zone)
  if (e.target !== e.target.getStage()) return;
  if (tool.value !== "draw") {
    deselectZone();
    return;
  }
  const pos = e.target.getStage()!.getPointerPosition()!;
  drawStartX = pos.x;
  drawStartY = pos.y;
  isDrawing.value = true;
  drawPreview.value = { x: pos.x, y: pos.y, w: 0, h: 0, visible: true };
}

function onStageMousemove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  onStageMousedelta(e);
  if (!isDrawing.value) return;
  const stage = e.target.getStage();
  if (!stage) return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  drawPreview.value = {
    visible: true,
    x: Math.min(drawStartX, pos.x),
    y: Math.min(drawStartY, pos.y),
    w: Math.abs(pos.x - drawStartX),
    h: Math.abs(pos.y - drawStartY),
  };
}

function finishDraw() {
  isDrawing.value = false;
  const { x, y, w, h } = drawPreview.value;
  drawPreview.value = { ...drawPreview.value, visible: false };
  if (w > 24 && h > 18) {
    addZone("img", Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  } else if (!productImage.value) {
    triggerPhotoUpload();
  }
}

// ── Canvas cursor ─────────────────────────────────────────────
const stageCursor = computed(() => {
  if (mode.value === "buyer") return "default";
  if (isDragging.value) return "grabbing";
  if (tool.value === "draw") return "crosshair";
  return "default";
});

const canvasHint = computed(() => {
  if (mode.value === "buyer") return "Buyer view — zones are locked";
  if (tool.value === "draw")
    return "Click a zone to select · drag to move · draw on canvas to add a zone";
  return "Click a zone to select · drag to move · drag corner to resize";
});
</script>

<template>
  <div class="main-col">
    <!-- Canvas toolbar -->
    <div class="canvas-topbar">
      <div class="seg-ctrl">
        <button class="seg-btn" :class="{ active: mode === 'merchant' }" @click="setMode('merchant')">
          Merchant
        </button>
        <button class="seg-btn" :class="{ active: mode === 'buyer' }" @click="setMode('buyer')">
          Buyer preview
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 6px; margin-left: 14px">
        <button class="tool-btn" :class="{ active: tool === 'draw' }" title="Draw zone" @click="setTool('draw')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 2" />
          </svg>
        </button>
        <button class="tool-btn" :class="{ active: tool === 'select' }" title="Select / move" @click="setTool('select')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2l3.5 9 2-3.5 3.5-2L2 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="canvas-tools">
        <button class="tool-btn" title="Fit view">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 4.5V2h2.5M9 2h2.5v2.5M11.5 8.5V11H9M4 11H1.5V8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <span style="margin-left: 12px; font-size: 11px; color: var(--text3)">{{ canvasHint }}</span>
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
          <input ref="photoInputRef" type="file" accept="image/*" style="display: none" @change="onPhotoSelected" />

          <!-- Konva stage container -->
          <div ref="stageContainerRef" class="konva-stage-wrap" :style="{ cursor: stageCursor }">

            <!-- Placeholder when no image -->
            <div v-if="!productImage" class="product-img-bg" style="pointer-events: none">
              <div class="img-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="14" rx="2.5" stroke="var(--text3)" stroke-width="1.3" />
                  <circle cx="8" cy="9.5" r="1.8" fill="var(--text3)" />
                  <path d="M2 15l5-4.5 3.5 3.5 3-2.5 6.5 5.5" stroke="var(--text3)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <span class="img-hint" v-if="mode === 'merchant'">Click to upload · drag to add zone</span>
              <span class="img-hint" v-else>Product photo</span>
            </div>

            <!-- Controls overlay when image is set (merchant mode only) -->
            <div v-if="productImage && mode === 'merchant'" class="product-img-controls">
              <button class="img-ctrl-btn" title="Change photo" @click.stop="triggerPhotoUpload()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 6a4.5 4.5 0 1 0 4.5-4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                  <path d="M1.5 2.5v3.5h3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Change
              </button>
              <button class="img-ctrl-btn img-ctrl-remove" title="Remove photo" @click.stop="removePhoto()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                </svg>
                Remove
              </button>
            </div>

            <!-- Konva stage -->
            <v-stage
              :config="stageConfig"
              @mousedown="onStageMousedown"
              @mousemove="onStageMousemove"
              @mouseup="onStageMouseup"
              @touchstart="onStageMousedown"
              @touchmove="onStageMousemove"
              @touchend="onStageMouseup"
            >
              <!-- Background: product image -->
              <v-layer>
                <v-image v-if="konvaImage" :config="bgImageConfig" />
              </v-layer>

              <!-- Zones layer -->
              <v-layer>
                <!-- Draw preview -->
                <v-rect v-if="drawPreview.visible" :config="drawPreviewConfig" />

                <!-- Zone groups -->
                <v-group
                  v-for="zone in imgZones"
                  :key="zone.id"
                  :config="zoneGroupConfig(zone)"
                  @mousedown="onZoneMousedown(zone)"
                  @touchstart="onZoneMousedown(zone)"
                  @dragstart="onZoneDragstart(zone)"
                  @dragmove="onZoneDragmove($event, zone)"
                  @dragend="onZoneDragend($event, zone)"
                >
                  <!-- Zone background -->
                  <v-rect :config="zoneRectConfig(zone)" />

                  <!-- Label above zone -->
                  <v-label :config="{ x: 0, y: -22 }">
                    <v-tag :config="zoneLabelTagConfig(zone)" />
                    <v-text :config="zoneLabelTextConfig(zone)" />
                  </v-label>

                  <!-- Resize handle (bottom-right corner) -->
                  <v-rect
                    v-if="mode === 'merchant'"
                    :config="resizeHandleConfig(zone)"
                    @mousedown="onResizePointerdown($event, zone)"
                    @touchstart="onResizePointerdown($event, zone)"
                  />
                </v-group>
              </v-layer>
            </v-stage>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
