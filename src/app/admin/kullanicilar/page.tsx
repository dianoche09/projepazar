import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KullanicilarTablo, type Kullanici } from "./KullanicilarTablo";

export default async function KullanicilarSayfasi() {
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

      <div className="mt-6">
        <KullanicilarTablo
          kullanicilar={(kullanicilar ?? []) as Kullanici[]}
          ofisler={ofisler ?? []}
        />
      </div>
    </div>
  );
}
