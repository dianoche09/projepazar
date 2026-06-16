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

  // RLS: Üreticinin projelerine gelen sıcak lead'leri listele
  const { data: leads } = await supabase
    .from("lead")
    .select(`
      id, ad, telefon, durum, created_at,
      birim:birim_id(daire_no),
      proje:proje_id(ad),
      atanan:profiles!atanan_id(ad, telefon)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

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
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      {/* Üst Kısım / KPI Kartları */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Üretici Kokpiti</h1>
            <p className="mt-1 text-sm text-gray">Stok, satış ve tazelik tek bakışta.</p>
          </div>
          <Link
            href="/uretici/proje/yeni"
            className="rounded-lg bg-navy px-4 py-2 font-medium text-white transition-colors hover:bg-ink"
          >
            + Yeni proje
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiKart etiket="Proje" deger={projeler?.length ?? 0} />
          <KpiKart etiket="Toplam birim" deger={toplamBirim} />
          <KpiKart etiket="Müsait" deger={toplamMusait} renk="text-green" />
          <KpiKart etiket="Satıldı" deger={toplamSatildi} renk="text-red" />
        </div>
      </div>

      {/* Projeler Listesi */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Projeler</h2>
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
            <p className="text-sm text-gray col-span-2">
              Henüz proje yok.
            </p>
          ) : null}
        </div>
      </div>

      {/* Sıcak Lead Inbox */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Gelen Sıcak Talepler (Lead)</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hair bg-card shadow-sm">
          {leads && leads.length > 0 ? (
            <div className="divide-y divide-hair">
              {leads.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm hover:bg-paper/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{l.ad}</span>
                      <span className="font-mono text-xs text-gray">{l.telefon}</span>
                    </div>
                    <p className="text-xs text-gray">
                      Talep Edilen: <span className="font-medium text-ink">{(l.proje as any)?.ad}</span> · Daire {(l.birim as any)?.daire_no || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="text-xs">
                      <p className="font-medium text-ink">Emlakçı: {(l.atanan as any)?.ad || "—"}</p>
                      <p className="text-gray font-mono">{(l.atanan as any)?.telefon || ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal uppercase">
                        {l.durum}
                      </span>
                      <span className="font-mono text-[10px] text-gray">{zamanOnce(l.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-gray">Henüz ağ üzerinden gelen bir talep yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
