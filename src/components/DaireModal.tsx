"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { birimDurumGuncelle } from "@/app/uretici/actions";
import { DURUM_BG, DURUM_ETIKET, zamanOnce, type BirimDurum } from "@/lib/types";

const DURUMLAR: BirimDurum[] = ["musait", "opsiyonlu", "satis_beklemede", "satildi", "stop"];

export type ModalBirim = {
  id: string;
  daire_no: string | null;
  kat: number | null;
  durum: BirimDurum;
  satilabilir: boolean;
  liste_fiyati: number | null;
  para_birimi: string;
  net_m2: number | null;
  brut_m2: number | null;
  yon: string | null;
  manzara: string | null;
  durum_notu: string | null;
  son_guncelleme: string;
  serefiye: { kat?: number; manzara?: number } | null;
  taban_fiyat: number | null;
  tip_ad: string | null;
  oda: string | null;
};

const fmt = (n: number) => n.toLocaleString("tr-TR");

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

/** Daire detay modalı — merkezi, scroll yaratmaz. Şerefiye kırılımı + künye + durum/not + iz. */
export function DaireModal({
  birim,
  projeId,
  onKapat,
}: {
  birim: ModalBirim;
  projeId: string;
  onKapat: () => void;
}) {
  const [durum, setDurum] = useState<BirimDurum>(birim.durum);

  const taban = birim.taban_fiyat;
  const liste = birim.liste_fiyati;
  const sKat = birim.serefiye?.kat ?? null;
  const sManzara = birim.serefiye?.manzara ?? null;
  const katKatki = taban != null && sKat ? Math.round((taban * sKat) / 100) : null;
  const manzaraKatki = taban != null && sManzara ? Math.round((taban * sManzara) / 100) : null;
  const fark = taban != null && liste != null ? liste - taban : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onKapat} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-hair bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Daire {birim.daire_no ?? "—"}</h3>
            <p className="text-sm text-gray">
              {birim.tip_ad ?? birim.oda ?? "—"}
              {birim.kat != null ? ` · ${birim.kat}. kat` : ""}
              {!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}
            </p>
          </div>
          <button onClick={onKapat} className="rounded-lg px-2 py-1 text-gray transition-colors hover:bg-paper" aria-label="Kapat">
            ✕
          </button>
        </div>

        {birim.net_m2 || birim.brut_m2 || birim.yon || birim.manzara ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {birim.net_m2 ? (
              <div><span className="text-gray">Net </span><span className="font-mono text-ink">{birim.net_m2} m²</span></div>
            ) : null}
            {birim.brut_m2 ? (
              <div><span className="text-gray">Brüt </span><span className="font-mono text-ink">{birim.brut_m2} m²</span></div>
            ) : null}
            {birim.yon ? (
              <div><span className="text-gray">Yön </span><span className="text-ink">{birim.yon}</span></div>
            ) : null}
            {birim.manzara ? (
              <div><span className="text-gray">Manzara </span><span className="text-ink">{birim.manzara}</span></div>
            ) : null}
          </div>
        ) : null}

        {taban != null ? (
          <div className="mt-4 rounded-xl border border-hair bg-paper p-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray">Taban fiyat</span>
              <span className="text-ink">{fmt(taban)} ₺</span>
            </div>
            {katKatki != null ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Kat şerefiyesi %{sKat}</span>
                <span className="text-ink">+{fmt(katKatki)} ₺</span>
              </div>
            ) : null}
            {manzaraKatki != null ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Manzara şerefiyesi %{sManzara}</span>
                <span className="text-ink">+{fmt(manzaraKatki)} ₺</span>
              </div>
            ) : null}
            {katKatki == null && manzaraKatki == null && fark != null && fark !== 0 ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Kat/konum farkı</span>
                <span className="text-ink">{fark > 0 ? "+" : ""}{fmt(fark)} ₺</span>
              </div>
            ) : null}
            <div className="mt-1 flex justify-between border-t border-hair pt-1 font-semibold">
              <span className="text-ink">Liste fiyatı</span>
              <span className="text-ink">{liste != null ? fmt(liste) : "—"} ₺</span>
            </div>
          </div>
        ) : liste != null ? (
          <p className="mt-4 font-mono text-lg text-ink">{fmt(liste)} ₺</p>
        ) : null}

        <form
          action={async (fd) => {
            await birimDurumGuncelle(fd);
            onKapat();
          }}
          className="mt-4"
        >
          <input type="hidden" name="birim_id" value={birim.id} />
          <input type="hidden" name="proje_id" value={projeId} />
          <p className="text-sm font-medium text-ink">Durum</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURUMLAR.map((d) => (
              <label
                key={d}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  durum === d ? `border-transparent text-white ${DURUM_BG[d]}` : "border-hair text-gray hover:border-teal"
                }`}
              >
                <input
                  type="radio"
                  name="durum"
                  value={d}
                  checked={durum === d}
                  onChange={() => setDurum(d)}
                  className="sr-only"
                />
                {DURUM_ETIKET[d]}
              </label>
            ))}
          </div>
          <textarea
            name="durum_notu"
            defaultValue={birim.durum_notu ?? ""}
            rows={2}
            placeholder="Durum notu — opsiyon: kim/ne zaman; satış: alıcı vb."
            className="mt-3 w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-mono text-xs text-gray">
              <span className="size-1.5 rounded-full bg-green" />
              {zamanOnce(birim.son_guncelleme)}
            </span>
            <Kaydet />
          </div>
        </form>
      </div>
    </div>
  );
}
