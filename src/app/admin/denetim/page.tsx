import { createAdminClient } from "@/lib/supabase/admin";
import { zamanOnce } from "@/lib/types";

// Denetim / iz zinciri (Sistem Kuralları Admin Bölüm 2.5). events = append-only audit günlüğü.
// Admin-gated layout (rol=admin); service-role ile okunur (yazma server-side, okuma admin).

const TIP_ETIKET: Record<string, { ad: string; renk: string }> = {
  opsiyon: { ad: "Opsiyon", renk: "bg-amber/15 text-amber" },
  satis: { ad: "Satış", renk: "bg-green/15 text-green" },
  durum: { ad: "Durum", renk: "bg-navy/10 text-navy" },
  paylasim: { ad: "Paylaşım", renk: "bg-teal/10 text-teal-d" },
  goruntuleme: { ad: "Görüntüleme", renk: "bg-gray/10 text-gray" },
  lead: { ad: "Lead", renk: "bg-teal/15 text-teal-d" },
};
const FILTRELER = ["opsiyon", "satis", "durum", "lead", "paylasim"];

type Olay = {
  id: number;
  tip: string;
  profile_id: string | null;
  proje_id: string | null;
  birim_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function payloadOzet(p: Record<string, unknown> | null): string {
  if (!p) return "";
  if (typeof p.eylem === "string") return p.eylem;
  return Object.entries(p)
    .filter(([k]) => k !== "lead_id")
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export default async function Denetim({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const admin = createAdminClient();
  let q = admin
    .from("events")
    .select("id, tip, profile_id, proje_id, birim_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (tip) q = q.eq("tip", tip);
  const { data: olaylar } = await q;
  const L = (olaylar ?? []) as Olay[];

  const profileIds = [...new Set(L.map((o) => o.profile_id).filter(Boolean))] as string[];
  const projeIds = [...new Set(L.map((o) => o.proje_id).filter(Boolean))] as string[];
  const birimIds = [...new Set(L.map((o) => o.birim_id).filter(Boolean))] as string[];

  const profiller = profileIds.length
    ? (await admin.from("profiles").select("id, ad, rol").in("id", profileIds)).data ?? []
    : [];
  const projeler = projeIds.length
    ? (await admin.from("proje").select("id, ad").in("id", projeIds)).data ?? []
    : [];
  const birimler = birimIds.length
    ? (await admin.from("birim").select("id, daire_no").in("id", birimIds)).data ?? []
    : [];
  const pMap = new Map(profiller.map((p) => [p.id, p]));
  const prMap = new Map(projeler.map((p) => [p.id, p.ad as string]));
  const bMap = new Map(birimler.map((b) => [b.id, b.daire_no as string | null]));

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Denetim</h1>
        <p className="mt-1 text-sm text-gray">İz zinciri — opsiyon, satış, durum ve lead olayları (son 100).</p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href="/admin/denetim"
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${!tip ? "bg-navy text-white" : "border border-hair text-gray hover:text-ink"}`}
        >
          Tümü
        </a>
        {FILTRELER.map((f) => (
          <a
            key={f}
            href={`/admin/denetim?tip=${f}`}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${tip === f ? "bg-navy text-white" : "border border-hair text-gray hover:text-ink"}`}
          >
            {TIP_ETIKET[f]?.ad ?? f}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-hair bg-card shadow-card">
        {L.length > 0 ? (
          <div className="divide-y divide-hair">
            {L.map((o) => {
              const pr = pMap.get(o.profile_id ?? "");
              const t = TIP_ETIKET[o.tip] ?? { ad: o.tip, renk: "bg-gray/10 text-gray" };
              const ozet = payloadOzet(o.payload);
              return (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.renk}`}>{t.ad}</span>
                    <div className="min-w-0">
                      <p className="truncate text-ink">
                        {prMap.get(o.proje_id ?? "") ?? "—"}
                        {o.birim_id && bMap.get(o.birim_id) ? ` · Daire ${bMap.get(o.birim_id)}` : ""}
                        {ozet ? ` · ${ozet}` : ""}
                      </p>
                      <p className="text-xs text-gray">{pr ? `${pr.ad ?? "—"} (${pr.rol})` : "—"}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gray">{zamanOnce(o.created_at)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-gray">Henüz olay yok.</p>
        )}
      </div>
    </div>
  );
}
