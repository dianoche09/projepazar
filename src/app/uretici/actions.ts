"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

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

// ---- Proje oluştur ----
const projeSemasi = z.object({
  ad: z.string().trim().min(2, "Proje adı en az 2 karakter olmalı"),
  il: z.string().trim().optional(),
  ilce: z.string().trim().optional(),
  mahalle: z.string().trim().optional(),
  ada: z.string().trim().optional(),
  parsel: z.string().trim().optional(),
  teslim_tarihi: z.string().trim().optional(),
});

export async function projeOlustur(formData: FormData) {
  const supabase = await createClient();
  const uid = await ureticiId(supabase);
  if (!uid) {
    hataya("/uretici", "Üretici kaydı bulunamadı — proje oluşturmak için 'uretici' rolüyle giriş yapın.");
  }

  const sonuc = projeSemasi.safeParse(Object.fromEntries(formData));
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
      teslim_tarihi: d.teslim_tarihi || null,
    })
    .select("id")
    .single();
  if (error) hataya("/uretici/proje/yeni", error.message);

  revalidatePath("/uretici");
  redirect(`/uretici/proje/${proje!.id}`);
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
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}`);
}

// ---- Daire tipi ekle ----
export async function daireTipiEkle(formData: FormData) {
  const supabase = await createClient();
  const proje_id = String(formData.get("proje_id"));
  const ad = String(formData.get("ad") ?? "").trim();
  const oda = String(formData.get("oda") ?? "").trim() || null;
  const net_m2 = formData.get("net_m2") ? Number(formData.get("net_m2")) : null;
  const taban_fiyat = formData.get("taban_fiyat") ? Number(formData.get("taban_fiyat")) : null;
  if (!ad) hataya(`/uretici/proje/${proje_id}`, "Daire tipi adı gerekli");

  const { error } = await supabase
    .from("daire_tipi")
    .insert({ proje_id, ad, oda, net_m2, taban_fiyat });
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}`);
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

  if (!blok_id || !tip_id || Number.isNaN(kat_bas) || Number.isNaN(kat_son) || kat_son < kat_bas) {
    hataya(`/uretici/proje/${proje_id}`, "Generator girdileri eksik/hatalı (blok, tip, kat aralığı).");
  }
  if ((kat_son - kat_bas + 1) * daire_basina > 500) {
    hataya(`/uretici/proje/${proje_id}`, "Tek seferde en fazla 500 birim üretilebilir.");
  }

  const { data: blok } = await supabase.from("blok").select("ad").eq("id", blok_id).single();
  const kod = (blok?.ad ?? "X").trim().charAt(0).toUpperCase();

  const birimler: Record<string, unknown>[] = [];
  for (let kat = kat_bas; kat <= kat_son; kat++) {
    for (let d = 1; d <= daire_basina; d++) {
      birimler.push({
        proje_id,
        blok_id,
        tip_id,
        kat,
        daire_no: `${kod}${String(kat).padStart(2, "0")}${String(d).padStart(2, "0")}`,
        durum: "musait",
        liste_fiyati: taban ? Math.round(taban * (1 + (kat - 1) * kat_artis)) : null,
      });
    }
  }

  const { error } = await supabase.from("birim").insert(birimler);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
  redirect(`/uretici/proje/${proje_id}?mesaj=${encodeURIComponent(`${birimler.length} birim üretildi`)}`);
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

  // Tek doğru kaynak: her yazışta son_guncelleme=now() (DEĞİŞMEZ #5)
  const { error } = await supabase
    .from("birim")
    .update({ durum: durum.data, son_guncelleme: new Date().toISOString() })
    .eq("id", birim_id);
  if (error) hataya(`/uretici/proje/${proje_id}`, error.message);
  revalidatePath(`/uretici/proje/${proje_id}`);
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
