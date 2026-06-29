"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Tek tıkla, kendi kanalında paylaş" vitrini.
 * ProjePazar açık ilan yayınlamaz; gayrimenkul danışmanı beğendiği daireyi kendi kanalında paylaşır.
 * Gerçekçi iPhone (Dynamic Island + durum çubuğu) + danışman görseli + dönen "paylaşıldı" animasyonu.
 */

type Kanal = { ad: string; renk: string; ikon: React.ReactNode };

const I = (path: string) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden><path d={path} /></svg>
);

const KANALLAR: Kanal[] = [
  { ad: "WhatsApp", renk: "#25D366", ikon: I("M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z") },
  { ad: "Instagram", renk: "#E4405F", ikon: I("M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z") },
  { ad: "Facebook", renk: "#1877F2", ikon: I("M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z") },
  { ad: "X", renk: "#0f1419", ikon: I("M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z") },
  { ad: "Telegram", renk: "#229ED9", ikon: I("M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z") },
  { ad: "Bağlantı", renk: "#46586b", ikon: I("M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z") },
];

export function PaylasimVitrin() {
  const [aktif, setAktif] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (azalt) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !id) id = setInterval(() => setAktif((a) => (a + 1) % KANALLAR.length), 1400);
      else if (!e.isIntersecting && id) { clearInterval(id); id = null; }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { if (id) clearInterval(id); io.disconnect(); };
  }, []);

  const sk = KANALLAR[aktif];

  return (
    <div ref={ref} className="grid items-center gap-12 lg:grid-cols-2">
      {/* SOL — gerçekçi iPhone + danışman görseli */}
      <div className="flex justify-center lg:justify-start">
        <div className="relative">
          {/* iPhone */}
          <div className="relative z-10 w-[268px] rounded-[46px] bg-[#0b0b0c] p-[9px] shadow-[0_20px_60px_rgba(16,36,58,0.35)]">
            {/* yan tuşlar */}
            <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#26272b]" aria-hidden />
            <span className="absolute -left-[3px] top-[160px] h-12 w-[3px] rounded-l bg-[#26272b]" aria-hidden />
            <span className="absolute -right-[3px] top-[150px] h-16 w-[3px] rounded-r bg-[#26272b]" aria-hidden />
            <div className="relative overflow-hidden rounded-[38px] bg-paper">
              {/* dynamic island */}
              <div className="absolute left-1/2 top-2.5 z-30 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
              {/* durum çubuğu */}
              <div className="flex items-center justify-between px-6 pb-1 pt-3 text-ink">
                <span className="font-mono text-[11px] font-semibold">9:41</span>
                <span className="flex items-center gap-1.5" aria-hidden>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4" y="5" width="3" height="6" rx="1" /><rect x="8" y="2.5" width="3" height="8.5" rx="1" /><rect x="12" y="0" width="3" height="11" rx="1" /></svg>
                  <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 2.2c2.3 0 4.4.9 5.9 2.4l-1.1 1.1A6.8 6.8 0 007.5 3.8 6.8 6.8 0 002.7 5.7L1.6 4.6A8.3 8.3 0 017.5 2.2zm0 3.2c1.4 0 2.7.6 3.6 1.5l-1.1 1.1c-.7-.6-1.5-1-2.5-1s-1.8.4-2.5 1L3.9 6.9A5.1 5.1 0 017.5 5.4zm0 3.1c.6 0 1.1.2 1.5.6L7.5 11 6 9.1c.4-.4.9-.6 1.5-.6z" /></svg>
                  <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" /><rect x="23" y="3.5" width="1.5" height="5" rx="0.75" fill="currentColor" opacity="0.4" /></svg>
                </span>
              </div>

              {/* paylaşılan içerik */}
              <div className="px-3.5 pb-2 pt-1.5">
                <div className="overflow-hidden rounded-2xl border border-[var(--cizgi)] bg-white shadow-[var(--golge-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/gorseller/render-cankaya-vadi.jpg" alt="Çankaya Vadi" className="aspect-[16/10] w-full object-cover" />
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-ink">Çankaya Vadi · A-7-2</span>
                      <span className="rounded-full bg-[var(--color-teal-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--color-teal-d)]">✓</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-ink-soft">3+1 · 142 m² · Çankaya</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-base font-semibold text-ink">₺8,75M</span>
                      <span className="flex items-center gap-1 font-mono text-[9px] text-[#1f7d4c]"><span className="size-1.5 rounded-full bg-green nabiz" /> canlı · 2 dk</span>
                    </div>
                    <div className="mt-2 truncate rounded-md bg-[var(--color-soft)] px-2 py-1 font-mono text-[8.5px] text-ink-soft">projepazar.com/p/cankaya-vadi/a-7-2</div>
                  </div>
                </div>
              </div>

              {/* paylaş sheet */}
              <div className="border-t border-[var(--cizgi)] bg-white/85 px-3.5 pb-6 pt-3 backdrop-blur-sm">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-ink">Şununla paylaş</span>
                  <span className="font-mono text-[9px] text-[var(--ink-faint)]">tek tık</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {KANALLAR.map((k, i) => (
                    <div key={k.ad} className="flex flex-col items-center gap-1">
                      <span className="grid size-12 place-items-center rounded-2xl text-white transition-all duration-300" style={{ background: k.renk, transform: i === aktif ? "scale(1.12)" : "scale(1)", boxShadow: i === aktif ? `0 8px 20px ${k.renk}66` : "none", opacity: i === aktif ? 1 : 0.82 }}>
                        {k.ikon}
                      </span>
                      <span className="font-mono text-[8.5px] text-ink-soft">{k.ad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* paylaşıldı rozeti */}
          <div className="absolute -left-3 top-24 z-20 flex items-center gap-1.5 rounded-full border border-[var(--cizgi)] bg-white px-3 py-1.5 shadow-[var(--golge-2)]">
            <span className="size-2 rounded-full" style={{ background: sk.renk }} />
            <span className="font-mono text-[10px] font-semibold text-ink">{`${sk.ad} kanalında paylaşıldı`}</span>
          </div>
        </div>
      </div>

      {/* SAĞ — anlatım */}
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Tek tık · kendi kanalın</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Beğendiğin daireyi,<br className="hidden sm:block" /> kendi kanalında paylaş</h2>
        <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">
          ProjePazar <strong className="font-semibold text-ink">açık ilan yayınlamaz</strong>. Sen — gayrimenkul danışmanı — beğendiğin daireyi tek tıkla kendi WhatsApp, Instagram, Facebook veya X kanalında paylaşırsın. Postu sen yaparsın; fiyat o anki <strong className="font-semibold text-ink">canlı değerden</strong> basılır, link birebir mikrosite.
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {[
            ["Daireyi seç, kanalını seç, gönder", "üç saniyede kendi kitlene ulaş."],
            ["Fiyat her zaman canlı", "eski fiyatla post atma riski yok."],
            ["Link birebir mikrosite", "müşteri canlı detayı ve seni görür, açık ilan havuzu değil."],
          ].map(([a, b]) => (
            <li key={a} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
              <span className="mt-0.5 inline-grid size-5 flex-none place-items-center rounded-md bg-[var(--color-teal-soft)] text-xs font-bold text-[var(--color-teal-d)]">✓</span>
              <span><strong className="font-semibold">{a}</strong> — {b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          {KANALLAR.slice(0, 5).map((k) => (
            <span key={k.ad} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cizgi-2)] bg-white px-3 py-1.5 text-xs font-medium text-ink-soft">
              <span style={{ color: k.renk }}>{k.ikon}</span> {k.ad}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
