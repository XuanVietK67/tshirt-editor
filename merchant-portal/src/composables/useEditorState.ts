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
