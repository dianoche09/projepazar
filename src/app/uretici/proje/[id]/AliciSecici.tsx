"use client";

import { useEffect, useRef, useState } from "react";

type Emlakci = { id: string; ad: string | null; ofis: string | null };

/**
 * Tahsis danışman seçici — ÖLÇEKLENEBİLİR (binlerce emlakçı): tüm listeyi basmak yerine
 * isimle sunucu-arama (top-20). Seçilenler kontrollü state → her biri için hidden input
 * name="emlakci_ids" (form getAll ile alır; submit GARANTİLİ).
 */
export function AliciSecici() {
  const [q, setQ] = useState("");
  const [sonuc, setSonuc] = useState<Emlakci[]>([]);
  const [secili, setSecili] = useState<Emlakci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [acik, setAcik] = useState(false);
  const sarmal = useRef<HTMLDivElement>(null);

  // Debounced arama (250ms). Tüm setState setTimeout içinde → effect gövdesinde senkron setState YOK (lint).
  useEffect(() => {
    const ara = q.trim();
    let iptal = false;
    const t = setTimeout(async () => {
      if (ara.length < 2) {
        if (!iptal) setSonuc([]);
        return;
      }
      if (!iptal) setYukleniyor(true);
      try {
        const r = await fetch(`/api/uretici/emlakci-ara?q=${encodeURIComponent(ara)}`);
        const j = (await r.json()) as { sonuc?: Emlakci[] };
        if (!iptal) setSonuc(j.sonuc ?? []);
      } catch {
        if (!iptal) setSonuc([]);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }, ara.length < 2 ? 0 : 250);
    return () => {
      iptal = true;
      clearTimeout(t);
    };
  }, [q]);

  // Dışarı tıkla → dropdown kapat
  useEffect(() => {
    function disari(e: MouseEvent) {
      if (sarmal.current && !sarmal.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener("mousedown", disari);
    return () => document.removeEventListener("mousedown", disari);
  }, []);

  const ekle = (e: Emlakci) => {
    setSecili((s) => (s.some((x) => x.id === e.id) ? s : [...s, e]));
    setQ("");
    setSonuc([]);
    setAcik(false);
  };
  const cikar = (id: string) => setSecili((s) => s.filter((x) => x.id !== id));
  const seciliIds = new Set(secili.map((s) => s.id));

  return (
    <div className="mt-2.5" ref={sarmal}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Danışmanlar</p>

      {/* Seçili chip'ler + hidden inputs (form bunları gönderir) */}
      {secili.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {secili.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal bg-teal/5 px-2.5 py-1.5 text-[13px] text-ink"
            >
              <input type="hidden" name="emlakci_ids" value={e.id} />
              <span className="font-medium">{e.ad ?? "Danışman"}</span>
              {e.ofis ? <span className="text-[11px] text-gray">· {e.ofis}</span> : null}
              <button
                type="button"
                onClick={() => cikar(e.id)}
                className="ml-0.5 text-gray transition-colors hover:text-red"
                aria-label="Danışmanı kaldır"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Arama kutusu + dropdown */}
      <div className="relative mt-1.5">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAcik(true);
          }}
          onFocus={() => setAcik(true)}
          placeholder="Danışman ara (isimle)…"
          className="w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          autoComplete="off"
        />
        {acik && q.trim().length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-hair bg-card shadow-lg">
            {yukleniyor ? (
              <p className="px-3 py-2 text-[13px] text-gray">Aranıyor…</p>
            ) : sonuc.length === 0 ? (
              <p className="px-3 py-2 text-[13px] text-gray">Sonuç yok</p>
            ) : (
              sonuc.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  disabled={seciliIds.has(e.id)}
                  onClick={() => ekle(e)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-teal/5 disabled:opacity-40"
                >
                  <span className="truncate text-ink">{e.ad ?? "Danışman"}</span>
                  {e.ofis ? <span className="shrink-0 text-[11px] text-gray">{e.ofis}</span> : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-gray">İsimle ara, seç. Birden çok danışman ekleyebilirsin.</p>
    </div>
  );
}
