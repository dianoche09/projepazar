import Link from "next/link";

/** Beyaz wordmark + 3×3 sinyal ızgarası (yeşil/teal/amber) — koyu marka paneli için. */
function MarkaLogo({ boyut = "text-2xl" }: { boyut?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 font-display ${boyut} font-extrabold tracking-tight text-white`}>
      <span className="grid grid-cols-3 gap-1" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-[3px] ${
              i === 2
                ? "bg-green shadow-[0_0_8px_var(--color-green)]"
                : i === 4
                  ? "bg-teal shadow-[0_0_10px_var(--color-teal)]"
                  : i === 6
                    ? "bg-amber shadow-[0_0_8px_var(--color-amber)]"
                    : "bg-white/25"
            }`}
          />
        ))}
      </span>
      proje<span className="text-teal">pazar</span>
    </span>
  );
}

/**
 * Marka komuta kabuğu — login + kayıt ortak görsel dil (tasarım dili: komut merkezi).
 * Desktop: SOL = üretilmiş hero görseli + koyu lacivert degrade + ızgara doku üstünde
 * görkemli marka paneli (büyük başlık + canlı güven sinyalleri). SAĞ = temiz, ortalı form.
 * Mobil: tek kolon — üstte hero'nun kompakt görsel bandı + logo, altında form.
 */
export function AuthKabuk({ children }: { children: React.ReactNode }) {
  const sinyaller: { renk: string; metin: string }[] = [
    {
      renk: "bg-green shadow-[0_0_10px_var(--color-green)]",
      metin: "Canlı stok — fiyat ve durum tek doğru kaynaktan",
    },
    {
      renk: "bg-teal shadow-[0_0_10px_var(--color-teal)]",
      metin: "Çift-satış kalkanı — opsiyon kilidi veritabanında",
    },
    {
      renk: "bg-amber shadow-[0_0_10px_var(--color-amber)]",
      metin: "Granüler tahsis — kim neyi görür, üretici belirler",
    },
  ];

  return (
    <main className="flex min-h-screen flex-1 items-stretch bg-paper">
      <div className="grid w-full lg:grid-cols-[1.05fr_1fr]">
        {/* ============ SOL — görkemli marka paneli (yalnız desktop) ============ */}
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          {/* üretilmiş hero zemini */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gorseller/hero-arkaplan.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* koyu lacivert degrade overlay — metin okunabilirliği + spatial derinlik */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#0b1f33]/95 via-[#10243a]/88 to-[#13314b]/82"
            aria-hidden
          />
          {/* blueprint ızgara doku */}
          <div className="izgara-doku pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light" aria-hidden />
          {/* aurora ışıma noktaları */}
          <div className="pointer-events-none absolute -left-24 top-1/4 h-[360px] w-[360px] rounded-full bg-teal/20 blur-[110px]" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-[300px] w-[300px] rounded-full bg-green/15 blur-[100px]" aria-hidden />

          {/* logo */}
          <Link href="/" className="relative z-10 w-fit">
            <MarkaLogo />
          </Link>

          {/* başlık + sinyaller */}
          <div className="belir relative z-10">
            <h2 className="max-w-md font-display text-4xl font-extrabold leading-[1.12] text-white xl:text-5xl">
              Canlı konut stoğu, <br />
              <span className="text-gradient-cyan">tek komuta merkezinden.</span>
            </h2>
            <p className="mt-5 max-w-md text-pretty text-[15px] font-medium leading-relaxed text-white/70">
              Üretici stoğu, fiyatı ve dağıtımı tek noktadan yönetir. Danışman yalnız kendisine
              tahsisli birimleri canlı havuzdan görür ve paylaşır.
            </p>
            <ul className="mt-9 space-y-4">
              {sinyaller.map(({ renk, metin }, i) => (
                <li
                  key={metin}
                  className={`belir belir-${i + 2} flex items-center gap-3.5 text-sm font-medium text-white/85`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${renk}`} aria-hidden />
                  {metin}
                </li>
              ))}
            </ul>
          </div>

          {/* canlı imza */}
          <p className="relative z-10 flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-white/55">
            <span className="nabiz inline-block size-2 rounded-full bg-green" aria-hidden />
            AĞ CANLI · GÜVEN PROTOKOLÜ AKTİF
          </p>
        </aside>

        {/* ============ SAĞ — form alanı ============ */}
        <section className="relative flex flex-col items-center justify-center bg-white px-6 py-10 sm:px-10 lg:py-12">
          {/* üstte ince teal-yeşil sinyal şeridi (form panelinin komuta dokusu) */}
          <div
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal via-green to-amber opacity-90"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-radial-gradient" aria-hidden />

          {/* mobil hero bandı — desktop'ta sol panelde var */}
          <div className="relative mb-8 w-full max-w-sm overflow-hidden rounded-2xl lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gorseller/hero-arkaplan.jpg"
              alt=""
              aria-hidden
              className="h-28 w-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0b1f33]/90 to-[#13314b]/80"
              aria-hidden
            />
            <Link
              href="/"
              className="absolute inset-0 flex items-center justify-center"
              aria-label="ProjePazar ana sayfa"
            >
              <MarkaLogo boyut="text-xl" />
            </Link>
          </div>

          <div className="belir z-10 w-full max-w-sm">{children}</div>
        </section>
      </div>
    </main>
  );
}
