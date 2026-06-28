import Link from "next/link";
import { girisYap } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AuthKabuk } from "@/components/ui/AuthKabuk";

const inpCls =
  "rounded-xl border border-hair bg-soft px-3.5 py-3 font-sans text-base text-ink outline-none transition-colors placeholder:text-gray/60 focus:border-teal focus:bg-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;

  return (
    <AuthKabuk>
      <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-cardlg">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Giriş yap</h1>
        <p className="mt-2 text-sm text-gray/80">
          Canlı stok ağına eriş. E-posta ve parolanla devam et.
        </p>

        {hata && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm text-red"
          >
            {hata}
          </p>
        )}
        {mesaj && (
          <p className="mt-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm text-green">
            {mesaj}
          </p>
        )}

        <form action={girisYap} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-white/90">
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
          <label className="flex flex-col gap-2 text-sm font-semibold text-white/90">
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

          <SubmitButton className="mt-4 w-full bg-teal text-navy hover:bg-teal/90 rounded-xl py-3 font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]" bekleyenMetin="Giriş yapılıyor…">
            Giriş yap
          </SubmitButton>
        </form>
        <p className="mt-6 border-t border-white/5 pt-4 text-center text-sm text-gray/70">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-semibold text-teal hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-gray/50">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
