import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";

const DURUM_MESAJ: Record<string, { baslik: string; metin: string }> = {
  onay_bekliyor: {
    baslik: "Hesabın onay bekliyor",
    metin:
      "Başvurun alındı. Ekibimiz hesabını doğrulayıp yetkilendirecek. Onaylandığında giriş yapıp paneline erişebilirsin.",
  },
  pasif: {
    baslik: "Hesabın pasif",
    metin: "Hesabın şu an pasif durumda. Yeniden etkinleştirme için bizimle iletişime geç.",
  },
  askida: {
    baslik: "Hesabın askıya alındı",
    metin: "Hesabın geçici olarak askıya alındı. Detay için bizimle iletişime geç.",
  },
  arsivli: {
    baslik: "Hesabın arşivlendi",
    metin: "Hesabın arşivlendi. Yeniden açılması için bizimle iletişime geç.",
  },
};

export default async function HesapBekliyor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, durum")
    .eq("id", user.id)
    .single();
  if (profil?.durum === "aktif") redirect("/");

  const m = DURUM_MESAJ[profil?.durum ?? "onay_bekliyor"] ?? DURUM_MESAJ.onay_bekliyor;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-paper px-6 py-16 relative">
      <div className="izgara-doku absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="glass-card rounded-2xl p-8 max-w-md text-center shadow-cardlg relative z-10">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-teal-soft border border-teal/20 relative">
          <span className="size-4 rounded-full bg-teal animate-ping absolute opacity-75" />
          <span className="size-3.5 rounded-full bg-teal shadow-[0_0_10px_var(--color-teal)]" />
        </span>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">{m.baslik}</h1>
        <p className="mt-3 text-sm text-gray/80 leading-relaxed">{m.metin}</p>
        
        {profil?.ad && (
          <p className="mt-4 font-mono text-xs text-teal/80 border border-teal/20 bg-teal-soft rounded-lg px-3 py-1.5 inline-block">
            {profil.ad}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <a
            href="https://wa.me/905444790787?text=Merhaba,%2520ProjePazar%2520denetimli%2520hesap%2520aktivasyonu%2520istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="btn rounded-xl bg-teal text-navy font-semibold py-3 text-sm transition-all duration-300 hover:bg-teal/90 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
          >
            <svg className="size-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 1.993 14.137.973 11.52.973c-5.437 0-9.859 4.373-9.864 9.803-.002 1.757.475 3.468 1.385 4.988L2.082 21.82l6.565-1.666zM17.29 14.7c-.283-.143-1.67-.82-1.929-.915-.258-.094-.446-.142-.634.143-.188.283-.729.915-.892 1.102-.163.189-.327.213-.61.072-2.046-1.023-3.4-1.918-4.755-4.249-.356-.61.356-.566 1.02-1.888.106-.212.053-.399-.026-.541-.079-.142-.633-1.526-.867-2.09-.228-.548-.46-.473-.633-.482-.164-.008-.352-.01-.54-.01s-.494.07-.753.353c-.259.283-.988.962-.988 2.348s1.009 2.72 1.15 2.908c.141.189 1.984 3.01 4.806 4.217.672.287 1.196.459 1.603.589.675.215 1.29.185 1.776.113.541-.08 1.67-.68 1.905-1.339.235-.66.235-1.226.165-1.343-.07-.118-.282-.189-.564-.332z"/>
            </svg>
            WhatsApp ile Hızlı Aktive Et
          </a>
          <form action={cikisYap} className="w-full">
            <button className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10">
              Çıkış yap
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
