import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtPara } from "@/lib/types";
import { Donut, Lejant } from "@/components/ui/Grafik";

const C = { navy: "#13314B", teal: "#1E9B8A", green: "#2FB36B", amber: "#E3A12C" };

function Stat({
  etiket,
  deger,
  alt,
  vurgu,
  sinyal,
}: {
  etiket: string;
  deger: string;
  alt?: string;
  vurgu?: boolean;
  sinyal?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 ${vurgu ? "border-teal/30 bg-teal-soft" : "border-hair bg-card"}`}
    >
      {sinyal ? <span className={`absolute inset-x-0 top-0 h-0.5 ${sinyal}`} aria-hidden /> : null}
      <p className="text-xs uppercase tracking-wide text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold tabular-nums leading-none ${vurgu ? "text-teal-d" : "text-ink"}`}>{deger}</p>
      {alt ? <p className="mt-1 text-xs text-gray">{alt}</p> : null}
    </div>
  );
}

const MODULLER = [
  { href: "/admin/onay", etiket: "Onay Kuyruğu", aciklama: "Bekleyen kayıtları rol & ofis atayıp onayla" },
  { href: "/admin/kullanicilar", etiket: "Kullanıcılar", aciklama: "Tüm hesaplar — rol/ofis/durum yönetimi" },
  { href: "/admin/ureticiler", etiket: "Üreticiler", aciklama: "Doğrulama & güven rozeti" },
  { href: "/admin/ofisler", etiket: "Ofisler", aciklama: "Abonelik & koltuk kapasitesi (ana gelir)" },
  { href: "/admin/uyelik", etiket: "Üyelik paketleri", aciklama: "Tip / fiyat / kota tanımları" },
];

export default async function AdminPanel() {
  const supabase = await createClient();
  const [
    { data: ureticiler },
    { data: ofisler },
    { data: profiller },
    { data: paketler },
    { data: abonelikler },
    { count: bekleyenSay },
  ] = await Promise.all([
    supabase.from("uretici").select("id, dogrulanmis"),
    supabase.from("ofis").select("id"),
    supabase.from("profiles").select("rol"),
    supabase.from("abonelik_paketi").select("id, fiyat_aylik"),
    supabase.from("abonelik").select("paket_id").eq("durum", "aktif"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("durum", "onay_bekliyor"),
  ]);

  const rolSay = (r: string) => (profiller ?? []).filter((p) => p.rol === r).length;
  const uretici = rolSay("uretici");
  const ofisYetkili = rolSay("ofis_yetkili");
  const emlakci = rolSay("emlakci");
  const toplamKul = uretici + ofisYetkili + emlakci;
  const dogrulanmamis = (ureticiler ?? []).filter((u) => !u.dogrulanmis).length;
  const paketFiyat = new Map((paketler ?? []).map((p) => [p.id, Number(p.fiyat_aylik) || 0]));
  const mrr = (abonelikler ?? []).reduce((t, a) => t + (paketFiyat.get(a.paket_id) ?? 0), 0);
  const bekleyen = bekleyenSay ?? 0;

  const donut = [
    { etiket: "Üretici", deger: uretici, renk: C.navy },
    { etiket: "Ofis yetkilisi", deger: ofisYetkili, renk: C.teal },
    { etiket: "Emlakçı", deger: emlakci, renk: C.green },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="belir">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-semibold text-ink">Genel Bakış</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-d">
            <span className="nabiz size-1.5 rounded-full bg-green" aria-hidden /> Sistem canlı
          </span>
        </div>
        <p className="mt-1 text-sm text-gray">Üyelik/abonelik, hesap, kapasite/kota, doğrulama, gelir.</p>
      </div>

      {bekleyen > 0 || dogrulanmamis > 0 ? (
        <div className="flex flex-wrap gap-3">
          {bekleyen > 0 ? (
            <Link href="/admin/onay" className="inline-flex items-center gap-2 rounded-xl border border-amber/30 bg-amber-soft px-3.5 py-2 text-sm font-medium text-ink hover:border-amber">
              <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-xs text-white">{bekleyen}</span>
              onay bekliyor →
            </Link>
          ) : null}
          {dogrulanmamis > 0 ? (
            <Link href="/admin/ureticiler" className="inline-flex items-center gap-2 rounded-xl border border-hair bg-card px-3.5 py-2 text-sm font-medium text-ink hover:border-teal">
              <span className="rounded-full bg-navy px-2 py-0.5 font-mono text-xs text-white">{dogrulanmamis}</span>
              üretici doğrulama bekliyor →
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* GENEL BAKIŞ — kullanıcı dağılımı + metrikler */}
      <section className="belir belir-1 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Kullanıcı dağılımı</h2>
          <div className="mt-4 flex items-center gap-6">
            <Donut parcalar={donut} ortaUst={String(toplamKul)} ortaAlt="kullanıcı" />
            <div className="flex-1">
              <Lejant parcalar={donut} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat etiket="MRR" deger={fmtPara(mrr)} alt={`${abonelikler?.length ?? 0} aktif abonelik`} vurgu />
          <Stat etiket="Onay bekleyen" deger={String(bekleyen)} alt="kuyrukta" sinyal="bg-amber" />
          <Stat etiket="Üretici firma" deger={String(ureticiler?.length ?? 0)} alt={`${dogrulanmamis} doğrulanmamış`} sinyal="bg-navy" />
          <Stat etiket="Ofis" deger={String(ofisler?.length ?? 0)} alt="abonelik sahibi" sinyal="bg-green" />
        </div>
      </section>

      {/* MODÜLLER */}
      <section className="belir belir-2">
        <h2 className="font-display text-lg font-semibold text-ink">Yönetim modülleri</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULLER.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group rounded-2xl border border-hair bg-card p-5 shadow-card transition-shadow hover:shadow-cardlg"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold text-ink group-hover:text-teal-d">{m.etiket}</span>
                {m.href === "/admin/onay" && bekleyen > 0 ? (
                  <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-xs font-medium text-white">{bekleyen}</span>
                ) : (
                  <span className="text-gray transition-transform group-hover:translate-x-0.5">→</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray">{m.aciklama}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
