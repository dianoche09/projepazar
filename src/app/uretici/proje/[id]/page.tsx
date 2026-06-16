import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DURUM_BG,
  DURUM_ETIKET,
  ASAMA_ETIKET,
  zamanOnce,
  type BirimDurum,
  type InsaatAsama,
} from "@/lib/types";

function trTarih(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
}

function Lejant({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-2.5 rounded-[3px] ${renk}`} /> {etiket}
    </span>
  );
}

export default async function ProjeDetay({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proje } = await supabase.from("proje").select("*").eq("id", id).single();
  if (!proje) notFound();

  const { data: bloklar } = await supabase
    .from("blok")
    .select("id, ad, kat_sayisi")
    .eq("proje_id", id)
    .order("ad");

  const { data: birimler } = await supabase
    .from("birim")
    .select("id, blok_id, kat, daire_no, durum, liste_fiyati, satilabilir")
    .eq("proje_id", id);

  const toplam = birimler?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/uretici" className="text-sm font-medium text-teal hover:underline">
        ← Kokpit
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{proje.ad}</h1>
          <p className="mt-1 text-sm text-gray">
            {[proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—"}
            {proje.ada ? ` · Ada ${proje.ada}` : ""}
            {proje.parsel ? ` / Parsel ${proje.parsel}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1 font-mono text-xs text-gray">
          <span className="size-1.5 rounded-full bg-green" /> {zamanOnce(proje.son_guncelleme)}
        </span>
      </div>

      {/* İnşaat zaman çizelgesi (off-plan için kritik — MVP-12) */}
      <div className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">
            İnşaat: {ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}
            {proje.etap ? ` · ${proje.etap}` : ""}
          </span>
          <span className="font-mono text-sm text-teal">%{proje.ilerleme_yuzde}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hair">
          <div className="h-full bg-teal" style={{ width: `${proje.ilerleme_yuzde}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray">Başlama</p>
            <p className="font-mono text-ink">{trTarih(proje.baslama_tarihi)}</p>
          </div>
          <div>
            <p className="text-xs text-gray">Teslim</p>
            <p className="font-mono text-ink">{trTarih(proje.teslim_tarihi)}</p>
          </div>
          <div>
            <p className="text-xs text-gray">İskan</p>
            <p className="font-mono text-ink">{trTarih(proje.iskan_tarihi)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Birim ızgarası <span className="font-mono text-sm text-gray">({toplam})</span>
        </h2>
        <div className="flex flex-wrap gap-3 font-mono text-xs text-gray">
          <Lejant renk="bg-green" etiket="müsait" />
          <Lejant renk="bg-amber" etiket="opsiyon" />
          <Lejant renk="bg-red" etiket="satıldı" />
          <Lejant renk="bg-navy/30" etiket="arsa payı" />
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {(bloklar ?? []).map((blok) => {
          const bb = (birimler ?? []).filter((b) => b.blok_id === blok.id);
          const katlar = [...new Set(bb.map((b) => b.kat))]
            .filter((k): k is number => k != null)
            .sort((a, b) => b - a);
          return (
            <div key={blok.id} className="rounded-2xl border border-hair bg-card p-5">
              <h3 className="font-display text-base font-semibold text-ink">{blok.ad}</h3>
              <div className="mt-3 space-y-1.5 overflow-x-auto">
                {katlar.map((kat) => {
                  const kb = bb
                    .filter((b) => b.kat === kat)
                    .sort((a, b) => (a.daire_no ?? "").localeCompare(b.daire_no ?? ""));
                  return (
                    <div key={kat} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 font-mono text-xs text-gray">
                        {kat}. kat
                      </span>
                      <div className="flex gap-1.5">
                        {kb.map((b) => (
                          <div
                            key={b.id}
                            title={`${b.daire_no} · ${DURUM_ETIKET[b.durum as BirimDurum]}${!b.satilabilir ? " · arsa payı (satılamaz)" : ""}`}
                            className={`flex size-11 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] text-white ${DURUM_BG[b.durum as BirimDurum]} ${!b.satilabilir ? "opacity-70 ring-2 ring-inset ring-white/60" : ""}`}
                          >
                            {b.daire_no}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
