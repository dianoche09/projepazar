import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  // Cron güvenliği
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 401 });
  }

  const supabase = createAdminClient();
  
  // 15 gün öncesinin tarihi
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 15);

  const { error } = await supabase
    .from("birim")
    .update({ stale: true })
    .lt("son_guncelleme", dateLimit.toISOString())
    .eq("stale", false);

  if (error) {
    console.error("Freshness cron hatası:", error);
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  return NextResponse.json({
    basarili: true,
    mesaj: "15 günden uzun süredir güncellenmeyen birimler 'stale' (bayat) olarak işaretlendi.",
  });
}
