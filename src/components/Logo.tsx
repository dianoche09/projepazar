/** ProjePazar sinyal logosu — 3×3 ızgara (Marka Panosu). Köşelerde yeşil/amber/kırmızı sinyal. */
export function Logo({ size = 28, wordmark = false }: { size?: number; wordmark?: boolean }) {
  // o=outline navy, g=yeşil, a=amber, r=kırmızı (Ekranlar.html birebir)
  const cells = ["o", "o", "g", "o", "a", "o", "r", "o", "o"] as const;
  const renk: Record<string, string> = { g: "bg-green", a: "bg-amber", r: "bg-red" };
  const birim = size / 3.4;
  const bosluk = size / 11;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid grid-cols-3" style={{ gap: bosluk }} aria-hidden>
        {cells.map((c, i) => (
          <span
            key={i}
            style={{ width: birim, height: birim }}
            className={`rounded-[3px] ${c === "o" ? "ring-2 ring-inset ring-navy/85" : renk[c]}`}
          />
        ))}
      </span>
      {wordmark ? (
        <span className="font-display text-xl font-extrabold tracking-tight text-navy">
          proje<span className="text-teal">pazar</span>
        </span>
      ) : null}
    </span>
  );
}
