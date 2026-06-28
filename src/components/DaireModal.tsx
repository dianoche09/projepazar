"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { birimDurumGuncelle, birimGuncelle } from "@/app/uretici/actions";
import { opsiyonAlSessiz, opsiyonBirakSessiz } from "@/app/havuz/actions";
import { DURUM_BG, DURUM_ETIKET, zamanOnce, type BirimDurum } from "@/lib/types";
import { KatPlani } from "@/components/KatPlani";
import { useToast } from "@/components/ui/Toast";

const DURUMLAR: BirimDurum[] = ["musait", "opsiyonlu", "satis_beklemede", "satildi", "stop"];
const inp =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal";

export type ModalBirim = {
  id: string;
  daire_no: string | null;
  kat: number | null;
  durum: BirimDurum;
  satilabilir: boolean;
  liste_fiyati: number | null;
  para_birimi: string;
  net_m2: number | null;
  brut_m2: number | null;
  yon: string | null;
  manzara: string | null;
  durum_notu: string | null;
  son_guncelleme: string;
  serefiye: { kat?: number; manzara?: number } | null;
  taban_fiyat: number | null;
  tip_ad: string | null;
  oda: string | null;
  plan_url?: string | null;
  odeme_plani?: OdemePlani;
};

const fmt = (n: number) => n.toLocaleString("tr-TR");
const PARA_SIMGE: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£", AED: "AED" };
type OdemePlani = {
  pesinat_pct?: number | null;
  taksit_sayisi?: number | null;
  vade_farki_pct?: number | null;
  ara_odemeler?: { ay: number; pct: number }[] | null;
} | null;

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

/**
 * Daire detay modalı — merkezi, scroll yaratmaz. Künye + şerefiye kırılımı + iz.
 * mod="uretici": durum/not değiştir. mod="emlakci": salt-okunur + paylaş + opsiyon (48s kilit).
 */
export function DaireModal({
  birim,
  projeId,
  onKapat,
  mod = "uretici",
  projeAd = "",
  shareUrl = "",
}: {
  birim: ModalBirim;
  projeId: string;
  onKapat: () => void;
  mod?: "uretici" | "emlakci";
  projeAd?: string;
  shareUrl?: string;
}) {
  const [durum, setDurum] = useState<BirimDurum>(birim.durum);
  const [bekliyor, basla] = useTransition();
  const toast = useToast();

  const taban = birim.taban_fiyat;
  const liste = birim.liste_fiyati;
  const psim = PARA_SIMGE[birim.para_birimi] ?? "₺";
  const sKat = birim.serefiye?.kat ?? null;
  const sManzara = birim.serefiye?.manzara ?? null;
  const katKatki = taban != null && sKat ? Math.round((taban * sKat) / 100) : null;
  const manzaraKatki = taban != null && sManzara ? Math.round((taban * sManzara) / 100) : null;
  const fark = taban != null && liste != null ? liste - taban : null;

  // Paylaşımda fiyat CANLI değerden basılır (DEĞİŞMEZ #2)
  const paylasMetni = [
    projeAd,
    `Daire ${birim.daire_no ?? ""}`.trim(),
    birim.oda ?? birim.tip_ad ?? "",
    liste != null ? `${fmt(liste)} ${psim}` : "",
    shareUrl,
  ]
    .filter(Boolean)
    .join(" · ");
  const waLink = `https://wa.me/?text=${encodeURIComponent(paylasMetni)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onKapat} aria-hidden />
      <div className="sheet-in relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-hair bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Daire {birim.daire_no ?? "—"}</h3>
            <p className="text-sm text-gray">
              {birim.tip_ad ?? birim.oda ?? "—"}
              {birim.kat != null ? ` · ${birim.kat}. kat` : ""}
              {!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}
            </p>
          </div>
          <button onClick={onKapat} className="rounded-lg px-2 py-1 text-gray transition-colors hover:bg-paper" aria-label="Kapat">
            ✕
          </button>
        </div>

        {mod === "emlakci" ? (
          <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium text-white ${DURUM_BG[birim.durum]}`}>
            {DURUM_ETIKET[birim.durum]}
          </span>
        ) : null}

        {/* Daire planı — tip görseli varsa onu, yoksa şematik plan */}
        <div className="mt-4 overflow-hidden rounded-xl border border-hair">
          {birim.plan_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={birim.plan_url} alt={`${birim.tip_ad ?? "Daire"} planı`} className="max-h-72 w-full object-contain bg-paper" />
          ) : (
            <KatPlani etiket={birim.oda ?? birim.tip_ad ?? undefined} buyuk />
          )}
        </div>

        {birim.net_m2 || birim.brut_m2 || birim.yon || birim.manzara || birim.oda ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {birim.oda ? (
              <div><span className="text-gray">Oda </span><span className="text-ink">{birim.oda}</span></div>
            ) : null}
            {birim.net_m2 ? (
              <div><span className="text-gray">Net </span><span className="font-mono text-ink">{birim.net_m2} m²</span></div>
            ) : null}
            {birim.brut_m2 ? (
              <div><span className="text-gray">Brüt </span><span className="font-mono text-ink">{birim.brut_m2} m²</span></div>
            ) : null}
            {birim.yon ? (
              <div><span className="text-gray">Yön </span><span className="text-ink">{birim.yon}</span></div>
            ) : null}
            {birim.manzara ? (
              <div><span className="text-gray">Manzara </span><span className="text-ink">{birim.manzara}</span></div>
            ) : null}
          </div>
        ) : null}

        {taban != null ? (
          <div className="mt-4 rounded-xl border border-hair bg-paper p-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray">Taban fiyat</span>
              <span className="text-ink">{fmt(taban)} {psim}</span>
            </div>
            {katKatki != null ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Kat şerefiyesi %{sKat}</span>
                <span className="text-ink">+{fmt(katKatki)} {psim}</span>
              </div>
            ) : null}
            {manzaraKatki != null ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Manzara şerefiyesi %{sManzara}</span>
                <span className="text-ink">+{fmt(manzaraKatki)} {psim}</span>
              </div>
            ) : null}
            {katKatki == null && manzaraKatki == null && fark != null && fark !== 0 ? (
              <div className="flex justify-between">
                <span className="text-gray">+ Kat/konum farkı</span>
                <span className="text-ink">{fark > 0 ? "+" : ""}{fmt(fark)} {psim}</span>
              </div>
            ) : null}
            <div className="mt-1 flex justify-between border-t border-hair pt-1 font-semibold">
              <span className="text-ink">Liste fiyatı</span>
              <span className="text-ink">{liste != null ? fmt(liste) : "—"} {psim}</span>
            </div>
          </div>
        ) : liste != null ? (
          <p className="mt-4 font-mono text-lg text-ink">{fmt(liste)} {psim}</p>
        ) : null}

        {/* Ödeme planı — proje şablonu × canlı fiyat (Connject paritesi; aylık taksit fiyattan hesaplanır) */}
        {liste != null && birim.odeme_plani && (birim.odeme_plani.pesinat_pct != null || birim.odeme_plani.taksit_sayisi != null)
          ? (() => {
              const op = birim.odeme_plani!;
              const pesinatPct = op.pesinat_pct ?? 0;
              const araPct = (op.ara_odemeler ?? []).reduce((t, a) => t + (a?.pct ?? 0), 0);
              const pesinat = Math.round((liste * pesinatPct) / 100);
              const kalan = Math.max(0, liste - pesinat - Math.round((liste * araPct) / 100));
              const ay = op.taksit_sayisi ?? 0;
              const vade = op.vade_farki_pct ?? 0;
              const aylik = ay > 0 ? Math.round((kalan * (1 + vade / 100)) / ay) : null;
              return (
                <div className="mt-3 rounded-xl border border-hair bg-paper p-3 text-sm">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray">Ödeme Planı</p>
                  <div className="space-y-1 font-mono">
                    {pesinatPct ? (
                      <div className="flex justify-between">
                        <span className="text-gray">Peşinat %{pesinatPct}</span>
                        <span className="text-ink">{fmt(pesinat)} {psim}</span>
                      </div>
                    ) : null}
                    {aylik != null ? (
                      <div className="flex justify-between">
                        <span className="text-gray">{ay} ay taksit</span>
                        <span className="font-semibold text-ink">{fmt(aylik)} {psim}/ay</span>
                      </div>
                    ) : null}
                  </div>
                  {vade === 0 ? <p className="mt-1.5 text-[11px] font-medium text-teal-d">Vade farksız</p> : null}
                </div>
              );
            })()
          : null}

        {mod === "uretici" ? (
          <>
          <form
            action={async (fd) => {
              await birimDurumGuncelle(fd);
              onKapat();
            }}
            className="mt-4"
          >
            <input type="hidden" name="birim_id" value={birim.id} />
            <input type="hidden" name="proje_id" value={projeId} />
            <p className="text-sm font-medium text-ink">Durum</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DURUMLAR.map((d) => (
                <label
                  key={d}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    durum === d ? `border-transparent text-white ${DURUM_BG[d]}` : "border-hair text-gray hover:border-teal"
                  }`}
                >
                  <input
                    type="radio"
                    name="durum"
                    value={d}
                    checked={durum === d}
                    onChange={() => setDurum(d)}
                    className="sr-only"
                  />
                  {DURUM_ETIKET[d]}
                </label>
              ))}
            </div>
            <textarea
              name="durum_notu"
              defaultValue={birim.durum_notu ?? ""}
              rows={2}
              placeholder="Durum notu — opsiyon: kim/ne zaman; satış: alıcı vb."
              className="mt-3 w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-mono text-xs text-gray">
                <span className="size-1.5 rounded-full bg-green" />
                {zamanOnce(birim.son_guncelleme)}
              </span>
              <Kaydet />
            </div>
          </form>

          <details className="mt-3 rounded-lg border border-hair">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-ink">Daireyi düzenle (no · kat · fiyat · yön · m²)</summary>
            <form
              action={async (fd) => {
                await birimGuncelle(fd);
                onKapat();
              }}
              className="grid grid-cols-2 gap-2 p-3"
            >
              <input type="hidden" name="birim_id" value={birim.id} />
              <input type="hidden" name="proje_id" value={projeId} />
              <input name="daire_no" defaultValue={birim.daire_no ?? ""} placeholder="Daire no" className={inp} />
              <input name="kat" type="number" defaultValue={birim.kat ?? ""} placeholder="Kat" className={inp} />
              <input name="liste_fiyati" type="number" defaultValue={birim.liste_fiyati ?? ""} placeholder="Fiyat ₺" className={inp} />
              <input name="net_m2" type="number" defaultValue={birim.net_m2 ?? ""} placeholder="Net m²" className={inp} />
              <input name="brut_m2" type="number" defaultValue={birim.brut_m2 ?? ""} placeholder="Brüt m²" className={inp} />
              <input name="yon" defaultValue={birim.yon ?? ""} placeholder="Yön" className={inp} />
              <input name="manzara" defaultValue={birim.manzara ?? ""} placeholder="Manzara" className={`${inp} col-span-2`} />
              <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="satilabilir" defaultChecked={birim.satilabilir} className="size-4" /> Satılabilir (arsa payı değil)
              </label>
              <div className="col-span-2"><Kaydet /></div>
            </form>
          </details>
          </>
        ) : (
          <div className="mt-4 space-y-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-green px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              WhatsApp ile Paylaş
            </a>
            {/* Yasal: sosyal medyada gayrimenkul ilanı yasak (Tic. Bak. 2024). Link birebir paylaşım içindir. */}
            <p className="text-center text-[11px] leading-snug text-gray">
              Yalnız müşterinle birebir paylaş — sosyal medyada yayınlama (yetkisiz ilan = yasal risk).
            </p>

            {birim.durum === "musait" && birim.satilabilir ? (
              <button
                type="button"
                disabled={bekliyor}
                onClick={() =>
                  basla(async () => {
                    const r = await opsiyonAlSessiz(birim.id, projeId);
                    toast.goster(r.mesaj, r.ok ? "basari" : "hata");
                    if (r.ok) onKapat();
                  })
                }
                className="w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {bekliyor ? "İşleniyor…" : "Opsiyon Al · 48s"}
              </button>
            ) : birim.durum === "opsiyonlu" ? (
              <button
                type="button"
                disabled={bekliyor}
                onClick={() =>
                  basla(async () => {
                    const r = await opsiyonBirakSessiz(birim.id, projeId);
                    toast.goster(r.mesaj, r.ok ? "basari" : "hata");
                    if (r.ok) onKapat();
                  })
                }
                className="w-full rounded-lg border border-hair px-4 py-2.5 text-sm font-medium text-amber transition-colors hover:border-amber disabled:opacity-50"
              >
                {bekliyor ? "İşleniyor…" : "Opsiyonu bırak (yalnız kendi opsiyonun)"}
              </button>
            ) : (
              <button disabled className="w-full rounded-lg border border-hair px-4 py-2.5 text-sm font-medium text-gray opacity-60">
                {DURUM_ETIKET[birim.durum]} — opsiyon alınamaz
              </button>
            )}

            <p className="inline-flex items-center gap-1 font-mono text-xs text-gray">
              <span className="size-1.5 rounded-full bg-green" />
              {zamanOnce(birim.son_guncelleme)} güncellendi
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
