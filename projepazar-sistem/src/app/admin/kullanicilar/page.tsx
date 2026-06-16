import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { KullanicilarTablo, type Kullanici } from "./KullanicilarTablo";
import { kullaniciOlustur } from "../actions";

const ATANABILIR_ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"];
const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

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

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-teal hover:underline">
        ← Yönetim
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-gray">
        Tüm hesaplar — rol, ofis ve durum yönetimi. Onay bekleyenler de burada görünür.
      </p>

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">
          {mesaj}
        </p>
      ) : null}

      {/* Yeni kullanıcı oluştur (admin — service-role; doğrudan aktif) */}
      <details className="mt-6 rounded-2xl border border-hair bg-card p-4">
        <summary className="cursor-pointer font-medium text-ink">+ Yeni kullanıcı oluştur</summary>
        <form action={kullaniciOlustur} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
          <input name="email" type="email" required placeholder="E-posta" className={inp} />
          <input name="telefon" placeholder="Telefon (opsiyonel)" className={inp} />
          <input name="parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={inp} />
          <select name="rol" required defaultValue="emlakci" className={inp}>
            {ATANABILIR_ROLLER.map((r) => (
              <option key={r} value={r}>
                {ROL_ETIKET[r]}
              </option>
            ))}
          </select>
          <select name="ofis_id" defaultValue="" className={inp}>
            <option value="">— ofis yok —</option>
            {(ofisler ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.ad}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink sm:col-span-2">
            Oluştur
          </button>
        </form>
        <p className="mt-2 text-xs text-gray">
          Hesap doğrudan aktif oluşturulur. Geçici parolayı kullanıcıya ilet (girişte değiştirebilir).
        </p>
      </details>

      <div className="mt-6">
        <KullanicilarTablo
          kullanicilar={(kullanicilar ?? []) as Kullanici[]}
          ofisler={ofisler ?? []}
        />
      </div>
    </div>
  );
}
