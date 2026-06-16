import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ureticiDogrula } from "../actions";

export default async function UreticilerSayfasi() {
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
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Üreticiler — doğrulama & güven rozeti</h1>
      <p className="mt-1 text-sm text-gray">VKN/belge teyidi → doğrulanmış üretici rozeti (güven protokolü).</p>

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
          <p className="px-4 py-6 text-sm text-gray">Henüz üretici yok.</p>
        ) : null}
      </div>
    </div>
  );
}
