"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Ofis = { id: string; ad: string };
type Emlakci = { id: string; ad: string | null; ofis: string | null };
type Secenekler = { markalar: string[]; iller: string[]; ilceler: string[] };

const UZMANLIKLAR: [string, string][] = [
  ["", "Tümü"],
  ["konut", "Konut"],
  ["ticari", "Ticari"],
  ["arsa", "Arsa"],
  ["proje", "Proje"],
];

type Modu = "tum_ag" | "segment" | "ofis" | "danisman";
const MODLAR: { v: Modu; ad: string; aciklama: string }[] = [
  { v: "tum_ag", ad: "Tüm ağ", aciklama: "Tüm doğrulanmış danışmanlar" },
  { v: "segment", ad: "Segment (filtre)", aciklama: "Marka / şehir / uzmanlık" },
  { v: "ofis", ad: "Ofis(ler)", aciklama: "Belirli ofisler" },
  { v: "danisman", ad: "Belirli danışman", aciklama: "İsimle ara, seç" },
];

/**
 * Tahsis HEDEFİ — müteahhit segmente açar (isim aramaz): Tüm ağ · Segment(marka/şehir/uzmanlık) · Ofis · Belirli danışman.
 * Segment = canlı (sonradan katılan eşleşen de görür). hedef_modu + f_* / ofis_ids / emlakci_ids gönderir.
 */
export function TahsisHedef({ ofisler, secenekler }: { ofisler: Ofis[]; secenekler: Secenekler }) {
  const [modu, setModu] = useState<Modu>("tum_ag");

  return (
    <div>
      <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-white">1</span>
        Bu projeyi kime açıyorsun?
      </p>
      <p className="mt-1 pl-7 text-[12px] leading-snug text-gray">
        Seçtiğin kişiler bu projeyi <span className="font-medium text-ink">panelinde görür ve müşterisine paylaşır</span>.
        Tahsis etmediğin kimse göremez.
      </p>

      {/* MOD seçici */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODLAR.map((m) => (
          <button
            key={m.v}
            type="button"
            onClick={() => setModu(m.v)}
            className={`rounded-xl border p-2.5 text-left transition-all ${
              modu === m.v ? "border-teal bg-teal/5 shadow-sm" : "border-hair bg-card hover:border-teal/30"
            }`}
          >
            <span className={`block text-[13px] font-bold ${modu === m.v ? "text-teal-d" : "text-ink"}`}>{m.ad}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-gray">{m.aciklama}</span>
          </button>
        ))}
      </div>

      <input type="hidden" name="hedef_modu" value={modu} />

      <div className="mt-3">
        {modu === "tum_ag" ? (
          <p className="rounded-xl border border-hair bg-card px-3 py-2.5 text-[12.5px] text-gray">
            Projeyi <span className="font-medium text-ink">tüm doğrulanmış danışman ağına</span> açıyorsun. En geniş erişim.
          </p>
        ) : null}
        {modu === "segment" ? <SegmentFiltre secenekler={secenekler} /> : null}
        {modu === "ofis" ? <OfisSecimi ofisler={ofisler} /> : null}
        {modu === "danisman" ? <DanismanArama /> : null}
      </div>
    </div>
  );
}

/* ── Segment: marka/şehir/ilçe/uzmanlık + canlı "N danışman" önizleme ── */
function SegmentFiltre({ secenekler }: { secenekler: Secenekler }) {
  const [marka, setMarka] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [uzmanlik, setUzmanlik] = useState("");
  const [sayi, setSayi] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const bos = !marka && !il && !ilce && !uzmanlik;

  useEffect(() => {
    // Tüm setState setTimeout içinde → effect gövdesinde senkron setState YOK (lint kuralı).
    let iptal = false;
    const t = setTimeout(async () => {
      if (bos) {
        if (!iptal) setSayi(null);
        return;
      }
      if (!iptal) setYukleniyor(true);
      try {
        const sp = new URLSearchParams({ sayim: "1" });
        if (marka) sp.set("marka", marka);
        if (il) sp.set("il", il);
        if (ilce) sp.set("ilce", ilce);
        if (uzmanlik) sp.set("uzmanlik", uzmanlik);
        const r = await fetch(`/api/uretici/emlakci-ara?${sp.toString()}`);
        const j = (await r.json()) as { toplam?: number };
        if (!iptal) setSayi(j.toplam ?? 0);
      } catch {
        if (!iptal) setSayi(null);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }, bos ? 0 : 250);
    return () => {
      iptal = true;
      clearTimeout(t);
    };
  }, [marka, il, ilce, uzmanlik, bos]);

  const sel = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

  return (
    <div className="space-y-2.5 rounded-xl border border-hair bg-card p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Drop ad="Marka" deger={marka} setir={setMarka} secenekler={secenekler.markalar} className={sel} />
        <Drop ad="Şehir" deger={il} setir={setIl} secenekler={secenekler.iller} className={sel} />
        <Drop ad="İlçe" deger={ilce} setir={setIlce} secenekler={secenekler.ilceler} className={sel} />
        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
          Uzmanlık
          <select value={uzmanlik} onChange={(e) => setUzmanlik(e.target.value)} className={sel}>
            {UZMANLIKLAR.map(([v, a]) => (
              <option key={v} value={v}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      {/* segment filtre değerleri → forma */}
      <input type="hidden" name="f_marka" value={marka} />
      <input type="hidden" name="f_il" value={il} />
      <input type="hidden" name="f_ilce" value={ilce} />
      <input type="hidden" name="f_uzmanlik" value={uzmanlik} />

      <p className="text-[12px] text-gray">
        {bos ? (
          <span>En az bir filtre seç — boş bırakılan boyut sınırsız (ör. yalnız &quot;Marka: RE/MAX&quot; → tüm RE/MAX danışmanları).</span>
        ) : yukleniyor ? (
          <span>Hesaplanıyor…</span>
        ) : (
          <span>
            Bu segment <span className="font-bold text-teal-d">{sayi ?? 0} danışmana</span> açılacak. Sonradan eşleşen
            danışman da otomatik görür (canlı segment).
          </span>
        )}
      </p>
    </div>
  );
}

function Drop({
  ad,
  deger,
  setir,
  secenekler,
  className,
}: {
  ad: string;
  deger: string;
  setir: (v: string) => void;
  secenekler: string[];
  className: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
      {ad}
      <select value={deger} onChange={(e) => setir(e.target.value)} className={className}>
        <option value="">Tümü</option>
        {secenekler.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </label>
  );
}

/* ── Ofis çoklu seçim ── */
function OfisSecimi({ ofisler }: { ofisler: Ofis[] }) {
  if (!ofisler.length) return <p className="text-[12px] text-gray">Tanımlı ofis yok.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ofisler.map((o) => (
        <label key={o.id} className="cursor-pointer">
          <input type="checkbox" name="ofis_ids" value={o.id} className="peer sr-only" />
          <span className="inline-block rounded-lg border border-hair bg-card px-2.5 py-1.5 text-[13px] text-ink transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-hover:border-teal">
            {o.ad}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ── Belirli danışman: isimle ara (filtreli), seçilenler chip + hidden input ── */
function DanismanArama() {
  const [q, setQ] = useState("");
  const [sonuc, setSonuc] = useState<Emlakci[]>([]);
  const [secili, setSecili] = useState<Emlakci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [acik, setAcik] = useState(false);
  const sarmal = useRef<HTMLDivElement>(null);

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
  const seciliIds = useMemo(() => new Set(secili.map((s) => s.id)), [secili]);

  return (
    <div ref={sarmal}>
      {secili.length ? (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {secili.map((e) => (
            <span key={e.id} className="inline-flex items-center gap-1.5 rounded-lg border border-teal bg-teal/5 px-2.5 py-1.5 text-[13px] text-ink">
              <input type="hidden" name="emlakci_ids" value={e.id} />
              <span className="font-medium">{e.ad ?? "Danışman"}</span>
              {e.ofis ? <span className="text-[11px] text-gray">· {e.ofis}</span> : null}
              <button type="button" onClick={() => cikar(e.id)} className="ml-0.5 text-gray transition-colors hover:text-red" aria-label="Kaldır">✕</button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="relative">
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
