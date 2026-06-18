import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kayitlarYaz } from "@/lib/events";

type DolanOpsiyon = {
  id: string;
  birim_id: string;
  satici_id: string;
  birim: { proje_id: string } | { proje_id: string }[] | null;
};

function projeIdCoz(b: DolanOpsiyon["birim"]): string | null {
  if (!b) return null;
  return Array.isArray(b) ? b[0]?.proje_id ?? null : b.proje_id ?? null;
}

export async function GET(request: Request) {
  // Cron güvenliği
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const simdi = new Date().toISOString();

  // Süresi dolan aktif opsiyonları önce çek (audit için), sonra sil.
  const { data: dolanlar, error: secErr } = await supabase
    .from("opsiyon")
    .select("id, birim_id, satici_id, birim:birim_id(proje_id)")
    .lt("kilit_bitis", simdi)
    .in("durum", ["opsiyonlu", "satis_beklemede"]);

  if (secErr) {
    console.error("Opsiyon süre aşımı (seçim) cron hatası:", secErr);
    return NextResponse.json({ hata: secErr.message }, { status: 500 });
  }

  const liste = (dolanlar ?? []) as DolanOpsiyon[];
  if (liste.length === 0) {
    return NextResponse.json({ basarili: true, temizlenen: 0, mesaj: "Süresi dolan opsiyon yok." });
  }

  // Sil (Trigger otomatik olarak birimleri 'musait' yapar ve son_guncelleme yeniler).
  const { error } = await supabase
    .from("opsiyon")
    .delete()
    .in(
      "id",
      liste.map((o) => o.id),
    );

  if (error) {
    console.error("Opsiyon zaman aşımı cron hatası:", error);
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  // Audit (MVP-17): süre dolması = otomatik iptal
  await kayitlarYaz(
    liste.map((o) => ({
      tip: "opsiyon" as const,
      profileId: o.satici_id,
      projeId: projeIdCoz(o.birim),
      birimId: o.birim_id,
      payload: { eylem: "sure_doldu" },
    })),
  );

  return NextResponse.json({
    basarili: true,
    temizlenen: liste.length,
    mesaj: `Süresi dolan ${liste.length} opsiyon temizlendi; birimler otomatik 'müsait' (trigger).`,
  });
}
