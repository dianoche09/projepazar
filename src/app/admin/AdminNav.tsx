"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const YONETIM = [
  { href: "/admin", etiket: "Genel Bakış", tam: true },
  { href: "/admin/onay", etiket: "Onay Kuyruğu" },
  { href: "/admin/kullanicilar", etiket: "Kullanıcılar" },
  { href: "/admin/ureticiler", etiket: "Üreticiler" },
  { href: "/admin/ofisler", etiket: "Ofisler" },
  { href: "/admin/uyelik", etiket: "Üyelik" },
  { href: "/admin/denetim", etiket: "Denetim" },
];

const PANELLER = [
  { href: "/uretici", etiket: "Üretici Paneli" },
  { href: "/havuz", etiket: "Emlakçı Havuzu" },
];

export function AdminNav({ mobil = false }: { mobil?: boolean }) {
  const yol = usePathname();
  const aktif = (h: string, tam?: boolean) => (tam ? yol === h : yol.startsWith(h));

  const link = (n: { href: string; etiket: string; tam?: boolean }) => (
    <Link
      key={n.href}
      href={n.href}
      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        aktif(n.href, n.tam) ? "bg-navy text-white" : "text-gray hover:bg-soft hover:text-ink"
      }`}
    >
      {n.etiket}
    </Link>
  );

  if (mobil) {
    return (
      <nav className="flex gap-2 overflow-x-auto">
        {YONETIM.map(link)}
        {PANELLER.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-lg border border-hair px-3 py-2 text-sm font-medium text-teal-d">
            {n.etiket} ↗
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {YONETIM.map(link)}
      <p className="px-3 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wide text-gray">Panelleri görüntüle</p>
      {PANELLER.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray transition-colors hover:bg-soft hover:text-ink"
        >
          {n.etiket}
          <span className="text-xs text-teal-d">↗</span>
        </Link>
      ))}
    </nav>
  );
}
