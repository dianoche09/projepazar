import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paraKisa } from "@/lib/stok";
import { simdiMs } from "@/lib/zaman";

/* =========================================================
   DİNAMİK FİYAT ÖNERİSİ — events talep sinyalinden fiyat nudge'u.
   Her müsait birim, benzer birimlere (aynı proje+tip) göre talep skoruyla kıyaslanır:
   talep belirgin yüksek → fiyat artırılabilir; düşük + uzun süredir müsait → gözden geçir.
   ÖNERİ-only: fiyatı değiştirmez (DEĞİŞMEZ #2 — tek doğru kaynak, insan onaylı).
   ========================================================= */

const AGIRLIK: Record<string, number> = { opsiyon: 5, lead: 4, paylasim: 2, favori: 2, goruntuleme: 1 };
const PENCERE_GUN = 30;

function medyan(sayilar: number[]): number {
  if (!sayilar.length) return 0;
  const s = [...sayilar].sort((a, b) => a - b);
  const o = Math.floor(s.length / 2);
  return s.length % 2 ? s[o] : (s[o - 1] + s[o]) / 2;
}

type Oneri = {
  yon: "artir" | "dusur" | "sabit";
  pct: number;
  yeniFiyat: number | null;
  gerekce: string;
};

function oneriHesapla(demand: number, peerMedyan: number, peerSay: number, gunFark: number, fiyat: number | null): Oneri {
  // Yeterli benzer yoksa güçlü öneri verme
  if (peerSay >= 2 && demand > 0 && demand >= peerMedyan * 1.5) {
    const oran = demand / Math.max(peerMedyan, 1);
    const pct = Math.min(8, Math.max(2, Math.round((oran - 1) * 3)));
    return {
      yon: "artir",
      pct,
      yeniFiyat: fiyat != null ? Math.round((fiyat * (1 + pct / 100)) / 1000) * 1000 : null,
      gerekce: `Talep benzerlerin ${oran.toFixed(1)}× üstünde — muhtemelen düşük fiyatlı`,
    };
  }
  if (gunFark > 21 && (peerSay < 2 || demand <= peerMedyan * 0.5)) {
    const pct = -3;
    return {
      yon: "dusur",
      pct,
      yeniFiyat: fiyat != null ? Math.round((fiyat * (1 + pct / 100)) / 1000) * 1000 : null,
      gerekce: `${Math.round(gunFark)} gündür müsait, ilgi düşük — fiyat/öne çıkarma gözden geçir`,
    };
  }
  return { yon: "sabit", pct: 0, yeniFiyat: null, gerekce: "Talep dengeli — değişiklik önerilmiyor" };
}

export default async function FiyatOnerisi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: projeler } = await supabase.from("proje").select("id, ad").eq("uretici_id", user.id);
  const projeAd = new Map((projeler ?? []).map((p) => [p.id as string, p.ad as string]));
  const projeIds = (projeler ?? []).map((p) => p.id as string);

  const admin = createAdminClient();
  const [{ data: birimRaw }, { data: tipler }, { data: eventRaw }] = projeIds.length
    ? await Promise.all([
        admin
          .from("birim")
          .select("id, proje_id, tip_id, daire_no, kat, liste_fiyati, para_birimi, son_guncelleme")
          .in("proje_id", projeIds)
          .eq("durum", "musait")
          .eq("satilabilir", true),
        admin.from("daire_tipi").select("id, ad, oda").in("proje_id", projeIds),
        admin
          .from("events")
          .select("birim_id, tip")
          .in("proje_id", projeIds)
          .not("birim_id", "is", null)
          .gte("created_at", new Date(simdiMs() - PENCERE_GUN * 86_400_000).toISOString()),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const birimler = (birimRaw ?? []) as {
    id: string;
    proje_id: string;
    tip_id: string | null;
    daire_no: string | null;
    kat: number | null;
    liste_fiyati: number | null;
    para_birimi: string | null;
    son_guncelleme: string | null;
  }[];
  const tipAd = new Map((tipler ?? []).map((t) => [t.id as string, (t.oda as string | null) ?? (t.ad as string | null)]));

  // Birim başı talep skoru + kırılım
  const skor = new Map<string, number>();
  const kirilim = new Map<string, Record<string, number>>();
  for (const e of (eventRaw ?? []) as { birim_id: string; tip: string }[]) {
    skor.set(e.birim_id, (skor.get(e.birim_id) ?? 0) + (AGIRLIK[e.tip] ?? 0));
    const k = kirilim.get(e.birim_id) ?? {};
    k[e.tip] = (k[e.tip] ?? 0) + 1;
    kirilim.set(e.birim_id, k);
  }

  // Benzer grup = aynı proje + aynı tip → talep medyanı
  const grupSkorlari = new Map<string, number[]>();
  for (const b of birimler) {
    const g = `${b.proje_id}|${b.tip_id ?? "-"}`;
    const arr = grupSkorlari.get(g) ?? [];
    arr.push(skor.get(b.id) ?? 0);
    grupSkorlari.set(g, arr);
  }

  const simdi = simdiMs();
  const satirlar = birimler
    .map((b) => {
      const grup = grupSkorlari.get(`${b.proje_id}|${b.tip_id ?? "-"}`) ?? [];
      const demand = skor.get(b.id) ?? 0;
      const peerMedyan = medyan(grup);
      const gunFark = b.son_guncelleme ? (simdi - new Date(b.son_guncelleme).getTime()) / 86_400_000 : 999;
      const oneri = oneriHesapla(demand, peerMedyan, grup.length, gunFark, b.liste_fiyati);
      return { b, demand, kir: kirilim.get(b.id) ?? {}, oneri };
    })
    // Önce eyleme değer öneriler (artır/düşür), talebe göre
    .sort((x, y) => {
      const puan = (s: typeof x) => (s.oneri.yon === "sabit" ? 0 : 1);
      return puan(y) - puan(x) || y.demand - x.demand;
    });

  const eylemli = satirlar.filter((s) => s.oneri.yon !== "sabit").length;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <header className="belir mb-5">
        <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Dinamik Fiyat Önerisi</h1>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Son {PENCERE_GUN} günün talep sinyaliyle (görüntüleme · paylaşım · lead · opsiyon) her müsait birim benzerlerine
          kıyaslanır. <span className="font-medium text-ink">Öneridir — fiyatı sen değiştirirsin.</span>
        </p>
      </header>

      {satirlar.length === 0 ? (
        <p className="kart p-10 text-center text-sm text-[var(--ink-faint)]">
          Müsait birim veya yeterli talep verisi yok. Paylaşım/görüntüleme biriktikçe öneriler oluşur.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">{eylemli}</span> birimde fiyat aksiyonu öneriliyor ·{" "}
            <span className="text-[var(--ink-faint)]">{satirlar.length} müsait birim tarandı</span>
          </p>
          <div className="kart overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Proje · Daire</th>
                    <th>Tip</th>
                    <th className="text-right">Fiyat</th>
                    <th className="text-right">Talep</th>
                    <th>Sinyal (30g)</th>
                    <th>Öneri</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {satirlar.map(({ b, demand, kir, oneri }) => (
                    <tr key={b.id}>
                      <td>
                        <span className="block text-[12.5px] font-medium text-ink">{projeAd.get(b.proje_id) ?? "—"}</span>
                        <span className="mono text-[11px] text-gray">Daire {b.daire_no ?? "—"}{b.kat != null ? ` · K${b.kat}` : ""}</span>
                      </td>
                      <td className="text-[12.5px] text-ink-soft">{tipAd.get(b.tip_id ?? "") ?? "—"}</td>
                      <td className="mono text-right font-semibold">
                        {b.liste_fiyati ? paraKisa(b.liste_fiyati, b.para_birimi) : "—"}
                      </td>
                      <td className="mono text-right font-semibold text-ink">{demand}</td>
                      <td>
                        <span className="mono text-[11px] text-gray">
                          {[
                            kir.goruntuleme ? `${kir.goruntuleme}👁` : null,
                            kir.paylasim ? `${kir.paylasim}↗` : null,
                            kir.lead ? `${kir.lead}☎` : null,
                            kir.opsiyon ? `${kir.opsiyon}◷` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </td>
                      <td>
                        {oneri.yon === "sabit" ? (
                          <span className="text-[12px] text-[var(--ink-faint)]">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`rozet ${oneri.yon === "artir" ? "bg-green-soft text-teal-d" : "bg-amber-soft text-amber"}`}
                            >
                              {oneri.pct > 0 ? "+" : ""}{oneri.pct}%
                              {oneri.yeniFiyat != null ? ` → ${paraKisa(oneri.yeniFiyat, b.para_birimi)}` : ""}
                            </span>
                            <span className="text-[11px] leading-snug text-gray">{oneri.gerekce}</span>
                          </div>
                        )}
                      </td>
                      <td className="!text-right">
                        <Link
                          href={`/uretici/proje/${b.proje_id}`}
                          className="rounded-lg border border-hair bg-card px-2.5 py-1.5 text-xs font-semibold text-teal-d transition-colors hover:border-teal"
                        >
                          Fiyatı yönet →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
            Not: öneriler talep sinyalinin göreli yoğunluğuna dayanır (Endeksa/rayiç değil). Nihai fiyat kararı sende.
          </p>
        </>
      )}
    </div>
  );
}
