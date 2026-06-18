# 02 — Fiyatlandırma & Pazar Bağlamı

> **Kaynak:** Perplexity (Deep Research), işlenmiş + doğrulanmış.
> **Tarih:** 2026-06-18 · **Durum:** Doğrulandı (portal maliyeti teyit; TAM doğrulanamadı).
> **Bağlayıcı referans:** [Sistem Kuralları Bölüm 3](../ProjePazar-Sistem-Kurallari.md) (gelir modeli — fazlı).
>
> ⚠️ **KAPSAM UYARISI:** Bu araştırma büyük ölçüde **ofis-abonelik kademelerini (SONRAKİ FAZ)** yanıtlıyor. Erken model = **müteahhit anlaşması + emlakçı bedava** (Bölüm 3). Aşağıda **ŞİMDİ** / **SONRAKİ FAZ** ayrıldı. Bizi şimdi ofis-tier kurmaya çekmesin.

---

## Özet (karar verici için)
- TR'de "saf altyapı"ya ödeme alışkanlığı zayıf; rakipler ya freemium (Bitrix24), ya çok ucuz (EmlakCRMx ~₺325/ay), ya çok pahalı (özel CRM ~₺30.000/ay). Orta bölge boş.
- **Portal maliyeti patlaması = en güçlü değer kaldıracı (TEYİTLİ).** Erken modelde emlakçı-bedava benimsemesini ve müteahhit anlaşmasını destekler.
- **Müteahhit anlaşma çapası:** ₺3.500–15.000/ay bandı (ölçeğe göre). **per-developer FLAT**, per-project DEĞİL.
- Ofis tier / emlakçı premium / freemium-dönüşüm verisi = **SONRAKİ FAZ** referansı; şimdi inşa edilmez.

---

## Doğrulama Notları
| İddia | Durum | Not / Kaynak |
|---|---|---|
| Portal yıllık paketi 2020 ₺8K → 2025 ₺200K; 200 ilan ₺85K/ay | ✅ **TEYİT (daha güçlü)** | TEDB: 200 ilan ₺4.500→**₺100.000**; yıllık ~₺200K. Devlet tavan fiyat hazırlığı. Rekabet Kurulu Sahibinden'e 40,1M ceza (2023). |
| 60.000 ofis / 150.000 danışman (TAM) | ⚠️ **Doğrulanamadı** | Resmi kaynakta teyit edilemedi. Pazar büyüklüğü iddiaları sunum öncesi ayrıca teyit. |
| Pazar büyüklüğü ($138B konut / $1,4B proptech / 1,69M satış 2025) | ◷ **Teyit edilmedi (düşük risk)** | Ürün kararını etkilemiyor. |
| 2025 yetki belgesi + Seviye-5 MYB zorunlu; 2026 yıllık harç (7566 sk) | ✅ **TEYİT** | Ofis işletme maliyeti arttı → "gider azaltıyoruz" mesajını güçlendirir. |

---

## ŞİMDİ kullanılabilir (erken model — Bölüm 3)

### Müteahhit anlaşma fiyat çapaları (referans, productized tier DEĞİL)
- **Band:** ₺3.500/ay (tek proje, küçük) → ₺7.500 (3 proje) → ₺15.000+/ay (kurumsal/sınırsız).
- **per-developer FLAT**, per-project değil — proje dönemselliği MRR'yi bozar (B2B SaaS dersi).
- Anlaşma manuel/B2B; sabit tek-tip paket şart değil — bu band **pazarlık çapası** olarak Admin'de kullanılır.

### Değer önerisi kaldıracı (TEYİTLİ — pazarlama)
- **Veri:** 2020 → 2025 ilan portalı maliyeti 200 ilan için ₺4.500 → ₺100.000; yıllık paket ~₺200.000. Devlet tavan fiyat hazırlığında.
- **Emlakçıya:** "Bu projeler için ilan portalına para verme — canlı stok zaten bedava sende." → emlakçı-bedava benimseme kaldıracı.
- **Müteahhide:** "Emlakçı ağı senin stoğunu bedava paylaşır; sen yalnız **canlı kontrol + güvenli dağıtım** için anlaşırsın. Komisyon yok."

---

## SONRAKİ FAZ referansı (ŞİMDİ KURMA — `abonelik_paketi` tablosu hazır)

### Ofis / Franchise abonelik (gelecekte ana gelir)
- Önerilen tier: **Başlangıç ₺1.500 / Pro ₺3.500 / Kurumsal ₺8.500** (per-office flat + ek koltuk ~₺400, Arveya hibrit modeli).
- Yıllık taahhüt: 2 ay ücretsiz (~%16) — piyasa standardı.

### Emlakçı premium (gelecekte)
- Pro ₺199/ay · Plus ₺399/ay. Freemium→paid: **proptech %2,9 (düşük)**; free trial opt-in %18–25 → hibrit öneril.

### Model dersi
- TR SMB için **per-office flat > per-seat** (anlaşılır, kabul gören). Per-project sadece niş.

### Rakip fiyat çapaları (referans)
Arveya ₺1.490/ay · EmlakCRMx ₺325/ay · Emsis ₺899–3.499/yıl · Emlak Asistanım ₺2.150/yıl · Dotcomsoft ₺22.900–36.900/yıl · Bitrix24 (12 kullanıcıya kadar ücretsiz, generik).

---

## Aksiyon
- **ŞİMDİ (B1):** Landing copy → komisyon yok + emlakçı bedava + portal-maliyeti kaldıracı.
- **ŞİMDİ (referans):** Müteahhit anlaşma çapası (₺3.500–15.000) Admin manuel anlaşma notu için elde dursun.
- **SONRAKİ FAZ:** Ofis/emlakçı tier'leri (tablo iskelesi hazır; değer kanıtlanınca).

---

## Kaynaklar
- Portal maliyeti + tavan fiyat (TEDB): https://www.paraanaliz.com/2025/ekonomi/emlak-ilan-sitelerine-fiyat-duzenlemesi-ust-sinir-geliyor-g-115836/ · https://www.memurlar.net/haber/1138402/
- Yetki belgesi 2025 + harç 2026: https://www.temaakademi.com.tr/blog/emlakcilik-belgesi-nasil-alinir/ · https://ttbs.gtb.gov.tr/
- (Perplexity ham fiyat kaynakları 1–43 numaralı atıflar — yerli/global yazılım fiyatları arşivde.)
