"use client";

import { useState } from "react";
import { tahsisEkle } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

const TURLER: [string, string][] = [
  ["daire", "Daire"],
  ["dukkan", "Dükkan"],
  ["ofis", "Ofis"],
  ["villa", "Villa"],
  ["depo", "Depo"],
  ["otopark", "Otopark"],
];

/** Çoklu-seçim çip (checkbox + peer styling — form getAll ile gönderir). */
function Cip({ name, value, etiket }: { name: string; value: string; etiket: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} className="peer sr-only" />
      <span className="inline-block rounded-lg border border-hair bg-card px-2.5 py-1.5 text-[13px] text-ink transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-hover:border-teal">
        {etiket}
      </span>
    </label>
  );
}

function Bolum({ baslik, ipucu, children }: { baslik: string; ipucu?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink">
        {baslik}
        {ipucu ? <span className="ml-1 font-normal text-gray">{ipucu}</span> : null}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function TahsisForm({
  projeId,
  bloklar,
  katlar,
  tipler,
  ofisler,
  geriYol,
}: {
  projeId: string;
  bloklar: { id: string; ad: string | null }[];
  katlar: number[];
  tipler: { id: string; ad: string | null; oda: string | null }[];
  ofisler: { id: string; ad: string }[];
  /** Wizard akışı: doluysa tahsis sonrası bu yola döner (yoksa proje ekranına). */
  geriYol?: string;
}) {
  const [hedef, setHedef] = useState<"herkes" | "ofis">("herkes");
  const [komisyon, setKomisyon] = useState<"yuzde" | "sabit" | "yok">("yuzde");
  const [munhasir, setMunhasir] = useState(false);

  return (
    <form action={tahsisEkle} className="grid gap-4 rounded-2xl border border-dashed border-hair bg-card/50 p-4">
      <input type="hidden" name="proje_id" value={projeId} />
      {geriYol ? <input type="hidden" name="geri_yol" value={geriYol} /> : null}

      {/* HEDEF */}
      <div>
        <p className="text-xs font-semibold text-ink">Kime</p>
        <div className="mt-1.5 flex gap-2">
          {(["herkes", "ofis"] as const).map((h) => (
            <label
              key={h}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                hedef === h ? "border-teal bg-teal/5 text-ink" : "border-hair text-gray"
              }`}
            >
              <input type="radio" name="hedef_tip" value={h} checked={hedef === h} onChange={() => setHedef(h)} className="sr-only" />
              {h === "herkes" ? "Herkese açık" : "Yalnız seçili ofis"}
            </label>
          ))}
        </div>
        {hedef === "ofis" ? (
          <select name="hedef_id" className={`${inp} mt-2 w-full`}>
            <option value="">— ofis seç —</option>
            {ofisler.map((o) => (
              <option key={o.id} value={o.id}>{o.ad}</option>
            ))}
          </select>
        ) : null}
      </div>

      {/* KAPSAM — blok × kat × tip × tür */}
      <div className="space-y-3 rounded-xl border border-hair bg-card p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Kapsam — boş bırakılan = tümü</p>
        {bloklar.length ? (
          <Bolum baslik="Bloklar">
            {bloklar.map((b) => <Cip key={b.id} name="bloklar" value={b.id} etiket={b.ad ?? "Blok"} />)}
          </Bolum>
        ) : null}
        {katlar.length ? (
          <Bolum baslik="Katlar">
            {katlar.map((k) => <Cip key={k} name="katlar" value={String(k)} etiket={`${k}. kat`} />)}
          </Bolum>
        ) : null}
        {tipler.length ? (
          <Bolum baslik="Daire tipleri">
            {tipler.map((t) => <Cip key={t.id} name="tipler" value={t.id} etiket={t.oda ?? t.ad ?? "Tip"} />)}
          </Bolum>
        ) : null}
        <Bolum baslik="Birim türleri">
          {TURLER.map(([v, et]) => <Cip key={v} name="turler" value={v} etiket={et} />)}
        </Bolum>
      </div>

      {/* ŞARTLAR */}
      <div className="space-y-3 rounded-xl border border-hair bg-card p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Şartlar</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-gray">
            Komisyon
            <select
              name="komisyon_tip"
              value={komisyon}
              onChange={(e) => setKomisyon(e.target.value as "yuzde" | "sabit" | "yok")}
              className={inp}
            >
              <option value="yuzde">% Yüzde</option>
              <option value="sabit">Sabit ₺</option>
              <option value="yok">Yok</option>
            </select>
          </label>
          {komisyon !== "yok" ? (
            <label className="flex flex-col gap-1 text-xs text-gray">
              {komisyon === "yuzde" ? "Yüzde (%)" : "Tutar (₺)"}
              <input name="komisyon_deger" type="number" min={0} step={komisyon === "yuzde" ? 0.5 : 1000} className={`${inp} w-28`} />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-xs text-gray">
            Kontenjan <span className="font-normal">(birim)</span>
            <input name="kontenjan" type="number" min={1} placeholder="sınırsız" className={`${inp} w-28`} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 pb-1 text-sm text-ink">
            <input type="checkbox" name="munhasir" checked={munhasir} onChange={(e) => setMunhasir(e.target.checked)} className="size-4" />
            Münhasır
          </label>
          {munhasir ? (
            <label className="flex flex-col gap-1 text-xs text-gray">
              Süre (gün)
              <input name="munhasir_sure" type="number" min={1} placeholder="30" className={`${inp} w-24`} />
            </label>
          ) : null}
          <label className="flex items-center gap-2 pb-1 text-sm text-ink">
            <input type="checkbox" name="fiyat_gorunur" defaultChecked className="size-4" /> Fiyat görünür
          </label>
        </div>
      </div>

      <SubmitButton className="justify-self-start">Tahsis ekle</SubmitButton>
    </form>
  );
}
