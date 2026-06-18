// Gizlilik Politikası — ProjePazar.
// ⚠️ TASLAK: yayın öncesi hukuki inceleme gerekir (KVKK rol-ayrımı, saklama süreleri, VERBİS).

export const metadata = {
  title: "Gizlilik Politikası — ProjePazar",
  robots: { index: false, follow: false },
};

export default function Gizlilik() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-10 text-sm leading-relaxed text-ink">
      <h1 className="font-display text-2xl font-semibold">Gizlilik Politikası</h1>
      <p className="text-gray">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında kişisel verilerin işlenmesine
        ilişkin bilgilendirmedir.
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Veri Sorumlusu / Veri İşleyen</h2>
        <p>
          Müşteri adayı (lead) verisinde, bilgiyi toplayan emlak danışmanı/ofisi <b>veri sorumlusu</b>;
          ProjePazar yalnızca teknik altyapı sağlayan <b>veri işleyen</b> konumundadır. Hesap
          (müteahhit/danışman) verilerinde ise platform veri sorumlusudur.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">İşlenen Veriler</h2>
        <p>
          Hesap bilgileri (ad, telefon, e-posta, rol, ofis); müşteri adayı bilgileri (ad-soyad, telefon —
          danışman tarafından paylaşım sayfasındaki form aracılığıyla toplanır).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Amaç ve Hukuki Sebep</h2>
        <p>
          Veriler; hizmetin sunulması, stok dağıtımı ve talep iletişimi amacıyla, sözleşmenin ifası ve/veya
          açık rıza hukuki sebeplerine dayanılarak işlenir. Müşteri adayı verisi yalnızca ilgili danışmana
          iletilir; üçüncü kişilerle paylaşılmaz.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Saklama ve Güvenlik</h2>
        <p>
          Veriler, amacın gerektirdiği süre boyunca saklanır. Erişim, tahsis esasına göre (satır seviyesi
          güvenlik / RLS) kısıtlanır. Çerezler yalnızca oturum yönetimi için kullanılır.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Haklarınız (KVKK m.11)</h2>
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme,
          işlemeye itiraz etme ve mevzuatta sayılan diğer haklarınızı kullanma hakkına sahipsiniz.
        </p>
      </section>

      <p className="pt-2 text-xs text-gray">Son güncelleme: 2026-06-18</p>
    </main>
  );
}
