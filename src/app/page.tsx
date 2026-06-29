import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panelYolu } from "@/lib/roller";
import { Logo } from "@/components/Logo";
import { HeroBina } from "@/components/HeroBina";
import { Sayaclar } from "@/components/Sayaclar";
import { CanliKomutaMerkezi } from "@/components/CanliKomutaMerkezi";
import { CanliHavuzDemo } from "@/components/CanliHavuzDemo";
import { PaylasimVitrin } from "@/components/PaylasimVitrin";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { ShieldCheck, Database, BadgeCheck, CircleSlash, Lock, FileCheck } from "lucide-react";

/** Proje anatomisi — proje sahibi ne yükler / danışman ne görür. */
const YUKLER = [
  "Proje künyesi: ad, konum, teslim tarihi, doğrulama",
  "Blok · kat · daire yapısı (bina kesiti)",
  "Tip · oda · net/brüt m² · cephe · manzara",
  "Liste fiyatı + ödeme planı (peşinat/taksit)",
  "Durum: müsait / opsiyon / satıldı",
  "Kat planı, görseller, video, broşür",
  "Tahsis: hangi daire kime açık",
];
const GORUR = [
  "Canlı stok + durum sinyalleri (yeşil/amber/kırmızı)",
  "Kat planı + net/brüt + cephe + kat",
  "Canlı fiyat + ödeme planı",
  '"● X önce" tazelik damgası',
  "Tek tıkla paylaş + opsiyon al",
  "Birebir canlı mikrosite linki",
  "Yalnız kendine açık daireler (gerisi gizli)",
];

/** Güven / teminat unsurları (sahte logo yerine dürüst güven). */
const GUVEN = [
  { Icon: ShieldCheck, b: "Çift-satış kalkanı", a: "Aktif opsiyon veritabanı seviyesinde kilitlenir; aynı daire iki kez satılamaz." },
  { Icon: Database, b: "RLS veri güvenliği", a: "Görünürlük veritabanı katmanında zorunlu; danışman yalnız kendine açılanı görür." },
  { Icon: BadgeCheck, b: "Doğrulanmış projeler", a: "Her proje doğrulama rozetiyle yayınlanır; kaynağı belirsiz ilan yok." },
  { Icon: CircleSlash, b: "Komisyon yok", a: "Satıştan pay almıyoruz; danışman için başlangıçta tamamen ücretsiz." },
  { Icon: Lock, b: "Kapalı, davetli ağ", a: "Son kullanıcıya açık ilan yok; paylaşım birebir, ağ davetli." },
  { Icon: FileCheck, b: "KVKK uyumlu", a: "Kişisel veri çizgisi nettir; piyasa zekâsı evet, müşteri profili hayır." },
];

const SITE = "https://projepazar.vercel.app";

export const metadata: Metadata = {
  title: "ProjePazar — Tüm projeler tek canlı havuzda | Gayrimenkul danışmanı ağı",
  description:
    "İlan portalı değil. Proje sahibi stoğunu ve fiyatını tek noktadan yönetir; gayrimenkul danışmanı canlı havuzdaki projeleri doğru fiyatla paylaşır. Yanlış fiyat yok, eksik bilgi yok, çift satış yok. Komisyonsuz; danışmana ücretsiz.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ProjePazar — Tüm projeler tek canlı havuzda",
    description:
      "Proje sahibi ve gayrimenkul danışmanlarını canlı, doğru veriyle buluşturan ağ. Yanlış fiyat yok, çift satış yok. Komisyonsuz; danışmana ücretsiz.",
    type: "website",
    siteName: "ProjePazar",
    url: SITE,
    locale: "tr_TR",
  },
  twitter: { card: "summary_large_image", title: "ProjePazar — Tüm projeler tek canlı havuzda" },
};

const NAV = [
  { etiket: "Nasıl çalışır", href: "#nasil-calisir" },
  { etiket: "Kimler için", href: "#kimler-icin" },
  { etiket: "Sık sorulanlar", href: "#sss" },
];

const FAYDA = {
  prod: {
    rol: "Proje sahibi için",
    baslik: "Kontrolü bırakmadan, her yere ulaş",
    alt: "Stoğun, fiyatın, dağıtımın tek elde.",
    sinyal: "var(--color-navy)",
    maddeler: [
      ["Yüzlerce danışmana tek noktadan ulaş", "herkes anında doğru fiyatı görür."],
      ["Markan yanlış bilgiyle yıpranmaz", "eski fiyat dolaşımda kalmaz."],
      ["Kime ne açık, sen belirlersin", "istersen belirli daireleri yalnız seçtiğin danışmanlara aç."],
      ["Satışı canlı izle", "hangi daire ilgi görüyor, ne zaman opsiyonlandı."],
    ],
  },
  cons: {
    rol: "Gayrimenkul danışmanı için",
    baslik: "Doğru daire, doğru fiyat, tek dokunuş",
    alt: "Canlı havuz, dağınık dosya yok, ücretsiz.",
    sinyal: "var(--color-teal)",
    maddeler: [
      ["Canlı havuzdaki projeler tek yerde", "dağınık Excel, eski PDF, WhatsApp yok."],
      ["Her zaman canlı fiyat", "eski fiyatla müşteri önünde rezil olma."],
      ["Tek dokunuşla paylaş", "fiyat o anki canlı değerden basılır."],
      ["Başlangıçta tamamen ücretsiz", "komisyon da yok."],
    ],
  },
} as const;

const ADIMLAR = [
  { no: "01", baslik: "Proje sahibi stoğunu yükler", metin: "Proje, blok ve daireler tek noktaya alınır. Fiyat ve durum tek doğru kaynakta toplanır." },
  { no: "02", baslik: "Canlı havuza açılır", metin: "Gayrimenkul danışmanları havuzdaki projeleri canlı görür. Proje sahibi isterse belirli daireleri yalnız seçtiği danışmanlara özel açar." },
  { no: "03", baslik: "Danışman müşterisine paylaşır", metin: "Danışman kendine açık daireleri tek dokunuşla iletir; fiyat o anki canlı değerden basılır." },
  { no: "04", baslik: "Opsiyon → satış kapanır", metin: "Daire opsiyona kilitlenir; çift-satış kalkanı çakışmayı engeller. Satışta stok anında güncellenir." },
];

const PORTFOY = [
  { src: "/gorseller/render-cankaya-vadi.jpg", ad: "Çankaya Vadi", konum: "Ankara · Çankaya", musait: 58, opsiyon: 22, satildi: 20, taze: "2 dk önce", sinyal: "▲ Yüksek talep", g: 58, a: 22, r: 20 },
  { src: "/gorseller/render-kule-rezidans.jpg", ad: "Kule Rezidans", konum: "İstanbul · Ataşehir", musait: 31, opsiyon: 14, satildi: 45, taze: "11 dk önce", sinyal: "▲ İlgi artıyor", g: 34, a: 16, r: 50 },
  { src: "/gorseller/render-sahil-konutlari.jpg", ad: "Sahil Konutları", konum: "İzmir · Çeşme", musait: 12, opsiyon: 8, satildi: 60, taze: "2 gün önce", sinyal: "Son birimler", g: 15, a: 10, r: 75, eski: true },
  { src: "/gorseller/render-meydan-park.jpg", ad: "Meydan Park", konum: "Ankara · Etimesgut", musait: 44, opsiyon: 9, satildi: 17, taze: "37 dk önce", sinyal: "Yeni açıldı", g: 62, a: 13, r: 25 },
];

const VS_KOTU = [
  "Fiyat 3 yerde 3 farklı, hangisi güncel belli değil",
  "Aynı daire iki danışmana satılır, sonra çakışma",
  "Eski PDF / ekran görüntüsü müşteriye gider, rezil olunur",
  "Proje sahibi kime ne gittiğini bilmez, kontrol yok",
];
const VS_IYI = [
  "Fiyat tek kaynakta; paylaşımda canlı değerden basılır",
  "Çift-satış kalkanı veritabanı seviyesinde kilitler",
  'Her veride "● X önce" — bayatladıkça rozet renk değiştirir',
  "Tahsis proje sahibinde — kim neyi görür, sen belirlersin",
];

const SSS: { s: string; c: string }[] = [
  { s: "ProjePazar bir ilan portalı mı?", c: "Hayır. ProjePazar, proje sahipleri ile gayrimenkul danışmanlarını canlı ve doğru veriyle buluşturan kapalı bir B2B ağdır. Son kullanıcıya açık ilan yoktur; paylaşım birebir/WhatsApp ile yapılır." },
  { s: "Gayrimenkul danışmanı için ücretli mi?", c: "Başlangıçta tamamen ücretsizdir ve hiçbir satıştan komisyon alınmaz. Danışman canlı havuzdaki projeleri görür ve müşterisine paylaşır." },
  { s: "Danışman hangi projeleri görür?", c: "Danışman, canlı havuzdaki projeleri görür. Proje sahibi isterse belirli daireleri veya projeleri yalnız seçtiği danışmanlara özel açabilir (tahsis)." },
  { s: "Fiyatlar nasıl güncel kalıyor?", c: "Fiyat yalnız birim kaydında tutulur; hiçbir yerde kopyalanmaz. Paylaşımda fiyat o anki canlı değerden basıldığı için eski fiyat dolaşıma giremez." },
  { s: "Aynı daire iki danışmana satılabilir mi?", c: "Hayır. Aktif opsiyon veritabanı seviyesinde kilitlenir; çift-satış kalkanı iki danışmanın aynı daireyi aynı anda satışa kilitlemesini engeller." },
  { s: "Proje sahibi neyi kontrol eder?", c: "Stoğunu, fiyatını ve kimin neyi göreceğini tek panelden yönetir; satışı canlı izler. Tüm bilgi tek doğru kaynaktadır." },
  { s: "Mobilde çalışır mı?", c: "Evet. ProjePazar mobil-önce bir uygulamadır (PWA); telefona kurulabilir, sahada hızlı ve çevrimdışına dayanıklı çalışır." },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE}/#org`, name: "ProjePazar", url: SITE, logo: `${SITE}/icon-512.png`, description: "Proje sahibi ve gayrimenkul danışmanlarını canlı, doğru veriyle buluşturan kapalı B2B konut stoğu ağı." },
      { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "ProjePazar", inLanguage: "tr-TR", publisher: { "@id": `${SITE}/#org` } },
      { "@type": "FAQPage", "@id": `${SITE}/#faq`, mainEntity: SSS.map((q) => ({ "@type": "Question", name: q.s, acceptedAnswer: { "@type": "Answer", text: q.c } })) },
    ],
  };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase.from("profiles").select("rol, durum").eq("id", user.id).single();
    if (data && data.durum !== "aktif") redirect("/hesap-bekliyor");
    redirect(panelYolu(data?.rol));
  }

  return (
    <main className="flex flex-1 flex-col bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />

      {/* ============ ÜST MENÜ ============ */}
      <header className="sticky top-0 z-50 border-b border-[var(--cizgi)] bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label="ProjePazar ana sayfa" className="shrink-0"><Logo size={26} wordmark /></Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-[rgba(16,36,58,0.05)] hover:text-ink">{n.etiket}</a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Giriş yap</Link>
            <MagneticButton href="/kayit" className="btn-action">Ücretsiz başla</MagneticButton>
          </div>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        <div className="hero-aurora" aria-hidden />
        <HeroBina />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-16 sm:px-6 lg:pb-28 lg:pt-28">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(30,155,138,0.22)] bg-[var(--color-teal-soft)] px-3.5 py-1.5 font-mono text-[11.5px] font-semibold text-[var(--color-teal-d)]">
              <span className="size-2 rounded-full bg-green nabiz" /> CANLI PROJE HAVUZU
            </span>
            <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.02] tracking-tight text-ink sm:text-[56px]">
              Tüm projeler, canlı.
              <br />
              <span className="text-teal">Tek doğru kaynak.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-soft sm:text-base">
              İlan portalı değiliz. <strong className="font-semibold text-ink">Proje sahibi</strong> stoğunu ve fiyatını tek noktadan kontrol eder; <strong className="font-semibold text-ink">gayrimenkul danışmanı</strong> canlı havuzdaki projeleri görür ve tek dokunuşla müşterisine paylaşır. Proje sahibi isterse belirli daireleri yalnız seçtiği danışmanlara açar. <strong className="font-semibold text-ink">Yanlış fiyat yok, eksik bilgi yok, çift satış yok.</strong>
            </p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
              <Link href="/kayit?rol=uretici" className="group flex flex-col gap-0.5 rounded-[15px] bg-navy p-4 text-white transition-all hover:-translate-y-0.5 hover:shadow-[var(--golge-3)]">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#7fd9c8]">Proje sahibiyim</span>
                <span className="font-display text-[15px] font-bold">Projemi yönetmeye başla →</span>
                <span className="text-[11px] leading-snug text-white/80">Fiyatı, daireleri ve kimin göreceğini tek panelden yönet.</span>
              </Link>
              <Link href="/kayit?rol=emlakci" className="group flex flex-col gap-0.5 rounded-[15px] border border-[var(--cizgi-2)] bg-white p-4 text-ink transition-all hover:-translate-y-0.5 hover:border-teal hover:shadow-[var(--golge-3)]">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-teal-d)]">Gayrimenkul danışmanıyım</span>
                <span className="font-display text-[15px] font-bold">Projeleri keşfet →</span>
                <span className="text-[11px] leading-snug text-ink-soft">Canlı projeleri gör, doğru fiyatla paylaş. Ücretsiz.</span>
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Komisyon yok", "Danışmana ücretsiz", "Çift-satış kalkanı"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cizgi-2)] bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-soft backdrop-blur-sm">
                  <span className="size-[5px] rounded-full bg-teal" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CANLI PORTFÖY ============ */}
      <section className="relative border-y border-[var(--cizgi)] bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Canlı portföy</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Her proje, tek havuzda canlı
                <span className="ml-2 inline-block rounded-md border border-[var(--cizgi-2)] bg-white px-2 py-0.5 align-middle font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">örnek</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Her proje bir mini-panel: müsait / opsiyon / satıldı dağılımı, son güncelleme, talep sinyali.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PORTFOY.map((p, i) => (
              <Reveal key={p.ad} delay={i * 80}>
                <div className="kart kart-3d group flex h-full flex-col overflow-hidden p-0">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={`${p.ad} projesi`} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" aria-hidden style={{ background: "linear-gradient(180deg, transparent 50%, rgba(8,20,34,0.55) 100%)" }} />
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-[rgba(30,155,138,0.92)] px-2 py-0.5 text-[10px] font-semibold text-white">✓ Doğrulanmış</span>
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="font-display text-sm font-bold text-white drop-shadow">{p.ad}</div>
                      <div className="text-[11px] text-white/90">{p.konum}</div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="mb-2.5 flex gap-4">
                      <div className="flex flex-col"><b className="font-mono text-[17px] font-semibold text-green">{p.musait}</b><span className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink-faint)]">Müsait</span></div>
                      <div className="flex flex-col"><b className="font-mono text-[17px] font-semibold text-amber">{p.opsiyon}</b><span className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink-faint)]">Opsiyon</span></div>
                      <div className="flex flex-col"><b className="font-mono text-[17px] font-semibold text-red">{p.satildi}</b><span className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink-faint)]">Satıldı</span></div>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-md bg-[rgba(16,36,58,0.07)]">
                      <span className="block h-full bg-green" style={{ width: `${p.g}%` }} />
                      <span className="block h-full bg-amber" style={{ width: `${p.a}%` }} />
                      <span className="block h-full bg-red" style={{ width: `${p.r}%` }} />
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2.5">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${p.eski ? "text-[#9a6a12]" : "text-[#1f7d4c]"}`}>
                        <span className={`size-1.5 rounded-full ${p.eski ? "bg-amber" : "bg-green nabiz"}`} /> {p.taze}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-teal-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-teal-d)]">{p.sinyal}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ İSTATİSTİK ŞERİDİ ============ */}
      <section className="relative px-5 py-10 sm:px-6"><Sayaclar /></section>

      {/* ============ İKİ TARAFLI FAYDA ============ */}
      <section id="kimler-icin" className="relative scroll-mt-20 border-y border-[var(--cizgi)] bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">İki taraf, tek gerçek</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Aynı canlı bilgi —<br className="hidden sm:block" /> iki taraf da kazanır</h2>
              <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Proje sahibi kontrolü bırakmaz, danışman doğru veriyle satar. Tek doğru kaynak ikisini de korur.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[FAYDA.prod, FAYDA.cons].map((f, i) => (
              <Reveal key={f.rol} delay={i * 120}>
                <div className="kart signal-top flex h-full flex-col p-7" style={{ ["--_sig" as string]: f.sinyal }}>
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{f.rol}</p>
                  <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight text-ink">{f.baslik}</h3>
                  <p className="mb-4 mt-0.5 text-[13px] text-ink-soft">{f.alt}</p>
                  <ul className="flex flex-col gap-3">
                    {f.maddeler.map(([vurgu, devam]) => (
                      <li key={vurgu} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
                        <span className="mt-0.5 inline-grid size-5 flex-none place-items-center rounded-md bg-[var(--color-soft)] text-xs font-bold text-teal">✓</span>
                        <span><strong className="font-semibold">{vurgu}</strong> — {devam}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CANLI HAVUZ (tam genişlik interaktif) ============ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Canlı havuz · dene</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Bir daireye dokun, gerisini gör</h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Kat planı, net/brüt, cephe, ödeme planı ve canlı fiyat — hepsi tek tıkla açılır. Bina kesiti mi, tablo mu? Sen seç, daireye tıkla, detayı gör.</p>
            </div>
          </Reveal>
          <Reveal delay={100}><CanliHavuzDemo /></Reveal>
        </div>
      </section>

      {/* ============ TEK TIKLA PAYLAŞ (sosyal/birebir) ============ */}
      <section className="relative border-y border-[var(--cizgi)] bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal><PaylasimVitrin /></Reveal>
        </div>
      </section>

      {/* ============ NASIL ÇALIŞIR ============ */}
      <section id="nasil-calisir" className="relative scroll-mt-20 border-y border-[var(--cizgi)] bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Akış</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Nasıl çalışır?</h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Stoktan satışa dört adım — her adımda tek doğru kaynak korunur, her değişiklik anında herkese yansır.</p>
            </div>
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ADIMLAR.map((a, i) => (
              <Reveal key={a.no} delay={i * 90}>
                <li className="kart kart-3d relative flex h-full flex-col p-6">
                  <span className="font-mono text-3xl font-extrabold tracking-tight text-teal/30">{a.no}</span>
                  <h3 className="mt-3 font-display text-base font-bold tracking-tight text-ink">{a.baslik}</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{a.metin}</p>
                </li>
              </Reveal>
            ))}
          </ol>

          {/* proje anatomisi — akışın devamı: ne yüklenir / ne görülür */}
          <Reveal>
            <div className="mx-auto mt-20 max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Proje detayı</p>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Bir projede ne var, kim neyi görür?</h3>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Proje sahibi her şeyi tek noktadan yükler; gayrimenkul danışmanı satışa lazım olanı canlı görür.</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="kart signal-top flex h-full flex-col p-7" style={{ ["--_sig" as string]: "var(--color-navy)" }}>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">Proje sahibi yükler</p>
                <h4 className="mt-1.5 font-display text-lg font-bold tracking-tight text-ink">Tek panelden, eksiksiz</h4>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {YUKLER.map((y) => (<li key={y} className="flex gap-2.5 text-[13.5px] leading-snug text-ink"><span className="mt-0.5 inline-grid size-5 flex-none place-items-center rounded-md bg-[var(--color-navy-soft)] text-[11px] font-bold text-navy">↑</span>{y}</li>))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="kart signal-top flex h-full flex-col p-7" style={{ ["--_sig" as string]: "var(--color-teal)" }}>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">Gayrimenkul danışmanı görür</p>
                <h4 className="mt-1.5 font-display text-lg font-bold tracking-tight text-ink">Canlı, doğru, satışa hazır</h4>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {GORUR.map((g) => (<li key={g} className="flex gap-2.5 text-[13.5px] leading-snug text-ink"><span className="mt-0.5 inline-grid size-5 flex-none place-items-center rounded-md bg-[var(--color-teal-soft)] text-[11px] font-bold text-[var(--color-teal-d)]">✓</span>{g}</li>))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CANLI KOMUTA MERKEZİ (koyu) ============ */}
      <CanliKomutaMerkezi />

      {/* ============ PORTAL VS PROJEPAZAR ============ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Neden farklı</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">İlan portalı değil.<br className="hidden sm:block" /> Güven protokolü.</h2>
            </div>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[20px] border border-[var(--cizgi)] p-6" style={{ background: "linear-gradient(180deg,#fbf1ef,#f8e9e6)" }}>
                <p className="mb-3.5 flex items-center gap-2 font-display text-base font-bold text-[#a23f34]">⚠ Dağınık portal · Excel · WhatsApp</p>
                <ul className="flex flex-col">
                  {VS_KOTU.map((t) => (<li key={t} className="flex gap-2.5 border-t border-dashed border-[rgba(16,36,58,0.1)] py-2 text-[13.5px] text-ink first:border-t-0"><span className="font-bold text-red">✕</span> {t}</li>))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="kart h-full p-6">
                <p className="mb-3.5 flex items-center gap-2 font-display text-base font-bold text-[var(--color-teal-d)]">◆ ProjePazar</p>
                <ul className="flex flex-col">
                  {VS_IYI.map((t) => (<li key={t} className="flex gap-2.5 border-t border-dashed border-[rgba(16,36,58,0.1)] py-2 text-[13.5px] text-ink first:border-t-0"><span className="font-bold text-green">✓</span> {t}</li>))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ GÜVEN / TEMİNAT ============ */}
      <section className="relative isolate overflow-hidden border-t border-[var(--cizgi)] bg-white/55">
        <div className="mesh" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Güven protokolü</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Neden güvenli?</h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">Güven sözle değil, mimariyle. Her teminat veritabanı seviyesinde ya da kuralla garanti altında.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUVEN.map((g, i) => (
              <Reveal key={g.b} delay={(i % 3) * 90}>
                <div className="kart kart-3d flex h-full items-start gap-4 p-6">
                  <span className="inline-grid size-11 flex-none place-items-center rounded-2xl bg-[var(--color-teal-soft)]" aria-hidden>
                    <g.Icon size={22} strokeWidth={1.75} color="var(--color-teal-d)" />
                  </span>
                  <div>
                    <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">{g.b}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{g.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SSS ============ */}
      <section id="sss" className="relative scroll-mt-20 border-y border-[var(--cizgi)] bg-white/55">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal">Sık sorulanlar</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Aklındakiler</h2>
            </div>
          </Reveal>
          <div className="mt-12 flex flex-col gap-3">
            {SSS.map((q, i) => (
              <Reveal key={q.s} delay={i * 50}>
                <details className="sss-item kart p-0">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 font-display text-[15px] font-semibold text-ink">
                    {q.s}
                    <span className="ok flex-none text-teal" aria-hidden>▾</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{q.c}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ KAPANIŞ CTA ============ */}
      <section className="relative px-5 pb-24 pt-20 sm:px-6">
        <Reveal>
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px]">
            <div className="relative overflow-hidden rounded-[26px]" style={{ background: "linear-gradient(140deg, #0d2438 0%, #16465a 50%, #1a8676 100%)" }}>
              <div className="izgara-doku absolute inset-0 opacity-[0.1]" aria-hidden />
              <div className="relative grid items-center gap-8 px-6 py-14 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-12">
                {/* memnun danışman */}
                <div className="relative mx-auto hidden w-full max-w-[260px] lg:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/gorseller/danisman-1.jpg" alt="ProjePazar ağındaki bir gayrimenkul danışmanı" className="aspect-[4/5] w-full rounded-2xl border-4 border-white/15 object-cover shadow-[var(--golge-3)]" />
                  <div className="absolute -right-3 bottom-6 flex items-center gap-2 rounded-full border border-[var(--cizgi)] bg-white px-3 py-2 shadow-[var(--golge-2)]">
                    <span className="size-2 rounded-full bg-green nabiz" />
                    <span className="font-mono text-[11px] font-semibold text-ink">canlı fiyatla paylaştı</span>
                  </div>
                </div>
                {/* mesaj + CTA */}
                <div className="text-center lg:text-left">
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs lg:justify-start">
                    {["Komisyon yok", "Danışmana ücretsiz", "Kapalı B2B ağ"].map((t) => (
                      <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-white/90 backdrop-blur-md">{t}</span>
                    ))}
                  </div>
                  <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">Tüm projeler tek canlı havuzda. Sen de katıl.</h2>
                  <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/75">Proje sahibiysen stoğunu tek noktadan yönet; gayrimenkul danışmanıysan canlı projeleri doğru fiyatla paylaş. Kapalı, davetli bir B2B ağa katıl.</p>
                  <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                    <Link href="/kayit?rol=uretici" className="inline-flex h-12 w-full items-center justify-center rounded-[13px] bg-white px-8 text-[15px] font-bold text-ink transition-all hover:bg-white/90 sm:w-auto">Proje sahibiyim</Link>
                    <Link href="/kayit?rol=emlakci" className="inline-flex h-12 w-full items-center justify-center rounded-[13px] border border-white/25 bg-white/10 px-8 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto">Gayrimenkul danışmanıyım</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="mt-auto border-t border-[var(--cizgi)] bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-5 py-12 sm:px-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Logo size={24} wordmark />
            <p className="max-w-xs text-center text-xs leading-relaxed text-ink-soft md:text-left">Proje sahibi ve gayrimenkul danışmanlarını canlı, doğru veriyle buluşturan kapalı konut stoğu ağı.</p>
          </div>
          <nav aria-label="Yasal" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
            <Link href="/kullanim-kosullari" className="transition-colors hover:text-ink hover:underline">Kullanım Koşulları</Link>
            <Link href="/gizlilik" className="transition-colors hover:text-ink hover:underline">Gizlilik</Link>
            <Link href="/kvkk-aydinlatma" className="transition-colors hover:text-ink hover:underline">KVKK Aydınlatma</Link>
          </nav>
        </div>
        <div className="border-t border-[var(--cizgi)] px-5 py-5 text-center text-[11px] text-[var(--ink-faint)] sm:px-6">© 2026 ProjePazar — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}
