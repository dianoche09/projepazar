"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV: { href: string; etiket: string; tam?: boolean; ikon: ReactNode }[] = [
  { href: "/havuz", etiket: "Havuz", tam: true, ikon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  {
    href: "/havuz/leadler",
    etiket: "Lead'ler",
    ikon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
  },
  {
    href: "/havuz/profil",
    etiket: "Profil",
    ikon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </>
    ),
  },
];

/** Emlakçı workspace navigasyonu (masaüstü sidebar). Mobilde BottomNav devralır. */
export function EmlakciNav() {
  const yol = usePathname();
  const aktif = (n: { href: string; tam?: boolean }) => (n.tam ? yol === n.href : yol.startsWith(n.href));

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 ${
            aktif(n)
              ? "bg-blue-50/70 border border-blue-200/50 text-teal shadow-sm"
              : "border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
            {n.ikon}
          </svg>
          {n.etiket}
        </Link>
      ))}
    </nav>
  );
}
