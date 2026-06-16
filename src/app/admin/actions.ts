"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Üretici doğrulama / güven rozeti (admin yetkisi — RLS is_admin owner). */
export async function ureticiDogrula(formData: FormData) {
  const supabase = await createClient();
  const uretici_id = String(formData.get("uretici_id"));
  const dogrula = formData.get("dogrula") === "true";

  await supabase.from("uretici").update({ dogrulanmis: dogrula }).eq("id", uretici_id);
  revalidatePath("/admin");
}

const AtaSchema = z.object({
  ofis_id: z.string().uuid(),
  paket_id: z.union([z.string().uuid(), z.literal("")]),
});

/**
 * Ofise abonelik paketi ata (gelir modeli ① — tek aktif abonelik).
 * Boş paket = aboneliği kaldır. Önce mevcut aktif/deneme aboneliği iptal eder
 * (unique partial index ihlalini önlemek için), sonra yeni 'aktif' satır ekler.
 */
export async function ofiseAbonelikAta(formData: FormData) {
  const parsed = AtaSchema.safeParse({
    ofis_id: formData.get("ofis_id"),
    paket_id: formData.get("paket_id") ?? "",
  });
  if (!parsed.success) return;
  const { ofis_id, paket_id } = parsed.data;

  const supabase = await createClient();
  await supabase
    .from("abonelik")
    .update({ durum: "iptal" })
    .eq("ofis_id", ofis_id)
    .in("durum", ["deneme", "aktif"]);

  if (paket_id) {
    await supabase.from("abonelik").insert({ ofis_id, paket_id, durum: "aktif" });
  }
  revalidatePath("/admin");
}

const PaketSchema = z.object({
  ad: z.string().trim().min(1).max(60),
  fiyat_aylik: z.coerce.number().min(0),
  kota_koltuk: z.coerce.number().int().positive().nullable(),
  gelismis_rapor: z.boolean(),
});

/** Yeni abonelik paketi tanımla (ofis SaaS kademesi — admin). */
export async function paketEkle(formData: FormData) {
  const kotaRaw = String(formData.get("kota_koltuk") ?? "").trim();
  const parsed = PaketSchema.safeParse({
    ad: formData.get("ad"),
    fiyat_aylik: formData.get("fiyat_aylik") ?? 0,
    kota_koltuk: kotaRaw === "" ? null : kotaRaw,
    gelismis_rapor: formData.get("gelismis_rapor") === "on",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("abonelik_paketi").insert({ hedef: "ofis", ...parsed.data });
  revalidatePath("/admin");
}
