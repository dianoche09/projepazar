"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { kova, DURUM_AD, DURUM_SINIF, paraKisa, tazelik, type DurumKova } from "@/lib/stok";
import { DaireModal, type ModalBirim } from "@/components/DaireModal";
import type { BirimDurum } from "@/lib/types";

export type StokSatir = {
  id: string;
  proje_id: string;
  proje_ad: string;
  blok_ad: string | null;
  kat: number | null;
  daire_no: string | null;
  tip_ad: string | null;
  net_m2: number | null;
  brut_m2: number | null;
  liste_fiyati: number | null;
  kira_bedeli: number | null;
  para_birimi: string | null;
  durum: string;
  son_guncelleme: string | null;
  // DaireModal künyesi (üretici modu — "Yönet" popup)
  satilabilir: boolean;
  yon: string | null;
  manzara: string | null;
  serefiye: { kat?: number; manzara?: number } | null;
  odeme_plani: {
    pesinat_pct?: number | null;
    taksit_sayisi?: number | null;
    vade_farki_pct?: number | null;
    ara_odemeler?: { ay: number; pct: number }[] | null;
  } | null;
  durum_notu: string | null;
  taban_fiyat: number | null;
  tip_tam_ad: string | null;
  oda: string | null;
  plan_url: string | null;
  tur: string | null;
  ana_birim_id: string | null;
};

/** Stok satırını DaireModal'ın beklediği künyeye çevirir (üretici modu). */
function satirToModalBirim(s: StokSatir): ModalBirim {
  return {
    id: s.id,
    daire_no: s.daire_no,
    kat: s.kat,
    tur: s.tur ?? "daire",
    durum: s.durum as BirimDurum,
    satilabilir: s.satilabilir,
    liste_fiyati: s.liste_fiyati,
    para_birimi: s.para_birimi ?? "TRY",
    net_m2: s.net_m2,
    brut_m2: s.brut_m2,
    yon: s.yon,
    manzara: s.manzara,
    durum_notu: s.durum_notu,
    son_guncelleme: s.son_guncelleme ?? new Date().toISOString(),
    serefiye: s.serefiye,
    taban_fiyat: s.taban_fiyat,
    tip_ad: s.tip_tam_ad ?? s.tip_ad,
    oda: s.oda,
    plan_url: s.plan_url,
    odeme_plani: s.odeme_plani,
  };
}

type ProjeFiltre = { id: string; ad: string };

const DURUM_FILTRELER: { anahtar: DurumKova | "tumu"; etiket: string; nokta?: string }[] = [
  { anahtar: "tumu", etiket: "Tüm durum" },
  { anahtar: "musait", etiket: "Müsait", nokta: "bg-green" },
  { anahtar: "opsiyon", etiket: "Opsiyon", nokta: "bg-amber" },
  { anahtar: "satildi", etiket: "Satıldı", nokta: "bg-red" },
];

const SATIR_ZEMIN: Record<DurumKova, string | undefined> = {
  musait: undefined,
  opsiyon: "rgba(227,161,44,.045)",
  satildi: "rgba(209,90,78,.035)",
  diger: undefined,
};

export function StokTablo({
  satirlar,
  projeler,
  kiraVar,
  baslangicDurum = "tumu",
}: {
  satirlar: StokSatir[];
  projeler: ProjeFiltre[];
  kiraVar: boolean;
  baslangicDurum?: DurumKova | "tumu";
}) {
  const router = useRouter();
  const [projeId, setProjeId] = useState<string>("tumu");
  const [durum, setDurum] = useState<DurumKova | "tumu">(baslangicDurum);
  // "Yönet" → açık daire modalı (satır + projesi). null = kapalı.
  const [acikSatir, setAcikSatir] = useState<StokSatir | null>(null);

  const gosterilen = useMemo(() => {
    return satirlar.filter((s) => {
      if (s.ana_birim_id != null) return false; // eklentiler tabloda standalone satır olmaz (parent modalında)
      if (projeId !== "tumu" && s.proje_id !== projeId) return false;
      if (durum !== "tumu" && kova(s.durum) !== durum) return false;
      return true;
    });
  }, [satirlar, projeId, durum]);

  // sayfalama — 30 satır/sayfa
  const SAYFA_BOYUT = 30;
  const [sayfa, setSayfa] = useState(1);
  const projeSec = (id: string) => {
    setProjeId(id);
    setSayfa(1);
  };
  const durumSec = (d: DurumKova | "tumu") => {
    setDurum(d);
    setSayfa(1);
  };
  const toplamSayfa = Math.max(1, Math.ceil(gosterilen.length / SAYFA_BOYUT));
  const aktifSayfa = Math.min(sayfa, toplamSayfa);
  const sayfada = gosterilen.slice((aktifSayfa - 1) * SAYFA_BOYUT, aktifSayfa * SAYFA_BOYUT);

  return (
    <>
      {/* filtre çipleri */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Proje
        </span>
        <button
          type="button"
          onClick={() => projeSec("tumu")}
          className={`chip h-8 px-3 text-[12px] ${projeId === "tumu" ? "bg-navy text-white" : ""}`}
        >
          Tümü
        </button>
        {projeler.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => projeSec(p.id)}
            className={`chip h-8 px-3 text-[12px] ${projeId === p.id ? "bg-navy text-white" : ""}`}
          >
            {p.ad}
          </button>
        ))}

        <span className="mx-1.5 h-5 w-px bg-[var(--cizgi-2)]" />

        {DURUM_FILTRELER.map((f) => (
          <button
            key={f.anahtar}
            type="button"
            onClick={() => durumSec(f.anahtar)}
            className={`chip h-8 px-3 text-[12px] ${durum === f.anahtar ? "bg-navy text-white" : ""}`}
          >
            {f.nokta ? <span className={`size-[7px] rounded-full ${f.nokta}`} /> : null}
            {f.etiket}
          </button>
        ))}

        <span className="ml-auto mono text-[12px] text-[var(--ink-faint)]">
          {gosterilen.length} / {satirlar.length} birim
        </span>
      </div>

      {/* tablo */}
      <div className="kart belir belir-2 overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 680, overflowY: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Proje</th>
                <th>Blok</th>
                <th>Kat</th>
                <th>No</th>
                <th>Tip</th>
                <th className="text-right">Net m²</th>
                <th className="text-right">Brüt m²</th>
                <th className="text-right">Fiyat</th>
                {kiraVar ? <th className="text-right">Kira</th> : null}
                <th>Durum</th>
                <th>Son Güncelleme</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sayfada.map((s) => {
                const k = kova(s.durum);
                const t = tazelik(s.son_guncelleme);
                return (
                  <tr key={s.id} style={SATIR_ZEMIN[k] ? { background: SATIR_ZEMIN[k] } : undefined}>
                    <td>
                      <span className="text-[12px] text-ink-soft">{s.proje_ad}</span>
                    </td>
                    <td className="mono font-medium">{s.blok_ad ?? "—"}</td>
                    <td className="mono">{s.kat ?? "—"}</td>
                    <td className="mono">{s.daire_no ?? "—"}</td>
                    <td>{s.tip_ad ?? "—"}</td>
                    <td className="mono text-right">{s.net_m2 != null ? s.net_m2 : "—"}</td>
                    <td className="mono text-right">{s.brut_m2 != null ? s.brut_m2 : "—"}</td>
                    <td
                      className="mono text-right font-semibold"
                      style={k === "satildi" ? { color: "var(--ink-faint)" } : undefined}
                    >
                      {s.liste_fiyati ? paraKisa(s.liste_fiyati, s.para_birimi) : "—"}
                    </td>
                    {kiraVar ? (
                      <td className="mono text-right text-ink-soft">
                        {s.kira_bedeli ? paraKisa(s.kira_bedeli, s.para_birimi) : "—"}
                      </td>
                    ) : null}
                    <td>
                      <span className={`durum ${DURUM_SINIF[k]}`}>
                        <span className="nokta" />
                        {DURUM_AD[k]}
                      </span>
                    </td>
                    <td>
                      <span className={`taze ${t.sinif}`}>
                        <span className="nokta" />
                        <span className="mono">{t.metin}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setAcikSatir(s)}
                        className="btn-action h-auto min-h-0 px-2.5 py-[5px] text-[11px]"
                      >
                        Yönet
                      </button>
                    </td>
                  </tr>
                );
              })}
              {gosterilen.length === 0 ? (
                <tr>
                  <td colSpan={kiraVar ? 12 : 11} className="py-10 text-center text-sm text-[var(--ink-faint)]">
                    {satirlar.length === 0
                      ? "Henüz birim yok — proje kurulumundan üret."
                      : "Bu filtreyle birim yok."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {toplamSayfa > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSayfa((s) => Math.max(1, s - 1))}
            disabled={aktifSayfa <= 1}
            className="btn-ghost h-9 min-h-0 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹ Önceki
          </button>
          <span className="mono text-[13px] text-ink-soft">
            Sayfa {aktifSayfa} / {toplamSayfa}
          </span>
          <button
            type="button"
            onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))}
            disabled={aktifSayfa >= toplamSayfa}
            className="btn-ghost h-9 min-h-0 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sonraki ›
          </button>
        </div>
      ) : null}

      {/* "Yönet" → ilgili dairenin DaireModal'ı (üretici modu): durum/not + bilgi düzenle.
          Tüm bloklara/proje sayfasına gitmeden, doğrudan bu daire yönetilir. */}
      {acikSatir ? (
        <DaireModal
          birim={satirToModalBirim(acikSatir)}
          projeId={acikSatir.proje_id}
          mod="uretici"
          projeAd={acikSatir.proje_ad}
          eklentiler={satirlar
            .filter((e) => e.ana_birim_id === acikSatir.id)
            .map((e) => ({
              id: e.id,
              tur: e.tur ?? "depo",
              daire_no: e.daire_no,
              liste_fiyati: e.liste_fiyati,
              para_birimi: e.para_birimi ?? "TRY",
            }))}
          onKapat={() => {
            setAcikSatir(null);
            // Güncellenen durum/fiyat canlı stok tablosuna yansısın (server action revalidate'i tamamlar).
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
