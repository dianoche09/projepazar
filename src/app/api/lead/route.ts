import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTelefon } from "@/lib/telefon";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projeId, birimId, emlakciId, ad, telefon, kvkk, niyet } = body;

    if (!ad || !telefon) {
      return NextResponse.json(
        { hata: "Ad ve telefon alanları zorunludur." },
        { status: 400 }
      );
    }

    if (!kvkk) {
      return NextResponse.json(
        { hata: "KVKK onayı zorunludur." },
        { status: 400 }
      );
    }

    const telNorm = normalizeTelefon(telefon);
    const supabase = createAdminClient();

    // 1. Lead tablosuna kaydet (hangi linkten geldiyse doğrudan o emlakçıya atanır)
    const { data: leadData, error: leadError } = await supabase
      .from("lead")
      .insert({
        proje_id: projeId || null,
        birim_id: birimId || null,
        kaynak: "paylasim",
        ad,
        telefon,
        telefon_norm: telNorm,
        durum: "yeni",
        atanan_id: emlakciId,
        ilk_paylasan_id: emlakciId,
        kvkk_riza: true,
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead oluşturma hatası:", leadError);
      return NextResponse.json({ hata: leadError.message }, { status: 500 });
    }

    // 2. Olay günlüğüne (events) log yaz
    const { error: eventError } = await supabase
      .from("events")
      .insert({
        tip: "lead",
        profile_id: emlakciId,
        proje_id: projeId || null,
        birim_id: birimId || null,
        payload: {
          lead_id: leadData.id,
          ad,
          telefon: telNorm,
          niyet: typeof niyet === "string" ? niyet : "bilgi",
        },
      });

    if (eventError) {
      console.error("Event log yazma hatası:", eventError);
      // Lead kaydedildiği için event log hatası kritik engel teşkil etmez.
    }

    return NextResponse.json({ basarili: true, id: leadData.id });
  } catch (err) {
    console.error("API Lead hatası:", err);
    return NextResponse.json(
      { hata: err instanceof Error ? err.message : "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
