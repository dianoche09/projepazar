import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { ROL_ETIKET, type Rol } from "@/lib/roller";

export default async function Profil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, rol, telefon, ofis_id")
    .eq("id", user?.id ?? "")
    .single();
  const { data: ofis } = profil?.ofis_id
    ? await supabase.from("ofis").select("ad, marka").eq("id", profil.ofis_id).single()
    : { data: null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Profil</h1>

      <div className="mt-5 rounded-2xl border border-hair bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-navy font-display text-lg font-bold text-white">
            {(profil?.ad ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="font-medium text-ink">{profil?.ad ?? "—"}</p>
            <p className="text-sm text-gray">{user?.email}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-hair pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray">Rol</dt>
            <dd className="font-medium text-ink">{profil ? ROL_ETIKET[profil.rol as Rol] : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray">Telefon</dt>
            <dd className="font-medium text-ink">{profil?.telefon ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray">Ofis</dt>
            <dd className="font-medium text-ink">{ofis?.ad ?? "Bağımsız"}{ofis?.marka ? ` · ${ofis.marka}` : ""}</dd>
          </div>
        </dl>
      </div>

      <form action={cikisYap} className="mt-4">
        <button className="w-full rounded-xl border border-hair bg-card py-3 text-sm font-medium text-navy transition-colors hover:border-teal">
          Çıkış yap
        </button>
      </form>
    </div>
  );
}
