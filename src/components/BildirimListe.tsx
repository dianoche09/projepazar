"use client";

import Link from "next/link";
import { useTransition } from "react";
import { bildirimOku, bildirimHepsiOku } from "@/app/_bildirim/actions";
import { zamanOnce } from "@/lib/types";

export type Bildirim = {
  id: string;
  tip: string;
  baslik: string;
  govde: string | null;
  link: string | null;
  okundu: boolean;
  created_at: string;
};

const TIP_RENK: Record<string, string> = {
  talep: "bg-amber",
  onay: "bg-green",
  red: "bg-red",
  tahsis: "bg-teal",
  lead: "bg-navy",
  sistem: "bg-gray",
};

export function BildirimListe({ bildirimler }: { bildirimler: Bildirim[] }) {
  const [bekliyor, basla] = useTransition();
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Bildirimler</h1>
        {okunmamis > 0 ? (
          <button
            type="button"
            disabled={bekliyor}
            onClick={() => basla(() => bildirimHepsiOku())}
            className="text-[13px] font-medium text-teal-d hover:underline disabled:opacity-50"
          >
            Tümünü okundu işaretle ({okunmamis})
          </button>
        ) : null}
      </div>

      {bildirimler.length === 0 ? (
        <p className="rounded-xl border border-hair bg-card px-4 py-12 text-center text-sm text-gray">
          Henüz bildirim yok.
        </p>
      ) : (
        <div className="space-y-2">
          {bildirimler.map((b) => {
            const govde = (
              <div
                className={`rounded-xl border p-3.5 transition-colors ${
                  b.okundu ? "border-hair bg-card hover:bg-soft" : "border-teal/30 bg-teal/5"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 size-2 flex-none rounded-full ${TIP_RENK[b.tip] ?? "bg-gray"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-ink">{b.baslik}</p>
                    {b.govde ? <p className="mt-0.5 text-[12.5px] text-ink-soft">{b.govde}</p> : null}
                    <p className="mt-1 font-mono text-[11px] text-gray">{zamanOnce(b.created_at)}</p>
                  </div>
                  {!b.okundu ? <span className="mt-1.5 size-2 flex-none rounded-full bg-teal" aria-label="okunmadı" /> : null}
                </div>
              </div>
            );
            const tikla = () => {
              if (!b.okundu) basla(() => bildirimOku(b.id));
            };
            return b.link ? (
              <Link key={b.id} href={b.link} onClick={tikla} className="block">
                {govde}
              </Link>
            ) : (
              <button key={b.id} type="button" onClick={tikla} className="block w-full text-left">
                {govde}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
