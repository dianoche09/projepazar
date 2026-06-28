// ProjePazar görsel üretim — fal.ai FLUX. .env.local'den anahtarı kendi okur (yazdırmaz).
// Çalıştır:  node scripts/gen-gorseller.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- .env.local parse (anahtar değeri loglanmaz) ---
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
const FAL = env.FAL_KEY || env.FAL_API_KEY || env.FAL_AI_KEY || env.FALAI_KEY;
if (!FAL) {
  console.error("HATA: FAL anahtarı bulunamadı (.env.local içinde FAL_KEY / FAL_API_KEY).");
  process.exit(1);
}

// --- üretim işleri ---
const CIKTI = join(KOK, "public", "gorseller");
mkdirSync(CIKTI, { recursive: true });

const ARCH =
  "architectural visualization, photorealistic 3D render, cinematic lighting, ultra detailed, professional real estate marketing, no text, no watermark, no people in foreground";

const ISLER = [
  {
    ad: "proje-cankaya-vadi",
    boyut: "landscape_16_9",
    prompt: `Modern luxury residential complex in Ankara Turkey, three mid-rise apartment towers with warm travertine stone and floor-to-ceiling glass facades, landscaped courtyard gardens with trees and water feature, golden hour dusk lighting, warm interior lights glowing, ${ARCH}`,
  },
  {
    ad: "proje-test-konaklari",
    boyut: "landscape_16_9",
    prompt: `Contemporary Turkish residential apartment community, clean white render and natural wood facade, generous balconies with greenery and glass railings, bright midday clear blue sky, surrounded by green park, ${ARCH}`,
  },
  {
    ad: "proje-bahce-evleri",
    boyut: "landscape_16_9",
    prompt: `Low-rise boutique residential project, beige stone and dark metal accents, terraced gardens, pedestrian stone pathways, soft morning light, mediterranean landscaping, ${ARCH}`,
  },
  {
    ad: "proje-kule-rezidans",
    boyut: "landscape_16_9",
    prompt: `Modern high-rise residential tower at blue hour, glass curtain wall reflecting twilight sky, illuminated podium, city skyline backdrop, dramatic dusk, ${ARCH}`,
  },
  {
    ad: "proje-sahil-konutlari",
    boyut: "landscape_16_9",
    prompt: `Seaside modern residential blocks, white minimalist architecture with large terraces facing the sea, palm trees, sunny coastal afternoon, turquoise water, ${ARCH}`,
  },
  {
    ad: "proje-fallback",
    boyut: "landscape_16_9",
    prompt: `Abstract modern residential architecture, soft teal and slate blue gradient sky, minimalist apartment building silhouette, calm premium mood, ${ARCH}`,
  },
  {
    ad: "hero-arkaplan",
    boyut: "landscape_16_9",
    prompt: `Aerial view of a modern master-planned residential district at dusk, organized apartment blocks with glowing windows, parks and roads forming a grid, deep navy and teal cinematic color grade, atmospheric, ${ARCH}`,
  },
];

async function uret(is) {
  const r = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: is.prompt,
      image_size: is.boyut,
      num_images: 1,
      num_inference_steps: 30,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    }),
  });
  if (!r.ok) throw new Error(`fal ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("görsel url yok: " + JSON.stringify(data).slice(0, 200));
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const dosya = join(CIKTI, `${is.ad}.jpg`);
  writeFileSync(dosya, buf);
  return `${is.ad}.jpg (${Math.round(buf.length / 1024)}KB)`;
}

console.log(`${ISLER.length} görsel üretiliyor → public/gorseller/`);
for (const is of ISLER) {
  try {
    const sonuc = await uret(is);
    console.log("  ✓ " + sonuc);
  } catch (e) {
    console.log(`  ✗ ${is.ad} — ${e.message}`);
  }
}
console.log("bitti.");
