import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { zamanOnce } from "@/lib/types";
import { GeriLink, SayfaBaslik } from "../_ortak";

// Denetim / iz zinciri (Sistem Kuralları Admin Bölüm 2.5). events = append-only audit günlüğü.
// Admin-gated layout (rol=admin); service-role ile okunur (yazma server-side, okuma admin).

// Olay tipi → dot rengi + rozet tonu + başlık (Genel Bakış iz zinciri ile aynı dil)
const TIP_RENK: Record<string, { ad: string; dot: string; rozet: string; baslik: string }> = {
  opsiyon: { ad: "opsiyon", dot: "#e3a12c", rozet: "bg-amber-soft text-amber", baslik: "Opsiyon alındı" },
  satis: { ad: "satış", dot: "#d15a4e", rozet: "bg-red/12 text-red", baslik: "Satış kapandı" },
  durum: { ad: "stok", dot: "#1e9b8a", rozet: "bg-teal/12 text-teal-d", baslik: "Durum değişti" },
  lead: { ad: "lead", dot: "#13314b", rozet: "bg-navy/10 text-navy", baslik: "Lead düştü" },
  paylasim: { ad: "paylaşım", dot: "#1e9b8a", rozet: "bg-teal/12 text-teal-d", baslik: "Paylaşıldı" },
  goruntuleme: { ad: "görüntüleme", dot: "#98a2b3", rozet: "bg-gray/12 text-gray", baslik: "Görüntülendi" },
  favori: { ad: "favori", dot: "#d15a4e", rozet: "bg-red/12 text-red", baslik: "Favorilendi" },
  onay: { ad: "onay", dot: "#2fb36b", rozet: "bg-green-soft text-teal-d", baslik: "Hesap onay/red/durum" },
  dogrulama: { ad: "doğrulama", dot: "#1e9b8a", rozet: "bg-teal/12 text-teal-d", baslik: "Üretici doğrulama" },
  abonelik: { ad: "abonelik", dot: "#13314b", rozet: "bg-navy/10 text-navy", baslik: "Abonelik atandı" },
};
const FILTRELER = ["opsiyon", "satis", "durum", "lead", "paylasim", "onay", "dogrulama", "abonelik"];
const FILTRE_ETIKET: Record<string, string> = {
  opsiyon: "Opsiyon",
  satis: "Satış",
  durum: "Durum",
  lead: "Lead",
  paylasim: "Paylaşım",
  onay: "Onay",
  dogrulama: "Doğrulama",
  abonelik: "Abonelik",
};

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
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
        <GeriLink href="/admin" etiket="Genel Bakış" />
        <SayfaBaslik baslik="Denetim" altEtiket={<span className="text-gray">İz zinciri</span>} />
        <div className="kart p-8 text-center text-sm text-gray">Denetim günlüğü şu an okunamıyor — servis anahtarı tanımlı değil.</div>
      </div>
    );
  }
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
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Denetim"
        noktaRenk="var(--color-teal)"
        altEtiket={
          <>
            <span className="font-medium">canlı iz zinciri</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">opsiyon · satış · durum · lead · paylaşım (son 100)</span>
          </>
        }
        sag={<span className="rozet mono bg-navy/10 text-navy">{L.length} olay</span>}
      />

      {/* Tip filtreleri */}
      <div className="belir belir-1 flex flex-wrap gap-2">
        <Link
          href="/admin/denetim"
          className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            !tip ? "bg-navy text-white" : "border border-hair bg-card text-gray hover:text-ink"
          }`}
        >
          Tümü
        </Link>
        {FILTRELER.map((f) => (
          <Link
            key={f}
            href={`/admin/denetim?tip=${f}`}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tip === f ? "bg-navy text-white" : "border border-hair bg-card text-gray hover:text-ink"
            }`}
          >
            {FILTRE_ETIKET[f] ?? f}
          </Link>
        ))}
      </div>

      <div className="kart belir belir-2 signal-top !p-0" style={{ ["--_sig" as string]: "var(--color-teal)" }}>
        {L.length > 0 ? (
          <ul className="px-5 py-4">
            {L.map((o, i) => {
              const t = TIP_RENK[o.tip] ?? { ad: o.tip, dot: "#98a2b3", rozet: "bg-gray/12 text-gray", baslik: o.tip };
              const pr = pMap.get(o.profile_id ?? "");
              const proje = prMap.get(o.proje_id ?? "");
              const daire = o.birim_id ? bMap.get(o.birim_id) : null;
              const ozet = payloadOzet(o.payload);
              const son = i === L.length - 1;
              return (
                <li key={o.id} className={`relative pl-7 ${son ? "" : "pb-4"}`}>
                  {/* dikey çizgi */}
                  {son ? null : <span className="absolute left-[5px] top-3.5 h-full w-px bg-hair" aria-hidden />}
                  <span
                    className="absolute left-0 top-1 size-3 rounded-full border-[2.5px] border-card"
                    style={{ background: t.dot, boxShadow: "0 0 0 1px rgba(16,36,58,.12)" }}
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{t.baslik}</span>
                      <span className={`rozet ${t.rozet} !px-2 !py-0.5 !text-[10.5px]`}>{t.ad}</span>
                    </div>
                    <span className="mono text-[11.5px] text-gray">{zamanOnce(o.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">
                    {proje ? <span className="text-ink">{proje}</span> : null}
                    {proje && daire ? ` · Daire ${daire}` : daire ? `Daire ${daire}` : ""}
                    {(proje || daire) && ozet ? " · " : ""}
                    {ozet}
                    {!proje && !daire && !ozet ? "—" : ""}
                  </p>
                  {pr ? (
                    <Link
                      href={`/admin/kullanicilar/${o.profile_id}`}
                      className="mono mt-0.5 inline-flex text-[11.5px] text-gray transition-colors hover:text-teal-d"
                    >
                      {pr.ad ?? "—"} ({pr.rol}) →
                    </Link>
                  ) : (
                    <p className="mono mt-0.5 text-[11.5px] text-gray">—</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-16 text-center text-sm text-gray">
            {tip ? `Bu tipte (${FILTRE_ETIKET[tip] ?? tip}) olay yok.` : "Henüz denetim olayı yok."}
          </p>
        )}
      </div>
    </div>
  );
}
