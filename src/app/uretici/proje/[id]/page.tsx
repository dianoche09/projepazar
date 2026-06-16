import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { blokEkle, daireTipiEkle, birimGenerator, excelImport, tahsisSil } from "@/app/uretici/actions";
import { TahsisForm } from "./TahsisForm";
import {
  ASAMA_ETIKET,
  zamanOnce,
  type BirimDurum,
  type InsaatAsama,
} from "@/lib/types";
import { BirimHucre } from "@/components/BirimHucre";

const inpCls =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";
const btnCls =
  "rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { id } = await params;
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();

  const { data: proje } = await supabase.from("proje").select("*").eq("id", id).single();
  if (!proje) notFound();

  const { data: bloklar } = await supabase
    .from("blok")
    .select("id, ad, kat_sayisi")
    .eq("proje_id", id)
    .order("ad");

  const { data: tipler } = await supabase
    .from("daire_tipi")
    .select("id, ad, oda, net_m2, taban_fiyat")
    .eq("proje_id", id)
    .order("ad");

  const { data: birimler } = await supabase
    .from("birim")
    .select(
      "id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, durum_notu, son_guncelleme",
    )
    .eq("proje_id", id);

  const { data: tahsisler } = await supabase
    .from("tahsis")
    .select("id, hedef_tip, hedef_id, kapsam, komisyon_tip, komisyon_deger, munhasir, kontenjan, fiyat_gorunur")
    .eq("proje_id", id);
  const { data: ofisler } = await supabase.from("ofis").select("id, ad").order("ad");

  const tipMap = new Map((tipler ?? []).map((t) => [t.id, t]));
  const blokMap = new Map((bloklar ?? []).map((b) => [b.id, b.ad]));
  const ofisMap = new Map((ofisler ?? []).map((o) => [o.id, o.ad]));
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

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">
          {mesaj}
        </p>
      ) : null}

      {/* İnşaat zaman çizelgesi (MVP-12) */}
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

      {/* Birim ızgarası */}
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
              {katlar.length === 0 ? (
                <p className="mt-2 text-sm text-gray">Bu blokta henüz birim yok (generator ile üret).</p>
              ) : (
                <div className="mt-3 space-y-1.5 overflow-x-auto">
                  {katlar.map((kat) => {
                    const kb = bb
                      .filter((b) => b.kat === kat)
                      .sort((a, b) => (a.daire_no ?? "").localeCompare(b.daire_no ?? ""));
                    return (
                      <div key={kat} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 font-mono text-xs text-gray">{kat}. kat</span>
                        <div className="flex gap-1.5">
                          {kb.map((b) => {
                            const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
                            return (
                              <BirimHucre
                                key={b.id}
                                projeId={id}
                                birim={{
                                  id: b.id,
                                  daire_no: b.daire_no,
                                  kat: b.kat,
                                  durum: b.durum as BirimDurum,
                                  satilabilir: b.satilabilir,
                                  liste_fiyati: b.liste_fiyati,
                                  para_birimi: b.para_birimi,
                                  net_m2: b.net_m2,
                                  brut_m2: b.brut_m2,
                                  yon: b.yon,
                                  manzara: b.manzara,
                                  durum_notu: b.durum_notu,
                                  son_guncelleme: b.son_guncelleme,
                                  serefiye: b.serefiye as { kat?: number; manzara?: number } | null,
                                  taban_fiyat: tip?.taban_fiyat ?? null,
                                  tip_ad: tip?.ad ?? null,
                                  oda: tip?.oda ?? null,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== TAHSİS (MOAT) ===== */}
      <section className="mt-12 border-t border-hair pt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Tahsis — dağıtım (MOAT)</h2>
        <p className="mt-1 text-sm text-gray">
          Hangi kapsam kime açık, komisyon ne. Emlakçı yalnız tahsisli + satılabilir birimi görür/satar.
        </p>

        <div className="mt-4 space-y-2">
          {(tahsisler ?? []).map((t) => {
            const bloklarKapsam = ((t.kapsam as { bloklar?: string[] } | null)?.bloklar ?? [])
              .map((bid) => blokMap.get(bid) ?? "?")
              .join(", ");
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-hair bg-card p-3">
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                  {t.hedef_tip === "herkes" ? "Herkese açık" : ofisMap.get(t.hedef_id) ?? "Ofis"}
                </span>
                <span className="text-sm text-gray">{bloklarKapsam || "tüm proje"}</span>
                <span className="font-mono text-xs text-gray">
                  {t.komisyon_tip === "yok"
                    ? "komisyon yok"
                    : t.komisyon_tip === "yuzde"
                      ? `%${t.komisyon_deger}`
                      : `${Number(t.komisyon_deger).toLocaleString("tr-TR")}₺`}
                  {t.munhasir ? " · münhasır" : ""}
                  {t.kontenjan ? ` · kont. ${t.kontenjan}` : ""}
                  {!t.fiyat_gorunur ? " · fiyat gizli" : ""}
                </span>
                <form action={tahsisSil} className="ml-auto">
                  <input type="hidden" name="tahsis_id" value={t.id} />
                  <input type="hidden" name="proje_id" value={id} />
                  <button className="rounded-lg border border-hair px-3 py-1 text-sm text-red transition-colors hover:border-red">
                    Kaldır
                  </button>
                </form>
              </div>
            );
          })}
          {(tahsisler?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray">Henüz tahsis yok — kimse göremez. Aşağıdan ekle.</p>
          ) : null}
        </div>

        <div className="mt-4">
          <TahsisForm projeId={id} bloklar={bloklar ?? []} ofisler={ofisler ?? []} />
        </div>
      </section>

      {/* ===== STOK YÖNETİMİ ===== */}
      <section className="mt-12 border-t border-hair pt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Stok yönetimi</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {/* Bloklar */}
          <div className="rounded-2xl border border-hair bg-card p-5">
            <h3 className="font-medium text-ink">Bloklar ({bloklar?.length ?? 0})</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray">
              {(bloklar ?? []).map((b) => (
                <li key={b.id}>
                  {b.ad}
                  {b.kat_sayisi ? ` · ${b.kat_sayisi} kat` : ""}
                </li>
              ))}
            </ul>
            <form action={blokEkle} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="proje_id" value={id} />
              <input name="ad" placeholder="C Blok" required className={`${inpCls} flex-1`} />
              <input name="kat_sayisi" type="number" placeholder="kat" className={`${inpCls} w-20`} />
              <button className={btnCls}>Ekle</button>
            </form>
          </div>

          {/* Daire tipleri */}
          <div className="rounded-2xl border border-hair bg-card p-5">
            <h3 className="font-medium text-ink">Daire tipleri ({tipler?.length ?? 0})</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray">
              {(tipler ?? []).map((t) => (
                <li key={t.id}>
                  {t.ad}
                  {t.oda ? ` · ${t.oda}` : ""}
                  {t.net_m2 ? ` · ${t.net_m2}m²` : ""}
                  {t.taban_fiyat ? ` · ${Number(t.taban_fiyat).toLocaleString("tr-TR")}₺` : ""}
                </li>
              ))}
            </ul>
            <form action={daireTipiEkle} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="proje_id" value={id} />
              <input name="ad" placeholder="2+1 Standart" required className={inpCls} />
              <input name="oda" placeholder="2+1" className={inpCls} />
              <input name="net_m2" type="number" placeholder="net m²" className={inpCls} />
              <input name="taban_fiyat" type="number" placeholder="taban fiyat ₺" className={inpCls} />
              <button className={`${btnCls} col-span-2`}>Tip ekle</button>
            </form>
          </div>
        </div>

        {/* Generator */}
        <div className="mt-5 rounded-2xl border border-hair bg-card p-5">
          <h3 className="font-medium text-ink">Generator — toplu birim üret (tip × kat)</h3>
          {(bloklar?.length ?? 0) > 0 && (tipler?.length ?? 0) > 0 ? (
            <form action={birimGenerator} className="mt-3 grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="proje_id" value={id} />
              <label className="flex flex-col gap-1 text-xs text-gray">
                Blok
                <select name="blok_id" required className={inpCls}>
                  {(bloklar ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Daire tipi
                <select name="tip_id" required className={inpCls}>
                  {(tipler ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Daire / kat
                <input name="daire_basina" type="number" defaultValue={2} min={1} className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Başlangıç kat
                <input name="kat_bas" type="number" defaultValue={1} className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Bitiş kat
                <input name="kat_son" type="number" defaultValue={10} className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Taban fiyat ₺
                <input name="taban_fiyat" type="number" placeholder="ör. 2800000" className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Kat şerefiyesi %
                <input name="kat_artis" type="number" defaultValue={2} className={inpCls} />
              </label>
              <div className="flex items-end sm:col-span-2">
                <button className={`${btnCls} w-full`}>Birimleri üret</button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-sm text-gray">
              Generator için en az 1 blok ve 1 daire tipi tanımla.
            </p>
          )}
        </div>

        {/* Excel/CSV ile toplu yükle */}
        <div className="mt-5 rounded-2xl border border-hair bg-card p-5">
          <h3 className="font-medium text-ink">Excel/CSV ile toplu yükle</h3>
          <p className="mt-1 text-xs text-gray">
            Sütunlar: <span className="font-mono">blok · kat · daire_no · tip · durum · fiyat · net_m2</span>{" "}
            (blok adları mevcut bloklarla eşleşmeli).
          </p>
          <form action={excelImport} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="proje_id" value={id} />
            <input
              type="file"
              name="dosya"
              accept=".xlsx,.xls,.csv"
              required
              className="text-sm text-gray file:mr-2 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:text-white"
            />
            <button className={btnCls}>Yükle</button>
          </form>
        </div>
      </section>
    </div>
  );
}
