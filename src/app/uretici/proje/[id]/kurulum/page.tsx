import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { medyaYukle, medyaSil, projeKunyeGuncelle, projeYatirimGuncelle, projeOdemePlaniGuncelle, mahalEkle, mahalSil } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { StokKurulumu } from "../StokKurulumu";

const inpCls =
  "w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";
const fileCls =
  "w-full text-sm text-gray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/10";

type Belge = { id: string; tip: string | null; ad: string | null; url: string | null; dogrulandi: boolean };

const BELGE_TIPLERI = [
  ["ruhsat", "Yapı ruhsatı"],
  ["iskan", "İskan"],
  ["yapi_denetim", "Yapı denetim"],
  ["otopark", "Otopark belgesi"],
  ["diger", "Diğer"],
] as const;

function Sil({ belgeId, projeId }: { belgeId: string; projeId: string }) {
  return (
    <form action={medyaSil}>
      <input type="hidden" name="belge_id" value={belgeId} />
      <input type="hidden" name="proje_id" value={projeId} />
      <button
        className="rounded-md px-2 py-1 text-xs font-medium text-red transition-colors hover:bg-red-soft"
        aria-label="Sil"
      >
        Sil
      </button>
    </form>
  );
}

/** Tamamlanma rozeti (kurulum checklist). */
function Rozet({ ok, etiket }: { ok: boolean; etiket: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
        ok ? "border-green/30 bg-green-soft text-teal-d" : "border-hair bg-card text-gray"
      }`}
    >
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] ${
          ok ? "bg-green text-white" : "border border-hair bg-soft text-gray"
        }`}
      >
        {ok ? "✓" : "•"}
      </span>
      {etiket}
    </div>
  );
}

/** Bölüm kabuğu — mimari ince teal aksan (numara yok). */
function Bolum({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-hair bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-teal" aria-hidden />
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{baslik}</h2>
          <p className="text-xs text-gray">{aciklama}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ProjeKurulum({
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

  const { data: belgelerRaw } = await supabase
    .from("proje_belge")
    .select("id, tip, ad, url, dogrulandi")
    .eq("proje_id", id)
    .order("created_at", { ascending: false });
  const belgeler = (belgelerRaw ?? []) as Belge[];
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;

  const [{ data: bloklar }, { data: tipler }, { data: mahaller }] = await Promise.all([
    supabase.from("blok").select("id, ad, kat_sayisi").eq("proje_id", id).order("ad"),
    supabase.from("daire_tipi").select("id, ad, oda, net_m2, taban_fiyat, plan_url").eq("proje_id", id).order("ad"),
    supabase.from("mahal").select("id, mahal, zemin, duvar, tavan, marka").eq("proje_id", id).order("sira").order("created_at"),
  ]);
  const mahalListe = (mahaller ?? []) as {
    id: string;
    mahal: string;
    zemin: string | null;
    duvar: string | null;
    tavan: string | null;
    marka: string | null;
  }[];

  const kapak = belgeler.find((b) => b.tip === "kapak") ?? null;
  const fotolar = belgeler.filter((b) => b.tip === "foto");
  const videolar = belgeler.filter((b) => b.tip === "video");
  const brosurler = belgeler.filter((b) => b.tip === "brosur");
  const belgelerResmi = belgeler.filter(
    (b) => b.tip && ["ruhsat", "iskan", "yapi_denetim", "otopark", "diger"].includes(b.tip),
  );

  const konum = [proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ");
  const kunyeDolu = !!(proje.ada || proje.emsal || kunye.imar_durumu);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Başlık satırı */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/uretici/proje/${id}`} className="text-xs font-medium text-teal hover:underline">
            ← {proje.ad}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Proje Kurulumu</h1>
          <p className="text-sm text-gray">Künye, kapak, tanıtım envanteri ve belgeler — proje kimliği.</p>
        </div>
        <Link
          href={`/uretici/proje/${id}`}
          className="btn rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink"
        >
          Projeyi Gör →
        </Link>
      </div>

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red-soft px-3 py-2 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green-soft px-3 py-2 text-sm text-teal-d">
          {mesaj}
        </p>
      ) : null}

      {/* KAPAK HERO */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-hair bg-soft shadow-card">
        <div className="aspect-[21/9] w-full">
          {kapak?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kapak.url} alt={proje.ad} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-soft via-teal-soft to-soft">
              <span className="font-display text-6xl font-bold text-teal-d/25 select-none">
                {(proje.ad ?? "P").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-4">
          <h2 className="font-display text-lg font-semibold text-white drop-shadow">{proje.ad}</h2>
          {konum ? <p className="text-xs text-white/85">{konum}</p> : null}
        </div>
        <form
          action={medyaYukle}
          className="absolute right-3 top-3 flex items-center gap-2 rounded-xl border border-hair bg-card/95 p-1.5 shadow-card backdrop-blur"
        >
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="kapak" />
          <input type="file" name="dosya" accept="image/*" required className="max-w-[160px] text-xs text-gray file:mr-2 file:rounded-md file:border-0 file:bg-navy-soft file:px-2 file:py-1 file:text-xs file:font-medium file:text-navy" />
          <SubmitButton className="!px-3 !py-1.5 !text-xs">{kapak ? "Değiştir" : "Yükle"}</SubmitButton>
        </form>
      </div>

      {/* TAMAMLANMA */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Rozet ok={kunyeDolu} etiket="Künye / İmar" />
        <Rozet ok={!!kapak} etiket="Kapak görseli" />
        <Rozet ok={fotolar.length > 0} etiket={`${fotolar.length} Tanıtım görseli`} />
        <Rozet ok={belgelerResmi.length > 0} etiket={`${belgelerResmi.length} Resmi belge`} />
      </div>

      {/* 1 — KİMLİK & İMAR */}
      <Bolum baslik="Kimlik & İmar" aciklama="Ada/parsel, emsal, ruhsat, otopark kuralı, malzeme & donatı.">
        <form action={projeKunyeGuncelle} className="grid gap-2 sm:grid-cols-2">
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
          <input name="otopark" defaultValue={(kunye.otopark as string) ?? ""} placeholder="Otopark kuralı (ör. Her daireye 1 kapalı)" className={`${inpCls} sm:col-span-2`} />
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" name="kat_karsiligi" defaultChecked={!!kunye.kat_karsiligi} className="size-4" /> Kat karşılığı proje
          </label>
          <textarea name="malzeme" defaultValue={Array.isArray(kunye.malzeme) ? (kunye.malzeme as string[]).join("\n") : ""} placeholder="Malzeme (her satır: Pencere · Schüco)" rows={3} className={`${inpCls} sm:col-span-2`} />
          <input name="donati" defaultValue={Array.isArray(kunye.donati) ? (kunye.donati as string[]).join(", ") : ""} placeholder="Sosyal donatı (virgülle: Havuz, Fitness, Güvenlik)" className={`${inpCls} sm:col-span-2`} />
          <div className="sm:col-span-2"><SubmitButton>Künyeyi kaydet</SubmitButton></div>
        </form>
      </Bolum>

      {/* Yatırım — Faz-1 yurtiçi (para birimi TRY; golden vize/oturum Faz-2) */}
      <Bolum baslik="Yatırım" aciklama="Yıllık kira getirisi ve geri dönüş süresi — yurtiçi yatırımcı için havuzda gösterilir.">
        <form action={projeYatirimGuncelle} className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="para_birimi" value="TRY" />
          <input name="kira_getirisi_pct" type="number" step="0.1" defaultValue={proje.kira_getirisi_pct ?? ""} placeholder="Yıllık kira getirisi %" className={inpCls} />
          <input name="amortisman_yil" type="number" step="0.1" defaultValue={proje.amortisman_yil ?? ""} placeholder="Yatırım geri dönüş süresi (yıl)" className={inpCls} />
          <div className="sm:col-span-2"><SubmitButton>Yatırım bilgilerini kaydet</SubmitButton></div>
        </form>
      </Bolum>

      {/* Ödeme Planı */}
      <Bolum baslik="Ödeme Planı" aciklama="Proje geneli ödeme planı — tüm birimlere uygulanır. Aylık taksit her dairenin canlı fiyatından hesaplanır.">
        <form action={projeOdemePlaniGuncelle} className="grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="proje_id" value={id} />
          <input name="pesinat_pct" type="number" step="1" min="0" max="100" placeholder="Peşinat %" className={inpCls} />
          <input name="taksit_sayisi" type="number" step="1" min="1" placeholder="Taksit sayısı (ay)" className={inpCls} />
          <input name="vade_farki_pct" type="number" step="0.1" placeholder="Vade farkı % (0 = vade farksız)" className={inpCls} />
          <div className="sm:col-span-3"><SubmitButton>Ödeme planını uygula</SubmitButton></div>
        </form>
        <p className="mt-2 text-xs text-gray">
          Önce <code className="rounded bg-soft px-1 font-mono">db/2026-06-28_odeme-plani.sql</code> migration&apos;ı Supabase SQL Editor&apos;den çalıştırılmalı.
        </p>
      </Bolum>

      {/* ── Mahal Listesi ── */}
      <Bolum baslik="Mahal Listesi" aciklama="Teslim standardı — her mahal için zemin / duvar / tavan kaplaması.">
        {mahalListe.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray">
                  <th className="pb-2 pr-3 font-medium">Mahal</th>
                  <th className="pb-2 pr-3 font-medium">Zemin</th>
                  <th className="pb-2 pr-3 font-medium">Duvar</th>
                  <th className="pb-2 pr-3 font-medium">Tavan</th>
                  <th className="pb-2 pr-3 font-medium">Marka</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {mahalListe.map((m) => (
                  <tr key={m.id} className="border-t border-hair">
                    <td className="py-2 pr-3 font-medium text-ink">{m.mahal}</td>
                    <td className="py-2 pr-3 text-gray">{m.zemin ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray">{m.duvar ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray">{m.tavan ?? "—"}</td>
                    <td className="py-2 pr-3 text-ink">{m.marka ?? "—"}</td>
                    <td className="py-2 text-right">
                      <form action={mahalSil}>
                        <input type="hidden" name="mahal_id" value={m.id} />
                        <input type="hidden" name="proje_id" value={id} />
                        <button className="text-xs font-medium text-red hover:underline">Sil</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <form action={mahalEkle} className="mt-3 grid gap-2 sm:grid-cols-5">
          <input type="hidden" name="proje_id" value={id} />
          <input name="mahal" placeholder="Salon" required className={inpCls} />
          <input name="zemin" placeholder="Zemin (ör. seramik)" className={inpCls} />
          <input name="duvar" placeholder="Duvar (ör. saten boya)" className={inpCls} />
          <input name="tavan" placeholder="Tavan (ör. alçı)" className={inpCls} />
          <input name="marka" placeholder="Marka (ör. VitrA)" className={inpCls} />
          <div className="sm:col-span-5">
            <SubmitButton>Mahal ekle</SubmitButton>
          </div>
        </form>
      </Bolum>

      {/* ── Stok Kurulumu (bir kez) ── */}
      <section className="mt-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-teal" aria-hidden />
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Stok Kurulumu</h2>
            <p className="text-xs text-gray">
              Bloklar, daire tipleri ve birim üretimi — bir kez. Günlük satış/takip proje ekranında (bina kesiti).
            </p>
          </div>
        </div>
        <div className="mt-4">
          <StokKurulumu projeId={id} bloklar={bloklar ?? []} tipler={tipler ?? []} />
        </div>
      </section>

      {/* 2 — TANITIM ENVANTERİ */}
      <Bolum baslik="Tanıtım Envanteri" aciklama="Render & cephe görselleri, tanıtım videosu, broşür/katalog.">
        {/* Galeri */}
        <p className="text-sm font-medium text-ink">Tanıtım görselleri</p>
        {fotolar.length > 0 ? (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {fotolar.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border border-hair">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url ?? ""} alt={f.ad ?? "Foto"} className="aspect-square w-full object-cover" />
                <div className="absolute right-1 top-1 rounded-md bg-card/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                  <Sil belgeId={f.id} projeId={id} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="foto" />
          <input type="file" name="dosya" accept="image/*" multiple required className={`${fileCls} flex-1`} />
          <SubmitButton varyant="outline">Görsel yükle</SubmitButton>
        </form>

        {/* Video */}
        <div className="mt-5 border-t border-hair pt-4">
          <p className="text-sm font-medium text-ink">Tanıtım videosu</p>
          {videolar.length > 0 ? (
            <div className="mt-2 space-y-2">
              {videolar.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                  <span className="flex-1 truncate text-ink">{v.ad}</span>
                  {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                  <Sil belgeId={v.id} projeId={id} />
                </div>
              ))}
            </div>
          ) : null}
          <form action={medyaYukle} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="proje_id" value={id} />
            <input type="hidden" name="tip" value="video" />
            <input name="ad" placeholder="Başlık (opsiyonel)" className={`${inpCls} w-40`} />
            <input name="url" type="url" required placeholder="https://youtube.com/..." className={`${inpCls} flex-1`} />
            <SubmitButton varyant="outline">Video ekle</SubmitButton>
          </form>
        </div>

        {/* Broşür */}
        <div className="mt-5 border-t border-hair pt-4">
          <p className="text-sm font-medium text-ink">Broşür / katalog (PDF)</p>
          {brosurler.length > 0 ? (
            <div className="mt-2 space-y-2">
              {brosurler.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                  <span className="flex-1 truncate text-ink">{b.ad}</span>
                  {b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                  <Sil belgeId={b.id} projeId={id} />
                </div>
              ))}
            </div>
          ) : null}
          <form action={medyaYukle} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="proje_id" value={id} />
            <input type="hidden" name="tip" value="brosur" />
            <input type="file" name="dosya" accept="application/pdf" required className={`${fileCls} flex-1`} />
            <SubmitButton varyant="outline">Broşür yükle</SubmitButton>
          </form>
        </div>
      </Bolum>

      {/* 3 — RESMİ BELGELER */}
      <Bolum baslik="Resmi Belgeler" aciklama="Ruhsat · iskan · yapı denetim — belge-doğrulanmış proje rozeti (güven protokolü).">
        {belgelerResmi.length > 0 ? (
          <div className="space-y-2">
            {belgelerResmi.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="rounded bg-navy-soft px-2 py-0.5 text-xs font-medium text-navy">{b.tip}</span>
                <span className="flex-1 truncate text-ink">{b.ad}</span>
                {b.dogrulandi ? <span className="text-xs font-medium text-teal-d">✓ doğrulandı</span> : null}
                {b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <Sil belgeId={b.id} projeId={id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray">Henüz belge yok — aşağıdan yükle.</p>
        )}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <select name="tip" className={`${inpCls} w-40`} defaultValue="ruhsat">
            {BELGE_TIPLERI.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input name="ad" placeholder="Belge adı (opsiyonel)" className={`${inpCls} w-44`} />
          <input type="file" name="dosya" accept="application/pdf,image/*" required className={`${fileCls} flex-1`} />
          <SubmitButton varyant="outline">Belge yükle</SubmitButton>
        </form>
      </Bolum>
    </div>
  );
}
