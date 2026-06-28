"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zamanOnce } from "@/lib/types";
import { HavuzFiltreler } from "./HavuzFiltreler";
import { projeKapak } from "@/lib/gorsel";

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

/** Bayatlık eşiği: 7 günden eski stok = stale (yeşil rozet → amber). DEĞİŞMEZ #5. */
const STALE_GUN = 7;
function bayatMi(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > STALE_GUN * 86_400_000;
}

/** Emlakçı Havuzu — v2-emlakci "Yetkili Projeler" görünümü. Veri: tahsisli RLS sorgusu. */
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

  // KPI — GERÇEK değerlerden hesap (tahsisli RLS havuzundan).
  const toplamBirim = projeler.reduce((t, p) => t + p.toplam, 0);
  const toplamMusait = projeler.reduce((t, p) => t + p.musait, 0);
  const toplamOpsiyon = projeler.reduce((t, p) => t + p.opsiyon, 0);
  const uretSayi = useMemo(() => new Set(projeler.map((p) => `${p.il ?? ""}|${p.ilce ?? ""}`)).size, [projeler]);
  const sonSenkron = projeler[0]?.son_guncelleme ? zamanOnce(projeler[0].son_guncelleme) : null;

  const tipAcKapa = (t: string) => setTip((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const turAcKapa = (t: string) => setTur((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const temizle = () => {
    setIl("");
    setIlce("");
    setTip([]);
    setDurum("");
    setTur([]);
    setParaBirimi("");
    setFiyatMin("");
    setFiyatMax("");
    setGoldenViza(false);
    setOturum(false);
    setMinKira("");
  };
  const aktifSayi =
    (il ? 1 : 0) + (ilce ? 1 : 0) + tip.length + (durum ? 1 : 0) + tur.length +
    (paraBirimi ? 1 : 0) + (fiyatMin ? 1 : 0) + (fiyatMax ? 1 : 0) +
    (goldenViza ? 1 : 0) + (oturum ? 1 : 0) + (minKira ? 1 : 0);
  const filtreProps = {
    il, setIl, ilce, setIlce, tip, tipAcKapa, durum, setDurum, iller, ilceler,
    tur, turAcKapa, paraBirimi, setParaBirimi, fiyatMin, setFiyatMin, fiyatMax, setFiyatMax,
    goldenViza, setGoldenViza, oturum, setOturum, minKira, setMinKira,
  };

  const okChevron = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-[1240px] text-ink">
      {/* Başlık */}
      <header className="belir mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="rozet" style={{ background: "rgba(47,179,107,.12)", color: "var(--color-green)" }}>
              <span className="freshdot nabiz" style={{ background: "var(--color-green)" }} />
              Canlı
            </span>
            {sonSenkron ? (
              <span className="text-[12.5px] font-medium text-slate-400">
                son senkron <span className="mono text-ink-soft">{sonSenkron}</span>
              </span>
            ) : null}
          </div>
          <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-navy md:text-[31px]">
            Havuz · Yetkili Projeler
          </h1>
          <p className="mt-2 max-w-[560px] text-[13.5px] text-ink-soft">
            Sana tahsisli canlı stok. Fiyat ve durum üreticinin tek doğru kaynağından akar — sen görür, paylaşır, opsiyon
            alırsın.
          </p>
        </div>
        <select
          value={sirala}
          onChange={(e) => setSirala(e.target.value as typeof sirala)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-teal/50"
          aria-label="Sıralama"
        >
          <option value="taze">En taze ▾</option>
          <option value="musait">En çok müsait</option>
          <option value="ucuz">En uygun</option>
        </select>
      </header>

      {/* Filtre çubuğu — v2 chip özeti + gerçek filtre paneli (açılır) */}
      <div className="belir belir-1 mb-5">
        <details className="kart group overflow-hidden" style={{ borderRadius: 16 }}>
          <summary className="filterbar flex cursor-pointer list-none flex-nowrap items-center gap-2.5 overflow-x-auto p-2.5">
            <span className="flex items-center gap-1.5 pl-1 pr-1.5 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              <span className="hidden text-[12px] font-semibold uppercase tracking-wide md:inline">Filtre</span>
            </span>
            <span className="chip">
              <span className="text-slate-400">İl</span> {il || "Tümü"} {okChevron}
            </span>
            <span className="chip">
              <span className="text-slate-400">İlçe</span> {ilce || "Tümü"} {okChevron}
            </span>
            <span className="chip">
              <span className="text-slate-400">Tip</span> {tip.length ? tip.join(" · ") : "Tümü"} {okChevron}
            </span>
            <span className="chip">
              {durum ? (
                <span
                  className="freshdot"
                  style={{ background: durum === "opsiyon" ? "var(--color-amber)" : "var(--color-green)" }}
                />
              ) : null}
              {durum === "musait" ? "Müsait" : durum === "opsiyon" ? "Opsiyonlu" : "Durum"} {okChevron}
            </span>
            <span className="chip" style={{ cursor: "default", gap: 8 }}>
              <span className="text-slate-400">Fiyat</span>
              <span className="mono text-[12.5px] text-ink">{fiyatMin ? `₺${fiyat(Number(fiyatMin))}` : "Min"}</span>
              <span className="text-slate-400">–</span>
              <span className="mono text-[12.5px] text-ink">{fiyatMax ? `₺${fiyat(Number(fiyatMax))}` : "Max"}</span>
            </span>
            <span className="chip">
              <span className="text-slate-400">Birim</span> {paraBirimi ? `${paraSimge(paraBirimi)} ${paraBirimi}` : "Tümü"} {okChevron}
            </span>
            <span className="ml-auto flex items-center gap-2 pr-1">
              {aktifSayi > 0 ? (
                <span className="mono rounded-full bg-teal px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                  {aktifSayi}
                </span>
              ) : null}
              <span className="text-[12.5px] font-bold text-slate-400">{liste.length} proje</span>
            </span>
          </summary>
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5">
            <HavuzFiltreler {...filtreProps} />
            {aktifSayi > 0 ? (
              <button
                onClick={temizle}
                className="mt-5 text-[12.5px] font-medium text-slate-400 transition hover:text-red"
              >
                Filtreleri temizle
              </button>
            ) : null}
          </div>
        </details>
      </div>

      {/* KPI şeridi — gerçek sayılardan */}
      <div className="kpi-grid belir belir-2 mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="kart kart-3d p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Tahsisli Proje</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2">
              <path d="M3 21h18M5 21V7l7-4 7 4v14" />
            </svg>
          </div>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-navy">{projeler.length}</div>
          <div className="mt-1.5 text-[11.5px] text-slate-400">{uretSayi} bölge · canlı stok</div>
        </div>

        <div className="kart kart-3d p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Görebildiğin Birim</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-navy">{toplamBirim}</div>
          <div className="mt-1.5 text-[11.5px] font-medium text-green">
            {toplamMusait} müsait · {toplamOpsiyon} opsiyon
          </div>
        </div>

        <div className="kart kart-3d signal-top p-4" style={{ ["--_sig" as string]: "var(--color-amber)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Aktif Opsiyon</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="2">
              <path d="M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4" />
              <path d="M3 4v4h4" />
            </svg>
          </div>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-amber">{toplamOpsiyon}</div>
          <div className="mt-1.5 text-[11.5px] text-slate-400">opsiyonlu birim sayın</div>
        </div>

        <div className="kart kart-3d p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Müsait Birim</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-navy">{toplamMusait}</div>
          <div className="mt-1.5 text-[11.5px] font-medium text-green">paylaşıma hazır</div>
        </div>
      </div>

      {/* Proje grid başlık */}
      <div className="belir belir-3 mb-3.5 flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-[18px] font-semibold text-ink">
          {il ? `${ilce || il} · Yetkili Projelerin` : "Yetkili Projelerin"}
          <span className="mono rounded-full bg-[rgba(16,36,58,.06)] px-2 py-0.5 text-[12px] font-semibold text-slate-400">
            {liste.length}
          </span>
        </h2>
        <span className="hidden text-[12px] text-slate-400 sm:inline">Yalnız sana tahsisli stok gösteriliyor</span>
      </div>

      {/* ============ PROJE KARTLARI ============ */}
      <div className="proj-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
        {liste.map((p, i) => {
          const wa = `${p.ad} · ${[p.ilce, p.il].filter(Boolean).join(", ")}${p.min ? ` · ${fiyat(p.min)} ${paraSimge(p.para_birimi)}'den` : ""}`;
          const kapak = projeKapak(p.kapak, p.id);
          const sig = p.musait > 0 ? "var(--color-green)" : p.opsiyon > 0 ? "var(--color-amber)" : "var(--color-red)";
          const bayat = bayatMi(p.son_guncelleme);
          const musaitPct = p.toplam ? Math.round((p.musait / p.toplam) * 100) : 0;
          const opsiyonPct = p.toplam ? Math.round((p.opsiyon / p.toplam) * 100) : 0;
          const satilanPct = Math.max(0, 100 - musaitPct - opsiyonPct);
          const ps = paraSimge(p.para_birimi);
          return (
            <article
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s`, ["--_sig" as string]: sig }}
              className="kart kart-3d signal-top belir overflow-hidden"
            >
              <div className="flex gap-0">
                {/* görsel şerit (kapak HER ZAMAN) */}
                <Link
                  href={`/havuz/proje/${p.id}`}
                  className="proj-thumb relative block w-[92px] flex-none overflow-hidden"
                  aria-label={`${p.ad} detay`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kapak} alt={p.ad} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                </Link>

                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/havuz/proje/${p.id}`}>
                          <h3 className="font-display truncate text-[17px] font-bold leading-tight text-ink transition-colors hover:text-teal">
                            {p.ad}
                          </h3>
                        </Link>
                        {p.belge_dogrulandi ? (
                          <span className="rozet" style={{ background: "rgba(30,155,138,.12)", color: "var(--color-teal)" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                            </svg>
                            Doğrulanmış
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {[p.il, p.ilce].filter(Boolean).join(" · ") || "—"}
                        {yil(p.teslim_tarihi) ? ` · ${yil(p.teslim_tarihi)}` : ""}
                      </div>
                    </div>
                    {/* tazelik rozeti (bayat → amber) */}
                    <span
                      className="rozet flex-none"
                      title={bayat ? `Stok ${STALE_GUN}+ gündür güncellenmedi` : "Taze stok"}
                      style={
                        bayat
                          ? { background: "rgba(227,161,44,.14)", color: "var(--color-amber)" }
                          : { background: "rgba(47,179,107,.12)", color: "var(--color-green)" }
                      }
                    >
                      <span className="freshdot" style={{ background: bayat ? "var(--color-amber)" : "var(--color-green)" }} />
                      {zamanOnce(p.son_guncelleme)}
                    </span>
                  </div>

                  {/* stok dağılım barı */}
                  <div className="mt-3.5">
                    <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                      <span className="font-medium text-ink-soft">
                        Sana tahsisli <span className="mono font-semibold text-ink">{p.toplam}</span> birim
                      </span>
                      <span className="mono text-slate-400">%{musaitPct} müsait</span>
                    </div>
                    <div className="stokbar">
                      <div style={{ width: `${musaitPct}%`, background: "linear-gradient(90deg,#37c178,#2fb36b)" }} />
                      <div style={{ width: `${opsiyonPct}%`, background: "linear-gradient(90deg,#eab23f,#e3a12c)" }} />
                      <div style={{ width: `${satilanPct}%`, background: "rgba(16,36,58,.14)" }} />
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="freshdot" style={{ background: "var(--color-green)" }} />
                        <span className="mono font-semibold text-ink">{p.musait}</span>{" "}
                        <span className="text-slate-400">müsait</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="freshdot" style={{ background: "var(--color-amber)" }} />
                        <span className="mono font-semibold text-ink">{p.opsiyon}</span>{" "}
                        <span className="text-slate-400">opsiyon</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="freshdot" style={{ background: "var(--color-red)" }} />
                        <span className="mono font-semibold text-ink">{p.satildi}</span>{" "}
                        <span className="text-slate-400">satıldı</span>
                      </span>
                    </div>
                  </div>

                  {/* fiyat aralığı + tip */}
                  <div className="mt-3.5 flex items-end justify-between border-t pt-3.5" style={{ borderColor: "var(--cizgi)" }}>
                    <div>
                      <div className="text-[11px] font-medium text-slate-400">Fiyat aralığı</div>
                      <div className="mono mt-0.5 text-[16px] font-semibold text-navy">
                        {p.min != null ? (
                          <>
                            {ps}
                            {fiyat(p.min)} <span className="font-normal text-slate-400">–</span> {ps}
                            {p.max != null ? fiyat(p.max) : ""}
                          </>
                        ) : (
                          <span className="text-[13px] font-medium text-slate-400">Fiyat belirtilmedi</span>
                        )}
                      </div>
                    </div>
                    {p.tipler.length > 0 ? (
                      <div className="text-right">
                        <div className="text-[11px] font-medium text-slate-400">Tip</div>
                        <div className="mt-0.5 text-[12.5px] font-medium text-ink-soft">
                          {p.tipler.slice(0, 3).map((t) => t.split(" · ")[0]).join(" · ")}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* yatırım rozetleri */}
                  {(p.kira_getirisi != null || p.oturum_uygun || p.golden_visa) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[10.5px] font-bold">
                      {p.kira_getirisi != null ? (
                        <span className="rounded-lg border border-teal/10 bg-teal-soft px-2.5 py-1 text-teal">
                          %{p.kira_getirisi} Kira Getirisi
                        </span>
                      ) : null}
                      {p.oturum_uygun ? (
                        <span className="rounded-lg border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-slate-700">
                          Oturuma Uygun
                        </span>
                      ) : null}
                      {p.golden_visa ? (
                        <span className="rounded-lg border border-amber/10 bg-amber-soft px-2.5 py-1 text-amber-700">
                          Golden Visa
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* aksiyon */}
              <div className="flex items-center gap-2 px-4 pb-4 pt-0">
                <Link href={`/havuz/proje/${p.id}`} className="btn-action flex-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  İncele
                </Link>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(wa)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa flex-1"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.5 14.4c-.3-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.29-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.48.1-.19.05-.36-.02-.5-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12 2a10 10 0 0 0-8.6 15.07L2 22l5.05-1.33A10 10 0 1 0 12 2z" />
                  </svg>
                  WhatsApp Paylaş
                </a>
              </div>
            </article>
          );
        })}

        {liste.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/70 p-16 text-center">
            <p className="text-sm font-bold leading-relaxed text-slate-400">
              {projeler.length === 0
                ? "Sana tahsisli proje bulunmuyor. Üretici tahsis tanımladığında burada canlı olarak listelenecektir."
                : "Filtreleme kriterlerinize uygun proje bulunamadı."}
            </p>
          </div>
        )}
      </div>

      {/* footer mini */}
      <div className="mt-7 pb-2 text-center text-[11.5px] text-slate-400">
        ProjePazar · Canlı Konut Stoğu Dağıtım Ağı — Tahsisli stok, gerçek zamanlı. Tahsis &amp; gelir görünmez.
      </div>
    </div>
  );
}
