"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BinaKesiti, type BinaBirim } from "@/components/BinaKesiti";
import { DaireModal, type ModalBirim } from "@/components/DaireModal";
import type { BirimDurum } from "@/lib/types";

type Blok = { id: string; ad: string | null; kat_sayisi: number | null };
type Tip = { id: string; ad: string | null; oda: string | null; taban_fiyat?: number | null; plan_url?: string | null };

function fiyatKisa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}B`;
  return n.toLocaleString("tr-TR");
}

const DURUM_FILTRE = [
  ["", "Tümü"],
  ["musait", "Müsait"],
  ["opsiyonlu", "Opsiyon"],
  ["satildi", "Satıldı"],
] as const;

/** Durum → liste noktası rengi + kısa etiket. */
function durumGorsel(d: string): { dot: string; etiket: string; renk: string } {
  if (d === "musait") return { dot: "bg-green", etiket: "Müsait", renk: "text-green" };
  if (d === "opsiyonlu" || d === "satis_beklemede") return { dot: "bg-amber", etiket: "Opsiyon", renk: "text-amber" };
  if (d === "satildi") return { dot: "bg-red", etiket: "Satıldı", renk: "text-red" };
  return { dot: "bg-gray", etiket: "—", renk: "text-gray" };
}
const norm = (d: string) => (d === "satis_beklemede" ? "opsiyonlu" : d);

/**
 * Emlakçı proje stoğu — HİBRİT: blok sekmeleri + kompakt bina KESİTİ (oryantasyon) ÜSTTE,
 * durum/tip FİLTRELİ daire LİSTESİ altta (satır → DaireModal). Mobil-önce.
 * Supabase Realtime ile canlı (üretici fiyat/durum değişince anında yansır).
 */
export function EmlakciStok({
  projeId,
  projeAd,
  bloklar,
  tipler,
  baslangic,
  shareUrlMap,
  benimOpsiyonlar,
}: {
  projeId: string;
  projeAd: string;
  bloklar: Blok[];
  tipler: Tip[];
  baslangic: BinaBirim[];
  shareUrlMap: Record<string, string>;
  /** Bu emlakçıya ait opsiyonlu birim id'leri (bırak butonu için). */
  benimOpsiyonlar?: string[];
}) {
  const [birimler, setBirimler] = useState<BinaBirim[]>(baslangic);
  const [canli, setCanli] = useState(false);
  const [aktifBlok, setAktifBlok] = useState<string | null>(bloklar[0]?.id ?? null);
  const [durumF, setDurumF] = useState<string>("");
  const [tipF, setTipF] = useState<string>("");
  const [secili, setSecili] = useState<ModalBirim | null>(null);

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

  const tipMap = useMemo(() => new Map(tipler.map((t) => [t.id, t])), [tipler]);

  const genel = {
    toplam: birimler.length,
    musait: birimler.filter((b) => b.durum === "musait").length,
    opsiyon: birimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length,
    satildi: birimler.filter((b) => b.durum === "satildi").length,
  };

  const aktifBlokObj = bloklar.find((b) => b.id === aktifBlok) ?? null;
  // Bu blokta gerçekten var olan daire tipleri (filtre dropdown'u için)
  const blokBirimleri = birimler.filter((b) => b.blok_id === aktifBlok);
  const blokTipIds = new Set(blokBirimleri.map((b) => b.tip_id).filter(Boolean) as string[]);

  const filtreli = blokBirimleri
    .filter((b) => !durumF || norm(b.durum) === durumF)
    .filter((b) => !tipF || b.tip_id === tipF)
    .sort((a, b) => (b.kat ?? 0) - (a.kat ?? 0) || (a.daire_no ?? "").localeCompare(b.daire_no ?? ""));

  const toModal = (b: BinaBirim): ModalBirim => {
    const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
    return {
      id: b.id,
      daire_no: b.daire_no,
      kat: b.kat,
      durum: b.durum as BirimDurum,
      satilabilir: b.satilabilir,
      liste_fiyati: b.liste_fiyati,
      para_birimi: b.para_birimi,
      net_m2: b.net_m2,
      brut_m2: b.brut_m2,
      yon: b.yon,
      manzara: b.manzara,
      durum_notu: b.durum_notu,
      son_guncelleme: b.son_guncelleme,
      serefiye: b.serefiye as { kat?: number; manzara?: number } | null,
      taban_fiyat: tip?.taban_fiyat ?? null,
      tip_ad: tip?.ad ?? null,
      oda: tip?.oda ?? null,
      plan_url: tip?.plan_url ?? null,
      odeme_plani: b.odeme_plani as {
        pesinat_pct?: number | null;
        taksit_sayisi?: number | null;
        vade_farki_pct?: number | null;
        ara_odemeler?: { ay: number; pct: number }[] | null;
      } | null,
    };
  };

  const cip = (aktif: boolean) =>
    `rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
      aktif ? "border-teal bg-teal text-white shadow-sm" : "border-hair bg-card text-ink-soft hover:border-teal/30 hover:bg-soft"
    }`;

  return (
    <div>
      {/* Proje geneli stat şeridi */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([
          ["Toplam", genel.toplam, "bg-ink"],
          ["Müsait", genel.musait, "bg-green"],
          ["Opsiyon", genel.opsiyon, "bg-amber"],
          ["Satıldı", genel.satildi, "bg-red"],
        ] as [string, number, string][]).map(([et, sy, dot]) => (
          <div key={et} className="rounded-xl border border-hair bg-card p-3.5">
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${dot}`} />
              <span className="text-[11px] uppercase tracking-wide text-gray">{et}</span>
            </div>
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-ink">{sy}</p>
          </div>
        ))}
      </div>

      {/* Blok sekmeleri (mobil: yatay kaydır) + canlı rozet */}
      <div className="mt-5 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
          {bloklar.map((blok) => {
            const m = birimler.filter((b) => b.blok_id === blok.id && b.durum === "musait").length;
            return (
              <button key={blok.id} type="button" onClick={() => setAktifBlok(blok.id)} className={`${cip(aktifBlok === blok.id)} flex-none whitespace-nowrap`}>
                {blok.ad} Blok
                <span className={`ml-1.5 font-mono text-[11px] ${aktifBlok === blok.id ? "text-white/80" : "text-green"}`}>{m}</span>
              </button>
            );
          })}
        </div>
        <span className="inline-flex flex-none items-center gap-1.5 font-mono text-[11px] text-gray">
          <span className={`size-2 rounded-full ${canli ? "nabiz bg-green" : "bg-amber"}`} />
          {canli ? "canlı" : "…"}
        </span>
      </div>

      {/* KESİT — aktif blok (oryantasyon) */}
      {aktifBlokObj ? (
        <div className="mt-3">
          <BinaKesiti
            bloklar={[aktifBlokObj]}
            birimler={birimler}
            tipler={tipler}
            mod="emlakci"
            projeId={projeId}
            projeAd={projeAd}
            shareUrlMap={shareUrlMap}
            benimOpsiyonlar={benimOpsiyonlar}
          />
        </div>
      ) : null}

      {/* FİLTRE çubuğu */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {DURUM_FILTRE.map(([v, et]) => (
          <button key={v} type="button" onClick={() => setDurumF(v)} className={cip(durumF === v)}>
            {et}
          </button>
        ))}
        <select
          value={tipF}
          onChange={(e) => setTipF(e.target.value)}
          className="ml-auto rounded-xl border border-hair bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink outline-none focus:border-teal"
        >
          <option value="">Tüm tipler</option>
          {tipler
            .filter((t) => blokTipIds.has(t.id))
            .map((t) => (
              <option key={t.id} value={t.id}>{t.oda ?? t.ad ?? "Tip"}</option>
            ))}
        </select>
      </div>

      {/* FİLTRELİ LİSTE — satır → DaireModal */}
      <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card shadow-card">
        {filtreli.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray">Bu filtreyle daire yok.</p>
        ) : (
          filtreli.map((b) => {
            const g = durumGorsel(b.durum);
            const tip = b.tip_id ? tipMap.get(b.tip_id) : null;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSecili(toModal(b))}
                className="flex w-full items-center gap-3 border-b border-hair px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-soft"
              >
                <span className={`size-2 flex-none rounded-full ${g.dot}`} />
                <span className="mono w-14 flex-none font-semibold text-ink">{b.daire_no ?? "—"}</span>
                <span className="flex-1 truncate text-[12.5px] text-ink-soft">
                  {tip?.oda ?? tip?.ad ?? "—"}
                  {b.kat != null ? ` · K${b.kat}` : ""}
                  {b.net_m2 ? ` · ${b.net_m2}m²` : ""}
                  {b.yon ? ` · ${b.yon}` : ""}
                </span>
                <span className="mono flex-none text-[12.5px] font-semibold text-ink">
                  {b.liste_fiyati ? `${fiyatKisa(Number(b.liste_fiyati))} ₺` : "—"}
                </span>
                <span className={`hidden flex-none text-[11px] font-bold sm:inline ${g.renk}`}>{g.etiket}</span>
              </button>
            );
          })
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-gray">
        {filtreli.length} daire · satıra dokun → detay, paylaşım, opsiyon talebi
      </p>

      {secili ? (
        <DaireModal
          birim={secili}
          projeId={projeId}
          mod="emlakci"
          projeAd={projeAd}
          shareUrl={shareUrlMap[secili.id] ?? ""}
          benimOpsiyon={benimOpsiyonlar?.includes(secili.id) ?? false}
          onKapat={() => setSecili(null)}
        />
      ) : null}
    </div>
  );
}
