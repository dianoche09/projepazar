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
      <div className="rounded-2xl border border-hair bg-card p-6 shadow-card sm:p-7">
        <h1 className="font-display text-2xl font-semibold text-ink">Giriş yap</h1>
        <p className="mt-1.5 text-sm text-gray">
          Canlı stok ağına eriş. E-posta ve parolanla devam et.
        </p>

        {hata && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red/30 bg-red-soft px-3 py-2 text-sm text-red"
          >
            {hata}
          </p>
        )}
        {mesaj && (
          <p className="mt-4 rounded-lg border border-green/30 bg-green-soft px-3 py-2 text-sm text-teal-d">
            {mesaj}
          </p>
        )}

        <form action={girisYap} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
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
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
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

          <SubmitButton className="mt-2 w-full" bekleyenMetin="Giriş yapılıyor…">
            Giriş yap
          </SubmitButton>
        </form>
        <p className="mt-5 border-t border-hair pt-4 text-center text-sm text-gray">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-medium text-teal-d hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-gray">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
