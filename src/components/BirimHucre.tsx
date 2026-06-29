"use client";

import { useState } from "react";
import { DURUM_ETIKET } from "@/lib/types";
import { DaireModal, type ModalBirim } from "./DaireModal";
import { useSecim } from "./SecimDuzenle";

/** Birim durumu → bina kesiti hücre gradyan sınıfı (v2 .hucre). */
function hucreSinif(durum: string): string {
  if (durum === "musait") return "h-musait";
  if (durum === "opsiyonlu" || durum === "satis_beklemede") return "h-opsiyon";
  if (durum === "satildi") return "h-satildi";
  return "h-bos";
}

/**
 * Bina kesiti hücresi — durum-renkli gradient + daire no + tip (oda).
 * Tıkla → merkezi Daire MODAL. mod: üretici (durum/not) | emlakçı (paylaş/opsiyon).
 * Seçim modunda (SecimDuzenle) toplu işaretleme.
 */
export function BirimHucre({
  birim,
  projeId,
  mod = "uretici",
  projeAd = "",
  shareUrl = "",
  benimOpsiyon = false,
}: {
  birim: ModalBirim;
  projeId: string;
  mod?: "uretici" | "emlakci";
  projeAd?: string;
  shareUrl?: string;
  benimOpsiyon?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const secim = useSecim();
  const secimModu = secim?.secimModu ?? false;
  const seciliMi = secim?.secili.has(birim.id) ?? false;
  const tip = birim.oda ?? birim.tip_ad ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => (secimModu ? secim!.toggle(birim.id) : setAcik(true))}
        title={`${birim.daire_no ?? ""} · ${DURUM_ETIKET[birim.durum]}${!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}`}
        className={`hucre min-w-[48px] shrink-0 ${hucreSinif(birim.durum)} ${
          !birim.satilabilir ? "opacity-80 ring-1 ring-inset ring-white/55" : ""
        } ${seciliMi ? "ring-2 ring-white" : ""}`}
      >
        {seciliMi ? (
          <span className="text-[14px] font-bold">✓</span>
        ) : (
          <>
            <span className="font-mono text-[11px] font-bold leading-none">{birim.daire_no ?? "—"}</span>
            {tip ? (
              <span className="mt-[3px] text-[8.5px] font-semibold leading-none opacity-85">{tip}</span>
            ) : null}
          </>
        )}
      </button>

      {acik && !secimModu ? (
        <DaireModal
          birim={birim}
          projeId={projeId}
          mod={mod}
          projeAd={projeAd}
          shareUrl={shareUrl}
          benimOpsiyon={benimOpsiyon}
          onKapat={() => setAcik(false)}
        />
      ) : null}
    </>
  );
}
