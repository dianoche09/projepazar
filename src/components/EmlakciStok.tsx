"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BinaKesiti, type BinaBirim } from "@/components/BinaKesiti";
import { YiginBar } from "@/components/ui/Grafik";

type Blok = { id: string; ad: string | null; kat_sayisi: number | null };
type Tip = {
  id: string;
  ad: string | null;
  oda: string | null;
  taban_fiyat?: number | null;
  plan_url?: string | null;
};

const C = { green: "#2FB36B", amber: "#E3A12C", red: "#D15A4E" };

function fiyatKisa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}B`;
  return n.toLocaleString("tr-TR");
}

/**
 * Emlakçı proje stoğu — master/detail. Önce proje geneli + bloklar yan yana
 * ÖZET kart; bir bloğa tıklayınca o bloğun daireleri (bina kesiti) açılır.
 * Supabase Realtime ile canlı (üretici fiyat/durum değişince anında yansır).
 */
export function EmlakciStok({
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
  const [acik, setAcik] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const kanal = supabase
      .channel(`emlakci-birim-${projeId}`)
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
      .subscribe((status) => setCanli(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [projeId]);

  const ozet = (blokId: string) => {
    const bb = birimler.filter((b) => b.blok_id === blokId);
    const musait = bb.filter((b) => b.durum === "musait").length;
    const opsiyon = bb.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
    const satildi = bb.filter((b) => b.durum === "satildi").length;
    const fiyatlar = bb
      .filter((b) => b.durum === "musait")
      .map((b) => Number(b.liste_fiyati))
      .filter((f) => f > 0);
    return { toplam: bb.length, musait, opsiyon, satildi, min: fiyatlar.length ? Math.min(...fiyatlar) : null };
  };

  const genel = {
    toplam: birimler.length,
    musait: birimler.filter((b) => b.durum === "musait").length,
    opsiyon: birimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length,
    satildi: birimler.filter((b) => b.durum === "satildi").length,
  };
  const acikBlok = bloklar.find((b) => b.id === acik) ?? null;

  return (
    <div>
      {/* Proje geneli stat şeridi */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Toplam", genel.toplam, "bg-ink"],
          ["Müsait", genel.musait, "bg-green"],
          ["Opsiyon", genel.opsiyon, "bg-amber"],
          ["Satıldı", genel.satildi, "bg-red"],
        ].map(([et, sy, dot]) => (
          <div key={et as string} className="rounded-xl border border-hair bg-card p-3.5">
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${dot}`} />
              <span className="text-[11px] uppercase tracking-wide text-gray">{et}</span>
            </div>
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-ink">{sy}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Bloklar</h2>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gray">
          <span className={`size-2 rounded-full ${canli ? "nabiz bg-green" : "bg-amber"}`} />
          {canli ? "canlı" : "bağlanıyor…"}
        </span>
      </div>

      {/* Bloklar yan yana — özet kart */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bloklar.map((blok) => {
          const o = ozet(blok.id);
          const par = [
            { etiket: "Müsait", deger: o.musait, renk: C.green },
            { etiket: "Opsiyon", deger: o.opsiyon, renk: C.amber },
            { etiket: "Satıldı", deger: o.satildi, renk: C.red },
          ];
          const secili = acik === blok.id;
          return (
            <button
              key={blok.id}
              type="button"
              onClick={() => setAcik(secili ? null : blok.id)}
              className={`rounded-2xl border bg-card p-4 text-left shadow-card transition-all hover:shadow-cardlg ${
                secili ? "border-teal ring-2 ring-teal/20" : "border-hair"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-ink">{blok.ad}</h3>
                <span className="font-mono text-xs tabular-nums text-gray">
                  {o.toplam} birim{blok.kat_sayisi ? ` · ${blok.kat_sayisi} kat` : ""}
                </span>
              </div>
              <div className="mt-3">
                <YiginBar parcalar={par} yukseklik={9} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs tabular-nums">
                <span className="text-green">{o.musait} müsait</span>
                <span className="text-amber">{o.opsiyon} ops.</span>
                <span className="text-red">{o.satildi} satıldı</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-hair pt-2.5">
                <span className="font-mono text-sm font-medium text-ink">
                  {o.min != null ? `${fiyatKisa(o.min)} ₺'den` : "—"}
                </span>
                <span className="text-xs font-semibold text-teal-d">
                  {secili ? "kapat ▲" : "daireleri gör →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Seçili blok — daireler */}
      {acikBlok ? (
        <div className="mt-5 rounded-2xl border border-hair bg-card p-4 shadow-card sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">{acikBlok.ad} · daireler</h3>
            <button type="button" onClick={() => setAcik(null)} className="text-sm font-medium text-teal-d hover:underline">
              ← Bloklar
            </button>
          </div>
          <BinaKesiti
            bloklar={[acikBlok]}
            birimler={birimler}
            tipler={tipler}
            mod="emlakci"
            projeId={projeId}
            projeAd={projeAd}
            shareUrlMap={shareUrlMap}
          />
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-gray">Daireleri görmek için bir bloğa tıkla.</p>
      )}
    </div>
  );
}
