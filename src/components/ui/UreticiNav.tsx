"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKLER = [
  { yol: "/uretici", etiket: "Kokpit", tam: true },
  { yol: "/uretici/lead-sorgu", etiket: "Müşteri Sorgula", tam: false },
  { yol: "/uretici/raporlar", etiket: "Raporlar", tam: false },
  { yol: "/uretici/proje/yeni", etiket: "Yeni Proje", tam: false },
];

function Ikon({ ad }: { ad: string }) {
  if (ad === "/uretici") {
    return (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" />
        <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" />
        <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" />
        <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" />
      </svg>
    );
  }
  if (ad === "/uretici/lead-sorgu") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }
  if (ad === "/uretici/raporlar") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 4v16h16" />
        <path d="M8 16v-4M13 16V8M18 16v-7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}

/** Üretici workspace navigasyonu — aktif yol vurgulu. mobil=true → yatay çip dizilimi. */
export function UreticiNav({ mobil = false }: { mobil?: boolean }) {
  const yol = usePathname();
  const aktif = (l: { yol: string; tam: boolean }) => (l.tam ? yol === l.yol : yol.startsWith(l.yol));

  return (
    <nav className={mobil ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-1"}>
      {LINKLER.map((l) => (
        <Link
          key={l.yol}
          href={l.yol}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
            aktif(l)
              ? "bg-white/5 border border-white/10 text-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              : "border border-transparent text-gray/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Ikon ad={l.yol} />
          {l.etiket}
        </Link>
      ))}
    </nav>
  );
}
