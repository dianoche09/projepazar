import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panelYolu } from "@/lib/roller";

/** Berrak Güven imza öğesi: 3×3 ızgara, ortadaki yeşil (tazelik sinyali). */
function GridMark() {
  return (
    <span className="grid grid-cols-3 gap-1" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green" : "bg-navy/25"}`} />
      ))}
    </span>
  );
}

function SinyalRozet({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-card px-3 py-1">
      <span className={`size-2 rounded-full ${renk}`} />
      {etiket}
    </span>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Girişliyse doğrudan kendi kokpitine — ara landing yok
  if (user) {
    const { data } = await supabase.from("profiles").select("rol, durum").eq("id", user.id).single();
    if (data && data.durum !== "aktif") redirect("/hesap-bekliyor");
    redirect(panelYolu(data?.rol));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-3">
        <GridMark />
        <span className="font-display text-2xl font-semibold text-navy">ProjePazar</span>
      </div>

      <h1 className="max-w-2xl text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
        Çok-müteahhitli canlı konut stoğu dağıtım ağı
      </h1>

      <p className="max-w-xl text-balance text-gray">
        İlan portalı değiliz — müteahhidin <b className="text-ink">canlı stok kontrol merkezi</b> ve
        danışman ağına güvenilir dağıtım altyapısı. <b className="text-ink">Komisyona dokunmayız;</b>{" "}
        danışman ve ofis için ücretsiz.
      </p>
      <p className="max-w-xl text-balance text-xs text-gray">
        Tek doğru kaynak · granüler tahsis · çift-satış kalkanı · görünür tazelik — gayrimenkulün güven protokolü.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-sm text-ink">
        <SinyalRozet renk="bg-green" etiket="müsait" />
        <SinyalRozet renk="bg-amber" etiket="opsiyon" />
        <SinyalRozet renk="bg-red" etiket="satıldı" />
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="btn rounded-xl bg-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-ink">
          Giriş yap
        </Link>
        <Link href="/kayit" className="btn rounded-xl border border-hair bg-card px-6 py-3 font-semibold text-navy transition-colors hover:border-teal">
          Kayıt ol
        </Link>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray">
        <Link href="/kullanim-kosullari" className="transition-colors hover:text-ink hover:underline">Kullanım Koşulları</Link>
        <Link href="/gizlilik" className="transition-colors hover:text-ink hover:underline">Gizlilik</Link>
        <Link href="/kvkk-aydinlatma" className="transition-colors hover:text-ink hover:underline">KVKK Aydınlatma</Link>
      </footer>
    </main>
  );
}
