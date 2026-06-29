"use client";

import { paylasimKaydet } from "@/app/havuz/actions";

/**
 * WhatsApp paylaş linki — tıklamada anonim "paylasim" sinyali yazar (fire-and-forget),
 * sonra wa.me'yi yeni sekmede açar. Paylaştıklarım sayfası + Talep Radarı bu sinyali kullanır.
 */
export function PaylasWhatsApp({
  text,
  projeId,
  birimId,
  className,
  children,
}: {
  text: string;
  projeId: string;
  birimId?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void paylasimKaydet(projeId, birimId ?? null);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
