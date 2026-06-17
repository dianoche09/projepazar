/* eslint-disable @next/next/no-page-custom-font, @next/next/no-html-link-for-pages */
import type { CSSProperties } from "react";
import { YONLER, SINYAL, KATLAR, RENK, FONT_LINK, type Yon } from "./yonler";

export const metadata = { title: "Tasarım Yönleri — ProjePazar" };

const ONIZLEME = KATLAR.slice(0, 4);

function Ornek({ y }: { y: Yon }) {
  const r = y.radius;
  const pill = r >= 12 ? 999 : r;
  const kart: CSSProperties = {
    background: y.surface,
    border: `1px solid ${y.line}`,
    borderRadius: r >= 12 ? 16 : r,
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
    borderRadius: pill,
    padding: "4px 10px",
    fontSize: 13,
    color: y.ink,
  };

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }}>
      <div style={{ ...kart, padding: "18px 20px 16px" }}>
        <div style={{ fontFamily: y.fontDisplay, fontWeight: y.displayWeight, fontSize: 26, lineHeight: 1.05, letterSpacing: y.id === "luks" ? "0" : "-0.02em", textTransform: y.upper ? "uppercase" : "none" }}>
          Çankaya Vadi Konakları
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: y.sub, fontVariantNumeric: "tabular-nums" }}>Çankaya, Ankara · Ada 12345 / Parsel 6</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {[["müsait", "42", SINYAL.musait], ["opsiyon", "11", SINYAL.opsiyon], ["satıldı", "27", SINYAL.satildi]].map(([et, sy, nk]) => (
            <span key={et} style={cip}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: nk }} />
              <b style={{ fontVariantNumeric: "tabular-nums" }}>{sy}</b> {et}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: y.sub }}>
            <span>İnşaat · Kaba</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>%68</span>
          </div>
          <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: y.line, overflow: "hidden" }}>
            <div style={{ width: "68%", height: "100%", background: y.accent }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button style={{ background: y.accent, color: y.accentInk, border: "none", borderRadius: pill, padding: "10px 16px", fontWeight: 700, fontSize: 14, fontFamily: y.fontBody, textTransform: y.upper ? "uppercase" : "none", cursor: "pointer" }}>Projeyi Yönet</button>
          <button style={{ background: "transparent", color: y.ink, border: `1px solid ${y.line}`, borderRadius: pill, padding: "10px 16px", fontWeight: 600, fontSize: 14, fontFamily: y.fontBody, cursor: "pointer" }}>Kurulum</button>
        </div>
      </div>

      <div style={{ ...kart, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${y.line}`, fontSize: 12, color: y.sub, textTransform: y.upper ? "uppercase" : "none" }}>A Blok · bina kesiti</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: 16, background: y.id === "cesur" ? "#0E0E18" : y.bg }}>
          <div style={{ width: 168, height: 12, background: y.ink, opacity: 0.85, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
          <div style={{ width: 168, border: `2px solid ${y.ink}`, borderTop: "none", background: y.surface }}>
            {ONIZLEME.map((kat, i) => (
              <div key={i} style={{ display: "flex", gap: 6, padding: "6px 8px", borderBottom: i < ONIZLEME.length - 1 ? `1px solid ${y.line}` : "none" }}>
                {kat.map((s, j) => (
                  <div key={j} style={{ flex: 1, height: 16, borderRadius: Math.min(y.radius, 4), background: RENK[s], opacity: 0.92 }} />
                ))}
              </div>
            ))}
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
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7b8294", fontFamily: "Inter, sans-serif" }}>ProjePazar — sistem ruhu</p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, margin: "8px 0 6px", letterSpacing: "-0.02em" }}>Dört yön — birini seç</h1>
        <p style={{ color: "#9aa0b0", fontSize: 15, fontFamily: "Inter, sans-serif", maxWidth: 640 }}>
          Aynı proje (Çankaya Vadi · 42 / 11 / 27 · %68) dört farklı ruhta. Her birinin <b style={{ color: "#cfd3dd" }}>Tam ekran gör →</b> linkiyle gerçek bir proje-detay ekranını full-screen incele.
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
                <a href={`/tasarim/${y.id}`} style={{ marginLeft: "auto", background: y.accent, color: y.accentInk, fontSize: 13, fontWeight: 700, textDecoration: "none", padding: "8px 14px", borderRadius: 999, fontFamily: "Inter, sans-serif" }}>
                  Tam ekran gör →
                </a>
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
