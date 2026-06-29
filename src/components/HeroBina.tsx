"use client";

import { useEffect, useState } from "react";

/**
 * Hero ARKA PLAN görseli — gerçek konut projesi cephesi, kenarları zemine eriyen (mask ile geçişli, kutu değil).
 * Cephe üzerinde CANLI durum işaretleri; devamlı değişir (satıldı / opsiyonlandı / satılığa çıktı).
 * prefers-reduced-motion: statik.
 */

type Durum = "musait" | "opsiyon" | "satildi";
const RENK: Record<Durum, string> = { musait: "#2fb36b", opsiyon: "#e3a12c", satildi: "#d15a4e" };
const FIIL: Record<Durum, string> = { musait: "satılığa çıktı", opsiyon: "opsiyonlandı", satildi: "satıldı" };

const KATLAR = [26, 40, 54, 68]; // top %
const SUTUN = [54, 64, 74, 84, 94]; // left % (görsel sağ ağırlıklı)
const NOKTALAR = KATLAR.flatMap((top, ki) => SUTUN.map((left, si) => ({ top, left, kod: `A-${8 - ki}-${si + 1}` })));
const BASLANGIC: Durum[] = NOKTALAR.map((_, i) => { const h = (i * 7) % 10; return h < 5 ? "musait" : h < 7 ? "opsiyon" : "satildi"; });

export function HeroBina() {
  const [durumlar, setDurumlar] = useState<Durum[]>(BASLANGIC);
  const [son, setSon] = useState<{ durum: Durum; i: number }>({ durum: "satildi", i: 7 });

  useEffect(() => {
    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (azalt) return;
    let n = 5;
    const id = setInterval(() => {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const i = n % NOKTALAR.length;
      const yeni: Durum = (["musait", "opsiyon", "satildi"] as Durum[])[(n >> 8) % 3];
      setDurumlar((prev) => prev.map((d, idx) => (idx === i ? yeni : d)));
      setSon({ durum: yeni, i });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const maske = "radial-gradient(135% 120% at 92% 40%, #000 40%, rgba(0,0,0,0.55) 62%, transparent 80%)";

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full lg:w-[66%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gorseller/hero-bina.jpg"
        alt=""
        aria-hidden
        className="size-full object-cover"
        style={{ WebkitMaskImage: maske, maskImage: maske }}
      />
      {/* sol/zemin renk eritme — metin tarafı okunur kalsın */}
      <div className="absolute inset-0" aria-hidden style={{ background: "linear-gradient(90deg, var(--color-paper) 0%, rgba(238,241,246,0.55) 22%, transparent 46%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-24" aria-hidden style={{ background: "linear-gradient(180deg, transparent, rgba(238,241,246,0.85))" }} />

      {/* canlı durum işaretleri */}
      {NOKTALAR.map((p, i) => {
        const d = durumlar[i];
        const vurgu = son.i === i;
        return (
          <span key={p.kod}>
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/80 transition-all duration-300"
              style={{ top: `${p.top}%`, left: `${p.left}%`, width: vurgu ? 22 : 11, height: vurgu ? 22 : 11, zIndex: vurgu ? 2 : 1, background: RENK[d], boxShadow: vurgu ? `0 0 0 8px ${RENK[d]}33, 0 4px 16px ${RENK[d]}77` : "0 1px 4px rgba(8,20,34,.35)" }}
            />
            {vurgu ? (
              <span
                key={`${son.i}-${son.durum}`}
                className="olay-gir absolute z-[3] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-[rgba(8,20,34,0.82)] px-2.5 py-1 font-mono text-[10px] font-medium text-white backdrop-blur-md"
                style={{ top: `calc(${p.top}% - 26px)`, left: `${p.left}%` }}
              >
                <span className="size-1.5 rounded-full" style={{ background: RENK[d] }} />
                {p.kod} {FIIL[d]}
              </span>
            ) : null}
          </span>
        );
      })}

      {/* alt künye + lejant */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2 text-right">
        <div>
          <div className="font-display text-base font-bold text-ink drop-shadow-sm">Çankaya Vadi</div>
          <div className="flex items-center justify-end gap-1.5 font-mono text-[11px] text-ink-soft"><span className="size-1.5 rounded-full bg-green nabiz" /> 142 birim · canlı</div>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-[var(--cizgi)] bg-white/80 px-3 py-1.5 font-mono text-[10px] text-ink-soft backdrop-blur-sm">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: RENK.musait }} /> müsait</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: RENK.opsiyon }} /> opsiyon</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: RENK.satildi }} /> satıldı</span>
        </div>
      </div>
    </div>
  );
}
