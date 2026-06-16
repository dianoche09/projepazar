import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { HavuzListe, type ProjeKart } from "./HavuzListe";

export default async function Havuz() {
  const supabase = await createClient();

  // RLS: proje_emlakci_select + birim_emlakci_select → yalnız tahsisli projeler/birimler
  const [{ data: projeler }, { data: birimler }, { data: tipler }, { data: leads }] = await Promise.all([
    supabase
      .from("proje")
      .select("id, ad, il, ilce, mahalle, belge_dogrulandi, son_guncelleme, insaat_asamasi, ilerleme_yuzde")
      .order("son_guncelleme", { ascending: false }),
    supabase.from("birim").select("proje_id, tip_id, durum, liste_fiyati"),
    supabase.from("daire_tipi").select("proje_id, oda, ad"),
    // Emlakçının kendi linklerinden gelen sıcak lead'ler (Lead Protection)
    supabase
      .from("lead")
      .select("id, ad, telefon, durum, created_at, birim:birim_id(daire_no), proje:proje_id(ad)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const kartlar: ProjeKart[] = (projeler ?? []).map((p) => {
    const bb = (birimler ?? []).filter((b) => b.proje_id === p.id);
    const fiyatlar = bb.map((b) => Number(b.liste_fiyati)).filter((f) => f > 0);
    const tipSet = [
      ...new Set(
        (tipler ?? [])
          .filter((t) => t.proje_id === p.id)
          .map((t) => t.oda ?? t.ad)
          .filter(Boolean) as string[],
      ),
    ];
    return {
      id: p.id,
      ad: p.ad,
      il: p.il,
      ilce: p.ilce,
      mahalle: p.mahalle,
      belge_dogrulandi: p.belge_dogrulandi,
      son_guncelleme: p.son_guncelleme,
      insaat_asamasi: p.insaat_asamasi,
      ilerleme_yuzde: p.ilerleme_yuzde ?? 0,
      toplam: bb.length,
      musait: bb.filter((b) => b.durum === "musait").length,
      opsiyon: bb.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length,
      satildi: bb.filter((b) => b.durum === "satildi").length,
      min: fiyatlar.length ? Math.min(...fiyatlar) : null,
      max: fiyatlar.length ? Math.max(...fiyatlar) : null,
      tipler: tipSet,
    };
  });

  return (
    <>
      <HavuzListe projeler={kartlar} />

      {/* Paylaşımlarımdan gelen talepler (Lead Protection — getiren kazanır) */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="font-display text-lg font-semibold text-ink">Paylaşımlarımdan gelen talepler</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hair bg-card shadow-sm">
          {leads && leads.length > 0 ? (
            <div className="divide-y divide-hair">
              {leads.map((l) => {
                const proje = l.proje as { ad?: string } | null;
                const birim = l.birim as { daire_no?: string } | null;
                return (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm hover:bg-paper/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{l.ad}</span>
                        <span className="font-mono text-xs text-gray">{l.telefon}</span>
                      </div>
                      <p className="text-xs text-gray">
                        Proje: <span className="font-medium text-ink">{proje?.ad ?? "—"}</span> · Daire{" "}
                        {birim?.daire_no || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-teal">
                        {l.durum}
                      </span>
                      <span className="font-mono text-[10px] text-gray">{zamanOnce(l.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-gray">Paylaştığın linklerden henüz gelen bir talep yok.</p>
          )}
        </div>
      </div>
    </>
  );
}
