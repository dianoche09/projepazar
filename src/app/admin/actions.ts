"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kayitYaz } from "@/lib/events";
import { zUuid } from "@/lib/uuid";

/** Çağıran oturumun admin olduğunu doğrula (service-role işlemleri öncesi şart). Admin id döner. */
async function adminGuard(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (profil?.rol !== "admin") redirect("/");
  return user.id;
}

/** Üretici doğrulama / güven rozeti (admin yetkisi — RLS is_admin owner). */
export async function ureticiDogrula(formData: FormData) {
  const adminId = await adminGuard();
  const supabase = await createClient();
  const uretici_id = String(formData.get("uretici_id"));
  const dogrula = formData.get("dogrula") === "true";
  await supabase.from("uretici").update({ dogrulanmis: dogrula }).eq("id", uretici_id);
  await kayitYaz({ tip: "dogrulama", profileId: adminId, payload: { uretici_id, dogrula } });
  revalidatePath("/admin");
  revalidatePath("/admin/ureticiler");
}

const AtaSchema = z.object({
  ofis_id: zUuid,
  paket_id: z.union([zUuid, z.literal("")]),
});

/**
 * Ofise abonelik paketi ata (tek aktif abonelik). Boş paket = aboneliği kaldır.
 * Önce mevcut aktif/deneme aboneliği iptal eder (unique partial index ihlalini önler).
 */
export async function ofiseAbonelikAta(formData: FormData) {
  const adminId = await adminGuard();
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
  await kayitYaz({ tip: "abonelik", profileId: adminId, payload: { ofis_id, paket_id: paket_id || null } });
  revalidatePath("/admin");
}

const UretAtaSchema = z.object({
  uretici_id: zUuid,
  paket_id: z.union([zUuid, z.literal("")]),
});

/**
 * Üreticiye abonelik paketi ata (gelir modeli ANA ayağı: müteahhit anlaşması). Boş paket = kaldır.
 * Tek aktif abonelik (abonelik_uretici_aktif unique index) — önce mevcut aktif/deneme iptal edilir.
 */
export async function ureticiyeAbonelikAta(formData: FormData) {
  const adminId = await adminGuard();
  const parsed = UretAtaSchema.safeParse({
    uretici_id: formData.get("uretici_id"),
    paket_id: formData.get("paket_id") ?? "",
  });
  if (!parsed.success) return;
  const { uretici_id, paket_id } = parsed.data;

  const supabase = await createClient();
  await supabase
    .from("abonelik")
    .update({ durum: "iptal" })
    .eq("uretici_id", uretici_id)
    .in("durum", ["deneme", "aktif"]);
  if (paket_id) {
    const { error } = await supabase.from("abonelik").insert({ uretici_id, paket_id, durum: "aktif" });
    if (error) redirect(`/admin/ureticiler?hata=${encodeURIComponent(error.message)}`);
  }
  await kayitYaz({ tip: "abonelik", profileId: adminId, payload: { uretici_id, paket_id: paket_id || null } });
  revalidatePath("/admin");
  revalidatePath("/admin/ureticiler");
  redirect(`/admin/ureticiler?mesaj=${encodeURIComponent(paket_id ? "Abonelik atandı" : "Abonelik kaldırıldı")}`);
}

// ── KYC belge doğrulama (admin onay/red → emlakçı belge_durumu; trigger 'dogrulandi'ya yalnız admin izin verir) ──
export async function belgeKarar(formData: FormData): Promise<void> {
  const adminId = await adminGuard();
  const profileId = String(formData.get("profile_id"));
  const karar = String(formData.get("karar"));
  if (!zUuid.safeParse(profileId).success || (karar !== "onay" && karar !== "red")) {
    redirect("/admin/dogrulama?hata=" + encodeURIComponent("Geçersiz istek"));
  }
  const yeni = karar === "onay" ? "dogrulandi" : "red";
  const supabase = await createClient();
  await supabase.from("kullanici_belge").update({ durum: yeni }).eq("profile_id", profileId).eq("durum", "beklemede");
  await supabase.from("profiles").update({ belge_durumu: yeni }).eq("id", profileId);
  await kayitYaz({ tip: "dogrulama", profileId: adminId, payload: { hedef: profileId, karar: yeni } });
  revalidatePath("/admin/dogrulama");
  revalidatePath("/admin");
  redirect(`/admin/dogrulama?mesaj=${encodeURIComponent(karar === "onay" ? "Danışman doğrulandı" : "Belgeler reddedildi")}`);
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
  await adminGuard();
  const parsed = paketGirdi(formData);
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("abonelik_paketi").insert(parsed.data);
  revalidatePath("/admin");
}

/** Mevcut paketi düzenle (fiyat/kota/özellik/aktiflik). */
export async function paketDuzenle(formData: FormData) {
  await adminGuard();
  const id = zUuid.safeParse(formData.get("id"));
  const parsed = paketGirdi(formData);
  if (!id.success || !parsed.success) return;
  const supabase = await createClient();
  await supabase.from("abonelik_paketi").update(parsed.data).eq("id", id.data);
  revalidatePath("/admin");
}

/** Paketi sil — atanmış aktif abonelik varsa silmek yerine pasifleştirir. */
export async function paketSil(formData: FormData) {
  await adminGuard();
  const id = zUuid.safeParse(formData.get("id"));
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
  kullanici_id: zUuid,
  rol: z.enum(["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi"]),
  ofis_id: z.union([zUuid, z.literal("")]),
});

/** Bekleyen kaydı onayla: rol + ofis ata, durum=aktif, onay izini bırak. */
export async function kullaniciOnayla(formData: FormData) {
  const adminId = await adminGuard();
  const parsed = OnaySchema.safeParse({
    kullanici_id: formData.get("kullanici_id"),
    rol: formData.get("rol"),
    ofis_id: formData.get("ofis_id") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      rol: parsed.data.rol,
      ofis_id: parsed.data.ofis_id || null,
      durum: "aktif",
      onaylayan_id: adminId,
      onay_tarihi: new Date().toISOString(),
    })
    .eq("id", parsed.data.kullanici_id);
  await kayitYaz({ tip: "onay", profileId: adminId, payload: { kullanici_id: parsed.data.kullanici_id, rol: parsed.data.rol, eylem: "onay" } });
  revalidatePath("/admin");
}

/** Bekleyen kaydı reddet → durum=pasif (soft; iz kalır, silinmez). */
export async function kullaniciReddet(formData: FormData) {
  const adminId = await adminGuard();
  const id = zUuid.safeParse(formData.get("kullanici_id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ durum: "pasif" }).eq("id", id.data);
  await kayitYaz({ tip: "onay", profileId: adminId, payload: { kullanici_id: id.data, eylem: "red" } });
  revalidatePath("/admin");
}

/** Hesap durumu değiştir (aktif/pasif/askıya/arşiv) — kullanıcı yaşam döngüsü. */
export async function hesapDurumDegistir(formData: FormData) {
  const adminId = await adminGuard();
  const parsed = z
    .object({
      kullanici_id: zUuid,
      durum: z.enum(["aktif", "pasif", "askida", "arsivli"]),
    })
    .safeParse({
      kullanici_id: formData.get("kullanici_id"),
      durum: formData.get("durum"),
    });
  if (!parsed.success) return;
  if (parsed.data.kullanici_id === adminId && parsed.data.durum !== "aktif") {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent("Kendi hesabını devre dışı bırakamazsın")}`);
  }
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ durum: parsed.data.durum })
    .eq("id", parsed.data.kullanici_id);
  await kayitYaz({ tip: "onay", profileId: adminId, payload: { kullanici_id: parsed.data.kullanici_id, eylem: "durum", durum: parsed.data.durum } });
  revalidatePath("/admin");
  revalidatePath("/admin/kullanicilar", "layout");
}

// ── Kullanıcı düzenleme (rol + ofis + durum tek formda) ──
const KullaniciSchema = z.object({
  kullanici_id: zUuid,
  rol: z.enum(["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"]),
  ofis_id: z.union([zUuid, z.literal("")]),
  durum: z.enum(["onay_bekliyor", "aktif", "pasif", "askida", "arsivli"]),
});

/** Kullanıcıyı düzenle (rol/ofis/durum) — admin user yönetimi. */
export async function kullaniciGuncelle(formData: FormData) {
  const adminId = await adminGuard();
  const parsed = KullaniciSchema.safeParse({
    kullanici_id: formData.get("kullanici_id"),
    rol: formData.get("rol"),
    ofis_id: formData.get("ofis_id") ?? "",
    durum: formData.get("durum"),
  });
  if (!parsed.success) return;
  if (parsed.data.kullanici_id === adminId && (parsed.data.rol !== "admin" || parsed.data.durum !== "aktif")) {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent("Kendi rol/durumunu düşüremezsin")}`);
  }

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      rol: parsed.data.rol,
      ofis_id: parsed.data.ofis_id || null,
      durum: parsed.data.durum,
    })
    .eq("id", parsed.data.kullanici_id);
  revalidatePath("/admin/kullanicilar");
  revalidatePath("/admin");
}

// ── Admin kullanıcı oluşturma (service-role) ──
const OlusturSchema = z.object({
  email: z.string().email("Geçerli e-posta"),
  ad: z.string().trim().min(2, "Ad-soyad"),
  telefon: z.string().trim().max(20).optional(),
  rol: z.enum(["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"]),
  ofis_id: z.union([zUuid, z.literal("")]),
  parola: z.string().min(8, "Parola en az 8 karakter"),
});

/** Admin yeni kullanıcı oluşturur (createUser + profil rol/ofis/aktif). Service-role. */
export async function kullaniciOlustur(formData: FormData) {
  await adminGuard();
  const parsed = OlusturSchema.safeParse({
    email: formData.get("email"),
    ad: formData.get("ad"),
    telefon: (formData.get("telefon") as string) || undefined,
    rol: formData.get("rol"),
    ofis_id: formData.get("ofis_id") ?? "",
    parola: formData.get("parola"),
  });
  if (!parsed.success) {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const { email, ad, telefon, rol, ofis_id, parola } = parsed.data;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent("Service-role anahtarı tanımlı değil (.env + Vercel)")}`);
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: parola,
    email_confirm: true,
    user_metadata: { ad, telefon: telefon ?? null },
  });
  if (error || !created.user) {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent(error?.message ?? "Oluşturulamadı")}`);
  }

  // Admin oluşturduğu için doğrudan aktif + rol/ofis atanmış
  await admin
    .from("profiles")
    .update({ ad, telefon: telefon ?? null, rol, ofis_id: ofis_id || null, durum: "aktif" })
    .eq("id", created.user.id);
  revalidatePath("/admin/kullanicilar");
  redirect(`/admin/kullanicilar?mesaj=${encodeURIComponent(`${email} oluşturuldu`)}`);
}

/** Kullanıcının parolasını sıfırla (admin → yeni geçici parola). Service-role. */
export async function parolaSifirla(formData: FormData) {
  await adminGuard();
  const id = zUuid.safeParse(formData.get("kullanici_id"));
  const parola = z.string().min(8).safeParse(formData.get("parola"));
  if (!id.success || !parola.success) {
    redirect(`/admin/kullanicilar?hata=${encodeURIComponent("Parola en az 8 karakter")}`);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/kullanicilar/${id.data}?hata=${encodeURIComponent("Service-role anahtarı tanımlı değil")}`);
  }
  const { error } = await admin.auth.admin.updateUserById(id.data, { password: parola.data });
  redirect(
    error
      ? `/admin/kullanicilar/${id.data}?hata=${encodeURIComponent(error.message)}`
      : `/admin/kullanicilar/${id.data}?mesaj=${encodeURIComponent("Parola güncellendi")}`,
  );
}

// ── Hesap tanımlama: ÜRETİCİ firma + sahip kullanıcı (service-role) ──
const UreticiEkleSchema = z.object({
  ad: z.string().trim().min(2, "Firma adı en az 2 karakter"),
  vergi_no: z.string().trim().max(20).optional(),
  sahip_ad: z.string().trim().min(2, "Sahip ad-soyad"),
  sahip_email: z.string().email("Geçerli e-posta"),
  sahip_parola: z.string().min(8, "Parola en az 8 karakter"),
});

/** Admin yeni ÜRETİCİ hesabı açar: firma kaydı + sahip kullanıcı (rol=uretici, aktif, doğrulanmış). */
export async function ureticiEkle(formData: FormData) {
  await adminGuard();
  const parsed = UreticiEkleSchema.safeParse({
    ad: formData.get("ad"),
    vergi_no: (formData.get("vergi_no") as string) || undefined,
    sahip_ad: formData.get("sahip_ad"),
    sahip_email: formData.get("sahip_email"),
    sahip_parola: formData.get("sahip_parola"),
  });
  if (!parsed.success) {
    redirect(`/admin/ureticiler?hata=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/ureticiler?hata=${encodeURIComponent("Service-role anahtarı tanımlı değil (.env + Vercel)")}`);
  }

  // 1) Sahip kullanıcı (auth) — rol=uretici, aktif
  const { data: created, error } = await admin.auth.admin.createUser({
    email: d.sahip_email,
    password: d.sahip_parola,
    email_confirm: true,
    user_metadata: { ad: d.sahip_ad },
  });
  if (error || !created.user) {
    redirect(`/admin/ureticiler?hata=${encodeURIComponent(error?.message ?? "Sahip kullanıcı oluşturulamadı")}`);
  }
  await admin.from("profiles").update({ ad: d.sahip_ad, rol: "uretici", durum: "aktif" }).eq("id", created.user.id);

  // 2) Üretici firma kaydı + sahip bağı (admin açtığı için doğrulanmış)
  const { error: e2 } = await admin.from("uretici").insert({
    ad: d.ad,
    vergi_no: d.vergi_no ?? null,
    sahip_id: created.user.id,
    dogrulanmis: true,
  });
  if (e2) redirect(`/admin/ureticiler?hata=${encodeURIComponent(e2.message)}`);
  revalidatePath("/admin/ureticiler");
  redirect(`/admin/ureticiler?mesaj=${encodeURIComponent(`${d.ad} eklendi · sahip ${d.sahip_email}`)}`);
}

// ── Hesap tanımlama: OFİS + yetkili kullanıcı (service-role) ──
const OfisEkleSchema = z.object({
  ad: z.string().trim().min(2, "Ofis adı en az 2 karakter"),
  marka: z.string().trim().max(60).optional(),
  il: z.string().trim().max(40).optional(),
  ilce: z.string().trim().max(40).optional(),
  yetkili_ad: z.string().trim().min(2, "Yetkili ad-soyad"),
  yetkili_email: z.string().email("Geçerli e-posta"),
  yetkili_parola: z.string().min(8, "Parola en az 8 karakter"),
});

/** Admin yeni OFİS hesabı açar: ofis kaydı + yetkili kullanıcı (rol=ofis_yetkili, ofis_id, aktif). */
export async function ofisEkle(formData: FormData) {
  await adminGuard();
  const parsed = OfisEkleSchema.safeParse({
    ad: formData.get("ad"),
    marka: (formData.get("marka") as string) || undefined,
    il: (formData.get("il") as string) || undefined,
    ilce: (formData.get("ilce") as string) || undefined,
    yetkili_ad: formData.get("yetkili_ad"),
    yetkili_email: formData.get("yetkili_email"),
    yetkili_parola: formData.get("yetkili_parola"),
  });
  if (!parsed.success) {
    redirect(`/admin/ofisler?hata=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/ofisler?hata=${encodeURIComponent("Service-role anahtarı tanımlı değil (.env + Vercel)")}`);
  }

  // 1) Ofis kaydı
  const { data: ofis, error } = await admin
    .from("ofis")
    .insert({ ad: d.ad, marka: d.marka ?? null, il: d.il ?? null, ilce: d.ilce ?? null })
    .select("id")
    .single();
  if (error || !ofis) {
    redirect(`/admin/ofisler?hata=${encodeURIComponent(error?.message ?? "Ofis oluşturulamadı")}`);
  }

  // 2) Yetkili kullanıcı — rol=ofis_yetkili, ofise bağlı, aktif
  const { data: created, error: e2 } = await admin.auth.admin.createUser({
    email: d.yetkili_email,
    password: d.yetkili_parola,
    email_confirm: true,
    user_metadata: { ad: d.yetkili_ad },
  });
  if (e2 || !created.user) {
    redirect(`/admin/ofisler?hata=${encodeURIComponent(e2?.message ?? "Yetkili oluşturulamadı")}`);
  }
  await admin
    .from("profiles")
    .update({ ad: d.yetkili_ad, rol: "ofis_yetkili", ofis_id: ofis.id, durum: "aktif" })
    .eq("id", created.user.id);

  revalidatePath("/admin/ofisler");
  redirect(`/admin/ofisler?mesaj=${encodeURIComponent(`${d.ad} eklendi · yetkili ${d.yetkili_email}`)}`);
}
