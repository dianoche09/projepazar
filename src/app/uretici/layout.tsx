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
  if (!profil || (profil.rol !== "uretici" && profil.rol !== "admin")) {
    redirect("/");
  }
  const adminMi = profil.rol === "admin";

  const ad = profil.ad ?? user.email ?? "Üretici";

  return (
    <ToastSaglayici>
      <div className="flex min-h-screen bg-paper text-slate-800">
        {/* Sidebar — masaüstü */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex shadow-[2px_0_8px_rgba(0,0,0,0.01)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <Link href="/uretici" className="inline-flex">
              <Logo size={24} wordmark />
            </Link>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Üretici Paneli</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <UreticiNav />
          </div>
          <div className="space-y-4 border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2.5 px-2 pb-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 border border-blue-200/60 text-xs font-bold text-teal shadow-sm">
                {ad.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-sm font-bold text-slate-800">{ad}</span>
            </div>
            <form action={cikisYap}>
              <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300">
                Oturumu Kapat
              </button>
            </form>
          </div>
        </aside>

        {/* İçerik kolonu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Üst bar — mobil */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
            <Link href="/uretici" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <form action={cikisYap}>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Çıkış
              </button>
            </form>
          </header>
          <div className="border-b border-slate-200/60 bg-white px-3 py-2 md:hidden">
            <UreticiNav mobil />
          </div>

          {adminMi ? (
            <div className="flex items-center justify-between gap-2 border-b border-amber-200/50 bg-amber-soft px-4 py-2 text-xs text-amber-700">
              <span className="font-semibold">Admin olarak görüntülüyorsun — değişiklikler gerçek veriyi etkiler.</span>
              <Link href="/admin" className="shrink-0 font-bold text-amber-700 hover:underline">← Admin paneli</Link>
            </div>
          ) : null}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastSaglayici>
  );
}
