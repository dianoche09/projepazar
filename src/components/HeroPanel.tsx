"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing hero — canlı interaktif demo paneli.
 * Kendi kendine oynar: daire seçilir → kat planı + detay açılır → "müşteriye paylaş" → bildirim → sonraki daire.
 * Kullanıcı hücrelere tıklayabilir; prefers-reduced-motion'da otomatik döngü durur (statik zengin görünüm).
 * Veriler ÖRNEK (panelde "canlı örnek" rozetiyle etiketli) — prod mantığına sızmaz.
 */

type Durum = "musait" | "opsiyon" | "satildi" | "bos";

const DURUM_SINIF: Record<Durum, string> = {
  musait: "h-musait",
  opsiyon: "h-opsiyon",
  satildi: "h-satildi",
  bos: "h-bos",
};

type Hucre = { kod: string | null; durum: Durum; tip?: string };

const KESIT: { kat: string; hucreler: Hucre[] }[] = [
  { kat: "K8", hucreler: [{ kod: "A-8-1", durum: "musait", tip: "3+1" }, { kod: "A-8-2", durum: "satildi" }, { kod: "A-8-3", durum: "musait" }, { kod: "A-8-4", durum: "opsiyon" }] },
  { kat: "K7", hucreler: [{ kod: "A-7-1", durum: "satildi" }, { kod: "A-7-2", durum: "musait", tip: "3+1" }, { kod: "A-7-3", durum: "musait" }, { kod: "A-7-4", durum: "musait" }] },
  { kat: "K6", hucreler: [{ kod: "A-6-1", durum: "opsiyon" }, { kod: "A-6-2", durum: "musait" }, { kod: "A-6-3", durum: "satildi" }, { kod: "A-6-4", durum: "musait" }] },
  { kat: "K5", hucreler: [{ kod: "A-5-1", durum: "musait" }, { kod: "A-5-2", durum: "musait" }, { kod: "A-5-3", durum: "opsiyon" }, { kod: null, durum: "bos" }] },
];

type Daire = { tip: string; net: number; brut: number; cephe: string; durum: string; renk: string; fiyat: string };

const DAIRELER: Record<string, Daire> = {
  "A-7-2": { tip: "3+1", net: 142, brut: 168, cephe: "Güney", durum: "Müsait", renk: "#1f7d4c", fiyat: "₺8.75M" },
  "A-8-3": { tip: "3+1", net: 138, brut: 160, cephe: "Doğu", durum: "Müsait", renk: "#1f7d4c", fiyat: "₺8.40M" },
  "A-6-2": { tip: "2+1", net: 96, brut: 112, cephe: "Batı", durum: "Müsait", renk: "#1f7d4c", fiyat: "₺5.95M" },
  "A-8-1": { tip: "3+1", net: 145, brut: 172, cephe: "Güney-Doğu", durum: "Müsait", renk: "#1f7d4c", fiyat: "₺9.10M" },
  "A-5-2": { tip: "4+1", net: 186, brut: 214, cephe: "Güney-Batı", durum: "Müsait", renk: "#1f7d4c", fiyat: "₺12.2M" },
};

const SIRA = ["A-7-2", "A-8-3", "A-6-2"];

export function HeroPanel() {
  const [gorunum, setGorunum] = useState<"kesit" | "detay">("kesit");
  const [secili, setSecili] = useState("A-7-2");
  const [toast, setToast] = useState(false);
  const [flash, setFlash] = useState(false);
  const [tapping, setTapping] = useState<string | null>(null);
  const [dongu, setDongu] = useState(0); // manuel etkileşim döngüyü resetler
  const idxRef = useRef(0);

  useEffect(() => {
    const azalt =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let canli = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const bekle = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(r, ms);
        timers.push(t);
      });

    (async () => {
      // hareket azalt: otomatik döngü yok, statik zengin görünüm
      if (azalt) {
        await bekle(0);
        setGorunum("detay");
        return;
      }
      // manuel tıklama sonrası (dongu>0) kullanıcı detayı incelesin diye uzun bekle
      await bekle(dongu === 0 ? 1200 : 6000);
      while (canli) {
        setGorunum("kesit");
        setToast(false);
        await bekle(900);
        if (!canli) break;
        const kod = SIRA[idxRef.current % SIRA.length];
        idxRef.current += 1;
        setTapping(kod);
        await bekle(600);
        setTapping(null);
        setSecili(kod);
        setGorunum("detay");
        await bekle(2200);
        if (!canli) break;
        setFlash(true);
        await bekle(350);
        setFlash(false);
        setToast(true);
        await bekle(2700);
        setToast(false);
        await bekle(700);
      }
    })();

    return () => {
      canli = false;
      timers.forEach(clearTimeout);
    };
  }, [dongu]);

  const daireSec = (kod: string | null) => {
    if (!kod) return;
    setSecili(kod);
    setGorunum("detay");
    setTapping(kod);
    setTimeout(() => setTapping(null), 600);
    setDongu((d) => d + 1); // döngüyü resetle, kullanıcıya süre tanı
  };

  const d = DAIRELER[secili] ?? DAIRELER["A-7-2"];

  return (
    <div className="kart relative w-full max-w-[460px] overflow-hidden p-0" style={{ minHeight: 438 }}>
      <span className="absolute right-3 top-3 z-20 rounded-md border border-[var(--cizgi-2)] bg-white/90 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
        canlı örnek
      </span>

      {/* ---- GÖRÜNÜM: BİNA KESİTİ ---- */}
      <div className={`pview ${gorunum === "kesit" ? "" : "gizli"}`} aria-hidden={gorunum !== "kesit"}>
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] px-4 pb-3 pt-3.5">
          <span className="flex items-center gap-2 font-display text-[14.5px] font-bold text-ink">
            Çankaya Vadi
            <span className="rounded-full bg-[var(--color-teal-soft)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--color-teal-d)]">
              ✓ Doğrulanmış
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#1f7d4c]">
            <span className="size-1.5 rounded-full bg-green nabiz" /> 2 dk önce
          </span>
        </div>

        <div className="flex gap-1.5 px-4 pt-3">
          <span className="rounded-[9px] border border-navy bg-navy px-3 py-1.5 font-mono text-[11px] font-semibold text-white">A Blok</span>
          <span className="cursor-default rounded-[9px] border border-[var(--cizgi-2)] px-3 py-1.5 font-mono text-[11px] font-semibold text-ink-soft">B Blok</span>
          <span className="cursor-default rounded-[9px] border border-[var(--cizgi-2)] px-3 py-1.5 font-mono text-[11px] font-semibold text-ink-soft">C Blok</span>
          <span className="ml-auto self-center font-mono text-[11px] text-[var(--ink-faint)]">142 birim</span>
        </div>

        <div className="flex gap-3.5 px-4 pb-1 pt-3 font-mono text-[11px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-green" /> <b className="font-semibold text-ink">58</b> müsait</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-amber" /> <b className="font-semibold text-ink">22</b> opsiyon</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-red" /> <b className="font-semibold text-ink">20</b> satıldı</span>
        </div>

        <div className="px-4 pb-3 pt-2">
          {KESIT.map((row) => (
            <div key={row.kat} className="mb-1.5 flex items-center gap-2">
              <span className="w-[26px] font-mono text-[10px] text-[var(--ink-faint)]">{row.kat}</span>
              <span className="flex flex-1 gap-1.5">
                {row.hucreler.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => daireSec(h.kod)}
                    disabled={h.durum === "bos"}
                    className={`lhucre relative flex h-[42px] flex-1 flex-col items-center justify-center rounded-lg font-mono text-[9px] font-semibold leading-tight text-white transition-transform ${DURUM_SINIF[h.durum]} ${
                      secili === h.kod ? "z-[3] outline outline-[3px] outline-offset-2 outline-navy" : ""
                    } ${tapping === h.kod ? "tapping" : ""} ${h.durum !== "bos" ? "hover:-translate-y-0.5 hover:scale-105" : "cursor-default"}`}
                  >
                    <span className="tap" />
                    {h.kod ? h.kod.replace("A-", "") : ""}
                    {h.tip ? <span className="opacity-90">{h.tip}</span> : null}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div className="flex h-[9px] overflow-hidden rounded-md bg-[rgba(16,36,58,0.07)]">
            <span className="block h-full bg-green" style={{ width: "58%" }} />
            <span className="block h-full bg-amber" style={{ width: "22%" }} />
            <span className="block h-full bg-red" style={{ width: "20%" }} />
          </div>
          <p className="pt-3 text-center font-mono text-[10px] text-[var(--ink-faint)]">↑ bir daireye dokun</p>
        </div>
      </div>

      {/* ---- GÖRÜNÜM: DAİRE DETAYI ---- */}
      <div className={`pview ${gorunum === "detay" ? "" : "gizli"}`} aria-hidden={gorunum !== "detay"}>
        <button
          type="button"
          onClick={() => { setGorunum("kesit"); setDongu((x) => x + 1); }}
          className="flex items-center gap-1.5 border-none bg-transparent px-4 pb-1 pt-3.5 font-mono text-[11px] text-ink-soft transition-colors hover:text-ink"
        >
          ← Bina kesitine dön
        </button>
        <div className="px-4 pb-4 pt-0.5">
          <div className="grid grid-cols-[auto_1fr] items-start gap-3.5">
            {/* kat planı (şematik) */}
            <svg viewBox="0 0 150 120" className="h-[120px] w-[150px] flex-none rounded-xl border border-[var(--cizgi)] bg-[var(--color-soft)]" aria-label="kat planı şeması">
              <rect x="2" y="2" width="146" height="116" rx="6" fill="#fff" stroke="rgba(16,36,58,.18)" />
              <rect x="6" y="58" width="78" height="56" fill="var(--color-teal-soft)" stroke="rgba(16,36,58,.14)" />
              <rect x="6" y="6" width="44" height="48" fill="#eef3f7" stroke="rgba(16,36,58,.14)" />
              <rect x="54" y="6" width="42" height="48" fill="#f4f7f5" stroke="rgba(16,36,58,.14)" />
              <rect x="100" y="6" width="44" height="52" fill="#f4f7f5" stroke="rgba(16,36,58,.14)" />
              <rect x="88" y="62" width="56" height="40" fill="#f4f7f5" stroke="rgba(16,36,58,.14)" />
              <rect x="88" y="104" width="56" height="12" fill="#e9eef3" stroke="rgba(16,36,58,.12)" />
              <text x="45" y="88" fontFamily="Geist Mono, monospace" fontSize="8" fill="#46586b" textAnchor="middle">Salon</text>
              <text x="28" y="32" fontFamily="Geist Mono, monospace" fontSize="7" fill="#7d8da0" textAnchor="middle">Mutfak</text>
              <text x="75" y="32" fontFamily="Geist Mono, monospace" fontSize="7" fill="#7d8da0" textAnchor="middle">Oda</text>
              <text x="122" y="34" fontFamily="Geist Mono, monospace" fontSize="7" fill="#7d8da0" textAnchor="middle">Oda</text>
              <text x="116" y="84" fontFamily="Geist Mono, monospace" fontSize="7" fill="#7d8da0" textAnchor="middle">Oda</text>
              <text x="116" y="113" fontFamily="Geist Mono, monospace" fontSize="6" fill="#7d8da0" textAnchor="middle">Balkon</text>
            </svg>
            <div>
              <div className="font-display text-[22px] font-extrabold leading-none text-ink">{secili}</div>
              <span className="mt-1.5 inline-block rounded-full bg-[var(--color-teal-soft)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-teal-d)]">{d.tip}</span>
              <div className="mt-2.5">
                <div className="flex justify-between border-b border-dashed border-[rgba(16,36,58,0.1)] py-1 font-mono text-[11.5px]"><span className="text-[var(--ink-faint)]">Net / Brüt</span><span className="font-medium text-ink">{d.net} / {d.brut} m²</span></div>
                <div className="flex justify-between border-b border-dashed border-[rgba(16,36,58,0.1)] py-1 font-mono text-[11.5px]"><span className="text-[var(--ink-faint)]">Cephe</span><span className="font-medium text-ink">{d.cephe}</span></div>
                <div className="flex justify-between border-b border-dashed border-[rgba(16,36,58,0.1)] py-1 font-mono text-[11.5px]"><span className="text-[var(--ink-faint)]">Durum</span><span className="font-medium" style={{ color: d.renk }}>● {d.durum}</span></div>
              </div>
            </div>
          </div>

          <div className="mb-1 mt-3 flex items-baseline justify-between">
            <span className="font-mono text-[24px] font-semibold text-ink">{d.fiyat}</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[#1f7d4c]"><span className="size-1.5 rounded-full bg-green nabiz" /> canlı · 2 dk önce</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={`btn-action h-10 flex-1 text-[13px] ${flash ? "btn-flash" : ""}`}
            >
              ↗ Müşteriye paylaş
            </button>
            <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-amber bg-white text-[13px] font-semibold text-[#9a6a12]">
              ◷ Opsiyon al
            </button>
          </div>
        </div>
      </div>

      {/* ---- PAYLAŞ TOAST ---- */}
      <div className={`paylas-toast absolute inset-x-4 bottom-4 z-30 flex items-center gap-2.5 rounded-2xl bg-navy px-4 py-3 text-white shadow-[var(--golge-3)] ${toast ? "acik" : ""}`}>
        <span className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-[#1faa5b] text-[15px]">✓</span>
        <span>
          <span className="block font-display text-[13px] font-bold">Canlı fiyatla paylaşıldı</span>
          <span className="mt-0.5 block font-mono text-[10.5px] text-white/70">WhatsApp linki kopyalandı · {d.fiyat} (2 dk önce)</span>
        </span>
      </div>
    </div>
  );
}
