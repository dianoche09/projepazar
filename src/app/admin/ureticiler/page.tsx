import { createClient } from "@/lib/supabase/server";
import { ureticiDogrula, ureticiEkle, ureticiyeAbonelikAta } from "../actions";
import { Avatar, GeriLink, SayfaBaslik, Uyari } from "../_ortak";

const inp = "rounded-lg border border-hair bg-soft px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

export default async function UreticilerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const [{ data: ureticiler }, { data: projeler }, { data: paketler }, { data: abonelikler }] = await Promise.all([
    supabase.from("uretici").select("id, ad, vergi_no, dogrulanmis, created_at").order("created_at", { ascending: false }),
    supabase.from("proje").select("uretici_id"),
    supabase.from("abonelik_paketi").select("id, ad, fiyat_aylik, para_birimi").eq("hedef", "uretici").eq("aktif", true).order("siralama"),
    supabase.from("abonelik").select("uretici_id, paket_id, durum").in("durum", ["deneme", "aktif"]),
  ]);
  const projeSay = (uid: string) => (projeler ?? []).filter((p) => p.uretici_id === uid).length;
  const uretPaketler = (paketler ?? []) as { id: string; ad: string; fiyat_aylik: number | null; para_birimi: string | null }[];
  const aboMap = new Map((abonelikler ?? []).filter((a) => a.uretici_id).map((a) => [a.uretici_id as string, a.paket_id as string]));
  const PARA: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
  const paketEtiket = (p: { ad: string; fiyat_aylik: number | null; para_birimi: string | null }) =>
    `${p.ad}${p.fiyat_aylik != null ? ` · ${Number(p.fiyat_aylik).toLocaleString("tr-TR")}${PARA[p.para_birimi ?? "TRY"] ?? "₺"}/ay` : ""}`;
  const liste = ureticiler ?? [];
  const dogrulanmamisSay = liste.filter((u) => !u.dogrulanmis).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Üreticiler"
        noktaRenk={dogrulanmamisSay > 0 ? "var(--color-red)" : "var(--color-teal)"}
        altEtiket={
          <>
            <span className="font-medium">{liste.length} müteahhit firma</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">hesap tanımlama · güven rozeti / doğrulama</span>
          </>
        }
        sag={
          dogrulanmamisSay > 0 ? (
            <span className="rozet mono bg-red/12 text-red">{dogrulanmamisSay} doğrulama bekliyor</span>
          ) : (
            <span className="rozet bg-green-soft text-teal-d">tümü doğrulandı</span>
          )
        }
      />

      <Uyari hata={hata} mesaj={mesaj} />

      {/* Yeni üretici hesabı aç (firma + sahip kullanıcı) */}
      <details className="kart belir belir-1 overflow-hidden p-0" open={liste.length === 0}>
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-soft">
          <span className="inline-flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-md bg-navy text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            Yeni üretici (müteahhit) hesabı aç
          </span>
        </summary>
        <div className="border-t border-hair px-5 py-4">
          <form action={ureticiEkle} className="grid gap-3 sm:grid-cols-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray sm:col-span-2">Firma</div>
            <input name="ad" required minLength={2} placeholder="Firma adı (ör. Demo İnşaat A.Ş.)" className={inp} />
            <input name="vergi_no" placeholder="Vergi no (opsiyonel)" className={inp} />
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray sm:col-span-2">Yetkili / sahip kullanıcı</div>
            <input name="sahip_ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
            <input name="sahip_email" type="email" required placeholder="E-posta" className={inp} />
            <input name="sahip_parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={`${inp} sm:col-span-2`} />
            <button className="btn-primary sm:col-span-2">Üretici hesabı aç</button>
          </form>
          <p className="mt-2.5 text-xs text-gray">Sahip doğrudan aktif + doğrulanmış oluşturulur; geçici parolayı ilet.</p>
        </div>
      </details>

      <div className="kart belir belir-2 overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Firma</th>
                <th>Vergi no</th>
                <th>Proje</th>
                <th>Doğrulama</th>
                <th>Abonelik (ana gelir)</th>
                <th className="!text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar ad={u.ad} id={u.id} boyut={32} />
                      <span className="text-[13.5px] font-semibold text-ink">{u.ad}</span>
                    </div>
                  </td>
                  <td className="mono text-[12.5px] text-ink-soft">{u.vergi_no ?? "—"}</td>
                  <td>
                    <span className="rozet bg-navy/10 text-navy">{projeSay(u.id)} proje</span>
                  </td>
                  <td>
                    {u.dogrulanmis ? (
                      <span className="rozet bg-green-soft text-teal-d">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Doğrulanmış
                      </span>
                    ) : (
                      <span className="rozet bg-amber-soft text-amber">Beklemede</span>
                    )}
                  </td>
                  <td>
                    <form action={ureticiyeAbonelikAta} className="flex items-center gap-1.5">
                      <input type="hidden" name="uretici_id" value={u.id} />
                      <select
                        name="paket_id"
                        defaultValue={aboMap.get(u.id) ?? ""}
                        className="rounded-lg border border-hair bg-soft px-2 py-1 text-xs text-ink outline-none focus:border-teal"
                      >
                        <option value="">— yok —</option>
                        {uretPaketler.map((p) => (
                          <option key={p.id} value={p.id}>{paketEtiket(p)}</option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-teal/40 bg-teal/10 px-2 py-1 text-xs font-semibold text-teal-d hover:bg-teal/20">
                        Ata
                      </button>
                    </form>
                  </td>
                  <td className="!text-right">
                    <form action={ureticiDogrula} className="flex justify-end">
                      <input type="hidden" name="uretici_id" value={u.id} />
                      <input type="hidden" name="dogrula" value={(!u.dogrulanmis).toString()} />
                      <button
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          u.dogrulanmis ? "border-hair bg-card text-gray hover:border-red hover:text-red" : "border-teal/40 bg-teal/10 text-teal-d hover:bg-teal/20"
                        }`}
                      >
                        {u.dogrulanmis ? "Rozeti kaldır" : "Doğrula"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {liste.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray">Henüz üretici yok — yukarıdan ekle.</p>
        ) : null}
      </div>
    </div>
  );
}
