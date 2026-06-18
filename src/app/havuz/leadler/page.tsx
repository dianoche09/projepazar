import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { LeadDurum } from "./LeadDurum";

export default async function Leadler() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("lead")
    .select("id, ad, telefon, durum, created_at, birim:birim_id(daire_no), proje:proje_id(ad)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Lead&apos;lerim</h1>
      <p className="mt-1 text-sm text-gray">
        Paylaşımlarından gelen sıcak müşteriler · &quot;ilk bayrağı sen diktin&quot;.
      </p>

      <div className="mt-5 space-y-2.5">
        {(leads ?? []).map((l) => {
          const proje = l.proje as { ad?: string } | null;
          const birim = l.birim as { daire_no?: string } | null;
          return (
            <div key={l.id} className="rounded-2xl border border-hair bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{l.ad}</p>
                  <a href={`tel:${l.telefon}`} className="font-mono text-sm text-teal-d">{l.telefon}</a>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray">
                {proje?.ad ?? "—"}
                {birim?.daire_no ? ` · Daire ${birim.daire_no}` : ""} · {zamanOnce(l.created_at)}
              </p>
              <div className="mt-3">
                <LeadDurum leadId={l.id} durum={l.durum} />
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`tel:${l.telefon}`}
                  className="flex-1 rounded-lg bg-navy py-2 text-center text-sm font-medium text-white"
                >
                  Ara
                </a>
                <a
                  href={`https://wa.me/${(l.telefon ?? "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-green py-2 text-center text-sm font-medium text-white"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
        {!leads || leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hair bg-card/50 p-10 text-center">
            <p className="text-sm text-gray">
              Henüz lead yok. Bir projeyi WhatsApp&apos;tan paylaş — gelen müşteri burada sana düşer.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
