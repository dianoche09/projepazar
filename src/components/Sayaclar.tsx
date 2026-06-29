"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, LayoutGrid, Users, Timer, type LucideIcon } from "lucide-react";

/**
 * Hero altı animasyonlu istatistik şeridi — görünür olunca sayar (count-up).
 * Lucide ikonlu, glass yüzeyli. Değerler ÖRNEK ("örnek" rozetiyle etiketli).
 */
const METRIKLER: { hedef: number; sonek: string; etiket: string; renk: string; Icon: LucideIcon }[] = [
  { hedef: 14, sonek: "", etiket: "aktif proje", renk: "var(--color-navy)", Icon: Building2 },
  { hedef: 1240, sonek: "", etiket: "canlı birim", renk: "var(--color-teal)", Icon: LayoutGrid },
  { hedef: 320, sonek: "+", etiket: "gayrimenkul danışmanı", renk: "var(--color-green)", Icon: Users },
  { hedef: 6, sonek: " dk", etiket: "ortalama tazelik", renk: "var(--color-amber)", Icon: Timer },
];

const bicim = (n: number) => n.toLocaleString("tr-TR");

export function Sayaclar() {
  const ref = useRef<HTMLDivElement>(null);
  const [degerler, setDegerler] = useState<number[]>(METRIKLER.map(() => 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (azalt) { setDegerler(METRIKLER.map((m) => m.hedef)); return; }
        const sure = 1400;
        let bas = 0;
        const tik = (z: number) => {
          if (!bas) bas = z;
          const t = Math.min((z - bas) / sure, 1);
          const e2 = 1 - Math.pow(1 - t, 3);
          setDegerler(METRIKLER.map((m) => Math.round(m.hedef * e2)));
          if (t < 1) requestAnimationFrame(tik);
        };
        requestAnimationFrame(tik);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="glass-v2 relative mx-auto grid w-full max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4">
      <span className="absolute right-3 top-3 z-10 rounded-md border border-[var(--cizgi-2)] bg-white/90 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">örnek</span>
      {METRIKLER.map((m, i) => (
        <div key={m.etiket} className="flex flex-col items-center justify-center gap-2 px-4 py-7 text-center">
          <span className="inline-grid size-9 place-items-center rounded-xl bg-[var(--color-soft)]" style={{ color: m.renk }}><m.Icon size={18} strokeWidth={1.75} /></span>
          <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: m.renk }}>{bicim(degerler[i])}{m.sonek}</span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{m.etiket}</span>
        </div>
      ))}
    </div>
  );
}
