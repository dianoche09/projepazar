"use client";

import { useEffect, useState } from "react";

/**
 * Koyu "Canlı Komuta Merkezi" — gerçek-zamanlı akan olay feed'i + canlı KPI'lar.
 * Bloomberg terminal hissi. Olaylar ÖRNEK (bölümde "canlı örnek" etiketli); kendi kendine akar.
 * prefers-reduced-motion: akış durur, statik liste kalır.
 */

type Olay = { ikon: string; renk: string; metin: string; vurgu: string };

const HAVUZ: Olay[] = [
  { ikon: "◷", renk: "#e3a12c", metin: "Çankaya Vadi · A-7-2 opsiyona alındı", vurgu: "opsiyon" },
  { ikon: "▲", renk: "#1e9b8a", metin: "Kule Rezidans · B-04 fiyat güncellendi", vurgu: "+%2,3" },
  { ikon: "✓", renk: "#d15a4e", metin: "Sahil Konutları · C-12 satıldı", vurgu: "kapandı" },
  { ikon: "↗", renk: "#2fb36b", metin: "Çankaya Vadi · A-5-2 müşteriye paylaşıldı", vurgu: "canlı fiyat" },
  { ikon: "+", renk: "#2fb36b", metin: "Meydan Park'a 8 yeni daire eklendi", vurgu: "+8 birim" },
  { ikon: "◷", renk: "#e3a12c", metin: "Kule Rezidans · A-09 opsiyona alındı", vurgu: "opsiyon" },
  { ikon: "↗", renk: "#2fb36b", metin: "Sahil Konutları · B-07 müşteriye paylaşıldı", vurgu: "canlı fiyat" },
  { ikon: "▲", renk: "#1e9b8a", metin: "Meydan Park · D-15 fiyat güncellendi", vurgu: "+%1,8" },
];

const ZAMAN = ["az önce", "8 sn önce", "22 sn önce", "47 sn önce", "1 dk önce", "2 dk önce"];

const KPI = [
  { deger: "147", etiket: "bugünkü hareket", renk: "#37d99a" },
  { deger: "23", etiket: "aktif opsiyon", renk: "#eab23f" },
  { deger: "9", etiket: "bugün kapanan", renk: "#dd6a5e" },
  { deger: "6 dk", etiket: "ort. tazelik", renk: "#3fd9c2" },
];

export function CanliKomutaMerkezi() {
  const [feed, setFeed] = useState<Olay[]>(() => HAVUZ.slice(0, 6));
  const [sayac, setSayac] = useState(6);

  useEffect(() => {
    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (azalt) return;
    const id = setInterval(() => {
      setSayac((s) => {
        const yeni = HAVUZ[s % HAVUZ.length];
        setFeed((prev) => [yeni, ...prev].slice(0, 6));
        return s + 1;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="komuta relative overflow-hidden text-white">
      <div className="komuta-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#37d99a]">
              <span className="size-2 rounded-full bg-[#37d99a] nabiz" /> Canlı komuta merkezi
              <span className="ml-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] tracking-wider text-white/60">canlı örnek</span>
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Ağ canlı atıyor.
              <br />
              <span className="text-[#3fd9c2]">Her hareket, anında.</span>
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-white/65">
              Bir daire opsiyonlandığında, fiyat değiştiğinde ya da satış kapandığında — herkes aynı anda görür. Bilgi tek doğru kaynaktan akar; gecikme, kopya, eski veri yok.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {KPI.map((k) => (
              <div key={k.etiket} className="text-right sm:text-left">
                <div className="font-mono text-2xl font-bold tabular-nums" style={{ color: k.renk }}>{k.deger}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-white/45">{k.etiket}</div>
              </div>
            ))}
          </div>
        </div>

        {/* akan olay feed'i */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,20,34,0.55)] backdrop-blur-sm">
          <div className="tarama-cizgi pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3fd9c2]/60 to-transparent" aria-hidden />
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-white/55">Canlı akış</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#37d99a]"><span className="size-1.5 rounded-full bg-[#37d99a] nabiz" /> bağlı</span>
          </div>
          <ul className="divide-y divide-white/5">
            {feed.map((o, i) => (
              <li key={`${sayac}-${i}`} className={`flex items-center gap-3.5 px-5 py-3.5 ${i === 0 ? "olay-gir bg-white/[0.03]" : ""}`}>
                <span className="grid size-7 flex-none place-items-center rounded-lg text-[13px]" style={{ background: `${o.renk}22`, color: o.renk }}>{o.ikon}</span>
                <span className="flex-1 text-[13.5px] text-white/85">{o.metin}</span>
                <span className="hidden flex-none rounded-md px-2 py-0.5 font-mono text-[10.5px] font-semibold sm:inline-block" style={{ background: `${o.renk}1f`, color: o.renk }}>{o.vurgu}</span>
                <span className="w-[68px] flex-none text-right font-mono text-[10.5px] text-white/35">{ZAMAN[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
