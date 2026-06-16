"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { kayitOl } from "./actions";

const ROLLER = [
  { value: "uretici", etiket: "Üretici / Müteahhit", aciklama: "Proje ve stok yöneten firma" },
  { value: "ofis_yetkili", etiket: "Emlak Ofisi / Franchise", aciklama: "Ekip ve abonelik sahibi" },
  { value: "emlakci", etiket: "Emlakçı / Danışman", aciklama: "Havuzdan paylaşan danışman" },
] as const;

const inp =
  "rounded-lg border border-hair bg-paper px-3 py-2 text-base text-ink outline-none transition-colors focus:border-teal";

function Gonder() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-2 rounded-lg bg-navy px-4 py-2.5 font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
    >
      {pending ? "Kaydediliyor…" : "Kayıt ol"}
    </button>
  );
}

export function KayitForm() {
  const [rol, setRol] = useState<string>("uretici");

  return (
    <form action={kayitOl} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Hesap türü</span>
        {ROLLER.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
              rol === r.value ? "border-teal bg-teal/5" : "border-hair hover:border-teal/50"
            }`}
          >
            <input
              type="radio"
              name="talep_rol"
              value={r.value}
              checked={rol === r.value}
              onChange={() => setRol(r.value)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{r.etiket}</span>
              <span className="block text-xs text-gray">{r.aciklama}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Ad soyad
        <input name="ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        E-posta
        <input name="email" type="email" required autoComplete="email" placeholder="ornek@projepazar.com" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Telefon <span className="font-normal text-gray">(opsiyonel)</span>
        <input name="telefon" type="tel" autoComplete="tel" placeholder="+90…" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Parola
        <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" className={inp} />
      </label>

      {rol === "uretici" ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Vergi no <span className="font-normal text-gray">(firma doğrulaması için)</span>
          <input name="vergi_no" inputMode="numeric" placeholder="VKN" className={inp} />
        </label>
      ) : null}
      {rol === "ofis_yetkili" ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Ofis / Franchise adı
          <input name="ofis_adi" placeholder="ör. Demo Gayrimenkul" className={inp} />
        </label>
      ) : null}

      <Gonder />
    </form>
  );
}
