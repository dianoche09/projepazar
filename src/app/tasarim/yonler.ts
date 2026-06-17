export type Yon = {
  id: string;
  ad: string;
  vibe: string;
  bg: string;
  surface: string;
  panel: string; // sidebar / koyu yüzey
  ink: string;
  sub: string;
  line: string;
  accent: string;
  accentInk: string;
  radius: number;
  shadow: string;
  fontDisplay: string;
  fontBody: string;
  displayWeight: number;
  upper?: boolean;
};

export const YONLER: Yon[] = [
  {
    id: "luks",
    ad: "Lüks · Premium",
    vibe: "sakin lüks · editöryel · ince altın çizgi",
    bg: "#FAF8F4",
    surface: "#FFFFFF",
    panel: "#14110F",
    ink: "#14110F",
    sub: "#6B6258",
    line: "#E7E0D6",
    accent: "#C9A96A",
    accentInk: "#14110F",
    radius: 4,
    shadow: "0 1px 2px rgba(20,17,15,.05)",
    fontDisplay: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    displayWeight: 600,
  },
  {
    id: "minimal",
    ad: "Sakin · Minimal",
    vibe: "az ama öz · hız · tek elektrik aksan",
    bg: "#FAFAFA",
    surface: "#FFFFFF",
    panel: "#FFFFFF",
    ink: "#18181B",
    sub: "#71717A",
    line: "#E4E4E7",
    accent: "#5B5BD6",
    accentInk: "#FFFFFF",
    radius: 8,
    shadow: "0 1px 2px rgba(0,0,0,.04)",
    fontDisplay: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    displayWeight: 600,
  },
  {
    id: "cesur",
    ad: "Cesur · Enerjik",
    vibe: "iddialı · dev rakam · renk blok · hareket",
    bg: "#0A0A12",
    surface: "#15151F",
    panel: "#0E0E18",
    ink: "#FFFFFF",
    sub: "#9AA0B5",
    line: "#26263A",
    accent: "#C8FF3D",
    accentInk: "#0A0A12",
    radius: 12,
    shadow: "0 8px 30px rgba(0,0,0,.45)",
    fontDisplay: "'Space Grotesk', sans-serif",
    fontBody: "'Space Grotesk', sans-serif",
    displayWeight: 700,
    upper: true,
  },
  {
    id: "sicak",
    ad: "Sıcak · İnsani",
    vibe: "davetkâr · toprak/terracotta · yuvarlak · güven",
    bg: "#F2E9DE",
    surface: "#FBF6EF",
    panel: "#3A2317",
    ink: "#3A2317",
    sub: "#7C6A5C",
    line: "#E4D6C6",
    accent: "#E07A5F",
    accentInk: "#FFFFFF",
    radius: 18,
    shadow: "0 4px 16px rgba(58,35,23,.08)",
    fontDisplay: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    displayWeight: 700,
  },
];

export const SINYAL = { musait: "#2FB36B", opsiyon: "#E3A12C", satildi: "#D15A4E" };
export const RENK: Record<string, string> = {
  g: SINYAL.musait,
  a: SINYAL.opsiyon,
  r: SINYAL.satildi,
};

// 8 kat × 5 birim — durum deseni (üst→alt)
export const KATLAR: ("g" | "a" | "r")[][] = [
  ["g", "g", "g", "g", "g"],
  ["g", "g", "a", "g", "g"],
  ["g", "a", "g", "g", "r"],
  ["g", "g", "r", "a", "g"],
  ["a", "r", "g", "g", "g"],
  ["g", "r", "r", "g", "a"],
  ["r", "g", "a", "r", "g"],
  ["r", "r", "g", "a", "r"],
];

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap";
