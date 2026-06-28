import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KayitForm } from "./KayitForm";
import { AuthKabuk } from "@/components/ui/AuthKabuk";

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
    <AuthKabuk>
      <div className="kart p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Hesap oluştur</h1>
        <p className="mt-2 text-sm font-medium text-ink-soft">
          Kaydın admin onayından sonra aktifleşir. Onaylanınca giriş yapıp paneline erişirsin.
        </p>

        {hata ? (
          <p role="alert" className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm text-red font-semibold">
            {hata}
          </p>
        ) : null}

        <KayitForm />

        <p className="mt-6 border-t border-hair pt-4 text-center text-sm font-medium text-ink-soft">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-bold text-teal hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-ink-soft/70">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
