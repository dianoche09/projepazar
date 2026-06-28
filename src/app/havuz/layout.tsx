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
      <div className="flex min-h-screen bg-paper text-white">
        {/* Masaüstü sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-[#020617] md:flex">
          <div className="border-b border-white/5 px-5 py-5">
            <Link href="/havuz" className="inline-flex">
              <Logo size={24} wordmark />
            </Link>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-gray/50 font-mono">Emlakçı Havuzu</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <EmlakciNav />
          </div>
          <div className="space-y-4 border-t border-white/5 p-4 bg-[#01040a]/50">
            <div className="flex justify-between items-center px-1">
              {canliRozet}
              <span className="text-[10px] font-mono text-gray/40">v1.2.0</span>
            </div>
            <div className="flex items-center gap-3 px-1 py-1">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-soft border border-teal/20 text-sm font-bold text-teal shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                {ad.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-semibold text-white/90">{ad}</span>
                <span className="text-[10px] text-gray/50 font-mono uppercase">ONAYLI ÜYE</span>
              </div>
            </div>
            <form action={cikisYap}>
              <button className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition-all duration-300 hover:border-white/10 hover:bg-white/10 hover:text-white">
                Oturumu Kapat
              </button>
            </form>
          </div>
        </aside>

        {/* İçerik kolonu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobil üst bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#020617]/90 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/havuz" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <div className="flex items-center gap-3">
              {canliRozet}
              <form action={cikisYap}>
                <button className="rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10">
                  Çıkış
                </button>
              </form>
            </div>
          </header>

          {adminMi ? (
            <div className="flex items-center justify-between gap-2 border-b border-amber/20 bg-amber-soft px-4 py-2.5 text-xs text-amber shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <span className="font-medium">Admin modunda görüntülüyorsun.</span>
              <Link href="/admin" className="shrink-0 font-bold text-amber hover:underline flex items-center gap-1">
                <span>←</span> Admin Paneli
              </Link>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 pb-24 md:pb-8 px-4 py-6 md:px-8">{children}</main>
          <BottomNav />
        </div>
      </div>
    </ToastSaglayici>
  );
}
