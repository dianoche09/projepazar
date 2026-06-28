import Link from "next/link";

/**
 * Marka komuta kabuğu — login + kayıt ortak görsel dil (tasarım dili: komut merkezi).
 * Desktop: sol = navy blueprint komut paneli (aurora + ızgara doku + canlı güven sinyalleri),
 * sağ = form. Mobil: tek kolon, üstte kompakt marka wordmark + form.
 */
export function AuthKabuk({ children }: { children: React.ReactNode }) {
  const sinyaller: [string, string][] = [
    ["bg-green", "Canlı stok — fiyat ve durum tek doğru kaynaktan"],
    ["bg-teal", "Çift-satış kalkanı — opsiyon kilidi veritabanında"],
    ["bg-amber", "Granüler tahsis — kim neyi görür, üretici belirler"],
  ];

  return (
    <main className="flex flex-1 items-stretch">
      <div className="grid w-full lg:grid-cols-[1.05fr_1fr]">
        {/* SOL — marka komuta paneli (yalnız desktop) */}
        <aside className="aurora relative hidden overflow-hidden bg-gradient-to-br from-navy to-ink lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="izgara-doku pointer-events-none absolute inset-0 opacity-60" aria-hidden />

          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-3 font-display text-2xl font-semibold text-white"
          >
            <span className="grid grid-cols-3 gap-1" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green nabiz" : "bg-white/25"}`}
                />
              ))}
            </span>
            ProjePazar
          </Link>

          <div className="belir relative z-10">
            <h2 className="max-w-md font-display text-3xl font-semibold leading-[1.15] text-white xl:text-4xl">
              Canlı konut stoğu, tek komuta merkezinden.
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/70">
              Üretici stoğu, fiyatı ve dağıtımı tek noktadan yönetir. Danışman yalnız kendisine
              tahsisli birimleri canlı havuzdan görür ve paylaşır.
            </p>
            <ul className="mt-8 space-y-3.5">
              {sinyaller.map(([renk, metin], i) => (
                <li
                  key={metin}
                  className={`belir belir-${i + 2} flex items-center gap-3 text-sm text-white/85`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${renk}`} aria-hidden />
                  {metin}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 font-mono text-xs tracking-wide text-white/40">
            ● Ağ canlı · güven protokolü aktif
          </p>
        </aside>

        {/* SAĞ — form alanı */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="belir w-full max-w-sm">
            {/* mobil wordmark — desktop'ta sol panelde var */}
            <Link
              href="/"
              className="mb-8 flex items-center justify-center gap-3 font-display text-xl font-semibold text-navy lg:hidden"
            >
              <span className="grid grid-cols-3 gap-0.5" aria-hidden>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-[2px] ${i === 4 ? "bg-green nabiz" : "bg-navy/25"}`}
                  />
                ))}
              </span>
              ProjePazar
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
