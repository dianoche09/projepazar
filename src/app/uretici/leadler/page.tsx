import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { LeadDurum } from "@/app/havuz/leadler/LeadDurum";

const AKTIF = ["yeni", "arandi", "gorusme", "opsiyon"];

function Stat({ etiket, deger, renk = "text-ink" }: { etiket: string; deger: number; renk?: string }) {
  return (
    <div className="rounded-xl border border-hair bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold tabular-nums leading-none ${renk}`}>{deger}</p>
    </div>
  );
}

export default async function UreticiLeadler() {
  const supabase = await createClient();
  // RLS lead_select → proje sahibi kendi projelerine gelen lead'leri görür
  const { data: leads } = await supabase
    .from("lead")
    .select(
      "id, ad, telefon, durum, created_at, proje:proje_id(ad), birim:birim_id(daire_no), atanan:profiles!atanan_id(ad, telefon)",
    )
    .order("created_at", { ascending: false });

  const L = leads ?? [];
  const yeni = L.filter((l) => l.durum === "yeni").length;
  const takipte = L.filter((l) => AKTIF.includes(l.durum)).length;
  const kazanildi = L.filter((l) => l.durum === "kazanildi").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Lead&apos;ler</h1>
      <p className="mt-1 text-sm text-gray">Projelerine gelen müşteri adayları — platform ne getiriyor, hangi aşamada.</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat etiket="Yeni" deger={yeni} renk="text-teal-d" />
        <Stat etiket="Takipte" deger={takipte} />
        <Stat etiket="Kazanıldı" deger={kazanildi} renk="text-green" />
      </div>

      <div className="mt-5 space-y-2.5">
        {L.map((l) => {
          const proje = l.proje as { ad?: string } | null;
          const birim = l.birim as { daire_no?: string } | null;
          const atanan = l.atanan as { ad?: string; telefon?: string } | null;
          return (
            <div key={l.id} className="rounded-2xl border border-hair bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{l.ad}</p>
                  <a href={`tel:${l.telefon}`} className="font-mono text-sm text-teal-d">{l.telefon}</a>
                </div>
                <div className="text-right text-xs text-gray">
                  <p className="font-medium text-ink">{atanan?.ad ?? "—"}</p>
                  <p className="font-mono">{atanan?.telefon ?? "danışman"}</p>
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
                <a href={`tel:${l.telefon}`} className="flex-1 rounded-lg border border-hair py-2 text-center text-sm font-medium text-ink transition-colors hover:bg-paper">
                  Ara
                </a>
                <a
                  href={`https://wa.me/${(l.telefon ?? "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-green py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
        {L.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hair bg-card/50 p-10 text-center">
            <p className="text-sm text-gray">Henüz lead yok. Emlakçılar projelerini paylaştıkça gelen talepler burada görünür.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
