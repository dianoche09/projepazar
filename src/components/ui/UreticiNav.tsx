"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  yol: string;
  etiket: string;
  ikon: string;
  /** true → tam eşleşme (sadece bu yol aktif). false → startsWith. */
  tam: boolean;
  /** Gerçek route'u olmayanlar /uretici'ye gider; aktif vurgusu Kokpit'e bırakılır. */
  kokpit?: boolean;
};

// NOT: Projeler/Stok/Tahsis/Opsiyonlar/Talep Radarı henüz ayrı route değil → /uretici (DEAD link yok).
const LINKLER: NavLink[] = [
  { yol: "/uretici", etiket: "Kokpit", ikon: "kokpit", tam: true },
  { yol: "/uretici", etiket: "Projeler", ikon: "projeler", tam: false, kokpit: true },
  { yol: "/uretici", etiket: "Stok", ikon: "stok", tam: false, kokpit: true },
  { yol: "/uretici", etiket: "Tahsis", ikon: "tahsis", tam: false, kokpit: true },
  { yol: "/uretici", etiket: "Opsiyonlar", ikon: "opsiyon", tam: false, kokpit: true },
  { yol: "/uretici", etiket: "Talep Radarı", ikon: "radar", tam: false, kokpit: true },
  { yol: "/uretici/lead-sorgu", etiket: "Müşteri Sorgula", ikon: "ara", tam: false },
  { yol: "/uretici/raporlar", etiket: "Raporlar", ikon: "rapor", tam: false },
  { yol: "/uretici/proje/yeni", etiket: "Yeni Proje", ikon: "arti", tam: false },
];

function Ikon({ ad }: { ad: string }) {
  const ortak = { className: "nav-ic", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true } as const;
  switch (ad) {
    case "kokpit":
      return (
        <svg {...ortak}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "projeler":
      return (
        <svg {...ortak}>
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "stok":
      return (
        <svg {...ortak}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "tahsis":
      return (
        <svg {...ortak}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "opsiyon":
      return (
        <svg {...ortak}>
          <path d="M12 8v4l3 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "radar":
      return (
        <svg {...ortak}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "ara":
      return (
        <svg {...ortak}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "rapor":
      return (
        <svg {...ortak}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
    default:
      return (
        <svg {...ortak} strokeWidth={2.2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

/** Üretici workspace navigasyonu — v2 .nav-item stili, aktif çizgi. mobil=true → yatay çip. */
export function UreticiNav({ mobil = false }: { mobil?: boolean }) {
  const yol = usePathname();
  const kokpitte = yol === "/uretici";
  const aktif = (l: NavLink) => {
    if (l.kokpit) return false; // route'u yok → Kokpit aktif kalsın
    return l.tam ? yol === l.yol : yol.startsWith(l.yol);
  };

  if (mobil) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {LINKLER.filter((l) => !l.kokpit).map((l) => (
          <Link
            key={l.etiket}
            href={l.yol}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              (l.yol === "/uretici" ? kokpitte : aktif(l))
                ? "border-teal/20 bg-white text-navy shadow-[var(--golge-1)]"
                : "border-transparent text-ink-soft hover:bg-[rgba(16,36,58,.05)] hover:text-ink"
            }`}
          >
            <Ikon ad={l.ikon} />
            {l.etiket}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-[3px]">
      {LINKLER.map((l) => {
        const isAktif = l.yol === "/uretici" && l.tam ? kokpitte : aktif(l);
        return (
          <Link key={l.etiket} href={l.yol} className={`nav-item${isAktif ? " active" : ""}`}>
            <Ikon ad={l.ikon} />
            {l.etiket}
          </Link>
        );
      })}
    </nav>
  );
}
