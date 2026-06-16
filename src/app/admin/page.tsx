import { createClient } from "@/lib/supabase/server";
import { fmtPara, ABONELIK_DURUM_ETIKET, type AbonelikDurum, type AbonelikPaketi } from "@/lib/types";
import { ureticiDogrula, ofiseAbonelikAta } from "./actions";
import { PaketYonetimi } from "@/components/PaketYonetimi";

function Kpi({ etiket, deger, renk = "text-ink" }: { etiket: string; deger: number; renk?: string }) {
  return (
    <div className="rounded-2xl border border-hair bg-card p-4">
      <p className="text-xs text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${renk}`}>{deger}</p>
    </div>
  );
}

const DURUM_ROZET: Record<AbonelikDurum, string> = {
  aktif: "bg-green/10 text-green",
  deneme: "bg-amber/10 text-amber",
  askida: "bg-gray/10 text-gray",
  iptal: "bg-red/10 text-red",
};

export default async function AdminPanel() {
  const supabase = await createClient();

  // admin RLS (is_admin) → tüm hesapları görür
  const [
    { data: ureticiler },
    { data: ofisler },
    { data: profiller },
    { data: projeler },
    { data: paketler },
    { data: abonelikler },
  ] = await Promise.all([
    supabase.from("uretici").select("id, ad, vergi_no, dogrulanmis, created_at").order("created_at", { ascending: false }),
    supabase.from("ofis").select("id, ad, marka, il, ilce").order("ad"),
    supabase.from("profiles").select("rol, ofis_id"),
    supabase.from("proje").select("uretici_id"),
    supabase.from("abonelik_paketi").select("*").order("siralama"),
    supabase.from("abonelik").select("id, ofis_id, paket_id, durum").in("durum", ["deneme", "aktif"]),
  ]);

  const rolSay = (r: string) => (profiller ?? []).filter((p) => p.rol === r).length;
  const dogrulanmamis = (ureticiler ?? []).filter((u) => !u.dogrulanmis).length;
  const projeSay = (uid: string) => (projeler ?? []).filter((p) => p.uretici_id === uid).length;

  const paketMap = new Map((paketler ?? []).map((p) => [p.id, p]));
  const ofisAbonelik = new Map<string, { paket_id: string; durum: AbonelikDurum }>();
  for (const a of abonelikler ?? []) if (a.ofis_id) ofisAbonelik.set(a.ofis_id, a as never);
  const koltukKullanim = (ofisId: string) =>
    (profiller ?? []).filter((p) => p.ofis_id === ofisId && p.rol === "emlakci").length;

  const aktifSay = (abonelikler ?? []).filter((a) => a.durum === "aktif").length;
  const denemeSay = (abonelikler ?? []).filter((a) => a.durum === "deneme").length;
  const mrr = (abonelikler ?? [])
    .filter((a) => a.durum === "aktif")
    .reduce((t, a) => t + (Number(paketMap.get(a.paket_id)?.fiyat_aylik) || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Yönetim Paneli</h1>
      <p className="mt-1 text-sm text-gray">
        Platform işletmecisi: üyelik/abonelik, hesap tanımlama, kapasite/kota, doğrulama, gelir.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi etiket="Üretici" deger={ureticiler?.length ?? 0} />
        <Kpi etiket="Ofis" deger={ofisler?.length ?? 0} />
        <Kpi etiket="Emlakçı" deger={rolSay("emlakci")} />
        <Kpi etiket="Doğrulanmamış üretici" deger={dogrulanmamis} renk="text-amber" />
      </div>

      {/* Gelir özeti (gelir modeli ①) */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-hair bg-card p-4 sm:col-span-1">
          <p className="text-xs text-gray">Aylık Yinelenen Gelir (MRR)</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal">{fmtPara(mrr)}</p>
        </div>
        <Kpi etiket="Aktif abonelik" deger={aktifSay} renk="text-green" />
        <Kpi etiket="Deneme aboneliği" deger={denemeSay} renk="text-amber" />
      </section>

      {/* Üreticiler — doğrulama / güven rozeti */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Üreticiler — doğrulama & güven rozeti</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card">
          {(ureticiler ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 border-t border-hair px-4 py-3 first:border-t-0">
              <div className="min-w-40 flex-1">
                <p className="font-medium text-ink">{u.ad}</p>
                <p className="font-mono text-xs text-gray">VKN {u.vergi_no ?? "—"} · {projeSay(u.id)} proje</p>
              </div>
              {u.dogrulanmis ? (
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">✓ Doğrulanmış</span>
              ) : (
                <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber">Beklemede</span>
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

      {/* Ofisler — abonelik atama + koltuk kapasitesi (ANA GELİR) */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Ofisler — abonelik & kapasite</h2>
        <p className="mt-1 text-sm text-gray">Paket ata; koltuk kullanımı = ofise bağlı emlakçı / kota.</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card">
          {(ofisler ?? []).map((o) => {
            const ab = ofisAbonelik.get(o.id);
            const paket = ab ? paketMap.get(ab.paket_id) : null;
            const kullanim = koltukKullanim(o.id);
            const kota = paket?.kota_koltuk ?? null;
            const asim = kota != null && kullanim > kota;
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-3 border-t border-hair px-4 py-3 first:border-t-0">
                <div className="min-w-40 flex-1">
                  <p className="font-medium text-ink">{o.ad}</p>
                  <p className="text-xs text-gray">{o.marka ?? "Bağımsız"} · {[o.ilce, o.il].filter(Boolean).join(", ")}</p>
                </div>
                <span className={`font-mono text-xs ${asim ? "text-red" : "text-gray"}`}>
                  {kullanim}{kota != null ? `/${kota}` : ""} koltuk{asim ? " · aşım" : ""}
                </span>
                {ab ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DURUM_ROZET[ab.durum]}`}>
                    {ABONELIK_DURUM_ETIKET[ab.durum]}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray/10 px-2.5 py-1 text-xs font-medium text-gray">Abonelik yok</span>
                )}
                <form action={ofiseAbonelikAta} className="flex items-center gap-2">
                  <input type="hidden" name="ofis_id" value={o.id} />
                  <select
                    name="paket_id"
                    defaultValue={ab?.paket_id ?? ""}
                    className="rounded-lg border border-hair bg-paper px-2 py-1.5 text-sm text-ink"
                  >
                    <option value="">— Abonelik yok —</option>
                    {(paketler ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ad} · {fmtPara(p.fiyat_aylik)}/ay
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg border border-hair px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:border-teal">
                    Ata
                  </button>
                </form>
              </div>
            );
          })}
          {!ofisler || ofisler.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray">Henüz ofis yok.</p>
          ) : null}
        </div>
      </section>

      {/* Abonelik paketleri (gelir modeli ① kademeleri) */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Üyelik paketleri & fiyatlandırma</h2>
        <p className="mt-1 text-sm text-gray">
          Tip, fiyat ve kotalar tamamen burada tanımlanır — ofis, üretici, emlakçı. Sabit/varsayılan fiyat yok.
        </p>
        <div className="mt-4">
          <PaketYonetimi paketler={(paketler ?? []) as AbonelikPaketi[]} />
        </div>
      </section>
    </div>
  );
}
