import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tahsis danışman ARAMA + SEGMENT sayımı (ölçeklenebilir).
 * Filtreler: q (isim) · marka · il · ilce · uzmanlik. Dönen: { sonuc: top-20, toplam: eşleşen sayısı }.
 * - Segment önizleme: yalnız filtrelerle çağır → toplam'ı kullan ("N danışmana açılacak").
 * - Belirli danışman: q (+filtre) ile çağır → sonuc listesi.
 * profiles_self RLS engellediğinden admin client (server-only, DEĞİŞMEZ #1). Guard: üretici/admin.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sonuc: [], toplam: 0 }, { status: 401 });

  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (!profil || !["uretici", "admin"].includes(profil.rol as string)) {
    return NextResponse.json({ sonuc: [], toplam: 0 }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const marka = (sp.get("marka") ?? "").trim();
  const il = (sp.get("il") ?? "").trim();
  const ilce = (sp.get("ilce") ?? "").trim();
  const uzmanlik = (sp.get("uzmanlik") ?? "").trim();
  const sayim = sp.get("sayim") === "1";

  // En az bir kriter olmadan tüm listeyi dökme (ölçeklenme).
  if (q.length < 2 && !marka && !il && !ilce && !uzmanlik) {
    return NextResponse.json({ sonuc: [], toplam: 0 });
  }

  const admin = createAdminClient();
  const filtrele = () => {
    let qb = admin.from("profiles").select("id, ad, ofis_id", { count: "exact" }).eq("rol", "emlakci").eq("durum", "aktif");
    if (q.length >= 2) qb = qb.ilike("ad", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    if (marka) qb = qb.eq("marka", marka);
    if (il) qb = qb.eq("il", il);
    if (ilce) qb = qb.eq("ilce", ilce);
    if (uzmanlik) qb = qb.eq("uzmanlik", uzmanlik);
    return qb;
  };

  // Sadece sayım (segment önizleme) — liste çekme.
  if (sayim) {
    const { count } = await filtrele().limit(1);
    return NextResponse.json({ sonuc: [], toplam: count ?? 0 });
  }

  const { data: prof, count } = await filtrele().order("ad").limit(20);
  const ofisIds = [...new Set((prof ?? []).map((p) => p.ofis_id).filter(Boolean) as string[])];
  const { data: ofisler } = ofisIds.length
    ? await admin.from("ofis").select("id, ad").in("id", ofisIds)
    : { data: [] as { id: string; ad: string }[] };
  const ofisAd = new Map((ofisler ?? []).map((o) => [o.id as string, o.ad as string]));

  const sonuc = (prof ?? []).map((p) => ({
    id: p.id as string,
    ad: (p.ad as string | null) ?? "Danışman",
    ofis: p.ofis_id ? ofisAd.get(p.ofis_id as string) ?? null : null,
  }));
  return NextResponse.json({ sonuc, toplam: count ?? sonuc.length });
}
