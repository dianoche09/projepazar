"use client";

import { useState } from "react";
import { DURUM_BG, DURUM_ETIKET } from "@/lib/types";
import { DaireModal, type ModalBirim } from "./DaireModal";

/** Izgara hücresi — tıklanınca merkezi Daire MODAL açar (künye + şerefiye + durum/not). */
export function BirimHucre({ birim, projeId }: { birim: ModalBirim; projeId: string }) {
  const [acik, setAcik] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        title={`${birim.daire_no} · ${DURUM_ETIKET[birim.durum]}${!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}`}
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] text-white transition-transform hover:scale-105 ${DURUM_BG[birim.durum]} ${!birim.satilabilir ? "opacity-70 ring-2 ring-inset ring-white/60" : ""}`}
      >
        {birim.daire_no}
      </button>

      {acik ? <DaireModal birim={birim} projeId={projeId} onKapat={() => setAcik(false)} /> : null}
    </>
  );
}
