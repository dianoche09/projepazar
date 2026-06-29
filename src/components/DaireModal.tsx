"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { birimDurumGuncelle, birimGuncelle, eklentiEkle, eklentiSil } from "@/app/uretici/actions";
import { opsiyonTalepGonder, opsiyonBirakSessiz } from "@/app/havuz/actions";
import { DURUM_BG, DURUM_ETIKET, zamanOnce, type BirimDurum } from "@/lib/types";
import { KatPlani } from "@/components/KatPlani";
import { PaylasWhatsApp } from "@/components/PaylasWhatsApp";
import { useToast } from "@/components/ui/Toast";

const DURUMLAR: BirimDurum[] = ["musait", "opsiyonlu", "satis_beklemede", "satildi", "stop"];
const inp =
  "rounded-xl border border-white/5 bg-[#0f172a] px-3.5 py-2.5 text-sm text-white/90 outline-none transition-all focus:border-teal/30 focus:bg-[#090d16]";

/** Bir ana daireye bağlı eklenti birim (otopark/depo) — salt gösterim/fiyat. */
export type Eklenti = {
  id: string;
  tur: string;
  daire_no: string | null;
  liste_fiyati: number | null;
  para_birimi: string;
};

export type ModalBirim = {
  id: string;
  daire_no: string | null;
  kat: number | null;
  tur: string;
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
const EKLENTI_ETIKET: Record<string, string> = { otopark: "Otopark", depo: "Depo" };

/** Eklenti tür ikonu — DaireModal slate paletiyle uyumlu inline svg. */
function EklentiIkon({ tur, className = "size-4" }: { tur: string; className?: string }) {
  if (tur === "depo") {
    // kutu / depo
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 8V21H3V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    );
  }
  // otopark / araç (varsayılan)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 17h2l-1.4-5.4A2 2 0 0 0 17.66 10H6.34a2 2 0 0 0-1.94 1.6L3 17h2" />
      <path d="M5 17v2M19 17v2" />
      <circle cx="7.5" cy="14.5" r="1.5" />
      <circle cx="16.5" cy="14.5" r="1.5" />
    </svg>
  );
}
/** Tazelik tier nokta rengi (tasarım dili imzası): 0-24sa yeşil · 1-7g teal · 7-15g amber · 15g+ gri. */
function tazelikDot(iso: string): string {
  const gun = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (gun <= 1) return "bg-green";
  if (gun <= 7) return "bg-teal";
  if (gun <= 15) return "bg-amber";
  return "bg-gray";
}
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
      className="rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-navy transition-all duration-300 hover:bg-teal/90 disabled:opacity-50 shadow-[0_0_12px_rgba(6,182,212,0.15)] cursor-pointer"
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
  benimOpsiyon = false,
  eklentiler = [],
}: {
  birim: ModalBirim;
  projeId: string;
  onKapat: () => void;
  mod?: "uretici" | "emlakci";
  projeAd?: string;
  shareUrl?: string;
  /** Emlakçı modu: bu opsiyon bu emlakçıya mı ait (bırak butonu yalnız o zaman). */
  benimOpsiyon?: boolean;
  /** Bu daireye bağlı eklentiler (otopark/depo). Üretici modunda ekle/sil; diğerlerinde salt-okunur. */
  eklentiler?: Eklenti[];
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

  // Eklenti toplamı (yalnız para birimi ana daireyle aynı olanlar; farklı kur Faz-2).
  const eklentiToplam = eklentiler.reduce(
    (t, e) => (e.liste_fiyati != null && e.para_birimi === birim.para_birimi ? t + e.liste_fiyati : t),
    0,
  );
  const genelToplam = liste != null ? liste + eklentiToplam : null;

  // Paylaşımda fiyat CANLI değerden basılır (DEĞİŞMEZ #2). Çok-satırlı + mikrosite link'i.
  const paylasMetni = [
    projeAd,
    [`Daire ${birim.daire_no ?? ""}`.trim(), birim.oda ?? birim.tip_ad, birim.net_m2 ? `${birim.net_m2} m²` : null]
      .filter(Boolean)
      .join(" · "),
    liste != null ? `${fmt(liste)} ${psim}` : "",
    shareUrl ? `Detay ve randevu: ${shareUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onKapat} aria-hidden />
      <div className="sheet-in glass-card relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-6 shadow-cardlg sm:rounded-2xl border border-slate-200/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">Daire {birim.daire_no ?? "—"}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {birim.tip_ad ?? birim.oda ?? "—"}
              {birim.kat != null ? ` · ${birim.kat}. kat` : ""}
              {!birim.satilabilir ? " · arsa payı (satılamaz)" : ""}
            </p>
          </div>
          <button onClick={onKapat} className="rounded-xl px-3 py-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 text-xs font-bold" aria-label="Kapat">
            ✕
          </button>
        </div>

        {mod === "emlakci" ? (
          <span className={`mt-3 inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider ${DURUM_BG[birim.durum]}`}>
            {DURUM_ETIKET[birim.durum]}
          </span>
        ) : null}

        {/* Daire planı — tip görseli varsa onu, yoksa şematik plan */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          {birim.plan_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={birim.plan_url} alt={`${birim.tip_ad ?? "Daire"} planı`} className="max-h-72 w-full object-contain bg-slate-100/50" />
          ) : (
            <KatPlani etiket={birim.oda ?? birim.tip_ad ?? undefined} buyuk />
          )}
        </div>

        {birim.net_m2 || birim.brut_m2 || birim.yon || birim.manzara || birim.oda ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
            {birim.oda ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2"><span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Oda</span><span className="text-slate-800">{birim.oda}</span></div>
            ) : null}
            {birim.net_m2 ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2"><span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Net Alan</span><span className="font-mono text-slate-800">{birim.net_m2} m²</span></div>
            ) : null}
            {birim.brut_m2 ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2"><span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Brüt Alan</span><span className="font-mono text-slate-800">{birim.brut_m2} m²</span></div>
            ) : null}
            {birim.yon ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2"><span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Cephe</span><span className="text-slate-800">{birim.yon}</span></div>
            ) : null}
            {birim.manzara ? (
              <div className="col-span-2 bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2"><span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Manzara</span><span className="text-slate-800">{birim.manzara}</span></div>
            ) : null}
          </div>
        ) : null}

        {taban != null ? (
          <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50 p-4 font-mono text-xs space-y-2 shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Taban fiyat</span>
              <span className="text-slate-800 font-extrabold">{fmt(taban)} {psim}</span>
            </div>
            {katKatki != null ? (
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">+ Kat şerefiyesi %{sKat}</span>
                <span className="text-slate-800 font-extrabold">+{fmt(katKatki)} {psim}</span>
              </div>
            ) : null}
            {manzaraKatki != null ? (
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">+ Manzara şerefiyesi %{sManzara}</span>
                <span className="text-slate-800 font-extrabold">+{fmt(manzaraKatki)} {psim}</span>
              </div>
            ) : null}
            {katKatki == null && manzaraKatki == null && fark != null && fark !== 0 ? (
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">+ Kat/konum farkı</span>
                <span className="text-slate-800 font-extrabold">{fark > 0 ? "+" : ""}{fmt(fark)} {psim}</span>
              </div>
            ) : null}
            <div className="mt-2.5 flex justify-between border-t border-slate-200/60 pt-2.5 font-bold text-sm">
              <span className="text-slate-900 font-extrabold">Liste fiyatı</span>
              <span className="text-teal font-extrabold">{liste != null ? fmt(liste) : "—"} {psim}</span>
            </div>
          </div>
        ) : liste != null ? (
          <div className="mt-4 bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <span className="text-xs font-bold text-slate-500">Liste Fiyatı</span>
            <span className="font-mono text-lg font-extrabold text-teal">{fmt(liste)} {psim}</span>
          </div>
        ) : null}

        {/* Eklentiler — otopark/depo (ana daireye bağlı). Üretici: ekle/sil; diğer: salt-okunur. */}
        {eklentiler.length > 0 || mod === "uretici" ? (
          <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50 p-4">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Eklentiler</p>

            {eklentiler.length > 0 ? (
              <div className="space-y-1.5">
                {eklentiler.map((e) => {
                  const esim = PARA_SIMGE[e.para_birimi] ?? "₺";
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-bold text-slate-700">
                        <span className="text-teal"><EklentiIkon tur={e.tur} /></span>
                        <span>
                          {EKLENTI_ETIKET[e.tur] ?? e.tur}
                          {e.daire_no ? <span className="ml-1 font-medium text-slate-500">· {e.daire_no}</span> : null}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-slate-800">
                          {e.liste_fiyati != null ? `${fmt(e.liste_fiyati)} ${esim}` : "—"}
                        </span>
                        {mod === "uretici" ? (
                          <form action={eklentiSil}>
                            <input type="hidden" name="proje_id" value={projeId} />
                            <input type="hidden" name="birim_id" value={e.id} />
                            <button
                              type="submit"
                              className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 transition-colors hover:bg-red-soft hover:text-red"
                              aria-label="Eklentiyi kaldır"
                            >
                              Kaldır
                            </button>
                          </form>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : mod === "uretici" ? (
              <p className="text-xs font-medium text-slate-400">Bu daireye bağlı otopark/depo yok.</p>
            ) : null}

            {/* Toplam (daire + eklenti) — yalnız daire fiyatı ve en az 1 eklenti fiyatı varsa anlamlı */}
            {genelToplam != null && eklentiToplam > 0 ? (
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-sm">
                <span className="font-extrabold text-slate-900">Toplam (daire + eklenti)</span>
                <span className="font-mono font-extrabold text-teal">{fmt(genelToplam)} {psim}</span>
              </div>
            ) : null}

            {/* Üretici: yeni eklenti ekle mini-form */}
            {mod === "uretici" ? (
              <form action={eklentiEkle} className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3">
                <input type="hidden" name="proje_id" value={projeId} />
                <input type="hidden" name="ana_birim_id" value={birim.id} />
                <select name="tur" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-teal">
                  <option value="otopark">Otopark</option>
                  <option value="depo">Depo</option>
                </select>
                <input
                  name="liste_fiyati"
                  type="number"
                  min="0"
                  placeholder="Fiyat ₺"
                  className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-teal placeholder:text-slate-400"
                />
                <input
                  name="daire_no"
                  placeholder="Etiket (ops.)"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-teal placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal px-3 py-2 text-xs font-bold text-navy transition-colors hover:bg-teal/90"
                >
                  + Ekle
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {/* Ödeme planı — proje şablonu × canlı fiyat */}
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
                <div className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-xs">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Ödeme Planı Şablonu</p>
                  <div className="space-y-1.5 font-mono text-slate-700">
                    {pesinatPct ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Peşinat %{pesinatPct}</span>
                        <span className="text-slate-800 font-extrabold">{fmt(pesinat)} {psim}</span>
                      </div>
                    ) : null}
                    {aylik != null ? (
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                        <span className="text-slate-500 font-bold">{ay} ay taksit</span>
                        <span className="font-extrabold text-slate-900">{fmt(aylik)} {psim}/ay</span>
                      </div>
                    ) : null}
                  </div>
                  {vade === 0 ? <p className="mt-2 text-[10px] font-bold text-teal uppercase font-mono">Vade farksız</p> : null}
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono mb-2">Birim Durumu</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DURUMLAR.map((d) => (
                <label
                  key={d}
                  className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    durum === d
                      ? `border-transparent text-white font-extrabold ${DURUM_BG[d]}`
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal/30 hover:bg-slate-50"
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
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition-all focus:border-teal focus:bg-white placeholder:text-slate-400"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 font-bold">
                <span className={`size-2 rounded-full ${tazelikDot(birim.son_guncelleme)} shadow-sm`} />
                {zamanOnce(birim.son_guncelleme)}
              </span>
              <Kaydet />
            </div>
          </form>

          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all duration-300">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100/50 select-none">
              Daire Bilgilerini Düzenle
            </summary>
            <form
              action={async (fd) => {
                await birimGuncelle(fd);
                onKapat();
              }}
              className="grid grid-cols-2 gap-3 p-4 border-t border-slate-100"
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
              <input name="serefiye_kat" type="number" step="0.5" defaultValue={birim.serefiye?.kat ?? ""} placeholder="Kat şerefiye %" className={inp} />
              <input name="serefiye_manzara" type="number" step="0.5" defaultValue={birim.serefiye?.manzara ?? ""} placeholder="Manzara şerefiye %" className={inp} />
              <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer py-1 select-none">
                <input type="checkbox" name="satilabilir" defaultChecked={birim.satilabilir} className="size-4 rounded border-slate-200 bg-slate-50 text-teal focus:ring-0 focus:ring-offset-0" />
                <span>Satılabilir (arsa payı değil)</span>
              </label>
              <div className="col-span-2 mt-1"><Kaydet /></div>
            </form>
          </details>
          </>
        ) : (
          <div className="mt-5 space-y-3">
            {birim.durum === "musait" && birim.satilabilir ? (
              <>
                <PaylasWhatsApp
                  text={paylasMetni}
                  projeId={projeId}
                  birimId={birim.id}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#1faa5b] hover:bg-[#178c4a] py-3.5 text-xs font-bold text-white transition-all duration-300 shadow-[0_4px_12px_rgba(31,170,91,0.25)]"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 1.993 14.137.973 11.52.973c-5.437 0-9.859 4.373-9.864 9.803-.002 1.757.475 3.468 1.385 4.988L2.082 21.82l6.565-1.666zM17.29 14.7c-.283-.143-1.67-.82-1.929-.915-.258-.094-.446-.142-.634.143-.188.283-.729.915-.892 1.102-.163.189-.327.213-.61.072-2.046-1.023-3.4-1.918-4.755-4.249-.356-.61.356-.566 1.02-1.888.106-.212.053-.399-.026-.541-.079-.142-.633-1.526-.867-2.09-.228-.548-.46-.473-.633-.482-.164-.008-.352-.01-.54-.01s-.494.07-.753.353c-.259.283-.988.962-.988 2.348s1.009 2.72 1.15 2.908c.141.189 1.984 3.01 4.806 4.217.672.287 1.196.459 1.603.589.675.215 1.29.185 1.776.113.541-.08 1.67-.68 1.905-1.339.235-.66.235-1.226.165-1.343-.07-.118-.282-.189-.564-.332z"/>
                  </svg>
                  WhatsApp ile Paylaş
                </PaylasWhatsApp>
                <p className="text-center text-[10.5px] leading-snug text-[var(--ink-faint)] font-bold">
                  Müşterinizle birebir paylaşın — yetkisiz ilan yasal risk taşımaktadır.
                </p>
                <button
                  type="button"
                  disabled={bekliyor}
                  onClick={() =>
                    basla(async () => {
                      const r = await opsiyonTalepGonder(birim.id, projeId);
                      toast.goster(r.mesaj, r.ok ? "basari" : "hata");
                      if (r.ok) onKapat();
                    })
                  }
                  className="w-full rounded-xl bg-teal font-bold py-3.5 text-xs text-white transition-all duration-300 hover:bg-teal-d disabled:opacity-50 shadow-[0_4px_12px_rgba(30,155,138,0.25)] cursor-pointer"
                >
                  {bekliyor ? "Gönderiliyor…" : "Opsiyon Talebi Gönder"}
                </button>
                <p className="text-center text-[10px] leading-snug text-[var(--ink-faint)] font-bold">
                  Müteahhit onayına düşer · doğrudan kilit yok
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-hair bg-soft p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-ink-soft">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {DURUM_ETIKET[birim.durum]} — kilitli
                </div>
                <p className="mt-1.5 text-[11.5px] leading-snug text-[var(--ink-faint)] font-medium">
                  {birim.durum === "satildi"
                    ? "Bu daire satıldı — paylaşım ve opsiyon kapalı."
                    : birim.durum === "opsiyonlu" || birim.durum === "satis_beklemede"
                      ? benimOpsiyon
                        ? "Senin opsiyonunda — aşağıdan bırakabilirsin."
                        : "Başka danışmanda opsiyonlu — üzerinde işlem yapamazsın."
                      : "Bu daire şu an satışa/paylaşıma kapalı."}
                </p>
                {(birim.durum === "opsiyonlu" || birim.durum === "satis_beklemede") && benimOpsiyon ? (
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
                    className="mt-3 text-[11.5px] font-bold text-amber hover:underline disabled:opacity-50"
                  >
                    {bekliyor ? "İşleniyor…" : "Opsiyonu bırak"}
                  </button>
                ) : null}
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 font-mono text-[10px] text-slate-400 font-bold border-t border-slate-100">
              <span>GÜNCELLİK DURUMU</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${tazelikDot(birim.son_guncelleme)} shadow-sm`} />
                {zamanOnce(birim.son_guncelleme)} güncellendi
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
