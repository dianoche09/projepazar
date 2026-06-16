"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { paketEkle, paketDuzenle, paketSil } from "@/app/admin/actions";
import { fmtPara, HEDEF_ETIKET, type AbonelikHedef, type AbonelikPaketi } from "@/lib/types";

const HEDEFLER: AbonelikHedef[] = ["ofis", "uretici", "emlakci"];
const inp = "rounded-lg border border-hair bg-paper px-2 py-1.5 text-sm text-ink";

function Kaydet({ etiket = "Kaydet" }: { etiket?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="self-end rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "…" : etiket}
    </button>
  );
}

/** Paket form alanları (ekle + düzenle ortak). Fiyat/kota boş başlar — admin doldurur. */
function PaketAlanlari({ p }: { p?: AbonelikPaketi }) {
  return (
    <>
      <label className="flex flex-col text-xs text-gray">
        Tip adı
        <input name="ad" required maxLength={60} defaultValue={p?.ad ?? ""} placeholder="ör. Pro" className={`${inp} w-32`} />
      </label>
      <label className="flex flex-col text-xs text-gray">
        Aylık fiyat
        <input name="fiyat_aylik" type="number" min={0} defaultValue={p?.fiyat_aylik ?? ""} placeholder="0" className={`${inp} w-28`} />
      </label>
      <label className="flex flex-col text-xs text-gray">
        Para
        <select name="para_birimi" defaultValue={p?.para_birimi ?? "TRY"} className={inp}>
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-gray">
        Koltuk kotası
        <input name="kota_koltuk" type="number" min={1} defaultValue={p?.kota_koltuk ?? ""} placeholder="∞" className={`${inp} w-20`} />
      </label>
      <label className="flex flex-col text-xs text-gray">
        Proje kotası
        <input name="kota_proje" type="number" min={1} defaultValue={p?.kota_proje ?? ""} placeholder="∞" className={`${inp} w-20`} />
      </label>
      <label className="flex flex-col text-xs text-gray">
        AI içerik/ay
        <input name="kota_ai" type="number" min={0} defaultValue={p?.kota_ai ?? ""} placeholder="—" className={`${inp} w-20`} />
      </label>
      <label className="flex items-center gap-1.5 self-end pb-1.5 text-xs text-ink">
        <input type="checkbox" name="gelismis_rapor" defaultChecked={p?.gelismis_rapor ?? false} className="size-4" />
        Gelişmiş rapor
      </label>
    </>
  );
}

/** Üyelik paketi yönetimi — ofis/üretici/emlakçı üçü için tam CRUD (admin-kontrollü). */
export function PaketYonetimi({ paketler }: { paketler: AbonelikPaketi[] }) {
  const [duzenle, setDuzenle] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {HEDEFLER.map((hedef) => {
        const grup = paketler.filter((p) => p.hedef === hedef);
        return (
          <div key={hedef}>
            <h3 className="font-display text-base font-semibold text-ink">{HEDEF_ETIKET[hedef]} paketleri</h3>
            <div className="mt-2 space-y-2">
              {grup.length === 0 ? (
                <p className="text-sm text-gray">Henüz paket yok — aşağıdan tanımla.</p>
              ) : null}

              {grup.map((p) =>
                duzenle === p.id ? (
                  <form key={p.id} action={paketDuzenle} className="flex flex-wrap items-end gap-2 rounded-xl border border-teal/40 bg-card p-3">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="hedef" value={p.hedef} />
                    <PaketAlanlari p={p} />
                    <label className="flex flex-col text-xs text-gray">
                      Durum
                      <select name="aktif" defaultValue={p.aktif ? "true" : "false"} className={inp}>
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                      </select>
                    </label>
                    <Kaydet />
                    <button
                      type="button"
                      onClick={() => setDuzenle(null)}
                      className="self-end rounded-lg border border-hair px-3 py-1.5 text-sm text-gray"
                    >
                      İptal
                    </button>
                  </form>
                ) : (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-hair bg-card p-3">
                    <span className="font-medium text-ink">{p.ad}</span>
                    <span className="font-mono text-sm text-ink">{fmtPara(p.fiyat_aylik, p.para_birimi)}/ay</span>
                    <span className="text-xs text-gray">
                      {p.kota_koltuk != null ? `${p.kota_koltuk} koltuk` : "∞ koltuk"}
                      {p.kota_proje != null ? ` · ${p.kota_proje} proje` : ""}
                      {p.kota_ai != null ? ` · ${p.kota_ai} AI` : ""}
                      {p.gelismis_rapor ? " · gelişmiş rapor" : ""}
                    </span>
                    {!p.aktif ? (
                      <span className="rounded-full bg-gray/10 px-2 py-0.5 text-xs text-gray">pasif</span>
                    ) : null}
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setDuzenle(p.id)}
                        className="rounded-lg border border-hair px-3 py-1.5 text-sm text-navy transition-colors hover:border-teal"
                      >
                        Düzenle
                      </button>
                      <form action={paketSil}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-lg border border-hair px-3 py-1.5 text-sm text-red transition-colors hover:border-red">
                          Sil
                        </button>
                      </form>
                    </div>
                  </div>
                ),
              )}

              {/* Yeni paket ekle (bu hedef için) */}
              <form action={paketEkle} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-hair bg-card/50 p-3">
                <input type="hidden" name="hedef" value={hedef} />
                <PaketAlanlari />
                <Kaydet etiket="Paket ekle" />
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
