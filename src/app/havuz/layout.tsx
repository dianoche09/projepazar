import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { panelYolu } from "@/lib/roller";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import { EmlakciNav } from "@/components/ui/EmlakciNav";
import { ToastSaglayici } from "@/components/ui/Toast";

/** Emlakçı workspace — masaüstü sidebar (üretici/admin ile tutarlı) + mobil bottom-nav (PWA app-shell). */
export default async function HavuzLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase.from("profiles").select("ad, rol").eq("id", user.id).single();
  if (!profil || (profil.rol !== "emlakci" && profil.rol !== "admin")) {
    redirect(profil ? panelYolu(profil.rol) : "/");
  }
  const adminMi = profil.rol === "admin";
  const ad = profil.ad ?? user.email ?? "Emlakçı";

  const canliRozet = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green/40 bg-green-soft px-2.5 py-1 font-mono text-[11px] text-teal-d">
      <span className="nabiz size-1.5 rounded-full bg-green" /> canlı
    </span>
  );

  return (
    <ToastSaglayici>
      <div className="flex min-h-screen bg-paper">
        {/* Masaüstü sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hair bg-card md:flex">
          <div className="border-b border-hair px-5 py-4">
            <Link href="/havuz" className="inline-flex">
              <Logo size={24} wordmark />
            </Link>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray">Emlakçı</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <EmlakciNav />
          </div>
          <div className="space-y-2 border-t border-hair p-3">
            {canliRozet}
            <div className="flex items-center gap-2.5 px-1">
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
          {/* Mobil üst bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hair bg-card/95 px-4 py-2.5 backdrop-blur md:hidden">
            <Link href="/havuz" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <div className="flex items-center gap-2">
              {canliRozet}
              <form action={cikisYap}>
                <button className="rounded-lg border border-hair px-2.5 py-1.5 text-sm font-medium text-navy">Çıkış</button>
              </form>
            </div>
          </header>

          {adminMi ? (
            <div className="flex items-center justify-between gap-2 border-b border-amber/30 bg-amber-soft px-4 py-2 text-xs text-ink">
              <span>Admin olarak görüntülüyorsun.</span>
              <Link href="/admin" className="shrink-0 font-semibold text-teal-d hover:underline">← Admin paneli</Link>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
          <BottomNav />
        </div>
      </div>
    </ToastSaglayici>
  );
}
