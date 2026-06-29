"use client";

import { useTransition } from "react";
import { talepOnayla, talepReddet } from "@/app/uretici/actions";
import { useToast } from "@/components/ui/Toast";

/** Müteahhit opsiyon talebi kararı — Onayla (opsiyon açar) / Reddet. RPC SECURITY DEFINER. */
export function TalepKarar({ talepId, gun = 7 }: { talepId: string; gun?: number }) {
  const [bekliyor, basla] = useTransition();
  const toast = useToast();

  return (
    <div className="flex flex-none items-center gap-2">
      <button
        type="button"
        disabled={bekliyor}
        onClick={() =>
          basla(async () => {
            const r = await talepOnayla(talepId, gun);
            toast.goster(r.mesaj, r.ok ? "basari" : "hata");
          })
        }
        className="rounded-lg bg-green px-3 py-[7px] text-[11.5px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
      >
        {bekliyor ? "…" : `Onayla · ${gun}g`}
      </button>
      <button
        type="button"
        disabled={bekliyor}
        onClick={() =>
          basla(async () => {
            const r = await talepReddet(talepId);
            toast.goster(r.mesaj, r.ok ? "basari" : "hata");
          })
        }
        className="rounded-lg border border-red/30 px-3 py-[7px] text-[11.5px] font-bold text-red transition-all hover:bg-red-soft disabled:opacity-50"
      >
        Reddet
      </button>
    </div>
  );
}
