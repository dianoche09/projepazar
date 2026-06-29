// ProjePazar — ZENGİN DEMO VERİ seed (service-role, canlı DB). "En son temizleriz."
// Çalıştır:  node scripts/seed-demo.mjs
// Mevcut projeleri zenginleştirir: künye/kira/oturum/golden-vize + ödeme planı + medya
// (fal.ai görselleri) + mahal + tahsis + görüntüleme/paylaşım/opsiyon event'leri.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
function envOku() {
  const yol = join(KOK, ".env.local");
  if (!existsSync(yol)) return {};
  const o = {};
  for (const satir of readFileSync(yol, "utf8").split("\n")) {
    const m = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return o;
}
const env = { ...envOku(), ...process.env };
const URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("HATA: SUPABASE URL / SERVICE_ROLE anahtarı .env.local'de yok.");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// — yardımcılar —
const RENDERS = [
  "/gorseller/proje-cankaya-vadi.jpg",
  "/gorseller/proje-test-konaklari.jpg",
  "/gorseller/proje-bahce-evleri.jpg",
  "/gorseller/proje-kule-rezidans.jpg",
  "/gorseller/proje-sahil-konutlari.jpg",
];
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const gunOnce = (g) => new Date(Date.now() - g * 86_400_000 - rnd(86_400_000)).toISOString();

const DONATI = ["Yüzme Havuzu", "Fitness & SPA", "Sauna", "Kapalı Otopark", "7/24 Güvenlik", "Çocuk Oyun Alanı", "Sosyal Tesis", "Yürüyüş Parkuru", "Jeneratör"];
const MALZEME = ["Daikin VRV Klima", "Ankastre Set (Bosch)", "Akıllı Ev Sistemi", "Granit Mutfak Tezgahı", "Lamine Parke", "Çelik Kapı", "Isıcamlı PVC Doğrama", "Görüntülü Diafon"];
const MAHALLER = [
  ["Salon", "Lamine parke", "Saten boya", "Kartonpiyer + spot"],
  ["Yatak Odası", "Lamine parke", "Saten boya", "Düz alçı"],
  ["Mutfak", "Granit / seramik", "Fayans + cam panel", "Asma tavan"],
  ["Banyo", "Seramik", "Tam boy fayans", "Su yalıtımlı asma tavan"],
  ["Antre", "Porselen seramik", "Saten boya", "Kartonpiyer"],
  ["Balkon / Teras", "Dış mekan seramik", "Dış cephe sıva", "—"],
];
const YON = ["Kuzey", "Güney", "Doğu", "Batı", "Güneydoğu", "Güneybatı"];
const MANZARA = ["Deniz", "Şehir", "Orman", "Havuz", "Bahçe", "Vadi"];

async function main() {
  const { data: projeler, error } = await sb.from("proje").select("id, ad, para_birimi");
  if (error) {
    console.error("Proje çekilemedi:", error.message);
    process.exit(1);
  }
  if (!projeler?.length) {
    console.log("Proje yok — önce kurulum gerek.");
    return;
  }
  const { data: ofisler } = await sb.from("ofis").select("id").limit(1);
  const ofisId = ofisler?.[0]?.id ?? null;
  const { data: emlakcilar } = await sb.from("profiles").select("id").eq("rol", "emlakci").limit(3);
  const emlakciIds = (emlakcilar ?? []).map((e) => e.id);

  console.log(`${projeler.length} proje zenginleştiriliyor…`);

  for (let i = 0; i < projeler.length; i++) {
    const p = projeler[i];
    const img = RENDERS[i % RENDERS.length];
    const para = p.para_birimi || "TRY";

    // 1) Proje künye + yatırım + medya alanları
    await sb
      .from("proje")
      .update({
        belge_dogrulandi: true,
        insaat_asamasi: pick(["kaba_insaat", "ince_isler", "iskan_oncesi"]),
        ilerleme_yuzde: 35 + rnd(55),
        baslama_tarihi: "2024-02-01",
        teslim_tarihi: pick(["2026-12-01", "2027-06-01", "2027-12-01"]),
        iskan_tarihi: "2027-09-01",
        etap: pick(["1. Etap", "2. Etap", null]),
        lat: 39.86 + Math.random() * 0.3,
        lng: 32.75 + Math.random() * 0.3,
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        kira_getirisi_pct: 6 + rnd(6), // yurtiçi yatırımcı (kira getirisi) — Faz 1 OK
        amortisman_yil: 12 + rnd(8),
        // Faz 1 = YURTİÇİ: golden vize / oturum (yabancı modülü, Faz 2) → boş
        oturum_uygun: false,
        golden_visa_esik: null,
        kunye: {
          imar_durumu: "Konut (Ayrık Nizam)",
          arsa_alani: 6000 + rnd(8000),
          toplam_insaat: 18000 + rnd(20000),
          ruhsat_tarihi: "2024-03",
          yapi_denetim: "Güven Yapı Denetim A.Ş.",
          otopark: "Kapalı + açık (1.5 / daire)",
          donati: DONATI.slice(0, 6 + rnd(3)),
          malzeme: MALZEME.slice(0, 5 + rnd(3)),
        },
      })
      .eq("id", p.id);

    // 2) Birimlere ödeme planı + serefiye + yön/manzara (toplu + örnekleme)
    await sb
      .from("birim")
      .update({
        odeme_plani: { pesinat_pct: 40, taksit_sayisi: 24, ara_odemeler: [{ ay: 12, pct: 10 }], vade_farki_pct: 0, para_birimi: para },
        serefiye: { kat: 6, manzara: 4 },
      })
      .eq("proje_id", p.id);

    // yön/manzara: boş olanlara örnek değer (birkaç batch)
    const { data: birimler } = await sb
      .from("birim")
      .select("id, liste_fiyati, yon")
      .eq("proje_id", p.id);
    const bIds = (birimler ?? []).map((b) => b.id);
    // yön/manzara/kira — küçük gruplarla
    for (let j = 0; j < bIds.length; j += 1) {
      const b = birimler[j];
      if (!b.yon) {
        await sb
          .from("birim")
          .update({ yon: pick(YON), manzara: pick(MANZARA), kira_bedeli: b.liste_fiyati ? Math.round(b.liste_fiyati * 0.004) : null })
          .eq("id", b.id);
      }
    }

    // 3) Medya (kapak + fotoğraflar + video) — yoksa ekle
    const { count: belgeSay } = await sb.from("proje_belge").select("id", { count: "exact", head: true }).eq("proje_id", p.id);
    if ((belgeSay ?? 0) < 3) {
      const fotolar = RENDERS.filter((_, k) => k !== i % RENDERS.length).slice(0, 4);
      await sb.from("proje_belge").insert([
        { proje_id: p.id, tip: "kapak", ad: "Kapak Görseli", url: img, dogrulandi: true },
        ...fotolar.map((f, k) => ({ proje_id: p.id, tip: "foto", ad: `Dış Görsel ${k + 1}`, url: f, dogrulandi: true })),
        { proje_id: p.id, tip: "video", ad: "Tanıtım Videosu", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", dogrulandi: true },
        { proje_id: p.id, tip: "brosur", ad: "Proje Broşürü (PDF)", url: img, dogrulandi: true },
        { proje_id: p.id, tip: "ruhsat", ad: "Yapı Ruhsatı", url: img, dogrulandi: true },
      ]);
    }

    // 4) Mahal listesi — yoksa ekle
    const { count: mahalSay } = await sb.from("mahal").select("id", { count: "exact", head: true }).eq("proje_id", p.id);
    if ((mahalSay ?? 0) === 0) {
      await sb.from("mahal").insert(
        MAHALLER.map(([mahal, zemin, duvar, tavan], k) => ({ proje_id: p.id, mahal, zemin, duvar, tavan, sira: k })),
      );
    }

    // 5) Tahsis — yoksa ekle (herkese %2 + ofise münhasır)
    const { count: tahsisSay } = await sb.from("tahsis").select("id", { count: "exact", head: true }).eq("proje_id", p.id);
    if ((tahsisSay ?? 0) === 0) {
      const rows = [{ proje_id: p.id, hedef_tip: "herkes", hedef_id: null, kapsam: {}, komisyon_tip: "yuzde", komisyon_deger: 2, fiyat_gorunur: true }];
      if (ofisId) rows.push({ proje_id: p.id, hedef_tip: "ofis", hedef_id: ofisId, kapsam: {}, komisyon_tip: "yuzde", komisyon_deger: 3, munhasir: true, fiyat_gorunur: true });
      await sb.from("tahsis").insert(rows);
    }

    // 6) Olay sinyalleri — görüntüleme (son 7g) + paylaşım/opsiyon/satış (Talep Radarı dolsun)
    const olaylar = [];
    const N = 25 + rnd(25);
    for (let k = 0; k < N; k++) {
      olaylar.push({ tip: "goruntuleme", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: p.id, birim_id: pick(bIds.length ? bIds : [null]), payload: { kaynak: "mikrosite" }, created_at: gunOnce(rnd(7)) });
    }
    for (let k = 0; k < 8; k++) olaylar.push({ tip: "paylasim", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: p.id, birim_id: pick(bIds.length ? bIds : [null]), payload: { kanal: "whatsapp" }, created_at: gunOnce(rnd(7)) });
    for (let k = 0; k < 4; k++) olaylar.push({ tip: "opsiyon", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: p.id, birim_id: pick(bIds.length ? bIds : [null]), payload: {}, created_at: gunOnce(rnd(5)) });
    for (let k = 0; k < 2; k++) olaylar.push({ tip: "satis", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: p.id, birim_id: pick(bIds.length ? bIds : [null]), payload: {}, created_at: gunOnce(rnd(10)) });
    if (olaylar.length) await sb.from("events").insert(olaylar);

    console.log(`  ✓ ${p.ad} — künye+ödeme+medya+mahal+tahsis+${olaylar.length} olay`);
  }
  console.log("bitti.");
}

main().catch((e) => {
  console.error("seed hatası:", e);
  process.exit(1);
});
