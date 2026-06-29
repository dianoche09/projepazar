// Kat planı görselleri (2D top-down) — fal.ai FLUX → public/gorseller/ + daire_tipi.plan_url ata.
// Sorun: seed plan_url'e bina DIŞ fotoğrafı koymuştu ("anlaşılmıyor"). Bu, oda tipine göre gerçek plan koyar.
// node scripts/gen-katplan.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
const FAL = env.FAL_KEY || env.FAL_API_KEY || env.FAL_AI_KEY;
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL, SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!FAL) { console.error("HATA: FAL anahtarı yok."); process.exit(1); }
const CIKTI = join(KOK, "public", "gorseller");
mkdirSync(CIKTI, { recursive: true });

const STIL =
  "top-down 2D architectural floor plan, clean technical blueprint, white background, thin black wall lines, furniture as simple top-view symbols (beds, sofa, dining table, kitchen counter, bathroom fixtures), dimension lines, minimalist monochrome CAD drawing, no text, no labels, no people, no color, high detail";

const PLANLAR = [
  { ad: "katplan-studyo", icerik: "compact studio apartment with one open living-sleeping area, kitchenette, one bathroom, small balcony" },
  { ad: "katplan-1-1", icerik: "1-bedroom apartment with living room, one bedroom, kitchen, one bathroom, balcony" },
  { ad: "katplan-2-1", icerik: "apartment with a living room, two bedrooms, kitchen, one bathroom, hallway, balcony" },
  { ad: "katplan-3-1", icerik: "spacious apartment with large living room, three bedrooms, kitchen, two bathrooms, hallway, two balconies" },
  { ad: "katplan-4-1", icerik: "large duplex apartment with grand living room, four bedrooms, kitchen, three bathrooms, corridor, multiple balconies" },
  { ad: "katplan-ticari", icerik: "commercial retail unit with open shop floor, back storage room, small office, one restroom, wide street-facing storefront" },
];

async function uret(is) {
  const r = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Floor plan of ${is.icerik}. ${STIL}`,
      image_size: "square_hd",
      num_images: 1,
      num_inference_steps: 30,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    }),
  });
  if (!r.ok) throw new Error(`fal ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const data = await r.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("url yok");
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(join(CIKTI, `${is.ad}.jpg`), buf);
  return `${is.ad}.jpg (${Math.round(buf.length / 1024)}KB)`;
}

console.log(`${PLANLAR.length} kat planı üretiliyor…`);
for (const is of PLANLAR) {
  try { console.log("  ✓ " + (await uret(is))); } catch (e) { console.log(`  ✗ ${is.ad} — ${e.message}`); }
}

// --- daire_tipi.plan_url ata (oda → plan dosyası) ---
if (!SB_URL || !SB_KEY) { console.log("Supabase anahtarı yok, atama atlandı."); process.exit(0); }
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
const planYol = (oda) => {
  const o = (oda || "").toLowerCase();
  if (o.includes("1+0") || o.includes("stüdyo") || o.includes("studyo")) return "/gorseller/katplan-studyo.jpg";
  if (o.includes("1+1")) return "/gorseller/katplan-1-1.jpg";
  if (o.includes("2+1")) return "/gorseller/katplan-2-1.jpg";
  if (o.includes("3+1")) return "/gorseller/katplan-3-1.jpg";
  if (o.includes("4+1")) return "/gorseller/katplan-4-1.jpg";
  if (o.includes("ticari") || o.includes("ofis") || o.includes("dükkan") || o.includes("dukkan")) return "/gorseller/katplan-ticari.jpg";
  return "/gorseller/katplan-2-1.jpg";
};
const { data: tipler } = await sb.from("daire_tipi").select("id, oda");
let n = 0;
for (const t of tipler ?? []) { await sb.from("daire_tipi").update({ plan_url: planYol(t.oda) }).eq("id", t.id); n++; }
console.log(`daire_tipi.plan_url güncellendi: ${n} tip`);
