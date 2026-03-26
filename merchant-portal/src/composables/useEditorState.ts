import { ref, computed } from "vue";

export interface ZoneColor {
  hex: string;
  bg: string;
  lbl: string;
}

export interface Zone {
  id: string;
  name: string;
  colorIdx: number;
  canvas: "img" | "body";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  features: string[];
  required: boolean;
  maxItems: string;
  showBorder: boolean;
}

export const ZONE_COLORS: ZoneColor[] = [
  { hex: "#6c63ff", bg: "rgba(108,99,255,0.15)", lbl: "rgba(108,99,255,0.9)" },
  { hex: "#22c55e", bg: "rgba(34,197,94,0.15)", lbl: "rgba(34,197,94,0.9)" },
  { hex: "#f59e0b", bg: "rgba(245,158,11,0.15)", lbl: "rgba(245,158,11,0.9)" },
  { hex: "#ef4444", bg: "rgba(239,68,68,0.15)", lbl: "rgba(239,68,68,0.9)" },
  { hex: "#06b6d4", bg: "rgba(6,182,212,0.15)", lbl: "rgba(6,182,212,0.9)" },
  { hex: "#ec4899", bg: "rgba(236,72,153,0.15)", lbl: "rgba(236,72,153,0.9)" },
];

export const STAGE_W = 520;
export const STAGE_H = 420;

/**
 * Axis-aligned bounding box of a (possibly rotated) zone.
 * Returns the min/max x and y of the four rotated corners.
 */
export function computeZoneBounds(zone: Zone) {
  const θ = (zone.rotation * Math.PI) / 180;
  const c = Math.cos(θ), s = Math.sin(θ);
  const { x, y, w, h } = zone;
  const dxs = [0, w * c, w * c - h * s, -h * s];
  const dys = [0, w * s, w * s + h * c,  h * c];
  return {
    minX: x + Math.min(...dxs),
    maxX: x + Math.max(...dxs),
    minY: y + Math.min(...dys),
    maxY: y + Math.max(...dys),
  };
}

/**
 * Maximum width such that TR and BR corners stay within the stage,
 * given the current x, y, h, and rotation.
 */
export function computeWMax(zone: Zone): number {
  const θ = (zone.rotation * Math.PI) / 180;
  const c = Math.cos(θ), s = Math.sin(θ);
  const { x, y, h } = zone;
  const upper: number[] = [];
  // TR corner: (x + w·c, y + w·s)
  if (c > 1e-9)  upper.push((STAGE_W - x) / c);
  if (c < -1e-9) upper.push(-x / c);
  if (s > 1e-9)  upper.push((STAGE_H - y) / s);
  if (s < -1e-9) upper.push(-y / s);
  // BR corner: (x + w·c − h·s, y + w·s + h·c)
  if (c > 1e-9)  upper.push((STAGE_W - x + h * s) / c);
  if (c < -1e-9) upper.push((h * s - x) / c);
  if (s > 1e-9)  upper.push((STAGE_H - y - h * c) / s);
  if (s < -1e-9) upper.push((-y - h * c) / s);
  const valid = upper.filter((v) => isFinite(v) && v > 0);
  return valid.length > 0 ? Math.max(40, Math.floor(Math.min(...valid))) : 40;
}

/**
 * Maximum height such that BL and BR corners stay within the stage,
 * given the current x, y, w, and rotation.
 */
export function computeHMax(zone: Zone): number {
  const θ = (zone.rotation * Math.PI) / 180;
  const c = Math.cos(θ), s = Math.sin(θ);
  const { x, y, w } = zone;
  const upper: number[] = [];
  // BL corner: (x − h·s, y + h·c)
  if (s < -1e-9) upper.push((STAGE_W - x) / (-s));
  if (s > 1e-9)  upper.push(x / s);
  if (c > 1e-9)  upper.push((STAGE_H - y) / c);
  if (c < -1e-9) upper.push(-y / c);
  // BR corner: (x + w·c − h·s, y + w·s + h·c)
  const trx = x + w * c, try_ = y + w * s;
  if (s < -1e-9) upper.push((STAGE_W - trx) / (-s));
  if (s > 1e-9)  upper.push(trx / s);
  if (c > 1e-9)  upper.push((STAGE_H - try_) / c);
  if (c < -1e-9) upper.push(-try_ / c);
  const valid = upper.filter((v) => isFinite(v) && v > 0);
  return valid.length > 0 ? Math.max(24, Math.floor(Math.min(...valid))) : 24;
}

export const ALL_FEATURES = ["text", "image", "sticker", "icon"] as const;
export const FEATURE_LABELS: Record<string, string> = {
  text: "Text",
  image: "Image",
  sticker: "Sticker",
  icon: "Icon",
};

// Singleton state shared across the editor
let zoneIdCtr = 3;

const zones = ref<Zone[]>([]);
const selectedZoneId = ref<string | null>(null);
const enabledFeatures = ref<Set<string>>(
  new Set(["text", "image", "sticker", "icon"]),
);
const tool = ref<"draw" | "select">("draw");
const mode = ref<"merchant" | "buyer">("merchant");
const productImage = ref<string | null>(null);

export function useEditorState() {
  function uid() {
    return "z" + zoneIdCtr++;
  }

  const selectedZone = computed(
    () => zones.value.find((z) => z.id === selectedZoneId.value) ?? null,
  );

  const enabledFeaturesCount = computed(() => enabledFeatures.value.size);

  function addZone(
    canvas: "img" | "body",
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const z: Zone = {
      id: uid(),
      name: "Zone " + (zones.value.length + 1),
      colorIdx: zones.value.length % ZONE_COLORS.length,
      canvas,
      x,
      y,
      w,
      h,
      rotation: 0,
      features: [...enabledFeatures.value],
      required: false,
      maxItems: "3",
      showBorder: true,
    };
    zones.value.push(z);
    selectedZoneId.value = z.id;
  }

  function addDefaultZone() {
    addZone("img", 30, 30, 140, 90);
  }

  function deleteZone(id: string) {
    zones.value = zones.value.filter((z) => z.id !== id);
    if (selectedZoneId.value === id) selectedZoneId.value = null;
  }

  function selectZone(id: string) {
    selectedZoneId.value = id;
  }

  function deselectZone() {
    selectedZoneId.value = null;
  }

  function toggleFeature(name: string, val: boolean) {
    const f = new Set(enabledFeatures.value);
    if (val) f.add(name);
    else f.delete(name);
    enabledFeatures.value = f;
  }

  function setTool(t: "draw" | "select") {
    tool.value = t;
  }

  function setMode(m: "merchant" | "buyer") {
    mode.value = m;
    if (m === "buyer") selectedZoneId.value = null;
  }

  function setProductImage(url: string | null) {
    productImage.value = url;
  }

  return {
    zones,
    selectedZoneId,
    selectedZone,
    enabledFeatures,
    enabledFeaturesCount,
    tool,
    mode,
    productImage,
    addZone,
    addDefaultZone,
    deleteZone,
    selectZone,
    deselectZone,
    toggleFeature,
    setTool,
    setMode,
    setProductImage,
  };
}
