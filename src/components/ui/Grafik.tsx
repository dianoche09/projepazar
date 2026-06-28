type Parca = { etiket: string; deger: number; renk: string };

/**
 * Donut grafik — stok dağılımı (müsait/opsiyon/satıldı). Saf SVG, render-body
 * mutasyonu yok (kümülatif offset map ile hesaplanır → React Compiler güvenli).
 * Ortada toplam + alt etiket.
 */
export function Donut({
  parcalar,
  boyut = 132,
  kalin = 16,
  ortaUst,
  ortaAlt,
}: {
  parcalar: Parca[];
  boyut?: number;
  kalin?: number;
  ortaUst?: string;
  ortaAlt?: string;
}) {
  const toplam = parcalar.reduce((a, p) => a + p.deger, 0);
  const r = (boyut - kalin) / 2;
  const cevre = 2 * Math.PI * r;
  const merkez = boyut / 2;

  const dilimler = parcalar.map((p, i) => {
    const onceki = parcalar.slice(0, i).reduce((a, x) => a + x.deger, 0);
    const oran = toplam > 0 ? p.deger / toplam : 0;
    return {
      ...p,
      uzunluk: oran * cevre,
      offset: toplam > 0 ? (onceki / toplam) * cevre : 0,
    };
  });

  return (
    <div className="relative inline-grid place-items-center" style={{ width: boyut, height: boyut }}>
      <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`} className="-rotate-90">
        <circle cx={merkez} cy={merkez} r={r} fill="none" stroke="#f1f5f9" strokeWidth={kalin} />
        {toplam > 0
          ? dilimler.map((d) => (
              <circle
                key={d.etiket}
                cx={merkez}
                cy={merkez}
                r={r}
                fill="none"
                stroke={d.renk}
                strokeWidth={kalin}
                strokeDasharray={`${Math.max(d.uzunluk - 2, 0)} ${cevre}`}
                strokeDashoffset={-d.offset}
                strokeLinecap="round"
              />
            ))
          : null}
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        {ortaUst ? <span className="font-mono text-2xl font-extrabold tabular-nums text-slate-800">{ortaUst}</span> : null}
        {ortaAlt ? <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{ortaAlt}</span> : null}
      </div>
    </div>
  );
}

/** Yatay oran çubuğu — projeleri/birimleri kıyaslamak için. */
export function OranBar({ deger, maks, renk }: { deger: number; maks: number; renk: string }) {
  const yuzde = maks > 0 ? Math.round((deger / maks) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-hair">
      <div className="h-full rounded-full" style={{ width: `${yuzde}%`, background: renk }} />
    </div>
  );
}

/** Çok-renkli yığın çubuk (müsait/opsiyon/satıldı tek satırda). */
export function YiginBar({ parcalar, yukseklik = 8 }: { parcalar: Parca[]; yukseklik?: number }) {
  const toplam = parcalar.reduce((a, p) => a + p.deger, 0);
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-hair" style={{ height: yukseklik }}>
      {toplam > 0
        ? parcalar.map((p) => (
            <div key={p.etiket} style={{ width: `${(p.deger / toplam) * 100}%`, background: p.renk }} title={`${p.etiket}: ${p.deger}`} />
          ))
        : null}
    </div>
  );
}

/** Grafik lejantı — renk noktası + etiket + sayı. */
export function Lejant({ parcalar }: { parcalar: Parca[] }) {
  return (
    <ul className="space-y-2 font-bold">
      {parcalar.map((p) => (
        <li key={p.etiket} className="flex items-center gap-2 text-xs">
          <span className="size-2 shrink-0 rounded-full" style={{ background: p.renk }} />
          <span className="text-slate-500 font-semibold">{p.etiket}</span>
          <span className="ml-auto font-mono font-extrabold tabular-nums text-slate-800">{p.deger}</span>
        </li>
      ))}
    </ul>
  );
}
