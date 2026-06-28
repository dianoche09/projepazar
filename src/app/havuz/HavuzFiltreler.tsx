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
const PARA_FILTRE: [string, string][] = [
  ["", "Tümü"],
  ["TRY", "₺ TRY"],
  ["USD", "$ USD"],
  ["EUR", "€ EUR"],
  ["GBP", "£ GBP"],
  ["AED", "AED"],
];

type Durum = "" | "musait" | "opsiyon";

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
  paraBirimi,
  setParaBirimi,
  fiyatMin,
  setFiyatMin,
  fiyatMax,
  setFiyatMax,
  goldenViza,
  setGoldenViza,
  oturum,
  setOturum,
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
  paraBirimi: string;
  setParaBirimi: (v: string) => void;
  fiyatMin: string;
  setFiyatMin: (v: string) => void;
  fiyatMax: string;
  setFiyatMax: (v: string) => void;
  goldenViza: boolean;
  setGoldenViza: (v: boolean) => void;
  oturum: boolean;
  setOturum: (v: boolean) => void;
  minKira: string;
  setMinKira: (v: string) => void;
}) {
  const inp =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-sans text-xs text-slate-800 outline-none transition-all focus:border-teal focus:bg-white";
  const cip = (aktif: boolean) =>
    `rounded-xl border px-3 py-2 text-[12px] font-bold transition-all duration-200 ${
      aktif
        ? "border-teal bg-teal text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:border-teal/30 hover:bg-slate-50"
    }`;
  const baslik = "mt-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono";

  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Konum</h4>
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

      <h4 className={baslik}>Fiyat Aralığı</h4>
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

      <h4 className={baslik}>Para Birimi</h4>
      <select value={paraBirimi} onChange={(e) => setParaBirimi(e.target.value)} className={`mt-2 ${inp}`}>
        {PARA_FILTRE.map(([v, et]) => (
          <option key={v} value={v}>
            {et}
          </option>
        ))}
      </select>

      <h4 className={baslik}>Yatırım & Yabancı Alıcı</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button onClick={() => setGoldenViza(!goldenViza)} className={cip(goldenViza)}>
          Golden Vize
        </button>
        <button onClick={() => setOturum(!oturum)} className={cip(oturum)}>
          Oturum İzni
        </button>
      </div>
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
