import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { kullaniciOnayla, kullaniciReddet } from "../actions";

const ATANABILIR_ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi"];
const sel = "rounded-lg border border-hair bg-paper px-2 py-1.5 text-sm text-ink";

export default async function OnaySayfasi() {
  const supabase = await createClient();
  const [{ data: bekleyenler }, { data: ofisler }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, ad, telefon, talep_rol, kayit_meta, created_at")
      .eq("durum", "onay_bekliyor")
      .order("created_at"),
    supabase.from("ofis").select("id, ad").order("ad"),
  ]);
  const bekleyenSay = bekleyenler?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-teal hover:underline">
        ← Yönetim
      </Link>
      <h1 className="mt-3 flex items-center gap-2 font-display text-2xl font-semibold text-ink">
        Onay kuyruğu
        {bekleyenSay > 0 ? (
          <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-xs font-medium text-white">{bekleyenSay}</span>
        ) : null}
      </h1>
      <p className="mt-1 text-sm text-gray">Yeni kayıtlar — rol & ofis ata, onayla veya reddet.</p>

      <div className="mt-6 space-y-2">
        {(bekleyenler ?? []).map((k) => {
          const meta = (k.kayit_meta ?? {}) as { vergi_no?: string | null; ofis_adi?: string | null };
          return (
            <form key={k.id} action={kullaniciOnayla} className="flex flex-wrap items-end gap-2 rounded-xl border border-amber/30 bg-card p-3">
              <input type="hidden" name="kullanici_id" value={k.id} />
              <div className="min-w-44 flex-1">
                <p className="font-medium text-ink">{k.ad ?? "—"}</p>
                <p className="text-xs text-gray">
                  {k.telefon ?? "tel —"}
                  {meta.vergi_no ? ` · VKN ${meta.vergi_no}` : ""}
                  {meta.ofis_adi ? ` · ${meta.ofis_adi}` : ""}
                  {k.talep_rol ? ` · talep: ${ROL_ETIKET[k.talep_rol as Rol]}` : ""}
                </p>
              </div>
              <label className="flex flex-col text-xs text-gray">
                Rol
                <select name="rol" defaultValue={k.talep_rol ?? "emlakci"} className={sel}>
                  {ATANABILIR_ROLLER.map((r) => (
                    <option key={r} value={r}>{ROL_ETIKET[r]}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs text-gray">
                Ofis
                <select name="ofis_id" defaultValue="" className={sel}>
                  <option value="">— yok —</option>
                  {(ofisler ?? []).map((o) => (
                    <option key={o.id} value={o.id}>{o.ad}</option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                Onayla
              </button>
              <button formAction={kullaniciReddet} className="rounded-lg border border-hair px-3 py-1.5 text-sm text-red transition-colors hover:border-red">
                Reddet
              </button>
            </form>
          );
        })}
        {bekleyenSay === 0 ? <p className="text-sm text-gray">Bekleyen kayıt yok.</p> : null}
      </div>
    </div>
  );
}
