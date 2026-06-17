"use client";

import { createContext, useContext, useState } from "react";
import { birimTopluGuncelle, birimTopluSil } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DURUM_ETIKET, type BirimDurum } from "@/lib/types";

type SecimCtx = {
  secimModu: boolean;
  secili: Set<string>;
  toggle: (id: string) => void;
};

const Ctx = createContext<SecimCtx | null>(null);

/** BirimHucre bunu okur. Provider yoksa (emlakçı) null → normal modal davranışı. */
export function useSecim(): SecimCtx | null {
  return useContext(Ctx);
}

const inpCls =
  "rounded-lg border border-hair bg-paper px-2.5 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";
const DURUMLAR: BirimDurum[] = ["musait", "opsiyonlu", "satis_beklemede", "satildi", "stop"];

/**
 * Üretici ızgarasının çevresine sarılır: "Toplu düzenle" moduna geçince dairelere
 * tıklamak modal yerine SEÇER; altta sticky toplu işlem barı (durum/fiyat/sil) çıkar.
 */
export function SecimDuzenle({ projeId, children }: { projeId: string; children: React.ReactNode }) {
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSecili((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const temizle = () => setSecili(new Set());
  const idler = [...secili].join(",");

  return (
    <Ctx.Provider value={{ secimModu, secili, toggle }}>
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSecimModu((m) => !m);
            temizle();
          }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            secimModu ? "border-teal bg-teal text-white" : "border-hair bg-card text-navy hover:border-navy"
          }`}
        >
          {secimModu ? "✓ Seçim modu açık" : "Toplu düzenle"}
        </button>
        {secimModu ? (
          <span className="text-xs text-gray">Dairelere tıklayarak seç · {secili.size} seçili</span>
        ) : null}
      </div>

      {children}

      {secimModu && secili.size > 0 ? (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-hair bg-card/95 p-3 shadow-cardlg backdrop-blur">
          <span className="rounded-full bg-teal/10 px-2.5 py-1 text-sm font-semibold text-teal-d">
            {secili.size} seçili
          </span>
          <form action={birimTopluGuncelle} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="proje_id" value={projeId} />
            <input type="hidden" name="birim_idler" value={idler} />
            <select name="durum" defaultValue="" className={inpCls}>
              <option value="">durum…</option>
              {DURUMLAR.map((d) => (
                <option key={d} value={d}>
                  {DURUM_ETIKET[d]}
                </option>
              ))}
            </select>
            <input name="liste_fiyati" type="number" placeholder="fiyat ₺" className={`${inpCls} w-28`} />
            <SubmitButton varyant="teal">Uygula</SubmitButton>
          </form>
          <form action={birimTopluSil}>
            <input type="hidden" name="proje_id" value={projeId} />
            <input type="hidden" name="birim_idler" value={idler} />
            <SubmitButton varyant="outline" className="!border-red/40 !text-red">
              Sil
            </SubmitButton>
          </form>
          <button
            type="button"
            onClick={temizle}
            className="ml-auto rounded-lg px-2.5 py-2 text-sm text-gray hover:text-ink"
          >
            Temizle
          </button>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
