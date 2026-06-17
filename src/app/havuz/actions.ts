"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

/**
 * Emlakçı birimi 48 saat opsiyonlar. Çift-satış kalkanı:
 * RLS opsiyon_insert (satilabilir + musait) + unique partial index (tek aktif opsiyon).
 * Trigger birim.durum'u 'opsiyonlu' yapar (emlakçı birim'i doğrudan yazamaz).
 */
export async function opsiyonAl(formData: FormData) {
  const birim = uuid.safeParse(formData.get("birim_id"));
  const proje = uuid.safeParse(formData.get("proje_id"));
  if (!birim.success || !proje.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kilit = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const { error } = await supabase.from("opsiyon").insert({
    birim_id: birim.data,
    satici_id: user.id,
    durum: "opsiyonlu",
    kilit_bitis: kilit,
  });
  revalidatePath(`/havuz/proje/${proje.data}`);
  revalidatePath("/havuz");
  redirect(
    error
      ? `/havuz/proje/${proje.data}?hata=${encodeURIComponent("Bu birim müsait değil veya başkası opsiyonladı")}`
      : `/havuz/proje/${proje.data}?mesaj=${encodeURIComponent("48 saat opsiyon alındı")}`,
  );
}

/** Emlakçı kendi opsiyonunu bırakır → birim müsait (trigger). */
export async function opsiyonBirak(formData: FormData) {
  const birim = uuid.safeParse(formData.get("birim_id"));
  const proje = uuid.safeParse(formData.get("proje_id"));
  if (!birim.success || !proje.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("opsiyon")
    .delete()
    .eq("birim_id", birim.data)
    .eq("satici_id", user.id)
    .in("durum", ["opsiyonlu", "satis_beklemede"]);
  revalidatePath(`/havuz/proje/${proje.data}`);
  revalidatePath("/havuz");
  redirect(`/havuz/proje/${proje.data}?mesaj=${encodeURIComponent("Opsiyon bırakıldı")}`);
}

/** Optimistic UI için sessiz varyantlar — redirect yok, sonuç döner; ızgara Realtime ile güncellenir. */
export async function opsiyonAlSessiz(
  birimId: string,
  projeId: string,
): Promise<{ ok: boolean; mesaj: string }> {
  const b = uuid.safeParse(birimId);
  const p = uuid.safeParse(projeId);
  if (!b.success || !p.success) return { ok: false, mesaj: "Geçersiz istek" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mesaj: "Giriş gerekli" };

  const kilit = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const { error } = await supabase
    .from("opsiyon")
    .insert({ birim_id: b.data, satici_id: user.id, durum: "opsiyonlu", kilit_bitis: kilit });
  revalidatePath(`/havuz/proje/${p.data}`);
  revalidatePath("/havuz");
  return error
    ? { ok: false, mesaj: "Bu birim müsait değil veya başkası opsiyonladı" }
    : { ok: true, mesaj: "48 saat opsiyon alındı" };
}

export async function opsiyonBirakSessiz(
  birimId: string,
  projeId: string,
): Promise<{ ok: boolean; mesaj: string }> {
  const b = uuid.safeParse(birimId);
  const p = uuid.safeParse(projeId);
  if (!b.success || !p.success) return { ok: false, mesaj: "Geçersiz istek" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mesaj: "Giriş gerekli" };

  const { error } = await supabase
    .from("opsiyon")
    .delete()
    .eq("birim_id", b.data)
    .eq("satici_id", user.id)
    .in("durum", ["opsiyonlu", "satis_beklemede"]);
  revalidatePath(`/havuz/proje/${p.data}`);
  revalidatePath("/havuz");
  return error ? { ok: false, mesaj: "Bırakılamadı" } : { ok: true, mesaj: "Opsiyon bırakıldı" };
}
