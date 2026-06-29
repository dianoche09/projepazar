"use server";

import { revalidatePath } from "next/cache";
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
