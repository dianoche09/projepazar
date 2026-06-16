"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", etiket: "Genel Bakış" },
  { href: "/admin/onay", etiket: "Onay Kuyruğu" },
  { href: "/admin/kullanicilar", etiket: "Kullanıcılar" },
  { href: "/admin/ureticiler", etiket: "Üreticiler" },
  { href: "/admin/ofisler", etiket: "Ofisler" },
  { href: "/admin/uyelik", etiket: "Üyelik" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
      {NAV.map((n) => {
        const aktif = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              aktif ? "bg-navy text-white" : "text-navy hover:bg-paper"
            }`}
          >
            {n.etiket}
          </Link>
        );
      })}
    </nav>
  );
}
