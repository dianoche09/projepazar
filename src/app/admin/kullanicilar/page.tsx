import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { KullanicilarTablo, type Kullanici } from "./KullanicilarTablo";
import { kullaniciOlustur } from "../actions";
import { GeriLink, SayfaBaslik, Uyari } from "../_ortak";

const ATANABILIR_ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"];
const inp = "rounded-lg border border-hair bg-soft px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

export default async function KullanicilarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const [{ data: kullanicilar }, { data: ofisler }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, ad, rol, durum, ofis_id, telefon, son_giris, talep_rol, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("ofis").select("id, ad").order("ad"),
  ]);
  const liste = (kullanicilar ?? []) as Kullanici[];
  const aktifSay = liste.filter((k) => k.durum === "aktif").length;
  const bekleyenSay = liste.filter((k) => k.durum === "onay_bekliyor").length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Kullanıcılar"
        altEtiket={
          <>
            <span className="font-medium">{liste.length} hesap · {aktifSay} aktif</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">rol · ofis · durum yönetimi</span>
          </>
        }
        sag={
          bekleyenSay > 0 ? (
            <span className="rozet mono bg-amber-soft text-amber">{bekleyenSay} onay bekliyor</span>
          ) : (
            <span className="rozet bg-green-soft text-teal-d">tümü işlendi</span>
          )
        }
      />

      <Uyari hata={hata} mesaj={mesaj} />

      {/* Yeni kullanıcı oluştur (admin — service-role; doğrudan aktif) */}
      <details className="kart belir belir-1 overflow-hidden p-0">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-soft">
          <span className="inline-flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-md bg-navy text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            Yeni kullanıcı oluştur
          </span>
        </summary>
        <div className="border-t border-hair px-5 py-4">
          <form action={kullaniciOlustur} className="grid gap-3 sm:grid-cols-2">
            <input name="ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
            <input name="email" type="email" required placeholder="E-posta" className={inp} />
            <input name="telefon" placeholder="Telefon (opsiyonel)" className={inp} />
            <input name="parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={inp} />
            <select name="rol" required defaultValue="emlakci" className={inp}>
              {ATANABILIR_ROLLER.map((r) => (
                <option key={r} value={r}>{ROL_ETIKET[r]}</option>
              ))}
            </select>
            <select name="ofis_id" defaultValue="" className={inp}>
              <option value="">— ofis yok —</option>
              {(ofisler ?? []).map((o) => (
                <option key={o.id} value={o.id}>{o.ad}</option>
              ))}
            </select>
            <button className="btn-primary sm:col-span-2">Oluştur</button>
          </form>
          <p className="mt-2.5 text-xs text-gray">
            Hesap doğrudan aktif oluşturulur. Geçici parolayı kullanıcıya ilet (girişte değiştirebilir).
          </p>
        </div>
      </details>

      <div className="belir belir-2">
        <KullanicilarTablo kullanicilar={liste} ofisler={ofisler ?? []} />
      </div>
    </div>
  );
}
