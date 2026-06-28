import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { zamanOnce } from "@/lib/types";
import { kullaniciOnayla, kullaniciReddet } from "../actions";
import { Avatar, GeriLink, SayfaBaslik } from "../_ortak";

const ATANABILIR_ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi"];
const sel = "rounded-lg border border-hair bg-soft px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-teal";

// Talep rol → rozet tonu (Genel Bakış ile aynı dil)
const ROL_ROZET: Record<string, string> = {
  uretici: "bg-navy/10 text-navy",
  emlakci: "bg-teal/12 text-teal-d",
  ofis_yetkili: "bg-amber-soft text-amber",
  marka_yetkili: "bg-navy/10 text-navy",
  arsa_sahibi: "bg-gray/12 text-gray",
};

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
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Onay Kuyruğu"
        noktaRenk={bekleyenSay > 0 ? "var(--color-amber)" : "var(--color-green)"}
        altEtiket={
          <>
            <span className="font-medium">{bekleyenSay > 0 ? `${bekleyenSay} kayıt onay bekliyor` : "Kuyruk temiz"}</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">rol &amp; ofis ata → onayla / reddet</span>
          </>
        }
        sag={
          bekleyenSay > 0 ? (
            <span className="rozet mono bg-amber-soft text-amber">{bekleyenSay} bekleyen</span>
          ) : (
            <span className="rozet bg-green-soft text-teal-d">temiz ✓</span>
          )
        }
      />

      {bekleyenSay > 0 ? (
        <div className="belir belir-1 space-y-2.5">
          {(bekleyenler ?? []).map((k) => {
            const meta = (k.kayit_meta ?? {}) as { vergi_no?: string | null; ofis_adi?: string | null };
            const rol = (k.talep_rol as string) ?? "emlakci";
            return (
              <form
                key={k.id}
                action={kullaniciOnayla}
                className="kart signal-top flex flex-wrap items-end gap-3 p-4"
                style={{ ["--_sig" as string]: "var(--color-amber)" }}
              >
                <input type="hidden" name="kullanici_id" value={k.id} />
                <div className="flex min-w-52 flex-1 items-center gap-3">
                  <Avatar ad={k.ad} id={k.id} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{k.ad ?? "—"}</p>
                    <p className="mono mt-0.5 truncate text-[11.5px] text-gray">
                      {k.telefon ?? "tel —"}
                      {meta.vergi_no ? ` · VKN ${meta.vergi_no}` : ""}
                      {meta.ofis_adi ? ` · ${meta.ofis_adi}` : ""}
                      {` · ${zamanOnce(k.created_at)}`}
                    </p>
                  </div>
                  {k.talep_rol ? (
                    <span className={`rozet ${ROL_ROZET[rol] ?? "bg-gray/12 text-gray"}`}>talep: {ROL_ETIKET[rol as Rol]}</span>
                  ) : null}
                </div>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                  Rol
                  <select name="rol" defaultValue={k.talep_rol ?? "emlakci"} className={sel}>
                    {ATANABILIR_ROLLER.map((r) => (
                      <option key={r} value={r}>{ROL_ETIKET[r]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                  Ofis
                  <select name="ofis_id" defaultValue="" className={sel}>
                    <option value="">— yok —</option>
                    {(ofisler ?? []).map((o) => (
                      <option key={o.id} value={o.id}>{o.ad}</option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2">
                  <button className="rounded-xl border border-green/30 bg-green/12 px-3.5 py-2 text-[13px] font-semibold text-teal-d transition-colors hover:bg-green/20">
                    Onayla
                  </button>
                  <button
                    formAction={kullaniciReddet}
                    className="rounded-xl border border-red/30 bg-card px-3.5 py-2 text-[13px] font-semibold text-red transition-colors hover:bg-red/10"
                  >
                    Reddet
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      ) : (
        <div className="kart belir belir-1 px-5 py-16 text-center">
          <p className="text-sm font-semibold text-ink">Bekleyen kayıt yok</p>
          <p className="mt-1 text-xs text-gray">Yeni başvurular onaylanmak üzere burada görünür.</p>
        </div>
      )}
    </div>
  );
}
