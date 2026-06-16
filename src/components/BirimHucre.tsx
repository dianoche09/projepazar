"use client";

import { useState } from "react";
import { birimDurumGuncelle } from "@/app/uretici/actions";
import { DURUM_BG, DURUM_ETIKET, type BirimDurum } from "@/lib/types";

const SECENEKLER: BirimDurum[] = [
  "musait",
  "opsiyonlu",
  "satis_beklemede",
  "satildi",
  "stop",
];

type HucreBirim = {
  id: string;
  daire_no: string | null;
  durum: BirimDurum;
  satilabilir: boolean;
};

/** Izgara hücresi — tıklanınca durum menüsü açılır (üretici tek tıkla durum değiştirir). */
export function BirimHucre({
  birim,
  projeId,
}: {
  birim: HucreBirim;
  projeId: string;
}) {
  const [acik, setAcik] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        title={`${birim.daire_no} · ${DURUM_ETIKET[birim.durum]}${!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}`}
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] text-white transition-transform hover:scale-105 ${DURUM_BG[birim.durum]} ${!birim.satilabilir ? "opacity-70 ring-2 ring-inset ring-white/60" : ""}`}
      >
        {birim.daire_no}
      </button>

      {acik ? (
        <>
          {/* dışarı tıkla → kapat */}
          <div className="fixed inset-0 z-10" onClick={() => setAcik(false)} />
          <div className="absolute left-0 top-12 z-20 w-44 rounded-xl border border-hair bg-card p-1 shadow-lg">
            <p className="px-2 py-1 font-mono text-[10px] text-gray">{birim.daire_no}</p>
            {SECENEKLER.map((d) => (
              <form key={d} action={birimDurumGuncelle}>
                <input type="hidden" name="birim_id" value={birim.id} />
                <input type="hidden" name="proje_id" value={projeId} />
                <input type="hidden" name="durum" value={d} />
                <button
                  type="submit"
                  onClick={() => setAcik(false)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-paper ${
                    d === birim.durum ? "font-semibold text-ink" : "text-gray"
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${DURUM_BG[d]}`} />
                  {DURUM_ETIKET[d]}
                </button>
              </form>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
