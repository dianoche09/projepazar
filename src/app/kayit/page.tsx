import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KayitForm } from "./KayitForm";

export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3 font-display text-xl font-semibold text-navy"
        >
          <span className="grid grid-cols-3 gap-0.5" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={`size-2 rounded-[2px] ${i === 4 ? "bg-green" : "bg-navy/25"}`} />
            ))}
          </span>
          ProjePazar
        </Link>

        <div className="rounded-2xl border border-hair bg-card p-6 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-ink">Hesap oluştur</h1>
          <p className="mt-1 text-sm text-gray">
            Kaydın admin onayından sonra aktifleşir. Onaylanınca giriş yapıp paneline erişirsin.
          </p>

          {hata ? (
            <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
              {hata}
            </p>
          ) : null}

          <KayitForm />

          <p className="mt-4 text-center text-sm text-gray">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-teal hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
