import Link from "next/link";
import { girisYap } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AuthKabuk } from "@/components/ui/AuthKabuk";

const inpCls =
  "rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-sans text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal focus:bg-white";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;

  return (
    <AuthKabuk>
      <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-cardlg">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Giriş yap</h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Canlı stok ağına eriş. E-posta ve parolanla devam et.
        </p>

        {hata && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm text-red font-semibold"
          >
            {hata}
          </p>
        )}
        {mesaj && (
          <p className="mt-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm text-green font-semibold">
            {mesaj}
          </p>
        )}

        <form action={girisYap} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            E-posta
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ornek@projepazar.com"
              className={inpCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Parola
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              placeholder="••••••••"
              className={inpCls}
            />
          </label>

          <SubmitButton className="mt-4 w-full bg-teal text-white hover:bg-teal-d rounded-xl py-3.5 font-bold transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.2)]" bekleyenMetin="Giriş yapılıyor…">
            Giriş yap
          </SubmitButton>
        </form>
        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500 font-medium">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-bold text-teal hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 font-semibold">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
