"use client";

import { useState } from "react";
import { birimGenerator } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inpCls =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";
const lblCls = "flex flex-col gap-1 text-xs text-gray";

const YONLER = ["", "Kuzey", "Güney", "Doğu", "Batı", "Kuzeydoğu", "Kuzeybatı", "Güneydoğu", "Güneybatı"];
const TURLER: [string, string][] = [
  ["daire", "Daire"],
  ["ofis", "Ofis"],
  ["dukkan", "Dükkan"],
  ["villa", "Villa"],
  ["depo", "Depo"],
  ["otopark", "Otopark"],
];

type Blok = { id: string; ad: string | null; kat_sayisi: number | null };
type Tip = { id: string; ad: string | null; oda: string | null };

/**
 * Toplu birim üretici. Blok seçilince kat aralığı bloğun kat_sayisi'nden OTOMATIK dolar
 * (blok→kat). Canlı önizleme kaç birim üretileceğini gösterir. Aynı daire_no atlanır (server).
 */
export function GeneratorForm({
  projeId,
  bloklar,
  tipler,
}: {
  projeId: string;
  bloklar: Blok[];
  tipler: Tip[];
}) {
  const [blokId, setBlokId] = useState(bloklar[0]?.id ?? "");
  const [katBas, setKatBas] = useState(1);
  const [katSon, setKatSon] = useState(bloklar[0]?.kat_sayisi ?? 10);
  const [dairePerKat, setDairePerKat] = useState(2);

  function blokSecildi(id: string) {
    setBlokId(id);
    const blok = bloklar.find((b) => b.id === id);
    if (blok?.kat_sayisi && blok.kat_sayisi > 0) {
      setKatBas(1);
      setKatSon(blok.kat_sayisi);
    }
  }

  const adet = Math.max(0, (katSon - katBas + 1) * Math.max(1, dairePerKat));
  const gecerli = !!blokId && katSon >= katBas && adet > 0 && adet <= 500;

  return (
    <form action={birimGenerator} className="mt-3 grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="proje_id" value={projeId} />

      <label className={lblCls}>
        Blok
        <select
          name="blok_id"
          required
          value={blokId}
          onChange={(e) => blokSecildi(e.target.value)}
          className={inpCls}
        >
          {bloklar.map((b) => (
            <option key={b.id} value={b.id}>
              {b.ad}
              {b.kat_sayisi ? ` (${b.kat_sayisi} kat)` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className={lblCls}>
        Daire tipi
        <select name="tip_id" required className={inpCls}>
          {tipler.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ad}
              {t.oda ? ` · ${t.oda}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className={lblCls}>
        Daire / kat
        <input
          name="daire_basina"
          type="number"
          min={1}
          value={dairePerKat}
          onChange={(e) => setDairePerKat(Number(e.target.value) || 1)}
          className={inpCls}
        />
      </label>

      <label className={lblCls}>
        Başlangıç kat
        <input
          name="kat_bas"
          type="number"
          value={katBas}
          onChange={(e) => setKatBas(Number(e.target.value))}
          className={inpCls}
        />
      </label>

      <label className={lblCls}>
        Bitiş kat
        <input
          name="kat_son"
          type="number"
          value={katSon}
          onChange={(e) => setKatSon(Number(e.target.value))}
          className={inpCls}
        />
      </label>

      <label className={lblCls}>
        Yön (opsiyonel)
        <select name="yon" className={inpCls} defaultValue="">
          {YONLER.map((y) => (
            <option key={y} value={y}>
              {y || "—"}
            </option>
          ))}
        </select>
      </label>

      <label className={lblCls}>
        Tür
        <select name="tur" className={inpCls} defaultValue="daire">
          {TURLER.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className={lblCls}>
        Taban fiyat ₺
        <input name="taban_fiyat" type="number" placeholder="ör. 2800000" className={inpCls} />
      </label>

      <label className={lblCls}>
        Kat şerefiyesi %
        <input name="kat_artis" type="number" defaultValue={2} className={inpCls} />
      </label>

      <div className="flex flex-col gap-2 sm:col-span-3">
        <p className="text-sm">
          {gecerli ? (
            <span className="font-medium text-teal-d">≈ {adet} birim üretilecek</span>
          ) : adet > 500 ? (
            <span className="font-medium text-red">{adet} birim — tek seferde en fazla 500.</span>
          ) : (
            <span className="text-gray">Kat aralığını ve daire/kat sayısını gir.</span>
          )}
        </p>
        <SubmitButton disabled={!gecerli}>Birimleri üret</SubmitButton>
      </div>
    </form>
  );
}
