"use client";

/** Müşteriye PDF — mikrositeyi print-optimize basar (tarayıcı "PDF olarak kaydet").
 *  Ayrı PDF motoru yok: canlı veri, tek doğru kaynak. print:hidden ile baskıda görünmez. */
export function YazdirButonu() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 rounded-lg border border-hair bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-paper"
    >
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
      PDF / Yazdır
    </button>
  );
}
