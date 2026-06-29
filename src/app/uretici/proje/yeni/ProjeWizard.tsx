"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  projeOlustur,
  projeKunyeGuncelle,
  projeYatirimGuncelle,
  projeOdemePlaniGuncelle,
  blokEkle,
  blokSil,
  daireTipiEkle,
  tipSil,
  medyaYukle,
  medyaSil,
} from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GeneratorForm } from "../[id]/GeneratorForm";
import { TahsisForm } from "../[id]/TahsisForm";

/* ── Tipler (server'dan beslenen ham veri) ── */
export type WizardProje = {
  id: string;
  ad: string | null;
  il: string | null;
  ilce: string | null;
  mahalle: string | null;
  ada: string | null;
  parsel: string | null;
  emsal: number | null;
  taks: number | null;
  baslama_tarihi: string | null;
  teslim_tarihi: string | null;
  insaat_asamasi: string | null;
  para_birimi: string | null;
  kira_getirisi_pct: number | null;
  amortisman_yil: number | null;
  kunye: Record<string, unknown> | null;
};
export type WizardBlok = { id: string; ad: string | null; kat_sayisi: number | null };
export type WizardTip = {
  id: string;
  ad: string | null;
  oda: string | null;
  net_m2: number | null;
  taban_fiyat: number | null;
};
export type WizardBelge = { id: string; tip: string | null; ad: string | null; url: string | null };
export type WizardOfis = { id: string; ad: string };

const ADIMLAR = [
  "Künye & İmar",
  "Bloklar & Tipler",
  "Birim Üretimi",
  "Fiyatlama & Ödeme",
  "Medya",
  "Tahsis & Kurallar",
  "Özet & Yayınla",
] as const;

const inpCls =
  "h-11 w-full rounded-xl border border-hair bg-card px-3.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-gray/55 focus:border-teal focus:ring-4 focus:ring-teal/12";

const INSAAT_ASAMA: [string, string][] = [
  ["planlama", "Planlama"],
  ["temel", "Temel"],
  ["kaba_insaat", "Kaba inşaat"],
  ["ince_insaat", "İnce inşaat"],
  ["cevre_duzenleme", "Çevre düzenleme"],
  ["tamamlandi", "Tamamlandı"],
];

/* ── Adım kabuğu ── */
function AdimKart({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama: string;
  children: React.ReactNode;
}) {
  return (
    <section className="kart signal-top mt-5 p-5 sm:p-6">
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

export function ProjeWizard({
  adim,
  proje,
  bloklar,
  tipler,
  birimSayisi,
  belgeler,
  ofisler,
  hata,
  mesaj,
}: {
  adim: number;
  proje: WizardProje | null;
  bloklar: WizardBlok[];
  tipler: WizardTip[];
  birimSayisi: number;
  belgeler: WizardBelge[];
  ofisler: WizardOfis[];
  hata?: string;
  mesaj?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const id = proje?.id ?? null;
  const kunye = useMemo(() => (proje?.kunye ?? {}) as Record<string, unknown>, [proje?.kunye]);

  // Adım navigasyonu (id + adim query). Scroll'u koru, sayfa başına dön.
  const git = useCallback(
    (n: number) => {
      const sp = new URLSearchParams();
      if (id) sp.set("id", id);
      sp.set("adim", String(n));
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, id],
  );

  // Bir form action'ı kaydettikten sonra wizard'ın hangi adımına döneceği.
  const geriYol = useCallback(
    (hedefAdim: number) =>
      id ? `/uretici/proje/yeni?id=${id}&adim=${hedefAdim}` : "",
    [id],
  );

  const tamam = useMemo(
    () => ({
      kunye: !!(proje?.ada || proje?.emsal || kunye.imar_durumu),
      stok: bloklar.length > 0 && tipler.length > 0,
      birim: birimSayisi > 0,
      medya: belgeler.some((b) => b.tip === "kapak") || belgeler.length > 0,
    }),
    [proje, kunye, bloklar.length, tipler.length, birimSayisi, belgeler],
  );

  const katlar = useMemo(() => {
    const max = Math.max(0, ...bloklar.map((b) => b.kat_sayisi ?? 0));
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [bloklar]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/uretici" className="text-xs font-medium text-teal hover:underline">
          ← Kokpit
        </Link>
        {id ? (
          <Link href={`/uretici/proje/${id}/kurulum`} className="text-xs font-medium text-gray hover:text-ink hover:underline">
            Kurulumdan düzenle →
          </Link>
        ) : null}
      </div>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Yeni proje sihirbazı</h1>
      <p className="text-sm text-gray">
        Adım adım kur — her adım anında kaydedilir, sonradan Kurulum&apos;dan düzenlenebilir.
      </p>

      {/* İLERLEME GÖSTERGESİ */}
      <ol className="mt-5 flex flex-wrap gap-1.5">
        {ADIMLAR.map((etiket, i) => {
          const n = i + 1;
          const aktif = n === adim;
          const gecmis = n < adim;
          const tiklanabilir = !!id || n === 1; // proje yokken yalnız adım 1
          return (
            <li key={etiket} className="flex-1 basis-[40%] sm:basis-0">
              <button
                type="button"
                disabled={!tiklanabilir}
                onClick={() => tiklanabilir && git(n)}
                className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  aktif
                    ? "border-teal bg-teal-soft"
                    : gecmis
                      ? "border-green/30 bg-green-soft hover:border-green/50"
                      : "border-hair bg-card hover:border-teal/40"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold ${
                    aktif
                      ? "bg-teal text-white"
                      : gecmis
                        ? "bg-green text-white"
                        : "border border-hair bg-soft text-gray"
                  }`}
                >
                  {gecmis ? "✓" : n}
                </span>
                <span className={`truncate text-[11px] font-medium ${aktif ? "text-ink" : "text-gray"}`}>
                  {etiket}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {hata ? (
        <p role="alert" className="mt-4 rounded-xl border border-red/30 bg-red-soft px-3.5 py-2.5 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-xl border border-green/30 bg-green-soft px-3.5 py-2.5 text-sm text-teal-d">
          {mesaj}
        </p>
      ) : null}

      {/* ───────── ADIM 1: KÜNYE & İMAR ───────── */}
      {adim === 1 ? (
        <AdimKart
          baslik="Künye & İmar"
          aciklama="Proje kimliği, konum, ada/parsel, emsal/TAKS, imar durumu, tarihler ve inşaat aşaması."
        >
          {!proje ? (
            // Proje henüz yok → projeOlustur. Kaydedince adım 2'ye (id ile) döner.
            <form action={projeOlustur} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="geri_yol" value="/uretici/proje/yeni?id=__ID__&adim=2" />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink">
                  Proje adı <span className="text-red">*</span>
                </label>
                <input name="ad" required placeholder="Çankaya Vadi Konakları" className={`${inpCls} mt-1.5`} />
              </div>
              <input name="il" placeholder="İl (Ankara)" className={inpCls} />
              <input name="ilce" placeholder="İlçe (Çankaya)" className={inpCls} />
              <input name="mahalle" placeholder="Mahalle" className={`${inpCls} sm:col-span-2`} />
              <input name="ada" placeholder="Ada" className={inpCls} />
              <input name="parsel" placeholder="Parsel" className={inpCls} />
              <label className="flex flex-col gap-1 text-xs text-gray">
                İnşaat başlangıcı
                <input name="baslama_tarihi" type="date" className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray">
                Tahmini teslim
                <input name="teslim_tarihi" type="date" className={inpCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray sm:col-span-2">
                İnşaat aşaması
                <select name="insaat_asamasi" defaultValue="planlama" className={inpCls}>
                  {INSAAT_ASAMA.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 mt-1 flex justify-end">
                <SubmitButton>Oluştur ve devam →</SubmitButton>
              </div>
            </form>
          ) : (
            // Proje var → projeKunyeGuncelle (imar detayı). Kunye action'ı emsal/taks/imar/ruhsat günceller.
            <>
              <form action={projeKunyeGuncelle} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="proje_id" value={proje.id} />
                <input type="hidden" name="geri_yol" value={geriYol(1)} />
                <input name="ada" defaultValue={proje.ada ?? ""} placeholder="Ada" className={inpCls} />
                <input name="parsel" defaultValue={proje.parsel ?? ""} placeholder="Parsel" className={inpCls} />
                <input name="emsal" type="number" step="0.01" defaultValue={proje.emsal ?? ""} placeholder="Emsal (KAKS)" className={inpCls} />
                <input name="taks" type="number" step="0.01" defaultValue={proje.taks ?? ""} placeholder="TAKS" className={inpCls} />
                <input name="imar_durumu" defaultValue={(kunye as Record<string, string>).imar_durumu ?? ""} placeholder="İmar (ör. Konut E:2.07)" className={`${inpCls} sm:col-span-2`} />
                <input name="arsa_alani" type="number" defaultValue={(kunye as Record<string, number>).arsa_alani ?? ""} placeholder="Arsa alanı m²" className={inpCls} />
                <input name="toplam_insaat" type="number" defaultValue={(kunye as Record<string, number>).toplam_insaat ?? ""} placeholder="Toplam inşaat m²" className={inpCls} />
                <input name="ruhsat_tarihi" defaultValue={(kunye as Record<string, string>).ruhsat_tarihi ?? ""} placeholder="Yapı ruhsatı (tarih)" className={inpCls} />
                <input name="yapi_denetim" defaultValue={(kunye as Record<string, string>).yapi_denetim ?? ""} placeholder="Yapı denetim firması" className={inpCls} />
                <input name="otopark" defaultValue={(kunye as Record<string, string>).otopark ?? ""} placeholder="Otopark kuralı" className={`${inpCls} sm:col-span-2`} />
                <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
                  <input type="checkbox" name="kat_karsiligi" defaultChecked={!!(kunye as Record<string, unknown>).kat_karsiligi} className="size-4" /> Kat karşılığı proje
                </label>
                <textarea name="malzeme" defaultValue={Array.isArray((kunye as Record<string, unknown>).malzeme) ? ((kunye as Record<string, string[]>).malzeme).join("\n") : ""} placeholder="Malzeme (her satır: Pencere · Schüco)" rows={2} className={`min-h-[72px] w-full rounded-xl border border-hair bg-card px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-teal sm:col-span-2`} />
                <input name="donati" defaultValue={Array.isArray((kunye as Record<string, unknown>).donati) ? ((kunye as Record<string, string[]>).donati).join(", ") : ""} placeholder="Sosyal donatı (virgülle: Havuz, Fitness)" className={`${inpCls} sm:col-span-2`} />
                <div className="sm:col-span-2"><SubmitButton varyant="outline">İmar bilgisini kaydet</SubmitButton></div>
              </form>
              <p className="mt-3 text-xs text-gray">
                Proje &quot;{proje.ad}&quot; oluşturuldu. İmar detayını doldur ya da atla — sonra düzenlenebilir.
              </p>
            </>
          )}
        </AdimKart>
      ) : null}

      {/* ───────── ADIM 2: BLOKLAR & DAİRE TİPLERİ ───────── */}
      {adim === 2 && proje ? (
        <AdimKart
          baslik="Bloklar & Daire Tipleri"
          aciklama="Önce blokları (ad + kat) ekle, sonra daire tiplerini (konut: 1+0…4+1, ticari: dükkan/ofis) tanımla."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {/* Bloklar */}
            <div className="kart p-4">
              <h3 className="font-medium text-ink">Bloklar ({bloklar.length})</h3>
              <ul className="mt-2 space-y-1.5">
                {bloklar.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                    <span className="text-ink">
                      {b.ad}
                      {b.kat_sayisi ? ` · ${b.kat_sayisi} kat` : ""}
                    </span>
                    <form action={blokSil}>
                      <input type="hidden" name="proje_id" value={proje.id} />
                      <input type="hidden" name="blok_id" value={b.id} />
                      <input type="hidden" name="geri_yol" value={geriYol(2)} />
                      <button className="text-xs font-medium text-red hover:underline">Sil</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={blokEkle} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="proje_id" value={proje.id} />
                <input type="hidden" name="geri_yol" value={geriYol(2)} />
                <input name="ad" placeholder="C Blok" required className={`${inpCls} flex-1`} />
                <input name="kat_sayisi" type="number" placeholder="kat" className={`${inpCls} w-20`} />
                <SubmitButton>Ekle</SubmitButton>
              </form>
            </div>

            {/* Daire tipleri */}
            <div className="kart p-4">
              <h3 className="font-medium text-ink">Daire tipleri ({tipler.length})</h3>
              <ul className="mt-2 space-y-1.5">
                {tipler.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                    <span className="text-ink">
                      {t.ad}
                      {t.oda ? ` · ${t.oda}` : ""}
                      {t.net_m2 ? ` · ${t.net_m2}m²` : ""}
                      {t.taban_fiyat ? ` · ${Number(t.taban_fiyat).toLocaleString("tr-TR")}₺` : ""}
                    </span>
                    <form action={tipSil}>
                      <input type="hidden" name="proje_id" value={proje.id} />
                      <input type="hidden" name="tip_id" value={t.id} />
                      <input type="hidden" name="geri_yol" value={geriYol(2)} />
                      <button className="text-xs font-medium text-red hover:underline">Sil</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={daireTipiEkle} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="proje_id" value={proje.id} />
                <input type="hidden" name="geri_yol" value={geriYol(2)} />
                <input name="ad" placeholder="2+1 Standart" required className={inpCls} />
                <input name="oda" placeholder="2+1 / dükkan / ofis" className={inpCls} />
                <input name="net_m2" type="number" placeholder="net m²" className={inpCls} />
                <input name="taban_fiyat" type="number" placeholder="taban fiyat ₺" className={inpCls} />
                <SubmitButton className="col-span-2 w-full">Tip ekle</SubmitButton>
              </form>
            </div>
          </div>
          {!tamam.stok ? (
            <p className="mt-3 rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-ink">
              Birim üretimi için en az 1 blok ve 1 daire tipi gerekli.
            </p>
          ) : null}
        </AdimKart>
      ) : null}

      {/* ───────── ADIM 3: BİRİM ÜRETİMİ ───────── */}
      {adim === 3 && proje ? (
        <AdimKart
          baslik="Birim Üretimi"
          aciklama="Blok × kat × daire → birimleri toplu üret. Tür (daire/dükkan/ofis/villa) seçilebilir; aynı no atlanır."
        >
          {bloklar.length > 0 && tipler.length > 0 ? (
            <>
              <p className="mb-2 text-sm text-gray">
                Şu an <span className="font-mono font-semibold text-ink">{birimSayisi}</span> birim üretildi.
              </p>
              <GeneratorForm projeId={proje.id} bloklar={bloklar} tipler={tipler} geriYol={geriYol(3)} />
            </>
          ) : (
            <p className="text-sm text-gray">
              Önce <button type="button" onClick={() => git(2)} className="font-medium text-teal-d hover:underline">2. adımda</button> blok ve daire tipi tanımla.
            </p>
          )}
        </AdimKart>
      ) : null}

      {/* ───────── ADIM 4: FİYATLAMA & ÖDEME PLANI ───────── */}
      {adim === 4 && proje ? (
        <div>
          <AdimKart
            baslik="Ödeme Planı"
            aciklama="Proje geneli ödeme planı — tüm birimlere uygulanır. Aylık taksit her dairenin canlı fiyatından hesaplanır."
          >
            <form action={projeOdemePlaniGuncelle} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="proje_id" value={proje.id} />
              <input type="hidden" name="geri_yol" value={geriYol(4)} />
              <input name="pesinat_pct" type="number" step="1" min="0" max="100" placeholder="Peşinat %" className={inpCls} />
              <input name="taksit_sayisi" type="number" step="1" min="1" placeholder="Taksit sayısı (ay)" className={inpCls} />
              <input name="vade_farki_pct" type="number" step="0.1" placeholder="Vade farkı % (0 = yok)" className={inpCls} />
              <div className="sm:col-span-3"><SubmitButton varyant="outline">Ödeme planını uygula</SubmitButton></div>
            </form>
            <p className="mt-2 text-xs text-gray">
              Not: Önce <code className="rounded bg-soft px-1 font-mono">db/2026-06-28_odeme-plani.sql</code> migration&apos;ı çalışmalı.
            </p>
          </AdimKart>

          <AdimKart
            baslik="Yatırım Bilgileri"
            aciklama="Para birimi ve yıllık kira getirisi — yatırımcı havuzunda filtrelenir. (Yurtiçi: golden vize / oturum yok.)"
          >
            <form action={projeYatirimGuncelle} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="proje_id" value={proje.id} />
              <input type="hidden" name="geri_yol" value={geriYol(4)} />
              <select name="para_birimi" defaultValue={proje.para_birimi ?? "TRY"} className={inpCls}>
                <option value="TRY">₺ Türk Lirası</option>
                <option value="USD">$ Amerikan Doları</option>
                <option value="EUR">€ Euro</option>
              </select>
              <input name="kira_getirisi_pct" type="number" step="0.1" defaultValue={proje.kira_getirisi_pct ?? ""} placeholder="Yıllık kira getirisi %" className={inpCls} />
              <input name="amortisman_yil" type="number" step="0.1" defaultValue={proje.amortisman_yil ?? ""} placeholder="Geri dönüş süresi (yıl)" className={`${inpCls} sm:col-span-2`} />
              <div className="sm:col-span-2"><SubmitButton varyant="outline">Yatırım bilgilerini kaydet</SubmitButton></div>
            </form>
          </AdimKart>
        </div>
      ) : null}

      {/* ───────── ADIM 5: MEDYA ───────── */}
      {adim === 5 && proje ? (
        <AdimKart
          baslik="Medya"
          aciklama="Kapak görseli, tanıtım fotoğrafları, tanıtım videosu ve broşür/katalog."
        >
          <MedyaAdim projeId={proje.id} belgeler={belgeler} geriYol={geriYol(5)} />
        </AdimKart>
      ) : null}

      {/* ───────── ADIM 6: TAHSİS & KURALLAR ───────── */}
      {adim === 6 && proje ? (
        <AdimKart
          baslik="Tahsis & Kurallar"
          aciklama="Kim görür (herkes / belirli ofis), komisyon (% / sabit / yok), münhasır, kontenjan, fiyat görünür mü."
        >
          <TahsisForm
            projeId={proje.id}
            bloklar={bloklar.map((b) => ({ id: b.id, ad: b.ad }))}
            katlar={katlar}
            tipler={tipler.map((t) => ({ id: t.id, ad: t.ad, oda: t.oda }))}
            ofisler={ofisler}
            geriYol={geriYol(6)}
          />
          <p className="mt-3 text-xs text-gray">
            Tahsis eklemeden hiçbir emlakçı bu projeyi göremez. En az &quot;Herkese açık&quot; bir tahsis ekle.
          </p>
        </AdimKart>
      ) : null}

      {/* ───────── ADIM 7: ÖZET & YAYINLA ───────── */}
      {adim === 7 && proje ? (
        <AdimKart baslik="Özet & Yayınla" aciklama="Kurulum tamamlandı. Eksikleri sonradan Kurulum'dan düzenleyebilirsin.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Rozet ok={tamam.kunye} etiket="Künye / İmar" />
            <Rozet ok={tamam.stok} etiket="Blok & Tip" />
            <Rozet ok={tamam.birim} etiket={`${birimSayisi} Birim`} />
            <Rozet ok={tamam.medya} etiket="Medya" />
          </div>
          <div className="mt-4 rounded-xl border border-hair bg-soft p-4 text-sm">
            <p className="font-display text-base font-semibold text-ink">{proje.ad}</p>
            <p className="mt-0.5 text-gray">
              {[proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "Konum girilmedi"}
            </p>
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-ink-soft">
              <li>Blok: {bloklar.length} · Tip: {tipler.length} · Birim: {birimSayisi}</li>
              <li>Para birimi: {proje.para_birimi ?? "TRY"}</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/uretici/proje/${proje.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink"
            >
              Projeyi yayınla / Kokpite git →
            </Link>
            <Link
              href={`/uretici/proje/${proje.id}/kurulum`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-hair bg-card px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-teal"
            >
              Kurulumdan düzenle
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray">
            Daha sonra Kurulum&apos;dan (tahsis, fiyat, mahal listesi, belgeler) düzenleyebilirsin.
          </p>
        </AdimKart>
      ) : null}

      {/* İLERİ / GERİ */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => git(adim - 1)}
          disabled={adim <= 1}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hair bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Geri
        </button>
        {adim < 7 ? (
          <button
            type="button"
            onClick={() => git(adim + 1)}
            disabled={!id} // adım 1'de proje oluşmadan ileri yok
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {id ? "İleri →" : "Önce projeyi oluştur"}
          </button>
        ) : (
          <span className="text-xs font-medium text-teal-d">Son adım</span>
        )}
      </div>
    </div>
  );
}

/* ── Tamamlanma rozeti ── */
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

/* ── Medya adımı (kapak + foto + video + broşür) ── */
function MedyaAdim({
  projeId,
  belgeler,
  geriYol,
}: {
  projeId: string;
  belgeler: WizardBelge[];
  geriYol: string;
}) {
  const kapak = belgeler.find((b) => b.tip === "kapak") ?? null;
  const fotolar = belgeler.filter((b) => b.tip === "foto");
  const videolar = belgeler.filter((b) => b.tip === "video");
  const brosurler = belgeler.filter((b) => b.tip === "brosur");
  const fileCls =
    "w-full text-sm text-gray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/10";

  const SilBtn = ({ belgeId }: { belgeId: string }) => (
    <form action={medyaSil}>
      <input type="hidden" name="belge_id" value={belgeId} />
      <input type="hidden" name="proje_id" value={projeId} />
      <button className="rounded-md px-2 py-1 text-xs font-medium text-red transition-colors hover:bg-red-soft">Sil</button>
    </form>
  );

  return (
    <div className="space-y-5">
      {/* Kapak */}
      <div>
        <p className="text-sm font-medium text-ink">Kapak görseli</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-hair bg-soft">
          <div className="aspect-[21/9] w-full">
            {kapak?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kapak.url} alt="Kapak" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-soft via-teal-soft to-soft">
                <span className="text-xs text-gray">Kapak yüklenmedi</span>
              </div>
            )}
          </div>
        </div>
        <form action={medyaYukle} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={projeId} />
          <input type="hidden" name="tip" value="kapak" />
          <input type="hidden" name="geri_yol" value={geriYol} />
          <input type="file" name="dosya" accept="image/*" required className={`${fileCls} flex-1`} />
          <SubmitButton varyant="outline">{kapak ? "Değiştir" : "Yükle"}</SubmitButton>
        </form>
      </div>

      {/* Tanıtım görselleri */}
      <div className="border-t border-hair pt-4">
        <p className="text-sm font-medium text-ink">Tanıtım görselleri</p>
        {fotolar.length > 0 ? (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {fotolar.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border border-hair">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url ?? ""} alt={f.ad ?? "Foto"} className="aspect-square w-full object-cover" />
                <div className="absolute right-1 top-1 rounded-md bg-card/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                  <SilBtn belgeId={f.id} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={projeId} />
          <input type="hidden" name="tip" value="foto" />
          <input type="hidden" name="geri_yol" value={geriYol} />
          <input type="file" name="dosya" accept="image/*" multiple required className={`${fileCls} flex-1`} />
          <SubmitButton varyant="outline">Görsel yükle</SubmitButton>
        </form>
      </div>

      {/* Video */}
      <div className="border-t border-hair pt-4">
        <p className="text-sm font-medium text-ink">Tanıtım videosu</p>
        {videolar.length > 0 ? (
          <div className="mt-2 space-y-2">
            {videolar.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="flex-1 truncate text-ink">{v.ad}</span>
                {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <SilBtn belgeId={v.id} />
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={projeId} />
          <input type="hidden" name="tip" value="video" />
          <input type="hidden" name="geri_yol" value={geriYol} />
          <input name="ad" placeholder="Başlık (opsiyonel)" className={`${inpCls} w-40`} />
          <input name="url" type="url" required placeholder="https://youtube.com/..." className={`${inpCls} flex-1`} />
          <SubmitButton varyant="outline">Video ekle</SubmitButton>
        </form>
      </div>

      {/* Broşür */}
      <div className="border-t border-hair pt-4">
        <p className="text-sm font-medium text-ink">Broşür / katalog (PDF)</p>
        {brosurler.length > 0 ? (
          <div className="mt-2 space-y-2">
            {brosurler.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-hair px-3 py-2 text-sm">
                <span className="flex-1 truncate text-ink">{b.ad}</span>
                {b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-d hover:underline">Aç</a> : null}
                <SilBtn belgeId={b.id} />
              </div>
            ))}
          </div>
        ) : null}
        <form action={medyaYukle} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={projeId} />
          <input type="hidden" name="tip" value="brosur" />
          <input type="hidden" name="geri_yol" value={geriYol} />
          <input type="file" name="dosya" accept="application/pdf" required className={`${fileCls} flex-1`} />
          <SubmitButton varyant="outline">Broşür yükle</SubmitButton>
        </form>
      </div>
    </div>
  );
}
