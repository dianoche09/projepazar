import { createClient } from "@/lib/supabase/server";
import { OranBar, YiginBar } from "@/components/ui/Grafik";

const C = { green: "#2FB36B", amber: "#E3A12C", red: "#D15A4E", navy: "#13314B", teal: "#1E9B8A" };

const HUNI: [string, string, string][] = [
  ["yeni", "Yeni", C.teal],
  ["arandi", "Arandı", C.navy],
  ["gorusme", "Görüşme", C.amber],
  ["opsiyon", "Opsiyon", C.amber],
  ["kazanildi", "Kazanıldı", C.green],
];

type OdaOzet = { toplam: number; musait: number; opsiyon: number; satildi: number };

export default async function Raporlar() {
  const supabase = await createClient();
  const [{ data: leads }, { data: birimler }, { data: tipler }] = await Promise.all([
    supabase.from("lead").select("durum"),
    supabase.from("birim").select("tip_id, durum"),
    supabase.from("daire_tipi").select("id, oda, ad"),
  ]);

  const L = leads ?? [];
  const toplamLead = L.length;
  const leadSay = (d: string) => L.filter((l) => l.durum === d).length;
  const kazanildi = leadSay("kazanildi");
  const kaybedildi = leadSay("kaybedildi");
  const donusum = toplamLead ? Math.round((kazanildi / toplamLead) * 100) : 0;
  const huniMaks = Math.max(1, toplamLead);

  // Oda (tip) bazlı performans — tüm projeler
  const tipMap = new Map((tipler ?? []).map((t) => [t.id, t]));
  const odalar = new Map<string, OdaOzet>();
  for (const b of birimler ?? []) {
    const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
    const oda = tip?.oda ?? tip?.ad ?? "Diğer";
    const o = odalar.get(oda) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    odalar.set(oda, o);
  }
  const odaListe = [...odalar.entries()].sort((a, b) => b[1].satildi - a[1].satildi);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Raporlar</h1>
        <p className="mt-1 text-sm text-gray">Lead dönüşümü ve daire tipi performansı — karar için.</p>
      </div>

      {/* LEAD HUNİSİ */}
      <section className="rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-ink">Lead hunisi</h2>
          <span className="text-xs text-gray">
            Dönüşüm oranı <b className="font-mono text-green">%{donusum}</b> · {kazanildi}/{toplamLead}
          </span>
        </div>
        {toplamLead === 0 ? (
          <p className="mt-4 text-sm text-gray">Henüz lead yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {HUNI.map(([d, et, renk]) => {
              const n = leadSay(d);
              return (
                <div key={d} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
                  <span className="text-sm text-ink">{et}</span>
                  <OranBar deger={n} maks={huniMaks} renk={renk} />
                  <span className="w-10 text-right font-mono text-xs tabular-nums text-gray">{n}</span>
                </div>
              );
            })}
            <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 border-t border-hair pt-3">
              <span className="text-sm text-red">Kayıp</span>
              <OranBar deger={kaybedildi} maks={huniMaks} renk={C.red} />
              <span className="w-10 text-right font-mono text-xs tabular-nums text-gray">{kaybedildi}</span>
            </div>
          </div>
        )}
      </section>

      {/* DAİRE TİPİ PERFORMANSI */}
      <section className="rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
        <h2 className="font-display text-sm font-semibold text-ink">Daire tipi performansı</h2>
        <p className="mt-0.5 text-xs text-gray">Tüm projeler · hangi tip satıyor, hangisi bekliyor.</p>
        {odaListe.length === 0 ? (
          <p className="mt-4 text-sm text-gray">Henüz birim yok.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {odaListe.map(([oda, o]) => {
              const par = [
                { etiket: "Müsait", deger: o.musait, renk: C.green },
                { etiket: "Opsiyon", deger: o.opsiyon, renk: C.amber },
                { etiket: "Satıldı", deger: o.satildi, renk: C.red },
              ];
              const oran = o.toplam ? Math.round((o.satildi / o.toplam) * 100) : 0;
              return (
                <div key={oda}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink">{oda}</span>
                    <span className="font-mono text-xs tabular-nums text-gray">
                      {o.satildi}/{o.toplam} satıldı · %{oran}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <YiginBar parcalar={par} yukseklik={9} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
