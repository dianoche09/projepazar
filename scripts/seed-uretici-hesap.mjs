// 3 ayrı ÜRETİCİ LOGIN hesabı aç (Mar771/Deniz/Akkent) + profiles + uretici.sahip_id bağla.
// Demo: her müteahhit kendi panelini görsün. node scripts/seed-uretici-hesap.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
function envOku() {
  const yol = join(KOK, ".env.local");
  const o = {};
  if (!existsSync(yol)) return o;
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

const SIFRE = "ProjePazar123!";
const HESAPLAR = [
  { vergi_no: "1234567801", email: "uretici2@projepazar.test", ad: "Mar771 İnşaat" },
  { vergi_no: "1234567802", email: "uretici3@projepazar.test", ad: "Deniz Yapı A.Ş." },
  { vergi_no: "1234567803", email: "uretici4@projepazar.test", ad: "Akkent Construction" },
];

async function kullaniciBul(email) {
  // listUsers paginate (getUserByEmail yok)
  for (let s = 1; s <= 10; s++) {
    const { data } = await sb.auth.admin.listUsers({ page: s, perPage: 200 });
    const u = (data?.users ?? []).find((x) => x.email === email);
    if (u) return u;
    if ((data?.users ?? []).length < 200) break;
  }
  return null;
}

async function main() {
  for (const h of HESAPLAR) {
    // 1) auth user (varsa bul)
    let uid;
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email: h.email, password: SIFRE, email_confirm: true, user_metadata: { ad: h.ad },
    });
    if (cErr) {
      const mevcut = await kullaniciBul(h.email);
      if (!mevcut) { console.log(`✗ ${h.email}: ${cErr.message}`); continue; }
      uid = mevcut.id;
      console.log(`• ${h.email} zaten var → bağlanıyor`);
    } else {
      uid = created.user.id;
      console.log(`+ ${h.email} oluşturuldu`);
    }
    // 2) profiles (uretici, aktif)
    const { error: pErr } = await sb.from("profiles").upsert({ id: uid, rol: "uretici", ad: h.ad, durum: "aktif", aktif: true }, { onConflict: "id" });
    if (pErr) { console.log(`  profiles: ${pErr.message}`); continue; }
    // 3) uretici.sahip_id bağla
    const { error: uErr } = await sb.from("uretici").update({ sahip_id: uid, dogrulanmis: true }).eq("vergi_no", h.vergi_no);
    if (uErr) { console.log(`  uretici: ${uErr.message}`); continue; }
    console.log(`  ✓ ${h.ad} → ${h.email} / ${SIFRE}`);
  }
  console.log("bitti.");
}
main().catch((e) => { console.error(e); process.exit(1); });
