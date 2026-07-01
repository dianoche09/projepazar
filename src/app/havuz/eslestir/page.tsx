import { createClient } from "@/lib/supabase/server";
import { Eslestirici, type EslesBirim } from "./Eslestirici";

/* =========================================================
   MÜŞTERİ EŞLEŞTİRME — emlakçının TAHSİSLİ havuzu üzerinde müşteri kriteriyle en-uygun birimi bul.
   RLS zaten yalnız tahsisli birimleri döndürür; kriter filtre + fit-skor sıralaması client'ta (anlık).
   Not: doğal-dil girişi + semantik sıralama (embedding/LLM) Faz-2. Bu çekirdek yapılandırılmış eşleştirme.
   ========================================================= */

export default async function EslestirSayfasi() {
  const supabase = await createClient();
  // RLS: emlakçı yalnız tahsisli + satılabilir müsait birimleri görür. Eklentiler (ana_birim_id) hariç.
  const { data } = await supabase
    .from("birim")
    .select(
      `id, daire_no, kat, liste_fiyati, para_birimi, net_m2, brut_m2, yon, ana_birim_id,
       proje:proje_id ( id, ad, il, ilce ),
       tip:tip_id ( oda, ad )`,
    )
    .eq("durum", "musait")
    .eq("satilabilir", true);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const birimler: EslesBirim[] = ((data ?? []) as any[])
    .filter((b) => b.ana_birim_id == null)
    .map((b) => ({
      id: b.id,
      daire_no: b.daire_no,
      kat: b.kat,
      liste_fiyati: b.liste_fiyati,
      para_birimi: b.para_birimi ?? "TRY",
      net_m2: b.net_m2,
      brut_m2: b.brut_m2,
      yon: b.yon,
      proje_id: b.proje?.id ?? "",
      proje_ad: b.proje?.ad ?? null,
      il: b.proje?.il ?? null,
      ilce: b.proje?.ilce ?? null,
      oda: b.tip?.oda ?? null,
      tip_ad: b.tip?.ad ?? null,
    }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return <Eslestirici birimler={birimler} />;
}
