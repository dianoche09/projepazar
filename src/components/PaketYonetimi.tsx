"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { paketEkle, paketDuzenle, paketSil } from "@/app/admin/actions";
import { fmtPara, HEDEF_ETIKET, type AbonelikHedef, type AbonelikPaketi } from "@/lib/types";

const HEDEFLER: AbonelikHedef[] = ["ofis", "uretici", "emlakci"];
const inp = "rounded-lg border border-hair bg-soft px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-teal";

// Hedef → sinyal rengi + rozet tonu (Genel Bakış dağılım renkleriyle uyumlu)
const HEDEF_SINYAL: Record<AbonelikHedef, { sig: string; rozet: string }> = {
  ofis: { sig: "var(--color-amber)", rozet: "bg-amber-soft text-amber" },
  uretici: { sig: "var(--color-navy)", rozet: "bg-navy/10 text-navy" },
  emlakci: { sig: "var(--color-teal)", rozet: "bg-teal/12 text-teal-d" },
};

function Kaydet({ etiket = "Kaydet" }: { etiket?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn-action !min-h-0 !self-end !rounded-lg !px-4 !py-1.5 !text-[13px] disabled:opacity-50">
      {pending ? "…" : etiket}
    </button>
  );
}

/** Paket form alanları (ekle + düzenle ortak). Fiyat/kota boş başlar — admin doldurur. */
function PaketAlanlari({ p }: { p?: AbonelikPaketi }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        Tip adı
        <input name="ad" required maxLength={60} defaultValue={p?.ad ?? ""} placeholder="ör. Pro" className={`${inp} w-32`} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        Aylık fiyat
        <input name="fiyat_aylik" type="number" min={0} defaultValue={p?.fiyat_aylik ?? ""} placeholder="0" className={`${inp} w-28`} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        Para
        <select name="para_birimi" defaultValue={p?.para_birimi ?? "TRY"} className={inp}>
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        Koltuk kotası
        <input name="kota_koltuk" type="number" min={1} defaultValue={p?.kota_koltuk ?? ""} placeholder="∞" className={`${inp} w-20`} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        Proje kotası
        <input name="kota_proje" type="number" min={1} defaultValue={p?.kota_proje ?? ""} placeholder="∞" className={`${inp} w-20`} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
        AI içerik/ay
        <input name="kota_ai" type="number" min={0} defaultValue={p?.kota_ai ?? ""} placeholder="—" className={`${inp} w-20`} />
      </label>
      <label className="flex items-center gap-1.5 self-end pb-1.5 text-xs text-ink">
        <input type="checkbox" name="gelismis_rapor" defaultChecked={p?.gelismis_rapor ?? false} className="size-4 accent-teal" />
        Gelişmiş rapor
      </label>
    </>
  );
}

/** Üyelik paketi yönetimi — ofis/üretici/emlakçı üçü için tam CRUD (admin-kontrollü). */
export function PaketYonetimi({ paketler }: { paketler: AbonelikPaketi[] }) {
  const [duzenle, setDuzenle] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {HEDEFLER.map((hedef) => {
        const grup = paketler.filter((p) => p.hedef === hedef);
        const s = HEDEF_SINYAL[hedef];
        return (
          <section key={hedef} className="kart signal-top !p-0" style={{ ["--_sig" as string]: s.sig }}>
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <h3 className="font-display text-base font-semibold text-ink">{HEDEF_ETIKET[hedef]} paketleri</h3>
              <span className={`rozet mono ${s.rozet}`}>{grup.length} paket</span>
            </div>

            <div className="space-y-2 px-5 pb-5">
              {grup.length === 0 ? (
                <p className="rounded-xl border border-dashed border-hair px-4 py-5 text-center text-sm text-gray">
                  Henüz paket yok — aşağıdan tanımla.
                </p>
              ) : null}

              {grup.map((p) =>
                duzenle === p.id ? (
                  <form key={p.id} action={paketDuzenle} className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-teal/40 bg-soft p-3.5">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="hedef" value={p.hedef} />
                    <PaketAlanlari p={p} />
                    <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
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
                      className="self-end rounded-lg border border-hair bg-card px-4 py-1.5 text-[13px] font-semibold text-gray transition-colors hover:text-ink"
                    >
                      İptal
                    </button>
                  </form>
                ) : (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-hair bg-card p-3.5 shadow-card">
                    <span className="text-sm font-semibold text-ink">{p.ad}</span>
                    <span className="mono text-sm font-semibold text-navy">{fmtPara(p.fiyat_aylik, p.para_birimi)}/ay</span>
                    <span className="text-[12px] text-gray">
                      {p.kota_koltuk != null ? `${p.kota_koltuk} koltuk` : "∞ koltuk"}
                      {p.kota_proje != null ? ` · ${p.kota_proje} proje` : ""}
                      {p.kota_ai != null ? ` · ${p.kota_ai} AI` : ""}
                      {p.gelismis_rapor ? " · gelişmiş rapor" : ""}
                    </span>
                    {!p.aktif ? <span className="rozet bg-gray/12 text-gray">pasif</span> : null}
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setDuzenle(p.id)}
                        className="rounded-lg border border-hair bg-card px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-teal"
                      >
                        Düzenle
                      </button>
                      <form action={paketSil}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-lg border border-hair bg-card px-3 py-1.5 text-xs font-semibold text-red transition-colors hover:border-red">
                          Sil
                        </button>
                      </form>
                    </div>
                  </div>
                ),
              )}

              {/* Yeni paket ekle (bu hedef için) */}
              <form action={paketEkle} className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-dashed border-hair bg-soft/60 p-3.5">
                <input type="hidden" name="hedef" value={hedef} />
                <PaketAlanlari />
                <Kaydet etiket="Paket ekle" />
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
