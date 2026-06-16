"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { kullaniciGuncelle } from "@/app/admin/actions";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { HESAP_DURUM_ETIKET, HESAP_DURUM_ROZET, zamanOnce, type HesapDurum } from "@/lib/types";

const ROLLER: Rol[] = ["uretici", "emlakci", "ofis_yetkili", "marka_yetkili", "arsa_sahibi", "admin"];
const DURUMLAR: HesapDurum[] = ["onay_bekliyor", "aktif", "pasif", "askida", "arsivli"];
const sel = "rounded-lg border border-hair bg-paper px-2 py-1.5 text-sm text-ink";

export type Kullanici = {
  id: string;
  ad: string | null;
  rol: Rol;
  durum: HesapDurum;
  ofis_id: string | null;
  telefon: string | null;
  son_giris: string | null;
  talep_rol: string | null;
};

function Kaydet() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
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
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara — ad / telefon"
          className="flex-1 rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        />
        <select value={rolF} onChange={(e) => setRolF(e.target.value)} className={sel}>
          <option value="">Tüm roller</option>
          {ROLLER.map((r) => (
            <option key={r} value={r}>
              {ROL_ETIKET[r]}
            </option>
          ))}
        </select>
        <select value={durumF} onChange={(e) => setDurumF(e.target.value)} className={sel}>
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map((d) => (
            <option key={d} value={d}>
              {HESAP_DURUM_ETIKET[d]}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs text-gray">{filtreli.length} kullanıcı</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-hair bg-card">
        {filtreli.map((k) => (
          <div key={k.id} className="border-t border-hair first:border-t-0">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-44 flex-1">
                <Link
                  href={`/admin/kullanicilar/${k.id}`}
                  className="font-medium text-ink transition-colors hover:text-teal hover:underline"
                >
                  {k.ad ?? "—"}
                </Link>
                <p className="text-xs text-gray">
                  {k.telefon ?? "tel —"} · ofis: {ofisAd(k.ofis_id)} · son giriş{" "}
                  {k.son_giris ? zamanOnce(k.son_giris) : "hiç"}
                </p>
              </div>
              <span className="text-sm text-gray">{ROL_ETIKET[k.rol]}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${HESAP_DURUM_ROZET[k.durum]}`}>
                {HESAP_DURUM_ETIKET[k.durum]}
              </span>
              <button
                onClick={() => setDuzenle(duzenle === k.id ? null : k.id)}
                className="rounded-lg border border-hair px-3 py-1.5 text-sm text-navy transition-colors hover:border-teal"
              >
                {duzenle === k.id ? "Kapat" : "Düzenle"}
              </button>
            </div>

            {duzenle === k.id ? (
              <form
                action={kullaniciGuncelle}
                className="flex flex-wrap items-end gap-2 border-t border-hair bg-paper px-4 py-3"
              >
                <input type="hidden" name="kullanici_id" value={k.id} />
                <label className="flex flex-col text-xs text-gray">
                  Rol
                  <select name="rol" defaultValue={k.rol} className={sel}>
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {ROL_ETIKET[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-xs text-gray">
                  Ofis
                  <select name="ofis_id" defaultValue={k.ofis_id ?? ""} className={sel}>
                    <option value="">— yok —</option>
                    {ofisler.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.ad}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-xs text-gray">
                  Durum
                  <select name="durum" defaultValue={k.durum} className={sel}>
                    {DURUMLAR.map((d) => (
                      <option key={d} value={d}>
                        {HESAP_DURUM_ETIKET[d]}
                      </option>
                    ))}
                  </select>
                </label>
                <Kaydet />
              </form>
            ) : null}
          </div>
        ))}
        {filtreli.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray">Eşleşen kullanıcı yok.</p>
        ) : null}
      </div>
    </div>
  );
}
