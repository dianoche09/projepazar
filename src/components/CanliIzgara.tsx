"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BinaKesiti, type BinaBirim } from "@/components/BinaKesiti";

type Blok = { id: string; ad: string | null; kat_sayisi: number | null };
type Tip = {
  id: string;
  ad: string | null;
  oda: string | null;
  taban_fiyat?: number | null;
  banyo?: number | null;
  balkon?: number | null;
  otopark?: string | null;
  plan_url?: string | null;
};

/**
 * Emlakçı bina kesitini CANLI tutar: Supabase Realtime ile `birim` değişimlerini dinler
 * (üretici fiyat/durum/opsiyon değiştirdiğinde anında yansır). Anon client → RLS uygulanır,
 * yalnız tahsisli birimlerin değişimi gelir (DEĞİŞMEZ #1). Paylaşım URL'leri server'dan map.
 */
export function CanliIzgara({
  projeId,
  projeAd,
  bloklar,
  tipler,
  baslangic,
  shareUrlMap,
}: {
  projeId: string;
  projeAd: string;
  bloklar: Blok[];
  tipler: Tip[];
  baslangic: BinaBirim[];
  shareUrlMap: Record<string, string>;
}) {
  const [birimler, setBirimler] = useState<BinaBirim[]>(baslangic);
  const [canli, setCanli] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const kanal = supabase
      .channel(`birim-${projeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "birim", filter: `proje_id=eq.${projeId}` },
        (payload) => {
          setBirimler((prev) => {
            if (payload.eventType === "DELETE") {
              const eski = payload.old as { id?: string };
              return eski.id ? prev.filter((b) => b.id !== eski.id) : prev;
            }
            const yeni = payload.new as BinaBirim;
            const i = prev.findIndex((b) => b.id === yeni.id);
            if (i === -1) return [...prev, yeni];
            const kopya = prev.slice();
            kopya[i] = { ...kopya[i], ...yeni };
            return kopya;
          });
        },
      )
      .subscribe((status) => {
        setCanli(status === "SUBSCRIBED");
      });
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [projeId]);

  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-xs text-gray">
        <span className={`size-2 rounded-full ${canli ? "nabiz bg-green" : "bg-amber"}`} />
        {canli ? "Canlı — değişiklikler anında yansır" : "Bağlanıyor…"}
      </div>
      <BinaKesiti
        bloklar={bloklar}
        birimler={birimler}
        tipler={tipler}
        mod="emlakci"
        projeId={projeId}
        projeAd={projeAd}
        shareUrlMap={shareUrlMap}
      />
    </div>
  );
}
