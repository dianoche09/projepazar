import { createClient } from "@/lib/supabase/server";
import { fmtPara, ABONELIK_DURUM_ETIKET, type AbonelikDurum } from "@/lib/types";
import { ofiseAbonelikAta, ofisEkle } from "../actions";
import { Avatar, GeriLink, SayfaBaslik, Uyari } from "../_ortak";

const DURUM_ROZET: Record<AbonelikDurum, string> = {
  aktif: "bg-green-soft text-teal-d",
  deneme: "bg-amber-soft text-amber",
  askida: "bg-gray/12 text-gray",
  iptal: "bg-red/12 text-red",
};
const sel = "rounded-lg border border-hair bg-soft px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-teal";
const inp = "rounded-lg border border-hair bg-soft px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

export default async function OfislerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string; vurgu?: string }>;
}) {
  const { hata, mesaj, vurgu } = await searchParams;
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
  const liste = ofisler ?? [];
  const aktifAbonelik = (abonelikler ?? []).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Ofisler"
        noktaRenk="var(--color-amber)"
        altEtiket={
          <>
            <span className="font-medium">{liste.length} ofis · {aktifAbonelik} aktif abonelik</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">paket · koltuk kapasitesi (ana gelir)</span>
          </>
        }
        sag={<span className="rozet mono bg-teal/12 text-teal-d">{aktifAbonelik} aktif abonelik</span>}
      />

      <Uyari hata={hata} mesaj={mesaj} />

      {/* Yeni ofis hesabı aç (ofis + yetkili kullanıcı) */}
      <details className="kart belir belir-1 overflow-hidden p-0" open={liste.length === 0}>
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-soft">
          <span className="inline-flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-md bg-navy text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            Yeni ofis / franchise hesabı aç
          </span>
        </summary>
        <div className="border-t border-hair px-5 py-4">
          <form action={ofisEkle} className="grid gap-3 sm:grid-cols-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray sm:col-span-2">Ofis</div>
            <input name="ad" required minLength={2} placeholder="Ofis adı" className={inp} />
            <input name="marka" placeholder="Marka (Remax/C21… opsiyonel)" className={inp} />
            <input name="il" placeholder="İl" className={inp} />
            <input name="ilce" placeholder="İlçe" className={inp} />
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray sm:col-span-2">Yetkili kullanıcı</div>
            <input name="yetkili_ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
            <input name="yetkili_email" type="email" required placeholder="E-posta" className={inp} />
            <input name="yetkili_parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={`${inp} sm:col-span-2`} />
            <button className="btn-primary sm:col-span-2">Ofis hesabı aç</button>
          </form>
          <p className="mt-2.5 text-xs text-gray">Yetkili rol=ofis_yetkili, ofise bağlı + aktif oluşturulur.</p>
        </div>
      </details>

      <div className="kart belir belir-2 overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ofis</th>
                <th>Koltuk</th>
                <th>Abonelik</th>
                <th className="!text-right">Paket ata</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((o) => {
                const ab = ofisAbonelik.get(o.id);
                const paket = ab ? paketMap.get(ab.paket_id) : null;
                const kullanim = koltukKullanim(o.id);
                const kota = paket?.kota_koltuk ?? null;
                const asim = kota != null && kullanim > kota;
                const vurgulu = vurgu === o.id;
                return (
                  <tr key={o.id} className={vurgulu ? "bg-teal/[0.06]" : ""}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar ad={o.ad} id={o.id} boyut={32} />
                        <div className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink">{o.ad}</span>
                          <span className="block text-[11.5px] text-gray">
                            {o.marka ?? "Bağımsız"}
                            {[o.ilce, o.il].filter(Boolean).length ? ` · ${[o.ilce, o.il].filter(Boolean).join(", ")}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`mono text-[12.5px] font-semibold ${asim ? "text-red" : "text-ink-soft"}`}>
                        {kullanim}{kota != null ? `/${kota}` : ""}
                      </span>
                      {asim ? <span className="rozet ml-1.5 bg-red/12 text-red">aşım</span> : null}
                    </td>
                    <td>
                      {ab ? (
                        <span className={`rozet ${DURUM_ROZET[ab.durum]}`}>
                          {paket ? paket.ad : ABONELIK_DURUM_ETIKET[ab.durum]}
                        </span>
                      ) : (
                        <span className="rozet bg-gray/12 text-gray">Abonelik yok</span>
                      )}
                    </td>
                    <td className="!text-right">
                      <form action={ofiseAbonelikAta} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="ofis_id" value={o.id} />
                        <select name="paket_id" defaultValue={ab?.paket_id ?? ""} className={sel}>
                          <option value="">— Abonelik yok —</option>
                          {(paketler ?? []).map((p) => (
                            <option key={p.id} value={p.id}>{p.ad} · {fmtPara(p.fiyat_aylik)}/ay</option>
                          ))}
                        </select>
                        <button className="rounded-lg border border-hair bg-card px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-teal">
                          Ata
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {liste.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray">Henüz ofis yok — yukarıdan ekle.</p>
        ) : null}
      </div>
    </div>
  );
}
