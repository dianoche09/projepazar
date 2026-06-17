/* eslint-disable @next/next/no-page-custom-font */
import type { CSSProperties } from "react";

export const metadata = { title: "Tasarım Yönleri — ProjePazar" };

type Yon = {
  id: string;
  ad: string;
  vibe: string;
  bg: string;
  surface: string;
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

const YONLER: Yon[] = [
  {
    id: "luks",
    ad: "Lüks · Premium",
    vibe: "sakin lüks · editöryel · ince altın çizgi",
    bg: "#FAF8F4",
    surface: "#FFFFFF",
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

const SINYAL = { musait: "#2FB36B", opsiyon: "#E3A12C", satildi: "#D15A4E" };

// Bina kesiti deseni (üst→alt kat) — pencere durumu
const KATLAR: ("g" | "a" | "r")[][] = [
  ["g", "g", "g", "g"],
  ["g", "a", "g", "g"],
  ["g", "r", "r", "g"],
  ["r", "r", "g", "a"],
];
const RENK = { g: SINYAL.musait, a: SINYAL.opsiyon, r: SINYAL.satildi };

function Ornek({ y }: { y: Yon }) {
  const kart: CSSProperties = {
    background: y.surface,
    border: `1px solid ${y.line}`,
    borderRadius: y.radius,
    boxShadow: y.shadow,
    color: y.ink,
    fontFamily: y.fontBody,
    overflow: "hidden",
  };
  const cip: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${y.line}`,
    borderRadius: y.radius >= 12 ? 999 : y.radius,
    padding: "4px 10px",
    fontSize: 13,
    color: y.ink,
  };

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }}>
      {/* Proje kartı */}
      <div style={kart}>
        <div style={{ padding: "18px 20px 16px" }}>
          <div
            style={{
              fontFamily: y.fontDisplay,
              fontWeight: y.displayWeight,
              fontSize: 26,
              lineHeight: 1.05,
              letterSpacing: y.id === "luks" ? "0" : "-0.02em",
              textTransform: y.upper ? "uppercase" : "none",
            }}
          >
            Çankaya Vadi Konakları
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: y.sub, fontVariantNumeric: "tabular-nums" }}>
            Çankaya, Ankara · Ada 12345 / Parsel 6
          </div>

          {/* sinyal çipleri */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <span style={cip}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: SINYAL.musait }} />
              <b style={{ fontVariantNumeric: "tabular-nums" }}>42</b> müsait
            </span>
            <span style={cip}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: SINYAL.opsiyon }} />
              <b style={{ fontVariantNumeric: "tabular-nums" }}>11</b> opsiyon
            </span>
            <span style={cip}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: SINYAL.satildi }} />
              <b style={{ fontVariantNumeric: "tabular-nums" }}>27</b> satıldı
            </span>
          </div>

          {/* ilerleme */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: y.sub }}>
              <span>İnşaat · Kaba</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>%68</span>
            </div>
            <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: y.line, overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: y.accent }} />
            </div>
          </div>

          {/* aksiyonlar */}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              style={{
                background: y.accent,
                color: y.accentInk,
                border: "none",
                borderRadius: y.radius >= 12 ? 999 : y.radius,
                padding: "10px 16px",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: y.fontBody,
                textTransform: y.upper ? "uppercase" : "none",
                cursor: "pointer",
              }}
            >
              Projeyi Yönet
            </button>
            <button
              style={{
                background: "transparent",
                color: y.ink,
                border: `1px solid ${y.line}`,
                borderRadius: y.radius >= 12 ? 999 : y.radius,
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: y.fontBody,
                cursor: "pointer",
              }}
            >
              Kurulum
            </button>
          </div>
        </div>
      </div>

      {/* Bina kesiti (signature) */}
      <div style={{ ...kart, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${y.line}`, fontSize: 12, color: y.sub, textTransform: y.upper ? "uppercase" : "none", letterSpacing: y.upper ? "0.08em" : "0" }}>
          A Blok · bina kesiti
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: 16, gap: 0, background: y.id === "cesur" ? "#0E0E18" : y.bg }}>
          {/* çatı */}
          <div style={{ width: 168, height: 12, background: y.ink, opacity: 0.85, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
          {/* katlar */}
          <div style={{ width: 168, border: `2px solid ${y.ink}`, borderTop: "none", background: y.surface }}>
            {KATLAR.map((kat, i) => (
              <div key={i} style={{ display: "flex", gap: 6, padding: "6px 8px", borderBottom: i < KATLAR.length - 1 ? `1px solid ${y.line}` : "none" }}>
                {kat.map((s, j) => (
                  <div
                    key={j}
                    style={{
                      flex: 1,
                      height: 16,
                      borderRadius: Math.min(y.radius, 4),
                      background: RENK[s],
                      opacity: 0.92,
                    }}
                  />
                ))}
              </div>
            ))}
            {/* zemin giriş */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 10px", background: y.id === "cesur" ? "#1b1b28" : "#e9e3da" }}>
              <div style={{ width: 36, height: 22, background: y.ink, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasarimSayfasi() {
  return (
    <main style={{ background: "#0f1115", minHeight: "100vh", color: "#e7e9ee" }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
      />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7b8294", fontFamily: "Inter, sans-serif" }}>
          ProjePazar — sistem ruhu
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, margin: "8px 0 6px", letterSpacing: "-0.02em" }}>
          Dört yön — birini seç
        </h1>
        <p style={{ color: "#9aa0b0", fontSize: 15, fontFamily: "Inter, sans-serif", maxWidth: 620 }}>
          Aynı proje (Çankaya Vadi · 42 müsait / 11 opsiyon / 27 satıldı · %68) dört farklı ruhta.
          Hangisini seçersen tüm sistemi (token → her ekran → bileşen) o ruha göre baştan kurarım.
        </p>

        <div style={{ display: "grid", gap: 28, marginTop: 32 }}>
          {YONLER.map((y) => (
            <section key={y.id} style={{ border: "1px solid #23262f", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 18px", background: "#15171d", borderBottom: "1px solid #23262f" }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>{y.ad}</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {[y.bg, y.surface, y.ink, y.accent, y.line].map((c) => (
                    <span key={c} title={c} style={{ width: 18, height: 18, borderRadius: 5, background: c, border: "1px solid #2c2f3a" }} />
                  ))}
                </div>
                <span style={{ color: "#8b91a1", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{y.vibe}</span>
              </div>
              <div style={{ background: y.bg, padding: 22 }}>
                <Ornek y={y} />
              </div>
            </section>
          ))}
        </div>

        <p style={{ marginTop: 36, color: "#7b8294", fontSize: 14, fontFamily: "Inter, sans-serif" }}>
          Seçtikten sonra: token sistemi → Kokpit → proje detay → emlakçı → Mahal Listesi, hepsi seçtiğin ruhta.
        </p>
      </div>
    </main>
  );
}
