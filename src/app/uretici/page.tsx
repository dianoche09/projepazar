import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { Donut, Lejant, OranBar, YiginBar } from "@/components/ui/Grafik";

const C = { green: "#10b981", amber: "#f59e0b", red: "#ef4444", navy: "#1e293b" };

type Ozet = { toplam: number; musait: number; opsiyon: number; satildi: number };

function Stat({
  etiket,
  deger,
  alt,
  sinyal,
}: {
  etiket: string;
  deger: string;
  alt?: string;
  sinyal?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {sinyal ? <span className={`absolute inset-x-0 top-0 h-0.5 ${sinyal}`} aria-hidden /> : null}
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{etiket}</p>
      <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums leading-none text-slate-900">{deger}</p>
      {alt ? <p className="mt-1 text-xs text-slate-500 font-semibold">{alt}</p> : null}
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

  const { data: kapaklar } = await supabase.from("proje_belge").select("proje_id, url").eq("tip", "kapak");
  const kapakMap = new Map((kapaklar ?? []).map((k) => [k.proje_id, k.url as string | null]));

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

  const enYeni = (projeler ?? [])
    .map((p) => p.son_guncelleme)
    .filter(Boolean)
    .sort()
    .at(-1);
  const sonSenkron = enYeni ? zamanOnce(enYeni as string) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 text-slate-800">
      <div className="belir flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-900">Kokpit</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-0.5 font-mono text-[11px] font-bold text-green border border-green/20">
              <span className="nabiz size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" aria-hidden /> Canlı
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Stok, satış ve tazelik tek bakışta{sonSenkron ? ` · son senkron ${sonSenkron}` : ""}.
          </p>
        </div>
        <Link href="/uretici/proje/yeni" className="btn rounded-xl bg-teal px-5 py-3 text-xs font-bold text-white transition-all duration-300 hover:bg-teal-d shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
          + Yeni Proje
        </Link>
      </div>

      {/* GENEL BAKIŞ — donut + metrikler */}
      <section className="belir belir-1 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-bold text-slate-900 tracking-tight">Stok Dağılımı</h2>
          <div className="mt-4 flex items-center gap-6">
            <Donut parcalar={donut} ortaUst={String(toplamBirim)} ortaAlt="birim" />
            <div className="flex-1">
              <Lejant parcalar={donut} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat etiket="Proje" deger={String(projeler?.length ?? 0)} alt="aktif portföy" sinyal="bg-navy" />
          <Stat etiket="Satış oranı" deger={`%${satisOrani}`} alt={`${satildi} / ${toplamBirim} birim`} sinyal="bg-red" />
          <Stat etiket="Müsait" deger={String(musait)} alt="satışa hazır" sinyal="bg-green" />
          <Stat etiket="Opsiyonda" deger={String(opsiyon)} alt="kilitli, karar bekliyor" sinyal="bg-amber" />
        </div>
      </section>

      {/* SATIŞ KIYASI — projelere göre */}
      {(projeler?.length ?? 0) > 0 ? (
        <section className="belir belir-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-bold text-slate-900 tracking-tight">Projelere Göre Satış</h2>
          <div className="mt-4 space-y-3">
            {(projeler ?? []).map((p) => {
              const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
              return (
                <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3">
                  <span className="truncate text-sm text-slate-800 font-bold">{p.ad}</span>
                  <OranBar deger={o.satildi} maks={enCokSatan} renk={C.red} />
                  <span className="w-16 text-right font-mono text-xs tabular-nums text-slate-400 font-bold">
                    {o.satildi}/{o.toplam}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* PROJELER */}
      <section className="belir belir-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Projeler</h2>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{projeler?.length ?? 0}</span>
        </div>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {(projeler ?? []).map((p) => {
            const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
            const par = [
              { etiket: "Müsait", deger: o.musait, renk: C.green },
              { etiket: "Opsiyon", deger: o.opsiyon, renk: C.amber },
              { etiket: "Satıldı", deger: o.satildi, renk: C.red },
            ];
            const kapak = kapakMap.get(p.id);
            return (
              <Link
                key={p.id}
                href={`/uretici/proje/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:shadow-cardlg hover:-translate-y-0.5"
              >
                <div className="relative h-44 overflow-hidden sm:h-48">
                  {kapak ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kapak} alt={p.ad} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
                      <span className="select-none font-display text-5xl font-extrabold text-slate-300/40">{(p.ad ?? "P").charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {p.belge_dogrulandi ? (
                    <span className="absolute right-3 top-3 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-teal shadow-sm">✓ Belgeli</span>
                  ) : null}
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] font-bold text-white border border-white/5">
                    <span className="nabiz size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" /> {zamanOnce(p.son_guncelleme)}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="truncate font-display text-lg font-bold text-slate-900 group-hover:text-teal transition-colors tracking-tight">{p.ad}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{[p.ilce, p.il].filter(Boolean).join(", ") || "—"}</p>
                  <div className="mt-4">
                    <YiginBar parcalar={par} yukseklik={10} />
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-slate-400 font-bold">
                      <span>
                        <b className="text-slate-800 font-sans">{o.toplam}</b> birim
                      </span>
                      <span className="flex gap-3">
                        <span className="text-green">{o.musait} müsait</span>
                        <span className="text-amber">{o.opsiyon} ops.</span>
                        <span className="text-red">{o.satildi} satıldı</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {!projeler || projeler.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-10 text-center">
              <p className="text-sm text-slate-400 font-bold">Henüz proje yok.</p>
              <Link href="/uretici/proje/yeni" className="mt-3 inline-block text-sm font-bold text-teal hover:underline">
                İlk projeni oluştur →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* MÜŞTERİ SORGULA — kim-getirdi görünürlüğü (akış DEĞİL, sorgu) */}
      <section className="belir belir-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Müşteri Sorgula</h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-semibold">
              Bir müşteri sana doğrudan geldiyse ad veya telefonla sorgula — bu kişi ağda ilk kimin
              lead&apos;i olarak kaydedilmiş, gör. Lead&apos;ler sana otomatik akmaz; yalnız sorgu.
            </p>
          </div>
          <Link
            href="/uretici/lead-sorgu"
            className="btn rounded-xl bg-teal px-5 py-3 text-xs font-bold text-white transition-all duration-300 hover:bg-teal-d shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
          >
            Sorgula →
          </Link>
        </div>
      </section>
    </div>
  );
}
