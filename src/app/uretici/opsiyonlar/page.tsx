import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { paraKisa, tazelik, DURUM_AD, DURUM_SINIF, kova } from "@/lib/stok";

/* =========================================================
   OPSİYONLAR — aktif opsiyon/satış bekleyen birimler (üretici).
   Kaynak = birim.durum (opsiyonlu/satis_beklemede); opsiyon kaydı varsa
   kilit bitişi + tutan satıcı zenginleştirir. Her satır → /uretici/proje/[id].
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
  para_birimi: string | null;
  son_guncelleme: string | null;
};

type OpsiyonRaw = {
  birim_id: string;
  satici_id: string;
  durum: string;
  kilit_bitis: string | null;
};

function kalanMetin(iso: string | null): { metin: string; gecti: boolean } {
  if (!iso) return { metin: "süresiz", gecti: false };
  const fark = new Date(iso).getTime() - Date.now();
  if (fark <= 0) return { metin: "süresi doldu", gecti: true };
  const saat = Math.floor(fark / 3_600_000);
  if (saat < 24) return { metin: `${saat} saat kaldı`, gecti: false };
  const gun = Math.floor(saat / 24);
  return { metin: `${gun} gün kaldı`, gecti: false };
}

export default async function UreticiOpsiyonlar() {
  const supabase = await createClient();

  const [{ data: birimRaw }, { data: bloklar }, { data: tipler }, { data: projeler }, { data: opsiyonRaw }, { data: profiller }] =
    await Promise.all([
      supabase
        .from("birim")
        .select("id, proje_id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, son_guncelleme")
        .in("durum", ["opsiyonlu", "satis_beklemede"]),
      supabase.from("blok").select("id, ad"),
      supabase.from("daire_tipi").select("id, ad, oda"),
      supabase.from("proje").select("id, ad"),
      supabase
        .from("opsiyon")
        .select("birim_id, satici_id, durum, kilit_bitis")
        .in("durum", ["opsiyonlu", "satis_beklemede"]),
      supabase.from("profiles").select("id, ad"),
    ]);

  const birimler = (birimRaw ?? []) as BirimRaw[];
  const blokAd = new Map((bloklar ?? []).map((b) => [b.id, b.ad as string | null]));
  const tipAd = new Map(
    (tipler ?? []).map((t) => [t.id, (t.oda as string | null) ?? (t.ad as string | null)]),
  );
  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));
  const saticiAd = new Map((profiller ?? []).map((p) => [p.id, p.ad as string | null]));
  const opsByBirim = new Map((opsiyonRaw ?? []).map((o) => [o.birim_id, o as OpsiyonRaw]));

  const satirlar = [...birimler].sort(
    (a, b) => (b.son_guncelleme ?? "").localeCompare(a.son_guncelleme ?? ""),
  );

  const opsiyonlu = satirlar.filter((b) => b.durum === "opsiyonlu").length;
  const satisBekleyen = satirlar.filter((b) => b.durum === "satis_beklemede").length;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Opsiyonlar</h1>
          {satirlar.length > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-[#9a6a12]">
              <span className="inline-block size-[7px] rounded-full bg-amber" aria-hidden />
              {satirlar.length} aktif
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Kilitli birimler — karar bekleyen opsiyon ({opsiyonlu}) + satış bekleyen ({satisBekleyen}). Çift-satış kalkanı DB seviyesinde.
        </p>
      </header>

      {/* KPI ŞERİDİ */}
      <section className="kart belir belir-1 mb-5 p-1">
        <div className="grid grid-cols-3 divide-x divide-[var(--cizgi)]">
          <Kpi etiket="Toplam Kilit" deger={String(satirlar.length)} alt="aktif opsiyon + satış" />
          <Kpi etiket="Opsiyon" deger={String(opsiyonlu)} renk="text-amber" alt="karar bekliyor" />
          <Kpi etiket="Satış Bekleyen" deger={String(satisBekleyen)} renk="text-red" alt="teyit aşaması" />
        </div>
      </section>

      {satirlar.length === 0 ? (
        <div className="kart belir belir-2 p-12 text-center">
          <svg
            width="40"
            height="40"
            className="mx-auto text-[var(--ink-faint)] opacity-40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <p className="mt-4 text-[15px] font-bold text-ink">Aktif opsiyon yok</p>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            Bir birim opsiyona alındığında burada anlık görünür. Şu an tüm stok serbest.
          </p>
          <Link href="/uretici/stok" className="mt-4 inline-block text-[13px] font-semibold text-teal hover:underline">
            Stoğu gör →
          </Link>
        </div>
      ) : (
        <div className="kart belir belir-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Proje</th>
                  <th>Daire</th>
                  <th>Tip</th>
                  <th className="text-right">Fiyat</th>
                  <th>Durum</th>
                  <th>Kilit</th>
                  <th>Tutan</th>
                  <th>Son Güncelleme</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {satirlar.map((b) => {
                  const k = kova(b.durum);
                  const t = tazelik(b.son_guncelleme);
                  const ops = opsByBirim.get(b.id) ?? null;
                  const kalan = kalanMetin(ops?.kilit_bitis ?? null);
                  const daire = [blokAd.get(b.blok_id ?? ""), b.daire_no].filter(Boolean).join(" · ") || b.daire_no || "—";
                  return (
                    <tr key={b.id} style={{ background: "rgba(227,161,44,.045)" }}>
                      <td>
                        <span className="text-[12px] text-ink-soft">{projeAd.get(b.proje_id) ?? "—"}</span>
                      </td>
                      <td className="mono font-medium">{daire}</td>
                      <td>{tipAd.get(b.tip_id ?? "") ?? "—"}</td>
                      <td className="mono text-right font-semibold">
                        {b.liste_fiyati ? paraKisa(b.liste_fiyati, b.para_birimi) : "—"}
                      </td>
                      <td>
                        <span className={`durum ${DURUM_SINIF[k]}`}>
                          <span className="nokta" />
                          {DURUM_AD[k]}
                        </span>
                      </td>
                      <td>
                        <span className={kalan.gecti ? "text-[12px] font-semibold text-red" : "text-[12px] text-ink-soft"}>
                          {kalan.metin}
                        </span>
                      </td>
                      <td className="text-[12px] text-ink-soft">{ops ? saticiAd.get(ops.satici_id) ?? "—" : "—"}</td>
                      <td>
                        <span className={`taze ${t.sinif}`}>
                          <span className="nokta" />
                          <span className="mono">{t.metin}</span>
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/uretici/proje/${b.proje_id}`}
                          className="btn-action h-auto min-h-0 px-2.5 py-[5px] text-[11px]"
                        >
                          Yönet
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
