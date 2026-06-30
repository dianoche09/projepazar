import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tahsis için danışman ARAMA (ölçeklenebilir — binlerce emlakçıda checkbox listesi yerine).
 * profiles_self RLS üreticinin emlakçıları listelemesini engeller → admin client (server-only, DEĞİŞMEZ #1).
 * Guard: yalnız oturum açmış üretici/admin. İsimle arar, en fazla 20 sonuç, sadece id/ad/ofis (PII yok).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sonuc: [] }, { status: 401 });

  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (!profil || !["uretici", "admin"].includes(profil.rol as string)) {
    return NextResponse.json({ sonuc: [] }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ sonuc: [] });
  const guvenli = q.replace(/[%_\\]/g, "\\$&"); // ilike joker karakterlerini kaçır

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("id, ad, ofis_id")
    .eq("rol", "emlakci")
    .eq("durum", "aktif")
    .ilike("ad", `%${guvenli}%`)
    .order("ad")
    .limit(20);

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
  return NextResponse.json({ sonuc });
}
