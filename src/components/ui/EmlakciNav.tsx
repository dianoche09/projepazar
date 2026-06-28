"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Emlakçı sidebar navigasyonu — v2-emlakci `.nav-item` (aktif çizgi + dolu menü).
 * Tüm item'lar gerçek route'lara bağlı (dead-link yok). Görünürlük tahsisli RLS ile sınırlı.
 */
const NAV: { href: string; etiket: string; tam?: boolean; canli?: boolean; ikon: ReactNode }[] = [
  {
    href: "/havuz",
    etiket: "Havuz",
    tam: true,
    canli: true,
    ikon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: "/havuz/leadler",
    etiket: "Lead'lerim",
    tam: true,
    ikon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </>
    ),
  },
  {
    href: "/havuz/opsiyonlarim",
    etiket: "Opsiyonlarım",
    tam: true,
    ikon: (
      <>
        <path d="M12 8v4l3 2" />
        <path d="M3.05 11a9 9 0 1 1 .5 4" />
        <path d="M3 4v4h4" />
      </>
    ),
  },
  {
    href: "/havuz/paylastiklarim",
    etiket: "Paylaştıklarım",
    tam: true,
    ikon: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </>
    ),
  },
  {
    href: "/havuz/profil",
    etiket: "Profil",
    ikon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
      </>
    ),
  },
];

export function EmlakciNav() {
  const yol = usePathname();
  const aktif = (n: { href: string; etiket: string; tam?: boolean }) =>
    n.etiket === "Havuz" ? yol === n.href : n.tam ? yol === n.href || yol.startsWith(`${n.href}/`) : false;

  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((n) => {
        const a = aktif(n);
        return (
          <Link key={n.etiket} href={n.href} className={`nav-item${a ? " active" : ""}`} aria-current={a ? "page" : undefined}>
            <svg className="nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {n.ikon}
            </svg>
            {n.etiket}
            {n.canli ? (
              <span className="nabiz ml-auto size-1.5 rounded-full bg-teal" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
