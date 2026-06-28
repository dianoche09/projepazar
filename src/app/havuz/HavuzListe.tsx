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
    <div className="mx-auto max-w-6xl py-4 text-slate-800">
      {/* Filtrele — açılır panel (tüm ekranlar) */}
      <details className="mb-6 rounded-2xl glass-card transition-all duration-300">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-bold text-slate-800">
          <span>Filtreleme Seçenekleri</span>
          {aktifSayi > 0 ? (
            <span className="rounded-full bg-teal px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-white shadow-sm">{aktifSayi}</span>
          ) : null}
          <span className="ml-auto text-xs text-slate-400 font-mono font-bold">{liste.length} proje listeleniyor</span>
        </summary>
        <div className="border-t border-slate-100 px-5 py-5 bg-slate-50/50">
          <HavuzFiltreler {...filtreProps} />
        </div>
      </details>

      <div className="belir mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
              {il ? `${ilce || il} · Yetkili Projeler` : "Yetkili Projeler"}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-1 font-mono text-[11px] font-bold text-green border border-green/20">
              <span className="nabiz size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" aria-hidden /> Canlı
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {liste.length} proje · {toplamBirim} birim canlı{sonSenkron ? ` · son senkron ${sonSenkron}` : ""}
          </p>
        </div>
        <select
          value={sirala}
          onChange={(e) => setSirala(e.target.value as typeof sirala)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal/50 shadow-sm"
        >
          <option value="taze">En taze ▾</option>
          <option value="musait">En çok müsait</option>
          <option value="ucuz">En uygun</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {liste.map((p, i) => {
          const wa = `${p.ad} · ${[p.ilce, p.il].filter(Boolean).join(", ")}${p.min ? ` · ${fiyat(p.min)} ${paraSimge(p.para_birimi)}'den` : ""}`;
          return (
            <div
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              className="belir group overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:border-teal/20 hover:-translate-y-0.5 hover:shadow-cardlg"
            >
              {/* thumb — render görsel */}
              <Link href={`/havuz/proje/${p.id}`} className="relative block h-[180px] overflow-hidden border-b border-slate-100">
                {p.kapak ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.kapak} alt={p.ad} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200" />
                    <span className="absolute inset-0 flex select-none items-center justify-center font-display text-7xl font-extrabold text-slate-300/40">
                      {p.ad.charAt(0).toUpperCase()}
                    </span>
                  </>
                )}
                {p.belge_dogrulandi && (
                  <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-[11px] font-bold text-teal shadow-sm">
                    ✓ Doğrulanmış
                  </span>
                )}
                <span className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-green/20 bg-green-soft px-3 py-1 font-mono text-[11px] font-bold text-green backdrop-blur-md">
                  <span className="nabiz size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
                  {zamanOnce(p.son_guncelleme)}
                </span>
                <span className="absolute bottom-3.5 right-3.5 rounded-lg bg-black/60 px-2.5 py-1.5 font-mono text-[10.5px] font-bold text-white/95 backdrop-blur-md border border-white/5">
                  ◳ {p.toplam} BİRİM
                </span>
              </Link>

              {/* gövde */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link href={`/havuz/proje/${p.id}`}>
                      <h3 className="font-display text-lg font-bold text-slate-900 hover:text-teal transition-colors tracking-tight">{p.ad}</h3>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      {[p.ilce, p.mahalle].filter(Boolean).join(" · ") || "—"}
                      {yil(p.teslim_tarihi) ? ` · ${yil(p.teslim_tarihi)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-base font-bold text-slate-900 tracking-tight">
                      {p.min != null ? `${fiyat(p.min)} – ${p.max != null ? fiyat(p.max) : ""} ${paraSimge(p.para_birimi)}` : "Fiyat Belirtilmedi"}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase mt-0.5">KDV dahil</span>
                  </div>
                </div>

                {p.tipler.length > 0 && (
                  <div className="my-4 flex flex-wrap gap-1.5">
                    {p.tipler.slice(0, 3).map((t) => (
                      <span key={t} className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-1.5 pl-1.5 pr-2.5 text-[11px] font-semibold text-slate-700">
                        <MiniPlan /> {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <YiginBar
                    parcalar={[
                      { etiket: "Müsait", deger: p.musait, renk: "#10b981" },
                      { etiket: "Opsiyon", deger: p.opsiyon, renk: "#f59e0b" },
                      { etiket: "Satıldı", deger: p.satildi, renk: "#ef4444" },
                    ]}
                  />
                </div>

                <div className="my-3 flex flex-wrap gap-3.5 text-[11px] text-slate-500 font-mono uppercase font-bold">
                  <span><span className="mr-1.5 inline-block size-1.5 rounded-full bg-green align-middle shadow-[0_0_6px_var(--color-green)]" /><b className="text-slate-800 font-sans">{p.musait}</b> Müsait</span>
                  <span><span className="mr-1.5 inline-block size-1.5 rounded-full bg-amber align-middle shadow-[0_0_6px_var(--color-amber)]" /><b className="text-slate-800 font-sans">{p.opsiyon}</b> Opsiyon</span>
                  <span><span className="mr-1.5 inline-block size-1.5 rounded-full bg-red align-middle shadow-[0_0_6px_var(--color-red)]" /><b className="text-slate-800 font-sans">{p.satildi}</b> Satıldı</span>
                </div>

                {(p.kira_getirisi != null || p.oturum_uygun || p.golden_visa) && (
                  <div className="mb-4 flex flex-wrap gap-2 text-[10.5px] font-bold">
                    {p.kira_getirisi != null && (
                      <span className="rounded-lg bg-teal-soft border border-teal/10 px-2.5 py-1 text-teal">%{p.kira_getirisi} Kira Getirisi</span>
                    )}
                    {p.oturum_uygun && (
                      <span className="rounded-lg bg-slate-100 border border-slate-200/60 px-2.5 py-1 text-slate-700">Oturuma Uygun</span>
                    )}
                    {p.golden_visa && (
                      <span className="rounded-lg bg-amber-soft border border-amber/10 px-2.5 py-1 text-amber-700">Golden Visa</span>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <Link
                    href={`/havuz/proje/${p.id}`}
                    className="flex-1 rounded-xl bg-teal py-3 text-center text-xs font-bold text-white transition-all duration-300 hover:bg-teal-d shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                  >
                    Detaylı İncele
                  </Link>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(wa)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-350"
                  >
                    WhatsApp ile Paylaş
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {liste.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/70 p-16 text-center">
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              {projeler.length === 0
                ? "Sana tahsisli proje bulunmuyor. Üretici tahsis tanımladığında burada canlı olarak listelenecektir."
                : "Filtreleme kriterlerinize uygun proje bulunamadı."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
