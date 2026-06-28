import Link from "next/link";
import { girisYap } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AuthKabuk } from "@/components/ui/AuthKabuk";

const inpCls =
  "min-h-12 w-full rounded-xl border border-hair bg-soft px-4 font-sans text-base text-ink outline-none transition-all placeholder:text-ink-soft/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/12";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;

  return (
    <AuthKabuk>
      <div className="kart p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Giriş yap</h1>
        <p className="mt-2 text-sm font-medium text-ink-soft">
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
          <label className="flex flex-col gap-2 text-sm font-bold text-ink">
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
          <label className="flex flex-col gap-2 text-sm font-bold text-ink">
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

          <SubmitButton
            varyant="teal"
            bekleyenMetin="Giriş yapılıyor…"
            className="mt-4 min-h-12 w-full rounded-xl bg-teal py-3.5 text-base font-bold text-white hover:bg-teal-d shadow-[0_6px_16px_rgba(30,155,138,0.3)]"
          >
            Giriş yap
          </SubmitButton>
        </form>
        <p className="mt-6 border-t border-hair pt-4 text-center text-sm font-medium text-ink-soft">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-bold text-teal hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-ink-soft/70">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
