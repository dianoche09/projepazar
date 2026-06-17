import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { Logo } from "@/components/Logo";
import { ToastSaglayici } from "@/components/ui/Toast";
import { UreticiNav } from "@/components/ui/UreticiNav";

/** Üretici workspace — yalnız 'uretici' rolü. Sidebar (masaüstü) + üst bar (mobil) + toast. */
export default async function UreticiLayout({ children }: { children: React.ReactNode }) {
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
  if (!profil || profil.rol !== "uretici") {
    redirect(profil?.rol === "admin" ? "/admin" : "/");
  }

  const ad = profil.ad ?? user.email ?? "Üretici";

  return (
    <ToastSaglayici>
      <div className="flex min-h-screen bg-paper">
        {/* Sidebar — masaüstü */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hair bg-card md:flex">
          <div className="border-b border-hair px-5 py-4">
            <Link href="/uretici" className="inline-flex">
              <Logo size={24} wordmark />
            </Link>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray">Üretici Paneli</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <UreticiNav />
          </div>
          <div className="border-t border-hair p-3">
            <div className="flex items-center gap-2.5 px-2 pb-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-soft text-xs font-semibold text-navy">
                {ad.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-sm font-medium text-ink">{ad}</span>
            </div>
            <form action={cikisYap}>
              <button className="w-full rounded-lg border border-hair px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-teal">
                Çıkış
              </button>
            </form>
          </div>
        </aside>

        {/* İçerik kolonu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Üst bar — mobil */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hair bg-card/95 px-4 py-2.5 backdrop-blur md:hidden">
            <Link href="/uretici" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <form action={cikisYap}>
              <button className="rounded-lg border border-hair px-2.5 py-1.5 text-sm font-medium text-navy transition-colors hover:border-teal">
                Çıkış
              </button>
            </form>
          </header>
          <div className="border-b border-hair bg-card px-3 py-2 md:hidden">
            <UreticiNav mobil />
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastSaglayici>
  );
}
