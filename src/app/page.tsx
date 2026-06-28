import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panelYolu } from "@/lib/roller";

/** Dört DEĞİŞMEZ — güven protokolünün ilkeleri (bilgilendirme + GEO içeriği). */
const OZELLIKLER: { baslik: string; metin: string; sinyal: string }[] = [
  {
    baslik: "Tek doğru kaynak",
    metin:
      "Fiyat ve durum yalnız birim kaydında. Paylaşımda fiyat canlı değerden basılır — hiçbir yerde kopya, hiçbir yerde eski fiyat.",
    sinyal: "bg-teal",
  },
  {
    baslik: "Granüler tahsis",
    metin:
      "Hangi proje, blok ya da daire kime açık, üretici belirler. Danışman yalnız kendisine tahsisli birimleri canlı havuzda görür.",
    sinyal: "bg-navy",
  },
  {
    baslik: "Çift-satış kalkanı",
    metin:
      "Aktif opsiyon veritabanı seviyesinde kilitlenir. İki danışman aynı daireyi aynı anda satışa kilitleyemez — uygulamaya değil, DB'ye güvenir.",
    sinyal: "bg-red",
  },
  {
    baslik: "Görünür tazelik",
    metin:
      "Her güncelleme zaman damgalı. Stok bayatladıkça rozet yeşilden sarıya döner; danışman her zaman canlı veriyle satış yapar.",
    sinyal: "bg-green",
  },
];

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
    <main className="flex flex-1 flex-col bg-paper min-h-screen relative">
      {/* Background blueprint grid */}
      <div className="izgara-doku absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden />

      {/* Hero section with aurora and glowing effects */}
      <section className="aurora relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#030712] via-[#090d16] to-[#020617] px-6 py-24 text-center sm:py-32 border-b border-white/5">
        {/* Glow dots on backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-teal/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="belir relative z-10 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md shadow-card">
          <span className="grid grid-cols-3 gap-1" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={`size-2 rounded-[2px] ${i === 4 ? "bg-green nabiz shadow-[0_0_10px_var(--color-green)]" : "bg-white/20"}`} />
            ))}
          </span>
          <span className="font-display text-sm font-semibold tracking-wide text-white/90">PROJEPAZAR PLATFORMU</span>
        </div>

        <h1 className="belir belir-1 relative z-10 mt-10 max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gradient sm:text-6xl">
          Çok-müteahhitli canlı <br />
          <span className="text-gradient-cyan">konut stoğu dağıtım ağı</span>
        </h1>

        <p className="belir belir-2 relative z-10 mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray/80 sm:text-lg">
          İlan portalı değiliz — müteahhidin canlı stok kontrol merkezi ve danışman ağına güvenilir
          dağıtım altyapısı. Komisyona dokunmayız; danışman ve ofis için ücretsiz.
        </p>

        {/* Custom status indicators */}
        <div className="belir belir-3 relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          {(
            [
              ["bg-green shadow-[0_0_8px_var(--color-green)]", "müsait / canlı"],
              ["bg-amber shadow-[0_0_8px_var(--color-amber)]", "opsiyon / kilitli"],
              ["bg-red shadow-[0_0_8px_var(--color-red)]", "satıldı / onaylı"],
            ] as [string, string][]
          ).map(([renk, etiket]) => (
            <span
              key={etiket}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 text-white/70"
            >
              <span className={`size-2 rounded-full ${renk}`} /> {etiket}
            </span>
          ))}
        </div>

        {/* Clean, premium CTAs */}
        <div className="belir belir-4 relative z-10 mt-12 flex items-center gap-4">
          <Link
            href="/login"
            className="btn rounded-xl bg-teal px-8 py-3.5 font-semibold text-navy transition-all duration-300 hover:bg-teal/90 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
          >
            Giriş yap
          </Link>
          <Link
            href="/kayit"
            className="btn rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10"
          >
            Kayıt ol
          </Link>
        </div>
      </section>

      {/* DEĞİŞMEZLER — güven protokolü */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28 relative">
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-green/5 blur-[120px] rounded-full pointer-events-none" />
        
        <h2 className="text-center font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Gayrimenkulün güven protokolü
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-center text-sm leading-relaxed text-gray/80">
          Dört değişmez ilke ProjePazar&apos;ı tekil bir CRM, portal ya da broker değil — saf,
          tarafsız dağıtım altyapısı yapar.
        </p>

        {/* Glass cards layout */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OZELLIKLER.map((o, i) => (
            <div
              key={o.baslik}
              style={{ animationDelay: `${i * 0.06}s` }}
              className="belir glass-card glass-card-hover relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
            >
              <span className={`absolute inset-x-0 top-0 h-[2px] ${o.sinyal}`} aria-hidden />
              <h3 className="font-display text-base font-semibold text-white tracking-wide mt-2">{o.baslik}</h3>
              <p className="mt-3 text-xs leading-relaxed text-gray/70">{o.metin}</p>
            </div>
          ))}
        </div>

        {/* Bottom invitation layout */}
        <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md px-6 py-10 text-center max-w-3xl mx-auto shadow-card">
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-gray/80">
            Müteahhitseniz stoğunuzu tek noktadan yönetin; danışmansanız yalnız size tahsisli
            projeleri canlı havuzdan paylaşın. Kapalı devre, davetli B2B ağ.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/kayit"
              className="btn rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-navy transition-all duration-300 hover:bg-teal/90"
            >
              Hesap oluştur
            </Link>
            <Link
              href="/login"
              className="btn rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      {/* Redesigned Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#020617]/50 backdrop-blur-md flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-10 text-xs text-gray/50">
        <Link href="/kullanim-kosullari" className="transition-colors hover:text-white/80 hover:underline">
          Kullanım Koşulları
        </Link>
        <Link href="/gizlilik" className="transition-colors hover:text-white/80 hover:underline">
          Gizlilik
        </Link>
        <Link href="/kvkk-aydinlatma" className="transition-colors hover:text-white/80 hover:underline">
          KVKK Aydınlatma
        </Link>
        <span className="ml-auto text-gray/40">© 2026 ProjePazar • Tüm Hakları Saklıdır.</span>
      </footer>
    </main>
  );
}
