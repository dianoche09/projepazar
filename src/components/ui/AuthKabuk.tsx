import Link from "next/link";

/**
 * Marka komuta kabuğu — login + kayıt ortak görsel dil (tasarım dili: komut merkezi).
 * Desktop: sol = navy blueprint komut paneli (aurora + ızgara doku + canlı güven sinyalleri),
 * sağ = form. Mobil: tek kolon, üstte kompakt marka wordmark + form.
 */
export function AuthKabuk({ children }: { children: React.ReactNode }) {
  const sinyaller: [string, string][] = [
    ["bg-green shadow-[0_0_8px_var(--color-green)]", "Canlı stok — fiyat ve durum tek doğru kaynaktan"],
    ["bg-teal shadow-[0_0_8px_var(--color-teal)]", "Çift-satış kalkanı — opsiyon kilidi veritabanında"],
    ["bg-amber shadow-[0_0_8px_var(--color-amber)]", "Granüler tahsis — kim neyi görür, üretici belirler"],
  ];

  return (
    <main className="flex flex-1 items-stretch bg-paper min-h-screen">
      <div className="grid w-full lg:grid-cols-[1.05fr_1fr]">
        {/* SOL — marka komuta paneli (yalnız desktop) */}
        <aside className="aurora relative hidden overflow-hidden bg-gradient-to-br from-[#020617] via-[#090d16] to-[#0f172a] border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="izgara-doku pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden />

          {/* Glow circle overlay */}
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-teal/5 blur-[80px] rounded-full pointer-events-none" />

          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-3 font-display text-2xl font-semibold text-white tracking-tight"
          >
            <span className="grid grid-cols-3 gap-1" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green nabiz shadow-[0_0_10px_var(--color-green)]" : "bg-white/20"}`}
                />
              ))}
            </span>
            ProjePazar
          </Link>

          <div className="belir relative z-10">
            <h2 className="max-w-md font-display text-3xl font-extrabold leading-[1.15] text-gradient xl:text-4xl">
              Canlı konut stoğu, <br />
              <span className="text-gradient-cyan">tek komuta merkezinden.</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-gray/80">
              Üretici stoğu, fiyatı ve dağıtımı tek noktadan yönetir. Danışman yalnız kendisine
              tahsisli birimleri canlı havuzdan görür ve paylaşır.
            </p>
            <ul className="mt-8 space-y-4">
              {sinyaller.map(([renk, metin], i) => (
                <li
                  key={metin}
                  className={`belir belir-${i + 2} flex items-center gap-3.5 text-sm text-gray/90`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${renk}`} aria-hidden />
                  {metin}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 font-mono text-xs tracking-wider text-gray/40">
            ● AĞ CANLI · GÜVEN PROTOKOLÜ AKTİF
          </p>
        </aside>

        {/* SAĞ — form alanı */}
        <section className="flex items-center justify-center px-6 py-12 bg-[#090d16] sm:px-10 relative">
          <div className="absolute inset-0 bg-radial-gradient from-teal/5 to-transparent pointer-events-none" />
          <div className="belir w-full max-w-sm z-10">
            {/* mobil wordmark — desktop'ta sol panelde var */}
            <Link
              href="/"
              className="mb-8 flex items-center justify-center gap-3 font-display text-xl font-semibold text-white lg:hidden"
            >
              <span className="grid grid-cols-3 gap-0.5" aria-hidden>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-[2px] ${i === 4 ? "bg-green nabiz shadow-[0_0_8px_var(--color-green)]" : "bg-white/20"}`}
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
