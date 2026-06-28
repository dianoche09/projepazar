import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panelYolu } from "@/lib/roller";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "ProjePazar — Çok-müteahhitli canlı konut stoğu dağıtım ağı",
  description:
    "İlan portalı değil: müteahhidin canlı stok komuta merkezi ve danışman ağına güvenilir dağıtım altyapısı. Tek doğru kaynak, granüler tahsis, çift-satış kalkanı, görünür tazelik. Komisyonsuz; danışman ve ofis için ücretsiz.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ProjePazar — Çok-müteahhitli canlı konut stoğu dağıtım ağı",
    description:
      "Müteahhidin canlı stok komuta merkezi, danışman ağına güvenilir dağıtım altyapısı. Komisyonsuz; danışmana ücretsiz.",
    type: "website",
    siteName: "ProjePazar",
  },
};

/** Üst menü navigasyon linkleri — sayfa içi #anchor. */
const NAV: { etiket: string; href: string }[] = [
  { etiket: "Özellikler", href: "#ozellikler" },
  { etiket: "Nasıl Çalışır", href: "#nasil-calisir" },
  { etiket: "Kimler İçin", href: "#kimler-icin" },
  { etiket: "İletişim", href: "#iletisim" },
];

/** Dört DEĞİŞMEZ — güven protokolünün ilkeleri (bilgilendirme + GEO içeriği). */
const OZELLIKLER: { baslik: string; metin: string; sinyal: string; ikon: string }[] = [
  {
    baslik: "Tek doğru kaynak",
    metin:
      "Fiyat ve durum yalnız birim kaydında tutulur. Paylaşımda fiyat canlı değerden basılır — hiçbir yerde kopya, hiçbir yerde eski fiyat. İki ekranda iki farklı rakam imkânsız.",
    sinyal: "var(--color-teal)",
    ikon: "M5 12h14M12 5v14",
  },
  {
    baslik: "Granüler tahsis",
    metin:
      "Hangi proje, blok ya da daire kime açık — üretici belirler. Danışman yalnız kendisine tahsisli birimleri tek canlı havuzda görür; gerisi görünmez, RLS ile veritabanı seviyesinde korunur.",
    sinyal: "var(--color-navy)",
    ikon: "M4 6h16M4 12h10M4 18h7",
  },
  {
    baslik: "Çift-satış kalkanı",
    metin:
      "Aktif opsiyon veritabanı seviyesinde kilitlenir. İki danışman aynı daireyi aynı anda satışa kilitleyemez — uygulama katmanına değil, DB'deki tekil indekse güvenir.",
    sinyal: "var(--color-red)",
    ikon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z",
  },
  {
    baslik: "Görünür tazelik",
    metin:
      "Her güncelleme zaman damgalı. Stok bayatladıkça rozet yeşilden sarıya döner; danışman her zaman canlı veriyle, müteahhit her zaman güncel kontrolle satış yapar.",
    sinyal: "var(--color-green)",
    ikon: "M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

/** Nasıl çalışır — 4 adım canlı akış. */
const ADIMLAR: { no: string; baslik: string; metin: string }[] = [
  {
    no: "01",
    baslik: "Üretici stoğu yükler",
    metin:
      "Müteahhit projesini, bloklarını ve birimlerini tek noktadan sisteme alır. Fiyat, durum ve özellikler tek doğru kaynakta toplanır.",
  },
  {
    no: "02",
    baslik: "Tahsis eder",
    metin:
      "Hangi danışman ya da ofisin hangi projeye, bloğa veya daireye erişeceğini üretici belirler. Görünürlük tamamen tahsise bağlıdır.",
  },
  {
    no: "03",
    baslik: "Danışman canlı havuzdan paylaşır",
    metin:
      "Danışman yalnız kendisine açık birimleri canlı havuzda görür ve müşterisine paylaşır. Paylaşımda fiyat o anki canlı değerden basılır.",
  },
  {
    no: "04",
    baslik: "Opsiyon → satış kapanır",
    metin:
      "Danışman daireyi opsiyona kilitler; çift-satış kalkanı çakışmayı engeller. Satış onaylandığında stok anında güncellenir, herkes aynı gerçeği görür.",
  },
];

/** Kimler için — üç müşteri rolü. */
const ROLLER: { rol: string; baslik: string; metin: string; sinyal: string }[] = [
  {
    rol: "Üretici / Müteahhit",
    baslik: "Stoğun komuta merkezi",
    metin:
      "Tüm projelerinizi, fiyatı ve dağıtımı tek panelden yönetin. Kime ne açtığınızı siz belirleyin; satışı canlı izleyin. Ana iş ortağımız sizsiniz.",
    sinyal: "var(--color-navy)",
  },
  {
    rol: "Ofis / Franchise",
    baslik: "Ekip ve portföy yönetimi",
    metin:
      "Danışman ekibinizin erişimini ve performansını tek yerden görün. Tahsisli projeleri ekibe dağıtın, satış hattını takip edin.",
    sinyal: "var(--color-teal)",
  },
  {
    rol: "Danışman / Emlakçı",
    baslik: "Daima canlı, daima ücretsiz",
    metin:
      "Size tahsisli projeleri tek canlı havuzdan görün, tek dokunuşla paylaşın. Eski fiyatla rezil olmayın. Başlangıçta tamamen ücretsiz.",
    sinyal: "var(--color-green)",
  },
];

/** Proje render showcase — üretilmiş görseller. */
const SHOWCASE: { src: string; ad: string; etiket: string }[] = [
  { src: "/gorseller/proje-cankaya-vadi.jpg", ad: "Çankaya Vadi", etiket: "müsait" },
  { src: "/gorseller/proje-kule-rezidans.jpg", ad: "Kule Rezidans", etiket: "opsiyon" },
  { src: "/gorseller/proje-sahil-konutlari.jpg", ad: "Sahil Konutları", etiket: "müsait" },
  { src: "/gorseller/proje-bahce-evleri.jpg", ad: "Bahçe Evleri", etiket: "satıldı" },
  { src: "/gorseller/proje-test-konaklari.jpg", ad: "Konakları", etiket: "müsait" },
];

const ETIKET_RENK: Record<string, string> = {
  "müsait": "bg-green",
  "opsiyon": "bg-amber",
  "satıldı": "bg-red",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Girişliyse doğrudan kendi kokpitine — ara landing yok (DEĞİŞMEZ)
  if (user) {
    const { data } = await supabase.from("profiles").select("rol, durum").eq("id", user.id).single();
    if (data && data.durum !== "aktif") redirect("/hesap-bekliyor");
    redirect(panelYolu(data?.rol));
  }

  return (
    <main className="flex flex-1 flex-col bg-paper text-ink">
      {/* ============ KLASİK ÜST MENÜ (sticky) ============ */}
      <header className="sticky top-0 z-50 border-b border-[var(--cizgi)] bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label="ProjePazar ana sayfa" className="shrink-0">
            <Logo size={26} wordmark />
          </Link>

          {/* Orta linkler — masaüstü */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-[rgba(16,36,58,0.05)] hover:text-ink"
              >
                {n.etiket}
              </a>
            ))}
          </div>

          {/* Sağ CTA'lar */}
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              Giriş yap
            </Link>
            <Link href="/kayit" className="btn-action">
              Kayıt ol
            </Link>
          </div>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gorseller/hero-arkaplan.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        {/* koyu degrade overlay — derinlik + okunabilirlik */}
        <div
          className="absolute inset-0 -z-10"
          aria-hidden
          style={{
            background:
              "linear-gradient(180deg, rgba(8,20,34,0.82) 0%, rgba(10,26,42,0.78) 45%, rgba(14,36,58,0.92) 100%)",
          }}
        />
        <div className="izgara-doku absolute inset-0 -z-10 opacity-[0.12]" aria-hidden />

        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-24 text-center sm:px-6 sm:py-32">
          <span className="belir inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <span className="grid grid-cols-3 gap-1" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className={`size-1.5 rounded-[2px] ${i === 4 ? "bg-green nabiz" : "bg-white/30"}`}
                />
              ))}
            </span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
              ProjePazar Platformu
            </span>
          </span>

          <h1 className="belir belir-1 mt-9 max-w-4xl font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl">
            Çok-müteahhitli canlı
            <br />
            <span className="bg-gradient-to-r from-[#37c178] via-[#3fd9c2] to-[#5ec8ff] bg-clip-text text-transparent">
              konut stoğu dağıtım ağı
            </span>
          </h1>

          <p className="belir belir-2 mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
            İlan portalı değiliz. Müteahhidin canlı stok komuta merkezi ve danışman ağına güvenilir
            dağıtım altyapısı. Üretici stoğu, fiyatı ve dağıtımı tek noktadan yönetir; danışman yalnız
            kendisine tahsisli projeleri tek canlı havuzdan görür ve paylaşır.
          </p>

          {/* Sinyal rozetleri */}
          <div className="belir belir-3 mt-8 flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs">
            {(
              [
                ["bg-green", "müsait / canlı"],
                ["bg-amber", "opsiyon / kilitli"],
                ["bg-red", "satıldı / onaylı"],
              ] as [string, string][]
            ).map(([renk, etiket]) => (
              <span
                key={etiket}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-white/85 backdrop-blur-md"
              >
                <span className={`size-2 rounded-full ${renk}`} /> {etiket}
              </span>
            ))}
          </div>

          {/* CTA'lar */}
          <div className="belir belir-4 mt-11 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/kayit"
              className="btn-action h-12 w-full px-8 text-[15px] sm:w-auto"
            >
              Ücretsiz hesap oluştur
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-white/25 bg-white/10 px-8 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      {/* ============ (1) NE YAPAR ============ */}
      <section className="relative mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-28">
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">
          ProjePazar nedir?
        </p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Tekil bir CRM, portal ya da broker değil — saf dağıtım altyapısı
        </h2>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink-soft">
          <p>
            ProjePazar, çok sayıda müteahhidin konut stoğunu tek bir canlı havuzda topladığı,
            <strong className="font-semibold text-ink"> üretici-kontrollü bir dağıtım ağıdır</strong>.
            Müteahhit; projesini, fiyatını ve kimin neyi göreceğini tek noktadan yönetir. Her şeyin tek
            doğru kaynağı vardır: birim kaydı. Fiyat hiçbir yerde kopyalanmaz, paylaşımda her zaman canlı
            değerden basılır.
          </p>
          <p>
            Danışman tarafında ise her şey <strong className="font-semibold text-ink">tahsise</strong>{" "}
            bağlıdır. Bir danışman yalnız kendisine açılmış birimleri görür; gerisi sistemde olsa bile
            görünmez. Bu görünürlük kuralı uygulama katmanında değil, veritabanı seviyesinde (RLS) zorunlu
            kılınır — yani bir hata ya da kötüye kullanım stoğu sızdıramaz.
          </p>
          <p>
            Sonuç: <strong className="font-semibold text-ink">en hızlı satış yapılan, çift-satış riskini
            DB seviyesinde sıfırlayan bir güven protokolü</strong>. Komisyona dokunmayız; başlangıçta
            danışman ve ofis için ücretsizdir. WhatsApp ve yapay zekâ destekli akıllı dağıtım ise yol
            haritamızın bir sonraki fazıdır.
          </p>
        </div>
      </section>

      {/* ============ (2) DÖRT DEĞİŞMEZ İLKE ============ */}
      <section
        id="ozellikler"
        className="relative scroll-mt-20 border-y border-[var(--cizgi)] bg-white/55"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">
              Güven protokolü
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Dört değişmez ilke
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft">
              Bu dört ilke ProjePazar&apos;ı tarafsız ve güvenilir bir altyapı yapar — bozulması imkânsız,
              veritabanı seviyesinde garanti altında.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OZELLIKLER.map((o, i) => (
              <div
                key={o.baslik}
                style={{ animationDelay: `${i * 0.06}s`, ["--_sig" as string]: o.sinyal }}
                className="kart signal-top kart-3d belir flex flex-col p-6"
              >
                <span
                  className="inline-flex size-11 items-center justify-center rounded-2xl"
                  style={{ background: o.sinyal, opacity: 0.12 }}
                  aria-hidden
                />
                <span
                  className="-mt-[2.4rem] mb-5 inline-flex size-11 items-center justify-center"
                  aria-hidden
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={o.sinyal}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={o.ikon} />
                  </svg>
                </span>
                <h3 className="font-display text-base font-bold tracking-tight text-ink">{o.baslik}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{o.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ (3) NASIL ÇALIŞIR ============ */}
      <section id="nasil-calisir" className="relative scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">
              Akış
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Nasıl çalışır?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft">
              Stoktan satışa dört adım — her adımda tek doğru kaynak korunur, her değişiklik anında
              herkese yansır.
            </p>
          </div>

          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ADIMLAR.map((a, i) => (
              <li
                key={a.no}
                style={{ animationDelay: `${i * 0.06}s` }}
                className="kart kart-3d belir relative flex flex-col p-6"
              >
                <span className="font-mono text-3xl font-extrabold tracking-tight text-teal/30">
                  {a.no}
                </span>
                <h3 className="mt-3 font-display text-base font-bold tracking-tight text-ink">
                  {a.baslik}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{a.metin}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ (4) KİMLER İÇİN ============ */}
      <section
        id="kimler-icin"
        className="relative scroll-mt-20 border-y border-[var(--cizgi)] bg-white/55"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">
              Roller
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Kimler için?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft">
              Her rol kendi paneline girer; herkes yalnız kendi yetkisindeki canlı veriyi görür.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {ROLLER.map((r, i) => (
              <div
                key={r.rol}
                style={{ animationDelay: `${i * 0.07}s`, ["--_sig" as string]: r.sinyal }}
                className="kart signal-top kart-3d belir flex flex-col p-7"
              >
                <span
                  className="rozet self-start"
                  style={{ background: "var(--color-soft)", color: "var(--color-ink-soft)" }}
                >
                  {r.rol}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                  {r.baslik}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{r.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ (5) GÖRSEL SHOWCASE ŞERİDİ ============ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">
              Canlı portföy
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Her proje, tek havuzda canlı
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {SHOWCASE.map((p, i) => (
              <div
                key={p.ad}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`kart kart-3d belir group relative overflow-hidden p-0 ${
                  i === 4 ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={`${p.ad} projesi`}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  aria-hidden
                  style={{
                    background: "linear-gradient(180deg, transparent 45%, rgba(8,20,34,0.78) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3.5">
                  <span className="font-display text-sm font-bold text-white drop-shadow">{p.ad}</span>
                  <span
                    className={`size-2.5 rounded-full ${ETIKET_RENK[p.etiket]} ring-2 ring-white/40`}
                    title={p.etiket}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ (6) KOMİSYONSUZ + ÜCRETSİZ BANDI + CTA ============ */}
      <section id="iletisim" className="relative scroll-mt-20 px-5 pb-24 sm:px-6">
        <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] p-1">
          <div
            className="relative overflow-hidden rounded-[26px] px-6 py-16 text-center sm:px-12 sm:py-20"
            style={{
              background:
                "linear-gradient(140deg, #0d2438 0%, #16465a 50%, #1a8676 100%)",
            }}
          >
            <div className="izgara-doku absolute inset-0 opacity-[0.1]" aria-hidden />
            <div className="relative">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-white/90 backdrop-blur-md">
                  Komisyon yok
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-white/90 backdrop-blur-md">
                  Danışmana ücretsiz
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-white/90 backdrop-blur-md">
                  Davetli B2B ağ
                </span>
              </div>

              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Komisyon almıyoruz. Danışman ve ofis için ücretsiz.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/75">
                Müteahhitseniz stoğunuzu tek noktadan yönetin; danışmansanız yalnız size tahsisli
                projeleri canlı havuzdan paylaşın. Kapalı devre, davetli bir B2B ağa katılın.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/kayit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[13px] bg-white px-8 text-[15px] font-bold text-ink transition-all hover:bg-white/90 sm:w-auto"
                >
                  Hesap oluştur
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[13px] border border-white/25 bg-white/10 px-8 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto"
                >
                  Giriş yap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="mt-auto border-t border-[var(--cizgi)] bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-5 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Logo size={24} wordmark />
            <p className="max-w-xs text-center text-xs leading-relaxed text-ink-soft md:text-left">
              Çok-müteahhitli, üretici-kontrollü canlı konut stoğu dağıtım ağı.
            </p>
          </div>

          <nav
            aria-label="Yasal"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink-soft"
          >
            <Link href="/kullanim-kosullari" className="transition-colors hover:text-ink hover:underline">
              Kullanım Koşulları
            </Link>
            <Link href="/gizlilik" className="transition-colors hover:text-ink hover:underline">
              Gizlilik
            </Link>
            <Link href="/kvkk-aydinlatma" className="transition-colors hover:text-ink hover:underline">
              KVKK Aydınlatma
            </Link>
          </nav>
        </div>
        <div className="border-t border-[var(--cizgi)] px-5 py-5 text-center text-[11px] text-[var(--ink-faint)] sm:px-6">
          © 2026 ProjePazar — Tüm hakları saklıdır.
        </div>
      </footer>
    </main>
  );
}
