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
  "rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-teal focus:bg-white";

function Gonder() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-4 rounded-xl bg-teal px-5 py-3 font-bold text-white transition-all duration-300 hover:bg-teal-d disabled:opacity-50 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
    >
      {pending ? "Kaydediliyor…" : "Kayıt ol"}
    </button>
  );
}

export function KayitForm() {
  const [rol, setRol] = useState<string>("uretici");

  return (
    <form action={kayitOl} className="mt-6 flex flex-col gap-4 text-slate-800">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-slate-800">Hesap türü</span>
        {ROLLER.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition-all duration-200 ${
              rol === r.value ? "border-teal bg-blue-50/40 shadow-sm" : "border-slate-200 hover:border-teal/30"
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
              <span className="block text-sm font-bold text-slate-800">{r.etiket}</span>
              <span className="block text-xs text-slate-500 font-medium">{r.aciklama}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
        Ad soyad
        <input name="ad" required minLength={2} placeholder="Ad Soyad" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
        E-posta
        <input name="email" type="email" required autoComplete="email" placeholder="ornek@projepazar.com" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
        Telefon <span className="font-normal text-slate-400">(opsiyonel)</span>
        <input name="telefon" type="tel" autoComplete="tel" placeholder="+90…" className={inp} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
        Parola
        <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" className={inp} />
      </label>

      {rol === "uretici" ? (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
          Vergi no <span className="font-normal text-slate-400">(firma doğrulaması için)</span>
          <input name="vergi_no" inputMode="numeric" placeholder="VKN" className={inp} />
        </label>
      ) : null}
      {rol === "ofis_yetkili" ? (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-800">
          Ofis / Franchise adı
          <input name="ofis_adi" placeholder="ör. Demo Gayrimenkul" className={inp} />
        </label>
      ) : null}

      <Gonder />
    </form>
  );
}
