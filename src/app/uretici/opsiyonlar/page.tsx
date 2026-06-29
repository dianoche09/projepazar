import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paraKisa, tazelik, DURUM_AD, DURUM_SINIF, kova } from "@/lib/stok";
import { zamanOnce } from "@/lib/types";
import { TalepKarar } from "./TalepKarar";

/* =========================================================
   OPSİYONLAR — bekleyen talepler (onay kuyruğu) + aktif opsiyon/satış (üretici).
   Talep→onay: emlakçı talep açar, müteahhit onaylar → opsiyon doğar (DEĞİŞMEZ #3).
   Opsiyon/talep SAHİBİ görünürlüğü: profiles_self RLS üreticinin başka emlakçıyı
   okumasını engeller → sahip iletişimi admin client (service-role, server-only,
   DEĞİŞMEZ #1) ile çekilir; yalnız üreticinin KENDİ projelerindeki talep/opsiyon
   sahipleri sorgulanır (RLS o satırları zaten ona gösteriyor) — sızıntı yok.
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

type OpsiyonRaw = { birim_id: string; satici_id: string; durum: string; kilit_bitis: string | null };

type TalepRaw = {
  id: string;
  created_at: string;
  talep_eden_id: string;
  birim: {
    id: string;
    daire_no: string | null;
    kat: number | null;
    durum: string;
    liste_fiyati: number | null;
    para_birimi: string | null;
    proje: { id: string; ad: string } | null;
    blok: { ad: string | null } | null;
    tip: { ad: string | null; oda: string | null } | null;
  } | null;
};

function kalanMetin(iso: string | null): { metin: string; gecti: boolean } {
  if (!iso) return { metin: "süresiz", gecti: false };
  const fark = new Date(iso).getTime() - Date.now();
  if (fark <= 0) return { metin: "süresi doldu", gecti: true };
  const saat = Math.floor(fark / 3_600_000);
  if (saat < 24) return { metin: `${saat} saat kaldı`, gecti: false };
  return { metin: `${Math.floor(saat / 24)} gün kaldı`, gecti: false };
}

export default async function UreticiOpsiyonlar() {
  const supabase = await createClient();

  const [{ data: birimRaw }, { data: bloklar }, { data: tipler }, { data: projeler }, { data: opsiyonRaw }, { data: talepRaw }] =
    await Promise.all([
      supabase
        .from("birim")
        .select("id, proje_id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, son_guncelleme")
        .in("durum", ["opsiyonlu", "satis_beklemede"]),
      supabase.from("blok").select("id, ad"),
      supabase.from("daire_tipi").select("id, ad, oda"),
      supabase.from("proje").select("id, ad"),
      supabase.from("opsiyon").select("birim_id, satici_id, durum, kilit_bitis").in("durum", ["opsiyonlu", "satis_beklemede"]),
      supabase
        .from("opsiyon_talep")
        .select(
          "id, created_at, talep_eden_id, birim:birim_id(id, daire_no, kat, durum, liste_fiyati, para_birimi, proje:proje_id(id, ad), blok:blok_id(ad), tip:tip_id(ad, oda))",
        )
        .eq("durum", "beklemede")
        .order("created_at", { ascending: true }),
    ]);

  const birimler = (birimRaw ?? []) as BirimRaw[];
  const talepler = (talepRaw ?? []) as unknown as TalepRaw[];
  const opsiyonlar = (opsiyonRaw ?? []) as OpsiyonRaw[];

  // Talep/opsiyon SAHİBİ iletişimi — admin client (yalnız bu üreticinin satırlarındaki id'ler)
  const sahipIds = [
    ...new Set([...opsiyonlar.map((o) => o.satici_id), ...talepler.map((t) => t.talep_eden_id)].filter(Boolean)),
  ];
  let profMap = new Map<string, { ad: string | null; telefon: string | null; ofis_id: string | null }>();
  let ofisMap = new Map<string, string | null>();
  if (sahipIds.length) {
    const admin = createAdminClient();
    const [{ data: prof }, { data: ofisler }] = await Promise.all([
      admin.from("profiles").select("id, ad, telefon, ofis_id").in("id", sahipIds),
      admin.from("ofis").select("id, ad, marka"),
    ]);
    profMap = new Map((prof ?? []).map((p) => [p.id as string, { ad: p.ad as string | null, telefon: p.telefon as string | null, ofis_id: p.ofis_id as string | null }]));
    ofisMap = new Map((ofisler ?? []).map((o) => [o.id as string, ((o.ad as string | null) ?? (o.marka as string | null)) || null]));
  }
  const sahip = (id: string) => {
    const p = profMap.get(id);
    if (!p) return null;
    return { ad: p.ad ?? "Emlakçı", ofis: p.ofis_id ? ofisMap.get(p.ofis_id) ?? null : null, tel: p.telefon ?? null };
  };

  const blokAd = new Map((bloklar ?? []).map((b) => [b.id, b.ad as string | null]));
  const tipAd = new Map((tipler ?? []).map((t) => [t.id, (t.oda as string | null) ?? (t.ad as string | null)]));
  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));
  const opsByBirim = new Map(opsiyonlar.map((o) => [o.birim_id, o]));

  const satirlar = [...birimler].sort((a, b) => (b.son_guncelleme ?? "").localeCompare(a.son_guncelleme ?? ""));
  const opsiyonlu = satirlar.filter((b) => b.durum === "opsiyonlu").length;
  const satisBekleyen = satirlar.filter((b) => b.durum === "satis_beklemede").length;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Opsiyonlar</h1>
          {talepler.length > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-teal-d">
              <span className="inline-block size-[7px] rounded-full bg-teal" aria-hidden />
              {talepler.length} bekleyen talep
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Emlakçı talep açar, sen onaylarsan opsiyon kilidi doğar. Çift-satış kalkanı DB seviyesinde — onayda devreye girer.
        </p>
      </header>

      {/* BEKLEYEN TALEPLER — onay kuyruğu (en önemli aksiyon) */}
      {talepler.length > 0 ? (
        <section className="kart belir belir-1 mb-5 overflow-hidden" style={{ borderLeft: "3px solid var(--color-teal)" }}>
          <div className="flex items-center justify-between border-b border-[var(--cizgi)] px-5 py-3.5">
            <h2 className="font-display text-[15px] font-bold text-ink">Bekleyen Opsiyon Talepleri</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-[11.5px] font-semibold text-teal-d">
              {talepler.length} onay bekliyor
            </span>
          </div>
          <ul className="divide-y divide-[var(--cizgi)]">
            {talepler.map((t) => {
              const b = t.birim;
              const s = sahip(t.talep_eden_id);
              const daire = [b?.blok?.ad, b?.daire_no].filter(Boolean).join(" ") || b?.daire_no || "—";
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {b?.proje?.ad ?? "—"} · <span className="mono">{daire}</span>
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--ink-faint)]">
                      {b?.tip?.oda ?? b?.tip?.ad ?? "—"}
                      {b?.liste_fiyati ? ` · ${paraKisa(b.liste_fiyati, b.para_birimi)}` : ""}
                      {` · talep ${zamanOnce(t.created_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[12.5px] font-semibold text-ink">{s?.ad ?? "Emlakçı"}</div>
                      {s?.ofis ? <div className="text-[11px] text-[var(--ink-faint)]">{s.ofis}</div> : null}
                      {s?.tel ? (
                        <a href={`tel:${s.tel}`} className="text-[11px] font-medium text-teal hover:underline">
                          {s.tel}
                        </a>
                      ) : null}
                    </div>
                    <TalepKarar talepId={t.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* KPI ŞERİDİ */}
      <section className="kart belir belir-1 mb-5 p-1">
        <div className="grid grid-cols-2 divide-x divide-[var(--cizgi)] sm:grid-cols-4">
          <Kpi etiket="Bekleyen Talep" deger={String(talepler.length)} renk="text-teal" alt="onay kuyruğu" />
          <Kpi etiket="Toplam Kilit" deger={String(satirlar.length)} alt="aktif opsiyon + satış" />
          <Kpi etiket="Opsiyon" deger={String(opsiyonlu)} renk="text-amber" alt="karar bekliyor" />
          <Kpi etiket="Satış Bekleyen" deger={String(satisBekleyen)} renk="text-red" alt="teyit aşaması" />
        </div>
      </section>

      {satirlar.length === 0 ? (
        <div className="kart belir belir-2 p-12 text-center">
          <svg width="40" height="40" className="mx-auto text-[var(--ink-faint)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <p className="mt-4 text-[15px] font-bold text-ink">Aktif opsiyon yok</p>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            {talepler.length > 0 ? "Bekleyen talepleri onaylayınca burada opsiyon görünür." : "Bir birim opsiyona alındığında burada anlık görünür."}
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
                  <th>Tutan (emlakçı)</th>
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
                  const s = ops ? sahip(ops.satici_id) : null;
                  const daire = [blokAd.get(b.blok_id ?? ""), b.daire_no].filter(Boolean).join(" · ") || b.daire_no || "—";
                  return (
                    <tr key={b.id} style={{ background: "rgba(227,161,44,.045)" }}>
                      <td>
                        <span className="text-[12px] text-ink-soft">{projeAd.get(b.proje_id) ?? "—"}</span>
                      </td>
                      <td className="mono font-medium">{daire}</td>
                      <td>{tipAd.get(b.tip_id ?? "") ?? "—"}</td>
                      <td className="mono text-right font-semibold">{b.liste_fiyati ? paraKisa(b.liste_fiyati, b.para_birimi) : "—"}</td>
                      <td>
                        <span className={`durum ${DURUM_SINIF[k]}`}>
                          <span className="nokta" />
                          {DURUM_AD[k]}
                        </span>
                      </td>
                      <td>
                        <span className={kalan.gecti ? "text-[12px] font-semibold text-red" : "text-[12px] text-ink-soft"}>{kalan.metin}</span>
                      </td>
                      <td>
                        {s ? (
                          <div className="leading-tight">
                            <div className="text-[12px] font-semibold text-ink">{s.ad}</div>
                            {s.ofis ? <div className="text-[11px] text-[var(--ink-faint)]">{s.ofis}</div> : null}
                            {s.tel ? (
                              <a href={`tel:${s.tel}`} className="text-[11px] font-medium text-teal hover:underline">
                                {s.tel}
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[12px] text-ink-soft">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`taze ${t.sinif}`}>
                          <span className="nokta" />
                          <span className="mono">{t.metin}</span>
                        </span>
                      </td>
                      <td>
                        <Link href={`/uretici/proje/${b.proje_id}`} className="btn-action h-auto min-h-0 px-2.5 py-[5px] text-[11px]">
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

function Kpi({ etiket, deger, alt, renk = "text-ink" }: { etiket: string; deger: string; alt?: string; renk?: string }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{etiket}</div>
      <div className={`mono text-[30px] font-semibold leading-none ${renk}`}>{deger}</div>
      {alt ? <div className="mono mt-2 text-[11.5px] text-[var(--ink-faint)]">{alt}</div> : null}
    </div>
  );
}
