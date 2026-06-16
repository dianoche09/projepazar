import { createClient } from "@/lib/supabase/server";
import { ureticiDogrula } from "./actions";

function Kpi({
  etiket,
  deger,
  renk = "text-ink",
}: {
  etiket: string;
  deger: number;
  renk?: string;
}) {
  return (
    <div className="rounded-2xl border border-hair bg-card p-4">
      <p className="text-xs text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${renk}`}>{deger}</p>
    </div>
  );
}

export default async function AdminPanel() {
  const supabase = await createClient();

  // admin RLS (is_admin owner) → tüm üretici/ofis/profil/projeyi görür
  const { data: ureticiler } = await supabase
    .from("uretici")
    .select("id, ad, vergi_no, dogrulanmis, created_at")
    .order("created_at", { ascending: false });
  const { data: ofisler } = await supabase.from("ofis").select("id, ad, marka, il, ilce").order("ad");
  const { data: profiller } = await supabase.from("profiles").select("rol");
  const { data: projeler } = await supabase.from("proje").select("uretici_id");

  const rolSay = (r: string) => (profiller ?? []).filter((p) => p.rol === r).length;
  const dogrulanmamis = (ureticiler ?? []).filter((u) => !u.dogrulanmis).length;
  const projeSay = (uid: string) => (projeler ?? []).filter((p) => p.uretici_id === uid).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Yönetim Paneli</h1>
      <p className="mt-1 text-sm text-gray">
        Platform işletmecisi: üyelik/abonelik, hesap tanımlama, doğrulama, denetim, gelir.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi etiket="Üretici" deger={ureticiler?.length ?? 0} />
        <Kpi etiket="Ofis" deger={ofisler?.length ?? 0} />
        <Kpi etiket="Emlakçı" deger={rolSay("emlakci")} />
        <Kpi etiket="Doğrulanmamış üretici" deger={dogrulanmamis} renk="text-amber" />
      </div>

      {/* Üreticiler — doğrulama / güven rozeti */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">
          Üreticiler — doğrulama & güven rozeti
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card">
          {(ureticiler ?? []).map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 border-t border-hair px-4 py-3 first:border-t-0"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium text-ink">{u.ad}</p>
                <p className="font-mono text-xs text-gray">
                  VKN {u.vergi_no ?? "—"} · {projeSay(u.id)} proje
                </p>
              </div>
              {u.dogrulanmis ? (
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                  ✓ Doğrulanmış
                </span>
              ) : (
                <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber">
                  Beklemede
                </span>
              )}
              <form action={ureticiDogrula}>
                <input type="hidden" name="uretici_id" value={u.id} />
                <input type="hidden" name="dogrula" value={(!u.dogrulanmis).toString()} />
                <button className="rounded-lg border border-hair px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:border-teal">
                  {u.dogrulanmis ? "Rozeti kaldır" : "Doğrula"}
                </button>
              </form>
            </div>
          ))}
          {!ureticiler || ureticiler.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray">Henüz üretici yok.</p>
          ) : null}
        </div>
      </section>

      {/* Ofisler — abonelik (ana gelir) */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">
          Ofisler — abonelik (ana gelir kaynağı)
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card">
          {(ofisler ?? []).map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-3 border-t border-hair px-4 py-3 first:border-t-0"
            >
              <div className="flex-1">
                <p className="font-medium text-ink">{o.ad}</p>
                <p className="text-xs text-gray">
                  {o.marka ?? "Bağımsız"} · {[o.ilce, o.il].filter(Boolean).join(", ")}
                </p>
              </div>
              <span className="rounded-full border border-hair px-2.5 py-1 font-mono text-xs text-gray">
                paket: —
              </span>
            </div>
          ))}
          {!ofisler || ofisler.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray">Henüz ofis yok.</p>
          ) : null}
        </div>
      </section>

      {/* Üyelik & Gelir — sonraki adım */}
      <section className="mt-10 rounded-2xl border border-dashed border-hair bg-card/50 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Üyelik & Gelir</h2>
        <p className="mt-1 text-sm text-gray">
          Abonelik paketleri (ofis/franchise SaaS — gelir modeli ①), hesap açma + kapasite/kota
          ataması ve gelir/ödeme takibi bir sonraki adımda. Şimdilik doğrulama (güven rozeti) ve
          hesap görünürlüğü aktif.
        </p>
      </section>
    </div>
  );
}
