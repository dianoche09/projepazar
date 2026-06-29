"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = { href: string; etiket: string; tam?: boolean; ikon: ReactNode };

const ic = (d: ReactNode) => (
  <svg className="nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

const YONETIM: NavItem[] = [
  {
    href: "/admin",
    etiket: "Genel Bakış",
    tam: true,
    ikon: ic(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  },
  {
    href: "/admin/onay",
    etiket: "Onay Kuyruğu",
    ikon: ic(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  },
  {
    href: "/admin/dogrulama",
    etiket: "Belge Doğrulama",
    ikon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></>),
  },
  {
    href: "/admin/kullanicilar",
    etiket: "Kullanıcılar",
    ikon: ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  },
  {
    href: "/admin/ureticiler",
    etiket: "Üreticiler",
    ikon: ic(<><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></>),
  },
  {
    href: "/admin/ofisler",
    etiket: "Ofisler",
    ikon: ic(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  },
  {
    href: "/admin/uyelik",
    etiket: "Üyelik Paketleri",
    ikon: ic(<><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>),
  },
  {
    href: "/admin/denetim",
    etiket: "Denetim",
    ikon: ic(<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>),
  },
];

const PANELLER = [
  { href: "/uretici", etiket: "Üretici Paneli" },
  { href: "/havuz", etiket: "Emlakçı Havuzu" },
];

export function AdminNav({ mobil = false, onayBekleyen = 0, belgeBekleyen = 0 }: { mobil?: boolean; onayBekleyen?: number; belgeBekleyen?: number }) {
  const yol = usePathname();
  const aktif = (h: string, tam?: boolean) => (tam ? yol === h : yol.startsWith(h));

  if (mobil) {
    return (
      <nav className="flex gap-2 overflow-x-auto">
        {YONETIM.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              aktif(n.href, n.tam) ? "bg-navy text-white" : "text-gray hover:bg-soft hover:text-ink"
            }`}
          >
            {n.etiket}
            {n.href === "/admin/onay" && onayBekleyen > 0 ? <span className="ml-1.5 font-mono text-xs">{onayBekleyen}</span> : null}
            {n.href === "/admin/dogrulama" && belgeBekleyen > 0 ? <span className="ml-1.5 font-mono text-xs">{belgeBekleyen}</span> : null}
          </Link>
        ))}
        {PANELLER.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-lg border border-hair px-3 py-2 text-sm font-medium text-teal-d">
            {n.etiket} ↗
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-[3px]">
      {YONETIM.map((n) => (
        <Link key={n.href} href={n.href} className={`nav-item ${aktif(n.href, n.tam) ? "active" : ""}`}>
          {n.ikon}
          {n.etiket}
          {n.href === "/admin/onay" && onayBekleyen > 0 ? (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-soft px-1.5 font-mono text-[11px] font-bold text-amber">
              {onayBekleyen}
            </span>
          ) : null}
          {n.href === "/admin/dogrulama" && belgeBekleyen > 0 ? (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-soft px-1.5 font-mono text-[11px] font-bold text-amber">
              {belgeBekleyen}
            </span>
          ) : null}
        </Link>
      ))}

      <p className="px-3.5 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wide text-gray">Panelleri görüntüle</p>
      {PANELLER.map((n) => (
        <Link key={n.href} href={n.href} className="nav-item text-[13.5px]">
          {n.etiket}
          <span className="ml-auto text-xs text-teal-d">↗</span>
        </Link>
      ))}
    </nav>
  );
}
