import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { medyaYukle, medyaSil, projeKunyeGuncelle } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inpCls =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

type Belge = { id: string; tip: string | null; ad: string | null; url: string | null; dogrulandi: boolean };

const BELGE_TIPLERI = [
  ["ruhsat", "Yapı ruhsatı"],
  ["iskan", "İskan"],
  ["yapi_denetim", "Yapı denetim"],
  ["otopark", "Otopark belgesi"],
  ["diger", "Diğer"],
] as const;

/** Bir medya kaydını sil butonu (form) */
function SilForm({ belgeId, projeId }: { belgeId: string; projeId: string }) {
  return (
    <form action={medyaSil}>
      <input type="hidden" name="belge_id" value={belgeId} />
      <input type="hidden" name="proje_id" value={projeId} />
      <button className="text-xs font-medium text-red hover:underline" aria-label="Sil">
        Sil
      </button>
    </form>
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

  const kapak = belgeler.find((b) => b.tip === "kapak") ?? null;
  const fotolar = belgeler.filter((b) => b.tip === "foto");
  const videolar = belgeler.filter((b) => b.tip === "video");
  const brosurler = belgeler.filter((b) => b.tip === "brosur");
  const belgelerResmi = belgeler.filter(
    (b) => b.tip && ["ruhsat", "iskan", "yapi_denetim", "otopark", "diger"].includes(b.tip),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/uretici/proje/${id}`} className="text-sm font-medium text-teal hover:underline">
        ← Proje
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Proje Kurulumu</h1>
      <p className="mt-1 text-sm text-gray">
        {proje.ad} — künye/imar, kapak görseli, tanıtım envanteri ve resmi belgeler. Stok/birim
        yönetimi proje ekranındadır.
      </p>

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

      {/* ── Kapak görseli ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Kapak görseli</h2>
        <p className="mt-1 text-xs text-gray">Havuz kartında ve proje üstünde görünür (tek görsel).</p>
        {kapak?.url ? (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak.url} alt="Kapak" className="h-24 w-40 rounded-lg border border-hair object-cover" />
            <SilForm belgeId={kapak.id} projeId={id} />
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="kapak" />
          <input type="file" name="dosya" accept="image/*" required className="text-sm text-gray" />
          <SubmitButton>{kapak ? "Kapağı değiştir" : "Kapak yükle"}</SubmitButton>
        </form>
      </section>

      {/* ── Künye · Parsel & İmar ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Künye · Parsel & İmar</h2>
        <form action={projeKunyeGuncelle} className="mt-3 grid gap-2 sm:grid-cols-2">
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
      </section>

      {/* ── Tanıtım galerisi ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Tanıtım fotoğrafları</h2>
        <p className="mt-1 text-xs text-gray">Render, cephe, sosyal alan görselleri (çoklu yükleme).</p>
        {fotolar.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotolar.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border border-hair">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url ?? ""} alt={f.ad ?? "Foto"} className="aspect-square w-full object-cover" />
                <div className="absolute right-1 top-1 rounded bg-ink/70 px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <SilForm belgeId={f.id} projeId={id} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="foto" />
          <input type="file" name="dosya" accept="image/*" multiple required className="text-sm text-gray" />
          <SubmitButton>Fotoğraf yükle</SubmitButton>
        </form>
      </section>

      {/* ── Tanıtım videosu (link) ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Tanıtım videosu</h2>
        <p className="mt-1 text-xs text-gray">YouTube / Vimeo bağlantısı.</p>
        {videolar.length > 0 ? (
          <div className="mt-3 space-y-2">
            {videolar.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="flex-1 truncate text-ink">{v.ad}</span>
                {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <SilForm belgeId={v.id} projeId={id} />
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="video" />
          <input name="ad" placeholder="Başlık (opsiyonel)" className={inpCls} />
          <input name="url" type="url" required placeholder="https://youtube.com/..." className={`${inpCls} flex-1`} />
          <SubmitButton>Video ekle</SubmitButton>
        </form>
      </section>

      {/* ── Broşür / katalog ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Broşür / katalog</h2>
        <p className="mt-1 text-xs text-gray">PDF tanıtım dosyaları.</p>
        {brosurler.length > 0 ? (
          <div className="mt-3 space-y-2">
            {brosurler.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="flex-1 truncate text-ink">📄 {b.ad}</span>
                {b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <SilForm belgeId={b.id} projeId={id} />
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <input type="hidden" name="tip" value="brosur" />
          <input type="file" name="dosya" accept="application/pdf" required className="text-sm text-gray" />
          <SubmitButton>Broşür yükle</SubmitButton>
        </form>
      </section>

      {/* ── Resmi belgeler ── */}
      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Resmi belgeler</h2>
        <p className="mt-1 text-xs text-gray">Ruhsat · iskan · yapı denetim — belge-doğrulanmış proje rozeti (güven protokolü).</p>
        {belgelerResmi.length > 0 ? (
          <div className="mt-3 space-y-2">
            {belgelerResmi.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="rounded bg-navy-soft px-2 py-0.5 text-xs font-medium text-navy">{b.tip}</span>
                <span className="flex-1 truncate text-ink">{b.ad}</span>
                {b.dogrulandi ? <span className="text-xs text-teal-d">✓ doğrulandı</span> : null}
                {b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <SilForm belgeId={b.id} projeId={id} />
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="proje_id" value={id} />
          <select name="tip" className={inpCls} defaultValue="ruhsat">
            {BELGE_TIPLERI.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input name="ad" placeholder="Belge adı (opsiyonel)" className={inpCls} />
          <input type="file" name="dosya" accept="application/pdf,image/*" required className="text-sm text-gray" />
          <SubmitButton>Belge yükle</SubmitButton>
        </form>
      </section>
    </div>
  );
}
