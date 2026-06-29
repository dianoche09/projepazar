import { createAdminClient } from "@/lib/supabase/admin";
import { belgeKarar } from "../actions";
import { Avatar, GeriLink, SayfaBaslik, Uyari } from "../_ortak";
import { zamanOnce } from "@/lib/types";

const TIP_AD: Record<string, string> = {
  mesleki_yeterlilik: "Mesleki Yeterlilik / Yetki Belgesi",
  vergi_levhasi: "Vergi Levhası",
};

export default async function AdminDogrulama({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6 sm:px-6">
        <GeriLink href="/admin" etiket="Genel Bakış" />
        <SayfaBaslik baslik="Belge Doğrulama" altEtiket={<span className="text-gray">KYC</span>} />
        <div className="kart p-8 text-center text-sm text-gray">Servis anahtarı tanımlı değil — belge kuyruğu okunamıyor.</div>
      </div>
    );
  }

  const { data: belgeRaw } = await admin
    .from("kullanici_belge")
    .select("id, profile_id, tip, url, created_at")
    .eq("durum", "beklemede")
    .order("created_at", { ascending: true });
  const belgeler = (belgeRaw ?? []) as { profile_id: string; tip: string; url: string; created_at: string }[];

  const profileIds = [...new Set(belgeler.map((b) => b.profile_id))];
  const { data: prof } = profileIds.length
    ? await admin.from("profiles").select("id, ad, telefon").in("id", profileIds)
    : { data: [] };
  const profMap = new Map((prof ?? []).map((p) => [p.id as string, { ad: p.ad as string | null, telefon: p.telefon as string | null }]));

  // imzalı görüntüleme URL'leri + emlakçı bazında grupla
  const grouped = new Map<string, { tip: string; signed: string | null; created_at: string }[]>();
  for (const b of belgeler) {
    const { data: signed } = await admin.storage.from("kyc-belge").createSignedUrl(b.url, 3600);
    const arr = grouped.get(b.profile_id) ?? [];
    arr.push({ tip: b.tip, signed: signed?.signedUrl ?? null, created_at: b.created_at });
    grouped.set(b.profile_id, arr);
  }
  const liste = [...grouped.entries()];

  return (
    <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />
      <SayfaBaslik
        baslik="Belge Doğrulama"
        altEtiket={<span className="font-medium">{liste.length} danışman onay bekliyor · KYC güven protokolü</span>}
        sag={
          liste.length > 0 ? (
            <span className="rozet mono bg-amber-soft text-[#9a6a12]">{liste.length} bekliyor</span>
          ) : (
            <span className="rozet bg-green-soft text-teal-d">kuyruk boş</span>
          )
        }
      />
      <Uyari hata={hata} mesaj={mesaj} />

      {liste.length === 0 ? (
        <div className="kart p-10 text-center text-sm text-gray">Bekleyen belge yok. Danışman yükledikçe burada görünür.</div>
      ) : (
        <div className="space-y-4">
          {liste.map(([pid, docs]) => {
            const p = profMap.get(pid);
            return (
              <section key={pid} className="kart overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cizgi)] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar ad={p?.ad ?? "?"} id={pid} boyut={32} />
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">{p?.ad ?? "Danışman"}</div>
                      {p?.telefon ? <div className="text-[11px] text-gray">{p.telefon}</div> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={belgeKarar}>
                      <input type="hidden" name="profile_id" value={pid} />
                      <input type="hidden" name="karar" value="onay" />
                      <button className="rounded-lg bg-green px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90">Doğrula</button>
                    </form>
                    <form action={belgeKarar}>
                      <input type="hidden" name="profile_id" value={pid} />
                      <input type="hidden" name="karar" value="red" />
                      <button className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-bold text-red transition-colors hover:bg-red-soft">Reddet</button>
                    </form>
                  </div>
                </div>
                <ul className="divide-y divide-[var(--cizgi)]">
                  {docs.map((d, i) => (
                    <li key={i} className="flex items-center justify-between px-5 py-2.5 text-[12.5px]">
                      <span className="text-ink">
                        {TIP_AD[d.tip] ?? d.tip} <span className="text-gray">· {zamanOnce(d.created_at)}</span>
                      </span>
                      {d.signed ? (
                        <a href={d.signed} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-d hover:underline">
                          Görüntüle →
                        </a>
                      ) : (
                        <span className="text-gray">açılamadı</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
