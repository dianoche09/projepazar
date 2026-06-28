"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/havuz",
    etiket: "Havuz",
    ikon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
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
    href: "/havuz/opsiyonlarim",
    etiket: "Opsiyon",
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
    etiket: "Paylaşım",
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
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </>
    ),
  },
];

/** Mobil alt tab navigasyonu (app-shell). Masaüstünde gizli (üst nav devralır). */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const aktif = t.href === "/havuz" ? path === "/havuz" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={aktif ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                aktif ? "text-teal" : "text-gray"
              }`}
            >
              {aktif ? (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-teal" aria-hidden />
              ) : null}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={aktif ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                {t.ikon}
              </svg>
              {t.etiket}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
