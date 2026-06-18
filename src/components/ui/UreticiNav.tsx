"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKLER = [
  { yol: "/uretici", etiket: "Kokpit", tam: true },
  { yol: "/uretici/leadler", etiket: "Lead'ler", tam: false },
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
  if (ad === "/uretici/leadler") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
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
    <nav className={mobil ? "flex gap-2 overflow-x-auto" : "flex flex-col gap-1"}>
      {LINKLER.map((l) => (
        <Link
          key={l.yol}
          href={l.yol}
          className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            aktif(l) ? "bg-navy text-white" : "text-gray hover:bg-soft hover:text-ink"
          }`}
        >
          <Ikon ad={l.yol} />
          {l.etiket}
        </Link>
      ))}
    </nav>
  );
}
