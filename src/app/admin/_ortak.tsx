import Link from "next/link";
import type { ReactNode } from "react";

/* =========================================================
   Admin v2-spatial ortak parçalar — avatar · başlık · geri
   Tek kaynak: Genel Bakış (page.tsx) deseni damıtıldı.
   ========================================================= */

// Avatar gradyanı — ada/id'ye göre deterministik (4 ton arası).
const AVATAR_GRADIENT = [
  "linear-gradient(150deg,#1b5e6e,#1e9b8a)",
  "linear-gradient(150deg,#c98a2e,#e3a12c)",
  "linear-gradient(150deg,#2a4d6e,#13314b)",
  "linear-gradient(150deg,#6b7a8c,#98a2b3)",
];

export function gradyan(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENT[Math.abs(h) % AVATAR_GRADIENT.length];
}

export function basHarf(ad: string | null | undefined): string {
  if (!ad) return "—";
  const p = ad.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || ad.slice(0, 2).toUpperCase();
}

/** Deterministik gradyanlı avatar rozeti (liste satırları + detay başlıkları). */
export function Avatar({ ad, id, boyut = 38 }: { ad: string | null | undefined; id: string; boyut?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl font-display font-bold text-white"
      style={{ width: boyut, height: boyut, fontSize: boyut <= 30 ? 11 : 13, background: gradyan(id) }}
    >
      {basHarf(ad)}
    </span>
  );
}

/** Sayfa içi geri bağlantısı — ikonlu, spatial ton (dead-end yok). */
export function GeriLink({ href, etiket }: { href: string; etiket: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-d transition-colors hover:text-teal"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {etiket}
    </Link>
  );
}

/** v2-spatial sayfa başlığı — ● göstergesi + mono alt-etiket + sağ aksiyon yuvası. */
export function SayfaBaslik({
  baslik,
  altEtiket,
  sag,
  noktaRenk = "var(--color-teal)",
}: {
  baslik: string;
  altEtiket: ReactNode;
  sag?: ReactNode;
  noktaRenk?: string;
}) {
  return (
    <header className="belir flex flex-wrap items-center gap-4">
      <div>
        <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-ink">{baslik}</h1>
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-soft">
          <span className="size-2 shrink-0 rounded-full" style={{ background: noktaRenk }} aria-hidden />
          {altEtiket}
        </div>
      </div>
      {sag ? <div className="ml-auto flex items-center gap-2.5">{sag}</div> : null}
    </header>
  );
}

/** Hata / başarı uyarı barı (searchParams mesajları). */
export function Uyari({ hata, mesaj }: { hata?: string; mesaj?: string }) {
  if (!hata && !mesaj) return null;
  return (
    <>
      {hata ? (
        <p role="alert" className="rounded-xl border border-red/30 bg-red-soft px-3.5 py-2.5 text-sm font-medium text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="rounded-xl border border-green/30 bg-green-soft px-3.5 py-2.5 text-sm font-medium text-teal-d">
          {mesaj}
        </p>
      ) : null}
    </>
  );
}
