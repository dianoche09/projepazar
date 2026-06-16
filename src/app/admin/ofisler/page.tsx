import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtPara, ABONELIK_DURUM_ETIKET, type AbonelikDurum } from "@/lib/types";
import { ofiseAbonelikAta, ofisEkle } from "../actions";

const DURUM_ROZET: Record<AbonelikDurum, string> = {
  aktif: "bg-green/10 text-green",
  deneme: "bg-amber/10 text-amber",
  askida: "bg-gray/10 text-gray",
  iptal: "bg-red/10 text-red",
};
const sel = "rounded-lg border border-hair bg-paper px-2 py-1.5 text-sm text-ink";
const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

export default async function OfislerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const [{ data: ofisler }, { data: profiller }, { data: paketler }, { data: abonelikler }] = await Promise.all([
    supabase.from("ofis").select("id, ad, marka, il, ilce").order("ad"),
    supabase.from("profiles").select("rol, ofis_id"),
    supabase.from("abonelik_paketi").select("id, ad, fiyat_aylik, kota_koltuk").order("siralama"),
    supabase.from("abonelik").select("ofis_id, paket_id, durum").in("durum", ["deneme", "aktif"]),
  ]);

  const paketMap = new Map((paketler ?? []).map((p) => [p.id, p]));
  const ofisAbonelik = new Map<string, { paket_id: string; durum: AbonelikDurum }>();
  for (const a of abonelikler ?? []) if (a.ofis_id) ofisAbonelik.set(a.ofis_id, a as never);
  const koltukKullanim = (ofisId: string) =>
    (profiller ?? []).filter((p) => p.ofis_id === ofisId && p.rol === "emlakci").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-teal hover:underline">
        ← Yönetim
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Ofisler — abonelik & kapasite</h1>
      <p className="mt-1 text-sm text-gray">Yeni ofis hesabı aç; paket ata, koltuk kullanımını izle (ana gelir).</p>

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{hata}</p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">{mesaj}</p>
      ) : null}

      {/* Yeni ofis hesabı aç (ofis + yetkili kullanıcı) */}
      <details className="mt-6 rounded-2xl border border-hair bg-card p-4" open={!ofisler || ofisler.length === 0}>
        <summary className="cursor-pointer font-medium text-ink">+ Yeni ofis / franchise hesabı aç</summary>
        <form action={ofisEkle} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray">Ofis</div>
          <input name="ad" required minLength={2} placeholder="Ofis adı" className={inp} />
          <input name="marka" placeholder="Marka (Remax/C21… opsiyonel)" className={inp} />
          <input name="il" placeholder="İl" className={inp} />
          <input name="ilce" placeholder="İlçe" className={inp} />
          <div className="mt-1 sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray">Yetkili kullanıcı</div>
          <input name="yetkili_ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
          <input name="yetkili_email" type="email" required placeholder="E-posta" className={inp} />
          <input name="yetkili_parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={`${inp} sm:col-span-2`} />
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink sm:col-span-2">
            Ofis hesabı aç
          </button>
        </form>
        <p className="mt-2 text-xs text-gray">Yetkili rol=ofis_yetkili, ofise bağlı + aktif oluşturulur.</p>
      </details>

      <div className="mt-6 overflow-hidden rounded-2xl border border-hair bg-card">
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
                <select name="paket_id" defaultValue={ab?.paket_id ?? ""} className={sel}>
                  <option value="">— Abonelik yok —</option>
                  {(paketler ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.ad} · {fmtPara(p.fiyat_aylik)}/ay</option>
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
          <p className="px-4 py-6 text-sm text-gray">Henüz ofis yok — yukarıdan ekle.</p>
        ) : null}
      </div>
    </div>
  );
}
