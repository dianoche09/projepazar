"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kayitYaz, kayitlarYaz, durumTip } from "@/lib/events";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import * as XLSX from "xlsx";

/** Public medya URL'inden bucket içi yolu çıkar (silme için). */
function medyaYolu(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/proje-medya\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Giriş yapan kullanıcının üretici (sahip) kaydının id'si. Yoksa null. */
async function ureticiId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("uretici")
    .select("id")
    .eq("sahip_id", user.id)
    .single();
  return data?.id ?? null;
}

function hataya(yol: string, mesaj: string): never {
  redirect(`${yol}?hata=${encodeURIComponent(mesaj)}`);
}

/**
 * Opsiyonel yönlendirme hedefi (wizard akışı için). Form'da `geri_yol` varsa onu
 * doğrular ve döndürür; yoksa null. Açık-yönlendirme (open-redirect) koruması:
 * yalnız uygulama-içi mutlak yol (`/uretici/...`) kabul edilir. Mevcut çağıranlar
 * bu alanı göndermediği için varsayılan davranış birebir korunur (geriye uyumlu).
 */
function geriYol(formData: FormData): string | null {
  const ham = String(formData.get("geri_yol") ?? "").trim();
  if (!ham) return null;
  if (!ham.startsWith("/uretici/")) return null;
  if (ham.includes("//") || ham.includes("..")) return null;
  return ham;
}

/** Başarı sonrası hedef yol + mesaj; geri_yol verilmişse oraya, yoksa varsayılana. */
function basariya(varsayilan: string, formData: FormData, mesaj?: string): never {
  const yol = geriYol(formData) ?? varsayilan;
  const ayrac = yol.includes("?") ? "&" : "?";
  redirect(mesaj ? `${yol}${ayrac}mesaj=${encodeURIComponent(mesaj)}` : yol);
}

// ---- Proje oluştur ----
const INSAAT_ASAMA = [
  "planlama",
  "temel",
  "kaba_insaat",
  "ince_insaat",
  "cevre_duzenleme",
  "tamamlandi",
] as const;

const projeSemasi = z.object({
  ad: z.string().trim().min(2, "Proje adı en az 2 karakter olmalı"),
  il: z.string().trim().optional(),
  ilce: z.string().trim().optional(),
  mahalle: z.string().trim().optional(),
  ada: z.string().trim().optional(),
  parsel: z.string().trim().optional(),
  baslama_tarihi: z.string().trim().optional(),
  teslim_tarihi: z.string().trim().optional(),
  insaat_asamasi: z.enum(INSAAT_ASAMA).optional(),
});

export async function projeOlustur(formData: FormData) {
  const supabase = await createClient();
  const uid = await ureticiId(supabase);
  if (!uid) {
    hataya("/uretici", "Üretici kaydı bulunamadı — proje oluşturmak için 'uretici' rolüyle giriş yapın.");
  }

  // geri_yol gibi kontrol alanlarını şema dışında tut.
  const sonuc = projeSemasi.safeParse({
    ad: formData.get("ad"),
    il: formData.get("il") ?? undefined,
    ilce: formData.get("ilce") ?? undefined,
    mahalle: formData.get("mahalle") ?? undefined,
    ada: formData.get("ada") ?? undefined,
    parsel: formData.get("parsel") ?? undefined,
    baslama_tarihi: formData.get("baslama_tarihi") ?? undefined,
    teslim_tarihi: formData.get("teslim_tarihi") ?? undefined,
    insaat_asamasi: (formData.get("insaat_asamasi") || undefined) as string | undefined,
  });
  if (!sonuc.success) hataya("/uretici/proje/yeni", sonuc.error.issues[0].message);
  const d = sonuc.data;

  const { data: proje, error } = await supabase
    .from("proje")
    .insert({
      uretici_id: uid,
      ad: d.ad,
      il: d.il || null,
      ilce: d.ilce || null,
      mahalle: d.mahalle || null,
      ada: d.ada || null,
      parsel: d.parsel || null,
      baslama_tarihi: d.baslama_tarihi || null,
      teslim_tarihi: d.teslim_tarihi || null,
      insaat_asamasi: d.insaat_asamasi || "planlama",
    })
    .select("id")
    .single();
  if (error) hataya("/uretici/proje/yeni", error.message);

  revalidatePath("/uretici");
  // Wizard akışı: geri_yol verilmişse oraya (id'yi enjekte ederek) yönlen; yoksa KURULUM'a düş.
  const ham = String(formData.get("geri_yol") ?? "").trim();
  if (ham.startsWith("/uretici/")) {
    const yol = ham.replace(/__ID__/g, proje!.id);
    redirect(yol);
  }
  // Proje açılır açılmaz KURULUM'a düş: künye/imar + kapak + tanıtım envanteri + belgeler.
  redirect(`/uretici/proje/${proje!.id}/kurulum`);
}

// ---- Blok ekle ----
export async function blokEkle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const ad = String(formData.get("ad") ?? "").trim();
  const katSayisiRaw = formData.get("kat_sayisi");
  const kat_sayisi = katSayisiRaw ? Number(katSayisiRaw) : null;
  if (!ad) hataya(`/uretici/proje/${proje_id}`, "Blok adı gerekli");

  const { error } = await supabase.from("blok").insert({ proje_id, ad, kat_sayisi });
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(`/uretici/proje/${proje_id}/kurulum`, formData);
}

// ---- Blok düzelt ----
export async function blokGuncelle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const blok_id = String(formData.get("blok_id"));
  const ad = String(formData.get("ad") ?? "").trim();
  const kat_sayisi = formData.get("kat_sayisi") ? Number(formData.get("kat_sayisi")) : null;
  if (!ad) hataya(`/uretici/proje/${proje_id}`, "Blok adı gerekli");

  const { error } = await supabase.from("blok").update({ ad, kat_sayisi }).eq("id", blok_id);
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}/kurulum`);
}

// ---- Blok sil (yalnız müsait/planlı birimler temizlenir; opsiyon/satış varsa reddeder) ----
export async function blokSil(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const blok_id = String(formData.get("blok_id"));

  const { data: birimler } = await supabase.from("birim").select("durum").eq("blok_id", blok_id);
  const kritik = (birimler ?? []).filter((b) => b.durum !== "musait" && b.durum !== "planli");
  if (kritik.length > 0) {
    hataya(
      `/uretici/proje/${proje_id}`,
      `Blok silinemez: ${kritik.length} birim opsiyonlu/satılmış/durdurulmuş. Önce onları çöz.`,
    );
  }

  await supabase.from("birim").delete().eq("blok_id", blok_id);
  const { error } = await supabase.from("blok").delete().eq("id", blok_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(`/uretici/proje/${proje_id}`, formData, "Blok silindi");
}

// ---- Daire tipi ekle ----
/** Form'dan daire tipi alanlarını oku (ekle + düzelt ortak). */
function tipAlanlari(formData: FormData) {
  const tamsayi = (v: FormDataEntryValue | null) => (v && String(v).trim() ? Number(v) : null);
  return {
    ad: String(formData.get("ad") ?? "").trim(),
    oda: String(formData.get("oda") ?? "").trim() || null,
    net_m2: tamsayi(formData.get("net_m2")),
    taban_fiyat: tamsayi(formData.get("taban_fiyat")),
  };
}

export async function daireTipiEkle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const alanlar = tipAlanlari(formData);
  if (!alanlar.ad) hataya(`/uretici/proje/${proje_id}`, "Daire tipi adı gerekli");

  const { error } = await supabase.from("daire_tipi").insert({ proje_id, ...alanlar });
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(`/uretici/proje/${proje_id}/kurulum`, formData);
}

// ---- Daire tipi düzelt ----
export async function tipGuncelle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const tip_id = String(formData.get("tip_id"));
  const alanlar = tipAlanlari(formData);
  if (!alanlar.ad) hataya(`/uretici/proje/${proje_id}`, "Daire tipi adı gerekli");

  const { error } = await supabase.from("daire_tipi").update(alanlar).eq("id", tip_id);
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}/kurulum`);
}

// ---- Daire tipi sil (birim kullanıyorsa reddeder) ----
export async function tipSil(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const tip_id = String(formData.get("tip_id"));

  const { count } = await supabase
    .from("birim")
    .select("id", { count: "exact", head: true })
    .eq("tip_id", tip_id);
  if ((count ?? 0) > 0) {
    hataya(`/uretici/proje/${proje_id}`, `${count} birim bu tipi kullanıyor — önce onları sil/değiştir.`);
  }

  const { error } = await supabase.from("daire_tipi").delete().eq("id", tip_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(`/uretici/proje/${proje_id}`, formData, "Daire tipi silindi");
}

// ---- Daire tipi plan görseli yükle (daire_tipi.plan_url; daireye basınca modalda görünür) ----
export async function tipGorseliYukle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const tip_id = String(formData.get("tip_id"));
  const geri = `/uretici/proje/${proje_id}/kurulum`;

  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) hataya("/uretici", "Bu projeye erişim yok");

  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) hataya(geri, "Görsel seçilmedi");

  const admin = createAdminClient();
  // eski plan görselini sil (varsa)
  const { data: tip } = await admin.from("daire_tipi").select("plan_url").eq("id", tip_id).single();
  const eskiYol = medyaYolu(tip?.plan_url ?? null);
  if (eskiYol) await admin.storage.from(MEDYA_BUCKET).remove([eskiYol]);

  const uzanti = dosya.name.includes(".") ? dosya.name.split(".").pop()!.toLowerCase() : "png";
  const yol = `${proje_id}/tip/${tip_id}-${randomUUID()}.${uzanti}`;
  const buf = Buffer.from(await dosya.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(MEDYA_BUCKET)
    .upload(yol, buf, { contentType: dosya.type || "image/png", upsert: false });
  if (upErr) hataya(geri, `Yükleme hatası: ${upErr.message}`);

  const { data: pub } = admin.storage.from(MEDYA_BUCKET).getPublicUrl(yol);
  const { error } = await admin.from("daire_tipi").update({ plan_url: pub.publicUrl }).eq("id", tip_id);
  if (error) hataya(geri, error.message);
  revalidatePath(geri);
  redirect(`${geri}?mesaj=${encodeURIComponent("Tip görseli yüklendi")}`);
}

// ---- Generator: tip × kat → birimler (toplu üretim) ----
export async function birimGenerator(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const blok_id = String(formData.get("blok_id"));
  const tip_id = String(formData.get("tip_id"));
  const kat_bas = Number(formData.get("kat_bas"));
  const kat_son = Number(formData.get("kat_son"));
  const daire_basina = Math.max(1, Number(formData.get("daire_basina")) || 1);
  const taban = Number(formData.get("taban_fiyat")) || 0;
  const kat_artis = (Number(formData.get("kat_artis")) || 0) / 100; // % kat şerefiyesi
  const yon = String(formData.get("yon") ?? "").trim() || null;
  const tur = String(formData.get("tur") ?? "daire");

  if (!blok_id || !tip_id || Number.isNaN(kat_bas) || Number.isNaN(kat_son) || kat_son < kat_bas) {
    hataya(`/uretici/proje/${proje_id}`, "Generator girdileri eksik/hatalı (blok, tip, kat aralığı).");
  }
  if ((kat_son - kat_bas + 1) * daire_basina > 500) {
    hataya(`/uretici/proje/${proje_id}`, "Tek seferde en fazla 500 birim üretilebilir.");
  }

  // blok kodu + tip m² + mevcut daire_no'lar (duplicate atlamak için) — tek turda
  const [{ data: blok }, { data: tip }, { data: mevcutlar }] = await Promise.all([
    supabase.from("blok").select("ad").eq("id", blok_id).single(),
    supabase.from("daire_tipi").select("net_m2, brut_m2").eq("id", tip_id).single(),
    supabase.from("birim").select("daire_no").eq("blok_id", blok_id),
  ]);
  const kod = (blok?.ad ?? "X").trim().charAt(0).toUpperCase();
  const mevcutSet = new Set((mevcutlar ?? []).map((b) => b.daire_no));

  const birimler: Record<string, unknown>[] = [];
  let atlanan = 0;
  for (let kat = kat_bas; kat <= kat_son; kat++) {
    for (let d = 1; d <= daire_basina; d++) {
      const daire_no = `${kod}${String(kat).padStart(2, "0")}${String(d).padStart(2, "0")}`;
      if (mevcutSet.has(daire_no)) {
        atlanan++;
        continue;
      }
      const katYuzde = Math.round((kat - 1) * kat_artis * 100);
      birimler.push({
        proje_id,
        blok_id,
        tip_id,
        tur,
        kat,
        daire_no,
        yon,
        net_m2: tip?.net_m2 ?? null,
        brut_m2: tip?.brut_m2 ?? null,
        durum: "musait",
        liste_fiyati: taban ? Math.round(taban * (1 + (kat - 1) * kat_artis)) : null,
        serefiye: taban && katYuzde ? { kat: katYuzde } : null,
      });
    }
  }

  if (birimler.length === 0) {
    hataya(`/uretici/proje/${proje_id}`, `Üretilecek yeni birim yok — ${atlanan} daire zaten mevcut.`);
  }

  const { error } = await supabase.from("birim").insert(birimler);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  const mesaj = `${birimler.length} birim üretildi${atlanan ? ` · ${atlanan} mevcut atlandı` : ""}`;
  basariya(`/uretici/proje/${proje_id}`, formData, mesaj);
}

// ---- Birim durum güncelle (ızgaradan tek tık) ----
const durumSemasi = z.enum([
  "musait",
  "opsiyonlu",
  "satis_beklemede",
  "satildi",
  "stop",
  "planli",
  "kiralandi",
]);

export async function birimDurumGuncelle(formData: FormData) {
  const supabase = await createClient();
  const birim_id = String(formData.get("birim_id"));
  const proje_id = String(formData.get("proje_id"));
  const durum = durumSemasi.safeParse(formData.get("durum"));
  if (!durum.success) hataya(`/uretici/proje/${proje_id}`, "Geçersiz durum");

  // Duruma göre not (opsiyon: kim/ne zaman; satış: alıcı vb.). Boş = notu temizle.
  const notRaw = formData.get("durum_notu");
  const durum_notu =
    typeof notRaw === "string" && notRaw.trim() ? notRaw.trim().slice(0, 280) : null;

  // Tek doğru kaynak: her yazışta son_guncelleme=now() (DEĞİŞMEZ #5)
  const { error } = await supabase
    .from("birim")
    .update({ durum: durum.data, durum_notu, son_guncelleme: new Date().toISOString() })
    .eq("id", birim_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);

  // Audit (MVP-17): satış/opsiyon/durum olayı
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await kayitYaz({
    tip: durumTip(durum.data),
    profileId: user?.id ?? null,
    projeId: proje_id,
    birimId: birim_id,
    payload: { eylem: "uretici_durum", durum: durum.data, durum_notu },
  });

  revalidatePath(`/uretici/proje/${proje_id}`);
  revalidatePath("/uretici/stok");
}

// ---- Tek daire tam düzenle (ızgaradan modal) ----
export async function birimGuncelle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const birim_id = String(formData.get("birim_id"));
  const metin = (v: FormDataEntryValue | null) => (String(v ?? "").trim() ? String(v).trim() : null);
  const sayi = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : Number(s);
  };

  const sKat = sayi(formData.get("serefiye_kat"));
  const sManzara = sayi(formData.get("serefiye_manzara"));
  const guncelle: Record<string, unknown> = {
    daire_no: metin(formData.get("daire_no")),
    kat: sayi(formData.get("kat")),
    liste_fiyati: sayi(formData.get("liste_fiyati")),
    yon: metin(formData.get("yon")),
    manzara: metin(formData.get("manzara")),
    net_m2: sayi(formData.get("net_m2")),
    brut_m2: sayi(formData.get("brut_m2")),
    serefiye: sKat != null || sManzara != null ? { kat: sKat ?? undefined, manzara: sManzara ?? undefined } : null,
    satilabilir: formData.get("satilabilir") === "on",
    son_guncelleme: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("birim")
    .update(guncelle)
    .eq("id", birim_id)
    .eq("proje_id", proje_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  revalidatePath("/uretici/stok");
}

// Lenient UUID — demo id'ler (2222.../7777.../5555...) RFC-uyumsuz (4. grup 8/9/a/b ile başlamıyor);
// z.string().uuid() STRICT onları reddediyordu → tahsis/eklenti "kaydetmiyordu". DB FK bütünlüğü zaten garanti.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Eklenti birimler (otopark/depo → ana daireye bağlı; daireden doğrudan eklenir/silinir) ──
const EKLENTI_TUR = ["otopark", "depo"] as const;

export async function eklentiEkle(formData: FormData): Promise<void> {
  const proje_id = String(formData.get("proje_id"));
  const ana_birim_id = String(formData.get("ana_birim_id"));
  const tur = String(formData.get("tur"));
  const geri = `/uretici/proje/${proje_id}`;
  if (!UUID_RE.test(proje_id) || !UUID_RE.test(ana_birim_id)) hataya(geri, "Geçersiz birim");
  if (!(EKLENTI_TUR as readonly string[]).includes(tur)) hataya(geri, "Eklenti türü otopark veya depo olmalı");
  const fRaw = String(formData.get("liste_fiyati") ?? "").trim();
  const fiyat = fRaw === "" ? null : Number(fRaw);
  if (fiyat != null && (!Number.isFinite(fiyat) || fiyat < 0)) hataya(geri, "Geçersiz fiyat");
  const etiket = String(formData.get("daire_no") ?? "").trim() || (tur === "otopark" ? "Otopark" : "Depo");

  const supabase = await createClient();
  // RLS: üretici yalnız KENDİ projesinin birimine insert edebilir (birim insert policy proje sahipliğini kontrol eder).
  const { error } = await supabase.from("birim").insert({
    proje_id,
    ana_birim_id,
    tur,
    daire_no: etiket,
    liste_fiyati: fiyat,
    para_birimi: "TRY",
    durum: "musait",
    satilabilir: true,
  });
  if (error) hataya(geri, error.message);
  revalidatePath(geri);
  revalidatePath("/uretici/stok");
  basariya(geri, formData, "Eklenti eklendi");
}

export async function eklentiSil(formData: FormData): Promise<void> {
  const proje_id = String(formData.get("proje_id"));
  const birim_id = String(formData.get("birim_id"));
  const geri = `/uretici/proje/${proje_id}`;
  if (!UUID_RE.test(birim_id)) hataya(geri, "Geçersiz birim");
  const supabase = await createClient();
  // Yalnız EKLENTİ silinsin (ana_birim_id dolu) — ana daire bu yolla silinemez.
  const { error } = await supabase.from("birim").delete().eq("id", birim_id).not("ana_birim_id", "is", null);
  if (error) hataya(geri, error.message);
  revalidatePath(geri);
  revalidatePath("/uretici/stok");
  basariya(geri, formData, "Eklenti kaldırıldı");
}

// ── Opsiyon TALEBİ: müteahhit kararı. RPC SECURITY DEFINER (yetki + çift-satış fonksiyon içinde). ──

export async function talepOnayla(talepId: string, gun = 7): Promise<{ ok: boolean; mesaj: string }> {
  if (!UUID_RE.test(talepId)) return { ok: false, mesaj: "Geçersiz talep" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("opsiyon_talep_onayla", { p_talep: talepId, p_gun: gun });
  revalidatePath("/uretici/opsiyonlar");
  revalidatePath("/uretici/stok");
  revalidatePath("/uretici");
  return error ? { ok: false, mesaj: error.message } : { ok: true, mesaj: "Talep onaylandı — opsiyon açıldı" };
}

export async function talepReddet(talepId: string): Promise<{ ok: boolean; mesaj: string }> {
  if (!UUID_RE.test(talepId)) return { ok: false, mesaj: "Geçersiz talep" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("opsiyon_talep_reddet", { p_talep: talepId });
  revalidatePath("/uretici/opsiyonlar");
  return error ? { ok: false, mesaj: error.message } : { ok: true, mesaj: "Talep reddedildi" };
}

// ---- Çoklu seçim: toplu durum/fiyat güncelle ----
function idListesi(formData: FormData): string[] {
  return String(formData.get("birim_idler") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => z.string().uuid().safeParse(s).success);
}

export async function birimTopluGuncelle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const idler = idListesi(formData);
  if (idler.length === 0) hataya(`/uretici/proje/${proje_id}`, "Birim seçilmedi.");

  const guncelle: Record<string, unknown> = { son_guncelleme: new Date().toISOString() };
  const durum = durumSemasi.safeParse(formData.get("durum"));
  if (durum.success) guncelle.durum = durum.data;
  const fiyatRaw = String(formData.get("liste_fiyati") ?? "").trim();
  if (fiyatRaw) guncelle.liste_fiyati = Number(fiyatRaw);

  if (Object.keys(guncelle).length === 1) {
    hataya(`/uretici/proje/${proje_id}`, "Durum veya fiyat gir (en az biri).");
  }

  const { error } = await supabase
    .from("birim")
    .update(guncelle)
    .in("id", idler)
    .eq("proje_id", proje_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);

  // Audit (MVP-17): toplu durum değişimini birim başına logla (yalnız durum değiştiyse)
  if (durum.success) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await kayitlarYaz(
      idler.map((bid) => ({
        tip: durumTip(durum.data),
        profileId: user?.id ?? null,
        projeId: proje_id,
        birimId: bid,
        payload: { eylem: "uretici_durum_toplu", durum: durum.data },
      })),
    );
  }

  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}?mesaj=${encodeURIComponent(`${idler.length} birim güncellendi`)}`);
}

// ---- Çoklu seçim: toplu sil (opsiyon/satış korunur) ----
export async function birimTopluSil(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const idler = idListesi(formData);
  if (idler.length === 0) hataya(`/uretici/proje/${proje_id}`, "Birim seçilmedi.");

  const { data } = await supabase
    .from("birim")
    .select("id, durum")
    .in("id", idler)
    .eq("proje_id", proje_id);
  const silinebilir = (data ?? [])
    .filter((b) => b.durum === "musait" || b.durum === "planli")
    .map((b) => b.id);
  const korunan = (data ?? []).length - silinebilir.length;

  if (silinebilir.length > 0) {
    const { error } = await supabase.from("birim").delete().in("id", silinebilir);
    if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  }
  revalidatePath(`/uretici/proje/${proje_id}`);
  const mesaj =
    `${silinebilir.length} birim silindi` +
    (korunan ? ` · ${korunan} opsiyon/satış korundu` : "");
  redirect(`/uretici/proje/${proje_id}?mesaj=${encodeURIComponent(mesaj)}`);
}

// ---- Excel/CSV import (toplu birim) ----
const GECERLI_DURUM = [
  "musait",
  "opsiyonlu",
  "satis_beklemede",
  "satildi",
  "stop",
  "planli",
  "kiralandi",
];

/** Satırdan esnek sütun okuma (Türkçe/İngilizce başlık varyasyonları). */
function hucre(r: Record<string, unknown>, ...anahtarlar: string[]): unknown {
  for (const k of Object.keys(r)) {
    if (anahtarlar.includes(k.toLowerCase().trim())) return r[k];
  }
  return undefined;
}

export async function excelImport(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const file = formData.get("dosya") as File | null;
  if (!file || file.size === 0) hataya(`/uretici/proje/${proje_id}`, "Excel/CSV dosyası seçilmedi");

  let rows: Record<string, unknown>[];
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } catch {
    hataya(`/uretici/proje/${proje_id}`, "Dosya okunamadı (xlsx/xls/csv olmalı)");
  }

  const { data: bloklar } = await supabase.from("blok").select("id, ad").eq("proje_id", proje_id);
  const { data: tipler } = await supabase.from("daire_tipi").select("id, ad").eq("proje_id", proje_id);
  const blokMap = new Map((bloklar ?? []).map((b) => [String(b.ad).toLowerCase().trim(), b.id]));
  const tipMap = new Map((tipler ?? []).map((t) => [String(t.ad).toLowerCase().trim(), t.id]));

  const birimler: Record<string, unknown>[] = [];
  let atlanan = 0;
  for (const r of rows!) {
    const blokAd = String(hucre(r, "blok", "blok adı", "block") ?? "").toLowerCase().trim();
    const blok_id = blokMap.get(blokAd);
    if (!blok_id) {
      atlanan++;
      continue;
    }
    const tipAd = String(hucre(r, "tip", "daire tipi", "tip adı") ?? "").toLowerCase().trim();
    const durumRaw = String(hucre(r, "durum", "status") ?? "musait").toLowerCase().trim();
    birimler.push({
      proje_id,
      blok_id,
      tip_id: tipMap.get(tipAd) ?? null,
      kat: Number(hucre(r, "kat", "floor")) || null,
      daire_no: String(hucre(r, "daire_no", "daire no", "daire", "no") ?? "").trim() || null,
      durum: GECERLI_DURUM.includes(durumRaw) ? durumRaw : "musait",
      liste_fiyati: Number(hucre(r, "fiyat", "liste_fiyati", "price")) || null,
      net_m2: Number(hucre(r, "net_m2", "net m2", "m2", "metrekare")) || null,
    });
  }

  if (birimler.length === 0) {
    hataya(
      `/uretici/proje/${proje_id}`,
      `Geçerli satır yok (${atlanan} atlandı). Blok adları mevcut bloklarla eşleşmeli. Sütunlar: blok, kat, daire_no, tip, durum, fiyat, net_m2`,
    );
  }
  const { error } = await supabase.from("birim").insert(birimler);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(
    `/uretici/proje/${proje_id}?mesaj=${encodeURIComponent(`${birimler.length} birim eklendi${atlanan ? `, ${atlanan} satır atlandı` : ""}`)}`,
  );
}

// ── Tahsis (MOAT — granüler dağıtım) — ÇOKLU ALICI + daire-bazlı kapsam ──
const TerimSemasi = z.object({
  komisyon_tip: z.enum(["yuzde", "sabit", "yok"]),
  komisyon_deger: z.coerce.number().nonnegative().nullable(),
  munhasir: z.boolean(),
  kontenjan: z.coerce.number().int().positive().nullable(),
  fiyat_gorunur: z.boolean(),
});

export async function tahsisEkle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  if (!UUID_RE.test(proje_id)) hataya("/uretici", "Geçersiz proje");
  const geri = `/uretici/proje/${proje_id}`;

  // ALICILAR — çoklu emlakçı + çoklu ofis + herkes (her alıcı = ayrı tahsis satırı)
  // UUID_RE (lenient) ŞART: strict z.uuid() demo id'leri (2222.../5555...) eler → "kaydetmiyordu" bug'ı.
  const uuidler = (k: string) =>
    formData.getAll(k).map(String).filter((s) => UUID_RE.test(s));
  const alicilar: { hedef_tip: "danisman" | "ofis" | "herkes"; hedef_id: string | null }[] = [
    ...uuidler("emlakci_ids").map((id) => ({ hedef_tip: "danisman" as const, hedef_id: id })),
    ...uuidler("ofis_ids").map((id) => ({ hedef_tip: "ofis" as const, hedef_id: id })),
    ...(formData.get("herkes") === "on" ? [{ hedef_tip: "herkes" as const, hedef_id: null }] : []),
  ];
  if (alicilar.length === 0) hataya(geri, "En az bir alıcı (danışman/ofis/herkes) seç");

  // ŞARTLAR (seçili tüm alıcılara aynı; farklı şart için ayrı kayıt yap)
  const komRaw = String(formData.get("komisyon_deger") ?? "").trim();
  const kotRaw = String(formData.get("kontenjan") ?? "").trim();
  const t = TerimSemasi.safeParse({
    komisyon_tip: formData.get("komisyon_tip") ?? "yuzde",
    komisyon_deger: komRaw === "" ? null : komRaw,
    munhasir: formData.get("munhasir") === "on",
    kontenjan: kotRaw === "" ? null : kotRaw,
    fiyat_gorunur: formData.get("fiyat_gorunur") === "on",
  });
  if (!t.success) hataya(geri, "Geçersiz şart bilgisi");
  const terim = t.data;

  // KAPSAM — kapsam_tip="belirli" ise blok/kat/tip/tür/DAİRE; "tum" ise boş = tüm proje
  const kapsam: Record<string, string[]> = {};
  if (String(formData.get("kapsam_tip")) === "belirli") {
    const al = (k: string) => formData.getAll(k).map(String).filter(Boolean);
    const bloklar = al("bloklar"), katlar = al("katlar"), tipler = al("tipler"), turler = al("turler"), birimler = al("birimler");
    if (bloklar.length) kapsam.bloklar = bloklar;
    if (katlar.length) kapsam.katlar = katlar;
    if (tipler.length) kapsam.tipler = tipler;
    if (turler.length) kapsam.turler = turler;
    if (birimler.length) kapsam.birimler = birimler; // daire-bazlı (RLS emlakci_birim_gorebilir 2026-06-29d)
  }

  const sureRaw = String(formData.get("bitis_gun") ?? "").trim();
  const bitis = sureRaw ? new Date(Date.now() + Number(sureRaw) * 86_400_000).toISOString() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("tahsis").insert(
    alicilar.map((a) => ({
      proje_id,
      hedef_tip: a.hedef_tip,
      hedef_id: a.hedef_id,
      kapsam,
      komisyon_tip: terim.komisyon_tip,
      komisyon_deger: terim.komisyon_deger,
      munhasir: terim.munhasir,
      kontenjan: terim.kontenjan,
      fiyat_gorunur: terim.fiyat_gorunur,
      bitis,
    })),
  );
  if (error) hataya(geri, error.message);
  revalidatePath(geri);
  basariya(geri, formData, `${alicilar.length} tahsis eklendi`);
}

export async function tahsisSil(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("tahsis_id"));
  const proje_id = String(formData.get("proje_id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("tahsis").delete().eq("id", id.data);
  revalidatePath(`/uretici/proje/${proje_id}`);
}

export async function projeTazele(formData: FormData) {
  const id = String(formData.get("proje_id"));
  if (!id) return;

  const supabase = await createClient();
  const simdi = new Date().toISOString();

  // 1. Proje son güncelleme zamanını yenile
  await supabase
    .from("proje")
    .update({ son_guncelleme: simdi })
    .eq("id", id);

  // 2. Tüm birimleri 'stale=false' yap ve son_guncelleme güncelle
  await supabase
    .from("birim")
    .update({ son_guncelleme: simdi, stale: false })
    .eq("proje_id", id);

  revalidatePath(`/uretici/proje/${id}`);
}

// ── Proje medyası: kapak foto · tanıtım envanteri (foto/video/broşür) · resmi belgeler ──
// Yükleme service-role ile (DEĞİŞMEZ #1: yalnız server). Sahiplik RLS select ile doğrulanır.
const MEDYA_BUCKET = "proje-medya";

async function projeSahibiMi(supabase: SupabaseClient, proje_id: string): Promise<boolean> {
  const uid = await ureticiId(supabase);
  if (!uid) return false;
  const { data } = await supabase
    .from("proje")
    .select("id, uretici_id")
    .eq("id", proje_id)
    .single();
  return !!data && data.uretici_id === uid;
}

/**
 * Kapak/galeri/broşür/belge yükle (dosya) ya da tanıtım videosu/dış belge ekle (link).
 * tip ∈ { kapak, foto, video, brosur, ruhsat, iskan, yapi_denetim, otopark, diger }.
 */
export async function medyaYukle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const tip = String(formData.get("tip") ?? "foto");
  const geri = `/uretici/proje/${proje_id}/kurulum`;

  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) hataya("/uretici", "Bu projeye erişim yok");

  const admin = createAdminClient();
  const dosyalar = formData
    .getAll("dosya")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const url = String(formData.get("url") ?? "").trim();
  const ad0 = String(formData.get("ad") ?? "").trim();

  // Salt link (tanıtım videosu / dış belge)
  if (dosyalar.length === 0) {
    if (!url) hataya(geri, "Dosya veya link gerekli");
    const { error } = await admin.from("proje_belge").insert({ proje_id, tip, ad: ad0 || url, url });
    if (error) hataya(geri, error.message);
    revalidatePath(geri);
    basariya(geri, formData, "Eklendi");
  }

  // Kapak tekildir → eski kapağı (dosya + kayıt) temizle
  if (tip === "kapak") {
    const { data: eski } = await admin
      .from("proje_belge")
      .select("id, url")
      .eq("proje_id", proje_id)
      .eq("tip", "kapak");
    for (const e of eski ?? []) {
      const yol = medyaYolu(e.url);
      if (yol) await admin.storage.from(MEDYA_BUCKET).remove([yol]);
      await admin.from("proje_belge").delete().eq("id", e.id);
    }
  }

  for (const f of dosyalar) {
    const uzanti = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "bin";
    const yol = `${proje_id}/${tip}/${randomUUID()}.${uzanti}`;
    const buf = Buffer.from(await f.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(MEDYA_BUCKET)
      .upload(yol, buf, { contentType: f.type || "application/octet-stream", upsert: false });
    if (upErr) hataya(geri, `Yükleme hatası: ${upErr.message}`);
    const { data: pub } = admin.storage.from(MEDYA_BUCKET).getPublicUrl(yol);
    const { error: insErr } = await admin
      .from("proje_belge")
      .insert({ proje_id, tip, ad: ad0 || f.name, url: pub.publicUrl });
    if (insErr) hataya(geri, insErr.message);
  }

  revalidatePath(geri);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(geri, formData, "Yüklendi");
}

export async function medyaSil(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("belge_id"));
  const proje_id = String(formData.get("proje_id"));
  if (!id.success) return;

  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) return;

  const admin = createAdminClient();
  const { data: belge } = await admin
    .from("proje_belge")
    .select("id, url")
    .eq("id", id.data)
    .single();
  if (belge) {
    const yol = medyaYolu(belge.url);
    if (yol) await admin.storage.from(MEDYA_BUCKET).remove([yol]);
    await admin.from("proje_belge").delete().eq("id", belge.id);
  }
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
}

// ── Proje künyesi / imar (ada/parsel/emsal/taks + kunye jsonb) ──
export async function projeKunyeGuncelle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const sayi = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : Number(s);
  };
  const metin = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  const kunye = {
    ruhsat_tarihi: metin(formData.get("ruhsat_tarihi")),
    yapi_denetim: metin(formData.get("yapi_denetim")),
    arsa_alani: sayi(formData.get("arsa_alani")),
    toplam_insaat: sayi(formData.get("toplam_insaat")),
    imar_durumu: metin(formData.get("imar_durumu")),
    kat_karsiligi: formData.get("kat_karsiligi") === "on",
    otopark: metin(formData.get("otopark")), // proje geneli otopark kuralı (ör. "Her daireye 1 kapalı")
    malzeme: String(formData.get("malzeme") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    donati: String(formData.get("donati") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("proje")
    .update({
      ada: metin(formData.get("ada")),
      parsel: metin(formData.get("parsel")),
      emsal: sayi(formData.get("emsal")),
      taks: sayi(formData.get("taks")),
      kunye,
      son_guncelleme: new Date().toISOString(),
    })
    .eq("id", proje_id);
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  basariya(`/uretici/proje/${proje_id}/kurulum`, formData, "Künye güncellendi");
}

// ── Yatırım (Faz-1 yurtiçi: kira getirisi + geri dönüş süresi; para_birimi TRY sabit) ──
// golden_visa_esik / oturum_uygun = Faz-2 (yurtdışı) → bu kolonlara DOKUNMA (sessiz ezme yok).
export async function projeYatirimGuncelle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const sayi = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : Number(s);
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("proje")
    .update({
      para_birimi: "TRY",
      kira_getirisi_pct: sayi(formData.get("kira_getirisi_pct")),
      amortisman_yil: sayi(formData.get("amortisman_yil")),
      son_guncelleme: new Date().toISOString(),
    })
    .eq("id", proje_id);
  if (error) hataya(`/uretici/proje/${proje_id}/kurulum`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(`/uretici/proje/${proje_id}/kurulum`, formData, "Yatırım bilgileri kaydedildi");
}

// ── Ödeme Planı (proje şablonu → tüm birimlere uygulanır; aylık taksit UI'da fiyattan hesaplanır) ──
// Şema: birim.odeme_plani jsonb {pesinat_pct, taksit_sayisi, vade_farki_pct, ara_odemeler:[{ay,pct}]}.
// NOT: db/2026-06-28_odeme-plani.sql migration'ı çalışmadan UPDATE hata verir (graceful).
export async function projeOdemePlaniGuncelle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const sayi = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : Number(s);
  };
  const geri = `/uretici/proje/${proje_id}/kurulum`;
  const pesinat_pct = sayi(formData.get("pesinat_pct"));
  const taksit_sayisi = sayi(formData.get("taksit_sayisi"));
  const vade_farki_pct = sayi(formData.get("vade_farki_pct")) ?? 0;

  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) hataya("/uretici", "Bu projeye erişim yok");
  // Boş submit = kazara tüm planları silme; no-op uyarısı.
  if (pesinat_pct == null && taksit_sayisi == null) {
    basariya(geri, formData, "Ödeme planı için en az peşinat % veya taksit sayısı girin");
  }

  const plan = { pesinat_pct, taksit_sayisi, vade_farki_pct, ara_odemeler: [] as { ay: number; pct: number }[] };
  const { error } = await supabase
    .from("birim")
    .update({ odeme_plani: plan, son_guncelleme: new Date().toISOString() })
    .eq("proje_id", proje_id);
  if (error) hataya(geri, `Ödeme planı kaydedilemedi (migration çalıştı mı?): ${error.message}`);
  revalidatePath(geri);
  revalidatePath(`/uretici/proje/${proje_id}`);
  basariya(geri, formData, "Ödeme planı tüm birimlere uygulandı");
}

// ── Mahal Listesi (proje teslim standardı: her mahal için zemin/duvar/tavan) ──
export async function mahalEkle(formData: FormData) {
  const proje_id = String(formData.get("proje_id"));
  const geri = `/uretici/proje/${proje_id}/kurulum`;
  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) hataya("/uretici", "Bu projeye erişim yok");

  const mahal = String(formData.get("mahal") ?? "").trim();
  if (!mahal) hataya(geri, "Mahal adı gerekli");
  const al = (k: string) => String(formData.get(k) ?? "").trim() || null;

  const { error } = await supabase.from("mahal").insert({
    proje_id,
    mahal,
    zemin: al("zemin"),
    duvar: al("duvar"),
    tavan: al("tavan"),
    marka: al("marka"),
    aciklama: al("aciklama"),
  });
  if (error) hataya(geri, error.message);
  revalidatePath(geri);
  redirect(`${geri}?mesaj=${encodeURIComponent("Mahal eklendi")}`);
}

export async function mahalSil(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("mahal_id"));
  const proje_id = String(formData.get("proje_id"));
  if (!id.success) return;
  const supabase = await createClient();
  if (!(await projeSahibiMi(supabase, proje_id))) return;
  await supabase.from("mahal").delete().eq("id", id.data);
  revalidatePath(`/uretici/proje/${proje_id}/kurulum`);
}
