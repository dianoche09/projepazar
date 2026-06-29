"use client";

const TIP_FILTRE = ["1+1", "2+1", "3+1", "4+1", "Dubleks"];
const TUR_FILTRE: [string, string][] = [
  ["daire", "Daire"],
  ["villa", "Villa"],
  ["ofis", "Ofis"],
  ["dukkan", "Dükkan"],
  ["depo", "Depo"],
  ["otopark", "Otopark"],
];

type Durum = "" | "musait" | "opsiyon";

// Faz 1 = YURTİÇİ: para birimi (döviz) / golden vize / oturum filtreleri YOK (yabancı modülü Faz 2).
// Kira getirisi yurtiçi yatırımcı için kalır.
export function HavuzFiltreler({
  il,
  setIl,
  ilce,
  setIlce,
  tip,
  tipAcKapa,
  durum,
  setDurum,
  iller,
  ilceler,
  tur,
  turAcKapa,
  fiyatMin,
  setFiyatMin,
  fiyatMax,
  setFiyatMax,
  minKira,
  setMinKira,
}: {
  il: string;
  setIl: (v: string) => void;
  ilce: string;
  setIlce: (v: string) => void;
  tip: string[];
  tipAcKapa: (t: string) => void;
  durum: Durum;
  setDurum: (v: Durum) => void;
  iller: string[];
  ilceler: string[];
  tur: string[];
  turAcKapa: (t: string) => void;
  fiyatMin: string;
  setFiyatMin: (v: string) => void;
  fiyatMax: string;
  setFiyatMax: (v: string) => void;
  minKira: string;
  setMinKira: (v: string) => void;
}) {
  const inp =
    "w-full rounded-xl border border-hair bg-soft px-3.5 py-2.5 font-sans text-xs text-ink outline-none transition-all focus:border-teal focus:bg-card";
  const cip = (aktif: boolean) =>
    `rounded-xl border px-3 py-2 text-[12px] font-bold transition-all duration-200 ${
      aktif
        ? "border-teal bg-teal text-white shadow-sm"
        : "border-hair bg-card text-ink-soft hover:border-teal/30 hover:bg-soft"
    }`;
  const baslik = "mt-5 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]";

  return (
    <div>
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">Konum</h4>
      <select
        value={il}
        onChange={(e) => {
          setIl(e.target.value);
          setIlce("");
        }}
        className={`mt-2 ${inp}`}
      >
        <option value="">Tüm iller</option>
        {iller.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
      <select value={ilce} onChange={(e) => setIlce(e.target.value)} className={`mt-2 ${inp}`}>
        <option value="">İlçe · tümü</option>
        {ilceler.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <h4 className={baslik}>Daire Tipi</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TIP_FILTRE.map((t) => (
          <button key={t} onClick={() => tipAcKapa(t)} className={cip(tip.includes(t))}>
            {t}
          </button>
        ))}
      </div>

      <h4 className={baslik}>Birim Türü</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TUR_FILTRE.map(([v, et]) => (
          <button key={v} onClick={() => turAcKapa(v)} className={cip(tur.includes(v))}>
            {et}
          </button>
        ))}
      </div>

      <h4 className={baslik}>Durum</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {([
          ["", "Tümü"],
          ["musait", "Müsait"],
          ["opsiyon", "Opsiyonlu"],
        ] as const).map(([v, et]) => (
          <button key={v} onClick={() => setDurum(v)} className={cip(durum === v)}>
            {et}
          </button>
        ))}
      </div>

      <h4 className={baslik}>Fiyat Aralığı (₺)</h4>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Min"
          value={fiyatMin}
          onChange={(e) => setFiyatMin(e.target.value)}
          className={inp}
        />
        <input
          type="number"
          inputMode="numeric"
          placeholder="Max"
          value={fiyatMax}
          onChange={(e) => setFiyatMax(e.target.value)}
          className={inp}
        />
      </div>

      <h4 className={baslik}>Yatırım</h4>
      <input
        type="number"
        inputMode="numeric"
        placeholder="Min yıllık kira getirisi %"
        value={minKira}
        onChange={(e) => setMinKira(e.target.value)}
        className={`mt-2 ${inp}`}
      />
    </div>
  );
}
