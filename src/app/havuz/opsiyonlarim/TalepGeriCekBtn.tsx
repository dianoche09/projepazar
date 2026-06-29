"use client";

import { useTransition } from "react";
import { talepGeriCek } from "@/app/havuz/actions";
import { useToast } from "@/components/ui/Toast";

/** Emlakçı kendi bekleyen opsiyon talebini geri çeker. */
export function TalepGeriCekBtn({ talepId, projeId }: { talepId: string; projeId: string }) {
  const [bekliyor, basla] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={bekliyor}
      onClick={() =>
        basla(async () => {
          const r = await talepGeriCek(talepId, projeId);
          toast.goster(r.mesaj, r.ok ? "basari" : "hata");
        })
      }
      className="flex-none rounded-lg border border-[var(--cizgi)] px-3 py-[6px] text-[11.5px] font-bold text-ink-soft transition-all hover:bg-soft disabled:opacity-50"
    >
      {bekliyor ? "…" : "Geri çek"}
    </button>
  );
}
