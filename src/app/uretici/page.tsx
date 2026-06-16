import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";

type DurumOzet = { toplam: number; musait: number; opsiyon: number; satildi: number };

function KpiKart({
  etiket,
  deger,
  renk = "text-ink",
}: {
  etiket: string;
  deger: number;
  renk?: string;
}) {
  return (
    <div className="rounded-2xl border border-hair bg-card p-4">
      <p className="text-xs text-gray">{etiket}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${renk}`}>{deger}</p>
    </div>
  );
}

export default async function UreticiKokpit() {
  const supabase = await createClient();

  // RLS: proje_owner → üretici kendi projelerini görür (admin hepsini)
  const { data: projeler } = await supabase
    .from("proje")
    .select(
      "id, ad, il, ilce, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, belge_dogrulandi, son_guncelleme, created_at",
    )
    .order("created_at", { ascending: false });

  const { data: birimler } = await supabase.from("birim").select("proje_id, durum");

  const ozet = new Map<string, DurumOzet>();
  for (const b of birimler ?? []) {
    const o = ozet.get(b.proje_id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    ozet.set(b.proje_id, o);
  }

  const tumOzet = [...ozet.values()];
  const toplamBirim = birimler?.length ?? 0;
  const toplamMusait = tumOzet.reduce((a, o) => a + o.musait, 0);
  const toplamSatildi = tumOzet.reduce((a, o) => a + o.satildi, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Üretici Kokpiti</h1>
      <p className="mt-1 text-sm text-gray">Stok, satış ve tazelik tek bakışta.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiKart etiket="Proje" deger={projeler?.length ?? 0} />
        <KpiKart etiket="Toplam birim" deger={toplamBirim} />
        <KpiKart etiket="Müsait" deger={toplamMusait} renk="text-green" />
        <KpiKart etiket="Satıldı" deger={toplamSatildi} renk="text-red" />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Projeler</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(projeler ?? []).map((p) => {
          const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
          const yuzde = (n: number) => (o.toplam ? (n / o.toplam) * 100 : 0);
          return (
            <Link
              key={p.id}
              href={`/uretici/proje/${p.id}`}
              className="rounded-2xl border border-hair bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{p.ad}</h3>
                  <p className="text-sm text-gray">
                    {[p.ilce, p.il].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                {p.belge_dogrulandi ? (
                  <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
                    Belgeli
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-hair">
                <div className="bg-green" style={{ width: `${yuzde(o.musait)}%` }} />
                <div className="bg-amber" style={{ width: `${yuzde(o.opsiyon)}%` }} />
                <div className="bg-red" style={{ width: `${yuzde(o.satildi)}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between font-mono text-xs text-gray">
                <span>
                  {o.toplam} birim · {o.musait} müsait · {o.satildi} satıldı
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green" />
                  {zamanOnce(p.son_guncelleme)}
                </span>
              </div>
            </Link>
          );
        })}
        {!projeler || projeler.length === 0 ? (
          <p className="text-sm text-gray">
            Henüz proje yok. Proje oluşturma PR-3b&apos;de gelecek.
          </p>
        ) : null}
      </div>
    </div>
  );
}
