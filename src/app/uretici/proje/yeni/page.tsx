import { createClient } from "@/lib/supabase/server";
import {
  ProjeWizard,
  type WizardProje,
  type WizardBlok,
  type WizardTip,
  type WizardBelge,
  type WizardOfis,
} from "./ProjeWizard";

/**
 * Müteahhit yeni-proje SİHİRBAZI (7 adım). Tek route, ?id + ?adim query ile state.
 * - Proje yoksa: yalnız adım 1 (projeOlustur). Oluşunca ?id=X&adim=2'ye döner.
 * - Proje varsa: tüm adımlar düzenlenebilir; her adım mevcut server action'la kaydeder.
 * - Düzenleme yüzeyi olarak /uretici/proje/[id]/kurulum KALIR (sonradan tahsis/fiyat oradan).
 */
export default async function YeniProje({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; adim?: string; hata?: string; mesaj?: string }>;
}) {
  const { id, adim, hata, mesaj } = await searchParams;
  const adimNo = Math.min(7, Math.max(1, Number(adim) || 1));

  // Proje yoksa boş wizard (adım 1 = projeOlustur).
  if (!id) {
    return <ProjeWizard adim={1} proje={null} bloklar={[]} tipler={[]} birimSayisi={0} belgeler={[]} ofisler={[]} hata={hata} mesaj={mesaj} />;
  }

  const supabase = await createClient();
  const { data: projeRaw } = await supabase.from("proje").select("*").eq("id", id).single();

  // Proje bulunamadı (silinmiş / yetkisiz) → adım 1'e düş.
  if (!projeRaw) {
    return <ProjeWizard adim={1} proje={null} bloklar={[]} tipler={[]} birimSayisi={0} belgeler={[]} ofisler={[]} hata="Proje bulunamadı." mesaj={undefined} />;
  }

  const [{ data: bloklar }, { data: tipler }, { count: birimSayisi }, { data: belgeler }, { data: ofisler }] =
    await Promise.all([
      supabase.from("blok").select("id, ad, kat_sayisi").eq("proje_id", id).order("ad"),
      supabase
        .from("daire_tipi")
        .select("id, ad, oda, net_m2, taban_fiyat")
        .eq("proje_id", id)
        .order("ad"),
      supabase.from("birim").select("id", { count: "exact", head: true }).eq("proje_id", id),
      supabase
        .from("proje_belge")
        .select("id, tip, ad, url")
        .eq("proje_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("ofis").select("id, ad").order("ad"),
    ]);

  const proje: WizardProje = {
    id: projeRaw.id,
    ad: projeRaw.ad,
    il: projeRaw.il,
    ilce: projeRaw.ilce,
    mahalle: projeRaw.mahalle,
    ada: projeRaw.ada,
    parsel: projeRaw.parsel,
    emsal: projeRaw.emsal,
    taks: projeRaw.taks,
    baslama_tarihi: projeRaw.baslama_tarihi,
    teslim_tarihi: projeRaw.teslim_tarihi,
    insaat_asamasi: projeRaw.insaat_asamasi,
    para_birimi: projeRaw.para_birimi,
    kira_getirisi_pct: projeRaw.kira_getirisi_pct,
    amortisman_yil: projeRaw.amortisman_yil,
    kunye: (projeRaw.kunye ?? {}) as Record<string, unknown>,
  };

  return (
    <ProjeWizard
      adim={adimNo}
      proje={proje}
      bloklar={(bloklar ?? []) as WizardBlok[]}
      tipler={(tipler ?? []) as WizardTip[]}
      birimSayisi={birimSayisi ?? 0}
      belgeler={(belgeler ?? []) as WizardBelge[]}
      ofisler={(ofisler ?? []) as WizardOfis[]}
      hata={hata}
      mesaj={mesaj}
    />
  );
}
