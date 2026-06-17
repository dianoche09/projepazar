/* eslint-disable @next/next/no-page-custom-font, @next/next/no-html-link-for-pages */
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { YONLER, SINYAL, KATLAR, RENK, FONT_LINK, type Yon } from "../yonler";

export function generateStaticParams() {
  return YONLER.map((y) => ({ yon: y.id }));
}

function Bina({ y }: { y: Yon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 240, height: 14, background: y.ink, opacity: 0.88, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
      <div style={{ width: 240, border: `2px solid ${y.ink}`, borderTop: "none", background: y.id === "cesur" ? "#1a1a26" : "#ECE6DC" }}>
        {KATLAR.map((kat, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 8px", borderBottom: i < KATLAR.length - 1 ? `1px solid rgba(0,0,0,.12)` : "none" }}>
            <span style={{ width: 18, fontSize: 10, fontVariantNumeric: "tabular-nums", color: y.id === "cesur" ? "#7d8398" : "#8a8170", textAlign: "right" }}>{KATLAR.length - i}</span>
            <div style={{ display: "flex", gap: 5, flex: 1 }}>
              {kat.map((s, j) => (
                <div key={j} style={{ flex: 1, height: 18, borderRadius: Math.min(y.radius, 4), background: RENK[s], opacity: 0.92 }} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 12px", background: y.id === "cesur" ? "#23232f" : "#E3DCD0" }}>
          <div style={{ width: 44, height: 26, background: y.ink, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}

function MockEkran({ y }: { y: Yon }) {
  const koyu = y.id !== "minimal";
  const sbText = koyu ? "rgba(255,255,255,.70)" : y.sub;
  const r = y.radius;
  const pill = r >= 12 ? 999 : r;

  const navItem = (etiket: string, aktif = false): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: pill,
    fontSize: 14,
    fontWeight: aktif ? 700 : 500,
    background: aktif ? y.accent : "transparent",
    color: aktif ? y.accentInk : sbText,
    fontFamily: y.fontBody,
  });

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 46px)", background: y.bg, color: y.ink, fontFamily: y.fontBody }}>
      {/* SIDEBAR */}
      <aside style={{ width: 232, flexShrink: 0, background: y.panel, borderRight: `1px solid ${koyu ? "rgba(255,255,255,.08)" : y.line}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${koyu ? "rgba(255,255,255,.08)" : y.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ display: "grid", gridTemplateColumns: "repeat(3,5px)", gridAutoRows: 5, gap: 2 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: 1, background: i === 4 ? y.accent : koyu ? "rgba(255,255,255,.35)" : "#c9ccd4" }} />
              ))}
            </span>
            <span style={{ fontFamily: y.fontDisplay, fontWeight: y.displayWeight, fontSize: 18, color: koyu ? "#fff" : y.ink, textTransform: y.upper ? "uppercase" : "none" }}>
              ProjePazar
            </span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: koyu ? "rgba(255,255,255,.4)" : y.sub }}>Üretici Paneli</p>
        </div>
        <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <div style={navItem("Kokpit", true)}>◧ Kokpit</div>
          <div style={navItem("Projeler")}>▦ Projeler</div>
          <div style={navItem("Lead'ler")}>◇ Lead&apos;ler</div>
        </nav>
        <div style={{ padding: 12, borderTop: `1px solid ${koyu ? "rgba(255,255,255,.08)" : y.line}`, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 999, background: y.accent, color: y.accentInk, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>G</span>
          <span style={{ fontSize: 13, color: koyu ? "#fff" : y.ink }}>Gürkan Yapı</span>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, padding: 24, overflow: "hidden" }}>
        {/* KOMUT BAŞLIĞI */}
        <header style={{ background: y.surface, border: `1px solid ${y.line}`, borderRadius: r >= 12 ? 18 : r, boxShadow: y.shadow, padding: 20, position: "relative", overflow: "hidden" }}>
          {y.id === "luks" ? <div style={{ position: "absolute", insetInline: 0, top: 0, height: 3, background: y.accent }} /> : null}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ margin: 0, fontFamily: y.fontDisplay, fontWeight: y.displayWeight, fontSize: 30, lineHeight: 1.05, letterSpacing: y.id === "luks" ? "0" : "-0.02em", textTransform: y.upper ? "uppercase" : "none" }}>
                  Çankaya Vadi Konakları
                </h1>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: `${y.accent}22`, color: y.id === "cesur" ? y.accent : y.ink, border: `1px solid ${y.accent}` }}>Doğrulanmış</span>
              </div>
              <p style={{ margin: "7px 0 0", fontSize: 14, color: y.sub, fontVariantNumeric: "tabular-nums" }}>Çankaya, Ankara · Ada 12345 / Parsel 6</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ background: "transparent", color: y.ink, border: `1px solid ${y.line}`, borderRadius: pill, padding: "9px 15px", fontWeight: 600, fontSize: 13, fontFamily: y.fontBody, cursor: "pointer" }}>Kurulum</button>
              <button style={{ background: y.accent, color: y.accentInk, border: "none", borderRadius: pill, padding: "9px 15px", fontWeight: 700, fontSize: 13, fontFamily: y.fontBody, textTransform: y.upper ? "uppercase" : "none", cursor: "pointer" }}>Stok Güncel</button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: y.sub }}>
              <span>İnşaat · Kaba yapı{y.upper ? "" : ""}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: y.ink }}>%68</span>
            </div>
            <div style={{ marginTop: 7, height: 7, borderRadius: 999, background: y.line, overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: y.accent }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
            {[
              ["Toplam", "80", y.sub],
              ["Müsait", "42", SINYAL.musait],
              ["Opsiyon", "11", SINYAL.opsiyon],
              ["Satıldı", "27", SINYAL.satildi],
            ].map(([et, sy, nk]) => (
              <div key={et} style={{ border: `1px solid ${y.line}`, borderRadius: r >= 12 ? 14 : r, padding: "11px 13px", background: y.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: nk }} />
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: y.sub }}>{et}</span>
                </div>
                <div style={{ marginTop: 4, fontFamily: y.fontDisplay, fontWeight: y.displayWeight, fontSize: 28, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{sy}</div>
              </div>
            ))}
          </div>
        </header>

        {/* BİNA + STOK */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 18, marginTop: 18 }}>
          <section style={{ background: y.surface, border: `1px solid ${y.line}`, borderRadius: r >= 12 ? 18 : r, boxShadow: y.shadow, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontFamily: y.fontDisplay, fontWeight: y.displayWeight, fontSize: 17, textTransform: y.upper ? "uppercase" : "none" }}>A Blok · Bina Kesiti</h2>
              <span style={{ fontSize: 12, color: y.sub }}>40 bağımsız bölüm</span>
            </div>
            <Bina y={y} />
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: y.surface, border: `1px solid ${y.line}`, borderRadius: r >= 12 ? 18 : r, boxShadow: y.shadow, padding: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, textTransform: y.upper ? "uppercase" : "none" }}>Bloklar</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["A Blok", "B Blok", "C Blok"].map((b) => (
                  <span key={b} style={{ border: `1px solid ${y.line}`, borderRadius: pill, padding: "5px 11px", fontSize: 12.5 }}>{b}</span>
                ))}
              </div>
            </div>
            <div style={{ background: y.surface, border: `1px solid ${y.line}`, borderRadius: r >= 12 ? 18 : r, boxShadow: y.shadow, padding: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, textTransform: y.upper ? "uppercase" : "none" }}>Daire Tipleri</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["1+1 · 55m²", "2+1 · 95m²", "3+1 · 140m²"].map((t) => (
                  <span key={t} style={{ border: `1px solid ${y.line}`, borderRadius: pill, padding: "5px 11px", fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{t}</span>
                ))}
              </div>
            </div>
            <button style={{ background: y.accent, color: y.accentInk, border: "none", borderRadius: pill, padding: "12px 16px", fontWeight: 700, fontSize: 14, fontFamily: y.fontBody, textTransform: y.upper ? "uppercase" : "none", cursor: "pointer" }}>
              + Birim Üret
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default async function TamEkran({ params }: { params: Promise<{ yon: string }> }) {
  const { yon } = await params;
  const y = YONLER.find((v) => v.id === yon);
  if (!y) notFound();

  return (
    <main style={{ background: y.bg, minHeight: "100vh" }}>
      <link rel="stylesheet" href={FONT_LINK} />
      {/* yön switcher */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "8px 16px", background: "#0f1115", borderBottom: "1px solid #23262f", fontFamily: "Inter, sans-serif" }}>
        <a href="/tasarim" style={{ color: "#9aa0b0", fontSize: 13, textDecoration: "none", marginRight: 6 }}>← Tüm yönler</a>
        {YONLER.map((v) => (
          <a key={v.id} href={`/tasarim/${v.id}`} style={{ fontSize: 13, textDecoration: "none", padding: "5px 11px", borderRadius: 999, background: v.id === y.id ? v.accent : "transparent", color: v.id === y.id ? v.accentInk : "#c7ccd6", border: `1px solid ${v.id === y.id ? v.accent : "#2c2f3a"}`, fontWeight: v.id === y.id ? 700 : 500 }}>
            {v.ad}
          </a>
        ))}
      </div>
      <MockEkran y={y} />
    </main>
  );
}
