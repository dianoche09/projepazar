// ÖZEL TAHSİS demo — "herkes" yerine üretici ŞU emlakçıya/ofise tahsis eder (kapalı-devre).
// Kapsam/münhasır/komisyon/fiyat-görünürlük çeşitliliği gösterir. node scripts/seed-tahsis.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = {};
for (const s of readFileSync(".env.local", "utf8").split("\n")) {
  const m = s.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BIR = "22222222-2222-2222-2222-222222222222";   // Emlakçı Bir (demo login) — ofis: Demo Gayrimenkul
const IKI = "33333333-3333-3333-3333-333333333333";   // Emlakçı İki — ofis: Demo Gayrimenkul
const UC = "44444444-4444-4444-4444-444444444444";    // Emlakçı Üç (ofissiz)
const OFIS = "55555555-5555-5555-5555-555555555555";  // Demo Gayrimenkul (Bir + İki)
const P = {
  cankaya: "77777777-7777-7777-7777-777777777777",
  test: "f2c40175-e1d9-4cca-9fec-555d71b9539e",
  vadi: "24b90cf5-daf4-4d0f-b3b2-46459c236150",
  marina: "668b2999-2524-4cd0-8295-d20e475e7c20",
  bahce: "8595a2b9-6fb2-42e9-a5b1-9689364ef450",
  kule: "ca7ccba2-27ea-485d-8658-11b06817e7cf",
  sahil: "3976ab4a-2b78-4a97-8c6f-6bb36cc502db",
};

// hedef_tip: 'danisman' (özel emlakçı) | 'ofis' (tüm ofis) | 'herkes' (yayın). komisyon_tip: yuzde|sabit|yok
const ALLOC = [
  // Emlakçı Bir — 3 özel proje (+ ofis üzerinden Test Konakları)
  { p: P.cankaya, tip: "danisman", hedef: BIR, kt: "yuzde", kd: 2.5, mun: false, gor: true, kapsam: {}, kont: null },
  { p: P.vadi, tip: "danisman", hedef: BIR, kt: "yuzde", kd: 2, mun: false, gor: true, kapsam: {}, kont: null },
  { p: P.marina, tip: "danisman", hedef: BIR, kt: "sabit", kd: 50000, mun: true, gor: true, kapsam: {}, kont: 8 }, // MÜNHASIR + kontenjan
  // Ofis tahsisi — Demo Gayrimenkul'deki HERKES (Bir + İki) görür
  { p: P.test, tip: "ofis", hedef: OFIS, kt: "yuzde", kd: 2, mun: false, gor: true, kapsam: {}, kont: null },
  // Emlakçı İki
  { p: P.bahce, tip: "danisman", hedef: IKI, kt: "yuzde", kd: 3, mun: false, gor: true, kapsam: {}, kont: null },
  { p: P.kule, tip: "danisman", hedef: IKI, kt: "yuzde", kd: 2.5, mun: false, gor: false, kapsam: {}, kont: null }, // fiyat GİZLİ
  // Emlakçı Üç — 1 tam proje + Çankaya'nın SADECE ticari birimleri (kapsam dilimi)
  { p: P.sahil, tip: "danisman", hedef: UC, kt: "yuzde", kd: 2, mun: false, gor: true, kapsam: {}, kont: null },
  { p: P.cankaya, tip: "danisman", hedef: UC, kt: "yuzde", kd: 1.5, mun: false, gor: true, kapsam: { turler: ["dukkan", "ofis"] }, kont: null }, // SCOPED: sadece ticari
];

async function main() {
  const { error: delErr } = await sb.from("tahsis").delete().not("id", "is", null);
  if (delErr) { console.error("delete:", delErr.message); process.exit(1); }
  console.log("eski tahsisler silindi.");
  const rows = ALLOC.map((a) => ({
    proje_id: a.p, hedef_tip: a.tip, hedef_id: a.hedef, kapsam: a.kapsam,
    munhasir: a.mun, kontenjan: a.kont, fiyat_gorunur: a.gor, komisyon_tip: a.kt, komisyon_deger: a.kd,
  }));
  const { error } = await sb.from("tahsis").insert(rows);
  if (error) { console.error("insert:", error.message); process.exit(1); }
  console.log(`✓ ${rows.length} ÖZEL tahsis:`);
  console.log("  Emlakçı Bir: Çankaya Vadi, Vadi Panorama, Marina Loft (münhasır) + Test Konakları (ofis) = 4");
  console.log("  Emlakçı İki: Bahçeşehir, Kule 42 (fiyat gizli) + Test Konakları (ofis) = 3");
  console.log("  Emlakçı Üç: Sahil Teras + Çankaya Vadi'nin SADECE ticari birimleri (kapsam) = 1.5");
}
main().catch((e) => { console.error(e); process.exit(1); });
