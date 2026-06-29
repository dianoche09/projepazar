import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Append-only audit günlüğü (events). MVP-17: opsiyon/iptal/onay/satış olayları.
 * events tablosunda INSERT RLS politikası yoktur (yazma server-side) → service-role.
 * Fire-and-forget: audit yazımı user akışını ASLA bozmaz (hata yalnız loglanır).
 */
export type OlayTip =
  | "opsiyon"
  | "satis"
  | "durum"
  | "paylasim"
  | "goruntuleme"
  | "lead"
  | "onay" // admin: hesap onay/red/durum
  | "dogrulama" // admin: üretici güven rozeti
  | "abonelik" // admin: paket atama
  | "favori"; // mikrosite: müşteri favoriledi (anonim sinyal)

export type OlayGirdi = {
  tip: OlayTip;
  profileId?: string | null;
  projeId?: string | null;
  birimId?: string | null;
  payload?: Record<string, unknown> | null;
};

function satir(o: OlayGirdi) {
  return {
    tip: o.tip,
    profile_id: o.profileId ?? null,
    proje_id: o.projeId ?? null,
    birim_id: o.birimId ?? null,
    payload: o.payload ?? null,
  };
}

/** Tek olay yaz (sessiz). */
export async function kayitYaz(olay: OlayGirdi): Promise<void> {
  try {
    const { error } = await createAdminClient().from("events").insert(satir(olay));
    if (error) console.error("Audit event yazma hatası:", error.message);
  } catch (e) {
    console.error("Audit event istisnası:", e);
  }
}

/** Toplu olay yaz (sessiz). Boş diziyi yok sayar. */
export async function kayitlarYaz(olaylar: OlayGirdi[]): Promise<void> {
  if (olaylar.length === 0) return;
  try {
    const { error } = await createAdminClient().from("events").insert(olaylar.map(satir));
    if (error) console.error("Audit event toplu yazma hatası:", error.message);
  } catch (e) {
    console.error("Audit event toplu istisnası:", e);
  }
}

/** birim.durum değerini olay tipine eşler (satış vs opsiyon vs genel durum). */
export function durumTip(durum: string): OlayTip {
  if (durum === "satildi") return "satis";
  if (durum === "opsiyonlu" || durum === "satis_beklemede") return "opsiyon";
  return "durum";
}
