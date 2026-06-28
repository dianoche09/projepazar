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
  "min-h-12 w-full rounded-xl border border-hair bg-soft px-4 text-base text-ink outline-none transition-all placeholder:text-ink-soft/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/12";

function Gonder() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-4 min-h-12 w-full rounded-xl bg-teal py-3.5 text-base font-bold text-white transition-all duration-300 hover:bg-teal-d disabled:opacity-50 shadow-[0_6px_16px_rgba(30,155,138,0.3)]"
    >
      {pending ? "Kaydediliyor…" : "Kayıt ol"}
    </button>
  );
}

export function KayitForm() {
  const [rol, setRol] = useState<string>("uretici");

  return (
    <form action={kayitOl} className="mt-6 flex flex-col gap-4 text-ink">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">Hesap türü</span>
        {ROLLER.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition-all duration-200 ${
              rol === r.value ? "border-teal bg-teal-soft shadow-sm" : "border-hair hover:border-teal/40"
            }`}
          >
            <input
              type="radio"
              name="talep_rol"
              value={r.value}
              checked={rol === r.value}
              onChange={() => setRol(r.value)}
              className="mt-1 accent-teal"
            />
            <span>
              <span className="block text-sm font-bold text-ink">{r.etiket}</span>
              <span className="block text-xs font-medium text-ink-soft">{r.aciklama}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
        Ad soyad
        <input name="ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
        E-posta
        <input name="email" type="email" required autoComplete="email" placeholder="ornek@projepazar.com" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
        Telefon <span className="font-normal text-ink-soft/70">(opsiyonel)</span>
        <input name="telefon" type="tel" autoComplete="tel" placeholder="+90…" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
        Parola
        <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" className={inp} />
      </label>

      {rol === "uretici" ? (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
          Vergi no <span className="font-normal text-ink-soft/70">(firma doğrulaması için)</span>
          <input name="vergi_no" inputMode="numeric" placeholder="VKN" className={inp} />
        </label>
      ) : null}
      {rol === "ofis_yetkili" ? (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink">
          Ofis / Franchise adı
          <input name="ofis_adi" placeholder="ör. Demo Gayrimenkul" className={inp} />
        </label>
      ) : null}

      <Gonder />
    </form>
  );
}
