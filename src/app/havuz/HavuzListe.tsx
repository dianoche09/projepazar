"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zamanOnce } from "@/lib/types";
import { YiginBar } from "@/components/ui/Grafik";
import { HavuzFiltreler } from "./HavuzFiltreler";

export type ProjeKart = {
  id: string;
  ad: string;
  il: string | null;
  ilce: string | null;
  mahalle: string | null;
  belge_dogrulandi: boolean;
  son_guncelleme: string;
  insaat_asamasi: string;
  ilerleme_yuzde: number;
  teslim_tarihi: string | null;
  toplam: number;
  musait: number;
  opsiyon: number;
  satildi: number;
  min: number | null;
  max: number | null;
  tipler: string[];
  kapak: string | null;
  // Connject-paritesi: birim türü + para birimi + yatırım/yabancı alanları
  turler: string[];
  para_birimi: string;
  oturum_uygun: boolean;
  golden_visa: boolean;
  kira_getirisi: number | null;
};

function fiyat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}B`;
  return n.toLocaleString("tr-TR");
}
function yil(iso: string | null): string {
  return iso ? `Teslim ${new Date(iso).getFullYear()}` : "";
}
const PARA_SIMGE: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£", AED: "AED" };
function paraSimge(p: string): string {
  return PARA_SIMGE[p] ?? "₺";
}

/** Mini kat planı çipi (Ekranlar.html typchip .mini) */
function MiniPlan() {
  return (
    <span className="grid size-[26px] shrink-0 grid-cols-2 grid-rows-2 gap-px rounded border border-hair bg-soft p-[2px]">
      <span className="rounded-[1px] bg-hair" />
      <span className="rounded-[1px] bg-hair/50" />
      <span className="rounded-[1px] bg-hair/50" />
      <span className="rounded-[1px] bg-hair" />
    </span>
  );
}

/** Emlakçı Havuzu — mobil-önce; filtreler masaüstü sidebar + mobil açılır panel. */
export function HavuzListe({ projeler }: { projeler: ProjeKart[] }) {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [tip, setTip] = useState<string[]>([]);
  const [durum, setDurum] = useState<"" | "musait" | "opsiyon">("");
  const [tur, setTur] = useState<string[]>([]);
  const [paraBirimi, setParaBirimi] = useState("");
  const [fiyatMin, setFiyatMin] = useState("");
  const [fiyatMax, setFiyatMax] = useState("");
  const [goldenViza, setGoldenViza] = useState(false);
  const [oturum, setOturum] = useState(false);
  const [minKira, setMinKira] = useState("");
  const [sirala, setSirala] = useState<"taze" | "ucuz" | "musait">("taze");

  const iller = useMemo(() => [...new Set(projeler.map((p) => p.il).filter(Boolean))] as string[], [projeler]);
  const ilceler = useMemo(
    () => [...new Set(projeler.filter((p) => !il || p.il === il).map((p) => p.ilce).filter(Boolean))] as string[],
    [projeler, il],
  );

  const liste = useMemo(() => {
    const l = projeler.filter(
      (p) =>
        (!il || p.il === il) &&
        (!ilce || p.ilce === ilce) &&
        (!tip.length || tip.some((t) => p.tipler.some((pt) => pt.startsWith(t)))) &&
        (durum === "" || (durum === "musait" ? p.musait > 0 : p.opsiyon > 0)) &&
        (!tur.length || tur.some((t) => p.turler.includes(t))) &&
        (!paraBirimi || p.para_birimi === paraBirimi) &&
        (!fiyatMin || (p.max != null && p.max >= Number(fiyatMin))) &&
        (!fiyatMax || (p.min != null && p.min <= Number(fiyatMax))) &&
        (!goldenViza || p.golden_visa) &&
        (!oturum || p.oturum_uygun) &&
        (!minKira || (p.kira_getirisi != null && p.kira_getirisi >= Number(minKira))),
    );
    return [...l].sort((a, b) => {
      if (sirala === "ucuz") return (a.min ?? Infinity) - (b.min ?? Infinity);
      if (sirala === "musait") return b.musait - a.musait;
      return b.son_guncelleme.localeCompare(a.son_guncelleme);
    });
  }, [projeler, il, ilce, tip, durum, tur, paraBirimi, fiyatMin, fiyatMax, goldenViza, oturum, minKira, sirala]);

  const toplamBirim = projeler.reduce((t, p) => t + p.toplam, 0);
  const sonSenkron = projeler[0]?.son_guncelleme ? zamanOnce(projeler[0].son_guncelleme) : null;
  const tipAcKapa = (t: string) => setTip((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const turAcKapa = (t: string) => setTur((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const aktifSayi =
    (il ? 1 : 0) + (ilce ? 1 : 0) + tip.length + (durum ? 1 : 0) + tur.length +
    (paraBirimi ? 1 : 0) + (fiyatMin ? 1 : 0) + (fiyatMax ? 1 : 0) +
    (goldenViza ? 1 : 0) + (oturum ? 1 : 0) + (minKira ? 1 : 0);
  const filtreProps = {
    il, setIl, ilce, setIlce, tip, tipAcKapa, durum, setDurum, iller, ilceler,
    tur, turAcKapa, paraBirimi, setParaBirimi, fiyatMin, setFiyatMin, fiyatMax, setFiyatMax,
    goldenViza, setGoldenViza, oturum, setOturum, minKira, setMinKira,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Filtrele — açılır panel (tüm ekranlar) */}
      <details className="mb-4 rounded-xl border border-hair bg-card">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
          <span>Filtrele</span>
          {aktifSayi > 0 ? (
            <span className="rounded-full bg-navy px-2 py-0.5 font-mono text-xs text-white">{aktifSayi}</span>
          ) : null}
          <span className="ml-auto text-xs text-gray">{liste.length} proje</span>
        </summary>
        <div className="border-t border-hair px-4 py-4">
          <HavuzFiltreler {...filtreProps} />
        </div>
      </details>

      <div className="belir mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-xl font-extrabold text-ink">
                {il ? `${ilce || il} · Yetkili Projeler` : "Yetkili Projeler"}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-d">
                <span className="nabiz size-1.5 rounded-full bg-green" aria-hidden /> Canlı
              </span>
            </div>
            <p className="text-[13px] text-gray">
              {liste.length} proje · {toplamBirim} birim canlı{sonSenkron ? ` · son senkron ${sonSenkron}` : ""}
            </p>
          </div>
          <select
            value={sirala}
            onChange={(e) => setSirala(e.target.value as typeof sirala)}
            className="rounded-lg border border-hair bg-card px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-teal"
          >
            <option value="taze">En taze ▾</option>
            <option value="musait">En çok müsait</option>
            <option value="ucuz">En uygun</option>
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {liste.map((p, i) => {
            const wa = `${p.ad} · ${[p.ilce, p.il].filter(Boolean).join(", ")}${p.min ? ` · ${fiyat(p.min)}₺'den` : ""}`;
            return (
              <div
                key={p.id}
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                className="belir group overflow-hidden rounded-2xl border border-hair bg-card shadow-card transition-shadow hover:shadow-cardlg"
              >
                {/* thumb — render görsel */}
                <Link href={`/havuz/proje/${p.id}`} className="relative block h-[160px] overflow-hidden">
                  {p.kapak ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.kapak} alt={p.ad} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-navy-soft via-teal-soft to-soft" />
                      <span className="absolute inset-0 flex select-none items-center justify-center font-display text-6xl font-bold text-teal-d/25">
                        {p.ad.charAt(0).toUpperCase()}
                      </span>
                    </>
                  )}
                  {p.belge_dogrulandi && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-1 text-[11px] font-semibold text-teal-d shadow-sm">
                      ✓ Doğrulanmış
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-green bg-green-soft px-2.5 py-1 font-mono text-[11.5px] text-ink">
                    <span className="nabiz size-2 rounded-full bg-green" />
                    {zamanOnce(p.son_guncelleme)}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-md bg-ink/70 px-2 py-1 font-mono text-[10.5px] text-white backdrop-blur-sm">
                    ◳ {p.toplam} birim
                  </span>
                </Link>

                {/* gövde */}
                <div className="p-3.5">
                  <Link href={`/havuz/proje/${p.id}`}>
                    <h3 className="font-display text-[17px] font-bold text-ink hover:text-teal-d">{p.ad}</h3>
                  </Link>
                  <p className="text-[12.5px] text-gray">
                    {[p.ilce, p.mahalle].filter(Boolean).join(" · ") || "—"}
                    {yil(p.teslim_tarihi) ? ` · ${yil(p.teslim_tarihi)}` : ""}
                  </p>

                  {p.tipler.length > 0 && (
                    <div className="my-2.5 flex flex-wrap gap-1.5">
                      {p.tipler.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 rounded-lg border border-hair py-1 pl-1 pr-2 text-[11.5px] text-ink">
                          <MiniPlan /> {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2.5">
                    <YiginBar
                      parcalar={[
                        { etiket: "Müsait", deger: p.musait, renk: "#2FB36B" },
                        { etiket: "Opsiyon", deger: p.opsiyon, renk: "#E3A12C" },
                        { etiket: "Satıldı", deger: p.satildi, renk: "#D15A4E" },
                      ]}
                    />
                  </div>

                  <div className="my-2.5 flex flex-wrap gap-3 text-[12px] text-gray">
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-green align-middle" /><b className="text-ink">{p.musait}</b> müsait</span>
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-amber align-middle" /><b className="text-ink">{p.opsiyon}</b> opsiyon</span>
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-red align-middle" /><b className="text-ink">{p.satildi}</b> satıldı</span>
                  </div>

                  {(p.kira_getirisi != null || p.oturum_uygun || p.golden_visa) && (
                    <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                      {p.kira_getirisi != null && (
                        <span className="rounded-md bg-teal-soft px-2 py-0.5 text-teal-d">%{p.kira_getirisi} kira getirisi</span>
                      )}
                      {p.oturum_uygun && (
                        <span className="rounded-md bg-navy-soft px-2 py-0.5 text-navy">Oturum uygun</span>
                      )}
                      {p.golden_visa && (
                        <span className="rounded-md bg-amber/15 px-2 py-0.5 text-amber">Golden Vize</span>
                      )}
                    </div>
                  )}

                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[14.5px] font-medium text-ink">
                      {p.min != null ? `${fiyat(p.min)} – ${p.max != null ? fiyat(p.max) : ""} ${paraSimge(p.para_birimi)}` : "fiyat —"}
                    </span>
                    <span className="font-mono text-[11px] text-gray">KDV dahil</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/havuz/proje/${p.id}`}
                      className="flex-1 rounded-lg bg-green py-2.5 text-center text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      İncele
                    </Link>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(wa)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-teal py-2.5 text-center text-[13px] font-semibold text-teal-d transition-colors hover:bg-teal-soft"
                    >
                      WhatsApp Paylaş
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {liste.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-hair bg-card/50 p-12 text-center">
              <p className="text-sm text-gray">
                {projeler.length === 0
                  ? "Sana tahsisli proje yok. Üretici tahsis edince burada canlı görünür."
                  : "Filtreye uyan proje yok."}
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
