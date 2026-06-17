"use client";

import { useState } from "react";
import { DURUM_BG, DURUM_ETIKET } from "@/lib/types";
import { DaireModal, type ModalBirim } from "./DaireModal";
import { useSecim } from "./SecimDuzenle";

/** Izgara hücresi — tıklanınca merkezi Daire MODAL açar. mod: üretici (durum/not) | emlakçı (paylaş). */
export function BirimHucre({
  birim,
  projeId,
  mod = "uretici",
  projeAd = "",
  shareUrl = "",
}: {
  birim: ModalBirim;
  projeId: string;
  mod?: "uretici" | "emlakci";
  projeAd?: string;
  shareUrl?: string;
}) {
  const [acik, setAcik] = useState(false);
  const secim = useSecim();
  const secimModu = secim?.secimModu ?? false;
  const seciliMi = secim?.secili.has(birim.id) ?? false;

  return (
    <>
      <button
        type="button"
        onClick={() => (secimModu ? secim!.toggle(birim.id) : setAcik(true))}
        title={`${birim.daire_no} · ${DURUM_ETIKET[birim.durum]}${!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}`}
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] text-white transition-transform hover:scale-105 ${DURUM_BG[birim.durum]} ${!birim.satilabilir ? "opacity-70 ring-2 ring-inset ring-white/60" : ""} ${seciliMi ? "scale-105 ring-2 ring-ink ring-offset-1" : ""}`}
      >
        {seciliMi ? "✓" : birim.daire_no}
      </button>

      {acik && !secimModu ? (
        <DaireModal
          birim={birim}
          projeId={projeId}
          mod={mod}
          projeAd={projeAd}
          shareUrl={shareUrl}
          onKapat={() => setAcik(false)}
        />
      ) : null}
    </>
  );
}
