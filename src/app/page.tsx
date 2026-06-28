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
    <main className="flex flex-1 flex-col">
      {/* HERO — navy komuta bandı (aurora + blueprint ızgara) */}
      <section className="aurora relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy to-ink px-6 py-20 text-center sm:py-28">
        <div className="izgara-doku pointer-events-none absolute inset-0 opacity-50" aria-hidden />

        <div className="belir relative z-10 flex items-center gap-3">
          <span className="grid grid-cols-3 gap-1" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green nabiz" : "bg-white/25"}`} />
            ))}
          </span>
          <span className="font-display text-2xl font-semibold text-white">ProjePazar</span>
        </div>

        <h1 className="belir belir-1 relative z-10 mt-8 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl">
          Çok-müteahhitli canlı konut stoğu dağıtım ağı
        </h1>

        <p className="belir belir-2 relative z-10 mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/75">
          İlan portalı değiliz — müteahhidin canlı stok kontrol merkezi ve danışman ağına güvenilir
          dağıtım altyapısı. Komisyona dokunmayız; danışman ve ofis için ücretsiz.
        </p>

        <div className="belir belir-3 relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2.5 font-mono text-sm">
          {(
            [
              ["bg-green", "müsait"],
              ["bg-amber", "opsiyon"],
              ["bg-red", "satıldı"],
            ] as [string, string][]
          ).map(([renk, etiket]) => (
            <span
              key={etiket}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/85"
            >
              <span className={`size-2 rounded-full ${renk}`} /> {etiket}
            </span>
          ))}
        </div>

        <div className="belir belir-4 relative z-10 mt-9 flex items-center gap-3">
          <Link
            href="/login"
            className="btn rounded-xl bg-white px-6 py-3 font-semibold text-navy transition-colors hover:bg-white/90"
          >
            Giriş yap
          </Link>
          <Link
            href="/kayit"
            className="btn rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5"
          >
            Kayıt ol
          </Link>
        </div>
      </section>

      {/* DEĞİŞMEZLER — güven protokolü (bilgilendirme + GEO) */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          Gayrimenkulün güven protokolü
        </h2>
        <p className="mx-auto mt-2.5 max-w-xl text-pretty text-center text-sm leading-relaxed text-gray">
          Dört değişmez ilke ProjePazar&apos;ı tekil bir CRM, portal ya da broker değil — saf,
          tarafsız dağıtım altyapısı yapar.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OZELLIKLER.map((o, i) => (
            <div
              key={o.baslik}
              style={{ animationDelay: `${i * 0.06}s` }}
              className="belir relative overflow-hidden rounded-2xl border border-hair bg-card p-5 shadow-card"
            >
              <span className={`absolute inset-x-0 top-0 h-0.5 ${o.sinyal}`} aria-hidden />
              <h3 className="font-display text-base font-semibold text-ink">{o.baslik}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray">{o.metin}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-hair bg-soft px-6 py-8 text-center">
          <p className="max-w-lg text-pretty text-sm leading-relaxed text-ink">
            Müteahhitseniz stoğunuzu tek noktadan yönetin; danışmansanız yalnız size tahsisli
            projeleri canlı havuzdan paylaşın. Kapalı devre, davetli B2B ağ.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/kayit"
              className="btn rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink"
            >
              Hesap oluştur
            </Link>
            <Link
              href="/login"
              className="btn rounded-xl border border-hair bg-card px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-teal"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-8 text-xs text-gray">
        <Link href="/kullanim-kosullari" className="transition-colors hover:text-ink hover:underline">
          Kullanım Koşulları
        </Link>
        <Link href="/gizlilik" className="transition-colors hover:text-ink hover:underline">
          Gizlilik
        </Link>
        <Link href="/kvkk-aydinlatma" className="transition-colors hover:text-ink hover:underline">
          KVKK Aydınlatma
        </Link>
      </footer>
    </main>
  );
}
