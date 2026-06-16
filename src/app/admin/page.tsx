import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtPara } from "@/lib/types";

function Kpi({ etiket, deger, renk = "text-ink" }: { etiket: string; deger: number; renk?: string }) {
  return (
    <div className="rounded-2xl border border-hair bg-card p-4">
      <p className="text-xs text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${renk}`}>{deger}</p>
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

  const emlakciSay = (profiller ?? []).filter((p) => p.rol === "emlakci").length;
  const dogrulanmamis = (ureticiler ?? []).filter((u) => !u.dogrulanmis).length;
  const paketFiyat = new Map((paketler ?? []).map((p) => [p.id, Number(p.fiyat_aylik) || 0]));
  const mrr = (abonelikler ?? []).reduce((t, a) => t + (paketFiyat.get(a.paket_id) ?? 0), 0);
  const bekleyen = bekleyenSay ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Yönetim Paneli</h1>
      <p className="mt-1 text-sm text-gray">
        Platform işletmecisi: üyelik/abonelik, hesap tanımlama, kapasite/kota, doğrulama, gelir.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Kpi etiket="Onay bekleyen" deger={bekleyen} renk={bekleyen > 0 ? "text-amber" : "text-ink"} />
        <Kpi etiket="Üretici" deger={ureticiler?.length ?? 0} />
        <Kpi etiket="Ofis" deger={ofisler?.length ?? 0} />
        <Kpi etiket="Emlakçı" deger={emlakciSay} />
        <div className="rounded-2xl border border-hair bg-card p-4">
          <p className="text-xs text-gray">MRR</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal">{fmtPara(mrr)}</p>
        </div>
      </div>

      {dogrulanmamis > 0 ? (
        <p className="mt-4 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-ink">
          {dogrulanmamis} üretici doğrulama bekliyor —{" "}
          <Link href="/admin/ureticiler" className="font-medium text-teal hover:underline">
            Üreticiler
          </Link>
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULLER.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-2xl border border-hair bg-card p-5 transition-colors hover:border-teal"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-semibold text-ink">{m.etiket}</span>
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
    </div>
  );
}
