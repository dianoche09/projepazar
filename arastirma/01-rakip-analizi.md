# 01 — Rakip Analizi & Konumlandırma

> **Kaynak:** Perplexity (Deep Research) çıktısı, işlenmiş + doğrulanmış.
> **Tarih:** 2026-06-18 · **Durum:** Doğrulandı (EİDS tarihi düzeltildi).
> **Bağlayıcı referans:** [ProjePazar-Sistem-Kurallari.md](../ProjePazar-Sistem-Kurallari.md) — Bölüm 0 (ürün özü), 5 (kaçınılmazlık), 10 (kapsam disiplini).
> **Not:** Bu dosya gerekçe/kaynak arşividir. Repoda yapılacak somut değişiklikler en altta "ProjePazar'a Etkisi → Aksiyon".

---

## Özet (karar verici için)

- Türkiye'de **"üretici-kontrollü + granüler ofis/danışman tahsisi + canlı tek-doğru stok havuzu"** üçlüsünü birlikte sunan yerel B2B SaaS **yok**. Boşluk gerçek.
- **En yakın rakip: Topli.io** (Kasım 2025 İstanbul'a girdi) — ama **komisyon modeli** (satış başına pay). Bizim wedge: **komisyona dokunmama** + **emlakçıya bedava erişim**. Erken gelir = müteahhitle birebir **anlaşma** (abonelik/ofis kademesi sonraki faz).
- **Kavramsal ikiz: Relata (Hindistan)** — geliştirici-kontrollü canlı envanter + broker ağı. Türkiye'de **yok**. Biz "Türkiye'ye özel Relata" konumuna oynayabiliriz.
- İlan portalları (Sahibinden, Hepsiemlak, Zingat, Emlakjet) **farklı katman** — müteahhide stok sahipliği vermez. Hepsiemlak yönetimi birinci-el açığını **kendi kabul ediyor**.
- **Düzenleyici (DÜZELTİLMİŞ + KAPSAM):** EİDS yetki doğrulaması satılık konutta **1 Şub 2026**'da yürürlüğe girdi (Perplexity "1 Oca 2025" demişti — yanlış; o tarih yalnız kiralık). **ANCAK** EİDS **ilan platformlarını** bağlar; ProjePazar **kapalı-devre B2B**'dir (son kullanıcıya açık ilan YOK; emlakçı tahsisli birimi auth arkasında görür, WhatsApp deep-link ile birebir paylaşır) → EİDS bizi **doğrudan bağlamaz**. Tek gri alan: public proje microsite (`public_slug`) hukuken "ilan" sayılır mı → **Prompt 3 (yasal)** netleştirecek, blocker değil.

---

## Doğrulama Notları

| İddia | Durum | Düzeltme / Kaynak |
|---|---|---|
| EİDS satılıkta 1 Oca 2025'te zorunlu oldu, ilanları %26 azalttı | ❌ **Yanlış (satılık için)** | Satılık **konut** zorunluluğu **1 Şub 2026**. 1 Oca 2025 yalnız **kiralık**. Kaynak: Ticaret Bakanlığı. |
| Topli'nin Türkiye'de granüler tahsis özelliği var | ⚠️ **Doğrulanamadı** | Kamuya açık ürün detayı yok. Komisyon modeli teyitli; tahsis mekaniği belirsiz. |
| Yapısoft SalesOffice dış/bağımsız ofis modülü | ⚠️ **Doğrulanamadı** | Müteahhit-içi CRM olduğu teyitli; dış kanal dağıtımı net değil. |
| Relata Türkiye'ye giriş planı | ⚠️ **Doğrulanamadı** | Hindistan'da aktif; TR pazar girişi bilgisi yok. |
| Pazar büyüklüğü rakamları (1,478M satış / 484K birinci el / 400 proptech şirketi / $120M VC) | ◷ **Teyit edilmedi (düşük risk)** | Ürün kararını etkilemiyor; pazarlama/sunum öncesi ayrıca teyit edilmeli. |

---

## Rakip Karşılaştırma Tablosu

| Oyuncu | Kategori | Ana Müşteri | Gelir Modeli | Müteahhit stok kontrolü | Canlı fiyat/durum | Danışman tahsisi | Çakışma |
|---|---|---|---|---|---|---|---|
| Sahibinden | İlan portalı | Bireysel+kurumsal | İlan/paket | ❌ | ❌ | ❌ | Düşük |
| Hepsiemlak | İlan portalı | Emlak ofisi | Yıllık paket | ❌ | ❌ | ❌ | Düşük (birinci-el açığını kabul ediyor) |
| Zingat | İlan portalı | Ofis/bireysel | İlan/paket | ❌ | ❌ | ❌ | Düşük |
| Emlakjet | İlan portalı | Bireysel+kurumsal | Paket/abonelik | ❌ | ❌ | ❌ | Düşük |
| **Topli.io** | B2B2C pazarlama | Geliştirici+danışman | **Komisyon/satış** | ⚠️ kısmi | ⚠️ belirsiz | ⚠️ belirsiz | **Yüksek — en yakın** |
| Yapısoft (SalesOffice) | Müteahhit CRM | Konut üreticisi | Proje başı SaaS | ✅ (içeride) | ✅ (içeride) | ❌ dış kanal yok | Orta |
| REIDIN | Veri/analitik | Kurumsal yatırımcı | Kurumsal abonelik | ❌ | ❌ | ❌ | Yok (entegre edilebilir) |
| Endeksa | AVM/analitik | Bireysel+danışman | Freemium/API | ❌ | ❌ | ❌ | Yok (fiyat referansı olarak entegre) |
| **Relata (Hindistan)** | Developer proptech | Geliştirici+broker | Kurumsal SaaS | ✅ | ✅ | ✅ | **Çok yüksek — ama TR'de yok** |
| RE-OS (MLS) | Emlakçı CRM/MLS | Ofis/danışman | Abonelik | ❌ (yatay ağ) | ❌ | ❌ | Düşük |
| Tapu.com | Online marketplace | Banka/şirket envanteri | İşlem komisyonu | ❌ | ❌ | ❌ | Yok |
| Akıllı Satış Ofisi | Müteahhit CRM | Konut üreticisi | SaaS | ✅ (içeride) | ⚠️ kısmi | ❌ dış kanal yok | Orta |
| BrokersApp/CRMx/Emsis | Emlakçı CRM | Emlak ofisi | Aylık abonelik (3K–30K TL) | ❌ | ❌ | ❌ | Düşük (veri kaynağı katmanı) |
| **ProjePazar** | **B2B stok altyapısı** | **Müteahhit (erken) → Ofis (sonra)** | **Müteahhit anlaşma; emlakçı bedava** | **✅ üretici kontrolü** | **✅ canlı/tek kaynak** | **✅ granüler tahsis** | — |

---

## Boşluk & Moat (Sistem Kuralları Bölüm 0/5 ile hizalı)

1. **Ürün moatı** — canlı tek-doğru kaynak + granüler tahsis + üretici kontrolü birlikte piyasada yok. (Teknik Değişmez #1/#2/#3 ile birebir.)
2. **Ağ etkisi** — her ofis müteahhide daha geniş dağıtım, her müteahhit ofise daha zengin havuz. (Kaçınılmazlık #1/#4.)
3. **Veri yerçekimi** — anlık stok-fiyat hareketi, REIDIN/Endeksa'nın erişemeyeceği birincil veri. (Kaçınılmazlık #3, events Faz-1'den.)
4. **Zero rent-seeking** — Topli komisyonla her satışta maliyet bindirir; biz komisyona dokunmayız. Erken model: müteahhitle anlaşma, emlakçı bedava. (Gelir modeli Bölüm 3 — fazlı kademe güncellendi; "komisyona dokunmaz" değişmez.)
5. **Düzenleyici uyum** — EİDS yürürlükte; "doğrulanmış kanal" altyapısı talebi artıyor. (Güven protokolü Bölüm 6.)

---

## ProjePazar'a Etkisi → Aksiyon Listesi

> Kapsam testi (Bölüm 10): her madde "canlı stok + üretici-kontrolü + güven + dağıtımı güçlendiriyor mu?" filtresinden geçti.

### A. Compliance — EİDS / yetki belgesi (canlı mevzuat) — **ONAY GEREKİR**
- **A1 (MVP, şema):** `ofis` (ve gerekirse profiles/uretici) tablosuna `yetki_belge_no text` + `yetki_dogrulandi boolean` ekle. → emlakçı/ofis doğrulamasını Admin Bölüm 2.3 güven rozetine bağlar.
- **A2 (MVP, doğrulama akışı):** Admin doğrulama kuyruğunda emlakçı/ofis için yetki belgesi teyidi adımı.
- **A3 (yasal — Prompt 3'e bağlı, ŞİMDİ KARAR YOK):** `proje.public_slug` public microsite "ilan" sayılır mı → EİDS/QR yükümlülüğü? Yasal araştırma netleştirecek. **Risk işaretlendi.**

### B. Konumlandırma / copy — **düşük risk, uygulanabilir**
- **B1 (MVP, UI):** Landing/public sayfada net konum: *"İlan portalı değiliz — müteahhitin canlı stok kontrol merkezi ve güvenilir dağıtım altyapısıyız."* Sahibinden/Hepsiemlak'tan ayrışma. Dosya: `src/app/page.tsx`.
- **B2 (MVP, UI):** Topli karşıtı mesaj: **"komisyona dokunmuyoruz"** + emlakçıya **bedava erişim** vurgusu (benimseme kaldıracı). "Abonelik" dilini kullanma — erken model müteahhit anlaşması.

### C. Strateji / doküman — **kod yok**
- **C1:** Sistem Kuralları Bölüm 0 "Ne DEĞİLİZ" listesine Topli (komisyon) ve Relata (TR'de yok) ayrımını ekle — opsiyonel netleştirme.
- **C2 (GTM):** Kayseri bölgesel pilot hipotezi → `tasks` memory'ye. İstanbul kalabalığından önce referans müteahhit.
- **C3:** Entegrasyon fırsatları: REIDIN/Endeksa fiyat referansı (Faz 2), Yapısoft tamamlayıcı CRM partner (Faz 2).

---

## Kaynaklar
- Ticaret Bakanlığı — EİDS yetki doğrulama: https://ticaret.gov.tr/kurumsal-haberler/elektronik-ilan-dogrulama-sistemi-eids-yetki-dogrulama-uygulamasi-hayata-gecirildi
- EİDS 1 Şubat 2026 satılık konut zorunluluğu: https://www.emlakhaberi.com/elektronik-ilan-dogrulama-sistemi-1-subat-2026dan-itibaren-zorunlu-oluyor
- Hepsiemlak — EİDS rehberi: https://www.hepsiemlak.com/emlak-yasam/genel/elektronik-ilan-dogrulama-sistemi
- (Perplexity ham çıktısındaki diğer pazar/rakip kaynakları: 1–57 numaralı atıflar — pazar rakamları ürün kararı öncesi ayrıca teyit edilecek.)
