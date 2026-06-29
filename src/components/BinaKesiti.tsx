import { BirimHucre } from "@/components/BirimHucre";
import type { BirimDurum } from "@/lib/types";

export type BinaBirim = {
  id: string;
  blok_id: string | null;
  tip_id: string | null;
  kat: number | null;
  daire_no: string | null;
  durum: string;
  liste_fiyati: number | null;
  para_birimi: string;
  satilabilir: boolean;
  net_m2: number | null;
  brut_m2: number | null;
  yon: string | null;
  manzara: string | null;
  serefiye: unknown;
  odeme_plani?: unknown;
  durum_notu: string | null;
  son_guncelleme: string;
};
type Tip = {
  id: string;
  ad: string | null;
  oda: string | null;
  taban_fiyat?: number | null;
  plan_url?: string | null;
};
type Blok = { id: string; ad: string | null; kat_sayisi: number | null };

/**
 * BİNA KESİTİ — sistemin İMZA öğesi (v2 spatial "komuta şeması").
 * Her blok bir kart: navy blueprint çerçevede üstten alta katlar, durum-renkli
 * daire hücreleri (tıkla → DaireModal), zemin giriş. Seçim modu (SecimDuzenle) korunur.
 */
export function BinaKesiti({
  bloklar,
  birimler,
  tipler,
  mod = "uretici",
  projeId,
  projeAd = "",
  shareUrlMap,
  benimOpsiyonlar,
}: {
  bloklar: Blok[];
  birimler: BinaBirim[];
  tipler: Tip[];
  mod?: "uretici" | "emlakci";
  projeId: string;
  projeAd?: string;
  shareUrlMap?: Record<string, string>;
  /** Emlakçı modu: bu emlakçıya ait opsiyonlu birim id'leri (bırak butonu için). */
  benimOpsiyonlar?: string[];
}) {
  const tipMap = new Map(tipler.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      {bloklar.map((blok) => {
        const bb = birimler.filter((b) => b.blok_id === blok.id);
        const katlar = [...new Set(bb.map((b) => b.kat).filter((k): k is number => k != null))].sort(
          (a, b) => b - a,
        );
        const musait = bb.filter((b) => b.durum === "musait").length;
        const opsiyon = bb.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
        const satildi = bb.filter((b) => b.durum === "satildi").length;

        return (
          <div key={blok.id} className="kart overflow-hidden">
            {/* blok başlık + lejant */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cizgi)] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display text-[15px] font-bold text-ink">{blok.ad} Blok</h3>
                <span className="mono rounded-md bg-navy-soft px-2 py-[2px] text-[11px] text-ink-soft">
                  {bb.length} bağımsız bölüm
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] font-medium text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-green" />
                  {musait}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber" />
                  {opsiyon}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red" />
                  {satildi}
                </span>
              </div>
            </div>

            {katlar.length === 0 ? (
              <p className="m-5 rounded-xl border border-dashed border-hair bg-soft p-5 text-sm text-[var(--ink-faint)]">
                Bu blokta henüz birim yok — kurulumdan üret.
              </p>
            ) : (
              <div className="relative overflow-hidden bg-gradient-to-b from-navy to-ink p-5">
                {/* blueprint ızgara dokusu */}
                <div className="izgara-doku pointer-events-none absolute inset-0 opacity-40" aria-hidden />

                <div className="relative mx-auto w-full max-w-[560px]">
                  {/* çatı */}
                  <div className="mx-auto h-3 w-[calc(100%-28px)] rounded-t-lg bg-teal/80" />
                  <div className="mx-auto -mt-px h-2 w-[calc(100%-56px)] rounded-t bg-teal/40" />

                  {/* gövde — katlar (cam panel) */}
                  <div className="overflow-hidden rounded-b-xl border border-white/10 bg-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,.35)] backdrop-blur-sm">
                    {katlar.map((kat) => {
                      const kb = bb
                        .filter((b) => b.kat === kat)
                        .sort((a, b) => (a.daire_no ?? "").localeCompare(b.daire_no ?? ""));
                      return (
                        <div
                          key={kat}
                          className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2 last:border-b-0"
                        >
                          <span className="w-8 shrink-0 text-right font-mono text-[10px] font-semibold text-white/45">
                            K{kat}
                          </span>
                          <div className="flex flex-1 flex-wrap gap-1.5">
                            {kb.map((b) => {
                              const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
                              const shareUrl = shareUrlMap?.[b.id] ?? "";
                              return (
                                <BirimHucre
                                  key={b.id}
                                  projeId={projeId}
                                  mod={mod}
                                  projeAd={projeAd}
                                  shareUrl={shareUrl}
                                  benimOpsiyon={benimOpsiyonlar?.includes(b.id) ?? false}
                                  birim={{
                                    id: b.id,
                                    daire_no: b.daire_no,
                                    kat: b.kat,
                                    durum: b.durum as BirimDurum,
                                    satilabilir: b.satilabilir,
                                    liste_fiyati: b.liste_fiyati,
                                    para_birimi: b.para_birimi,
                                    net_m2: b.net_m2,
                                    brut_m2: b.brut_m2,
                                    yon: b.yon,
                                    manzara: b.manzara,
                                    durum_notu: b.durum_notu,
                                    son_guncelleme: b.son_guncelleme,
                                    serefiye: b.serefiye as { kat?: number; manzara?: number } | null,
                                    taban_fiyat: tip?.taban_fiyat ?? null,
                                    tip_ad: tip?.ad ?? null,
                                    oda: tip?.oda ?? null,
                                    plan_url: tip?.plan_url ?? null,
                                    odeme_plani: b.odeme_plani as {
                                      pesinat_pct?: number | null;
                                      taksit_sayisi?: number | null;
                                      vade_farki_pct?: number | null;
                                      ara_odemeler?: { ay: number; pct: number }[] | null;
                                    } | null,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* zemin giriş / lobi */}
                    <div className="flex items-center gap-2.5 border-t border-white/10 bg-white/[0.02] px-3.5 py-2.5">
                      <span className="w-8 shrink-0 text-right font-mono text-[10px] font-semibold text-white/45">
                        Z
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <span className="h-6 flex-1 rounded bg-white/[0.05]" />
                        <span className="rounded-md bg-teal/25 px-3 py-1 font-mono text-[10px] font-semibold tracking-wide text-white/85">
                          GİRİŞ
                        </span>
                        <span className="h-6 flex-1 rounded bg-white/[0.05]" />
                      </div>
                    </div>
                  </div>

                  {/* zemin çizgisi / kaldırım */}
                  <div className="mx-auto mt-px h-1.5 w-full rounded-b bg-black/25" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
