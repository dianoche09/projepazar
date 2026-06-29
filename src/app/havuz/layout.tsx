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

  // Havuz: emlakçı + admin + (Faz-1'de ayrı paneli olmayan) ofis/marka/arsa rolleri tahsisli stok görür.
  const HAVUZ_ROL = ["emlakci", "admin", "ofis_yetkili", "marka_yetkili", "arsa_sahibi"];
  const { data: profil } = await supabase.from("profiles").select("ad, rol, belge_durumu").eq("id", user.id).single();
  if (!profil || !HAVUZ_ROL.includes(profil.rol)) {
    redirect(profil ? panelYolu(profil.rol) : "/");
  }
  const adminMi = profil.rol === "admin";
  const dogrulanmadi = !adminMi && profil.belge_durumu !== "dogrulandi";
  const ad = profil.ad ?? user.email ?? "Emlakçı";
  const basHarf = ad.trim().charAt(0).toUpperCase() || "E";

  const canliRozet = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green/40 bg-green-soft px-2.5 py-1 font-mono text-[11px] text-teal-d">
      <span className="nabiz size-1.5 rounded-full bg-green" /> canlı
    </span>
  );

  return (
    <ToastSaglayici>
      <div className="flex min-h-screen bg-paper text-slate-800">
        {/* Masaüstü sidebar — v2-emlakci (spatial 258px), üretici ile aynı yüzey:
            yarı-saydam beyaz panel + sağ ayraç + blur → içerikten (paper) net ayrışır. */}
        <aside
          className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col gap-2 border-r border-[var(--cizgi)] px-4 py-6 backdrop-blur-xl md:flex"
          style={{ background: "rgba(255,255,255,.72)" }}
        >
          {/* Marka */}
          <div className="mb-7 flex items-center gap-3 px-3">
            <Link href="/havuz" className="inline-flex">
              <Logo size={26} wordmark />
            </Link>
          </div>

          {/* Navigasyon */}
          <div className="flex-1 overflow-y-auto">
            <EmlakciNav />
          </div>

          {/* Tahsisli Erişim — kapsam/rol sınırı notu */}
          <div
            className="mb-2 rounded-[14px] px-3.5 py-3 text-[11px] leading-relaxed"
            style={{ background: "rgba(30,155,138,.07)", border: "1px solid rgba(30,155,138,.16)", color: "var(--color-ink-soft)" }}
          >
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-teal">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Tahsisli Erişim
            </div>
            Yalnız sana tahsisli stoğu görürsün. Tahsis &amp; fiyat üreticide.
          </div>

          {/* Kullanıcı kartı + Çıkış */}
          <div className="kart kart-3d flex items-center gap-3 p-3" style={{ borderRadius: 18 }}>
            <span
              className="grid size-9 shrink-0 place-items-center rounded-[11px] font-display text-[14px] font-bold text-white"
              style={{ background: "linear-gradient(145deg,#13314b,#1e9b8a)" }}
            >
              {basHarf}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight text-slate-800">{ad}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-400">{adminMi ? "Admin · Danışman görünümü" : "Onaylı Danışman"}</div>
            </div>
            <form action={cikisYap}>
              <button
                title="Çıkış"
                className="grid size-8 place-items-center rounded-[10px] text-slate-400 transition hover:bg-[rgba(16,36,58,.06)] hover:text-red"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
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

          {dogrulanmadi ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/50 bg-amber-soft px-4 py-2.5 text-xs text-amber-700">
              <span className="font-semibold">Hesabın doğrulanmadı — yalnız demo projeyi görüyorsun.</span>
              <Link href="/havuz/dogrulama" className="shrink-0 font-bold text-amber-700 hover:underline">Belgeni yükle →</Link>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 pb-24 md:pb-8 px-4 py-6 md:px-8">{children}</main>
          <BottomNav />
        </div>
      </div>
    </ToastSaglayici>
  );
}
