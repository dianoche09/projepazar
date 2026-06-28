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
      <div className="flex min-h-screen bg-paper text-slate-800">
        {/* Masaüstü sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex shadow-[2px_0_8px_rgba(0,0,0,0.01)]">
          <div className="border-b border-slate-100 px-5 py-5">
            <Link href="/havuz" className="inline-flex">
              <Logo size={24} wordmark />
            </Link>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Emlakçı Havuzu</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <EmlakciNav />
          </div>
          <div className="space-y-4 border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="flex justify-between items-center px-1">
              {canliRozet}
              <span className="text-[10px] font-mono text-slate-400">v1.2.0</span>
            </div>
            <div className="flex items-center gap-3 px-1 py-1">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 border border-blue-200/60 text-sm font-bold text-teal shadow-sm">
                {ad.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-bold text-slate-800">{ad}</span>
                <span className="text-[9px] text-slate-400 font-bold font-mono uppercase">ONAYLI ÜYE</span>
              </div>
            </div>
            <form action={cikisYap}>
              <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900">
                Oturumu Kapat
              </button>
            </form>
          </div>
        </aside>

        {/* İçerik kolonu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobil üst bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/havuz" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <div className="flex items-center gap-3">
              {canliRozet}
              <form action={cikisYap}>
                <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  Çıkış
                </button>
              </form>
            </div>
          </header>

          {adminMi ? (
            <div className="flex items-center justify-between gap-2 border-b border-amber-200/50 bg-amber-soft px-4 py-2.5 text-xs text-amber-700">
              <span className="font-semibold">Admin modunda görüntülüyorsun.</span>
              <Link href="/admin" className="shrink-0 font-bold text-amber-700 hover:underline flex items-center gap-1">
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
