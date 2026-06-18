// KVKK aydınlatma metni — lead/müşteri verisi toplama (token'lı paylaşım formu).
// ⚠️ TASLAK: yayın öncesi hukuki inceleme gerekir (veri sorumlusu/işleyen rol-ayrımı,
// VERBİS yükümlülüğü, saklama süreleri, İYS). Bkz. arastirma/05-yasal-kapali-b2b.md (A1/A2).

export const metadata = {
  title: "Aydınlatma Metni — Kişisel Verilerin Korunması",
  robots: { index: false, follow: false },
};

export default function KvkkAydinlatma() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-10 text-sm leading-relaxed text-ink">
      <h1 className="font-display text-2xl font-semibold">Kişisel Verilerin Korunması — Aydınlatma Metni</h1>
      <p className="text-gray">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, bu form
        aracılığıyla paylaştığınız kişisel verilerinizin işlenmesine ilişkin bilgilendirmedir.
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Veri Sorumlusu ve Veri İşleyen</h2>
        <p>
          Bilgilerinizi paylaştığınız bağlantıyı size ileten <b>emlak danışmanı / ofisi</b>, sizinle
          iletişime geçecek taraf olarak <b>veri sorumlusu</b> sıfatıyla hareket eder. ProjePazar
          platformu, yalnızca bu verinin iletilmesi ve saklanmasına yönelik teknik altyapıyı sağlayan
          <b> veri işleyen</b> konumundadır.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">İşlenen Veriler ve Amaç</h2>
        <p>
          <b>Ad-soyad</b> ve <b>telefon numarası</b> bilgileriniz; talebinizin ilgili emlak danışmanına
          iletilmesi ve danışmanın size ürün/proje hakkında bilgi vermek üzere iletişime geçmesi
          amacıyla işlenir.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Hukuki Sebep ve Aktarım</h2>
        <p>
          Verileriniz, vermiş olduğunuz <b>açık rıza</b>ya (KVKK m.5/1) dayanılarak işlenir ve yalnızca
          talebinizi ileten emlak danışmanı/ofisine aktarılır. Üçüncü kişilerle paylaşılmaz.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Saklama Süresi</h2>
        <p>İletişim ve talep takibi amacının gerektirdiği süre boyunca saklanır; sürenin sonunda silinir veya anonimleştirilir.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Haklarınız (KVKK m.11)</h2>
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme,
          işlemeye itiraz etme ve mevzuatta sayılan diğer haklarınızı kullanma hakkına sahipsiniz. Bu
          taleplerinizi sizinle iletişime geçen emlak danışmanına/ofisine iletebilirsiniz.
        </p>
      </section>

      <p className="pt-2 text-xs text-gray">Son güncelleme: 2026-06-18</p>
    </main>
  );
}
