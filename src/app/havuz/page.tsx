import { createClient } from "@/lib/supabase/server";
import { HavuzListe, type ProjeKart } from "./HavuzListe";

export default async function Havuz() {
  const supabase = await createClient();

  // RLS: proje_emlakci_select + birim_emlakci_select → yalnız tahsisli projeler/birimler
  const [{ data: projeler }, { data: birimler }, { data: tipler }, { data: kapaklar }] = await Promise.all([
    supabase
      .from("proje")
      .select("id, ad, il, ilce, mahalle, belge_dogrulandi, son_guncelleme, insaat_asamasi, ilerleme_yuzde, teslim_tarihi")
      .order("son_guncelleme", { ascending: false }),
    supabase.from("birim").select("proje_id, tip_id, durum, liste_fiyati"),
    supabase.from("daire_tipi").select("proje_id, oda, ad, net_m2"),
    supabase.from("proje_belge").select("proje_id, url").eq("tip", "kapak"),
  ]);
  const kapakMap = new Map((kapaklar ?? []).map((k) => [k.proje_id, k.url as string | null]));

  const kartlar: ProjeKart[] = (projeler ?? []).map((p) => {
    const bb = (birimler ?? []).filter((b) => b.proje_id === p.id);
    const fiyatlar = bb.map((b) => Number(b.liste_fiyati)).filter((f) => f > 0);
    const tipSet = [
      ...new Set(
        (tipler ?? [])
          .filter((t) => t.proje_id === p.id)
          .map((t) => `${t.oda ?? t.ad ?? ""}${t.net_m2 ? ` · ${t.net_m2}m²` : ""}`.trim())
          .filter(Boolean),
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
      teslim_tarihi: p.teslim_tarihi ?? null,
      toplam: bb.length,
      musait: bb.filter((b) => b.durum === "musait").length,
      opsiyon: bb.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length,
      satildi: bb.filter((b) => b.durum === "satildi").length,
      min: fiyatlar.length ? Math.min(...fiyatlar) : null,
      max: fiyatlar.length ? Math.max(...fiyatlar) : null,
      tipler: tipSet,
      kapak: kapakMap.get(p.id) ?? null,
    };
  });

  return <HavuzListe projeler={kartlar} />;
}
