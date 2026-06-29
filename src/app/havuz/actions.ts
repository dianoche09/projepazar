"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kayitYaz } from "@/lib/events";

const uuid = z.string().uuid();

/**
 * OPSİYON TALEP→ONAY (üretici-kontrollü — DEĞİŞMEZ #3 korunur).
 * Emlakçı DOĞRUDAN opsiyon ALAMAZ (RLS opsiyon_insert artık admin-only).
 * Tahsisli + müsait birime "opsiyon talebi" (beklemede) açar; müteahhit onaylarsa
 * opsiyon doğar (kilit) — çift-satış kalkanı (unique index + trigger) onay anında devreye girer.
 */

/** Emlakçı opsiyon TALEBİ gönderir (beklemede) — doğrudan kilit YOK, müteahhit onayına düşer. */
export async function opsiyonTalepGonder(
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

  // Aynı birime zaten bekleyen talebin varsa tekrarlama
  const { data: mevcut } = await supabase
    .from("opsiyon_talep")
    .select("id")
    .eq("birim_id", b.data)
    .eq("talep_eden_id", user.id)
    .eq("durum", "beklemede")
    .maybeSingle();
  if (mevcut) return { ok: false, mesaj: "Bu daire için zaten bekleyen talebin var" };

  const { error } = await supabase
    .from("opsiyon_talep")
    .insert({ birim_id: b.data, talep_eden_id: user.id, durum: "beklemede" });
  if (!error) {
    await kayitYaz({
      tip: "opsiyon",
      profileId: user.id,
      projeId: p.data,
      birimId: b.data,
      payload: { eylem: "talep" },
    });
  }
  revalidatePath(`/havuz/proje/${p.data}`);
  revalidatePath("/havuz");
  revalidatePath("/havuz/opsiyonlarim");
  return error
    ? { ok: false, mesaj: "Talep gönderilemedi — daire müsait olmayabilir" }
    : { ok: true, mesaj: "Opsiyon talebin gönderildi — müteahhit onayına düştü" };
}

// ── KYC belge yükleme (mesleki yeterlilik + vergi levhası) → kyc-belge bucket + beklemede ──
const BELGE_TIPLERI = ["mesleki_yeterlilik", "vergi_levhasi"] as const;

export async function belgeYukle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let yuklendi = 0;
  for (const tip of BELGE_TIPLERI) {
    const file = formData.get(tip);
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > 8 * 1024 * 1024) redirect(`/havuz/dogrulama?hata=${encodeURIComponent("Dosya 8MB'tan büyük olamaz")}`);
    const uzanti = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const yol = `${user.id}/${tip}-${Date.now()}.${uzanti}`;
    const { error: upErr } = await supabase.storage
      .from("kyc-belge")
      .upload(yol, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) redirect(`/havuz/dogrulama?hata=${encodeURIComponent(upErr.message)}`);
    await supabase.from("kullanici_belge").insert({ profile_id: user.id, tip, url: yol, durum: "beklemede" });
    yuklendi++;
  }
  // belge_durumu='beklemede' (trigger 'dogrulandi'yi engeller; bunu yalnız admin yapar)
  if (yuklendi > 0) await supabase.from("profiles").update({ belge_durumu: "beklemede" }).eq("id", user.id);
  revalidatePath("/havuz/dogrulama");
  revalidatePath("/havuz");
  redirect(`/havuz/dogrulama?mesaj=${encodeURIComponent(yuklendi > 0 ? "Belgeler yüklendi — doğrulama bekleniyor" : "Dosya seçilmedi")}`);
}

/** Emlakçı kendi BEKLEYEN talebini geri çeker. */
export async function talepGeriCek(
  talepId: string,
  projeId: string,
): Promise<{ ok: boolean; mesaj: string }> {
  const t = uuid.safeParse(talepId);
  const p = uuid.safeParse(projeId);
  if (!t.success || !p.success) return { ok: false, mesaj: "Geçersiz istek" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mesaj: "Giriş gerekli" };

  const { error } = await supabase
    .from("opsiyon_talep")
    .delete()
    .eq("id", t.data)
    .eq("talep_eden_id", user.id)
    .eq("durum", "beklemede");
  revalidatePath(`/havuz/proje/${p.data}`);
  revalidatePath("/havuz/opsiyonlarim");
  return error ? { ok: false, mesaj: "Geri çekilemedi" } : { ok: true, mesaj: "Talep geri çekildi" };
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
  if (!error) {
    await kayitYaz({
      tip: "opsiyon",
      profileId: user.id,
      projeId: p.data,
      birimId: b.data,
      payload: { eylem: "iptal" },
    });
  }
  revalidatePath(`/havuz/proje/${p.data}`);
  revalidatePath("/havuz");
  return error ? { ok: false, mesaj: "Bırakılamadı" } : { ok: true, mesaj: "Opsiyon bırakıldı" };
}

/** WhatsApp paylaşımı tıklanınca ANONİM paylaşım sinyali (Paylaştıklarım sayfası + Talep Radarı moat). */
export async function paylasimKaydet(projeId: string, birimId?: string | null): Promise<void> {
  const p = uuid.safeParse(projeId);
  if (!p.success) return;
  const b = birimId ? uuid.safeParse(birimId) : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await kayitYaz({
    tip: "paylasim",
    profileId: user.id,
    projeId: p.data,
    birimId: b && b.success ? b.data : null,
    payload: {},
  });
  revalidatePath("/havuz/paylastiklarim");
}

/**
 * Lead durumunu ilerlet (yeni→arandı→görüşme→opsiyon→kazanıldı/kaybedildi).
 * lead_update RLS politikası yok → sahiplik RLS-select ile doğrulanır, sonra
 * service-role ile yazılır (DEĞİŞMEZ #1: yalnız server).
 */
const LEAD_DURUM = z.enum(["yeni", "arandi", "gorusme", "opsiyon", "kazanildi", "kaybedildi"]);

export async function leadDurumGuncelle(leadId: string, yeniDurum: string): Promise<{ ok: boolean }> {
  const id = uuid.safeParse(leadId);
  const durum = LEAD_DURUM.safeParse(yeniDurum);
  if (!id.success || !durum.success) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Yetki: bu lead'i görebiliyor muyum? (RLS lead_select = atanan/ilk_paylasan/proje sahibi/admin)
  const { data: lead } = await supabase.from("lead").select("id").eq("id", id.data).single();
  if (!lead) return { ok: false };

  const admin = createAdminClient();
  const { error } = await admin.from("lead").update({ durum: durum.data }).eq("id", id.data);
  if (error) return { ok: false };

  revalidatePath("/havuz/leadler");
  revalidatePath("/uretici");
  return { ok: true };
}
