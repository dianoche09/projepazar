import Link from "next/link";

/** Berrak Güven imza öğesi: 3×3 ızgara, ortadaki yeşil (tazelik sinyali). */
function GridMark() {
  const cells = Array.from({ length: 9 });
  return (
    <span className="grid grid-cols-3 gap-1" aria-hidden>
      {cells.map((_, i) => (
        <span
          key={i}
          className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green" : "bg-navy/25"}`}
        />
      ))}
    </span>
  );
}

function SinyalRozet({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-card px-3 py-1">
      <span className={`size-2 rounded-full ${renk}`} />
      {etiket}
    </span>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-3">
        <GridMark />
        <span className="font-display text-2xl font-semibold text-navy">ProjePazar</span>
      </div>

      <h1 className="max-w-2xl text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
        Çok-müteahhitli canlı konut stoğu dağıtım ağı
      </h1>

      <p className="max-w-xl text-balance text-gray">
        Tek doğru kaynak · granüler tahsis · çift-satış kalkanı · görünür tazelik.
        Gayrimenkulün güven protokolü.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-sm text-ink">
        <SinyalRozet renk="bg-green" etiket="müsait" />
        <SinyalRozet renk="bg-amber" etiket="opsiyon" />
        <SinyalRozet renk="bg-red" etiket="satıldı" />
      </div>

      <Link
        href="/login"
        className="rounded-lg bg-navy px-6 py-3 font-medium text-white transition-colors hover:bg-ink"
      >
        Giriş yap
      </Link>
    </main>
  );
}
