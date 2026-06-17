import {
  blokEkle,
  blokGuncelle,
  blokSil,
  daireTipiEkle,
  tipGuncelle,
  tipSil,
  tipGorseliYukle,
  excelImport,
} from "@/app/uretici/actions";
import { GeneratorForm } from "./GeneratorForm";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inpCls =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

type Blok = { id: string; ad: string | null; kat_sayisi: number | null };
type Tip = {
  id: string;
  ad: string | null;
  oda: string | null;
  net_m2: number | null;
  taban_fiyat: number | null;
  plan_url?: string | null;
};

/**
 * Proje stok KURULUMU — bir kez yapılır: bloklar, daire tipleri, birim üretimi,
 * Excel toplu yükleme. Günlük takip/satış proje ekranındadır (bina kesiti).
 */
export function StokKurulumu({
  projeId,
  bloklar,
  tipler,
}: {
  projeId: string;
  bloklar: Blok[];
  tipler: Tip[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Bloklar */}
        <div className="rounded-2xl border border-hair bg-card p-5">
          <h3 className="font-medium text-ink">Bloklar ({bloklar.length})</h3>
          <ul className="mt-2 space-y-1.5">
            {bloklar.map((b) => (
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
                      <input type="hidden" name="proje_id" value={projeId} />
                      <input type="hidden" name="blok_id" value={b.id} />
                      <input name="ad" defaultValue={b.ad ?? ""} className={`${inpCls} flex-1`} />
                      <input name="kat_sayisi" type="number" defaultValue={b.kat_sayisi ?? ""} placeholder="kat" className={`${inpCls} w-20`} />
                      <SubmitButton>Kaydet</SubmitButton>
                    </form>
                    <form action={blokSil} className="mt-2">
                      <input type="hidden" name="proje_id" value={projeId} />
                      <input type="hidden" name="blok_id" value={b.id} />
                      <SubmitButton varyant="outline" className="!border-red/40 !text-red">Bloğu sil</SubmitButton>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <form action={blokEkle} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="proje_id" value={projeId} />
            <input name="ad" placeholder="C Blok" required className={`${inpCls} flex-1`} />
            <input name="kat_sayisi" type="number" placeholder="kat" className={`${inpCls} w-20`} />
            <SubmitButton>Ekle</SubmitButton>
          </form>
        </div>

        {/* Daire tipleri */}
        <div className="rounded-2xl border border-hair bg-card p-5">
          <h3 className="font-medium text-ink">Daire tipleri ({tipler.length})</h3>
          <ul className="mt-2 space-y-1.5">
            {tipler.map((t) => (
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
                      <input type="hidden" name="proje_id" value={projeId} />
                      <input type="hidden" name="tip_id" value={t.id} />
                      <input name="ad" defaultValue={t.ad ?? ""} placeholder="ad" className={inpCls} />
                      <input name="oda" defaultValue={t.oda ?? ""} placeholder="2+1" className={inpCls} />
                      <input name="net_m2" type="number" defaultValue={t.net_m2 ?? ""} placeholder="net m²" className={inpCls} />
                      <input name="taban_fiyat" type="number" defaultValue={t.taban_fiyat ?? ""} placeholder="taban ₺" className={inpCls} />
                      <div className="col-span-2"><SubmitButton>Kaydet</SubmitButton></div>
                    </form>
                    <div className="mt-3 border-t border-hair pt-3">
                      <p className="text-xs font-medium text-gray">Plan / tip görseli — daireye basınca açılır</p>
                      {t.plan_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.plan_url} alt="plan" className="mt-2 h-24 rounded-lg border border-hair object-contain bg-paper" />
                      ) : null}
                      <form action={tipGorseliYukle} className="mt-2 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="proje_id" value={projeId} />
                        <input type="hidden" name="tip_id" value={t.id} />
                        <input type="file" name="dosya" accept="image/*" required className="text-xs text-gray" />
                        <SubmitButton varyant="outline">{t.plan_url ? "Görseli değiştir" : "Görsel yükle"}</SubmitButton>
                      </form>
                    </div>
                    <form action={tipSil} className="mt-3">
                      <input type="hidden" name="proje_id" value={projeId} />
                      <input type="hidden" name="tip_id" value={t.id} />
                      <SubmitButton varyant="outline" className="!border-red/40 !text-red">Tipi sil</SubmitButton>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <form action={daireTipiEkle} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="proje_id" value={projeId} />
            <input name="ad" placeholder="2+1 Standart" required className={inpCls} />
            <input name="oda" placeholder="2+1" className={inpCls} />
            <input name="net_m2" type="number" placeholder="net m²" className={inpCls} />
            <input name="taban_fiyat" type="number" placeholder="taban fiyat ₺" className={inpCls} />
            <SubmitButton className="col-span-2 w-full">Tip ekle</SubmitButton>
          </form>
        </div>
      </div>

      {/* Generator */}
      <div className="rounded-2xl border border-hair bg-card p-5">
        <h3 className="font-medium text-ink">Generator — toplu birim üret (tip × kat)</h3>
        {bloklar.length > 0 && tipler.length > 0 ? (
          <GeneratorForm projeId={projeId} bloklar={bloklar} tipler={tipler} />
        ) : (
          <p className="mt-2 text-sm text-gray">Generator için en az 1 blok ve 1 daire tipi tanımla.</p>
        )}
      </div>

      {/* Excel/CSV */}
      <div className="rounded-2xl border border-hair bg-card p-5">
        <h3 className="font-medium text-ink">Excel/CSV ile toplu yükle</h3>
        <p className="mt-1 text-xs text-gray">
          Sütunlar: <span className="font-mono">blok · kat · daire_no · tip · durum · fiyat · net_m2</span> (blok adları
          mevcut bloklarla eşleşmeli).
        </p>
        <form action={excelImport} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="proje_id" value={projeId} />
          <input type="file" name="dosya" accept=".xlsx,.xls,.csv" required className="text-sm text-gray file:mr-2 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:text-white" />
          <SubmitButton>Yükle</SubmitButton>
        </form>
      </div>
    </div>
  );
}
