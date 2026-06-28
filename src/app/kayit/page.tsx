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
      <div className="rounded-2xl border border-hair bg-card p-6 shadow-card sm:p-7">
        <h1 className="font-display text-2xl font-semibold text-ink">Hesap oluştur</h1>
        <p className="mt-1.5 text-sm text-gray">
          Kaydın admin onayından sonra aktifleşir. Onaylanınca giriş yapıp paneline erişirsin.
        </p>

        {hata ? (
          <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red-soft px-3 py-2 text-sm text-red">
            {hata}
          </p>
        ) : null}

        <KayitForm />

        <p className="mt-5 border-t border-hair pt-4 text-center text-sm text-gray">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-medium text-teal-d hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-gray">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
