"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { paraKisa } from "@/lib/stok";

export type EslesBirim = {
  id: string;
  daire_no: string | null;
  kat: number | null;
  liste_fiyati: number | null;
  para_birimi: string;
  net_m2: number | null;
  brut_m2: number | null;
  yon: string | null;
  proje_id: string;
  proje_ad: string | null;
  il: string | null;
  ilce: string | null;
  oda: string | null;
  tip_ad: string | null;
};

const inp = "rounded-lg border border-hair bg-card px-3 py-2 text-sm text-ink outline-none focus:border-teal";
const distinct = (v: (string | null)[]) =>
  [...new Set(v.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "tr"));

export function Eslestirici({ birimler }: { birimler: EslesBirim[] }) {
  const [butceMin, setButceMin] = useState("");
  const [butceMax, setButceMax] = useState("");
  const [oda, setOda] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [minM2, setMinM2] = useState("");
  const [kat, setKat] = useState<"" | "yuksek" | "dusuk">("");
  const [arandi, setArandi] = useState(false);

  const odaSec = useMemo(() => distinct(birimler.map((b) => b.oda)), [birimler]);
  const ilSec = useMemo(() => distinct(birimler.map((b) => b.il)), [birimler]);
  const ilceSec = useMemo(() => distinct(birimler.filter((b) => !il || b.il === il).map((b) => b.ilce)), [birimler, il]);

  const sonuc = useMemo(() => {
    const min = butceMin ? Number(butceMin) : null;
    const max = butceMax ? Number(butceMax) : null;
    const m2 = minM2 ? Number(minM2) : null;

    const uygun = birimler.filter((b) => {
      const f = b.liste_fiyati;
      if (min != null && (f == null || f < min)) return false;
      if (max != null && (f == null || f > max)) return false;
      if (oda && b.oda !== oda) return false;
      if (il && b.il !== il) return false;
      if (ilce && b.ilce !== ilce) return false;
      if (m2 != null && (b.net_m2 ?? 0) < m2) return false;
      return true;
    });

    // Fit skoru: değer yoğunluğu (m²/M₺) + kat tercihi bonusu → en uygun üstte
    return uygun
      .map((b) => {
        const m2PerM = b.net_m2 && b.liste_fiyati ? b.net_m2 / (b.liste_fiyati / 1_000_000) : 0;
        const katBonus = kat === "yuksek" ? (b.kat ?? 0) * 0.4 : kat === "dusuk" ? (12 - (b.kat ?? 0)) * 0.4 : 0;
        return { b, skor: m2PerM + katBonus };
      })
      .sort((x, y) => y.skor - x.skor);
  }, [birimler, butceMin, butceMax, oda, il, ilce, minM2, kat]);

  const temizle = () => {
    setButceMin(""); setButceMax(""); setOda(""); setIl(""); setIlce(""); setMinM2(""); setKat(""); setArandi(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold text-ink">Müşteri Eşleştirme</h1>
        <p className="mt-1 text-[12.5px] text-gray">
          Müşterinin kriterlerini gir — sana <span className="font-medium text-ink">tahsisli</span> havuzdan en uygun
          birimleri sıralar. (Havuzunda {birimler.length} müsait birim var.)
        </p>
      </header>

      {/* Kriter formu */}
      <div className="rounded-2xl border border-hair bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            Bütçe min (₺)
            <input value={butceMin} onChange={(e) => setButceMin(e.target.value)} type="number" placeholder="—" className={inp} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            Bütçe max (₺)
            <input value={butceMax} onChange={(e) => setButceMax(e.target.value)} type="number" placeholder="—" className={inp} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            Oda
            <select value={oda} onChange={(e) => setOda(e.target.value)} className={inp}>
              <option value="">Fark etmez</option>
              {odaSec.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            Şehir
            <select value={il} onChange={(e) => { setIl(e.target.value); setIlce(""); }} className={inp}>
              <option value="">Fark etmez</option>
              {ilSec.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            İlçe
            <select value={ilce} onChange={(e) => setIlce(e.target.value)} className={inp}>
              <option value="">Fark etmez</option>
              {ilceSec.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
            Min net m²
            <input value={minM2} onChange={(e) => setMinM2(e.target.value)} type="number" placeholder="—" className={inp} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray sm:col-span-3">
            Kat tercihi
            <div className="flex gap-1.5">
              {([["", "Fark etmez"], ["yuksek", "Yüksek kat"], ["dusuk", "Düşük kat"]] as const).map(([v, a]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setKat(v)}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    kat === v ? "border-teal bg-teal text-white" : "border-hair bg-card text-ink-soft hover:border-teal/30"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArandi(true)}
            className="rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-d"
          >
            Eşleştir
          </button>
          <button type="button" onClick={temizle} className="text-[13px] font-medium text-gray hover:text-ink hover:underline">
            Temizle
          </button>
        </div>
      </div>

      {/* Sonuçlar */}
      {arandi ? (
        <div className="mt-5">
          <p className="mb-2 text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">{sonuc.length}</span> uygun birim
            {sonuc.length ? " · en uygun üstte (değer yoğunluğu)" : ""}
          </p>
          {sonuc.length === 0 ? (
            <p className="rounded-xl border border-hair bg-card px-4 py-10 text-center text-sm text-gray">
              Bu kriterlere uygun tahsisli birim yok. Kriterleri gevşet veya üreticiden bu profile tahsis iste.
            </p>
          ) : (
            <div className="space-y-2">
              {sonuc.slice(0, 30).map(({ b }, i) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-hair bg-card p-3.5">
                  <span className="grid size-7 flex-none place-items-center rounded-lg bg-teal/10 font-mono text-[12px] font-bold text-teal-d">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {b.proje_ad ?? "Proje"} · Daire {b.daire_no ?? "—"}
                    </p>
                    <p className="mono text-[11.5px] text-gray">
                      {[b.oda ?? b.tip_ad, b.net_m2 ? `${b.net_m2} m²` : null, b.kat != null ? `K${b.kat}` : null, b.yon, [b.il, b.ilce].filter(Boolean).join("/")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="mono flex-none text-[14px] font-bold text-ink">
                    {b.liste_fiyati ? paraKisa(b.liste_fiyati, b.para_birimi) : "—"}
                  </span>
                  <Link
                    href={`/havuz/proje/${b.proje_id}`}
                    className="flex-none rounded-lg border border-hair bg-card px-3 py-1.5 text-xs font-semibold text-teal-d transition-colors hover:border-teal"
                  >
                    Aç · paylaş →
                  </Link>
                </div>
              ))}
              {sonuc.length > 30 ? (
                <p className="pt-1 text-center text-[11px] text-gray">İlk 30 gösteriliyor — kriterleri daralt.</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
