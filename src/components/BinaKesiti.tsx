import { BirimHucre } from "@/components/BirimHucre";
import { generateShareToken } from "@/lib/sharing";
import type { BirimDurum } from "@/lib/types";

type Birim = {
  id: string;
  blok_id: string | null;
  tip_id: string | null;
  kat: number | null;
  daire_no: string | null;
  durum: BirimDurum;
  liste_fiyati: number | null;
  para_birimi: string;
  satilabilir: boolean;
  net_m2: number | null;
  brut_m2: number | null;
  yon: string | null;
  manzara: string | null;
  serefiye: unknown;
  durum_notu: string | null;
  son_guncelleme: string;
};
type Tip = {
  id: string;
  ad: string | null;
  oda: string | null;
  taban_fiyat?: number | null;
  banyo?: number | null;
  balkon?: number | null;
  otopark?: string | null;
};
type Blok = { id: string; ad: string | null; kat_sayisi: number | null };

/**
 * Birim dizilimini DÜZ ızgara yerine gerçek BİNA KESİTİ olarak gösterir:
 * çatı + parapet → katlar (üstten alta, daireler durum-renkli birimler/pencereler) → zemin giriş (lobi+kapı) → kaldırım.
 * Katlara daire eklendikçe bina yükselir. Daireye tıkla → Daire MODAL.
 */
export function BinaKesiti({
  bloklar,
  birimler,
  tipler,
  mod = "uretici",
  projeId,
  projeAd = "",
  emlakciId,
  appUrl,
}: {
  bloklar: Blok[];
  birimler: Birim[];
  tipler: Tip[];
  mod?: "uretici" | "emlakci";
  projeId: string;
  projeAd?: string;
  emlakciId?: string;
  appUrl?: string;
}) {
  const tipMap = new Map(tipler.map((t) => [t.id, t]));
  const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-8">
      {bloklar.map((blok) => {
        const bb = birimler.filter((b) => b.blok_id === blok.id);
        const katlar = [...new Set(bb.map((b) => b.kat).filter((k): k is number => k != null))].sort(
          (a, b) => b - a,
        );

        return (
          <div key={blok.id}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">{blok.ad}</h3>
              <span className="font-mono text-xs text-gray">{bb.length} bağımsız bölüm</span>
            </div>

            {katlar.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hair bg-card/50 p-4 text-sm text-gray">
                Bu blokta henüz birim yok — generator ile üret.
              </p>
            ) : (
              <div className="mx-auto max-w-lg">
                {/* gökyüzü zemini */}
                <div className="rounded-t-2xl bg-gradient-to-b from-[#CFE5F1] to-[#EAF4F8] px-5 pt-4">
                  {/* çatı + parapet + teknik kat */}
                  <div className="relative mx-auto h-6 w-full max-w-[420px] rounded-t-md bg-[#243B50]">
                    <div className="absolute inset-x-3 top-1 h-1.5 rounded bg-[#33536E]" />
                    <div className="absolute left-1/2 top-[-7px] h-2.5 w-14 -translate-x-1/2 rounded-t bg-[#243B50]" />
                    <div className="absolute right-5 top-[-12px] h-3 w-1 bg-[#243B50]" />
                  </div>

                  {/* bina gövdesi — katlar */}
                  <div className="mx-auto w-full max-w-[420px] border-x-[5px] border-[#3A5670] bg-[#ECE6DC]">
                    {katlar.map((kat) => {
                      const kb = bb
                        .filter((b) => b.kat === kat)
                        .sort((a, b) => (a.daire_no ?? "").localeCompare(b.daire_no ?? ""));
                      return (
                        <div
                          key={kat}
                          className="flex items-center gap-2 border-b border-[#D2CABD] px-2.5 py-2 last:border-b-0"
                        >
                          <span className="w-7 shrink-0 text-right font-mono text-[10px] font-medium text-[#7A8893]">
                            {kat}.
                          </span>
                          <div className="flex flex-1 flex-wrap gap-1.5">
                            {kb.map((b) => {
                              const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
                              const shareUrl = emlakciId
                                ? `${base}/p/${emlakciId}/${b.id}/${generateShareToken(emlakciId, b.id)}`
                                : "";
                              return (
                                <BirimHucre
                                  key={b.id}
                                  projeId={projeId}
                                  mod={mod}
                                  projeAd={projeAd}
                                  shareUrl={shareUrl}
                                  birim={{
                                    id: b.id,
                                    daire_no: b.daire_no,
                                    kat: b.kat,
                                    durum: b.durum,
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
                                    banyo: tip?.banyo ?? null,
                                    balkon: tip?.balkon ?? null,
                                    otopark: tip?.otopark ?? null,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* zemin kat / giriş lobisi */}
                    <div className="relative flex h-12 items-end justify-center gap-2 border-t-2 border-[#D2CABD] bg-[#E3DCD0] px-3 pb-0">
                      <div className="absolute bottom-2 left-3 h-6 w-7 rounded-t-sm bg-[#A9D4E6]" />
                      <div className="h-9 w-12 rounded-t-md bg-[#243B50]" />
                      <div className="absolute bottom-2 right-3 h-6 w-7 rounded-t-sm bg-[#A9D4E6]" />
                    </div>
                  </div>

                  {/* kaldırım / çim */}
                  <div className="mx-auto h-3 w-full max-w-[460px] rounded-b-2xl bg-[#CDE7D4]" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
