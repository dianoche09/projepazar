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
  toplam: number;
  musait: number;
  opsiyon: number;
  satildi: number;
  min: number | null;
  max: number | null;
  tipler: string[];
};

const ASAMA: Record<string, string> = {
  planlama: "Planlama",
  temel: "Temel",
  kaba_insaat: "Kaba inşaat",
  ince_insaat: "İnce inşaat",
  cevre_duzenleme: "Çevre düzenleme",
  tamamlandi: "Tamamlandı",
};

function fiyat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}B`;
  return n.toLocaleString("tr-TR");
}

/** Premium emlakçı havuzu — sol filtre + görselli proje kartları (Berrak Güven). */
export function HavuzListe({ projeler }: { projeler: ProjeKart[] }) {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
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
        (durum === "" || (durum === "musait" ? p.musait > 0 : p.opsiyon > 0)),
    );
    return [...l].sort((a, b) => {
      if (sirala === "ucuz") return (a.min ?? Infinity) - (b.min ?? Infinity);
      if (sirala === "musait") return b.musait - a.musait;
      return b.son_guncelleme.localeCompare(a.son_guncelleme);
    });
  }, [projeler, il, ilce, durum, sirala]);

  const toplamMusait = projeler.reduce((t, p) => t + p.musait, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Havuz</h1>
          <p className="mt-1 text-sm text-gray">
            Sana tahsisli <span className="font-medium text-ink">{projeler.length} proje</span> ·{" "}
            <span className="font-medium text-green">{toplamMusait} müsait birim</span> · tek canlı kaynak
          </p>
        </div>
        <select
          value={sirala}
          onChange={(e) => setSirala(e.target.value as typeof sirala)}
          className="rounded-xl border border-hair bg-card px-3 py-2 text-sm text-ink shadow-sm outline-none focus:border-teal"
        >
          <option value="taze">En taze</option>
          <option value="musait">En çok müsait</option>
          <option value="ucuz">En uygun fiyat</option>
        </select>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-6 md:self-start">
          <div className="space-y-4 rounded-2xl border border-hair bg-card p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray">İl</p>
              <select
                value={il}
                onChange={(e) => {
                  setIl(e.target.value);
                  setIlce("");
                }}
                className="mt-1.5 w-full rounded-lg border border-hair bg-paper px-2.5 py-2 text-sm text-ink outline-none focus:border-teal"
              >
                <option value="">Tümü</option>
                {iller.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray">İlçe</p>
              <select
                value={ilce}
                onChange={(e) => setIlce(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hair bg-paper px-2.5 py-2 text-sm text-ink outline-none focus:border-teal"
              >
                <option value="">Tümü</option>
                {ilceler.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray">Durum</p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {([
                  ["", "Tümü"],
                  ["musait", "Müsait var"],
                  ["opsiyon", "Opsiyonlu var"],
                ] as const).map(([v, et]) => (
                  <button
                    key={v}
                    onClick={() => setDurum(v)}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                      durum === v ? "bg-navy text-white" : "text-navy hover:bg-paper"
                    }`}
                  >
                    {et}
                  </button>
                ))}
              </div>
            </div>
            {(il || ilce || durum) && (
              <button
                onClick={() => {
                  setIl("");
                  setIlce("");
                  setDurum("");
                }}
                className="text-xs font-medium text-teal hover:underline"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        </aside>

        <div className="grid gap-5 sm:grid-cols-2">
          {liste.map((p) => {
            const yuzde = (n: number) => (p.toplam ? (n / p.toplam) * 100 : 0);
            const waMetni = `${p.ad} · ${[p.ilce, p.il].filter(Boolean).join(", ")} · ${p.min ? fiyat(p.min) + "₺'den" : ""}`;
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-hair bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/havuz/proje/${p.id}`}
                  className="relative block h-36 overflow-hidden bg-gradient-to-br from-navy via-navy to-teal"
                >
                  <svg
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    className="absolute bottom-0 left-0 h-20 w-full text-white/10"
                    fill="currentColor"
                  >
                    <rect x="6" y="14" width="12" height="26" />
                    <rect x="22" y="6" width="14" height="34" />
                    <rect x="40" y="18" width="10" height="22" />
                    <rect x="54" y="10" width="16" height="30" />
                    <rect x="74" y="20" width="10" height="20" />
                    <rect x="88" y="12" width="10" height="28" />
                  </svg>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-green" />
                    </span>
                    {zamanOnce(p.son_guncelleme)}
                  </span>
                  {p.belge_dogrulandi && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-teal shadow-sm">
                      ✓ Doğrulanmış
                    </span>
                  )}
                  <div className="absolute inset-x-3 bottom-3">
                    <h3 className="font-display text-lg font-semibold leading-tight text-white drop-shadow">{p.ad}</h3>
                    <p className="text-xs text-white/85">
                      {[p.mahalle, p.ilce, p.il].filter(Boolean).join(", ") || "—"} · {ASAMA[p.insaat_asamasi] ?? ""}
                    </p>
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex h-2 overflow-hidden rounded-full bg-hair">
                    <div className="bg-green" style={{ width: `${yuzde(p.musait)}%` }} />
                    <div className="bg-amber" style={{ width: `${yuzde(p.opsiyon)}%` }} />
                    <div className="bg-red" style={{ width: `${yuzde(p.satildi)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs text-gray">
                    <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-green" />{p.musait}</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-amber" />{p.opsiyon}</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-red" />{p.satildi}</span>
                  </div>

                  {p.tipler.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tipler.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-md bg-paper px-2 py-0.5 text-xs font-medium text-navy">{t}</span>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 font-mono text-lg font-semibold text-ink">
                    {p.min != null ? (
                      <>
                        {fiyat(p.min)}
                        <span className="text-sm font-normal text-gray"> – {p.max != null ? fiyat(p.max) : ""} ₺</span>
                      </>
                    ) : (
                      <span className="text-base font-normal text-gray">fiyat —</span>
                    )}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/havuz/proje/${p.id}`}
                      className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-ink"
                    >
                      İncele
                    </Link>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(waMetni)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-green px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Paylaş
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {liste.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-hair bg-card/50 p-10 text-center">
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
