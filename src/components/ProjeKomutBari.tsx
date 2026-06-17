import Link from "next/link";
import { projeTazele } from "@/app/uretici/actions";
import { ASAMA_ETIKET, zamanOnce, type InsaatAsama } from "@/lib/types";

type Stats = { toplam: number; musait: number; opsiyon: number; satildi: number };
type Proje = {
  id: string;
  ad: string;
  mahalle: string | null;
  ilce: string | null;
  il: string | null;
  ada: string | null;
  parsel: string | null;
  belge_dogrulandi: boolean;
  insaat_asamasi: string;
  etap: string | null;
  ilerleme_yuzde: number;
  son_guncelleme: string;
  baslama_tarihi: string | null;
  teslim_tarihi: string | null;
  iskan_tarihi: string | null;
};

function trTarih(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
}

function Kpi({ etiket, deger, nokta }: { etiket: string; deger: number; nokta: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${nokta}`} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/55">{etiket}</span>
      </div>
      <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-white">{deger}</p>
    </div>
  );
}

/**
 * Proje "komut merkezi" başlığı — mimari/blueprint yön. Signature element.
 * Navy dominant alan + (varsa) kapak yıkaması + blueprint ızgara dokusu;
 * sinyal-renkli KPI şeridi (müsait/opsiyon/satıldı) veri dilini taşır.
 */
export function ProjeKomutBari({
  proje,
  kapakUrl,
  stats,
}: {
  proje: Proje;
  kapakUrl: string | null;
  stats: Stats;
}) {
  const konum = [proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—";
  const parsel = [proje.ada && `Ada ${proje.ada}`, proje.parsel && `Parsel ${proje.parsel}`]
    .filter(Boolean)
    .join(" / ");

  return (
    <header className="relative overflow-hidden rounded-2xl border border-navy/30 bg-navy text-white shadow-cardlg">
      {kapakUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={kapakUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-navy/80 via-navy/92 to-ink" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{proje.ad}</h1>
              {proje.belge_dogrulandi ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/25 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-teal/50">
                  Doğrulanmış
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-white/70">
              {konum}
              {parsel ? <span className="font-mono text-white/55"> · {parsel}</span> : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/uretici/proje/${proje.id}/kurulum`}
              className="btn rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Kurulum
            </Link>
            <form action={projeTazele}>
              <input type="hidden" name="proje_id" value={proje.id} />
              <button className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-d">
                Stok Güncel
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              {ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}
              {proje.etap ? ` · ${proje.etap}` : ""}
            </span>
            <span className="font-mono tabular-nums text-white">%{proje.ilerleme_yuzde}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal to-green"
              style={{ width: `${proje.ilerleme_yuzde}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi etiket="Toplam" deger={stats.toplam} nokta="bg-white/60" />
          <Kpi etiket="Müsait" deger={stats.musait} nokta="bg-green" />
          <Kpi etiket="Opsiyon" deger={stats.opsiyon} nokta="bg-amber" />
          <Kpi etiket="Satıldı" deger={stats.satildi} nokta="bg-red" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/10 pt-3 text-xs text-white/60">
          <span>Başlama <span className="font-mono text-white/85">{trTarih(proje.baslama_tarihi)}</span></span>
          <span>Teslim <span className="font-mono text-white/85">{trTarih(proje.teslim_tarihi)}</span></span>
          <span>İskân <span className="font-mono text-white/85">{trTarih(proje.iskan_tarihi)}</span></span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className="nabiz size-1.5 rounded-full bg-green" /> {zamanOnce(proje.son_guncelleme)}
          </span>
        </div>
      </div>
    </header>
  );
}
