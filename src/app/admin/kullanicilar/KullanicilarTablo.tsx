"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { kullaniciGuncelle } from "@/app/admin/actions";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { HESAP_DURUM_ETIKET, HESAP_DURUM_ROZET, zamanOnce, type HesapDurum } from "@/lib/types";
import { Avatar } from "@/app/admin/_ortak";

const ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"];
const DURUMLAR: HesapDurum[] = ["onay_bekliyor", "aktif", "pasif", "askida", "arsivli"];
const sel = "rounded-lg border border-hair bg-soft px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-teal";

export type Kullanici = {
  id: string;
  ad: string | null;
  rol: Rol;
  durum: HesapDurum;
  ofis_id: string | null;
  telefon: string | null;
  son_giris: string | null;
  talep_rol: string | null;
  marka: string | null;
  il: string | null;
  ilce: string | null;
  uzmanlik: string | null;
};

const MARKALAR = ["RE/MAX", "Century 21", "Coldwell Banker", "Keller Williams", "Turyap", "EVA Gayrimenkul", "Bağımsız"];
const UZMANLIKLAR: [string, string][] = [
  ["", "—"],
  ["konut", "Konut"],
  ["ticari", "Ticari"],
  ["arsa", "Arsa"],
  ["proje", "Proje"],
];

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn-action !min-h-0 !rounded-lg !px-4 !py-1.5 !text-[13px] disabled:opacity-50">
      {pending ? "…" : "Kaydet"}
    </button>
  );
}

export function KullanicilarTablo({
  kullanicilar,
  ofisler,
}: {
  kullanicilar: Kullanici[];
  ofisler: { id: string; ad: string }[];
}) {
  const [q, setQ] = useState("");
  const [rolF, setRolF] = useState("");
  const [durumF, setDurumF] = useState("");
  const [duzenle, setDuzenle] = useState<string | null>(null);

  const ofisAd = (id: string | null) => ofisler.find((o) => o.id === id)?.ad ?? "—";
  const filtreli = kullanicilar.filter(
    (k) =>
      (!q ||
        (k.ad ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (k.telefon ?? "").includes(q)) &&
      (!rolF || k.rol === rolF) &&
      (!durumF || k.durum === durumF),
  );

  return (
    <div>
      <datalist id="markalar">
        {MARKALAR.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      {/* Filtre çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara — ad / telefon"
            className="w-full rounded-xl border border-hair bg-card py-2 pl-9 pr-3 text-sm text-ink shadow-card outline-none transition-colors focus:border-teal"
          />
        </div>
        <select value={rolF} onChange={(e) => setRolF(e.target.value)} className={sel}>
          <option value="">Tüm roller</option>
          {ROLLER.map((r) => (
            <option key={r} value={r}>{ROL_ETIKET[r]}</option>
          ))}
        </select>
        <select value={durumF} onChange={(e) => setDurumF(e.target.value)} className={sel}>
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map((d) => (
            <option key={d} value={d}>{HESAP_DURUM_ETIKET[d]}</option>
          ))}
        </select>
        <span className="rozet mono bg-navy/10 text-navy">{filtreli.length} kullanıcı</span>
      </div>

      {/* Tablo */}
      <div className="kart mt-3 overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Ofis</th>
                <th>Son giriş</th>
                <th>Durum</th>
                <th className="!text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filtreli.map((k) => (
                <Fragment key={k.id}>
                  <tr>
                    <td>
                      <Link href={`/admin/kullanicilar/${k.id}`} className="group flex items-center gap-2.5">
                        <Avatar ad={k.ad} id={k.id} boyut={32} />
                        <div className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink transition-colors group-hover:text-teal-d">
                            {k.ad ?? "—"}
                          </span>
                          <span className="mono block text-[11px] text-gray">{k.telefon ?? "tel —"}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="text-[12.5px] text-ink-soft">{ROL_ETIKET[k.rol]}</td>
                    <td className="text-[12.5px] text-ink-soft">{ofisAd(k.ofis_id)}</td>
                    <td className="mono text-[12px] text-gray">{k.son_giris ? zamanOnce(k.son_giris) : "hiç"}</td>
                    <td>
                      <span className={`rozet ${HESAP_DURUM_ROZET[k.durum]}`}>{HESAP_DURUM_ETIKET[k.durum]}</span>
                    </td>
                    <td className="!text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setDuzenle(duzenle === k.id ? null : k.id)}
                          className="rounded-lg border border-hair bg-card px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-teal"
                        >
                          {duzenle === k.id ? "Kapat" : "Düzenle"}
                        </button>
                        <Link
                          href={`/admin/kullanicilar/${k.id}`}
                          className="rounded-lg border border-hair bg-card px-2.5 py-1.5 text-xs font-semibold text-teal-d transition-colors hover:border-teal"
                        >
                          Detay →
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {duzenle === k.id ? (
                    <tr>
                      <td colSpan={6} className="!whitespace-normal bg-soft">
                        <form action={kullaniciGuncelle} className="flex flex-wrap items-end gap-2.5">
                          <input type="hidden" name="kullanici_id" value={k.id} />
                          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                            Rol
                            <select name="rol" defaultValue={k.rol} className={sel}>
                              {ROLLER.map((r) => (
                                <option key={r} value={r}>{ROL_ETIKET[r]}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                            Ofis
                            <select name="ofis_id" defaultValue={k.ofis_id ?? ""} className={sel}>
                              <option value="">— yok —</option>
                              {ofisler.map((o) => (
                                <option key={o.id} value={o.id}>{o.ad}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                            Durum
                            <select name="durum" defaultValue={k.durum} className={sel}>
                              {DURUMLAR.map((d) => (
                                <option key={d} value={d}>{HESAP_DURUM_ETIKET[d]}</option>
                              ))}
                            </select>
                          </label>
                          {k.rol === "emlakci" ? (
                            <>
                              <span className="w-full text-[10px] font-bold uppercase tracking-wide text-gray">
                                Kategorizasyon (segment tahsis için — boşsa ofisten türetilir)
                              </span>
                              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                                Marka
                                <input name="marka" defaultValue={k.marka ?? ""} list="markalar" placeholder="RE/MAX…" className={sel} />
                              </label>
                              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                                Şehir
                                <input name="il" defaultValue={k.il ?? ""} placeholder="Ankara" className={sel} />
                              </label>
                              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                                İlçe
                                <input name="ilce" defaultValue={k.ilce ?? ""} placeholder="Çankaya" className={sel} />
                              </label>
                              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray">
                                Uzmanlık
                                <select name="uzmanlik" defaultValue={k.uzmanlik ?? ""} className={sel}>
                                  {UZMANLIKLAR.map(([v, a]) => (
                                    <option key={v} value={v}>{a}</option>
                                  ))}
                                </select>
                              </label>
                            </>
                          ) : null}
                          <Kaydet />
                        </form>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtreli.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray">Eşleşen kullanıcı yok.</p>
        ) : null}
      </div>
    </div>
  );
}
