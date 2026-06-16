import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { panelYolu } from "@/lib/roller";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastSaglayici } from "@/components/ui/Toast";

/** Emlakçı app-shell — yalnız 'emlakci'. Mobil-önce: üst app-bar + alt tab-nav + toast. */
export default async function HavuzLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, rol")
    .eq("id", user.id)
    .single();
  if (!profil || profil.rol !== "emlakci") {
    redirect(profil ? panelYolu(profil.rol) : "/");
  }

  return (
    <ToastSaglayici>
      <div className="flex min-h-full flex-col bg-paper">
        <header className="sticky top-0 z-30 border-b border-hair bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
            <Link href="/havuz">
              <Logo size={24} wordmark />
            </Link>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green/40 bg-green-soft px-2.5 py-1 font-mono text-[11px] text-teal-d">
                <span className="nabiz size-1.5 rounded-full bg-green" /> canlı
              </span>
              <form action={cikisYap}>
                <button className="rounded-lg border border-hair px-2.5 py-1.5 text-sm font-medium text-navy transition-colors hover:border-teal">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        <BottomNav />
      </div>
    </ToastSaglayici>
  );
}
