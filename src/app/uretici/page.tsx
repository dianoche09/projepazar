import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { Donut, Lejant, OranBar, YiginBar } from "@/components/ui/Grafik";

const C = { green: "#2FB36B", amber: "#E3A12C", red: "#D15A4E", navy: "#13314B" };

type Ozet = { toplam: number; musait: number; opsiyon: number; satildi: number };

function Stat({ etiket, deger, alt }: { etiket: string; deger: string; alt?: string }) {
  return (
    <div className="rounded-xl border border-hair bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-gray">{etiket}</p>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums leading-none text-ink">{deger}</p>
      {alt ? <p className="mt-1 text-xs text-gray">{alt}</p> : null}
    </div>
  );
}

export default async function UreticiKokpit() {
  const supabase = await createClient();

  const { data: projeler } = await supabase
    .from("proje")
    .select("id, ad, il, ilce, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, belge_dogrulandi, son_guncelleme, created_at")
    .order("created_at", { ascending: false });

  const { data: birimler } = await supabase.from("birim").select("proje_id, durum");

  const { data: leads } = await supabase
    .from("lead")
    .select(`id, ad, telefon, durum, created_at, birim:birim_id(daire_no), proje:proje_id(ad), atanan:profiles!atanan_id(ad, telefon)`)
    .order("created_at", { ascending: false })
    .limit(8);

  const ozet = new Map<string, Ozet>();
  for (const b of birimler ?? []) {
    const o = ozet.get(b.proje_id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    ozet.set(b.proje_id, o);
  }

  const tum = [...ozet.values()];
  const toplamBirim = birimler?.length ?? 0;
  const musait = tum.reduce((a, o) => a + o.musait, 0);
  const opsiyon = tum.reduce((a, o) => a + o.opsiyon, 0);
  const satildi = tum.reduce((a, o) => a + o.satildi, 0);
  const satisOrani = toplamBirim ? Math.round((satildi / toplamBirim) * 100) : 0;

  const enCokSatan = Math.max(1, ...(projeler ?? []).map((p) => ozet.get(p.id)?.satildi ?? 0));

  const donut = [
    { etiket: "Müsait", deger: musait, renk: C.green },
    { etiket: "Opsiyon", deger: opsiyon, renk: C.amber },
    { etiket: "Satıldı", deger: satildi, renk: C.red },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Kokpit</h1>
          <p className="mt-1 text-sm text-gray">Stok, satış ve tazelik tek bakışta.</p>
        </div>
        <Link href="/uretici/proje/yeni" className="btn rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink">
          + Yeni proje
        </Link>
      </div>

      {/* GENEL BAKIŞ — donut + metrikler */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Stok dağılımı</h2>
          <div className="mt-4 flex items-center gap-6">
            <Donut parcalar={donut} ortaUst={String(toplamBirim)} ortaAlt="birim" />
            <div className="flex-1">
              <Lejant parcalar={donut} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat etiket="Proje" deger={String(projeler?.length ?? 0)} alt="aktif portföy" />
          <Stat etiket="Satış oranı" deger={`%${satisOrani}`} alt={`${satildi} / ${toplamBirim} birim`} />
          <Stat etiket="Müsait" deger={String(musait)} alt="satışa hazır" />
          <Stat etiket="Opsiyonda" deger={String(opsiyon)} alt="kilitli, karar bekliyor" />
        </div>
      </section>

      {/* SATIŞ KIYASI — projelere göre */}
      {(projeler?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Projelere göre satış</h2>
          <div className="mt-4 space-y-3">
            {(projeler ?? []).map((p) => {
              const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
              return (
                <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3">
                  <span className="truncate text-sm text-ink">{p.ad}</span>
                  <OranBar deger={o.satildi} maks={enCokSatan} renk={C.red} />
                  <span className="w-16 text-right font-mono text-xs tabular-nums text-gray">
                    {o.satildi}/{o.toplam}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* PROJELER */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Projeler</h2>
          <span className="text-sm text-gray">{projeler?.length ?? 0}</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(projeler ?? []).map((p) => {
            const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
            const par = [
              { etiket: "Müsait", deger: o.musait, renk: C.green },
              { etiket: "Opsiyon", deger: o.opsiyon, renk: C.amber },
              { etiket: "Satıldı", deger: o.satildi, renk: C.red },
            ];
            return (
              <Link
                key={p.id}
                href={`/uretici/proje/${p.id}`}
                className="group rounded-2xl border border-hair bg-card p-5 shadow-card transition-shadow hover:shadow-cardlg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-ink group-hover:text-teal-d">{p.ad}</h3>
                    <p className="text-sm text-gray">{[p.ilce, p.il].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  {p.belge_dogrulandi ? (
                    <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal-d">Belgeli</span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <YiginBar parcalar={par} />
                  <div className="mt-2.5 flex items-center justify-between font-mono text-xs text-gray">
                    <span className="tabular-nums">
                      <b className="text-ink">{o.toplam}</b> birim · {o.satildi} satıldı
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="nabiz size-1.5 rounded-full bg-green" />
                      {zamanOnce(p.son_guncelleme)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          {!projeler || projeler.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-dashed border-hair bg-card/50 p-10 text-center">
              <p className="text-sm text-gray">Henüz proje yok.</p>
              <Link href="/uretici/proje/yeni" className="mt-3 inline-block text-sm font-semibold text-teal-d hover:underline">
                İlk projeni oluştur →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* SICAK TALEPLER */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Gelen sıcak talepler</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hair bg-card shadow-card">
          {leads && leads.length > 0 ? (
            <div className="divide-y divide-hair">
              {leads.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{l.ad}</span>
                      <span className="font-mono text-xs text-gray">{l.telefon}</span>
                    </div>
                    <p className="text-xs text-gray">
                      {(l.proje as { ad?: string } | null)?.ad} · Daire {(l.birim as { daire_no?: string } | null)?.daire_no || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="text-xs">
                      <p className="font-medium text-ink">{(l.atanan as { ad?: string } | null)?.ad || "—"}</p>
                      <p className="font-mono text-gray">{(l.atanan as { telefon?: string } | null)?.telefon || ""}</p>
                    </div>
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-teal-d">{l.durum}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-10 text-center text-sm text-gray">Henüz ağ üzerinden gelen bir talep yok.</p>
          )}
        </div>
      </section>
    </div>
  );
}
