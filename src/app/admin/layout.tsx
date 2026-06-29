import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { Logo } from "@/components/Logo";
import { ToastSaglayici } from "@/components/ui/Toast";
import { AdminNav } from "./AdminNav";

/** Admin workspace — yalnız 'admin' (BİZ/platform işletmecisi). Spatial sidebar (v2-admin). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase.from("profiles").select("ad, rol").eq("id", user.id).single();
  if (!profil || profil.rol !== "admin") redirect("/");

  const { count: onayBekleyen } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("durum", "onay_bekliyor");
  const { count: belgeBekleyen } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("belge_durumu", "beklemede");

  const ad = profil.ad ?? user.email ?? "Yönetici";
  const basHarf = ad.trim().slice(0, 2).toUpperCase() || "PA";

  return (
    <ToastSaglayici>
      <div className="flex min-h-screen bg-paper">
        {/* Spatial sidebar — 258px, cam yüzey, dolu nav (v2-admin) */}
        <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col border-r border-hair bg-card/55 px-4 py-5 backdrop-blur-xl md:flex">
          <Link href="/admin" className="mb-5 inline-flex px-1.5 pt-1">
            <Logo size={30} wordmark />
          </Link>

          <AdminNav onayBekleyen={onayBekleyen ?? 0} belgeBekleyen={belgeBekleyen ?? 0} />

          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-hair bg-card p-2.5 shadow-card">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-[13px] font-bold text-white" style={{ background: "linear-gradient(150deg,#1b5e6e,#1e9b8a)" }}>
                {basHarf}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13.5px] font-semibold text-ink">{ad}</p>
                <p className="text-[11px] text-gray">Platform İşletmecisi</p>
              </div>
              <form action={cikisYap}>
                <button title="Çıkış" className="flex rounded-lg p-1.5 text-gray transition-colors hover:bg-soft hover:text-ink">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hair bg-card/95 px-4 py-2.5 backdrop-blur md:hidden">
            <Link href="/admin" className="inline-flex">
              <Logo size={22} wordmark />
            </Link>
            <form action={cikisYap}>
              <button className="rounded-lg border border-hair px-2.5 py-1.5 text-sm font-medium text-navy">Çıkış</button>
            </form>
          </header>
          <div className="border-b border-hair bg-card px-3 py-2 md:hidden">
            <AdminNav mobil onayBekleyen={onayBekleyen ?? 0} belgeBekleyen={belgeBekleyen ?? 0} />
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastSaglayici>
  );
}
