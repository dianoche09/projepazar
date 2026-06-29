// ProjePazar — 6-7 PROJE seed (çok müteahhit, ticari alan, farklı kat planı). Demo. "En son temizleriz."
// node scripts/seed-projeler.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
function envOku() {
  const yol = join(KOK, ".env.local");
  if (!existsSync(yol)) return {};
  const o = {};
  for (const s of readFileSync(yol, "utf8").split("\n")) {
    const m = s.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return o;
}
const env = { ...envOku(), ...process.env };
const URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("HATA: SUPABASE URL/SERVICE_ROLE yok."); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const gunOnce = (g) => new Date(Date.now() - g * 86_400_000 - rnd(86_400_000)).toISOString();
const RENDERS = ["/gorseller/proje-cankaya-vadi.jpg","/gorseller/proje-test-konaklari.jpg","/gorseller/proje-bahce-evleri.jpg","/gorseller/proje-kule-rezidans.jpg","/gorseller/proje-sahil-konutlari.jpg"];
const DONATI = ["Yüzme Havuzu","Fitness & SPA","Sauna","Kapalı Otopark","7/24 Güvenlik","Çocuk Oyun Alanı","Sosyal Tesis","Yürüyüş Parkuru"];
const MALZEME = ["Daikin VRV Klima","Ankastre Set (Bosch)","Akıllı Ev Sistemi","Granit Tezgah","Lamine Parke","Çelik Kapı"];
const MAHALLER = [["Salon","Lamine parke","Saten boya","Kartonpiyer"],["Yatak Odası","Lamine parke","Saten boya","Düz alçı"],["Mutfak","Seramik","Cam panel","Asma tavan"],["Banyo","Seramik","Tam boy fayans","Su yalıtımlı"],["Antre","Porselen","Saten boya","Kartonpiyer"]];
const YON = ["Kuzey","Güney","Doğu","Batı","Güneydoğu","Güneybatı"];
const MANZARA = ["Deniz","Şehir","Orman","Havuz","Bahçe","Vadi"];
// daire tipleri (konut + TİCARİ)
const TIP_KONUT = [
  { ad: "1+0 Stüdyo", oda: "1+0", net: 48, brut: 62, taban: 2_400_000, tur: "daire" },
  { ad: "1+1", oda: "1+1", net: 65, brut: 82, taban: 3_200_000, tur: "daire" },
  { ad: "2+1", oda: "2+1", net: 95, brut: 118, taban: 4_600_000, tur: "daire" },
  { ad: "3+1", oda: "3+1", net: 135, brut: 165, taban: 6_800_000, tur: "daire" },
  { ad: "4+1 Dubleks", oda: "4+1", net: 190, brut: 230, taban: 9_500_000, tur: "daire" },
];
const TIP_TICARI = [
  { ad: "Dükkan", oda: "Ticari", net: 55, brut: 70, taban: 5_500_000, tur: "dukkan" },
  { ad: "Ofis", oda: "Ofis", net: 80, brut: 100, taban: 6_000_000, tur: "ofis" },
];
const DURUMLAR = ["musait", "musait", "musait", "musait", "musait", "opsiyonlu", "satildi"];

async function projeKur(uretici_id, ad, il, ilce, gorsel) {
  const { data: proje, error } = await sb.from("proje").insert({
    uretici_id, ad, ulke: "TR", il, ilce, mahalle: pick(["Merkez", "Yenimahalle", "Bağlıca", "Çamlık"]),
    ada: String(1000 + rnd(8000)), parsel: String(1 + rnd(40)), emsal: (1.5 + Math.random() * 1.5).toFixed(2), taks: "0.30",
    baslama_tarihi: "2024-02-01", teslim_tarihi: pick(["2026-12-01", "2027-06-01", "2027-12-01"]), iskan_tarihi: "2027-09-01",
    insaat_asamasi: pick(["temel", "kaba_insaat", "ince_insaat", "cevre_duzenleme"]), ilerleme_yuzde: 30 + rnd(60), etap: pick(["1. Etap", null]),
    belge_dogrulandi: true, para_birimi: "TRY", kira_getirisi_pct: 6 + rnd(6), amortisman_yil: 12 + rnd(8),
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    kunye: { imar_durumu: "Konut + Ticari", arsa_alani: 5000 + rnd(9000), toplam_insaat: 15000 + rnd(25000), ruhsat_tarihi: "2024-03", yapi_denetim: "Güven Yapı Denetim", otopark: "Kapalı + açık", donati: DONATI.slice(0, 5 + rnd(3)), malzeme: MALZEME.slice(0, 4 + rnd(2)) },
  }).select("id").single();
  if (error) { console.log(`  ✗ ${ad}: ${error.message}`); return; }
  const pid = proje.id;

  // bloklar (2-3)
  const blokAdlar = ["A", "B", "C"].slice(0, 2 + rnd(2));
  const { data: bloklar } = await sb.from("blok").insert(blokAdlar.map((b) => ({ proje_id: pid, ad: b, kat_sayisi: 6 + rnd(8) }))).select("id, ad, kat_sayisi");

  // daire tipleri: 3-4 konut + 1-2 ticari
  const tipSec = [...TIP_KONUT].sort(() => Math.random() - 0.5).slice(0, 3 + rnd(2)).concat([...TIP_TICARI].sort(() => Math.random() - 0.5).slice(0, 1 + rnd(2)));
  const { data: tipler } = await sb.from("daire_tipi").insert(tipSec.map((t) => ({ proje_id: pid, ad: t.ad, oda: t.oda, net_m2: t.net, brut_m2: t.brut, taban_fiyat: t.taban, plan_url: pick(RENDERS), para_birimi: "TRY" }))).select("id, oda, net_m2, brut_m2, taban_fiyat");
  const konutTipler = (tipler ?? []).filter((t) => !["Ticari", "Ofis"].includes(t.oda));
  const ticariTipler = (tipler ?? []).filter((t) => ["Ticari", "Ofis"].includes(t.oda));

  // birimler: her blok, her kat 3-4 daire; zemin kat = ticari (varsa)
  const birimRows = [];
  for (const blok of bloklar ?? []) {
    const katN = blok.kat_sayisi ?? 8;
    for (let kat = 0; kat <= katN; kat++) {
      const ticariKat = kat === 0 && ticariTipler.length;
      const sayi = ticariKat ? 2 + rnd(2) : 3 + rnd(2);
      for (let n = 1; n <= sayi; n++) {
        const tip = ticariKat ? pick(ticariTipler) : pick(konutTipler.length ? konutTipler : tipler);
        if (!tip) continue;
        const katKatki = Math.round((tip.taban_fiyat ?? 0) * (kat * 0.012));
        birimRows.push({
          proje_id: pid, blok_id: blok.id, tip_id: tip.id, tur: ticariKat ? (tip.oda === "Ofis" ? "ofis" : "dukkan") : "daire",
          kat, daire_no: `${blok.ad}${kat}${String(n).padStart(2, "0")}`, durum: pick(DURUMLAR), satilabilir: true,
          liste_fiyati: (tip.taban_fiyat ?? 0) + katKatki, para_birimi: "TRY",
          net_m2: tip.net_m2, brut_m2: tip.brut_m2, yon: pick(YON), manzara: pick(MANZARA),
          serefiye: { kat: 6, manzara: 4 },
          odeme_plani: { pesinat_pct: 40, taksit_sayisi: 24, ara_odemeler: [{ ay: 12, pct: 10 }], vade_farki_pct: 0, para_birimi: "TRY" },
        });
      }
    }
  }
  // batch insert (max ~500)
  for (let i = 0; i < birimRows.length; i += 200) await sb.from("birim").insert(birimRows.slice(i, i + 200));
  const { data: birimIds } = await sb.from("birim").select("id").eq("proje_id", pid);
  const bIds = (birimIds ?? []).map((b) => b.id);

  // medya
  await sb.from("proje_belge").insert([
    { proje_id: pid, tip: "kapak", ad: "Kapak", url: gorsel, dogrulandi: true },
    ...RENDERS.filter((r) => r !== gorsel).slice(0, 4).map((f, k) => ({ proje_id: pid, tip: "foto", ad: `Dış Görsel ${k + 1}`, url: f, dogrulandi: true })),
    { proje_id: pid, tip: "video", ad: "Tanıtım Videosu", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", dogrulandi: true },
    { proje_id: pid, tip: "brosur", ad: "Broşür (PDF)", url: gorsel, dogrulandi: true },
    { proje_id: pid, tip: "ruhsat", ad: "Yapı Ruhsatı", url: gorsel, dogrulandi: true },
  ]);
  // mahal
  await sb.from("mahal").insert(MAHALLER.map(([mahal, zemin, duvar, tavan], k) => ({ proje_id: pid, mahal, zemin, duvar, tavan, sira: k })));
  // tahsis YOK — proje TAHSİSSİZ başlar (kapalı-devre: üretici BİLİNÇLİ tahsis eder, "herkes" değil).
  // Demo tahsis dağıtımı ayrı script: scripts/seed-tahsis.mjs (danisman/ofis bazlı özel tahsis).

  return { pid, ad, birim: bIds.length };
}

async function olaylar(pid, bIds, emlakciIds) {
  const rows = [];
  for (let k = 0; k < 20 + rnd(20); k++) rows.push({ tip: "goruntuleme", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: pid, birim_id: pick(bIds.length ? bIds : [null]), payload: { kaynak: "mikrosite" }, created_at: gunOnce(rnd(7)) });
  for (let k = 0; k < 6; k++) rows.push({ tip: "paylasim", profile_id: pick(emlakciIds.length ? emlakciIds : [null]), proje_id: pid, birim_id: pick(bIds.length ? bIds : [null]), payload: {}, created_at: gunOnce(rnd(7)) });
  if (rows.length) await sb.from("events").insert(rows);
}

async function main() {
  const { data: emlakcilar } = await sb.from("profiles").select("id").eq("rol", "emlakci").limit(3);
  const emlakciIds = (emlakcilar ?? []).map((e) => e.id);

  // idempotent: önceki demo üreticileri + projeleri (cascade) temizle (re-run güvenli)
  await sb.from("uretici").delete().in("vergi_no", ["1234567801", "1234567802", "1234567803"]);

  // Demosaha üretici id (mevcut projeden)
  const { data: mevcut } = await sb.from("proje").select("uretici_id, ad").limit(5);
  const demosaha = mevcut?.[0]?.uretici_id ?? null;

  // yeni üreticiler (sahip_id null — login yok; admin+emlakçı görür)
  const yeniUret = [
    { ad: "Mar771 İnşaat", vergi_no: "1234567801", count: 2 },
    { ad: "Deniz Yapı A.Ş.", vergi_no: "1234567802", count: 1 },
    { ad: "Akkent Construction", vergi_no: "1234567803", count: 1 },
  ];
  const plan = [];
  if (demosaha) plan.push({ uretici_id: demosaha, count: 1, ad: "Demosaha İnşaat" }); // +1 → toplam 3
  for (const u of yeniUret) {
    const { data: uret, error } = await sb.from("uretici").insert({ ad: u.ad, vergi_no: u.vergi_no, dogrulanmis: true, sahip_id: null }).select("id").single();
    if (error) { console.log(`üretici ${u.ad}: ${error.message}`); continue; }
    plan.push({ uretici_id: uret.id, count: u.count, ad: u.ad });
  }

  const ADLAR = ["Vadi Panorama", "Marina Loft Rezidans", "Bahçeşehir Yaşam", "Kule 42", "Sahil Teras Evleri", "Park Vista", "Yeşil Tepe Konakları"];
  const KONUM = [["İstanbul", "Kadıköy"], ["İzmir", "Karşıyaka"], ["Antalya", "Konyaaltı"], ["Bursa", "Nilüfer"], ["Ankara", "Çankaya"], ["İstanbul", "Beşiktaş"]];
  let ai = 0, gi = 0;
  console.log("Projeler oluşturuluyor…");
  for (const pl of plan) {
    for (let c = 0; c < pl.count; c++) {
      const ad = ADLAR[ai % ADLAR.length]; ai++;
      const [il, ilce] = KONUM[gi % KONUM.length]; gi++;
      const r = await projeKur(pl.uretici_id, ad, il, ilce, RENDERS[gi % RENDERS.length]);
      if (r) {
        const { data: bd } = await sb.from("birim").select("id").eq("proje_id", r.pid);
        await olaylar(r.pid, (bd ?? []).map((b) => b.id), emlakciIds);
        console.log(`  ✓ ${pl.ad} → ${ad} (${r.birim} birim, ticari dahil)`);
      }
    }
  }
  console.log("bitti.");
}
main().catch((e) => { console.error("seed hatası:", e); process.exit(1); });
