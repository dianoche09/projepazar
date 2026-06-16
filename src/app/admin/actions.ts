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
 * Ofise abonelik paketi ata (tek aktif abonelik). Boş paket = aboneliği kaldır.
 * Önce mevcut aktif/deneme aboneliği iptal eder (unique partial index ihlalini önler).
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

// ── Üyelik paketi CRUD (tip/fiyat/kota %100 admin-kontrollü; üç hedef) ──
const bosNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const PaketSchema = z.object({
  ad: z.string().trim().min(1).max(60),
  hedef: z.enum(["ofis", "uretici", "emlakci"]),
  fiyat_aylik: z.coerce.number().min(0),
  para_birimi: z.enum(["TRY", "USD", "EUR"]),
  kota_proje: z.coerce.number().int().positive().nullable(),
  kota_koltuk: z.coerce.number().int().positive().nullable(),
  kota_ai: z.coerce.number().int().nonnegative().nullable(),
  gelismis_rapor: z.boolean(),
  aktif: z.boolean(),
});

function paketGirdi(formData: FormData) {
  return PaketSchema.safeParse({
    ad: formData.get("ad"),
    hedef: formData.get("hedef"),
    fiyat_aylik: formData.get("fiyat_aylik") ?? 0,
    para_birimi: formData.get("para_birimi") ?? "TRY",
    kota_proje: bosNull(formData.get("kota_proje")),
    kota_koltuk: bosNull(formData.get("kota_koltuk")),
    kota_ai: bosNull(formData.get("kota_ai")),
    gelismis_rapor: formData.get("gelismis_rapor") === "on",
    aktif: formData.get("aktif") !== "false",
  });
}

/** Yeni üyelik paketi tanımla — ad/fiyat/kota tamamen admin girer (hardcode yok). */
export async function paketEkle(formData: FormData) {
  const parsed = paketGirdi(formData);
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("abonelik_paketi").insert(parsed.data);
  revalidatePath("/admin");
}

/** Mevcut paketi düzenle (fiyat/kota/özellik/aktiflik). */
export async function paketDuzenle(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = paketGirdi(formData);
  if (!id.success || !parsed.success) return;
  const supabase = await createClient();
  await supabase.from("abonelik_paketi").update(parsed.data).eq("id", id.data);
  revalidatePath("/admin");
}

/** Paketi sil — atanmış aktif abonelik varsa silmek yerine pasifleştirir. */
export async function paketSil(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("abonelik")
    .select("id", { count: "exact", head: true })
    .eq("paket_id", id.data)
    .in("durum", ["deneme", "aktif"]);
  if (count && count > 0) {
    await supabase.from("abonelik_paketi").update({ aktif: false }).eq("id", id.data);
  } else {
    await supabase.from("abonelik_paketi").delete().eq("id", id.data);
  }
  revalidatePath("/admin");
}

// ── Onay kuyruğu (kayıt → admin onayı → aktif) ──
const OnaySchema = z.object({
  kullanici_id: z.string().uuid(),
  rol: z.enum(["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi"]),
  ofis_id: z.union([z.string().uuid(), z.literal("")]),
});

/** Bekleyen kaydı onayla: rol + ofis ata, durum=aktif, onay izini bırak. */
export async function kullaniciOnayla(formData: FormData) {
  const parsed = OnaySchema.safeParse({
    kullanici_id: formData.get("kullanici_id"),
    rol: formData.get("rol"),
    ofis_id: formData.get("ofis_id") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("profiles")
    .update({
      rol: parsed.data.rol,
      ofis_id: parsed.data.ofis_id || null,
      durum: "aktif",
      onaylayan_id: user?.id ?? null,
      onay_tarihi: new Date().toISOString(),
    })
    .eq("id", parsed.data.kullanici_id);
  revalidatePath("/admin");
}

/** Bekleyen kaydı reddet → durum=pasif (soft; iz kalır, silinmez). */
export async function kullaniciReddet(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("kullanici_id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ durum: "pasif" }).eq("id", id.data);
  revalidatePath("/admin");
}

/** Hesap durumu değiştir (aktif/pasif/askıya/arşiv) — kullanıcı yaşam döngüsü. */
export async function hesapDurumDegistir(formData: FormData) {
  const parsed = z
    .object({
      kullanici_id: z.string().uuid(),
      durum: z.enum(["aktif", "pasif", "askida", "arsivli"]),
    })
    .safeParse({
      kullanici_id: formData.get("kullanici_id"),
      durum: formData.get("durum"),
    });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ durum: parsed.data.durum })
    .eq("id", parsed.data.kullanici_id);
  revalidatePath("/admin");
}
