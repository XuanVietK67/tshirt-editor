import { ref, computed } from "vue";

export interface ZoneColor {
  hex: string;
  bg: string;
  lbl: string;
}

export type ZoneShape =
  | "rect"
  | "rounded-rect"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "star"
  | "pentagon"
  | "hexagon"
  | "heart"
  | "arrow";

export interface ZoneShapeMeta {
  id: ZoneShape;
  label: string;
}

export const ZONE_SHAPES: ZoneShapeMeta[] = [
  { id: "rect",         label: "Rectangle"   },
  { id: "rounded-rect", label: "Rounded Rect" },
  { id: "ellipse",      label: "Ellipse"     },
  { id: "triangle",     label: "Triangle"    },
  { id: "diamond",      label: "Diamond"     },
  { id: "star",         label: "Star"        },
  { id: "pentagon",     label: "Pentagon"    },
  { id: "hexagon",      label: "Hexagon"     },
  { id: "heart",        label: "Heart"       },
  { id: "arrow",        label: "Arrow"       },
];

/**
 * Build an SVG path string for path-based zone shapes.
 * Called for: triangle, diamond, star, pentagon, hexagon, heart, arrow.
 * rect / rounded-rect / ellipse use native Konva shapes instead.
 */
export function buildShapePath(shape: ZoneShape, w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const f = (n: number) => n.toFixed(2);

  switch (shape) {
    case "triangle":
      return `M ${f(cx)} 0 L ${f(w)} ${f(h)} L 0 ${f(h)} Z`;

    case "diamond":
      return `M ${f(cx)} 0 L ${f(w)} ${f(cy)} L ${f(cx)} ${f(h)} L 0 ${f(cy)} Z`;

    case "star": {
      const oRx = cx, oRy = cy, iRx = cx * 0.42, iRy = cy * 0.42;
      let d = "";
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rx = i % 2 === 0 ? oRx : iRx;
        const ry = i % 2 === 0 ? oRy : iRy;
        d += (i === 0 ? "M" : "L") + ` ${f(cx + rx * Math.cos(a))} ${f(cy + ry * Math.sin(a))} `;
      }
      return d + "Z";
    }

    case "pentagon": {
      let d = "";
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        d += (i === 0 ? "M" : "L") + ` ${f(cx + cx * Math.cos(a))} ${f(cy + cy * Math.sin(a))} `;
      }
      return d + "Z";
    }

    case "hexagon": {
      let d = "";
      for (let i = 0; i < 6; i++) {
        const a = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        d += (i === 0 ? "M" : "L") + ` ${f(cx + cx * Math.cos(a))} ${f(cy + cy * Math.sin(a))} `;
      }
      return d + "Z";
    }

    case "heart": {
      const s = (px: number, py: number) =>
        `${f((px / 100) * w)} ${f((py / 100) * h)}`;
      return [
        `M ${s(50, 85)}`,
        `C ${s(50, 85)} ${s(0, 58)} ${s(0, 30)}`,
        `C ${s(0, 10)} ${s(50, 15)} ${s(50, 40)}`,
        `C ${s(50, 15)} ${s(100, 10)} ${s(100, 30)}`,
        `C ${s(100, 58)} ${s(50, 85)} ${s(50, 85)} Z`,
      ].join(" ");
    }

    case "arrow": {
      const y1 = f(h * 0.32), y2 = f(h * 0.68), sx = f(w * 0.62);
      return `M 0 ${y1} L ${sx} ${y1} L ${sx} 0 L ${f(w)} ${f(cy)} L ${sx} ${f(h)} L ${sx} ${y2} L 0 ${y2} Z`;
    }

    default:
      return "";
  }
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
  shape: ZoneShape;
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
const activeShape = ref<ZoneShape>("rect");

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
      shape: activeShape.value,
      features: [...enabledFeatures.value],
      required: false,
      maxItems: "3",
      showBorder: true,
    };
    zones.value.push(z);
    selectedZoneId.value = z.id;
  }

  function setActiveShape(s: ZoneShape) {
    activeShape.value = s;
  }

  /** Replace all zones (used when loading a saved config). Updates the ID counter. */
  function setZones(zonesData: Zone[]) {
    zones.value = [...zonesData];
    selectedZoneId.value = null;
    const maxId = zonesData.reduce((max, z) => {
      const n = parseInt(z.id.slice(1), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 2);
    zoneIdCtr = maxId + 1;
  }

  /** Replace the enabled-features set (used when loading a saved config). */
  function setEnabledFeatures(features: string[]) {
    enabledFeatures.value = new Set(features);
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
    activeShape,
    addZone,
    addDefaultZone,
    deleteZone,
    selectZone,
    deselectZone,
    toggleFeature,
    setTool,
    setMode,
    setProductImage,
    setActiveShape,
    setZones,
    setEnabledFeatures,
  };
}
