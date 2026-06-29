import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyShareToken } from "@/lib/sharing";

/**
 * Mikrosite anonim etkileşim sinyali (favori vb.) → events.
 * Müşteri kimliği/PII YOK; yalnız "bu birim bu danışman linkinden favorilendi" (KVKK-safe, Katman A).
 * İmzalı token doğrulanır (forge engeli). Middleware'den muaf (/api).
 */
export async function POST(request: Request) {
  try {
    const { emlakci, birim, proje, token, tip } = await request.json();
    if (!emlakci || !birim || !token || !verifyShareToken(emlakci, birim, token)) {
      return NextResponse.json({ hata: "Geçersiz istek" }, { status: 400 });
    }
    const izinli = ["favori"];
    if (!izinli.includes(tip)) {
      return NextResponse.json({ hata: "Geçersiz tip" }, { status: 400 });
    }
    const supabase = createAdminClient();
    await supabase.from("events").insert({
      tip,
      profile_id: emlakci,
      proje_id: proje || null,
      birim_id: birim,
      payload: { kaynak: "mikrosite" },
    });
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: "Sunucu hatası" }, { status: 500 });
  }
}
