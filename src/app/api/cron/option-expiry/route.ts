import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  // Cron güvenliği
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Kilit süresi geçmiş aktif opsiyonları sil (Trigger otomatik olarak birimleri 'musait' yapar ve son_guncelleme yeniler)
  const { error } = await supabase
    .from("opsiyon")
    .delete()
    .lt("kilit_bitis", new Date().toISOString())
    .in("durum", ["opsiyonlu", "satis_beklemede"]);

  if (error) {
    console.error("Opsiyon zaman aşımı cron hatası:", error);
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  return NextResponse.json({
    basarili: true,
    mesaj: "Süresi dolan opsiyon kilitleri temizlendi ve birimler otomatik olarak 'müsait' durumuna çekildi.",
  });
}
