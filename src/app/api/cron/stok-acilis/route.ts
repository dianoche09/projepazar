import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Kademeli/planlı açılım cron'u (MVP-1).
 * Açılış tarihi (satisa_acilis) gelmiş `planli` birimleri `musait` yapar.
 * - Yalnız satilabilir=true birimler açılır (arsa sahibi payı kalıcı kapalı kalır).
 * - DEĞİŞMEZ #5: yazışta son_guncelleme=now() + stale temizlenir (taze, canlı stok).
 */
export async function GET(request: Request) {
  // Cron güvenliği
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const simdi = new Date().toISOString();

  const { data, error } = await supabase
    .from("birim")
    .update({ durum: "musait", son_guncelleme: simdi, stale: false })
    .eq("durum", "planli")
    .eq("satilabilir", true)
    .not("satisa_acilis", "is", null)
    .lte("satisa_acilis", simdi)
    .select("id");

  if (error) {
    console.error("Stok açılış cron hatası:", error);
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  const acilan = data?.length ?? 0;
  return NextResponse.json({
    basarili: true,
    acilan,
    mesaj: `Açılış tarihi gelen ${acilan} planlı birim 'müsait' durumuna alındı.`,
  });
}
