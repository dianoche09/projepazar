"use client";

import { useState, useTransition } from "react";
import { leadDurumGuncelle } from "@/app/havuz/actions";
import { useToast } from "@/components/ui/Toast";

const DURUMLAR: [string, string][] = [
  ["yeni", "Yeni"],
  ["arandi", "Arandı"],
  ["gorusme", "Görüşme"],
  ["opsiyon", "Opsiyon"],
  ["kazanildi", "Kazanıldı"],
  ["kaybedildi", "Kayıp"],
];
const RENK: Record<string, string> = {
  yeni: "bg-green text-white",
  arandi: "bg-amber text-white",
  gorusme: "bg-navy text-white",
  opsiyon: "bg-amber text-white",
  kazanildi: "bg-green text-white",
  kaybedildi: "bg-red text-white",
};

/** Lead durum ilerletme — optimistic; hata olursa geri alır + toast. */
export function LeadDurum({ leadId, durum }: { leadId: string; durum: string }) {
  const [d, setD] = useState(durum);
  const [bekliyor, basla] = useTransition();
  const toast = useToast();

  const sec = (yeni: string) => {
    if (yeni === d || bekliyor) return;
    const onceki = d;
    setD(yeni);
    basla(async () => {
      const r = await leadDurumGuncelle(leadId, yeni);
      if (!r.ok) {
        setD(onceki);
        toast.goster("Güncellenemedi", "hata");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {DURUMLAR.map(([v, et]) => (
        <button
          key={v}
          type="button"
          onClick={() => sec(v)}
          disabled={bekliyor}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
            d === v ? RENK[v] : "border border-hair text-gray hover:border-teal hover:text-ink"
          }`}
        >
          {et}
        </button>
      ))}
    </div>
  );
}
