import Link from "next/link";
import { girisYap, kayitOl } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { hata, mesaj } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3 font-display text-xl font-semibold text-navy"
        >
          <span className="grid grid-cols-3 gap-0.5" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-[2px] ${i === 4 ? "bg-green" : "bg-navy/25"}`}
              />
            ))}
          </span>
          ProjePazar
        </Link>

        <div className="rounded-2xl border border-hair bg-card p-6 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-ink">Giriş yap</h1>
          <p className="mt-1 text-sm text-gray">
            E-posta ve parolanla giriş yap veya yeni hesap oluştur.
          </p>

          {hata && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red"
            >
              {hata}
            </p>
          )}
          {mesaj && (
            <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">
              {mesaj}
            </p>
          )}

          <form className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              E-posta
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ornek@projepazar.com"
                className="rounded-lg border border-hair bg-paper px-3 py-2 font-sans text-base text-ink outline-none transition-colors focus:border-teal"
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
                className="rounded-lg border border-hair bg-paper px-3 py-2 font-sans text-base text-ink outline-none transition-colors focus:border-teal"
              />
            </label>

            <button
              formAction={girisYap}
              className="mt-2 rounded-lg bg-navy px-4 py-2.5 font-medium text-white transition-colors hover:bg-ink"
            >
              Giriş yap
            </button>
            <button
              formAction={kayitOl}
              className="rounded-lg border border-hair bg-card px-4 py-2.5 font-medium text-navy transition-colors hover:border-teal"
            >
              Kayıt ol
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
