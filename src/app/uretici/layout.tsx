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
      <div className="flex min-h-screen bg-paper text-ink">
        {/* Sidebar — masaüstü (v2 spatial, tam-boy, blur) */}
        <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col border-r border-[var(--cizgi)] px-4 py-5 backdrop-blur-xl md:flex"
          style={{ background: "rgba(255,255,255,.72)" }}
        >
          {/* logo */}
          <div className="mb-6 flex items-center gap-3 px-2">
            <Link href="/uretici" className="inline-flex">
              <Logo size={26} wordmark />
            </Link>
          </div>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)] font-mono">
            Üretici Kokpiti
          </p>

          <div className="flex-1 overflow-y-auto">
            <UreticiNav />
          </div>

          {/* alt: kullanıcı kartı + çıkış */}
          <div className="mt-4 border-t border-[var(--cizgi)] pt-4">
            <div className="flex items-center gap-3 px-1">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-[14px] font-bold text-white"
                style={{ background: "linear-gradient(150deg,var(--color-teal),#157a6c)" }}
              >
                {ad.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13px] font-semibold text-ink">{ad}</div>
                <div className="flex items-center gap-1 text-[10.5px] text-teal">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {adminMi ? "Admin görünümü" : "Doğrulanmış üretici"}
                </div>
              </div>
            </div>
            <form action={cikisYap} className="mt-3">
              <button className="btn-ghost h-[40px] w-full justify-center text-[12.5px]">
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
