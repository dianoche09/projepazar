import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  blokEkle,
  daireTipiEkle,
  birimGenerator,
  excelImport,
  tahsisSil,
  projeTazele,
  belgeEkle,
  belgeSil,
  projeKunyeGuncelle,
} from "@/app/uretici/actions";
import { TahsisForm } from "./TahsisForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  ASAMA_ETIKET,
  zamanOnce,
  type InsaatAsama,
} from "@/lib/types";
import { BinaKesiti } from "@/components/BinaKesiti";

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
  const { data: belgeler } = await supabase
    .from("proje_belge")
    .select("id, tip, ad, url, dogrulandi")
    .eq("proje_id", id)
    .order("created_at", { ascending: false });
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;

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

      {/* Künye · Parsel & İmar */}
      <details className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <summary className="cursor-pointer font-display text-base font-semibold text-ink">Künye · Parsel & İmar</summary>
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
        <form action={projeKunyeGuncelle} className="mt-4 grid gap-2 border-t border-hair pt-4 sm:grid-cols-2">
          <input type="hidden" name="proje_id" value={id} />
          <input name="ada" defaultValue={proje.ada ?? ""} placeholder="Ada" className={inpCls} />
          <input name="parsel" defaultValue={proje.parsel ?? ""} placeholder="Parsel" className={inpCls} />
          <input name="emsal" type="number" step="0.01" defaultValue={proje.emsal ?? ""} placeholder="Emsal (KAKS)" className={inpCls} />
          <input name="taks" type="number" step="0.01" defaultValue={proje.taks ?? ""} placeholder="TAKS" className={inpCls} />
          <input name="imar_durumu" defaultValue={(kunye.imar_durumu as string) ?? ""} placeholder="İmar (ör. Konut E:2.07)" className={inpCls} />
          <input name="arsa_alani" type="number" defaultValue={(kunye.arsa_alani as number) ?? ""} placeholder="Arsa alanı m²" className={inpCls} />
          <input name="toplam_insaat" type="number" defaultValue={(kunye.toplam_insaat as number) ?? ""} placeholder="Toplam inşaat m²" className={inpCls} />
          <input name="ruhsat_tarihi" defaultValue={(kunye.ruhsat_tarihi as string) ?? ""} placeholder="Yapı ruhsatı (tarih)" className={inpCls} />
          <input name="yapi_denetim" defaultValue={(kunye.yapi_denetim as string) ?? ""} placeholder="Yapı denetim firması" className={inpCls} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="kat_karsiligi" defaultChecked={!!kunye.kat_karsiligi} className="size-4" /> Kat karşılığı
          </label>
          <textarea name="malzeme" defaultValue={Array.isArray(kunye.malzeme) ? (kunye.malzeme as string[]).join("\n") : ""} placeholder="Malzeme (her satır: Pencere · Schüco)" rows={3} className={`${inpCls} sm:col-span-2`} />
          <input name="donati" defaultValue={Array.isArray(kunye.donati) ? (kunye.donati as string[]).join(", ") : ""} placeholder="Sosyal donatı (virgülle: Havuz, Fitness, Güvenlik)" className={`${inpCls} sm:col-span-2`} />
          <div className="sm:col-span-2"><SubmitButton>Künyeyi kaydet</SubmitButton></div>
        </form>
      </details>

      {/* Proje Dokümanları */}
      <div className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h3 className="font-display text-base font-semibold text-ink">Proje Dokümanları</h3>
        <p className="mt-1 text-xs text-gray">Ruhsat · iskan · yapı denetim — belge-doğrulanmış proje rozeti (güven protokolü).</p>
        <div className="mt-3 space-y-2">
          {(belgeler ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
              <span className="rounded bg-navy-soft px-2 py-0.5 text-xs font-medium text-navy">{b.tip}</span>
              <span className="flex-1 text-ink">{b.ad}</span>
              {b.dogrulandi ? <span className="text-xs text-teal-d">✓ doğrulandı</span> : null}
              {b.url ? (
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a>
              ) : null}
              <form action={belgeSil}>
                <input type="hidden" name="belge_id" value={b.id} />
                <input type="hidden" name="proje_id" value={id} />
                <button className="text-xs text-red hover:underline">Sil</button>
              </form>
            </div>
          ))}
          {(belgeler?.length ?? 0) === 0 ? <p className="text-sm text-gray">Henüz belge yok — aşağıdan ekle.</p> : null}
        </div>
        <form action={belgeEkle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <select name="tip" className={inpCls}>
            <option value="ruhsat">Yapı ruhsatı</option>
            <option value="iskan">İskan</option>
            <option value="yapi_denetim">Yapı denetim</option>
            <option value="otopark">Otopark belgesi</option>
            <option value="diger">Diğer</option>
          </select>
          <input name="ad" required placeholder="Belge adı" className={`${inpCls} flex-1`} />
          <input name="url" placeholder="Link (opsiyonel)" className={inpCls} />
          <SubmitButton>Belge ekle</SubmitButton>
        </form>
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

      <div className="mt-4">
        <BinaKesiti
          bloklar={bloklar ?? []}
          birimler={(birimler ?? []) as never}
          tipler={tipler ?? []}
          mod="uretici"
          projeId={id}
        />
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
