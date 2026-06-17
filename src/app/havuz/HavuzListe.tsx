"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zamanOnce } from "@/lib/types";

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
};

function fiyat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}B`;
  return n.toLocaleString("tr-TR");
}
function yil(iso: string | null): string {
  return iso ? `Teslim ${new Date(iso).getFullYear()}` : "";
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

const TIP_FILTRE = ["1+1", "2+1", "3+1", "4+1", "Dubleks"];

/** Emlakçı Havuzu — Berrak Güven (ProjePazar-Ekranlar.html 01 birebir). */
export function HavuzListe({ projeler }: { projeler: ProjeKart[] }) {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [tip, setTip] = useState<string[]>([]);
  const [durum, setDurum] = useState<"" | "musait" | "opsiyon">("");
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
        (durum === "" || (durum === "musait" ? p.musait > 0 : p.opsiyon > 0)),
    );
    return [...l].sort((a, b) => {
      if (sirala === "ucuz") return (a.min ?? Infinity) - (b.min ?? Infinity);
      if (sirala === "musait") return b.musait - a.musait;
      return b.son_guncelleme.localeCompare(a.son_guncelleme);
    });
  }, [projeler, il, ilce, tip, durum, sirala]);

  const toplamBirim = projeler.reduce((t, p) => t + p.toplam, 0);
  const tipAcKapa = (t: string) => setTip((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <div className="mx-auto flex max-w-6xl gap-0 px-0">
      {/* SOL FİLTRE — konum hiyerarşisi */}
      <aside className="hidden w-60 shrink-0 border-r border-hair bg-card px-4 py-5 md:block">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray">Konum</h4>
        <select
          value={il}
          onChange={(e) => {
            setIl(e.target.value);
            setIlce("");
          }}
          className="mt-2 w-full rounded-lg border border-hair bg-card px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        >
          <option value="">Türkiye · tüm iller</option>
          {iller.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select
          value={ilce}
          onChange={(e) => setIlce(e.target.value)}
          className="mt-2 w-full rounded-lg border border-hair bg-card px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        >
          <option value="">İlçe · tümü</option>
          {ilceler.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {(il || ilce) && (
          <p className="mt-2 font-mono text-[11px] text-gray">
            Türkiye › {il || "…"}{ilce ? <> › <b className="text-teal-d">{ilce}</b></> : null}
          </p>
        )}

        <h4 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-gray">Daire Tipi</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIP_FILTRE.map((t) => (
            <button
              key={t}
              onClick={() => tipAcKapa(t)}
              className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors ${
                tip.includes(t) ? "border-navy bg-navy text-white" : "border-hair bg-card text-ink hover:border-teal"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <h4 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-gray">Durum</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {([
            ["", "Tümü"],
            ["musait", "Müsait"],
            ["opsiyon", "Opsiyonlu"],
          ] as const).map(([v, et]) => (
            <button
              key={v}
              onClick={() => setDurum(v)}
              className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors ${
                durum === v ? "border-navy bg-navy text-white" : "border-hair bg-card text-ink hover:border-teal"
              }`}
            >
              {et}
            </button>
          ))}
        </div>
      </aside>

      {/* ANA ALAN */}
      <div className="min-w-0 flex-1 px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">
              {il ? `${ilce || il} · Yetkili Projeler` : "Yetkili Projeler"}
            </h2>
            <p className="text-[13px] text-gray">
              {liste.length} proje · {toplamBirim} birim canlı
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
          {liste.map((p) => {
            const wa = `${p.ad} · ${[p.ilce, p.il].filter(Boolean).join(", ")}${p.min ? ` · ${fiyat(p.min)}₺'den` : ""}`;
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-hair bg-card shadow-card transition-shadow hover:shadow-cardlg"
              >
                {/* thumb — render görsel */}
                <Link href={`/havuz/proje/${p.id}`} className="relative block h-[150px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-soft via-teal-soft to-soft" />
                  <span className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold text-teal-d/25 select-none">
                    {p.ad.charAt(0).toUpperCase()}
                  </span>
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

                  <div className="my-2.5 flex flex-wrap gap-3 text-[12px] text-gray">
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-green align-middle" /><b className="text-ink">{p.musait}</b> müsait</span>
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-amber align-middle" /><b className="text-ink">{p.opsiyon}</b> opsiyon</span>
                    <span><span className="mr-1.5 inline-block size-2 rounded-full bg-red align-middle" /><b className="text-ink">{p.satildi}</b> satıldı</span>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[14.5px] font-medium text-ink">
                      {p.min != null ? `${fiyat(p.min)} – ${p.max != null ? fiyat(p.max) : ""} ₺` : "fiyat —"}
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
    </div>
  );
}
