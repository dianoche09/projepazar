import { createClient } from "@/lib/supabase/server";
import { paraKisa } from "@/lib/stok";
import { StokTablo, type StokSatir } from "./StokTablo";

/* =========================================================
   STOK / FİYAT LİSTESİ — tüm birimlerin tek canlı tablosu (üretici).
   KPI + proje/durum filtreleri (client alt-bileşen). Her satır → /uretici/proje/[id].
   ========================================================= */

type BirimRaw = {
  id: string;
  proje_id: string;
  blok_id: string | null;
  tip_id: string | null;
  kat: number | null;
  daire_no: string | null;
  durum: string;
  liste_fiyati: number | null;
  kira_bedeli: number | null;
  para_birimi: string | null;
  net_m2: number | null;
  brut_m2: number | null;
  son_guncelleme: string | null;
};

export default async function UreticiStok() {
  const supabase = await createClient();

  const [{ data: projeler }, { data: birimRaw }, { data: bloklar }, { data: tipler }] =
    await Promise.all([
      supabase.from("proje").select("id, ad, para_birimi").order("created_at", { ascending: false }),
      supabase
        .from("birim")
        .select(
          "id, proje_id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, kira_bedeli, para_birimi, net_m2, brut_m2, son_guncelleme",
        ),
      supabase.from("blok").select("id, ad"),
      supabase.from("daire_tipi").select("id, ad, oda, net_m2"),
    ]);

  const birimler = (birimRaw ?? []) as BirimRaw[];
  const blokAd = new Map((bloklar ?? []).map((b) => [b.id, b.ad as string | null]));
  const tipAd = new Map(
    (tipler ?? []).map((t) => [t.id, (t.oda as string | null) ?? (t.ad as string | null)]),
  );
  const tipNet = new Map((tipler ?? []).map((t) => [t.id, t.net_m2 as number | null]));
  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));

  // KPI
  const toplam = birimler.length;
  const musait = birimler.filter((b) => b.durum === "musait").length;
  const opsiyon = birimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
  const satildi = birimler.filter((b) => b.durum === "satildi").length;

  const fiyatlar = birimler
    .map((b) => b.liste_fiyati)
    .filter((f): f is number => f != null && f > 0);
  const minFiyat = fiyatlar.length ? Math.min(...fiyatlar) : 0;
  const maxFiyat = fiyatlar.length ? Math.max(...fiyatlar) : 0;
  const anaPara = (projeler?.[0]?.para_birimi as string | null) ?? "TRY";
  const kiraVar = birimler.some((b) => b.kira_bedeli != null && b.kira_bedeli > 0);

  // Tablo satırları — son güncellemeye göre yeni → eski
  const satirlar: StokSatir[] = [...birimler]
    .sort((a, b) => (b.son_guncelleme ?? "").localeCompare(a.son_guncelleme ?? ""))
    .map((b) => ({
      id: b.id,
      proje_id: b.proje_id,
      proje_ad: projeAd.get(b.proje_id) ?? "—",
      blok_ad: blokAd.get(b.blok_id ?? "") ?? null,
      kat: b.kat,
      daire_no: b.daire_no,
      tip_ad: tipAd.get(b.tip_id ?? "") ?? null,
      net_m2: b.net_m2 ?? tipNet.get(b.tip_id ?? "") ?? null,
      brut_m2: b.brut_m2,
      liste_fiyati: b.liste_fiyati,
      kira_bedeli: b.kira_bedeli,
      para_birimi: b.para_birimi,
      durum: b.durum,
      son_guncelleme: b.son_guncelleme,
    }));

  const projeFiltre = (projeler ?? []).map((p) => ({ id: p.id, ad: p.ad as string }));

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Stok / Fiyat Listesi</h1>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Tüm projelerin tek canlı stok tablosu — fiyat/durum yalnız birim tablosundan, anlık.
        </p>
      </header>

      {/* KPI */}
      <section className="kart belir belir-1 mb-5 p-1">
        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--cizgi)] md:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          <Kpi etiket="Toplam Birim" deger={String(toplam)} alt={`${projeFiltre.length} proje`} />
          <Kpi etiket="Müsait" deger={String(musait)} renk="text-green" alt="satışa hazır" />
          <Kpi etiket="Opsiyon" deger={String(opsiyon)} renk="text-amber" alt="karar bekliyor" />
          <Kpi etiket="Satıldı" deger={String(satildi)} renk="text-red" alt={`${satildi} / ${toplam}`} />
          <div className="px-5 py-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Liste Aralığı
            </div>
            {fiyatlar.length ? (
              <div className="mono text-[19px] font-semibold leading-tight text-ink">
                {paraKisa(minFiyat, anaPara)}
                <span className="text-[13px] text-[var(--ink-faint)]">
                  –{paraKisa(maxFiyat, anaPara).replace(/^[₺$€£]/, "")}
                </span>
              </div>
            ) : (
              <div className="mono text-[19px] font-semibold leading-tight text-[var(--ink-faint)]">—</div>
            )}
            <div className="mt-2 text-[11.5px] text-[var(--ink-faint)]">birim fiyat bandı</div>
          </div>
        </div>
      </section>

      <StokTablo satirlar={satirlar} projeler={projeFiltre} kiraVar={kiraVar} />
    </div>
  );
}

function Kpi({
  etiket,
  deger,
  alt,
  renk = "text-ink",
}: {
  etiket: string;
  deger: string;
  alt?: string;
  renk?: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{etiket}</div>
      <div className={`mono text-[30px] font-semibold leading-none ${renk}`}>{deger}</div>
      {alt ? <div className="mono mt-2 text-[11.5px] text-[var(--ink-faint)]">{alt}</div> : null}
    </div>
  );
}
