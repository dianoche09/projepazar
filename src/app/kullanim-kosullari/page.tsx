// Kullanım Koşulları — ProjePazar kapalı-devre B2B platformu.
// ⚠️ TASLAK: yayın öncesi hukuki inceleme gerekir.

export const metadata = {
  title: "Kullanım Koşulları — ProjePazar",
  robots: { index: false, follow: false },
};

export default function KullanimKosullari() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-10 text-sm leading-relaxed text-ink">
      <h1 className="font-display text-2xl font-semibold">Kullanım Koşulları</h1>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">1. Hizmetin Niteliği</h2>
        <p>
          ProjePazar; konut müteahhitleri ile yetki belgeli emlak danışmanları/ofisleri arasında çalışan
          <b> kapalı-devre</b> bir stok dağıtım altyapısıdır. İlan portalı, pazaryeri veya emlak aracılık
          hizmeti DEĞİLDİR; son kullanıcıya açık ilan yayınlamaz.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">2. Komisyon ve Sözleşme</h2>
        <p>
          Platform, satış komisyonuna taraf değildir ve satış sözleşmesine taraf olmaz. Satış işlemi
          müteahhit (veya yetkili satıcı) ile alıcı arasında gerçekleşir; platform yalnızca bilgi/dağıtım
          altyapısı sağlar.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">3. Paylaşım Kuralları</h2>
        <p>
          Emlak danışmanı, yalnızca kendisine tahsis edilmiş projeleri görüntüler ve <b>yalnızca kendi
          müşterisiyle birebir</b> (ör. WhatsApp) paylaşır. Paylaşım bağlantıları sosyal medyada veya
          kamuya açık biçimde <b>yayınlanamaz</b>; aksi hâlde yetkisiz ilan sayılabilir ve ilgili mevzuat
          yaptırımlarına tabi olunabilir.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">4. İçerik ve Fiyat</h2>
        <p>
          Danışman, yalnızca müteahhit tarafından onaylanmış proje içeriğini ve güncel fiyatı paylaşır;
          içeriği değiştiremez. Fiyatlar Türk Lirası (TL) üzerinden gösterilir.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">5. Yetki Belgesi</h2>
        <p>
          Emlak danışmanı/ofisi, taşınmaz ticareti faaliyeti için mevzuatın öngördüğü Taşınmaz Ticareti
          Yetki Belgesi ve mesleki yeterliliklere sahip olmakla yükümlüdür.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">6. Sorumluluk</h2>
        <p>
          Stok, fiyat ve durum bilgisinin doğruluğu ilgili müteahhidin sorumluluğundadır. Platform,
          içeriğin doğruluğundan veya taraflar arasındaki işlemlerden sorumlu tutulamaz. Koşullar önceden
          bildirilerek güncellenebilir.
        </p>
      </section>

      <p className="pt-2 text-xs text-gray">Son güncelleme: 2026-06-18</p>
    </main>
  );
}
