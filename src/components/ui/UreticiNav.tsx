"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  yol: string;
  etiket: string;
  ikon: string;
  /** true → tam eşleşme (sadece bu yol aktif). false → startsWith. */
  tam: boolean;
};

// Tüm item'lar gerçek route'lara bağlı (dead-end yok). Kokpit tam eşleşme,
// diğerleri startsWith (alt sayfalar da ilgili item'ı aktif tutar).
const LINKLER: NavLink[] = [
  { yol: "/uretici", etiket: "Kokpit", ikon: "kokpit", tam: true },
  { yol: "/uretici/projeler", etiket: "Projeler", ikon: "projeler", tam: false },
  { yol: "/uretici/stok", etiket: "Stok", ikon: "stok", tam: false },
  { yol: "/uretici/tahsis", etiket: "Tahsis", ikon: "tahsis", tam: false },
  { yol: "/uretici/opsiyonlar", etiket: "Opsiyonlar", ikon: "opsiyon", tam: false },
  { yol: "/uretici/talep-radari", etiket: "Talep Radarı", ikon: "radar", tam: false },
  { yol: "/uretici/fiyat-onerisi", etiket: "Fiyat Önerisi", ikon: "fiyat", tam: false },
  { yol: "/uretici/bildirimler", etiket: "Bildirimler", ikon: "bildirim", tam: false },
  { yol: "/uretici/lead-sorgu", etiket: "Müşteri Sorgula", ikon: "ara", tam: false },
  { yol: "/uretici/raporlar", etiket: "Raporlar", ikon: "rapor", tam: false },
  { yol: "/uretici/proje/yeni", etiket: "Yeni Proje", ikon: "arti", tam: false },
  { yol: "/uretici/ayarlar", etiket: "Ayarlar", ikon: "ayar", tam: false },
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
    case "bildirim":
      return (
        <svg {...ortak}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "fiyat":
      return (
        <svg {...ortak}>
          <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1.2" fill="currentColor" />
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
    case "ayar":
      return (
        <svg {...ortak}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
export function UreticiNav({ mobil = false, bildirimSayi = 0 }: { mobil?: boolean; bildirimSayi?: number }) {
  const yol = usePathname();
  // Kokpit (tam) → yalnız tam eşleşme; diğerleri startsWith → alt sayfalar item'ı aktif tutar.
  const aktif = (l: NavLink) => (l.tam ? yol === l.yol : yol.startsWith(l.yol));
  const rozet = (l: NavLink) =>
    l.yol === "/uretici/bildirimler" && bildirimSayi > 0 ? (
      <span className="ml-auto rounded-full bg-red px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
        {bildirimSayi > 99 ? "99+" : bildirimSayi}
      </span>
    ) : null;

  if (mobil) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {LINKLER.map((l) => (
          <Link
            key={l.etiket}
            href={l.yol}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              aktif(l)
                ? "border-teal/20 bg-white text-navy shadow-[var(--golge-1)]"
                : "border-transparent text-ink-soft hover:bg-[rgba(16,36,58,.05)] hover:text-ink"
            }`}
          >
            <Ikon ad={l.ikon} />
            {l.etiket}
            {rozet(l)}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-[3px]">
      {LINKLER.map((l) => (
        <Link key={l.etiket} href={l.yol} className={`nav-item${aktif(l) ? " active" : ""}`}>
          <Ikon ad={l.ikon} />
          {l.etiket}
          {rozet(l)}
        </Link>
      ))}
    </nav>
  );
}
