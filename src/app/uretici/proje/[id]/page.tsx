import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  blokEkle,
  blokGuncelle,
  blokSil,
  daireTipiEkle,
  tipGuncelle,
  tipSil,
  excelImport,
  tahsisSil,
  projeTazele,
} from "@/app/uretici/actions";
import { TahsisForm } from "./TahsisForm";
import { GeneratorForm } from "./GeneratorForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  ASAMA_ETIKET,
  zamanOnce,
  type InsaatAsama,
} from "@/lib/types";
import { BinaKesiti } from "@/components/BinaKesiti";
import { SecimDuzenle } from "@/components/SecimDuzenle";

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
    .select("id, ad, oda, net_m2, taban_fiyat, banyo, balkon, otopark")
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
  const { data: belgeler } = await supabase
    .from("proje_belge")
    .select("id, tip, ad, url, dogrulandi")
    .eq("proje_id", id)
    .order("created_at", { ascending: false });
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;
  const kapak = (belgeler ?? []).find((b) => b.tip === "kapak") ?? null;

  const tahsisKatlar = [
    ...new Set((birimler ?? []).map((b) => b.kat).filter((k): k is number => k != null)),
  ].sort((a, b) => a - b);
  const blokMap = new Map((bloklar ?? []).map((b) => [b.id, b.ad]));
  const ofisMap = new Map((ofisler ?? []).map((o) => [o.id, o.ad]));
  const toplam = birimler?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/uretici" className="text-sm font-medium text-teal hover:underline">
        ← Kokpit
      </Link>

      {kapak?.url ? (
        <div className="mt-3 h-44 overflow-hidden rounded-2xl border border-hair sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kapak.url} alt={proje.ad} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{proje.ad}</h1>
          <p className="mt-1 text-sm text-gray">
            {[proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—"}
            {proje.ada ? ` · Ada ${proje.ada}` : ""}
            {proje.parsel ? ` / Parsel ${proje.parsel}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/uretici/proje/${id}/kurulum`}
            className="rounded-lg border border-hair bg-card px-2.5 py-1 text-xs font-semibold text-navy transition-colors hover:border-navy"
          >
            ⚙ Kurulum
          </Link>
          <form action={projeTazele}>
            <input type="hidden" name="proje_id" value={id} />
            <button className="rounded-lg border border-hair bg-card px-2.5 py-1 text-xs font-semibold text-teal hover:border-teal transition-colors">
              ✓ Bilgileri Teyit Et (Stok Güncel)
            </button>
          </form>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1 font-mono text-xs text-gray">
            <span className="size-1.5 rounded-full bg-green" /> {zamanOnce(proje.son_guncelleme)}
          </span>
        </div>
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

      {/* Künye · Parsel & İmar — salt-okunur özet (düzenleme: Proje Kurulumu) */}
      <details className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <summary className="flex cursor-pointer items-center justify-between gap-2">
          <span className="font-display text-base font-semibold text-ink">Künye · Parsel & İmar</span>
          <Link href={`/uretici/proje/${id}/kurulum`} className="text-xs font-medium text-teal-d hover:underline">
            Düzenle →
          </Link>
        </summary>
        <div className="mt-3 grid gap-x-6 text-sm sm:grid-cols-2">
          {([
            ["Ada / Parsel", `${proje.ada ?? "—"} / ${proje.parsel ?? "—"}`],
            ["Emsal (KAKS)", proje.emsal ?? "—"],
            ["TAKS", proje.taks ?? "—"],
            ["İmar durumu", (kunye.imar_durumu as string) ?? "—"],
            ["Arsa alanı", kunye.arsa_alani ? `${kunye.arsa_alani} m²` : "—"],
            ["Toplam inşaat", kunye.toplam_insaat ? `${kunye.toplam_insaat} m²` : "—"],
            ["Yapı ruhsatı", (kunye.ruhsat_tarihi as string) ?? "—"],
            ["Yapı denetim", (kunye.yapi_denetim as string) ?? "—"],
          ] as [string, string | number][]).map(([k, v]) => (
            <div key={k} className="flex justify-between border-t border-hair py-1.5">
              <span className="text-gray">{k}</span>
              <span className="font-medium text-ink">{String(v)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-hair pt-3 text-xs text-gray">
          📎 {belgeler?.length ?? 0} medya/belge ·{" "}
          <Link href={`/uretici/proje/${id}/kurulum`} className="text-teal-d hover:underline">
            Kurulumda yönet (kapak · tanıtım · ruhsat)
          </Link>
        </p>
      </details>

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

      <div className="mt-4">
        <SecimDuzenle projeId={id}>
          <BinaKesiti
            bloklar={bloklar ?? []}
            birimler={(birimler ?? []) as never}
            tipler={tipler ?? []}
            mod="uretici"
            projeId={id}
          />
        </SecimDuzenle>
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
          <TahsisForm
            projeId={id}
            bloklar={bloklar ?? []}
            katlar={tahsisKatlar}
            tipler={tipler ?? []}
            ofisler={ofisler ?? []}
          />
        </div>
      </section>

      {/* ===== STOK YÖNETİMİ ===== */}
      <section className="mt-12 border-t border-hair pt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Stok yönetimi</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {/* Bloklar — düzenle / sil */}
          <div className="rounded-2xl border border-hair bg-card p-5">
            <h3 className="font-medium text-ink">Bloklar ({bloklar?.length ?? 0})</h3>
            <ul className="mt-2 space-y-1.5">
              {(bloklar ?? []).map((b) => (
                <li key={b.id}>
                  <details className="rounded-lg border border-hair">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="text-ink">
                        {b.ad}
                        {b.kat_sayisi ? ` · ${b.kat_sayisi} kat` : ""}
                      </span>
                      <span className="text-xs text-teal-d">düzenle</span>
                    </summary>
                    <div className="border-t border-hair p-3">
                      <form action={blokGuncelle} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="proje_id" value={id} />
                        <input type="hidden" name="blok_id" value={b.id} />
                        <input name="ad" defaultValue={b.ad ?? ""} className={`${inpCls} flex-1`} />
                        <input name="kat_sayisi" type="number" defaultValue={b.kat_sayisi ?? ""} placeholder="kat" className={`${inpCls} w-20`} />
                        <SubmitButton>Kaydet</SubmitButton>
                      </form>
                      <form action={blokSil} className="mt-2">
                        <input type="hidden" name="proje_id" value={id} />
                        <input type="hidden" name="blok_id" value={b.id} />
                        <SubmitButton varyant="outline" className="!border-red/40 !text-red">Bloğu sil</SubmitButton>
                      </form>
                    </div>
                  </details>
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

          {/* Daire tipleri — düzenle / sil (oda · banyo · balkon · otopark) */}
          <div className="rounded-2xl border border-hair bg-card p-5">
            <h3 className="font-medium text-ink">Daire tipleri ({tipler?.length ?? 0})</h3>
            <ul className="mt-2 space-y-1.5">
              {(tipler ?? []).map((t) => (
                <li key={t.id}>
                  <details className="rounded-lg border border-hair">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="text-ink">
                        {t.ad}
                        {t.oda ? ` · ${t.oda}` : ""}
                        {t.net_m2 ? ` · ${t.net_m2}m²` : ""}
                        {t.taban_fiyat ? ` · ${Number(t.taban_fiyat).toLocaleString("tr-TR")}₺` : ""}
                      </span>
                      <span className="text-xs text-teal-d">düzenle</span>
                    </summary>
                    <div className="border-t border-hair p-3">
                      <form action={tipGuncelle} className="grid grid-cols-2 gap-2">
                        <input type="hidden" name="proje_id" value={id} />
                        <input type="hidden" name="tip_id" value={t.id} />
                        <input name="ad" defaultValue={t.ad ?? ""} placeholder="ad" className={inpCls} />
                        <input name="oda" defaultValue={t.oda ?? ""} placeholder="2+1" className={inpCls} />
                        <input name="net_m2" type="number" defaultValue={t.net_m2 ?? ""} placeholder="net m²" className={inpCls} />
                        <input name="taban_fiyat" type="number" defaultValue={t.taban_fiyat ?? ""} placeholder="taban ₺" className={inpCls} />
                        <input name="banyo" type="number" defaultValue={t.banyo ?? ""} placeholder="banyo" className={inpCls} />
                        <input name="balkon" type="number" defaultValue={t.balkon ?? ""} placeholder="balkon" className={inpCls} />
                        <input name="otopark" defaultValue={t.otopark ?? ""} placeholder="otopark (ör. 1 kapalı)" className={`${inpCls} col-span-2`} />
                        <div className="col-span-2"><SubmitButton>Kaydet</SubmitButton></div>
                      </form>
                      <form action={tipSil} className="mt-2">
                        <input type="hidden" name="proje_id" value={id} />
                        <input type="hidden" name="tip_id" value={t.id} />
                        <SubmitButton varyant="outline" className="!border-red/40 !text-red">Tipi sil</SubmitButton>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            <form action={daireTipiEkle} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="proje_id" value={id} />
              <input name="ad" placeholder="2+1 Standart" required className={inpCls} />
              <input name="oda" placeholder="2+1" className={inpCls} />
              <input name="net_m2" type="number" placeholder="net m²" className={inpCls} />
              <input name="taban_fiyat" type="number" placeholder="taban fiyat ₺" className={inpCls} />
              <input name="banyo" type="number" placeholder="banyo" className={inpCls} />
              <input name="balkon" type="number" placeholder="balkon" className={inpCls} />
              <input name="otopark" placeholder="otopark (ör. 1 kapalı)" className={`${inpCls} col-span-2`} />
              <button className={`${btnCls} col-span-2`}>Tip ekle</button>
            </form>
          </div>
        </div>

        {/* Generator */}
        <div className="mt-5 rounded-2xl border border-hair bg-card p-5">
          <h3 className="font-medium text-ink">Generator — toplu birim üret (tip × kat)</h3>
          {(bloklar?.length ?? 0) > 0 && (tipler?.length ?? 0) > 0 ? (
            <GeneratorForm projeId={id} bloklar={bloklar ?? []} tipler={tipler ?? []} />
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
