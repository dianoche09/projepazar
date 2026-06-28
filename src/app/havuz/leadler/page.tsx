import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { LeadDurum } from "./LeadDurum";

/** Lead durum → lead-pill renk + etiket (sinyal dili). */
const LEAD_PILL: Record<string, { bg: string; renk: string; et: string }> = {
  yeni: { bg: "rgba(47,179,107,.12)", renk: "var(--color-green)", et: "Yeni" },
  arandi: { bg: "rgba(227,161,44,.14)", renk: "var(--color-amber)", et: "Arandı" },
  gorusme: { bg: "rgba(19,49,75,.10)", renk: "var(--color-navy)", et: "Görüşme" },
  opsiyon: { bg: "rgba(227,161,44,.14)", renk: "var(--color-amber)", et: "Opsiyon" },
  kazanildi: { bg: "rgba(47,179,107,.12)", renk: "var(--color-green)", et: "Kazanıldı" },
  kaybedildi: { bg: "rgba(209,90,78,.12)", renk: "var(--color-red)", et: "Kayıp" },
};

export default async function Leadler() {
  const supabase = await createClient();
  // RLS lead_select → yalnız atanan/ilk_paylaşan emlakçının kendi leadleri
  const { data: leads } = await supabase
    .from("lead")
    .select("id, ad, telefon, durum, created_at, birim:birim_id(daire_no), proje:proje_id(ad)")
    .order("created_at", { ascending: false });

  const liste = leads ?? [];
  const toplam = liste.length;
  const acik = liste.filter((l) => !["kazanildi", "kaybedildi"].includes(l.durum)).length;
  const kazanilan = liste.filter((l) => l.durum === "kazanildi").length;
  const sicak = liste.filter((l) => ["gorusme", "opsiyon"].includes(l.durum)).length;

  const KPI: [string, number, string][] = [
    ["Toplam Lead", toplam, "var(--color-navy)"],
    ["Açık Takip", acik, "var(--color-teal)"],
    ["Sıcak", sicak, "var(--color-amber)"],
    ["Kazanılan", kazanilan, "var(--color-green)"],
  ];

  return (
    <div className="mx-auto max-w-[920px] text-ink">
      <header className="belir mb-6">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="rozet" style={{ background: "rgba(30,155,138,.12)", color: "var(--color-teal)" }}>
            <span className="freshdot" style={{ background: "var(--color-teal)" }} />
            Kendi takibin
          </span>
        </div>
        <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-navy md:text-[31px]">
          Lead&apos;lerim
        </h1>
        <p className="mt-2 max-w-[560px] text-[13.5px] text-ink-soft">
          Paylaşımlarından gelen müşteri adayları. Yalnız sana atanan/paylaştığın leadleri görürsün — durumu ilerlet, ara, WhatsApp&apos;tan dönüş yap.
        </p>
      </header>

      {/* KPI şeridi */}
      <div className="belir belir-1 mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPI.map(([et, deger, renk]) => (
          <div key={et} className="kart kart-3d p-4">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">{et}</span>
            <div className="mono mt-3 text-[30px] font-semibold leading-none" style={{ color: renk }}>
              {deger}
            </div>
          </div>
        ))}
      </div>

      {/* Lead listesi */}
      <div className="belir belir-2 space-y-3">
        {liste.map((l, i) => {
          const proje = l.proje as { ad?: string } | null;
          const birim = l.birim as { daire_no?: string } | null;
          const pill = LEAD_PILL[l.durum] ?? LEAD_PILL.yeni;
          const tel = (l.telefon ?? "").replace(/\D/g, "");
          return (
            <article
              key={l.id}
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s`, ["--_sig" as string]: pill.renk }}
              className="kart kart-3d signal-top belir p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[16px] font-bold leading-tight text-ink">{l.ad || "İsimsiz aday"}</p>
                    <span className="lead-pill" style={{ background: pill.bg, color: pill.renk }}>
                      <span className="freshdot" style={{ background: pill.renk }} />
                      {pill.et}
                    </span>
                  </div>
                  <a href={`tel:${l.telefon}`} className="mono mt-1 inline-block text-[13px] font-semibold text-teal-d hover:underline">
                    {l.telefon || "—"}
                  </a>
                  <p className="mt-1.5 text-[12px] text-ink-soft">
                    {proje?.ad ?? "—"}
                    {birim?.daire_no ? ` · Daire ${birim.daire_no}` : ""} · {zamanOnce(l.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--cizgi)" }}>
                <LeadDurum leadId={l.id} durum={l.durum} />
              </div>

              <div className="mt-3 flex gap-2">
                <a href={`tel:${l.telefon}`} className="btn-primary flex-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Ara
                </a>
                <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.5 14.4c-.3-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.29-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.48.1-.19.05-.36-.02-.5-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12 2a10 10 0 0 0-8.6 15.07L2 22l5.05-1.33A10 10 0 1 0 12 2z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </article>
          );
        })}

        {toplam === 0 ? (
          <div className="kart belir p-14 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl" style={{ background: "rgba(30,155,138,.08)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-ink">Henüz lead yok</p>
            <p className="mx-auto mt-1.5 max-w-[380px] text-[13px] leading-relaxed text-ink-soft">
              Bir projeyi WhatsApp&apos;tan paylaş — paylaşım linkinden gelen müşteri adayı doğrudan burada sana düşer.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
