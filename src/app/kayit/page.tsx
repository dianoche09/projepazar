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
      <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-cardlg">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Hesap oluştur</h1>
        <p className="mt-2 text-sm text-gray/80">
          Kaydın admin onayından sonra aktifleşir. Onaylanınca giriş yapıp paneline erişirsin.
        </p>

        {hata ? (
          <p role="alert" className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm text-red">
            {hata}
          </p>
        ) : null}

        <KayitForm />

        <p className="mt-6 border-t border-white/5 pt-4 text-center text-sm text-gray/70">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-teal hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-gray/50">
        Kapalı devre B2B ağ · yalnızca davetli üretici ve danışmanlar.
      </p>
    </AuthKabuk>
  );
}
