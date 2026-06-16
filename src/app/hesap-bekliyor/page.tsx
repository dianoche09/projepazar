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
    <main className="flex min-h-[80vh] flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-amber/15">
          <span className="size-3 animate-pulse rounded-full bg-amber" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink">{m.baslik}</h1>
        <p className="mt-2 text-sm text-gray">{m.metin}</p>
        {profil?.ad ? <p className="mt-4 font-medium text-ink">{profil.ad}</p> : null}
        <form action={cikisYap} className="mt-8">
          <button className="rounded-lg border border-hair px-5 py-2.5 font-medium text-navy transition-colors hover:border-teal">
            Çıkış yap
          </button>
        </form>
      </div>
    </main>
  );
}
