import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ureticiDogrula, ureticiEkle } from "../actions";

const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

export default async function UreticilerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const [{ data: ureticiler }, { data: projeler }] = await Promise.all([
    supabase.from("uretici").select("id, ad, vergi_no, dogrulanmis, created_at").order("created_at", { ascending: false }),
    supabase.from("proje").select("uretici_id"),
  ]);
  const projeSay = (uid: string) => (projeler ?? []).filter((p) => p.uretici_id === uid).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-teal hover:underline">
        ← Yönetim
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Üreticiler</h1>
      <p className="mt-1 text-sm text-gray">Yeni üretici (müteahhit) hesabı aç, firmayı doğrula.</p>

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{hata}</p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">{mesaj}</p>
      ) : null}

      {/* Yeni üretici hesabı aç (firma + sahip kullanıcı) */}
      <details className="mt-6 rounded-2xl border border-hair bg-card p-4" open={!ureticiler || ureticiler.length === 0}>
        <summary className="cursor-pointer font-medium text-ink">+ Yeni üretici (müteahhit) hesabı aç</summary>
        <form action={ureticiEkle} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray">Firma</div>
          <input name="ad" required minLength={2} placeholder="Firma adı (ör. Demo İnşaat A.Ş.)" className={inp} />
          <input name="vergi_no" placeholder="Vergi no (opsiyonel)" className={inp} />
          <div className="mt-1 sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray">Yetkili / sahip kullanıcı</div>
          <input name="sahip_ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
          <input name="sahip_email" type="email" required placeholder="E-posta" className={inp} />
          <input name="sahip_parola" type="text" required minLength={8} placeholder="Geçici parola (min 8)" className={`${inp} sm:col-span-2`} />
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink sm:col-span-2">
            Üretici hesabı aç
          </button>
        </form>
        <p className="mt-2 text-xs text-gray">Sahip doğrudan aktif + doğrulanmış oluşturulur; geçici parolayı ilet.</p>
      </details>

      <div className="mt-6 overflow-hidden rounded-2xl border border-hair bg-card">
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
          <p className="px-4 py-6 text-sm text-gray">Henüz üretici yok — yukarıdan ekle.</p>
        ) : null}
      </div>
    </div>
  );
}
