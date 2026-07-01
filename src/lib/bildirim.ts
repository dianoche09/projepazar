import { createAdminClient } from "@/lib/supabase/admin";

export type BildirimTip = "talep" | "onay" | "red" | "tahsis" | "lead" | "sistem";
type Yeni = { profile_id: string; tip: BildirimTip; baslik: string; govde?: string | null; link?: string | null };

/**
 * Bildirim yaz — admin client (service-role, server-only): kullanıcı başkası adına bildirim üretemez
 * (RLS insert policy yok). Best-effort: hata ana akışı BOZMAZ (bildirim ikincil).
 */
export async function bildirimYaz(b: Yeni): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("bildirim").insert({
      profile_id: b.profile_id,
      tip: b.tip,
      baslik: b.baslik,
      govde: b.govde ?? null,
      link: b.link ?? null,
    });
  } catch {
    /* bildirim best-effort */
  }
}

/** Çoklu alıcıya aynı bildirim (ör. ofis danışmanları / bireysel tahsis grubu). */
export async function bildirimlerYaz(alicilar: string[], b: Omit<Yeni, "profile_id">): Promise<void> {
  const hedef = [...new Set(alicilar.filter(Boolean))];
  if (!hedef.length) return;
  try {
    const admin = createAdminClient();
    await admin.from("bildirim").insert(
      hedef.map((profile_id) => ({
        profile_id,
        tip: b.tip,
        baslik: b.baslik,
        govde: b.govde ?? null,
        link: b.link ?? null,
      })),
    );
  } catch {
    /* best-effort */
  }
}
