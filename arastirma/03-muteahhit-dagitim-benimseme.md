# 03 — Müteahhit Stok Dağıtım Gerçeği & Yazılım Benimseme

> **Kaynak:** Perplexity (Deep Research), işlenmiş + doğrulanmış (ham çıktı encoding bozuktu, temizlendi).
> **Tarih:** 2026-06-18 · **Durum:** Doğrulandı (EİDS off-plan muafiyeti + sosyal medya yasağı teyitli).
> **Bağlayıcı referans:** [Sistem Kuralları](../ProjePazar-Sistem-Kurallari.md) Bölüm 0 (ürün özü), 5 (kaçınılmazlık), 9 (iki-mod / SIMPLE).

---

## Özet
- Müteahhit konut stoğunu danışmanlara bugün **Excel + PDF + WhatsApp grubu** ile dağıtıyor → versiyon kirliliği, çift satış, "kimin sattığı belirsiz", stok görünmezliği = 4 kök acı.
- **Ödeme tetikleyicileri somut:** çift satış (hukuki+mali zarar), büyük proje lansmanı, EİDS + sosyal medya yasağının gayri resmi kanalları kapatması.
- **Rakip boşluk gerçek:** TR'de müteahhit-odaklı, kapalı-devre, ilan-portalı-olmayan B2B stok dağıtımı yok (Fizbot/RE-OS = danışman CRM; müteahhit tahsisini çözmüyor).
- **Benimseme bariyeri yüksek ama aşılır:** KOBİ müteahhitte ERP ~%25; çözüm = **concierge onboarding** ("sisteme biz girelim") + tek-proje ücretsiz pilot + önce danışman ağını büyütmek.

---

## Doğrulama Notları
| İddia | Durum | Not |
|---|---|---|
| EİDS "1 Oca 2025 tamamen zorunlu" | ⚠️ **Kısmen yanlış** | Satılık **konut** 1 Şub 2026; 1 Oca 2025 yalnız kiralık. Ama rapor doğru sonuca varıyor (EİDS bizi bağlamaz). |
| Kat irtifakı yok = EİDS kapsam DIŞI | ✅ **DOĞRULANDI** | Off-plan yeni konut muaf ("tapusu yok" kategorisi). Bizim çekirdek için kilit avantaj. |
| Sosyal medya emlak yasağı (26 Ara 2024, 1.426 hesap, 158K ceza) | ✅ **DOĞRULANDI** | Gayri resmi kanal kapanıyor = rüzgar. Link sosyal medyaya açılırsa risk. |
| İnşaat ~61B€, 127K firma, ERP %25,1, 453K müteahhit | ◷ **Bağlam (teyit edilmedi)** | Düşük ürün-riski; sunum öncesi ayrıca teyit. |

---

## Bulgular

### Mevcut dağıtım araçları
| Araç | Sorun |
|---|---|
| Excel / PDF | "Hangi dosya doğru?" versiyon çakışması |
| WhatsApp grubu | Kronolojik akış; eski mesaj/yeni mesaj karışıklığı |
| Kendi satış ofisi | Dış danışman ağına erişim dar |
| Kurumsal franchise anlaşması | Proje bazlı ayrı anlaşma; stok senkron yok |
| İlan portalları | EİDS/ilan kirliliği (zaten bizim alanımız değil) |

### Ödeme tetikleyicileri (yüksek→orta)
Çift satış acısı (yüksek) · çok-kanal karmaşası (yüksek) · bayat fiyat şikâyeti (yüksek) · büyük proje lansmanı (yüksek) · EİDS/sosyal medya baskısı (orta-yüksek) · rakip kullanımı (değişken) · finansman/hızlı nakit (orta).

### Hedef segment
Orta ölçekli (100–499 birim) ve büyük (500+) müteahhit = en güçlü uyum. Küçük (10–99) = concierge ile orta. Tek-proje müteahhit = düşük LTV (churn).

---

## ProjePazar'a Etki → Aksiyon
- **Validasyon (kod yok):** opsiyon kilidi, canlı tek-kaynak fiyat, tahsis, kokpit "kim opsiyonladı" — hepsi belgelenen 4 acıyı doğrudan karşılıyor. Konsept doğrulandı.
- **GTM/Onboarding:** Ü2 **concierge** ("Excel'ini al, biz girelim") + tek-proje ücretsiz pilot → Sistem Kuralları Bölüm 9 (SIMPLE/concierge) ile birebir. `tasks` memory'ye GTM hipotezi.
- **Politika (B1 ile birlikte):** Landing/onboarding mesajı: "gayri resmi WhatsApp/sosyal medya kapanıyor — doğrulanmış kapalı ağ." Sosyal medya yasağı = pazarlama kaldıracı.
- **Açık iş (doğrulanmalı):** KOBİ müteahhidin "stok yönetimine" aylık ödeyeceği bant → **birincil araştırma** (müteahhit görüşmeleri) gerekiyor; ikincil veri yok.

---

## Kaynaklar
- KPMG İnşaat/Gayrimenkul raporu: https://kpmg.com/tr/tr/home/insights/2024/12/insaat-ve-gayrimenkil-sektoral-bakis-raporu.html
- TMB İnşaatta Dijital Dönüşüm Sonuç Raporu (May 2025): https://v2.tmb.org.tr/uploads/publications/68f87f4d4171c42cf398ed08/1761115964699-idd-sonuc-raporu-ekim-2025.pdf
- Sosyal medya yasağı: https://www.aa.com.tr/tr/ekonomi/ticaret-bakanligi-sosyal-medyadaki-tasinmaz-ve-tasit-ilanlariyla-ilgili-uyarida-bulundu/3434553
- EİDS off-plan muafiyeti: https://www.aa.com.tr/tr/ekonomi/10-soruda-emlak-sektorunde-uygulanan-elektronik-ilan-dogrulama-sisteminin-ayrintilari/3373964
