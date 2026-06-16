"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { tahsisEkle } from "@/app/uretici/actions";

const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

function Ekle() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="justify-self-start rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
    >
      {pending ? "Ekleniyor…" : "Tahsis ekle"}
    </button>
  );
}

export function TahsisForm({
  projeId,
  bloklar,
  ofisler,
}: {
  projeId: string;
  bloklar: { id: string; ad: string | null }[];
  ofisler: { id: string; ad: string }[];
}) {
  const [hedef, setHedef] = useState<"herkes" | "ofis">("herkes");
  const [komisyon, setKomisyon] = useState<"yuzde" | "sabit" | "yok">("yuzde");

  return (
    <form action={tahsisEkle} className="grid gap-3 rounded-2xl border border-dashed border-hair bg-card/50 p-4">
      <input type="hidden" name="proje_id" value={projeId} />

      <div>
        <p className="text-xs font-medium text-gray">Kime</p>
        <div className="mt-1 flex gap-2">
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
      </div>

      {hedef === "ofis" ? (
        <label className="flex flex-col gap-1 text-xs text-gray">
          Ofis
          <select name="hedef_id" className={inp}>
            <option value="">— ofis seç —</option>
            {ofisler.map((o) => (
              <option key={o.id} value={o.id}>
                {o.ad}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {bloklar.length ? (
        <div>
          <p className="text-xs font-medium text-gray">Kapsam — bloklar (boş = tüm proje)</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {bloklar.map((b) => (
              <label key={b.id} className="flex items-center gap-1.5 rounded-lg border border-hair px-2.5 py-1 text-sm text-ink">
                <input type="checkbox" name="bloklar" value={b.id} className="size-4" />
                {b.ad ?? "Blok"}
              </label>
            ))}
          </div>
        </div>
      ) : null}

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
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 pb-1 text-sm text-ink">
          <input type="checkbox" name="munhasir" className="size-4" /> Münhasır
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray">
          Kontenjan
          <input name="kontenjan" type="number" min={1} placeholder="sınırsız" className={`${inp} w-24`} />
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm text-ink">
          <input type="checkbox" name="fiyat_gorunur" defaultChecked className="size-4" /> Fiyat görünür
        </label>
      </div>

      <Ekle />
    </form>
  );
}
